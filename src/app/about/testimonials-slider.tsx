"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "./section-header";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Ms. Pramela",
    role: "HR Manager",
    company: "Zensar Technologies",
    quote:
      "We found the workshop very effective because it not only highlighted the common causes & symptoms of stress but also gave us profound insights into practical techniques for managing stress with inner clarity.",
    avatar: "179TG2paG6nQwCaDyPXndU4dDycCFGh-z",
  },
  {
    name: "M. Krishna",
    role: "Managing Director",
    company: "Concentric Pumps India",
    quote:
      "The presentation was deeply scientific and demonstrated how Vedic knowledge is immensely relevant in modern times more than ever before. I strongly recommend that corporate leaders take full advantage of these seminars.",
    avatar: "1RmqNj7b_0meaXjTnSqydGovH7-1kuNW4",
  },
  {
    name: "Ajay Chandak",
    role: "Senior Project Manager",
    company: "Tech Mahindra",
    quote:
      "I have been greatly benefited and I feel more empowered to deal with crisis situations in a stress-free, resilient manner.",
    avatar: "1CliJk38D1_s_1uxMihvT9Yc3srLdwFni",
  },
  {
    name: "Kiran Shekarappa",
    role: "Lead Engineer",
    company: "John Deere (Competency & Labs)",
    quote:
      "I found the seminars by Leaders VOICE to be very intriguing and practical. It’s fascinating how profound ancient knowledge is directly applicable for a working professional. The mantra meditation practice has significantly improved my focus.",
    avatar: "1DNJX72F4YXENN1Sv7bDpmRwKUbBh5COD",
  },
  {
    name: "Aishwarya Upadhyay",
    role: "Machine Learning Engineer",
    company: "Infosys",
    quote:
      "Leaders VOICE sessions have helped me see reversals of life in a much broader, positive perspective. My outlook on my personal life and work life has tremendously improved due to the videos and books of Radheshyam Das.",
    avatar: "1fkHvtEzfx3GoHCONpcP40fc5Ogd-rehl",
  },
];

export const TestimonialsSlider = () => {
  const [index, setIndex] = useState(0);

  const prev = () =>
    setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () =>
    setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  const t = testimonials[index];

  return (
    <section
      className="about-section-pad"
      style={{ backgroundColor: "var(--bg-cream)" }}
    >
      <div className="about-section-container">
        <SectionHeader
          subtitle="Endorsements"
          title="What Leaders"
          underlinedWord="Say"
        />

        <div className="about-testimonial-wrap reveal-blur">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="about-testimonial-avatar">
              <img
                src={`https://lh3.googleusercontent.com/d/${t.avatar}`}
                alt={t.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Quote */}
            <p className="about-testimonial-quote text-foreground max-w-2xl">
              "{t.quote}"
            </p>

            {/* Meta */}
            <h4 className="text-lg font-bold text-foreground font-heading">
              {t.name}
            </h4>
            <span className="text-xs sm:text-sm font-semibold about-text-gold-dark">
              {t.role} • {t.company}
            </span>
          </div>

          {/* Prev/Next buttons */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="about-testimonial-nav-btn"
            style={{ left: 0 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="about-testimonial-nav-btn"
            style={{ right: 0 }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2" style={{ marginTop: 32 }}>
            {testimonials.map((item, i) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Testimonial ${i + 1}`}
                className="about-testimonial-dot"
                style={{
                  width: i === index ? "32px" : "8px",
                  backgroundColor:
                    i === index
                      ? "var(--accent-gold)"
                      : "var(--accent-gold-light)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
