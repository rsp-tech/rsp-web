import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const AboutHero = () => {
  return (
    <section className="about-hero-wrap">
      <div className="about-section-container">
        <div className="about-hero-grid">
          <div className="flex flex-col">
            <p className="about-hero-tagline reveal-blur">
              Inspiring People. Strengthening Teams. Elevating Performance.
            </p>
            <h1 className="about-hero-h1 reveal-blur">
              Timeless wisdom
              <br />
              practical <span className="about-hero-highlight">impact.</span>
            </h1>
            <p className="about-hero-desc reveal-blur">
              Welcome to the official portal of <strong>Radheshyam Das</strong>,
              a leadership mentor, author, and speaker. Inspired to combine the
              profound wisdom of the Bhagavad Gita with practical tools that
              help individuals and organizations lead with clarity, resilience,
              and purpose.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 reveal-3d">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[var(--accent-vibrant)] hover:bg-[var(--accent-vibrant)]/90 text-white font-semibold uppercase tracking-widest text-xs h-12 px-8 shadow-md"
              >
                <a href="#workshops">Explore Workshops</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-white/40 text-white hover:bg-white hover:text-[var(--primary-dark)] font-semibold uppercase tracking-widest text-xs h-12 px-8 bg-transparent"
              >
                <Link href="/">
                  <span>Explore Discourses</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
