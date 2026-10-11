/** Development only. The server reads the same name, so they cannot disagree. */
export const PRESENCE_PORT = Number(process.env.NEXT_PUBLIC_PRESENCE_PORT ?? 3001);

/**
 * Full origin of a host running `server/presence.mjs`, e.g.
 * `wss://presence.example.com`. Empty means presence is off — the right
 * default, since Vercel cannot hold a socket open.
 */
export const PRESENCE_URL = process.env.NEXT_PUBLIC_PRESENCE_URL ?? "";

export const CURSOR_SEND_MS = 50;
export const PING_MS = 10_000;
/** Doubles up to the ceiling: the server is usually absent in production. */
export const RECONNECT_MIN_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export const NAME_STORAGE_KEY = "pf-name";
export const MAX_NAME_LENGTH = 24;

export const CURSOR_EASE = 0.22;
export const CURSOR_SNAP = 0.5;

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

/* Not theme tokens: the background is an arbitrary peer colour. */
const PEER_FG_LIGHT = "#ffffff";
const PEER_FG_DARK = "#06070d";

const srgbToLinear = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

function luminance(hex: string): number | null {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  const [r, g, b] = [0, 1, 2].map((i) =>
    srgbToLinear(Number.parseInt(value.slice(i * 2, i * 2 + 2), 16) / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Readable text on an arbitrary peer colour. White alone fails badly on the
 * lighter hues — #fbbf24 is 1.66:1.
 */
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

export const randomName = () => `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
