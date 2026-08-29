"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveUserQueryToIdb } from "@/hooks/use-user-queries-and-replies";
import { formatConsultationMessage, getUserDisplayName } from "@/lib/utils";
import { SectionHeader } from "./section-header";

const ENGAGEMENT_TYPES = [
  "Corporate Workshop / Seminar",
  "Academic Lecture / Keynote",
  "Leadership Retreat / Executive Advisory",
  "Youth / Community Festival",
  "General Advisory / Consultation",
] as const;

export const ConsultationSection = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [engagementType, setEngagementType] = useState<string>(
    ENGAGEMENT_TYPES[0],
  );
  const [audienceSize, setAudienceSize] = useState("");
  const [preferredDates, setPreferredDates] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Autofill user details when logged in, while keeping all fields fully editable
  useEffect(() => {
    if (session?.user) {
      setName(getUserDisplayName(session.user));
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !organization.trim() ||
      !message.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    const formattedSubject = `[Speaker Invitation] ${organization.trim()} - ${engagementType}`;
    const formattedMessage = formatConsultationMessage({
      organization,
      engagementType,
      name,
      email,
      phone,
      audienceSize,
      preferredDates,
      message,
    });

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: name.trim(),
          guest_email: email.trim(),
          user_id: session?.user?.id ?? null,
          category: "consultation",
          subject: formattedSubject,
          message: formattedMessage,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to submit inquiry");
      }

      await saveUserQueryToIdb(queryClient, session?.user?.id, json.data);

      setSubmitted(true);

      toast.success(
        "Inquiry received! Our leadership office will contact you shortly.",
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to submit inquiry. Please try again or contact directly.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setOrganization("");
    setAudienceSize("");
    setPreferredDates("");
    setMessage("");
    if (session?.user) {
      setName(getUserDisplayName(session.user));
      setEmail(session.user.email ?? "");
    }
  };

  return (
    <section
      className="about-section-pad"
      id="contact"
      style={{ backgroundColor: "var(--bg-white)" }}
    >
      <div className="about-section-container">
        <div className="about-collage-grid items-start">
          {/* Left Info Column */}
          <div className="flex flex-col reveal-left">
            <SectionHeader
              subtitle="Direct Leadership Office"
              title="Schedule a"
              underlinedWord="Conversation"
              align="left"
            />
            <p className="about-editorial-p">
              Interested in inviting <strong>Radheshyam Das</strong> for a
              corporate keynote, executive leadership retreat, or university
              seminar? Reach out to our leadership office to coordinate
              schedules and customize program themes.
            </p>

            <div className="about-contact-list">
              <div className="about-contact-item">
                <div className="about-icon-badge">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Direct Email
                  </span>
                  <a
                    href="mailto:info@radheshyamdas.com"
                    className="font-medium hover:text-primary transition-colors"
                  >
                    info@radheshyamdas.com
                  </a>
                </div>
              </div>

              <div className="about-contact-item">
                <div className="about-icon-badge">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Phone & WhatsApp
                  </span>
                  <a
                    href="tel:+917378709688"
                    className="font-medium hover:text-primary transition-colors"
                  >
                    +91 73787 09688
                  </a>
                </div>
              </div>

              <div className="about-contact-item">
                <div className="about-icon-badge">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Headquarters
                  </span>
                  <span className="font-medium text-foreground">
                    ISKCON NVCC, Katraj-Kondhwa Bypass, Pune, India
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="about-contact-form-card reveal-right">
            {submitted ? (
              <div className="about-success-state">
                <div className="about-success-icon">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold font-heading">
                  Inquiry Submitted Successfully!
                </h4>
                <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                  Thank you for reaching out. Your speaker invitation has been
                  routed directly to our leadership coordination desk. We will
                  review your requirements and reply promptly.
                </p>

                <div
                  className="flex flex-wrap justify-center gap-3"
                  style={{ marginTop: 16 }}
                >
                  {session?.user && (
                    <Button asChild variant="default" className="rounded-full">
                      <Link href="/queries">
                        <span>Track in My Inquiries</span>
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-full"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span>Submit Another Inquiry</span>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="consult-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Your Name <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="consult-name"
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="about-form-input"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="consult-email"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Official Email <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="consult-email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className="about-form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone / WhatsApp */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="consult-phone"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Phone / WhatsApp{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="consult-phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="about-form-input"
                    />
                  </div>

                  {/* Organization */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="consult-org"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Organization / University{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="consult-org"
                      required
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Infosys, IIT Bombay"
                      className="about-form-input"
                    />
                  </div>
                </div>

                {/* Engagement Type */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="consult-type"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Engagement Type
                  </Label>
                  <select
                    id="consult-type"
                    value={engagementType}
                    onChange={(e) => setEngagementType(e.target.value)}
                    className="about-form-select"
                  >
                    {ENGAGEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estimated Audience */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="consult-audience"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Audience Size (Optional)
                    </Label>
                    <input
                      id="consult-audience"
                      type="text"
                      value={audienceSize}
                      onChange={(e) => setAudienceSize(e.target.value)}
                      placeholder="e.g. 150 participants"
                      className="about-form-input"
                    />
                  </div>

                  {/* Preferred Dates */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="consult-dates"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Target Timeframe (Optional)
                    </Label>
                    <input
                      id="consult-dates"
                      type="text"
                      value={preferredDates}
                      onChange={(e) => setPreferredDates(e.target.value)}
                      placeholder="e.g. Q3 2026 / November"
                      className="about-form-input"
                    />
                  </div>
                </div>

                {/* Proposed Theme / Requirements */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="consult-message"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Proposed Theme / Objectives{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="consult-message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your session objectives, key audience background, or preferred keynote topic..."
                    className="about-form-textarea"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="about-btn about-btn-primary w-full mt-2"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Inquiry...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Invitation
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
