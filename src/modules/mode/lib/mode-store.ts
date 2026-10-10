"use client";

import { useSyncExternalStore } from "react";
import { MODE_ATTR, MODE_OFF, MODE_ON } from "../constants";

const listeners = new Set<() => void>();
let enabled = false;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/*
 * Deliberately not persisted. Physics mode is opt-in every visit: restoring it
 * on load would have to happen after hydration (the server snapshot below is
 * always false, so reading storage during the first render is a mismatch), and
 * it would drop a reader into a pointer-driven canvas they did not ask for on
 * this page view.
 */
export function setPhysicsMode(next: boolean) {
  if (enabled === next) return;
  enabled = next;
  // The attribute drives every `physics:` style and locks page scroll.
  document.body.setAttribute(MODE_ATTR, next ? MODE_ON : MODE_OFF);
  emit();
}

/** False on the server and during hydration, so the readable page is what ships. */
export function usePhysicsMode() {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );
}
