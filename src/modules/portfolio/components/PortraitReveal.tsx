"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import type { ContentImage } from "../types";

/**
 * A monochrome portrait that shows its colour only in a soft circle around
 * the pointer. Two copies of one image: the grey one underneath, the colour
 * one on top behind a radial mask that follows the cursor.
 *
 * The position goes straight into CSS variables, never React state, so
 * moving the pointer repaints the mask without re-rendering anything. Where
 * there is no hover (touch), there is nothing to reveal with, so the portrait
 * is simply in colour.
 */
export function PortraitReveal({ image }: { image: ContentImage }) {
  function track(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
  }

  return (
    <div
      onPointerMove={track}
      className="group/portrait relative aspect-[4/5] overflow-hidden rounded-card bg-surface-solid shadow-lift"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="20rem"
        // Above the fold on desktop, and served exactly as supplied.
        loading="eager"
        unoptimized
        className="object-cover object-[50%_15%] [@media(hover:hover)]:grayscale"
      />
      {/* Same file, so no second download. Decorative: the copy below is the one announced. */}
      <Image
        src={image.src}
        alt=""
        aria-hidden
        fill
        sizes="20rem"
        unoptimized
        className="hidden [mask-image:radial-gradient(circle_11rem_at_var(--spot-x,50%)_var(--spot-y,50%),#000_30%,transparent)] object-cover object-[50%_15%] opacity-0 transition-opacity duration-300 group-hover/portrait:opacity-100 [@media(hover:hover)]:block"
      />
    </div>
  );
}
