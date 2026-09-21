"use client";

import {
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QueryForm } from "@/app/queries/_components/query-form";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QUERY_CATEGORIES } from "@/constants";

export const ContactUsClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();

  const paramCategory = searchParams.get("category");
  const initialCategory =
    paramCategory &&
    QUERY_CATEGORIES.some((c) => c.value === paramCategory.toLowerCase())
      ? paramCategory.toLowerCase()
      : "general";

  const [category, setCategory] = useState(initialCategory);
  const isConsultation = category === "consultation";

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
                    href="mailto:info@radheshyamdas.com"
                    className="text-muted-foreground hover:text-primary transition-all text-xs"
                  >
                    info@radheshyamdas.com
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
                    className="p-0 font-bold gap-1 text-primary hover:text-primary/80 self-start sm:self-center shrink-0 cursor-pointer"
                    style={{ height: "auto" }}
                    onClick={() => router.push("/queries")}
                  >
                    <span>View Queries</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <QueryForm category={category} onCategoryChange={setCategory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
