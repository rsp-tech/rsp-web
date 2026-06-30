"use client";

import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_CATEGORIES } from "@/constants";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { getUserDisplayName } from "@/lib/utils";

export function ContactUsClient() {
  const router = useRouter();
  const { session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const id = useId();

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
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const supabase = getSupabaseClient();

    try {
      const { error } = await supabase.from("user_queries").insert({
        guest_name: session ? null : name,
        guest_email: session ? null : email,
        user_id: session?.user?.id ?? null,
        category,
        subject,
        message,
      });

      if (error) throw error;

      toast.success(
        session
          ? "Thank you! Your message has been sent successfully. Track its status in your profile."
          : "Thank you! Your message has been sent successfully.",
      );
      setSubject("");
      setMessage("");
      // biome-ignore lint/suspicious/noExplicitAny: catch block ok
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Unknown error";
      setSubmitError(errMsg);
      toast.error(`Failed to send message: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
          Contact Us
        </h1>
        <p className="text-muted-foreground text-sm">
          Have questions or inquiries? Feel free to reach out to us by filling
          the form below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact Info Sidebar */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Get in Touch</span>
              </CardTitle>
              <CardDescription className="text-xs">
                We generally respond within 24-48 business hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">Email</span>
                  <a
                    href="mailto:contact@radheshyamdas.com"
                    className="text-muted-foreground hover:text-primary transition-all text-xs"
                  >
                    contact@radheshyamdas.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">Address</span>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    Voice Publication & Courses,
                    <br />
                    Pune, Maharashtra, India
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Send a Message
              </CardTitle>
              <CardDescription>
                Fill out this form and our team will get back to you shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session && (
                <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-foreground">
                  <span className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    You are logged in. You can track status of your requests and
                    view previous queries.
                  </span>
                  <Button
                    size="sm"
                    variant="link"
                    className="h-auto p-0 font-bold gap-1 text-primary hover:text-primary/80 self-start sm:self-center shrink-0 cursor-pointer"
                    onClick={() => router.push("/profile/queries")}
                  >
                    <span>View Queries</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor={`${id}-1`}
                    >
                      Your Name <span className="text-destructive">*</span>
                    </Label>
                    <input
                      type="text"
                      id={`${id}-1`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!session}
                      placeholder="Enter your full name"
                      className="bg-muted border border-border rounded-lg text-sm px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-60"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor={`${id}-2`}
                    >
                      Your Email <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id={`${id}-2`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!session}
                      placeholder="Enter your email address"
                      className="bg-muted border border-border rounded-lg text-sm px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor={`${id}-3`}
                  >
                    Topic / Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val)}
                  >
                    <SelectTrigger className="h-9 w-full bg-muted border-border text-foreground cursor-pointer">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUERY_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor={`${id}-4`}
                  >
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <input
                    id={`${id}-4`}
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief subject of inquiry"
                    className="bg-muted border border-border rounded-lg text-sm px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor={`${id}-5`}
                  >
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={`${id}-5`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write details of your query here..."
                    className="bg-muted"
                    style={{ minHeight: "7.5rem" }}
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 px-5"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Message</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
