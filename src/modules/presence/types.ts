/** Cursor position in document coordinates, which map to any screen or zoom. */
export type Point = { x: number; y: number };

export type PeerMode = "static" | "physics";

/** A peer exactly as the server sends it, cursor position included. */
export type WirePeer = {
  id: string;
  name: string;
  colour: string;
  cursor: Point | null;
  mode: PeerMode;
};

/**
 * A peer as the UI sees it. Live positions are deliberately absent: they
 * arrive about twenty times a second per peer, so they live in the store's
 * cursor map and are read by the draw loop, never through React. `hasCursor`
 * flips at most twice per peer, and is what the "jump to" button keys off.
 */
export type Peer = {
  id: string;
  name: string;
  colour: string;
  mode: PeerMode;
  hasCursor: boolean;
};

/** Sent by a client. */
export type ClientMessage =
  | { type: "identify"; name: string; colour: string }
  | { type: "cursor"; cursor: Point | null }
  | { type: "mode"; mode: PeerMode }
  | { type: "ping" };

/** Sent by the server. */
export type ServerMessage =
  | { type: "welcome"; you: string; peers: WirePeer[] }
  | { type: "peer"; peer: WirePeer }
  | { type: "cursor"; id: string; cursor: Point | null }
  | { type: "left"; id: string };

export type PresenceState = {
  connected: boolean;
  selfId: string | null;
  name: string;
  colour: string;
  peers: Peer[];
};
