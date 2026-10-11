import {
  SiBitbucket,
  SiBootstrap,
  SiClaude,
  SiCss,
  SiCursor,
  SiDocker,
  SiExpress,
  SiFigma,
  SiGit,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiJira,
  SiMongodb,
  SiMysql,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiPhp,
  SiPostgresql,
  SiReact,
  SiRedux,
  SiSass,
  SiTailwindcss,
  SiTypescript,
  SiX,
} from "@icons-pack/react-simple-icons";
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
  Download,
  FileText,
  Gauge,
  Layers,
  Mail,
  MousePointer2,
  Orbit,
  Palette,
  Radio,
  Rocket,
  Server,
  Sparkles,
  TestTube2,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { IconName } from "../constants";

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Brand marks from simple-icons, the rest lucide. LinkedIn and AWS have no
 * mark in either set and fall back to a neutral glyph. The `satisfies` is
 * load-bearing: it fails the build if this and ICON_NAMES ever disagree.
 */
const ICONS = {
  accessibility: Accessibility,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  atSign: AtSign,
  bitbucket: SiBitbucket,
  bootstrap: SiBootstrap,
  boxes: Boxes,
  braces: Braces,
  briefcase: Briefcase,
  claude: SiClaude,
  cloud: Cloud,
  code: Code2,
  css: SiCss,
  cursor: SiCursor,
  database: Database,
  docker: SiDocker,
  download: Download,
  express: SiExpress,
  figma: SiFigma,
  fileText: FileText,
  gauge: Gauge,
  git: SiGit,
  github: SiGithub,
  html5: SiHtml5,
  javascript: SiJavascript,
  jira: SiJira,
  layers: Layers,
  linkedin: Briefcase,
  mail: Mail,
  mongodb: SiMongodb,
  mysql: SiMysql,
  nestjs: SiNestjs,
  nextjs: SiNextdotjs,
  nodejs: SiNodedotjs,
  orbit: Orbit,
  palette: Palette,
  php: SiPhp,
  pointer: MousePointer2,
  postgresql: SiPostgresql,
  react: SiReact,
  realtime: Radio,
  redux: SiRedux,
  rocket: Rocket,
  sass: SiSass,
  server: Server,
  sparkles: Sparkles,
  tailwind: SiTailwindcss,
  testTube: TestTube2,
  typescript: SiTypescript,
  x: SiX,
} satisfies Record<IconName, Glyph>;

type IconProps = { name: IconName; className?: string };

export function Icon({ name, className = "size-4" }: IconProps) {
  const Glyph = ICONS[name];
  // Backstop only: `assertIconNames` in content.ts catches this at build time.
  // Rendering `undefined` would throw and take down the whole prerender.
  if (!Glyph) return null;
  return <Glyph aria-hidden className={className} />;
}
