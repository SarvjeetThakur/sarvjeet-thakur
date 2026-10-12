"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import type { ContentImage } from "../types";

/**
 * The hero portrait: the subject cut out of its background, standing on the
 * page itself with a single orbit ring behind it rather than sitting in a
 * card. The ring is the page's own motif — the starfield's orbits — at the
 * one size a person can overlap, which is what separates the figure from the
 * sky without a frame around it.
 *
 * Colour appears only in a circle around the pointer: two copies of one
 * image, the grey one underneath and the colour one behind a radial mask.
 * The pointer position goes straight into CSS variables, never React state,
 * so moving it repaints the mask without re-rendering anything. Where there
 * is no hover there is nothing to reveal with, so touch gets colour outright.
 */
export function PortraitReveal({ image }: { image: ContentImage }) {
  function track(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
  }

  const portrait = "absolute inset-0 size-full object-contain object-bottom";

  return (
    <div onPointerMove={track} className="group/portrait relative">
      {/* Decorative, and sized off the figure so it tracks every breakpoint. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-[3%] left-1/2 aspect-square w-[86%] -translate-x-1/2 rounded-full border border-accent/45" />
        <div className="absolute top-[8%] left-1/2 aspect-square w-[62%] -translate-x-1/2 rounded-full bg-accent/12 blur-3xl" />
      </div>

      {/*
        The source photo ends at the waist, so without this the figure is
        sliced off by a hard horizontal edge; the fade lets it dissolve into
        the page instead.
      */}
      <div className="relative aspect-[421/517] [mask-image:linear-gradient(to_bottom,#000_78%,transparent_99%)]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="22rem"
          // Above the fold on desktop, and served exactly as supplied.
          loading="eager"
          unoptimized
          className={`${portrait} [@media(hover:hover)]:grayscale`}
        />
        {/* Same file, so no second download. Decorative: the copy above is the one announced. */}
        <Image
          src={image.src}
          alt=""
          aria-hidden
          fill
          sizes="22rem"
          unoptimized
          className={`${portrait} hidden [mask-image:radial-gradient(circle_11rem_at_var(--spot-x,50%)_var(--spot-y,50%),#000_30%,transparent)] opacity-0 transition-opacity duration-300 group-hover/portrait:opacity-100 [@media(hover:hover)]:block`}
        />
      </div>
    </div>
  );
}
