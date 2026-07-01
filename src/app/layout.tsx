import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PageTransition } from "@/components/page-transition";
import { Providers } from "@/components/providers";
import { SyncTrigger } from "@/components/sync-trigger";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import type { CSSProperties } from "react";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, "h-full")}
      style={
        {
          "-webkit-font-smoothing": "antialiased",
          "-moz-osx-font-smoothing": "grayscale",
        } as CSSProperties
      }
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
      </head>
      <body className="min-h-full flex flex-col">
        {process.env["NEXT_PUBLIC_CLARITY_ID"] && (
          <Script
            id="microsoft-clarity"
            strategy="lazyOnload"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: analytics
            dangerouslySetInnerHTML={{
              __html: `
        window.clarity = window.clarity || function() { (window.clarity.q = window.clarity.q || []).push(arguments) };
        if (!document.getElementById('clarity-inject')) {
          const t = document.createElement("script");
          t.id = 'clarity-inject';
          t.async = true;
          t.src = "https://www.clarity.ms/tag/${process.env["NEXT_PUBLIC_CLARITY_ID"]}";
          document.head.appendChild(t);
        }
      `,
            }}
          />
        )}
        <Providers>
          <OfflineIndicator />
          <SyncTrigger />
          <Toaster position="bottom-right" />
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
