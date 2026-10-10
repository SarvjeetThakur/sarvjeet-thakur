import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, site } from "@/modules/portfolio";
import { THEME_COLORS, Theme } from "@/modules/theme";

/** Shared in DMs, Slack and on X; without it every share is a bare blue link. */
export const alt = site.meta.ogAlt;
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: THEME_COLORS[Theme.Dark],
        color: "#eceef6",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 30, color: "#8d93a8" }}>{site.role}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          {site.name}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#8d93a8", maxWidth: 900 }}>
          {site.meta.description}
        </div>
      </div>
      <div style={{ display: "flex", height: 8, width: 200, background: "#7c6cff" }} />
    </div>,
    size,
  );
}
