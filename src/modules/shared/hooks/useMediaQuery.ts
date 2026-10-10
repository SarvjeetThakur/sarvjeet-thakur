"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `matchMedia` is memoised per query: `getSnapshot` runs whenever React checks
 * for tearing, and building a fresh MediaQueryList each time is pure waste.
 */
const lists = new Map<string, MediaQueryList>();

function listFor(query: string) {
  let list = lists.get(query);
  if (!list) {
    list = matchMedia(query);
    lists.set(query, list);
  }
  return list;
}

/**
 * Tracks a media query without a render-phase setState. Always false on the
 * server and during hydration, so markup matches.
 */
export function useMediaQuery(query: string) {
  // `useSyncExternalStore` needs a stable subscribe identity, so this
  // useCallback is load-bearing rather than something React Compiler handles.
  const subscribe = useCallback(
    (listener: () => void) => {
      const list = listFor(query);
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => listFor(query).matches,
    () => false,
  );
}
