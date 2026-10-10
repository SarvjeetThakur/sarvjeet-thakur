"use client";

import { useSyncExternalStore } from "react";
import {
  CURSOR_SEND_MS,
  MAX_NAME_LENGTH,
  NAME_STORAGE_KEY,
  PEER_COLOURS,
  PING_MS,
  PRESENCE_PORT,
  PRESENCE_URL,
  RECONNECT_MAX_MS,
  RECONNECT_MIN_MS,
  randomName,
} from "../constants";
import type {
  ClientMessage,
  Peer,
  PeerMode,
  Point,
  PresenceState,
  ServerMessage,
  WirePeer,
} from "../types";
import { screenToShared } from "./coords";

const EMPTY: PresenceState = {
  connected: false,
  selfId: null,
  name: "",
  colour: PEER_COLOURS[0],
  peers: [],
};

const listeners = new Set<() => void>();
let state: PresenceState = EMPTY;
/**
 * Live cursor positions, deliberately outside React. Each peer sends about
 * twenty a second; routing those through the store would re-render every
 * consumer at network rate, in the middle of the physics and WebGL loops.
 * The draw loop reads this map directly.
 */
const cursors = new Map<string, Point>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let pingTimer: ReturnType<typeof setInterval> | undefined;
let reconnectDelay = RECONNECT_MIN_MS;
let lastCursorAt = 0;
let mode: PeerMode = "static";
let started = false;

