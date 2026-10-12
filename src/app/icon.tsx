import { ImageResponse } from "next/og";
import { ICON_SIZES, site } from "@/modules/portfolio";

/** The initials fill a little under half the tile at every size. */
const GLYPH_RATIO = 0.47;

/**
 * Replaces the create-next-app favicon. Generated rather than a checked-in
 * .ico so it stays in step with the initials in the content file, and uses
 * the same gradient as the Apple icon. One file draws every size: the
 * favicon, and the 192 and 512 a web app manifest is expected to carry.
 */
export function generateImageMetadata() {
  return ICON_SIZES.map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #6d5cf0 0%, #3d31a6 50%, #2bb6d9 100%)",
        color: "#ffffff",
        fontSize: Math.round(px * GLYPH_RATIO),
        fontWeight: 700,
        letterSpacing: -1,
        fontFamily: "sans-serif",
      }}
    >
      {site.initials}
    </div>,
    { width: px, height: px },
  );
}
