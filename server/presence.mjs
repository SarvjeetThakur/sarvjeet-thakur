/**
 * Presence server: live cursors, one room, in memory, no accounts.
 *
 *   node server/presence.mjs        # or: pnpm dev:ws
 *
 * Everything arriving on a socket is relayed to every other viewer, so each
 * field is validated against a fixed shape, never merely length-capped.
 */
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

/** Shared with the client, so both agree on one value. */
const PORT = Number(process.env.NEXT_PUBLIC_PRESENCE_PORT ?? 3001);
const HEARTBEAT_MS = 15_000;
const MAX_COORDINATE = 1e7;
const MAX_NAME_LENGTH = 24;
const MAX_PEERS = 64;
/** Stop writing to a peer that is not draining. */
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
  // ws would otherwise accept up to 100 MB.
  maxPayload: 4096,
  /*
   * Bound to 0.0.0.0 so a phone on the LAN can join. A WebSocket handshake is
   * not subject to CORS, so without this any page in the developer's browser
   * could connect and inject cursors.
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
 * `typeof x === "number"` is not enough: JSON admits `1e999`, which parses to
 * Infinity and reaches every viewer as an unusable transform.
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

  // Protocol-level: browsers throttle timers in background tabs to about
  // once a minute, so an app-level ping would evict backgrounded readers.
  alive.add(socket);
  socket.on("pong", () => alive.add(socket));

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
          // \p{C} is control and format characters, which includes the bidi
          // overrides one peer could use to spoof another's displayed name.
          peer.name =
            message.name.normalize("NFC").replace(/\p{C}/gu, "").trim().slice(0, MAX_NAME_LENGTH) ||
            "Guest";
        }
        // Written straight into `style` on every other viewer.
        if (typeof message.colour === "string" && HEX_COLOUR.test(message.colour)) {
          peer.colour = message.colour;
        }
        broadcast({ type: "peer", peer: publicPeer(peer) }, socket);
        break;
      }
      case "cursor": {
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

/* Without this a port clash is an unhandled 'error' event and kills the process. */
wss.on("error", (/** @type {NodeJS.ErrnoException} */ error) => {
  if (error.code === "EADDRINUSE" || error.code === "EACCES") {
    console.error(`presence: cannot bind port ${PORT} (${error.code})`);
    process.exit(1);
  }
  // Anything else — an accept failure such as EMFILE — is load, not a reason
  // to take presence down for everyone.
  console.error("presence: server error", error);
});

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
