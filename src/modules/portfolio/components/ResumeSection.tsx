import Link from "next/link";
import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon, Reveal, Section } from "@/modules/shared";
import { resume, site } from "../content";

/**
 * Real HTML, not an embedded PDF: an iframe brings its own viewer chrome, is
 * unreadable on a phone, and hides from search engines the one thing you most
 * want indexed.
 */
export function ResumeSection() {
  const { index, heading } = site.sections.resume;

  return (
    <Section id="resume" index={index} heading={heading}>
      <div className="flex flex-col gap-12">
        <Reveal className="flex flex-col items-start gap-6">
          <p
            {...physicsProps(BodyKind.Card)}
            className="max-w-[58ch] text-lg leading-relaxed text-pretty text-muted"
          >
            {resume.summary}
          </p>
          <div className="flex flex-wrap gap-3">
            {/*
              The section below is the readable, indexable version. This is
              the one a human wants: the résumé as a document, on its own URL,
              which also prints to a clean PDF.
            */}
            <Link
              href={resume.viewHref}
              {...physicsProps(BodyKind.Chip)}
              className="group inline-flex min-h-12 items-center gap-2.5 rounded-chip bg-accent px-5 text-base font-medium text-accent-fg transition-shadow hover:shadow-glow"
            >
              <Icon name="fileText" className="size-4" />
              {resume.viewLabel}
            </Link>
            {resume.pdf ? (
              <a
                href={resume.pdf}
                download
                {...physicsProps(BodyKind.Chip)}
                className="group inline-flex min-h-12 items-center gap-2.5 rounded-chip border border-line-strong bg-surface px-5 text-base font-medium backdrop-blur-xl transition-[background-color,border-color] hover:border-accent hover:bg-surface-strong physics:bg-surface-solid physics:backdrop-blur-none"
              >
                <Icon name="download" className="size-4 text-accent-2" />
                {resume.downloadLabel}
              </a>
            ) : null}
          </div>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          <h3
            {...physicsProps(BodyKind.Title)}
            className="text-sm tracking-[0.18em] text-muted uppercase"
          >
            {resume.experienceHeading}
          </h3>
          <ol role="list" className="flex flex-col">
            {resume.experience.map((role) => (
              <li
                key={`${role.company}-${role.period}`}
                {...physicsProps(BodyKind.Card)}
                className="relative flex flex-col gap-3 border-l border-line py-6 pl-7 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden
                  className="absolute top-7.5 -left-[4.5px] size-2 rounded-full bg-accent-2 in-[li:first-child]:top-1.5"
                />
                <div className="flex flex-col gap-1">
                  <h4 className="font-display text-xl font-bold tracking-tight">{role.role}</h4>
                  <p className="text-sm text-muted">
                    {role.company} · {role.period} · {role.location}
                  </p>
                </div>
                <ul role="list" className="flex flex-col gap-2">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-pretty text-muted">
                      <Icon name="arrowRight" className="mt-1.5 size-3.5 shrink-0 text-accent-2" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.08} className="flex flex-col gap-4">
          <h3
            {...physicsProps(BodyKind.Title)}
            className="text-sm tracking-[0.18em] text-muted uppercase"
          >
            {resume.strengthsHeading}
          </h3>
          <ul role="list" className="grid gap-5 sm:grid-cols-2">
            {resume.strengths.map((strength) => (
              <li key={strength.label} {...physicsProps(BodyKind.Chip)} className="flex gap-3">
                <Icon name={strength.icon} className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{strength.label}</span>
                  <span className="text-pretty text-muted">{strength.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
