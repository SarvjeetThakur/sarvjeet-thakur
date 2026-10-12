import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  about,
  contact,
  OG_IMAGE,
  projects,
  resume,
  site,
  SITE_URL,
  stack,
  structuredData,
} from "@/modules/portfolio";
import { Icon } from "@/modules/shared";

/**
 * The résumé as a document, on its own URL: one column, paper proportions, a
 * print stylesheet. Reads the same content files as the home page, so the two
 * cannot disagree, and the downloadable PDF is generated from this page.
 */
const RESUME_URL = `${SITE_URL}/resume`;

/*
 * Without this the route inherits the layout's Open Graph, so `og:url` points
 * at the home page while the canonical says `/resume`. A nested metadata
 * field is replaced wholesale, so `siteName` and `locale` must be restated.
 */
export const metadata: Metadata = {
  title: resume.metaTitle,
  description: resume.metaDescription,
  alternates: { canonical: "/resume" },
  openGraph: {
    type: "profile",
    url: "/resume",
    siteName: site.name,
    locale: site.language,
    title: resume.metaTitle,
    description: resume.metaDescription,
    images: [{ ...OG_IMAGE, alt: site.meta.ogAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: resume.metaTitle,
    description: resume.metaDescription,
    images: [{ ...OG_IMAGE, alt: site.meta.ogAlt }],
  },
};

function Rule({ children }: { children: string }) {
  return (
    <h2 className="mb-4 border-b border-line pb-2 text-sm tracking-[0.18em] text-accent-2 uppercase">
      {children}
    </h2>
  );
}

export default function ResumePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData(RESUME_URL) }}
      />
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16 print:max-w-none print:p-0">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
          >
            <Icon name="arrowRight" className="size-4 rotate-180" />
            {resume.backLabel}
          </Link>
          {resume.pdf ? (
            <a
              href={resume.pdf}
              download
              className="inline-flex min-h-11 items-center gap-2.5 rounded-chip bg-accent px-5 text-sm font-medium text-accent-fg transition-shadow hover:shadow-glow"
            >
              <Icon name="download" className="size-4" />
              {resume.downloadLabel}
            </a>
          ) : null}
        </div>

        <article className="flex flex-col gap-10 rounded-card border border-line bg-surface p-7 sm:p-11 print:gap-7 print:rounded-none print:border-0 print:bg-transparent print:p-0">
          <header className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {site.name}
              </h1>
              <p className="text-lg text-muted">{site.role}</p>
              <ul role="list" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <li>
                  <a
                    href={contact.email.href}
                    className="inline-flex items-center gap-2 hover:text-accent-2"
                  >
                    <Icon name={contact.email.icon} className="size-3.5 text-accent-2" />
                    {contact.email.label}
                  </a>
                </li>
                {/* The download is the header button; this would link to itself. */}
                {contact.links
                  .filter((link) => link.href !== resume.pdf)
                  .map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 hover:text-accent-2"
                      >
                        <Icon name={link.icon} className="size-3.5 text-accent-2" />
                        {link.label}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
            {about.portrait ? (
              <Image
                src={about.portrait.src}
                alt=""
                width={about.portrait.width}
                height={about.portrait.height}
                sizes="112px"
                // Served exactly as supplied: no re-encode, no quality loss.
                unoptimized
                className="size-24 shrink-0 rounded-full border border-line object-cover sm:size-28"
              />
            ) : null}
          </header>

          <section>
            <Rule>{resume.summaryHeading}</Rule>
            <p className="text-pretty text-muted">{resume.summary}</p>
          </section>

          <section>
            <Rule>{resume.experienceHeading}</Rule>
            <ol role="list" className="flex flex-col gap-7">
              {resume.experience.map((role) => (
                <li
                  key={`${role.company}-${role.period}`}
                  className="flex break-inside-avoid flex-col gap-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-display text-lg font-bold tracking-tight">{role.role}</h3>
                    <p className="font-mono text-xs text-muted">{role.period}</p>
                  </div>
                  <p className="text-sm text-accent-2">
                    {role.company} · {role.location}
                  </p>
                  <ul role="list" className="mt-1 flex flex-col gap-1.5">
                    {role.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2.5 text-pretty text-muted">
                        <span
                          aria-hidden
                          className="mt-2 size-1 shrink-0 rounded-full bg-accent-2"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <Rule>{resume.projectsHeading}</Rule>
            <ol role="list" className="flex flex-col gap-6">
              {projects.map((project) => (
                <li key={project.slug} className="flex break-inside-avoid flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="font-display text-lg font-bold tracking-tight">
                      {project.title}
                    </h3>
                    <span className="font-mono text-xs text-muted">{project.domain}</span>
                    {project.href ? (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-accent-2 hover:underline"
                      >
                        {project.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    ) : null}
                  </div>
                  <p className="text-sm text-accent-2">{project.role}</p>
                  <p className="text-pretty text-muted">{project.summary}</p>
                  <p className="font-mono text-xs text-muted">{project.tags.join(" · ")}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="break-inside-avoid">
            <Rule>{resume.skillsHeading}</Rule>
            <dl className="flex flex-col gap-3">
              {stack.groups.map((group) => (
                <div key={group.label} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{group.label}</dt>
                  <dd className="text-pretty text-muted">
                    {group.items.map((item) => item.label).join(" · ")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="break-inside-avoid">
            <Rule>{about.domainsHeading}</Rule>
            <ul role="list" className="flex flex-col gap-2">
              {about.domains.map((domain) => (
                <li key={domain.label} className="text-pretty text-muted">
                  <span className="font-medium text-fg">{domain.label}</span> — {domain.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="break-inside-avoid">
            <Rule>{resume.strengthsHeading}</Rule>
            <ul role="list" className="grid gap-4 sm:grid-cols-2">
              {resume.strengths.map((strength) => (
                <li key={strength.label} className="flex flex-col gap-0.5">
                  <span className="font-medium">{strength.label}</span>
                  <span className="text-pretty text-muted">{strength.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>
    </>
  );
}
