import { ICON_SIZES, siteIcon } from "@/modules/portfolio";

/**
 * Replaces the create-next-app favicon. Generated rather than a checked-in
 * .ico so it stays in step with the portrait in the content file. One file
 * draws every size: the favicon, and the 192 and 512 a web app manifest is
 * expected to carry.
 */
export function generateImageMetadata() {
  return ICON_SIZES.map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  return siteIcon(Number(await id), { round: true });
}
