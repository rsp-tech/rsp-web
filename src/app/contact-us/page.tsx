import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { ContactUsClient } from "./contact-us-client";

export const metadata: Metadata = {
  title: "Contact Us | Radheshyam Das Discourses",
  description:
    "Get in touch with support, submit questions regarding online certified courses, or request spiritual guidance from Radheshyam Das.",
  alternates: {
    canonical: "https://radheshyamdas.com/contact-us",
  },
  openGraph: {
    title: "Contact Us | Radheshyam Das Discourses",
    description:
      "Get in touch with support, submit questions regarding online certified courses, or request spiritual guidance from Radheshyam Das.",
    url: "https://radheshyamdas.com/contact-us",
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

export default function ContactUsPage() {
  return (
    <Suspense fallback={<Loading message="Loading contact form..." />}>
      <ContactUsClient />
    </Suspense>
  );
}
