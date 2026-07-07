import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { Providers } from "@/components/providers";
import "./globals.css";
import { GlobalAudioPlayer } from "@/components/global-audio-player";
import { LayoutInitializers } from "@/components/layout-initializers";
import { generateSyncZip } from "@/lib/generate-sync-zip";
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
  if (process.env["NEXT_PHASE"] === "phase-production-build") {
    await generateSyncZip();
  }
  return (
    <html
      lang="en"
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
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <GlobalAudioPlayer />
          <LayoutInitializers />
        </Providers>
      </body>
    </html>
  );
}
