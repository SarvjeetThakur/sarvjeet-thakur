import Image from "next/image";
import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon } from "@/modules/shared";
import type { Project } from "../types";

type ProjectCardProps = {
  project: Project;
  /** Wide cards put the image beside the text instead of above it. */
  wide?: boolean;
};

export function ProjectCard({ project, wide = false }: ProjectCardProps) {
  const { title, summary, year, role, href, tags, metric, image } = project;

  return (
    <article
      {...physicsProps(BodyKind.Card)}
      /*
        `overflow-hidden` moved to the image wrapper: on the card it clipped
        the focus ring. The ring replaces a 1px border tint, which was the
        only focus indicator for the six most-used links on the page and was
        imperceptible on a translucent surface.
        In physics mode the surface goes opaque and the blur comes off: a
        backdrop filter on an element that gets a new transform every frame
        has to re-sample and re-blur on its own layer, every frame. The 4.5%
        white `--surface` only reads as glass *because* of that blur, so
        dropping the blur alone left the starfield showing through the card.
      */
      className={`group relative flex rounded-card border border-line bg-surface backdrop-blur-xl transition-colors duration-300 hover:border-line-strong has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent-2 has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-bg physics:bg-surface-solid physics:backdrop-blur-none ${
        wide ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden ${wide ? "md:w-1/2 md:rounded-l-card" : "rounded-t-card"}`}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={wide ? "(min-width: 768px) 32rem, 100vw" : "(min-width: 768px) 24rem, 100vw"}
          className={`w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
            wide ? "aspect-[16/10] md:h-full" : "aspect-[16/10]"
          }`}
        />
        <span className="absolute top-3 left-3 rounded-chip bg-bg/75 px-2.5 py-1 font-mono text-xs text-fg tabular-nums backdrop-blur-md">
          {year}
        </span>
      </div>

      <div className={`flex flex-1 flex-col gap-4 p-6 ${wide ? "md:justify-center md:p-9" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3
              className={`font-display font-bold tracking-tight ${wide ? "text-2xl sm:text-3xl" : "text-xl"}`}
            >
              {/* ::after makes the whole card the hit area */}
              {/* The ring on the article is the focus indicator, so the link
                  keeps its own outline suppressed. */}
              <a
                href={href}
                className="outline-none after:absolute after:inset-0 after:content-['']"
              >
                {title}
              </a>
            </h3>
            <p className="text-sm text-muted">{role}</p>
          </div>
          <Icon
            name="arrowUpRight"
            className="size-5 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-2"
          />
        </div>

        {/* `relative` lifts the prose above the link's full-card ::after
            overlay, so the card text can still be selected and copied. */}
        <p className="relative text-pretty text-muted">{summary}</p>

        <p className="relative flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-accent-2">{metric.value}</span>
          <span className="text-sm text-muted">{metric.label}</span>
        </p>

        <ul className="relative mt-auto flex flex-wrap gap-2 pt-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-chip border border-line px-2.5 py-1 font-mono text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
