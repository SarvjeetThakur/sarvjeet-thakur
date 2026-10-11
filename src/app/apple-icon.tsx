import { ImageResponse } from "next/og";
import { APPLE_ICON_SIZE, site } from "@/modules/portfolio";

/** Saving the page to a home screen otherwise scales up the 32px favicon. */
export const size = APPLE_ICON_SIZE;
export const contentType = "image/png";

export default function AppleIcon() {
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
        fontSize: 76,
        fontWeight: 700,
        fontFamily: "sans-serif",
      }}
    >
      {site.initials}
    </div>,
    size,
  );
}
