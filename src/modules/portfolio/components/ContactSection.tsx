import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon, Reveal, Section } from "@/modules/shared";
import { contact, site } from "../content";

export function ContactSection() {
  const { index, heading } = site.sections.contact;

  return (
    <Section id="contact" index={index} heading={heading}>
      <div className="flex flex-col gap-10">
        <Reveal className="flex flex-col gap-5">
          <p className="max-w-[20ch] font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
            {contact.lead}
          </p>
          <p className="max-w-[52ch] text-pretty text-muted">{contact.body}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <a
            href={contact.email.href}
            {...physicsProps(BodyKind.Card)}
            /*
              `transition-all` includes `transform`, and the engine writes a
              new transform to this element every frame in physics mode: the
              browser restarted a 150ms transform transition 60 times a second
              and the card smeared behind its own body.
            */
            className="group inline-flex max-w-full items-center gap-3 rounded-card border border-line bg-surface px-6 py-5 backdrop-blur-xl transition-[border-color,box-shadow] hover:border-accent hover:shadow-glow physics:bg-surface-solid physics:backdrop-blur-none"
          >
            <Icon name={contact.email.icon} className="size-5 shrink-0 text-accent-2" />
            <span className="truncate font-display text-lg font-medium sm:text-2xl">
              {contact.email.label}
            </span>
            <Icon
              name="arrowUpRight"
              className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </Reveal>

        <Reveal delay={0.16}>
          <ul className="grid gap-3 sm:grid-cols-3">
            {contact.links.map((link) => (
              <li key={link.href} className="flex">
                <a
                  href={link.href}
                  {...physicsProps(BodyKind.Chip)}
                  className="group flex min-h-11 flex-1 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 backdrop-blur-xl transition-colors hover:border-accent physics:bg-surface-solid physics:backdrop-blur-none"
                >
                  <Icon name={link.icon} className="size-4 shrink-0 text-accent-2" />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{link.label}</span>
                    <span className="truncate text-sm text-muted">{link.value}</span>
                  </span>
                  <Icon
                    name="arrowUpRight"
                    className="ml-auto size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
