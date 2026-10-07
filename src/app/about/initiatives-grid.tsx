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
              <img
                src="https://lh3.googleusercontent.com/d/1VIFtHqP7296imNEjGvOnH0PX7uAkT0LR"
                alt="VOICE Group Sessions"
                width={800}
                height={600}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="about-collage-card-sub">
              <img
                src="https://lh3.googleusercontent.com/d/1YegKFccNvGmfrNRcIA2igOIGabafFMWd"
                alt="VOICE Class Activity"
                width={600}
                height={450}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
