import Image from "next/image";
import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon, Reveal, Section } from "@/modules/shared";
import { about, site } from "../content";

const DOMAINS_HEADING_ID = "domains-heading";

export function AboutSection() {
  const { index, heading } = site.sections.about;

  return (
    <Section id="about" index={index} heading={heading}>
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Reveal className="flex flex-col gap-6">
          <p
            {...physicsProps(BodyKind.Card)}
            className="max-w-[34ch] font-display text-2xl leading-snug font-medium text-balance sm:text-3xl"
          >
            {about.lead}
          </p>
          {about.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              {...physicsProps(BodyKind.Card)}
              className="max-w-[60ch] text-pretty text-muted"
            >
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-10">
          {about.portrait ? (
            <div
              {...physicsProps(BodyKind.Card)}
              className="overflow-hidden rounded-card border border-line bg-surface"
            >
              <Image
                src={about.portrait.src}
                alt={about.portrait.alt}
                width={about.portrait.width}
                height={about.portrait.height}
                sizes="(min-width: 1024px) 24rem, 100vw"
                // Served exactly as supplied: no re-encode, no quality loss.
                unoptimized
                className="w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            <h3
              id={DOMAINS_HEADING_ID}
              {...physicsProps(BodyKind.Title)}
              className="text-sm tracking-[0.18em] text-muted uppercase"
            >
              {about.domainsHeading}
            </h3>
            <ul role="list" aria-labelledby={DOMAINS_HEADING_ID} className="flex flex-col gap-5">
              {about.domains.map((domain) => (
                <li
                  key={domain.label}
                  {...physicsProps(BodyKind.Chip)}
                  className="flex items-start gap-3"
                >
                  <Icon name={domain.icon} className="mt-1 size-4 shrink-0 text-accent" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{domain.label}</span>
                    <span className="text-pretty text-muted">{domain.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
