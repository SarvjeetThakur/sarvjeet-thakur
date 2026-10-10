import { about, contact, projects, site } from "../content";
import { SITE_URL } from "../constants";

/**
 * `Person` plus the projects as `CreativeWork` — the textbook shape for a
 * personal site, and every field already exists in the content JSON. Without
 * it a search engine has to infer who the page is about.
 */
function personGraph() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: site.name,
    jobTitle: site.role,
    description: site.meta.description,
    url: SITE_URL,
    email: contact.email.href.replace(/^mailto:/, ""),
    sameAs: contact.links.map((link) => link.href),
    knowsAbout: about.skills.map((skill) => skill.label),
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE_URL },
    subjectOf: projects.map((project) => ({
      "@type": "CreativeWork",
      name: project.title,
      abstract: project.summary,
      url: project.href,
      dateCreated: project.year,
      creator: { "@id": `${SITE_URL}/#person` },
      keywords: project.tags.join(", "),
    })),
  };
}

/**
 * Ready for `dangerouslySetInnerHTML`. Escaping `<` is required: a `</script>`
 * inside any content string would otherwise close the tag early, so this is
 * the one thing that must not be skipped.
 */
export function structuredData(): string {
  return JSON.stringify(personGraph()).replace(/</g, "\\u003c");
}
