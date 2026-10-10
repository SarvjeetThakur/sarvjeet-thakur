/**
 * Port the presence server listens on in development, where `pnpm dev` starts
 * it beside Next on the same host. Server and client read the same
 * `NEXT_PUBLIC_` name so they cannot disagree: Next inlines it here at build
 * time and `server/presence.mjs` reads it at startup.
 */
export const PRESENCE_PORT = Number(process.env.NEXT_PUBLIC_PRESENCE_PORT ?? 3001);

/**
 * Where presence connects in production. Empty means presence is off, which
 * is the correct default: it needs a long-lived WebSocket server, and most
 * static hosts — Vercel included — cannot run one. Guessing a port on the
 * page's own host instead meant every visitor, and every crawler, opened a
 * handshake that could only ever fail.
 *
 * Set it to the full origin of a host that does run `server/presence.mjs`,
 * e.g. `wss://presence.example.com`.
 */
export const PRESENCE_URL = process.env.NEXT_PUBLIC_PRESENCE_URL ?? "";

/** Cursor updates are throttled to roughly one animation frame. */
export const CURSOR_SEND_MS = 50;
/** Keeps the socket alive through proxies and tells the server we are here. */
export const PING_MS = 10_000;
/**
 * Reconnection backoff. The server is optional and is usually simply absent in
 * production, so a flat retry would mean a failed handshake every two seconds
 * for the life of the page; the delay doubles up to the ceiling instead.
 */
export const RECONNECT_MIN_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export const NAME_STORAGE_KEY = "pf-name";
export const MAX_NAME_LENGTH = 24;

/** Remote cursors ease toward their target instead of teleporting. */
export const CURSOR_EASE = 0.22;
/** Below this distance a cursor is treated as arrived. */
export const CURSOR_SNAP = 0.5;

/** Assigned at random so two people rarely share a colour. */
export const PEER_COLOURS = [
  "#7c6cff",
  "#4dd9ff",
  "#ff7a52",
  "#4ade80",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
] as const;

/*
 * A peer colour is chosen for the cursor, not for the 10px initials drawn on
 * top of it, and white fails badly on the lighter hues: #fbbf24 is 1.66:1.
 * These are raw values rather than theme tokens because the background they
 * sit on is an arbitrary peer colour, which no token describes.
 */
const PEER_FG_LIGHT = "#ffffff";
const PEER_FG_DARK = "#06070d";

const srgbToLinear = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

/** WCAG relative luminance of a `#rrggbb` string. */
function luminance(hex: string): number | null {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  const [r, g, b] = [0, 1, 2].map((i) =>
    srgbToLinear(Number.parseInt(value.slice(i * 2, i * 2 + 2), 16) / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Whichever of the two foregrounds has more contrast on this peer colour. */
export function peerTextColour(colour: string): string {
  const l = luminance(colour);
  if (l === null) return PEER_FG_LIGHT;
  const onWhite = 1.05 / (l + 0.05);
  const onDark = (l + 0.05) / 0.05;
  return onWhite >= onDark ? PEER_FG_LIGHT : PEER_FG_DARK;
}

const ADJECTIVES = ["Swift", "Quiet", "Bright", "Clever", "Calm", "Bold", "Keen", "Warm"];
const ANIMALS = ["Otter", "Falcon", "Heron", "Lynx", "Moth", "Fox", "Crane", "Ibex"];

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** A friendly default so nobody has to type a name before joining. */
export const randomName = () => `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
