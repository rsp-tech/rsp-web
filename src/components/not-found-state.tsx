"use client";

import { ArrowLeft, Compass, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";

interface NotFoundStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const NotFoundState = ({
  title = "Path Not Found",
  message = "The category you are seeking could not be located.",
  onRetry,
}: NotFoundStateProps) => {
  const router = useRouter();

  return (
    <div
      className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in"
      style={{ transitionDuration: "500ms", animationDuration: "500ms" }}
    >
      <div className="relative w-full max-w-lg">
        {/* Shimmering Glassmorphic Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md transition-all duration-200">
          <div className="relative space-y-6 flex flex-col items-center">
            {/* Pulsing Compass Icon */}
            <div
              className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary"
              style={{ marginTop: "-1rem" }}
            >
              <Compass className="w-8 h-8 animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping opacity-80" />
            </div>

            {/* Sacred Verse Panel */}
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <p
                  className="text-xl sm:text-2xl font-serif italic tracking-wider text-primary leading-relaxed animate-shimmer"
                  style={{ "--shimmer-delay": "-150ms" } as CSSProperties}
                >
                  tam eva śaraṇaṁ gaccha
                </p>
                <p
                  className="text-xl sm:text-2xl font-serif italic tracking-wider text-primary leading-relaxed animate-shimmer"
                  style={{ "--shimmer-delay": "-100ms" } as CSSProperties}
                >
                  sarva-bhāvena bhārata
                </p>
                <p
                  className="text-xl sm:text-2xl font-serif italic tracking-wider text-primary leading-relaxed animate-shimmer"
                  style={{ "--shimmer-delay": "-50ms" } as CSSProperties}
                >
                  tat-prasādāt parāṁ śāntiṁ
                </p>
                <p
                  className="text-xl sm:text-2xl font-serif italic tracking-wider text-primary leading-relaxed animate-shimmer"
                  style={{ "--shimmer-delay": "0ms" } as CSSProperties}
                >
                  sthānaṁ prāpsyasi śāśvatam
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5 pt-2">
                <div
                  className="bg-primary/20"
                  style={{ height: "1px", width: "6rem" }}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-60">
                  Bhagavad Gita 18.62
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium italic text-muted-foreground leading-relaxed pt-2 max-w-sm mx-auto">
                "Surrender unto Him utterly. By His grace you will attain
                transcendental peace and the supreme and eternal abode."
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2 pt-2">
              <h2 className="text-xl font-bold tracking-tight ">{title}</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center w-full pt-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2 border-border hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>

              <Button
                variant="default"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 transition-all"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>

              {onRetry && (
                <Button
                  variant="ghost"
                  onClick={onRetry}
                  className="flex items-center gap-2 text-muted-foreground hover:hover:bg-accent/50 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
