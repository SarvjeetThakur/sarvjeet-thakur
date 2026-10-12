import { APPLE_ICON_SIZE, siteIcon } from "@/modules/portfolio";

/** Saving the page to a home screen otherwise scales up the 32px favicon. */
export const size = APPLE_ICON_SIZE;
export const contentType = "image/png";

export default function AppleIcon() {
  return siteIcon(APPLE_ICON_SIZE.width, { round: false });
}
