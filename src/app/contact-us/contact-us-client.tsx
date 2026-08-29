"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ExternalLink,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { SearchableSelect } from "@/components/search/searchable-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_CATEGORIES } from "@/constants";
import { saveUserQueryToIdb } from "@/hooks/use-user-queries-and-replies";
import { formatConsultationMessage, getUserDisplayName } from "@/lib/utils";

const ENGAGEMENT_TYPES = [
  "Corporate Workshop / Seminar",
  "Academic Lecture / Keynote",
  "Leadership Retreat / Executive Advisory",
  "Youth / Community Festival",
  "General Advisory / Consultation",
] as const;

export const ContactUsClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { session } = useSession();

  const paramCategory = searchParams.get("category");
  const initialCategory =
    paramCategory &&
    QUERY_CATEGORIES.some((c) => c.value === paramCategory.toLowerCase())
      ? paramCategory.toLowerCase()
      : "general";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(initialCategory);

  // Standard fields
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Morphed Consultation fields
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [engagementType, setEngagementType] = useState<string>(
    ENGAGEMENT_TYPES[0],
  );
  const [audienceSize, setAudienceSize] = useState("");
  const [preferredDates, setPreferredDates] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const id = useId();
  const isConsultation = category === "consultation";

  // Pre-fill name and email if logged in
  useEffect(() => {
    if (session?.user) {
      setName(getUserDisplayName(session.user));
      setEmail(session.user.email ?? "");
    } else {
      setName("");
      setEmail("");
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (isConsultation) {
      if (!phone.trim() || !organization.trim()) {
        toast.error("Please provide your phone number and organization name.");
        return;
      }
    } else if (!subject.trim()) {
      toast.error("Please provide a subject for your query.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const finalSubject = isConsultation
      ? `[Speaker Invitation] ${organization.trim()} - ${engagementType}`
      : subject.trim();

    const finalMessage = isConsultation
      ? formatConsultationMessage({
          organization,
          engagementType,
          name,
          email,
          phone,
          audienceSize,
          preferredDates,
          message,
        })
      : message.trim();

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: session && !isConsultation ? null : name.trim(),
          guest_email: session && !isConsultation ? null : email.trim(),
          user_id: session?.user?.id ?? null,
          category,
          subject: finalSubject,
          message: finalMessage,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to submit query");
      }

      await saveUserQueryToIdb(queryClient, session?.user?.id, json.data);

      toast.success(
        isConsultation
          ? "Thank you! Your speaker invitation has been received. Our leadership office will contact you shortly."
          : session
            ? "Thank you! Your message has been sent successfully. Track its status in your profile."
            : "Thank you! Your message has been sent successfully.",
      );

      setSubject("");
      setMessage("");
      setOrganization("");
      setPhone("");
      setAudienceSize("");
      setPreferredDates("");
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        err instanceof Error ? err.message : "Unknown error occurred";
      setSubmitError(errMsg);
      toast.error(`Failed to send message: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
          {isConsultation ? "Speaker & Consultation Request" : "Contact Us"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isConsultation
            ? "Invite Radheshyam Das for corporate seminars, keynote addresses, executive retreats, or campus lectures."
            : "Have questions or inquiries? Feel free to reach out to us by filling the form below."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact Info Sidebar */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>
                  {isConsultation ? "Leadership Office" : "Get in Touch"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isConsultation
                  ? "Direct coordination for corporate and academic invitations."
                  : "We generally respond within 24-48 business hours."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold">Email</span>
                  <a
                    href={
                      isConsultation
                        ? "mailto:info@radheshyamdas.com"
                        : "mailto:contact@radheshyamdas.com"
                    }
                    className="text-muted-foreground hover:text-primary transition-all text-xs"
                  >
                    {isConsultation
                      ? "info@radheshyamdas.com"
                      : "contact@radheshyamdas.com"}
                  </a>
                </div>
              </div>

              {isConsultation && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-bold">Phone & WhatsApp</span>
                    <a
                      href="tel:+917378709688"
                      className="text-muted-foreground hover:text-primary transition-all text-xs"
                    >
                      +91 73787 09688
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold">Address</span>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    {isConsultation ? (
                      <>
                        ISKCON NVCC, Katraj-Kondhwa Bypass,
                        <br />
                        Pune, Maharashtra, India
                      </>
                    ) : (
                      <>
                        Voice Publication & Courses,
                        <br />
                        Pune, Maharashtra, India
                      </>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contextual About Promotion Card */}
          {isConsultation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>Workshop & Keynote Formats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex flex-col gap-3">
                <p className="leading-relaxed">
                  Explore all 10 curated modules including{" "}
                  <em>Art of Smart Work</em>, <em>Stress to Strength</em>, and{" "}
                  <em>Integrity: The Ultimate Advantage</em>.
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                >
                  <Link href="/about#workshops">
                    <span>Explore Workshop Themes</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {isConsultation ? "Speaker Invitation Form" : "Send a Message"}
              </CardTitle>
              <CardDescription>
                {isConsultation
                  ? "Please provide session objectives, audience background, and organizational details."
                  : "Fill out this form and our team will get back to you shortly."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session && (
                <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    You are logged in. You can track status of your requests and
                    view previous queries.
                  </span>
                  <Button
                    size="sm"
                    variant="link"
                    className="h-auto p-0 font-bold gap-1 text-primary hover:text-primary/80 self-start sm:self-center shrink-0 cursor-pointer"
                    onClick={() => router.push("/queries")}
                  >
                    <span>View Queries</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {submitError && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 flex gap-3 items-start shadow-md">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">Failed to Send Message</p>
                    <p className="text-xs opacity-80">{submitError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Topic / Category Selector */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor={`${id}-category`}
                  >
                    Topic / Category <span className="text-destructive">*</span>
                  </Label>
                  <SearchableSelect
                    options={QUERY_CATEGORIES}
                    value={category}
                    onChange={setCategory}
                    placeholder="Select topic"
                    className="h-9 bg-muted"
                  />
                </div>

                {isConsultation && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs flex items-center gap-2 text-muted-foreground">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      Consultation details are editable so coordinators can
                      submit official institutional contact info.
                    </span>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor={`${id}-name`}
                    >
                      {isConsultation ? "Contact Person / Lead" : "Your Name"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id={`${id}-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!session && !isConsultation}
                      placeholder={
                        isConsultation
                          ? "e.g. Rajesh Sharma"
                          : "Enter your full name"
                      }
                      className="bg-muted"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor={`${id}-email`}
                    >
                      {isConsultation ? "Official / Work Email" : "Your Email"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`${id}-email`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!session && !isConsultation}
                      placeholder={
                        isConsultation
                          ? "name@organization.com"
                          : "Enter your email address"
                      }
                      className="bg-muted"
                      required
                    />
                  </div>
                </div>

                {/* Morphed Fields for Consultation */}
                {isConsultation && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone / WhatsApp */}
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                          htmlFor={`${id}-phone`}
                        >
                          Phone / WhatsApp{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${id}-phone`}
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="bg-muted"
                          required
                        />
                      </div>

                      {/* Organization / University */}
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                          htmlFor={`${id}-org`}
                        >
                          Organization / University{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${id}-org`}
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. Infosys, IIT Bombay"
                          className="bg-muted"
                          required
                        />
                      </div>
                    </div>

                    {/* Engagement Type */}
                    <div className="flex flex-col gap-1.5">
                      <Label
                        className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        htmlFor={`${id}-type`}
                      >
                        Engagement Type
                      </Label>
                      <select
                        id={`${id}-type`}
                        value={engagementType}
                        onChange={(e) => setEngagementType(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-muted border border-input text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      >
                        {ENGAGEMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Estimated Audience Size */}
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                          htmlFor={`${id}-audience`}
                        >
                          Audience Size (Optional)
                        </Label>
                        <Input
                          id={`${id}-audience`}
                          type="text"
                          value={audienceSize}
                          onChange={(e) => setAudienceSize(e.target.value)}
                          placeholder="e.g. 100-250 participants"
                          className="bg-muted"
                        />
                      </div>

                      {/* Preferred Dates / Timeframe */}
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                          htmlFor={`${id}-dates`}
                        >
                          Target Timeframe (Optional)
                        </Label>
                        <Input
                          id={`${id}-dates`}
                          type="text"
                          value={preferredDates}
                          onChange={(e) => setPreferredDates(e.target.value)}
                          placeholder="e.g. Q4 2026 / November"
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Subject (Only for standard support queries) */}
                {!isConsultation && (
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor={`${id}-subject`}
                    >
                      Subject <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`${id}-subject`}
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief subject of inquiry"
                      className="bg-muted"
                      required
                    />
                  </div>
                )}

                {/* Message Field */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor={`${id}-message`}
                  >
                    {isConsultation ? "Proposed Theme & Objectives" : "Message"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={`${id}-message`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isConsultation
                        ? "Describe your session objectives, key audience background, or preferred keynote topic..."
                        : "Write details of your query here..."
                    }
                    className="bg-muted"
                    style={{ minHeight: isConsultation ? "6.5rem" : "7.5rem" }}
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 px-6"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>
                      {isConsultation
                        ? "Submit Speaker Invitation"
                        : "Send Message"}
                    </span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