function setState(next: Partial<PresenceState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

export function getPeerCursor(id: string): Point | undefined {
  return cursors.get(id);
}

function send(message: ClientMessage) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function readName() {
  try {
    const stored = localStorage.getItem(NAME_STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // storage blocked: fall through to a generated name
  }
  return randomName();
}

/**
 * Null means there is nowhere to connect, so presence stays off entirely.
 * In development the server runs beside the page, so the host is reused and
 * no configuration is needed.
 */
function presenceUrl(): string | null {
  if (PRESENCE_URL) return PRESENCE_URL;
  if (process.env.NODE_ENV === "development") {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.hostname}:${PRESENCE_PORT}`;
  }
  return null;
}

/* ---------- validation ----------
 * Everything below arrives from the socket. A frame of the wrong shape used to
 * reach the store and then throw during render, and the only error boundary on
 * the page wraps the starfield — so one bad frame unmounted the site.
 */

const isPoint = (value: unknown): value is Point => {
  if (!value || typeof value !== "object") return false;
  const { x, y } = value as Record<string, unknown>;
  return typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y);
};

const isCursor = (value: unknown): value is Point | null => value === null || isPoint(value);

function readWirePeer(value: unknown): WirePeer | null {
  if (!value || typeof value !== "object") return null;
  const { id, name, colour, cursor, mode: peerMode } = value as Record<string, unknown>;
  if (typeof id !== "string" || typeof name !== "string" || typeof colour !== "string") return null;
  if (!isCursor(cursor)) return null;
  return {
    id,
    name,
    colour,
    cursor,
    mode: peerMode === "physics" ? "physics" : "static",
  };
}

function parseServerMessage(raw: unknown): ServerMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const message = raw as Record<string, unknown>;
  switch (message.type) {
    case "welcome": {
      if (typeof message.you !== "string" || !Array.isArray(message.peers)) return null;
      const peers = message.peers
        .map(readWirePeer)
        .filter((peer): peer is WirePeer => peer !== null);
      return { type: "welcome", you: message.you, peers };
    }
    case "peer": {
      const peer = readWirePeer(message.peer);
      return peer && { type: "peer", peer };
    }
    case "cursor": {
      if (typeof message.id !== "string" || !isCursor(message.cursor)) return null;
      return { type: "cursor", id: message.id, cursor: message.cursor };
    }
    case "left":
      return typeof message.id === "string" ? { type: "left", id: message.id } : null;
    default:
      return null;
  }
}

/* ---------- handling ---------- */

const toPeer = (peer: WirePeer): Peer => ({
  id: peer.id,
  name: peer.name,
  colour: peer.colour,
  mode: peer.mode,
  hasCursor: peer.cursor !== null,
});

function writeCursor(id: string, cursor: Point | null) {
  if (cursor) cursors.set(id, cursor);
  else cursors.delete(id);
}

function handle(message: ServerMessage) {
  switch (message.type) {
    case "welcome":
      cursors.clear();
      for (const peer of message.peers) writeCursor(peer.id, peer.cursor);
      setState({ selfId: message.you, peers: message.peers.map(toPeer) });
      send({ type: "identify", name: state.name, colour: state.colour });
      send({ type: "mode", mode });
      break;
    case "peer": {
      writeCursor(message.peer.id, message.peer.cursor);
      const rest = state.peers.filter((p) => p.id !== message.peer.id);
      setState({ peers: [...rest, toPeer(message.peer)] });
      break;
    }
    case "cursor": {
      writeCursor(message.id, message.cursor);
      // Only the null/not-null flip is worth a render; the position is not.
      const had = state.peers.find((p) => p.id === message.id)?.hasCursor;
      const has = message.cursor !== null;
      if (had !== undefined && had !== has) {
        setState({
          peers: state.peers.map((p) => (p.id === message.id ? { ...p, hasCursor: has } : p)),
        });
      }
      break;
    }
    case "left":
      cursors.delete(message.id);
      setState({ peers: state.peers.filter((p) => p.id !== message.id) });
      break;
  }
}

function connect() {
  const url = presenceUrl();
  if (!url) return;
  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    scheduleReconnect();
    return;
  }
  socket = ws;

  ws.onopen = () => {
    reconnectDelay = RECONNECT_MIN_MS;
    setState({ connected: true });
  };
  ws.onmessage = (event) => {
    let parsed: ServerMessage | null = null;
    try {
      parsed = parseServerMessage(JSON.parse(String(event.data)));
    } catch {
      return; // not JSON
    }
    if (parsed) handle(parsed);
  };
  const retry = () => {
    if (socket !== ws) return;
    socket = null;
    cursors.clear();
    setState({ connected: false, selfId: null, peers: [] });
    scheduleReconnect();
  };
  ws.onclose = retry;
  ws.onerror = () => ws.close();
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  // The server is optional: without it the site simply has no presence, so
  // back off rather than knocking on a closed port forever.
  reconnectTimer = setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

/** Starts the connection once, on first mount. */
export function startPresence() {
  if (started) return;
  // Nowhere to connect: open no socket, schedule no retries, and leave the
  // bar unrendered rather than reconnecting at a closed port forever.
  if (!presenceUrl()) return;
  started = true;
  const name = readName();
  const colour = PEER_COLOURS[Math.floor(Math.random() * PEER_COLOURS.length)];
  setState({ name, colour });
  connect();
  pingTimer = setInterval(() => send({ type: "ping" }), PING_MS);
}

export function stopPresence() {
  clearInterval(pingTimer);
  clearTimeout(reconnectTimer);
  socket?.close();
  socket = null;
  started = false;
  reconnectDelay = RECONNECT_MIN_MS;
  cursors.clear();
  // Through setState, not by assignment: subscribers have to be told, or every
  // consumer keeps rendering a connection that is gone.
  setState(EMPTY);
}

/**
 * Throttled: the pointer fires far more often than anyone needs to see. Takes
 * raw client coordinates so the conversion happens after the throttle, not on
 * every `pointermove` of a high-polling-rate mouse.
 */
export function sendCursor(clientX: number, clientY: number) {
  const now = performance.now();
  if (now - lastCursorAt < CURSOR_SEND_MS) return;
  lastCursorAt = now;
  send({ type: "cursor", cursor: screenToShared(clientX, clientY) });
}

export function clearCursor() {
  lastCursorAt = 0;
  send({ type: "cursor", cursor: null });
}

export function setPresenceName(name: string) {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH) || randomName();
  setState({ name: trimmed });
  try {
    localStorage.setItem(NAME_STORAGE_KEY, trimmed);
  } catch {
    // storage blocked: the name still holds for this visit
  }
  send({ type: "identify", name: trimmed, colour: state.colour });
}

export function setPresenceMode(next: PeerMode) {
  mode = next;
  send({ type: "mode", mode: next });
}

export function usePresence() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => EMPTY,
  );
}
