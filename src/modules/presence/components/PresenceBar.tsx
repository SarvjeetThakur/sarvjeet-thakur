"use client";

import { useEffect, useRef, useState } from "react";
import { setPhysicsMode, usePhysicsMode } from "@/modules/mode";
import { MAX_NAME_LENGTH, peerTextColour } from "../constants";
import { goToShared } from "../lib/coords";
import {
  getPeerCursor,
  setPresenceMode,
  setPresenceName,
  startPresence,
  usePresence,
} from "../lib/presence-store";
import type { Peer } from "../types";

export type PresenceLabels = {
  you: string;
  namePlaceholder: string;
  /** `{name}` is replaced with the peer's name. */
  jumpTo: string;
  alone: string;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";

export function PresenceBar({ labels }: { labels: PresenceLabels }) {
  const { connected, name, colour, peers } = usePresence();
  const physics = usePhysicsMode();
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // Set when the field is left deliberately, so focus goes back to the button
  // it came from rather than to the top of the document.
  const restoreFocus = useRef(false);

  useEffect(() => startPresence(), []);
  // Let others see which mode each person is in.
  useEffect(() => setPresenceMode(physics ? "physics" : "static"), [physics]);
  useEffect(() => {
    if (editing) {
      // `select()` selects text; it does not move focus. Without the focus
      // call, a keyboard activation leaves focus on <body> and the field's own
      // blur handler — which is what commits the name — can never fire.
      input.current?.focus();
      input.current?.select();
      return;
    }
    if (restoreFocus.current) {
      restoreFocus.current = false;
      trigger.current?.focus();
    }
  }, [editing]);

  if (!connected) return null;

  function stopEditing() {
    restoreFocus.current = true;
    setEditing(false);
  }

  /** Jump to a peer, matching their mode so you are looking at the same thing. */
  function follow(peer: Peer) {
    const point = getPeerCursor(peer.id);
    if (!point) return;
    const wantsPhysics = peer.mode === "physics";
    if (wantsPhysics !== physics) {
      setPhysicsMode(wantsPhysics);
      // The engine is downloaded on demand, so hand the target to the physics
      // module and let it fly as soon as there is a camera.
      goToShared(point, wantsPhysics);
      return;
    }
    goToShared(point);
  }

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-chip border border-line bg-surface p-1 backdrop-blur-xl">
      {editing ? (
        <input
          ref={input}
          defaultValue={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder={labels.namePlaceholder}
          aria-label={labels.namePlaceholder}
          onBlur={(event) => {
            setPresenceName(event.target.value);
            stopEditing();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") stopEditing();
          }}
          className="h-9 w-32 rounded-chip bg-surface-strong px-3 text-sm outline-none"
        />
      ) : (
        <button
          ref={trigger}
          type="button"
          onClick={() => setEditing(true)}
          // The accessible name has to say it is editable: `title` alone never
          // reaches a touch user or a screen reader usefully.
          aria-label={`${labels.you}: ${name}`}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-chip px-2 text-sm hover:bg-surface-strong"
        >
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-full text-[10px] font-bold"
            style={{ background: colour, color: peerTextColour(colour) }}
          >
            {initials(name)}
          </span>
          <span className="max-w-24 truncate text-muted">{name}</span>
        </button>
      )}

      {peers.length > 0 ? (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-line" />
          <ul className="flex items-center -space-x-1.5">
            {peers.map((peer) => (
              <li key={peer.id}>
                <button
                  type="button"
                  onClick={() => follow(peer)}
                  disabled={!peer.hasCursor}
                  aria-label={labels.jumpTo.replace("{name}", peer.name)}
                  className="grid size-8 cursor-pointer place-items-center rounded-full border-2 border-bg text-[10px] font-bold transition-transform hover:z-10 hover:scale-110 disabled:cursor-default disabled:opacity-50"
                  style={{ background: peer.colour, color: peerTextColour(peer.colour) }}
                >
                  {initials(peer.name)}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        // Connected but alone: say so, rather than leaving the bar looking broken.
        <span className="px-2 text-xs text-muted">{labels.alone}</span>
      )}
    </div>
  );
}
