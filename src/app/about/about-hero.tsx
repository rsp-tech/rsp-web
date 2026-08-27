import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const AboutHero = () => {
  return (
    <section className="about-hero-wrap">
      <div className="about-section-container">
        <div className="about-hero-grid">
          <div className="flex flex-col">
            <p className="about-hero-tagline">
              Inspiring People. Strengthening Teams. Elevating Performance.
            </p>
            <h1 className="about-hero-h1">
              Timeless wisdom
              <br />
              practical <span className="about-hero-highlight">impact.</span>
            </h1>
            <p className="about-hero-desc">
              Welcome to the official portal of <strong>Radheshyam Das</strong>,
              a leadership mentor, author, and speaker. Inspired to combine the
              profound wisdom of the Bhagavad Gita with practical tools that
              help individuals and organizations lead with clarity, resilience,
              and purpose.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#workshops" className="about-btn about-btn-primary">
                <span>Explore Workshops</span>
              </a>
              <Link href="/" className="about-btn about-btn-outline">
                <span>Explore Discourses</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
