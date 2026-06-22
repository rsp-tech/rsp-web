"use client";

import { Check, Loader2, Phone, Shield, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ASHRAMS = [
  { value: "Visitor", label: "Visitor" },
  { value: "Student", label: "Student / Youth Seeker" },
  { value: "Brahmacari", label: "Brahmacari (Monk)" },
  { value: "Aspiring Brahmacari", label: "Aspiring Brahmacari" },
  { value: "Grihastha", label: "Grihastha (Householder)" },
  { value: "Vanaprastha", label: "Vanaprastha (Retired)" },
  { value: "Sannyasi", label: "Sannyasi (Renounced)" },
  { value: "Other", label: "Other" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "Counselor / Mentor", label: "Counselor / Mentor" },
  {
    value: "Temple President / Vice President / Authority",
    label: "Temple President / Authority",
  },
  {
    value: "Spiritual Master (Diksha Guru)",
    label: "Spiritual Master (Diksha Guru)",
  },
  { value: "IYF Leader / Director", label: "IYF Leader / Director" },
  { value: "VOICE / Course Coordinator", label: "VOICE / Course Coordinator" },
  { value: "Preacher", label: "Preacher" },
  { value: "Temple Brahmachari / Monk", label: "Temple Brahmachari / Monk" },
  { value: "Pujari / Head Pujari", label: "Pujari / Head Pujari" },
  { value: "Other", label: "Other (Please specify)" },
];

const PREDEFINED_RELATIONSHIPS = [
  "Counselor / Mentor",
  "Temple President / Vice President / Authority",
  "Spiritual Master (Diksha Guru)",
  "IYF Leader / Director",
  "VOICE / Course Coordinator",
  "Preacher",
  "Temple Brahmachari / Monk",
  "Pujari / Head Pujari",
];

interface PersonalSettingsFormProps {
  initialValues: {
    fullName: string;
    phone: string;
    temple: string;
    ashram: string;
    purpose: string;
    authorityName: string;
    authorityEmail: string;
    authorityRelationship: string;
    isVoiceLeader: boolean;
  };
  onSubmit: (values: {
    fullName: string;
    phone: string;
    temple: string;
    ashram: string;
    purpose: string;
    authorityName: string;
    authorityEmail: string;
    authorityRelationship: string;
    isVoiceLeader: boolean;
  }) => Promise<void>;
  updating: boolean;
  hasPendingRequest: boolean;
}

export function PersonalSettingsForm({
  initialValues,
  onSubmit,
  updating,
  hasPendingRequest,
}: PersonalSettingsFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [temple, setTemple] = useState(initialValues.temple);
  const [ashram, setAshram] = useState(initialValues.ashram || "Visitor");
  const [purpose, setPurpose] = useState(initialValues.purpose);
  const [authorityName, setAuthorityName] = useState(
    initialValues.authorityName,
  );
  const [authorityEmail, setAuthorityEmail] = useState(
    initialValues.authorityEmail,
  );
  const [isVoiceLeader, setIsVoiceLeader] = useState(
    initialValues.isVoiceLeader,
  );

  // Initialize dropdown selection and custom input for authorityRelationship
  const isPredefined = PREDEFINED_RELATIONSHIPS.includes(
    initialValues.authorityRelationship,
  );
  const initialSelectValue = initialValues.authorityRelationship
    ? isPredefined
      ? initialValues.authorityRelationship
      : "Other"
    : "";
  const initialCustomValue = initialValues.authorityRelationship
    ? isPredefined
      ? ""
      : initialValues.authorityRelationship
    : "";

  const [relSelect, setRelSelect] = useState(initialSelectValue);
  const [relCustom, setRelCustom] = useState(initialCustomValue);

  const currentRelationship = relSelect === "Other" ? relCustom : relSelect;
  const isUnchanged =
    fullName === initialValues.fullName &&
    phone === initialValues.phone &&
    temple === initialValues.temple &&
    ashram === (initialValues.ashram || "Visitor") &&
    purpose === initialValues.purpose &&
    authorityName === initialValues.authorityName &&
    authorityEmail === initialValues.authorityEmail &&
    currentRelationship === initialValues.authorityRelationship &&
    isVoiceLeader === initialValues.isVoiceLeader;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      fullName,
      phone,
      temple,
      ashram,
      purpose,
      authorityName,
      authorityEmail,
      authorityRelationship: currentRelationship,
      isVoiceLeader,
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Update Personal Settings</span>
        </CardTitle>
        <CardDescription>
          Submit settings and responsibility updates. Changes will be processed
          by administrative review.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                htmlFor="full-name"
              >
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                disabled={hasPendingRequest}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                htmlFor="phone"
              >
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type="tel"
                  id="phone"
                  className="pl-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  disabled={hasPendingRequest}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                htmlFor="temple"
              >
                Connected Temple / Center
              </Label>
              <Input
                type="text"
                id="temple"
                value={temple}
                onChange={(e) => setTemple(e.target.value)}
                placeholder="e.g. Pune NVCC, Chowpatty"
                disabled={hasPendingRequest}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                htmlFor="ashram"
              >
                Spiritual Ashram (Status)
              </Label>
              <Select
                value={ashram}
                onValueChange={(val) => setAshram(val)}
                disabled={hasPendingRequest}
              >
                <SelectTrigger
                  id="ashram"
                  className="h-9 w-full bg-card border-border text-foreground cursor-pointer"
                >
                  <SelectValue placeholder="Select Ashram" />
                </SelectTrigger>
                <SelectContent>
                  {ASHRAMS.map((ash) => (
                    <SelectItem key={ash.value} value={ash.value}>
                      {ash.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsibility section */}
          <div className="flex items-start gap-3 mt-1 border-t border-border/40 pt-4">
            <input
              type="checkbox"
              id="voice-leader"
              checked={isVoiceLeader}
              onChange={(e) => setIsVoiceLeader(e.target.checked)}
              disabled={hasPendingRequest}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
            />
            <div className="flex flex-col gap-0.5">
              <Label
                htmlFor="voice-leader"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                I serve as a Community or VOICE Leader / Mentor
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Check this option if you are leading youth groups, VOICE
                programs, or local community centers.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <Label
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              htmlFor="purpose"
            >
              I want to join this community because...
            </Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Personal growth, Preaching preparation, Mentorship responsibilities"
              className="min-h-[70px] bg-muted/20"
              disabled={hasPendingRequest}
            />
          </div>

          <div className="border-t border-border/50 pt-4 mt-2 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Spiritual Mentor / Guide Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  htmlFor="authority-name"
                >
                  Mentor Name
                </Label>
                <Input
                  type="text"
                  id="authority-name"
                  value={authorityName}
                  onChange={(e) => setAuthorityName(e.target.value)}
                  placeholder="e.g. HG Devashish Prabhu"
                  disabled={hasPendingRequest}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  htmlFor="authority-email"
                >
                  Mentor Email
                </Label>
                <Input
                  type="email"
                  id="authority-email"
                  value={authorityEmail}
                  onChange={(e) => setAuthorityEmail(e.target.value)}
                  placeholder="e.g. mentor@domain.com"
                  disabled={hasPendingRequest}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                htmlFor="authority-relationship"
              >
                Relationship with Mentor
              </Label>
              <Select
                value={relSelect}
                onValueChange={(val) => {
                  setRelSelect(val);
                  if (val !== "Other") {
                    setRelCustom("");
                  }
                }}
                disabled={hasPendingRequest}
              >
                <SelectTrigger
                  id="authority-relationship"
                  className="h-9 w-full bg-card border-border text-foreground cursor-pointer text-xs"
                >
                  <SelectValue placeholder="Select Relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {relSelect === "Other" && (
                <div className="mt-1.5 flex flex-col gap-1">
                  <Input
                    type="text"
                    value={relCustom}
                    onChange={(e) => setRelCustom(e.target.value)}
                    placeholder="Specify custom relationship (e.g. Congregation Leader)"
                    required
                    disabled={hasPendingRequest}
                    className="text-xs h-8"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2 border-t border-border/40 mt-4">
          <Button
            type="submit"
            disabled={updating || hasPendingRequest || isUnchanged}
            className="gap-1.5 cursor-pointer"
          >
            {updating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>
              {hasPendingRequest
                ? "Request Pending"
                : isUnchanged
                  ? "No Changes"
                  : "Submit Update Request"}
            </span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
