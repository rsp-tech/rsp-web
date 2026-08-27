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
          <div className="flex flex-col">
            <span className="about-sec-sub" style={{ textAlign: "left" }}>
              Empowering the Future
            </span>
            <h2 className="about-sec-title text-left mb-6">
              VOICE Leadership{" "}
              <span className="about-hand-underline">Initiative</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">
              <strong>VOICE</strong> (Vedic Oasis for Inspiration, Culture, and
              Education) is a dynamic platform designed to inspire leadership
              built on solid character, ethical values, and ancient principles.
            </p>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
              By establishing over <strong>100 centers worldwide</strong>, VOICE
              empowers youth, university researchers, and professionals to tap
              into their maximum potential, cultivate mental resilience, and
              build positive, values-driven communities that uplift society.
            </p>
            <div>
              <a href="#contact" className="about-btn about-btn-primary">
                <span>Learn More</span>
              </a>
            </div>
          </div>

          {/* Overlapping Collage */}
          <div className="relative flex flex-col items-center">
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
