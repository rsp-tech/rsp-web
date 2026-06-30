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
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
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
    <html lang="en" className={cn(geistSans.variable, "h-full antialiased")}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {process.env["NEXT_PUBLIC_CLARITY_ID"] && (
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${process.env["NEXT_PUBLIC_CLARITY_ID"]}");
            `}
          </Script>
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
