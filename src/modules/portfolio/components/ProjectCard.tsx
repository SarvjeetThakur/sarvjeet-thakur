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
  const { slug, title, summary, domain, role, href, tags, metric, image } = project;
  const headingId = `project-${slug}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      {...physicsProps(BodyKind.Card)}
      /*
        `overflow-hidden` belongs on the image wrapper: on the card it clips
        the focus ring. In physics mode the surface goes opaque as well as
        unblurred, because `--surface` is 4.5% white and only reads as glass
        thanks to the blur.
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
          /*
            Both cards render at ~34rem inside the 68rem container — a wide
            card's image is half of it, a grid card is half minus the gap.
            Understating this made the browser pick a 384px source for a
            530px slot and upscale it.
          */
          sizes="(min-width: 768px) 34rem, 100vw"
          quality={100}
          className={`w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none ${
            wide ? "aspect-16/10 md:h-full" : "aspect-16/10"
          }`}
        />
        <span className="absolute top-3 left-3 rounded-chip bg-bg/75 px-2.5 py-1 font-mono text-xs text-fg backdrop-blur-md">
          {domain}
        </span>
      </div>

      <div className={`flex flex-1 flex-col gap-4 p-6 ${wide ? "md:justify-center md:p-9" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3
              id={headingId}
              className={`font-display font-bold tracking-tight ${wide ? "text-2xl sm:text-3xl" : "text-xl"}`}
            >
              {/* Unlinked projects are plain articles: no focus target, no arrow. */}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="outline-none after:absolute after:inset-0 after:content-['']"
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </h3>
            <p className="text-sm text-muted">{role}</p>
          </div>
          {href ? (
            <Icon
              name="arrowUpRight"
              className="size-5 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-2"
            />
          ) : null}
        </div>

        {/* `relative` lifts the prose above the link overlay so it stays selectable. */}
        <p className="relative text-pretty text-muted">{summary}</p>

        <p className="relative flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-xl font-bold text-accent-2">{metric.value}</span>
          <span className="text-sm text-muted">{metric.label}</span>
        </p>

        <ul role="list" className="relative mt-auto flex flex-wrap gap-2 pt-2">
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
