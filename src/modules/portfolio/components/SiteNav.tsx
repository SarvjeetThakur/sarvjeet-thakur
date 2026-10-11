import Image from "next/image";
import { about, site } from "../content";
import { NavLinks } from "./NavLinks";

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30">
      {/* First tab stop on the page: four header controls precede the content. */}
      <a
        href="#main"
        className="pointer-events-auto sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-40 focus-visible:rounded-chip focus-visible:bg-accent focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-accent-fg"
      >
        {site.nav.skip}
      </a>
      {/* Fade so page content does not show through the gaps between the pills. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-2 h-24 bg-linear-to-b from-bg via-bg/85 to-transparent"
      />
      <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
        <a
          href="#top"
          aria-label={`${site.name} — ${site.role}`}
          className="flex min-h-11 items-center gap-2.5 rounded-chip border border-line bg-surface py-1 pr-3 pl-1 backdrop-blur-xl"
        >
          {about.portrait ? (
            <Image
              src={about.portrait.src}
              alt=""
              width={about.portrait.width}
              height={about.portrait.height}
              sizes="36px"
              quality={100}
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-8 place-items-center font-display text-sm font-bold tracking-tight">
              {site.initials}
            </span>
          )}
          <span className="hidden text-sm text-muted sm:inline">{site.role}</span>
        </a>
        <div className="ml-auto">
          <NavLinks label={site.nav.label} links={site.nav.links} />
        </div>
      </div>
    </header>
  );
}
