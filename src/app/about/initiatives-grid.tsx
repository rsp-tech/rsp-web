import { Button } from "@/components/ui/button";
import { SectionHeader } from "./section-header";

export const InitiativesGrid = () => {
  return (
    <section
      className="about-section-pad"
      id="initiatives"
      style={{ backgroundColor: "var(--bg-cream)" }}
    >
      <div className="about-section-container">
        <div className="about-collage-grid">
          {/* Info Block */}
          <div className="flex flex-col reveal-left">
            <SectionHeader
              subtitle="Empowering the Future"
              title="VOICE Leadership"
              underlinedWord="Initiative"
              align="left"
            />
            <p className="about-editorial-p mb-4">
              <strong>VOICE</strong> (Vedic Oasis for Inspiration, Culture, and
              Education) is a dynamic platform designed to inspire leadership
              built on solid character, ethical values, and ancient principles.
            </p>
            <p className="about-editorial-p">
              By establishing over <strong>100 centers worldwide</strong>, VOICE
              empowers youth, university researchers, and professionals to tap
              into their maximum potential, cultivate mental resilience, and
              build positive, values-driven communities that uplift society.
            </p>
            <div>
              <Button asChild size="lg" className="about-btn about-btn-primary">
                <a
                  href="#contact"
                  aria-label="Learn more about the VOICE leadership initiative"
                >
                  Learn More
                </a>
              </Button>
            </div>
          </div>

          {/* Overlapping Collage */}
          <div className="relative flex flex-col items-center reveal-right">
            <div className="about-collage-card-main">
              <picture>
                <source
                  srcSet="/assets/about/voice-leadership-main.avif"
                  type="image/avif"
                />
                <source
                  srcSet="/assets/about/voice-leadership-main.webp"
                  type="image/webp"
                />
                <img
                  src="/assets/about/voice-leadership-main.jpg"
                  alt="VOICE Group Sessions"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
            </div>
            <div className="about-collage-card-sub">
              <picture>
                <source
                  srcSet="/assets/about/voice-leadership-sub.avif"
                  type="image/avif"
                />
                <source
                  srcSet="/assets/about/voice-leadership-sub.webp"
                  type="image/webp"
                />
                <img
                  src="/assets/about/voice-leadership-sub.jpg"
                  alt="VOICE Class Activity"
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
