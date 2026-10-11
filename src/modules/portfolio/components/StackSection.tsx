import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon, Reveal, Section } from "@/modules/shared";
import { site, stack } from "../content";

export function StackSection() {
  const { index, heading } = site.sections.stack;

  return (
    <Section id="stack" index={index} heading={heading}>
      <div className="flex flex-col gap-12">
        <Reveal>
          <p
            {...physicsProps(BodyKind.Card)}
            className="max-w-[46ch] text-lg leading-relaxed text-pretty text-muted"
          >
            {stack.lead}
          </p>
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {stack.groups.map((group, i) => {
            const headingId = `stack-${group.label.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              // Staggered by column rather than by index, so a row of cards
              // does not cascade from one side of the screen to the other.
              <Reveal key={group.label} delay={(i % 3) * 0.08} className="flex flex-col gap-4">
                <h3
                  id={headingId}
                  {...physicsProps(BodyKind.Chip)}
                  className="flex items-center gap-2.5 text-sm tracking-[0.18em] text-muted uppercase"
                >
                  <Icon name={group.icon} className="size-4 text-accent-2" />
                  {group.label}
                </h3>
                <ul role="list" aria-labelledby={headingId} className="flex flex-wrap gap-2.5">
                  {group.items.map((item) => (
                    <li
                      key={item.label}
                      {...physicsProps(BodyKind.Chip)}
                      className="inline-flex items-center gap-2 rounded-chip border border-line bg-surface px-3 py-1.5 text-sm backdrop-blur-xl physics:bg-surface-solid physics:backdrop-blur-none"
                    >
                      <Icon name={item.icon} className="size-3.5 text-muted" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
