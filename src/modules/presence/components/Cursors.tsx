"use client";

import { useEffect, useRef } from "react";
import { usePhysicsMode } from "@/modules/mode";
import { CURSOR_EASE, CURSOR_SNAP, peerTextColour } from "../constants";
import { sharedToScreen } from "../lib/coords";
import { clearCursor, getPeerCursor, sendCursor, usePresence } from "../lib/presence-store";
import type { Peer } from "../types";

/**
 * `name` and `colour` are tracked so the label is only rewritten when it
 * changes: assigning `textContent` replaces the text node every frame.
 */
type Rendered = {
  el: HTMLDivElement;
  label: HTMLElement;
  at: { x: number; y: number } | null;
  name: string;
  colour: string;
};

export function Cursors() {
  const { peers, connected } = usePresence();
  const layer = useRef<HTMLDivElement>(null);
  const rendered = useRef(new Map<string, Rendered>());
  // The draw loop reads peers without re-subscribing every time one moves.
  const peersRef = useRef<Peer[]>([]);
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);
  // Remote cursors must follow this viewer's camera, which React never sees.
  const physics = usePhysicsMode();
  // Nothing to draw until someone else is here, which is the common case.
  const anyone = connected && peers.length > 0;

  // Broadcast this pointer in shared coordinates.
  useEffect(() => {
    if (!connected) return;
    const onMove = (event: PointerEvent) => sendCursor(event.clientX, event.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", clearCursor);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", clearCursor);
      clearCursor();
    };
  }, [connected]);

  // Draw every peer cursor, easing toward its target so updates look smooth.
  useEffect(() => {
    const host = layer.current;
    if (!host || !anyone) return;
    let raf = 0;
    const seen = new Set<string>();

    const frame = () => {
      seen.clear();
      for (const peer of peersRef.current) {
        const cursor = getPeerCursor(peer.id);
        if (!cursor) continue;
        seen.add(peer.id);
        let entry = rendered.current.get(peer.id);
        if (!entry) {
          const el = document.createElement("div");
          el.className =
            "pointer-events-none absolute top-0 left-0 flex items-start gap-1 will-change-transform";
          el.innerHTML =
            `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">` +
            `<path d="M2 1.5 15 8l-5.4 1.6L7.3 15 2 1.5Z" fill="currentColor" stroke="var(--bg)" stroke-width="1.2" stroke-linejoin="round"/></svg>` +
            `<span class="translate-y-2 rounded-chip px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"></span>`;
          entry = {
            el,
            label: el.lastElementChild as HTMLElement,
            at: null,
            name: "",
            colour: "",
          };
          rendered.current.set(peer.id, entry);
          host.appendChild(el);
        }
        if (entry.colour !== peer.colour) {
          entry.colour = peer.colour;
          entry.el.style.color = peer.colour;
          entry.label.style.background = peer.colour;
          entry.label.style.color = peerTextColour(peer.colour);
        }
        if (entry.name !== peer.name) {
          entry.name = peer.name;
          entry.label.textContent = peer.name;
        }

        const target = sharedToScreen(cursor);
        if (!entry.at) {
          entry.at = { x: target.x, y: target.y };
        } else {
          const dx = target.x - entry.at.x;
          const dy = target.y - entry.at.y;
          // Mutated in place: no per-peer, per-frame allocation.
          if (Math.abs(dx) < CURSOR_SNAP && Math.abs(dy) < CURSOR_SNAP) {
            entry.at.x = target.x;
            entry.at.y = target.y;
          } else {
            entry.at.x += dx * CURSOR_EASE;
            entry.at.y += dy * CURSOR_EASE;
          }
        }
        entry.el.style.transform = `translate3d(${entry.at.x.toFixed(1)}px,${entry.at.y.toFixed(1)}px,0)`;
      }

      for (const [id, entry] of rendered.current) {
        if (seen.has(id)) continue;
        entry.el.remove();
        rendered.current.delete(id);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    const drawn = rendered.current;
    return () => {
      cancelAnimationFrame(raf);
      for (const entry of drawn.values()) entry.el.remove();
      drawn.clear();
    };
  }, [physics, anyone]);

  return <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-40" />;
}
