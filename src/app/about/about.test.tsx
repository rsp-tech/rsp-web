import { describe, expect, it } from "vitest";
import { AboutHero } from "./about-hero";
import { AcademicCorporate } from "./academic-corporate";
import { ConsultationSection } from "./consultation-section";
import { ImpactStats } from "./impact-stats";
import { InitiativesGrid } from "./initiatives-grid";
import AboutPage from "./page";
import { PublicationsShowcase } from "./publications-showcase";
import { SpiritualJourneyTimeline } from "./spiritual-journey-timeline";
import { TestimonialsSlider } from "./testimonials-slider";
import { WhyInvite } from "./why-invite";
import { WorkshopsModules } from "./workshops-modules";

describe.concurrent("about page and section components suite", () => {
  it.concurrent("exports AboutPage and all about sections as valid components", () => {
    expect(typeof AboutPage).toBe("function");
    expect(typeof AboutHero).toBe("function");
    expect(typeof AcademicCorporate).toBe("function");
    expect(typeof ConsultationSection).toBe("function");
    expect(typeof ImpactStats).toBe("function");
    expect(typeof InitiativesGrid).toBe("function");
    expect(typeof PublicationsShowcase).toBe("function");
    expect(typeof SpiritualJourneyTimeline).toBe("function");
    expect(typeof TestimonialsSlider).toBe("function");
    expect(typeof WhyInvite).toBe("function");
    expect(typeof WorkshopsModules).toBe("function");
  });
});
