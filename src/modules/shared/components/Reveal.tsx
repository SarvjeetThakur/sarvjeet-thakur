"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePhysicsMode } from "@/modules/mode";
import { REVEAL_ROOT_MARGIN } from "../constants";

type RevealProps = {
  /** Stagger within a group, in seconds. */
  delay?: number;
  className?: string;
  children: ReactNode;
};

/**
 * idle  — never animated (no JS, reduced motion, or already on screen)
 * hidden — waiting to scroll into view
 * shown  — animating in
 * done   — settled; all transform classes dropped
 */
type State = "idle" | "hidden" | "shown" | "done";

/**
 * Lifts its children into place the first time they scroll into view.
 *
 * Visible by default, so the content is readable with JavaScript disabled and
 * in crawlers. Anything already on screen at mount is revealed without
 * animating, so there is no flash on the first paint.
 *
 * Drops its transform once settled: a transformed ancestor would become the
 * containing block for `position: fixed`, which physics mode relies on.
 */
export function Reveal({ delay = 0, className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("idle");
  const physics = usePhysicsMode();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen: leave it alone rather than animating it in late.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Physics pins bodies with `position: fixed`, which a transform on this
  // wrapper would capture. Settle everything the moment physics starts.
  const settled = physics || state === "done" || state === "idle";
  const animating = !settled;

  return (
    <div
      ref={ref}
      data-reveal={settled ? "done" : state}
      style={state === "shown" ? { transitionDelay: `${delay}s` } : undefined}
      onTransitionEnd={(event) => {
        // `transitionend` bubbles, and the cards and chips inside have their
        // own colour and transform transitions. Without this guard, hovering
        // a card mid-reveal settles the wrapper early and the group jumps
        // into place instead of easing in.
        if (event.target === event.currentTarget) setState("done");
      }}
      className={`${
        animating
          ? "duration-700 ease-out data-[reveal=hidden]:translate-y-6 data-[reveal=hidden]:opacity-0 data-[reveal=shown]:translate-y-0 data-[reveal=shown]:opacity-100 data-[reveal=shown]:transition-[opacity,transform]"
          : ""
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
