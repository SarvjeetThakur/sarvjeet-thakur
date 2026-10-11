import { ICON_NAMES } from "@/modules/shared";
import aboutJson from "./content/about.json";
import contactJson from "./content/contact.json";
import projectsJson from "./content/projects.json";
import resumeJson from "./content/resume.json";
import siteJson from "./content/site.json";
import stackJson from "./content/stack.json";
import type {
  AboutContent,
  ContactContent,
  Project,
  ResumeContent,
  SiteContent,
  StackContent,
} from "./types";

/*
 * JSON imports widen string literals to `string`, so icon names need the
 * assertion below and cannot be checked by TypeScript. An unrecognised name
 * would otherwise render `undefined` as a component, and since every caller is
 * a server component that fails the whole prerender rather than one glyph.
 *
 * Walking for any `icon` key keeps this correct as the content shape grows.
 */
function assertIconNames(value: unknown, path: string) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertIconNames(item, `${path}[${i}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "icon" && typeof child === "string") {
      if (!(ICON_NAMES as readonly string[]).includes(child)) {
        throw new Error(
          `${path}.icon is "${child}", which is not an icon name. ` +
            `Add it to ICON_NAMES and the ICONS map, or use one of: ${ICON_NAMES.join(", ")}`,
        );
      }
      continue;
    }
    assertIconNames(child, `${path}.${key}`);
  }
}

for (const [name, json] of Object.entries({
  site: siteJson,
  projects: projectsJson,
  about: aboutJson,
  contact: contactJson,
  stack: stackJson,
  resume: resumeJson,
})) {
  assertIconNames(json, name);
}

export const site = siteJson as SiteContent;
export const projects = projectsJson as Project[];
export const about = aboutJson as AboutContent;
export const contact = contactJson as ContactContent;
export const stack = stackJson as StackContent;
export const resume = resumeJson as ResumeContent;
