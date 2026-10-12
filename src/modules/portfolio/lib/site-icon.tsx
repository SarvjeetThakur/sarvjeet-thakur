import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { ICON_GLYPH_RATIO, ICON_PORTRAIT_CROP } from "../constants";
import { about, site } from "../content";

const { zoom, faceX, faceY } = ICON_PORTRAIT_CROP;

/**
 * Inlined because the image renderer cannot fetch a site-relative path.
 * Cached so the icon routes stay prerendered: an uncached file read makes
 * them dynamic, and a serverless function has no `public/` to read from.
 */
async function portraitDataUri(src: string) {
  "use cache";
  // The file only changes with a deploy, which starts a fresh cache anyway.
  cacheLife("max");
  const file = await readFile(join(process.cwd(), "public", src));
  return `data:image/jpeg;base64,${file.toString("base64")}`;
}

/**
 * Every icon the site serves — favicon, manifest sizes, Apple touch icon —
 * drawn from the portrait in the content file, cropped in on the face so it
 * still reads at 16px. Without a portrait it falls back to the initials.
 *
 * `round` clips to a circle for browser tabs. The Apple icon stays square:
 * iOS applies its own mask and would show the transparent corners as black.
 */
export async function siteIcon(px: number, { round }: { round: boolean }) {
  const frame = {
    width: "100%",
    height: "100%",
    display: "flex",
    overflow: "hidden",
    borderRadius: round ? px / 2 : 0,
  } as const;

  if (!about.portrait) {
    return new ImageResponse(
      <div
        style={{
          ...frame,
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6d5cf0 0%, #3d31a6 50%, #2bb6d9 100%)",
          color: "#ffffff",
          fontSize: Math.round(px * ICON_GLYPH_RATIO),
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {site.initials}
      </div>,
      { width: px, height: px },
    );
  }

  const portrait = await portraitDataUri(about.portrait.src);
  const side = px * zoom;

  return new ImageResponse(
    <div style={{ ...frame, position: "relative" }}>
      {/* A plain <img>: this is drawn to a PNG by the renderer, not sent to a browser. */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        src={portrait}
        alt=""
        width={side}
        height={side}
        style={{
          position: "absolute",
          left: px / 2 - faceX * side,
          top: px / 2 - faceY * side,
        }}
      />
    </div>,
    { width: px, height: px },
  );
}
