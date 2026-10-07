import type { Metadata } from "next";
import { ArticleTracker } from "@/components/analytics/article-tracker";
import { AboutAnimator } from "./about-animator";
import { AboutCharcoalBio } from "./about-charcoal-bio";
import { AboutHero } from "./about-hero";
import { AcademicCorporate } from "./academic-corporate";
import { AuroraBackground } from "./aurora-background";
import { CommunityGallery } from "./community-gallery";
import { ConsultationSection } from "./consultation-section";
import { InitiativesGrid } from "./initiatives-grid";
import { LogoMarquee } from "./logo-marquee";
import { PublicationsShowcase } from "./publications-showcase";
import { TestimonialsSlider } from "./testimonials-slider";
import { WhyInvite } from "./why-invite";
import { WorkshopsModules } from "./workshops-modules";
import "./about-editorial.css";

export const metadata: Metadata = {
  title: "Radheshyam Das | Leadership Mentor, Author & Speaker",
  description:
    "Official portal of His Grace Radheshyam Das, M. Tech. IIT Bombay, Founder of VOICE Youth Initiative, Leadership Mentor, and Bestselling Author.",
  alternates: {
    canonical: "https://radheshyamdas.com/about",
  },
  openGraph: {
    title: "Radheshyam Das | Leadership Mentor, Author & Speaker",
    description:
      "Official portal of His Grace Radheshyam Das, M. Tech. IIT Bombay, Founder of VOICE Youth Initiative, Leadership Mentor, and Bestselling Author.",
    url: "https://radheshyamdas.com/about",
    type: "profile",
    images: [
      {
        url: "https://lh3.googleusercontent.com/d/1hrv0uQwTgPt69BMTessBqQIM3l-EaPdR",
        width: 720,
        height: 900,
        alt: "His Grace Radheshyam Das",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    name: "Radheshyam Das",
    alternateName: [
      "HG Radheshyam Das",
      "Radheshyam Das Brahmacari at NVCC Pune",
    ],
    description:
      "President of ISKCON NVCC Pune, Founder of VOICE Youth Initiative, Global Duty Officer for Youth Outreach, M. Tech. from IIT Bombay, and author of bestselling spiritual books.",
    image:
      "https://lh3.googleusercontent.com/d/1hrv0uQwTgPt69BMTessBqQIM3l-EaPdR",
    url: "https://radheshyamdas.com/about",
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Indian Institute of Technology Bombay (IIT Bombay)",
    },
    affiliation: [
      {
        "@type": "Organization",
        name: "ISKCON NVCC Pune",
      },
      {
        "@type": "Organization",
        name: "VOICE (Vedic Oasis for Inspiration, Culture and Education)",
      },
    ],
    knowsAbout: [
      "Bhagavad Gita",
      "Srimad Bhagavatam",
      "Vedic Leadership",
      "Time Management",
      "Spiritual Quotient (SQ)",
      "Youth Mentorship",
    ],
    sameAs: [
      "https://www.youtube.com/@RadheshyamDasDevotionalvideos",
      "https://www.linkedin.com/in/radheshyamdasofficial/",
      "https://www.facebook.com/radheshyamdasofficial",
      "https://instagram.com/radheshyamdasofficial",
    ],
  },
};

const AboutPage = () => {
  return (
    <div className="about-page-root">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Validated JSON-LD Schema
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 3D Floating Aurora Glow Background */}
      <AuroraBackground />

      {/* Interactive Scroll & 3D Tilt Animator */}
      <AboutAnimator />

      {/* 1. Hero Section */}
      <AboutHero />

      {/* 2. Logo Marquee */}
      <LogoMarquee />

      {/* 3. Charcoal Bio Section */}
      <AboutCharcoalBio />

      {/* 4. VOICE Initiative Overlapping Collage */}
      <InitiativesGrid />

      {/* 5. Academic & Corporate Presence */}
      <AcademicCorporate />

      {/* 6. Curated Keynotes & Workshops */}
      <WorkshopsModules />

      {/* 7. Why Organizations Invite Him */}
      <WhyInvite />

      {/* 8. Bestselling Books Showcase */}
      <PublicationsShowcase />

      {/* 9. Endorsements & Testimonials Carousel */}
      <TestimonialsSlider />

      {/* 10. Community Photostrips */}
      <CommunityGallery />

      {/* 11. Schedule a Conversation & Consultation */}
      <ConsultationSection />

      {/* Analytics */}
      <ArticleTracker
        contentProps={{
          slug: "about",
          title: "About Radheshyam Das",
          category: "About",
          tags: [
            "Biography",
            "Radheshyam Das",
            "VOICE",
            "Leadership",
            "Keynotes",
          ],
        }}
        style={{ backgroundColor: "var(--bg-white)" }}
      />
    </div>
  );
};

export default AboutPage;
