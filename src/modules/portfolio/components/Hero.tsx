import { BodyKind, physicsProps, regionProps } from "@/modules/physics";
import { Icon } from "@/modules/shared";
import { site } from "../content";
import { yearsSince } from "../lib/tenure";

const { greeting, headline, intro, actions, physicsNote, stats, scrollHint } = site.hero;

/* Module scope: resolved at build time. See `tenure.ts`. */
const YEARS = String(yearsSince(site.career.startDate));

export function Hero() {
  return (
    <div
      id="top"
      {...regionProps("top")}
      className="flex min-h-[100svh] flex-col justify-center gap-10 pt-28 pb-16 sm:gap-14"
    >
      <div className="flex flex-col items-start gap-7">
        <p className="flex items-center gap-2.5 rounded-chip border border-line bg-surface py-1.5 pr-4 pl-3 text-sm text-muted backdrop-blur-xl">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-open opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-status-open" />
          </span>
          {greeting}
        </p>

        {/* Name and role inside the h1: the poster line alone ranks for nothing. */}
        <h1 className="flex flex-col gap-4" {...physicsProps(BodyKind.Title)}>
          <span className="text-sm tracking-[0.18em] text-muted uppercase">
            {site.name} · {site.role}
          </span>
          <span className="font-display text-display font-bold">
            {headline.map((line, i) => (
              <span key={line} className={`block ${i === headline.length - 1 ? "text-muted" : ""}`}>
                {line}
              </span>
            ))}
          </span>
        </h1>

        <p className="max-w-[46ch] text-lg leading-relaxed text-pretty text-muted sm:text-xl">
          {intro}
        </p>

        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              /*
                Bodies, so the CTAs survive physics mode. The transition is
                narrowed for the same reason: one covering `transform` would
                fight the per-frame transform the engine writes.
              */
              {...physicsProps(BodyKind.Chip)}
              className={`group inline-flex min-h-12 items-center gap-2.5 rounded-chip px-6 text-base font-medium transition-[background-color,border-color,box-shadow] ${
                action.primary
                  ? "bg-accent text-accent-fg hover:shadow-glow"
                  : "border border-line-strong bg-surface text-fg backdrop-blur-xl hover:border-accent hover:bg-surface-strong physics:bg-surface-solid physics:backdrop-blur-none"
              }`}
            >
              {action.label}
              <Icon
                name={action.icon}
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </a>
          ))}
        </div>

        {/* The only place that says physics mode exists. Hidden once it is on. */}
        <p className="flex max-w-[52ch] items-start gap-2.5 text-sm text-pretty text-muted physics:hidden">
          <Icon name="pointer" className="mt-0.5 size-4 shrink-0 text-accent-2" />
          {physicsNote}
        </p>
      </div>

      <dl className="flex flex-wrap gap-x-10 gap-y-6 border-t border-line pt-8">
        {stats.map((stat) => (
          /* Value first in the DOM as well as visually; `order` broke that. */
          <div key={stat.label} className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="font-display text-3xl font-bold tracking-tight">
              {stat.value.replace("{years}", YEARS)}
            </dd>
          </div>
        ))}
      </dl>

      <p
        aria-hidden
        className="flex items-center gap-2 text-xs tracking-[0.2em] text-muted uppercase physics:hidden"
      >
        <span className="h-px w-10 bg-line-strong" />
        {scrollHint}
      </p>
    </div>
  );
}
