"use client";

import { useCallback, useState } from "react";
import { ENGAGEMENT_TYPES } from "@/constants";
import { formatConsultationMessage } from "@/lib/utils";

export const useConsultationForm = () => {
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [engagementType, setEngagementType] = useState<string>(
    ENGAGEMENT_TYPES[0],
  );
  const [audienceSize, setAudienceSize] = useState("");
  const [preferredDates, setPreferredDates] = useState("");

  const reset = useCallback(() => {
    setPhone("");
    setOrganization("");
    setEngagementType(ENGAGEMENT_TYPES[0]);
    setAudienceSize("");
    setPreferredDates("");
  }, []);

  const formatMessage = useCallback(
    (name: string, email: string, message: string) =>
      formatConsultationMessage({
        organization,
        engagementType,
        name,
        email,
        phone,
        audienceSize,
        preferredDates,
        message,
      }),
    [organization, engagementType, phone, audienceSize, preferredDates],
  );

  const formatSubject = useCallback(
    () => `[Speaker Invitation] ${organization.trim()} - ${engagementType}`,
    [organization, engagementType],
  );

  return {
    phone,
    setPhone,
    organization,
    setOrganization,
    engagementType,
    setEngagementType,
    audienceSize,
    setAudienceSize,
    preferredDates,
    setPreferredDates,
    reset,
    formatMessage,
    formatSubject,
  };
};
