import { SiFigma, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Boxes,
  Braces,
  Briefcase,
  Cloud,
  Code2,
  Database,
  Gauge,
  Layers,
  Mail,
  MousePointer2,
  Orbit,
  Palette,
  Rocket,
  Server,
  Sparkles,
  TestTube2,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { IconName } from "../constants";

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Brand marks come from simple-icons; everything else is lucide. LinkedIn has
 * no brand mark in either set, so it uses a neutral glyph.
 *
 * `satisfies Record<IconName, Glyph>` is load-bearing: it fails the build if
 * this map and ICON_NAMES ever disagree in either direction.
 */
const ICONS = {
  accessibility: Accessibility,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  atSign: AtSign,
  boxes: Boxes,
  braces: Braces,
  cloud: Cloud,
  code: Code2,
  database: Database,
  figma: SiFigma,
  gauge: Gauge,
  github: SiGithub,
  layers: Layers,
  linkedin: Briefcase,
  mail: Mail,
  orbit: Orbit,
  palette: Palette,
  pointer: MousePointer2,
  rocket: Rocket,
  server: Server,
  sparkles: Sparkles,
  testTube: TestTube2,
  x: SiX,
} satisfies Record<IconName, Glyph>;

type IconProps = { name: IconName; className?: string };

export function Icon({ name, className = "size-4" }: IconProps) {
  const Glyph = ICONS[name];
  /*
   * An unknown name is a content mistake, not a reason to fail. The icon names
   * in the JSON are widened to `string` by the import and then asserted, so
   * TypeScript cannot catch one; rendering `undefined` as a component throws
   * "Element type is invalid", and because every caller is a server component
   * that would take down the whole prerender. `assertIconNames` in content.ts
   * turns it into one clear build-time error instead; this is the backstop.
   */
  if (!Glyph) return null;
  return <Glyph aria-hidden className={className} />;
}
