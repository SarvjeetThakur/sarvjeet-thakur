/**
 * Presence server: live cursors, in memory, no accounts.
 *
 * One room for the whole site. Everything a peer sends is relayed to the
 * others and forgotten when they disconnect, so there is nothing to persist
 * and nothing to clean up.
 *
 *   node server/presence.mjs        # or: pnpm dev:ws
 */
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PRESENCE_PORT ?? 3001);
/** Drop a peer that has not sent anything for this long. */
const IDLE_TIMEOUT_MS = 45_000;
const HEARTBEAT_MS = 15_000;

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

/** @type {Map<import("ws").WebSocket, {id: string, name: string, colour: string, cursor: unknown, mode: string, seenAt: number}>} */
const peers = new Map();

const send = (socket, message) => {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
};

const broadcast = (message, except) => {
  for (const socket of peers.keys()) if (socket !== except) send(socket, message);
};

const publicPeer = (peer) => ({
  id: peer.id,
  name: peer.name,
  colour: peer.colour,
  cursor: peer.cursor,
  mode: peer.mode,
});

wss.on("connection", (socket) => {
  const peer = {
    id: Math.random().toString(36).slice(2, 10),
    name: "Guest",
    colour: "#7c6cff",
    cursor: null,
    mode: "static",
    seenAt: Date.now(),
  };
  peers.set(socket, peer);

  // Tell the newcomer who it is and who is already here.
  send(socket, {
    type: "welcome",
    you: peer.id,
    peers: [...peers.values()].filter((p) => p !== peer).map(publicPeer),
  });

  socket.on("message", (raw) => {
    peer.seenAt = Date.now();
    let message;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return; // ignore anything that is not JSON
    }

    switch (message.type) {
      case "identify": {
        if (typeof message.name === "string") peer.name = message.name.slice(0, 24) || "Guest";
        if (typeof message.colour === "string") peer.colour = message.colour.slice(0, 32);
        broadcast({ type: "peer", peer: publicPeer(peer) }, socket);
        break;
      }
      case "cursor": {
        // Document coordinates, so they map to any screen size or zoom.
        peer.cursor =
          message.cursor && typeof message.cursor.x === "number"
            ? { x: message.cursor.x, y: message.cursor.y }
            : null;
        broadcast({ type: "cursor", id: peer.id, cursor: peer.cursor }, socket);
        break;
      }
      case "mode": {
        peer.mode = message.mode === "physics" ? "physics" : "static";
        broadcast({ type: "peer", peer: publicPeer(peer) }, socket);
        break;
      }
      case "ping":
        break;
      default:
        break;
    }
  });

  const drop = () => {
    if (!peers.has(socket)) return;
    peers.delete(socket);
    broadcast({ type: "left", id: peer.id });
  };
  socket.on("close", drop);
  socket.on("error", drop);
});

// Evict peers whose connection died without a close frame.
setInterval(() => {
  const now = Date.now();
  for (const [socket, peer] of peers) {
    if (now - peer.seenAt > IDLE_TIMEOUT_MS) socket.terminate();
  }
}, HEARTBEAT_MS).unref();

console.log(`presence server listening on ws://0.0.0.0:${PORT}`);
