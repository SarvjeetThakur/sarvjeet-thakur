import { PhysicsStage } from "@/modules/physics";
import { Cursors } from "@/modules/presence";
import {
  AboutSection,
  ContactSection,
  ControlBar,
  Hero,
  ResumeSection,
  SiteFooter,
  site,
  SiteNav,
  StackSection,
  structuredData,
  WorkSection,
} from "@/modules/portfolio";
import { SpaceBackground } from "@/modules/space";

export default function Home() {
  return (
    <>
      {/* JSON-LD must be inline; structuredData() escapes `<` so content cannot close the tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData() }} />
      <SpaceBackground />
      <SiteNav />
      {/*
        bottom padding clears the fixed control bar.
        `physics:invisible` hides everything that is not a body; the engine
        sets `visibility: visible` back on each body, so the canvas shows only
        the physical objects without touching the DOM.
      */}
      <main
        id="main"
        aria-label={site.nav.mainLabel}
        className="mx-auto w-full max-w-6xl px-5 pb-28 sm:px-8 physics:invisible"
      >
        <Hero />
        <WorkSection />
        <StackSection />
        <AboutSection />
        <ResumeSection />
        <ContactSection />
        <SiteFooter />
      </main>
      {/* after the content so the input layer stacks above the bodies */}
      <PhysicsStage />
      <ControlBar />
      <Cursors />
    </>
  );
}
