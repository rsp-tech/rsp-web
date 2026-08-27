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
            <div className="about-collage-card-main">
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

            <div className="flex flex-col">
              <span className="about-sec-sub" style={{ textAlign: "left" }}>
                Inspiring Top Campuses
              </span>
              <h2 className="about-sec-title text-left mb-6">
                Academic <span className="about-hand-underline">Keynotes</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
                Bridging ancient logic with modern academic inquiry, Radheshyam
                Das has conducted highly received guest lectures and seminar
                series at world-class institutions including{" "}
                <strong>
                  MIT, Stanford, Harvard, Cornell, and top IITs & NITs
                </strong>{" "}
                across the globe.
              </p>
              <div className="flex flex-wrap gap-6 items-center opacity-70 grayscale hover:grayscale-0 transition-all">
                <img
                  src="/assets/about/logo-mit.png"
                  alt="MIT"
                  className="h-7 w-auto dark:invert"
                />
                <img
                  src="/assets/about/logo-harvard.png"
                  alt="Harvard"
                  className="h-7 w-auto dark:invert"
                />
                <img
                  src="/assets/about/logo-stanford.png"
                  alt="Stanford"
                  className="h-7 w-auto dark:invert"
                />
                <img
                  src="/assets/about/logo-cornell.png"
                  alt="Cornell"
                  className="h-7 w-auto dark:invert"
                />
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
          <div className="about-collage-grid">
            <div className="flex flex-col order-2 lg:order-1">
              <span className="about-sec-sub" style={{ textAlign: "left" }}>
                Workplace Excellence
              </span>
              <h2 className="about-sec-title text-left mb-6">
                Corporate <span className="about-hand-underline">Seminars</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
                Helping executives and technical teams at{" "}
                <strong>
                  Infosys, Bank of America, Deutsche Bank, Tech Mahindra, and
                  John Deere
                </strong>{" "}
                develop resilient stress-mastery routines, ethical leadership
                frameworks, and clear decision-making processes.
              </p>
              <div>
                <a href="#workshops" className="about-btn about-btn-primary">
                  <span>View Workshops</span>
                </a>
              </div>
            </div>

            <div className="about-collage-card-main order-1 lg:order-2">
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
