import type { ReactNode } from "react";
import { BodyKind, physicsProps, regionProps } from "@/modules/physics";
import { Reveal } from "./Reveal";

type SectionProps = {
  id: string;
  /** Small label above the heading. */
  index: string;
  heading: string;
  children: ReactNode;
};

export function Section({ id, index, heading, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      {...regionProps(id)}
      className="scroll-mt-24 border-t border-line py-20 sm:py-28"
    >
      <Reveal className="mb-10 flex items-baseline gap-4 sm:mb-14">
        <span className="font-mono text-sm text-accent-2 tabular-nums">{index}</span>
        <h2
          id={headingId}
          className="font-display text-section font-bold"
          {...physicsProps(BodyKind.Title)}
        >
          {heading}
        </h2>
      </Reveal>
      {children}
    </section>
  );
}
