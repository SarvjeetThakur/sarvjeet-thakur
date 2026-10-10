/**
 * Presence server: live cursors, in memory, no accounts.
 *
 * One room for the whole site. Everything a peer sends is relayed to the
 * others and forgotten when they disconnect, so there is nothing to persist
 * and nothing to clean up.
 *
 *   node server/presence.mjs        # or: pnpm dev:ws
 *
 * Everything arriving on a socket is untrusted and is relayed to every other
 * viewer, so each field is validated against a fixed shape before it is
 * stored — never merely length-capped.
 */
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

/** Shared with the client as NEXT_PUBLIC_PRESENCE_PORT so both agree on one value. */
const PORT = Number(process.env.NEXT_PUBLIC_PRESENCE_PORT ?? 3001);
/** Terminate a socket that has not answered a protocol ping by the next sweep. */
const HEARTBEAT_MS = 15_000;
/** A cursor outside this range is a bug or an attack, not a document position. */
const MAX_COORDINATE = 1e7;
const MAX_NAME_LENGTH = 24;
/** One room, one machine: a cap so a loop cannot exhaust the process. */
const MAX_PEERS = 64;
/** Stop writing to a peer that is not draining; cursor frames keep arriving. */
const MAX_BUFFERED_BYTES = 256 * 1024;
const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

/** @param {string | undefined} value @returns {boolean} */
const isLocalOrigin = (value) => {
  if (!value) return true; // non-browser client, e.g. `node` or a test
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

const wss = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
  // Cursor frames are tiny; ws would otherwise accept up to 100 MB.
  maxPayload: 4096,
  /*
   * The socket is bound to 0.0.0.0 so a phone on the LAN can join, and a
   * WebSocket handshake is not subject to CORS — without this check, any page
   * open in the developer's browser could connect and inject cursors.
   */
  verifyClient: (/** @type {{ origin?: string }} */ { origin }) => isLocalOrigin(origin),
});

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ id: string, name: string, colour: string, cursor: Point | null, mode: string }} Peer */

/** @type {Map<import("ws").WebSocket, Peer>} */
const peers = new Map();
/** @type {Set<import("ws").WebSocket>} Sockets that answered a protocol ping since the last sweep. */
const alive = new Set();

/** @param {import("ws").WebSocket} socket @param {unknown} message */
const send = (socket, message) => {
  if (socket.readyState !== socket.OPEN) return;
  if (socket.bufferedAmount > MAX_BUFFERED_BYTES) return;
  socket.send(JSON.stringify(message));
};

/** @param {unknown} message @param {import("ws").WebSocket} [except] */
const broadcast = (message, except) => {
  for (const socket of peers.keys()) if (socket !== except) send(socket, message);
};

/** @param {Peer} peer */
const publicPeer = (peer) => ({
  id: peer.id,
  name: peer.name,
  colour: peer.colour,
  cursor: peer.cursor,
  mode: peer.mode,
});

/**
 * Finite and inside the document's plausible range, or the cursor is dropped.
 * `typeof x === "number"` is not enough: JSON admits `1e999`, which parses to
 * Infinity and reaches every other viewer as an unusable transform.
 * @param {unknown} value @returns {value is number}
 */
const isCoordinate = (value) =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= MAX_COORDINATE;

/** @param {unknown} value @returns {Point | null} */
function readCursor(value) {
  if (!value || typeof value !== "object") return null;
  const { x, y } = /** @type {Record<string, unknown>} */ (value);
  if (!isCoordinate(x) || !isCoordinate(y)) return null;
  return { x, y };
}

wss.on("connection", (socket, request) => {
  if (peers.size >= MAX_PEERS) {
    socket.close(1013, "room full");
    return;
  }
  if (!isLocalOrigin(request.headers.origin)) {
    socket.close(1008, "origin not allowed");
    return;
  }

  /** @type {Peer} */
  const peer = {
    id: randomUUID(),
    name: "Guest",
    colour: "#7c6cff",
    cursor: null,
    mode: "static",
  };
  peers.set(socket, peer);

  // Protocol-level liveness. An app-level ping cannot be used: browsers
  // throttle timers in background tabs to about once a minute, so a
  // backgrounded reader would be evicted and reconnect in a loop. The browser
  // answers a protocol ping from inside its WebSocket stack regardless.
  alive.add(socket);
  socket.on("pong", () => alive.add(socket));

  // Tell the newcomer who it is and who is already here.
  send(socket, {
    type: "welcome",
    you: peer.id,
    peers: [...peers.values()].filter((p) => p !== peer).map(publicPeer),
  });

  socket.on("message", (raw) => {
    alive.add(socket);
    let message;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return; // ignore anything that is not JSON
    }
    if (!message || typeof message !== "object") return;

    switch (message.type) {
      case "identify": {
        if (typeof message.name === "string") {
          peer.name = message.name.slice(0, MAX_NAME_LENGTH).trim() || "Guest";
        }
        // The colour is written straight into `style` on every other viewer,
        // so only a plain hex value is relayed.
        if (typeof message.colour === "string" && HEX_COLOUR.test(message.colour)) {
          peer.colour = message.colour;
        }
        broadcast({ type: "peer", peer: publicPeer(peer) }, socket);
        break;
      }
      case "cursor": {
        // Document coordinates, so they map to any screen size or zoom.
        peer.cursor = readCursor(message.cursor);
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
    alive.delete(socket);
    if (!peers.has(socket)) return;
    peers.delete(socket);
    broadcast({ type: "left", id: peer.id });
  };
  socket.on("close", drop);
  socket.on("error", drop);
});

/*
 * Without this, a port clash is an unhandled 'error' event, which throws and
 * kills the process — under `pnpm dev` that buries a Node stack trace in the
 * middle of the Next output. The site works fine without presence, so say so
 * and leave.
 */
wss.on("error", (/** @type {NodeJS.ErrnoException} */ error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`presence: port ${PORT} is already in use; continuing without presence`);
  } else {
    console.error("presence: server error", error);
  }
  process.exit(0);
});

// Evict sockets whose connection died without a close frame.
const sweep = setInterval(() => {
  for (const socket of peers.keys()) {
    if (!alive.has(socket)) {
      socket.terminate();
      continue;
    }
    alive.delete(socket);
    socket.ping();
  }
}, HEARTBEAT_MS);
sweep.unref();

const shutdown = () => {
  clearInterval(sweep);
  wss.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

wss.on("listening", () => {
  console.log(`presence server listening on ws://0.0.0.0:${PORT}`);
});
