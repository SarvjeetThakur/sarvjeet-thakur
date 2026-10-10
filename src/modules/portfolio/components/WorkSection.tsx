import { Reveal, Section } from "@/modules/shared";
import { projects, site } from "../content";
import { ProjectCard } from "./ProjectCard";

const featured = projects.filter((project) => project.featured);
const rest = projects.filter((project) => !project.featured);

export function WorkSection() {
  const { index, heading } = site.sections.work;

  return (
    <Section id="work" index={index} heading={heading}>
      <div className="flex flex-col gap-5 sm:gap-6">
        {featured.map((project, i) => (
          <Reveal key={project.slug} delay={i * 0.08}>
            <ProjectCard project={project} wide />
          </Reveal>
        ))}

        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          {rest.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 2) * 0.08} className="flex">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
