export const Theme = {
  Light: "light",
  Dark: "dark",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

/** Named themes with a `:root[data-theme]` block in tokens.css. Add new themes here. */
export const THEMES: string[] = [Theme.Light, Theme.Dark];

/** Space is the point of the design, so dark is the default rather than the OS setting. */
export const DEFAULT_THEME: Theme = Theme.Dark;

export const THEME_ATTRIBUTE = "data-theme";

/**
 * `theme-color` for the browser chrome, one per scheme. These mirror `--bg` in
 * tokens.css and are duplicated here only because document metadata cannot
 * read a CSS custom property; keep them in step.
 */
export const THEME_COLORS: Record<Theme, string> = {
  [Theme.Light]: "#f4f3f8",
  [Theme.Dark]: "#06070d",
};
