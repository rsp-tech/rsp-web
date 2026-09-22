import { Button } from "@/components/ui/button";
import { SectionHeader } from "./section-header";

export const AcademicCorporate = () => {
  return (
    <div className="flex flex-col">
      {/* Universities Section */}
      <section
        className="about-section-pad"
        style={{ backgroundColor: "var(--bg-white)" }}
      >
        <div className="about-section-container">
          <div className="about-collage-grid">
            <div className="about-collage-card-main reveal-3d">
              <picture>
                <source
                  srcSet="/assets/about/university-session.avif"
                  type="image/avif"
                />
                <source
                  srcSet="/assets/about/university-session.webp"
                  type="image/webp"
                />
                <img
                  src="/assets/about/university-session.jpg"
                  alt="Academic Lectures at Universities"
                  width={800}
                  height={500}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
            </div>

            <div className="flex flex-col reveal-right">
              <SectionHeader
                subtitle="Inspiring Top Campuses"
                title="Academic"
                underlinedWord="Keynotes"
                align="left"
              />
              <p className="about-editorial-p">
                Bridging ancient logic with modern academic inquiry, Radheshyam
                Das has conducted highly received guest lectures and seminar
                series at world-class institutions including{" "}
                <strong>
                  MIT, Stanford, Harvard, Cornell, and top IITs & NITs
                </strong>{" "}
                across the globe.
              </p>
              <div className="about-academic-logos reveal-blur">
                {["mit", "harvard", "stanford", "cornell"].map((logo) => (
                  <picture>
                    <source srcSet={`/assets/about/logo-${logo}.avif`} type="image/avif" />
                    <img
                      src={`/assets/about/logo-${logo}.webp`}
                      alt={logo.toUpperCase()}
                      className="about-academic-logo-img"
                    />
                  </picture>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Seminars */}
      <section
        className="about-section-pad"
        style={{ backgroundColor: "var(--bg-stone)" }}
      >
        <div className="about-section-container">
          <div className="about-collage-grid about-reverse">
            <div className="flex flex-col reveal-left">
              <SectionHeader
                subtitle="Workplace Excellence"
                title="Corporate"
                underlinedWord="Seminars"
                align="left"
              />
              <p className="about-editorial-p">
                Helping executives and technical teams at{" "}
                <strong>
                  Infosys, Bank of America, Deutsche Bank, Tech Mahindra, and
                  John Deere
                </strong>{" "}
                develop resilient stress-mastery routines, ethical leadership
                frameworks, and clear decision-making processes.
              </p>
              <div>
                <Button
                  asChild
                  size="lg"
                  className="about-btn about-btn-primary"
                >
                  <a href="#workshops">View Workshops</a>
                </Button>
              </div>
            </div>

            <div className="about-collage-card-main reveal-3d">
              <picture>
                <source
                  srcSet="/assets/about/corporate-session.avif"
                  type="image/avif"
                />
                <source
                  srcSet="/assets/about/corporate-session.webp"
                  type="image/webp"
                />
                <img
                  src="/assets/about/corporate-session.jpg"
                  alt="Corporate Training Seminar"
                  width={800}
                  height={500}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
