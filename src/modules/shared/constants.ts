/** How far above the bottom edge an element must come before it reveals. */
export const REVEAL_ROOT_MARGIN = "0px 0px -8% 0px";

/**
 * Every icon name usable from content JSON.
 *
 * The list lives here rather than beside the glyph map so that validating a
 * content file does not pull lucide and simple-icons in with it. `Icon` checks
 * its map against this list with `satisfies`, so the two cannot drift.
 */
export const ICON_NAMES = [
  "accessibility",
  "arrowRight",
  "arrowUpRight",
  "atSign",
  "boxes",
  "braces",
  "cloud",
  "code",
  "database",
  "figma",
  "gauge",
  "github",
  "layers",
  "linkedin",
  "mail",
  "orbit",
  "palette",
  "pointer",
  "rocket",
  "server",
  "sparkles",
  "testTube",
  "x",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
