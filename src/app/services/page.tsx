import type { Metadata } from "next";
import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "Spiritual Services & Devotional Opportunities",
  description:
    "Explore youth training modules (VOICE, DYS, GAME), management courses, leadership programs, and literature by HG Radheshyam Das.",
  alternates: {
    canonical: "https://radheshyamdas.com/services",
  },
  openGraph: {
    title: "Spiritual Services & Devotional Opportunities",
    description:
      "Explore youth training modules (VOICE, DYS, GAME), management courses, leadership programs, and literature by HG Radheshyam Das.",
    url: "https://radheshyamdas.com/services",
    type: "website",
    images: [
      {
        url: "https://radheshyamdas.com/rsp.webp",
        width: 512,
        height: 512,
        alt: "HG Radheshyamdas",
      },
    ],
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
