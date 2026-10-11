"use client";

import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Minus,
  MousePointer2,
  Orbit,
  Plus,
  Sparkles,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { setPhysicsMode, usePhysicsMode } from "@/modules/mode";
import { physicsActions } from "@/modules/physics";
import { PresenceBar } from "@/modules/presence";
import { ThemeButton } from "@/modules/theme";
import { site } from "../content";

/*
 * Glyphs come straight from lucide, not through `Icon`: its map is one object
 * referencing every glyph, so none of them can be tree-shaken out of the
 * client bundle.
 */
type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

const { enter, exit, overview, shake, reset, zoomIn, zoomOut, panUp, panDown, hint, toolbarLabel } =
  site.physics;

const HINT_ID = "physics-hint";

type BarButtonProps = {
  glyph: Glyph;
  label: string;
  /** Filled treatment while the mode is on. Styling only. */
  on?: boolean;
  /** Secondary action: drops to icon-only on narrow screens. */
  compact?: boolean;
  onClick: () => void;
};

function BarButton({ glyph: Glyph, label, on = false, compact = false, onClick }: BarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={compact ? label : undefined}
      className={`inline-flex min-h-11 flex-none cursor-pointer items-center gap-2 rounded-chip px-3 text-sm font-medium whitespace-nowrap transition-colors active:translate-y-px ${
        on ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-strong hover:text-fg"
      }`}
    >
      <Glyph aria-hidden className="size-4" />
      <span className={compact ? "hidden sm:inline" : undefined}>{label}</span>
    </button>
  );
}

function IconButton({ glyph: Glyph, label, onClick }: Omit<BarButtonProps, "compact" | "on">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-chip text-muted transition-colors hover:bg-surface-strong hover:text-fg active:translate-y-px"
    >
      <Glyph aria-hidden className="size-4" />
    </button>
  );
}

export function ControlBar() {
  const physics = usePhysicsMode();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <PresenceBar labels={site.presence} />
      {/*
        Always mounted: a live region added at the same moment as its text is
        not reliably announced.
      */}
      <p aria-live="polite" className="sr-only">
        {physics ? site.physics.entered : site.physics.exited}
      </p>
      {physics ? (
        // `output` has an implicit role of status, so this is announced on change.
        <output
          id={HINT_ID}
          className="block max-w-prose rounded-card bg-fg/90 px-3 py-1.5 text-center text-xs font-medium text-pretty text-bg"
        >
          {hint}
        </output>
      ) : null}
      {/* wraps rather than scrolls, so every control stays reachable on a phone */}
      <div
        // Not role="toolbar": that promises roving tabindex and arrow keys,
        // and a role without its keyboard contract is worse than none.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="group"
        aria-label={toolbarLabel}
        aria-describedby={physics ? HINT_ID : undefined}
        className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-card border border-line bg-surface p-1 backdrop-blur-xl sm:rounded-chip"
      >
        {physics ? (
          <>
            <BarButton
              glyph={Boxes}
              label={overview}
              compact
              onClick={physicsActions.flyToOverview}
            />
            <BarButton glyph={Sparkles} label={shake} compact onClick={physicsActions.shake} />
            <BarButton glyph={Orbit} label={reset} compact onClick={physicsActions.reset} />
            <span aria-hidden className="mx-1 h-5 w-px flex-none bg-line" />
            {/* Without these the camera is drag-and-pinch only, and scroll is locked. */}
            <IconButton glyph={Plus} label={zoomIn} onClick={physicsActions.zoomIn} />
            <IconButton glyph={Minus} label={zoomOut} onClick={physicsActions.zoomOut} />
            <IconButton glyph={ChevronUp} label={panUp} onClick={physicsActions.panUp} />
            <IconButton glyph={ChevronDown} label={panDown} onClick={physicsActions.panDown} />
            <span aria-hidden className="mx-1 h-5 w-px flex-none bg-line" />
          </>
        ) : null}
        {/* The label names what the press does, so aria-pressed would contradict it. */}
        <BarButton
          glyph={MousePointer2}
          label={physics ? exit : enter}
          on={physics}
          onClick={() => setPhysicsMode(!physics)}
        />
        <span aria-hidden className="mx-1 h-5 w-px flex-none bg-line" />
        <ThemeButton labels={site.theme} />
      </div>
    </div>
  );
}
