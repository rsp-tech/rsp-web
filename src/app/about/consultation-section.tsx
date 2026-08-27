"use client";

import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "./section-header";

export const ConsultationSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      className="about-section-pad"
      id="contact"
      style={{ backgroundColor: "var(--bg-white)" }}
    >
      <div className="about-section-container">
        <div className="about-collage-grid">
          {/* Left Info */}
          <div className="flex flex-col reveal-left">
            <SectionHeader
              subtitle="Get in Touch"
              title="Schedule a"
              underlinedWord="Conversation"
              align="left"
            />
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              Interested in inviting Radheshyam Das for a corporate keynote,
              executive workshop, or university session? Reach out to our
              leadership office to discuss dates and customized program themes.
            </p>

            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-cream)] text-[var(--accent-gold-dark)] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span>info@radheshyamdas.com</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-cream)] text-[var(--accent-gold-dark)] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+91 20 2410 0000 / +91 99220 00000</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-cream)] text-[var(--accent-gold-dark)] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>ISKCON NVCC, Katraj-Kondhwa Bypass, Pune, India</span>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="bg-[var(--bg-cream)] p-8 sm:p-10 rounded-2xl border border-border shadow-xs reveal-right">
            {submitted ? (
              <div className="text-center py-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold font-heading">Thank you!</h4>
                <p className="text-muted-foreground text-sm">
                  Your inquiry has been received. Our leadership office will
                  connect with you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="about-name"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Your Name
                  </Label>
                  <Input
                    id="about-name"
                    required
                    type="text"
                    placeholder="Full name"
                    className="h-11 px-4 rounded-xl bg-background border-border text-sm focus-visible:ring-[var(--accent-gold)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="about-email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="about-email"
                    required
                    type="email"
                    placeholder="name@organization.com"
                    className="h-11 px-4 rounded-xl bg-background border-border text-sm focus-visible:ring-[var(--accent-gold)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="about-org"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Organization / Institution
                  </Label>
                  <Input
                    id="about-org"
                    type="text"
                    placeholder="Company or University name"
                    className="h-11 px-4 rounded-xl bg-background border-border text-sm focus-visible:ring-[var(--accent-gold)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="about-message"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Proposed Theme / Message
                  </Label>
                  <Textarea
                    id="about-message"
                    required
                    rows={4}
                    placeholder="Describe your session requirement or question..."
                    className="px-4 py-3 rounded-xl bg-background border-border text-sm focus-visible:ring-[var(--accent-gold)] resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full bg-[var(--accent-vibrant)] hover:bg-[var(--accent-vibrant)]/90 text-white font-semibold uppercase tracking-widest text-xs h-12 w-full mt-2 shadow-md"
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
