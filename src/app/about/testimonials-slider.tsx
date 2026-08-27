"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    avatar: "/assets/about/client-pramela",
  },
  {
    name: "M. Krishna",
    role: "Managing Director",
    company: "Concentric Pumps India",
    quote:
      "The presentation was deeply scientific and demonstrated how Vedic knowledge is immensely relevant in modern times more than ever before. I strongly recommend that corporate leaders take full advantage of these seminars.",
    avatar: "/assets/about/client-krishna",
  },
  {
    name: "Ajay Chandak",
    role: "Senior Project Manager",
    company: "Tech Mahindra",
    quote:
      "I have been greatly benefited and I feel more empowered to deal with crisis situations in a stress-free, resilient manner.",
    avatar: "/assets/about/client-chandak",
  },
  {
    name: "Kiran Shekarappa",
    role: "Lead Engineer",
    company: "John Deere (Competency & Labs)",
    quote:
      "I found the seminars by Leaders VOICE to be very intriguing and practical. It’s fascinating how profound ancient knowledge is directly applicable for a working professional. The mantra meditation practice has significantly improved my focus.",
    avatar: "/assets/about/client-kiran",
  },
  {
    name: "Aishwarya Upadhyay",
    role: "Machine Learning Engineer",
    company: "Infosys",
    quote:
      "Leaders VOICE sessions have helped me see reversals of life in a much broader, positive perspective. My outlook on my personal life and work life has tremendously improved due to the videos and books of Radheshyam Das.",
    avatar: "/assets/about/client-aishwarya",
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

        <div className="max-w-3xl mx-auto relative px-4 sm:px-16 reveal-blur">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xl border-4 border-white mb-6 bg-muted">
              <picture>
                <source srcSet={`${t.avatar}.avif`} type="image/avif" />
                <source srcSet={`${t.avatar}.webp`} type="image/webp" />
                <img
                  src={`${t.avatar}.jpg`}
                  alt={t.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
            </div>

            {/* Quote */}
            <p className="text-lg sm:text-xl font-normal text-foreground leading-relaxed italic mb-6 max-w-2xl">
              "{t.quote}"
            </p>

            {/* Meta */}
            <h4 className="text-lg font-bold text-foreground font-heading">
              {t.name}
            </h4>
            <span className="text-xs sm:text-sm font-semibold text-[var(--accent-gold-dark)]">
              {t.role} • {t.company}
            </span>
          </div>

          {/* Prev/Next buttons */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={prev}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-border bg-background/80 hover:bg-background shadow-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={next}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-border bg-background/80 hover:bg-background shadow-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((item, i) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === index
                    ? "w-8 bg-[var(--accent-gold)]"
                    : "w-2 bg-muted hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
