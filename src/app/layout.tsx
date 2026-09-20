import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { TopAnnouncementBanner } from "@/components/announcement-banner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { Providers } from "@/components/providers";
import "./globals.css";
import { GlobalAudioPlayer } from "@/components/global-audio-player";
import { LayoutInitializers } from "@/components/layout-initializers";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "HG Radheshyamdas Spiritual Discourses",
  description:
    "Spiritual lectures, commentaries, and wisdom by HG Radheshyamdas",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", apple: "/icon-192x192.webp" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, "h-full")}
      style={{
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <head>
        <link
          rel="preconnect"
          href={process.env["NEXT_PUBLIC_SUPABASE_URL"]}
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href={process.env["NEXT_PUBLIC_POSTHOG_HOST"]}
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <TopAnnouncementBanner />
          <Header />
          <PageTransition>{children}</PageTransition>
          <Footer />
          <GlobalAudioPlayer />
          <LayoutInitializers />
        </Providers>
        <Script
          strategy="afterInteractive"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "8653613367ad4261b5ec0deebc7b37c1", "spa": true}'
        />
      </body>
    </html>
  );
}
