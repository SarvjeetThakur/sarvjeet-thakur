"use client";

import type { MouseEvent } from "react";
import { usePhysicsMode } from "@/modules/mode";
import { physicsActions } from "@/modules/physics";
import type { NavLink } from "../types";

/**
 * Section links. Ordinary anchors while reading; in physics mode they fly the
 * camera to that region instead of scrolling a page that no longer scrolls.
 */
export function NavLinks({ label, links }: { label: string; links: NavLink[] }) {
  const physics = usePhysicsMode();

  function onClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (!physics) return;
    event.preventDefault();
    physicsActions.flyTo(id);
  }

  return (
    <nav aria-label={label}>
      <ul
        role="list"
        className="flex items-center gap-0.5 rounded-chip border border-line bg-surface p-1 backdrop-blur-xl"
      >
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              onClick={(event) => onClick(event, link.id)}
              className={`min-h-11 items-center rounded-chip px-3 text-sm text-muted transition-colors hover:bg-surface-strong hover:text-fg ${
                // Five pills overflow a 390px screen; the minor one is still
                // reachable by scrolling to its section.
                link.minor ? "hidden sm:flex" : "flex"
              }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
