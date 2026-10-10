"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/modules/shared";
import { DEFAULT_THEME, Theme } from "../constants";

export type ThemeLabels = { label: string; light: string; dark: string };

export function ThemeButton({ labels }: { labels: ThemeLabels }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  // Before hydration the stored theme is unknown, so assume the default rather
  // than rendering nothing: an invisible control is worse than a brief swap.
  const isDark = hydrated ? resolvedTheme !== Theme.Light : DEFAULT_THEME === Theme.Dark;
  const Glyph = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      suppressHydrationWarning
      // The label names what the press will do, not the current state.
      aria-label={`${labels.label}: ${isDark ? labels.light : labels.dark}`}
      onClick={() => setTheme(isDark ? Theme.Light : Theme.Dark)}
      className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-chip text-muted transition-colors hover:bg-surface-strong hover:text-fg active:translate-y-px"
    >
      <Glyph aria-hidden className="size-4" strokeWidth={1.75} />
    </button>
  );
}
