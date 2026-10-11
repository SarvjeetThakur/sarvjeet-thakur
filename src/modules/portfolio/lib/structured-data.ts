import { about, contact, projects, resume, site, stack } from "../content";
import { SITE_URL } from "../constants";

/**
 * `Person` plus the projects as `CreativeWork` — the textbook shape for a
 * personal site, and every field already exists in the content JSON. Without
 * it a search engine has to infer who the page is about.
 */
function graph(pageUrl: string) {
  const personId = `${SITE_URL}/#person`;
  const employer = resume.experience[0]?.company;

  /*
   * A @graph, not nested: there is no Person property meaning "things I
   * made", and `subjectOf` asserts the opposite. `creator` carries the link.
   */
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        jobTitle: site.role,
        description: site.meta.description,
        url: SITE_URL,
        ...(about.portrait ? { image: `${SITE_URL}${about.portrait.src}` } : {}),
        email: contact.email.href.replace(/^mailto:/, ""),
        sameAs: contact.links
          .map((link) => link.href)
          .filter((href) => href.startsWith("https://") || href.startsWith("http://")),
        ...(employer ? { worksFor: { "@type": "Organization", name: employer } } : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: site.location.locality,
          addressRegion: site.location.region,
          addressCountry: site.location.country,
        },
        // Flagged in content, not matched on a display string that will be renamed.
        knowsAbout: stack.groups
          .filter((group) => group.technologies)
          .flatMap((group) => group.items.map((item) => item.label)),
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      },
      ...projects.map((project) => ({
        "@type": "CreativeWork",
        "@id": `${SITE_URL}/#project-${project.slug}`,
        name: project.title,
        abstract: project.summary,
        // `undefined` drops the key rather than emitting a null.
        url: project.href,
        about: project.domain,
        creator: { "@id": personId },
        keywords: project.tags.join(", "),
      })),
    ],
  };
}

/**
 * Ready for `dangerouslySetInnerHTML`. Escaping `<` is required: a `</script>`
 * inside any content string would otherwise close the tag early, so this is
 * the one thing that must not be skipped.
 */
export function structuredData(pageUrl: string = SITE_URL): string {
  return JSON.stringify(graph(pageUrl)).replace(/</g, "\\u003c");
}
