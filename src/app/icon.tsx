import { ImageResponse } from "next/og";
import { ICON_SIZE, site } from "@/modules/portfolio";

/**
 * Replaces the create-next-app favicon. Generated rather than a checked-in
 * .ico so it stays in step with the initials in the content file, and uses
 * the same gradient as the Open Graph and Apple icons.
 */
export const size = ICON_SIZE;
export const contentType = "image/png";

export default function Icon() {
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
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: -1,
        fontFamily: "sans-serif",
      }}
    >
      {site.initials}
    </div>,
    size,
  );
}
