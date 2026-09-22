import type { Metadata } from "next";
import { GetInvolvedClient } from "./get-involved-client";

export const metadata: Metadata = {
  title: "Get Involved & Devotional Volunteering",
  description:
    "Explore volunteering opportunities, youth training modules (VOICE, DYS, GAME), and devotional services to contribute your skills with Radheshyam Das.",
  alternates: {
    canonical: "https://radheshyamdas.com/get-involved",
  },
  openGraph: {
    title: "Get Involved & Devotional Volunteering",
    description:
      "Explore volunteering opportunities, youth training modules (VOICE, DYS, GAME), and devotional services to contribute your skills with Radheshyam Das.",
    url: "https://radheshyamdas.com/get-involved",
    type: "website",
    images: [
      {
        url: "https://radheshyamdas.com/rsp.webp",
        width: 512,
        height: 512,
        alt: "Radheshyam Das",
      },
    ],
  },
};

export default function GetInvolvedPage() {
  return <GetInvolvedClient />;
}
