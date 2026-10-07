import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const AboutHero = () => {
  return (
    <section className="about-hero-wrap">
      <div className="about-section-container">
        <div className="about-hero-grid">
          <div className="flex flex-col">
            {/* Mobile Portrait */}
            <div className="about-hero-mobile-avatar reveal-blur">
              <img
                src="https://lh3.googleusercontent.com/d/1O80a5yBfDyVcIcvN3xg4wQ5kC03quRt2"
                alt="Radheshyam Das"
                width={200}
                height={200}
              />
            </div>

            <p className="about-hero-tagline reveal-blur">
              Inspiring People. Strengthening Teams. Elevating Performance.
            </p>
            <h1
              className="about-hero-h1 reveal-blur"
              style={{ color: "white" }}
            >
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
            <div className="about-hero-btn-group reveal-3d">
              <Button asChild size="lg" className="about-btn about-btn-primary">
                <a href="#workshops">Explore Workshops</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="about-btn about-btn-outline bg-transparent"
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
