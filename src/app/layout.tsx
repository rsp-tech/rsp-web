import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { Providers } from "@/components/providers";
import { SyncTrigger } from "@/components/SyncTrigger";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HG Radheshyamdas Spiritual Discourses",
  description:
    "Rebuild of radheshyamdas.com featuring spiritual lectures, materials, and categories",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased clean`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <SyncTrigger />
          <Toaster position="bottom-right" />
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
