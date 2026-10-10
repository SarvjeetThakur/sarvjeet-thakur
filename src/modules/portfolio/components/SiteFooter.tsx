import { BodyKind, physicsProps } from "@/modules/physics";
import { Icon } from "@/modules/shared";
import { site } from "../content";

/*
 * Read once at module load, deliberately. Reading the clock during render is
 * impure — `react(purity)` rejects it — and under `cacheComponents` it would
 * make this component dynamic, costing the page its static prerender for a
 * number that changes once a year. The page is prerendered at build time, so
 * the year is baked then; a build that straddles New Year needs a redeploy.
 */
const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-10 text-sm text-muted">
      <p>
        {site.name} · {YEAR}
      </p>
      <p className="hidden sm:block">{site.footer.note}</p>
      <a
        href="#top"
        // A body, so "back to top" is still reachable in physics mode.
        {...physicsProps(BodyKind.Chip)}
        className="inline-flex min-h-11 items-center gap-1.5 transition-colors hover:text-fg"
      >
        {site.footer.backToTop}
        <Icon name="arrowUpRight" className="size-3.5" />
      </a>
    </footer>
  );
}
