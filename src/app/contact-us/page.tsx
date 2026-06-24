import type { Metadata } from "next";
import { ContactUsClient } from "./contact-us-client";

export const metadata: Metadata = {
  title: "Contact Us | HG Radheshyamdas Discourses",
  description:
    "Get in touch with support, submit questions regarding online certified courses, or request spiritual guidance from HG Radheshyam Das.",
  alternates: {
    canonical: "https://radheshyamdas.com/contact-us",
  },
  openGraph: {
    title: "Contact Us | HG Radheshyamdas Discourses",
    description:
      "Get in touch with support, submit questions regarding online certified courses, or request spiritual guidance from HG Radheshyam Das.",
    url: "https://radheshyamdas.com/contact-us",
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

export default function ContactUsPage() {
  return <ContactUsClient />;
}
