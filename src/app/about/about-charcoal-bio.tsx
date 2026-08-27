export const AboutCharcoalBio = () => {
  return (
    <section className="about-charcoal-sec" id="about">
      <div className="about-section-container">
        <div className="about-charcoal-grid">
          {/* Gold Framed Portrait */}
          <div className="about-gold-frame">
            <picture>
              <source
                srcSet="/assets/about/about-profile.avif"
                type="image/avif"
              />
              <source
                srcSet="/assets/about/about-profile.webp"
                type="image/webp"
              />
              <img
                src="/assets/about/about-profile.jpg"
                alt="Radheshyam Das Portrait"
                width={720}
                height={920}
                className="w-full h-full object-cover rounded-sm"
                loading="lazy"
              />
            </picture>
          </div>

          {/* Biography Content */}
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl sm:text-5xl font-light font-heading text-white mb-2">
              Radheshyam Das
            </h2>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#C2A383] mb-6">
              IIT Bombay Alumnus • Leadership Mentor • Author
            </span>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-5">
              For over 30 years, Radheshyam Das has dedicated his life to
              sharing transformative wisdom. Combining his educational
              background from <strong>IIT Bombay</strong> with deep Vedic
              research, he has successfully built values-based leadership
              initiatives worldwide.
            </p>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-6">
              As the founding president of the{" "}
              <strong>VOICE Leadership Initiative</strong>, he has established
              100+ youth leadership centers, trained over 500+ full-time monk
              leaders, and guided thousands of individuals toward sustainable
              personal excellence, emotional resilience, and character-driven
              leadership.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#initiatives" className="about-btn about-btn-primary">
                <span>Key Initiatives</span>
              </a>
              <a href="#workshops" className="about-btn about-btn-outline">
                <span>My Philosophy</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
