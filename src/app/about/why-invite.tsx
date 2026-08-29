import { ShieldCheck, Sparkles, Target } from "lucide-react";
import { SectionHeader } from "./section-header";

export const WhyInvite = () => {
  return (
    <section
      className="about-section-pad"
      style={{ backgroundColor: "var(--bg-white)" }}
    >
      <div className="about-section-container">
        <div className="about-why-grid">
          {/* Feature List */}
          <div className="flex flex-col gap-8 reveal-left">
            <SectionHeader
              subtitle="Distinct Value"
              title="Why Organizations"
              underlinedWord="Invite Him"
              align="left"
            />

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="about-icon-badge">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="about-invite-heading font-heading">
                    Ancient Wisdom Meets Modern Relevance
                  </h4>
                  <p className="about-invite-desc">
                    Rooted in classical Vedic texts and structured through the
                    lens of an IIT Bombay engineering mindset, making profound
                    concepts immediately practical.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="about-icon-badge">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="about-invite-heading font-heading">
                    30+ Years of Field Leadership Experience
                  </h4>
                  <p className="about-invite-desc">
                    Not theoretical lecturing — proven organizational experience
                    leading thousands of team members and global youth
                    institutions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="about-icon-badge">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="about-invite-heading font-heading">
                    Deep Audience Connection & Emotional Resonance
                  </h4>
                  <p className="about-invite-desc">
                    Engaging storytelling, clear logical reasoning, and
                    compassionate insight that resonates across diverse cultural
                    and professional backgrounds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Block */}
          <div className="about-quote-box reveal-right">
            <p className="text-xl sm:text-2xl font-serif italic text-foreground leading-relaxed mb-6">
              "Leadership is not merely about achieving corporate targets; it is
              the art of mastering one's mind, anchoring character in timeless
              truth, and inspiring others through authentic integrity."
            </p>
            <span
              className="about-sec-sub"
              style={{ textAlign: "left", marginBottom: 0 }}
            >
              Radheshyam Das
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
