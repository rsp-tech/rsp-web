import { Button } from "@/components/ui/button";

export const AboutCharcoalBio = () => {
  return (
    <section className="about-charcoal-sec" id="about">
      <div className="about-section-container">
        <div className="about-charcoal-grid">
          {/* Clean Frameless Portrait */}
          <div className="about-charcoal-portrait reveal-3d">
            <img
              src="https://lh3.googleusercontent.com/d/1hrv0uQwTgPt69BMTessBqQIM3l-EaPdR"
              alt="Radheshyam Das Portrait"
              width={720}
              height={920}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Biography Content */}
          <div className="flex flex-col justify-center reveal-right">
            <h2
              className="about-charcoal-name font-heading"
              style={{ color: "white" }}
            >
              Radheshyam Das
            </h2>
            <span className="about-sec-sub" style={{ textAlign: "left" }}>
              IIT Bombay Alumnus • Leadership Mentor • Author
            </span>
            <p className="about-charcoal-text">
              For over 30 years, Radheshyam Das has dedicated his life to
              sharing transformative wisdom. Combining his educational
              background from <strong>IIT Bombay</strong> with deep Vedic
              research, he has successfully built values-based leadership
              initiatives worldwide.
            </p>
            <p className="about-charcoal-text">
              As the founding president of the{" "}
              <strong>VOICE Leadership Initiative</strong>, he has established
              100+ youth leadership centers, trained over 500+ full-time monk
              leaders, and guided thousands of individuals toward sustainable
              personal excellence, emotional resilience, and character-driven
              leadership.
            </p>

            <div className="about-charcoal-btn-group">
              <Button asChild size="lg" className="about-btn about-btn-primary">
                <a href="#initiatives">Key Initiatives</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="about-btn about-btn-outline bg-transparent"
              >
                <a href="#workshops">My Philosophy</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
