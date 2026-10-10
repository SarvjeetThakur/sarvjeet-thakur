import type { PresenceLabels } from "@/modules/presence";
import type { IconName } from "@/modules/shared";

export type SectionCopy = { index: string; heading: string };

export type NavLink = { id: string; label: string };

export type HeroAction = {
  label: string;
  href: string;
  icon: IconName;
  /** Filled accent button, as opposed to the outlined one. */
  primary: boolean;
};

export type SiteContent = {
  name: string;
  initials: string;
  role: string;
  language: string;
  meta: { title: string; description: string; ogAlt: string };
  hero: {
    greeting: string;
    /** One line per array entry. */
    headline: string[];
    intro: string;
    actions: HeroAction[];
    stats: { value: string; label: string }[];
    scrollHint: string;
  };
  nav: { label: string; links: NavLink[]; skip: string; mainLabel: string };
  sections: { work: SectionCopy; about: SectionCopy; contact: SectionCopy };
  physics: {
    enter: string;
    exit: string;
    overview: string;
    shake: string;
    reset: string;
    zoomIn: string;
    zoomOut: string;
    panUp: string;
    panDown: string;
    hint: string;
    toolbarLabel: string;
    /** Announced in a live region when the mode changes. */
    entered: string;
    exited: string;
  };
  presence: PresenceLabels;
  theme: { label: string; light: string; dark: string };
  footer: { note: string; backToTop: string };
};

export type ContentImage = { src: string; alt: string; width: number; height: number };

export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: string;
  role: string;
  href: string;
  /** Featured projects get a full-width row; the rest sit in the grid. */
  featured: boolean;
  tags: string[];
  metric: { value: string; label: string };
  image: ContentImage;
};

export type Skill = { label: string; icon: IconName };

export type AboutContent = {
  lead: string;
  paragraphs: string[];
  skillsHeading: string;
  skills: Skill[];
  nowHeading: string;
  now: { icon: IconName; text: string }[];
};

export type ContactLink = { label: string; value: string; href: string; icon: IconName };

export type ContactContent = {
  lead: string;
  body: string;
  email: { label: string; href: string; icon: IconName };
  links: ContactLink[];
};
