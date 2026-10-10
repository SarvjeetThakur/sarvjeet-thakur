import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon, Reveal, Section } from "@/modules/shared";
import { about, site } from "../content";

const SKILLS_HEADING_ID = "skills-heading";

export function AboutSection() {
  const { index, heading } = site.sections.about;

  return (
    <Section id="about" index={index} heading={heading}>
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Reveal className="flex flex-col gap-6">
          <p className="max-w-[34ch] font-display text-2xl leading-snug font-medium text-balance sm:text-3xl">
            {about.lead}
          </p>
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-[60ch] text-pretty text-muted">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h3 id={SKILLS_HEADING_ID} className="text-sm tracking-[0.18em] text-muted uppercase">
              {about.skillsHeading}
            </h3>
            <ul aria-labelledby={SKILLS_HEADING_ID} className="flex flex-wrap gap-2.5">
              {about.skills.map((skill) => (
                <li
                  key={skill.label}
                  {...physicsProps(BodyKind.Chip)}
                  className="inline-flex items-center gap-2 rounded-chip border border-line bg-surface px-3.5 py-2 text-sm backdrop-blur-xl transition-colors hover:border-accent hover:text-accent-2 physics:bg-surface-solid physics:backdrop-blur-none"
                >
                  <Icon name={skill.icon} className="size-4 text-accent-2" />
                  {skill.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm tracking-[0.18em] text-muted uppercase">{about.nowHeading}</h3>
            <ul className="flex flex-col gap-3">
              {about.now.map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-muted">
                  <Icon name={item.icon} className="mt-0.5 size-4 shrink-0 text-accent" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
