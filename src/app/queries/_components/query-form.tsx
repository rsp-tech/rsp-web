"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Info, Loader2, Send } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { SearchableSelect } from "@/components/search/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ENGAGEMENT_TYPES, QUERY_CATEGORIES } from "@/constants";
import { useConsultationForm } from "@/hooks/use-consultation-form";
import { saveUserQueryToIdb } from "@/hooks/use-user-queries-and-replies";
import { getUserDisplayName } from "@/lib/utils";
import type { QueryAttachment, UserQuery } from "@/types";
import { QueryAttachmentPicker } from "./query-attachment-picker";

export interface QueryFormProps {
  initialCategory?: string;
  category?: string;
  onCategoryChange?: (category: string) => void;
  isDialog?: boolean;
  onSuccess?: (createdQuery: UserQuery) => void;
  onCancel?: () => void;
}

export const QueryForm = ({
  initialCategory = "general",
  category: controlledCategory,
  onCategoryChange,
  isDialog = false,
  onSuccess,
  onCancel,
}: QueryFormProps) => {
  const id = useId();
  const queryClient = useQueryClient();
  const { session } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [internalCategory, setInternalCategory] = useState(initialCategory);

  const category = controlledCategory ?? internalCategory;
  const setCategory = (val: string) => {
    if (controlledCategory === undefined) {
      setInternalCategory(val);
    }
    onCategoryChange?.(val);
  };

  // Standard fields
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<QueryAttachment[]>([]);

  // Consultation fields
  const consult = useConsultationForm();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setAttachments([]);
    setSubmitError(null);
    consult.reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDialog && (!name.trim() || !email.trim())) {
      toast.error("Please fill in your name and email.");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide details for your message.");
      return;
    }

    if (isConsultation) {
      if (!consult.phone.trim() || !consult.organization.trim()) {
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
      ? consult.formatSubject()
      : subject.trim();

    const finalMessage = isConsultation
      ? consult.formatMessage(name, email, message)
      : message.trim();

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name:
            session && !isConsultation ? null : name.trim() || undefined,
          guest_email:
            session && !isConsultation ? null : email.trim() || undefined,
          user_id: session?.user?.id ?? null,
          category,
          subject: finalSubject,
          message: finalMessage,
          attachments,
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
          : isDialog
            ? "Your query ticket has been created successfully!"
            : session
              ? "Thank you! Your message has been sent successfully. Track its status in your profile."
              : "Thank you! Your message has been sent successfully.",
      );

      resetForm();
      onSuccess?.(json.data);
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

  const engagementOptions = ENGAGEMENT_TYPES.map((type) => ({
    label: type,
    value: type,
  }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 flex gap-3 items-start shadow-md">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Failed to Submit</p>
            <p className="text-xs opacity-80">{submitError}</p>
          </div>
        </div>
      )}

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
            Consultation details are editable so coordinators can submit
            official institutional contact info.
          </span>
        </div>
      )}

      {/* Name & Email Row (shown for guests or consultation, hidden in dialog when session exists) */}
      {(!session || isConsultation || !isDialog) && (
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
                isConsultation ? "e.g. Rajesh Sharma" : "Enter your full name"
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
      )}

      {/* Consultation Fields */}
      {isConsultation && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                htmlFor={`${id}-phone`}
              >
                Phone / WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${id}-phone`}
                type="tel"
                value={consult.phone}
                onChange={(e) => consult.setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-muted"
                required
              />
            </div>

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
                value={consult.organization}
                onChange={(e) => consult.setOrganization(e.target.value)}
                placeholder="e.g. Infosys, IIT Bombay"
                className="bg-muted"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              htmlFor={`${id}-type`}
            >
              Engagement Type
            </Label>
            <SearchableSelect
              options={engagementOptions}
              value={consult.engagementType}
              onChange={consult.setEngagementType}
              placeholder="Select engagement type"
              className="h-9 bg-muted"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                value={consult.audienceSize}
                onChange={(e) => consult.setAudienceSize(e.target.value)}
                placeholder="e.g. 100-250 participants"
                className="bg-muted"
              />
            </div>

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
                value={consult.preferredDates}
                onChange={(e) => consult.setPreferredDates(e.target.value)}
                placeholder="e.g. Q4 2026 / November"
                className="bg-muted"
              />
            </div>
          </div>
        </>
      )}

      {/* Subject (Only for non-consultation queries) */}
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

      {/* Attachments & References */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Attachments & References (Optional)
        </Label>
        <QueryAttachmentPicker
          attachments={attachments}
          onChange={setAttachments}
          disabled={submitting}
        />
      </div>

      {/* Form Action Buttons */}
      {isDialog ? (
        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isConsultation ? "Submit Request" : "Submit Query"}</span>
          </Button>
        </div>
      ) : (
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={submitting} className="gap-2 px-6">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {isConsultation ? "Submit Speaker Invitation" : "Send Message"}
            </span>
          </Button>
        </div>
      )}
    </form>
  );
};
