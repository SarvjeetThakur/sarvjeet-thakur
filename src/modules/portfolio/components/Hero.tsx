import { BodyKind, physicsProps, regionProps } from "@/modules/physics";
import { Icon } from "@/modules/shared";
import { about, site } from "../content";
import { yearsSince } from "../lib/tenure";
import { PortraitReveal } from "./PortraitReveal";

const { greeting, headline, intro, actions, physicsNote, stats } = site.hero;

/* Module scope: resolved at build time. See `tenure.ts`. */
const YEARS = String(yearsSince(site.career.startDate));

export function Hero() {
  return (
    <div
      id="top"
      {...regionProps("top")}
      className="flex min-h-[100svh] flex-col justify-center gap-12 pt-28 pb-16"
    >
      {/*
        A split: words on the left, the portrait on the right. The portrait is
        bottom-aligned so the solar system keeps the upper right to itself.
      */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16">
        <div className="flex flex-col items-start gap-8">
          <p className="flex items-center gap-2.5 rounded-chip border border-line bg-surface py-1.5 pr-4 pl-3 text-sm text-muted backdrop-blur-xl">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-open opacity-70 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-status-open" />
            </span>
            {greeting}
          </p>

          {/* Name and role inside the h1: the poster line alone ranks for nothing. */}
          <h1 className="flex flex-col gap-5" {...physicsProps(BodyKind.Title)}>
            <span className="text-sm tracking-[0.18em] text-muted uppercase">
              {site.name} · {site.role}
            </span>
            <span className="font-display text-hero font-bold">
              {headline.map((line, i) => (
                <span
                  key={line}
                  className={`block ${i === headline.length - 1 ? "text-muted" : ""}`}
                >
                  {line}
                </span>
              ))}
            </span>
          </h1>

          <p className="max-w-[44ch] text-lg leading-relaxed text-pretty text-muted">{intro}</p>

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
          <p className="flex max-w-[44ch] items-start gap-2.5 text-sm text-pretty text-muted physics:hidden">
            <Icon name="pointer" className="mt-0.5 size-4 shrink-0 text-accent-2" />
            {physicsNote}
          </p>
        </div>

        {about.portrait ? (
          <figure
            {...physicsProps(BodyKind.Card)}
            className="flex w-full max-w-[20rem] flex-col gap-3 lg:justify-self-end"
          >
            <PortraitReveal image={about.portrait} />
            <figcaption className="text-sm text-muted">
              {site.location.locality}, {site.location.region}
            </figcaption>
          </figure>
        ) : null}
      </div>

      <dl className="flex flex-wrap gap-x-12 gap-y-5 border-t border-line pt-6">
        {stats.map((stat) => (
          /* Value first in the DOM as well as visually; `order` broke that. */
          <div
            key={stat.label}
            {...physicsProps(BodyKind.Chip)}
            className="flex items-baseline gap-2.5"
          >
            <dd className="font-display text-2xl font-bold tracking-tight">
              {stat.value.replace("{years}", YEARS)}
            </dd>
            <dt className="text-sm text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
