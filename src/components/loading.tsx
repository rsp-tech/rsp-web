import { LoaderPinwheel } from "lucide-react";
import type { CSSProperties } from "react";

export const Loading = ({ message }: { message?: string }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative w-full max-w-lg px-8 py-12 text-center">
        {/* Shimmering Dialog */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 shadow-md transition-all">
          <div className="relative space-y-6">
            <div className="space-y-4">
              <p
                className="text-2xl font-serif italic tracking-wide text-primary leading-relaxed animate-shimmer"
                style={{ "--shimmer-delay": "-150ms" } as CSSProperties}
              >
                sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja
              </p>
              <p className="text-2xl font-serif italic tracking-wide text-primary leading-relaxed animate-shimmer">
                ahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="h-0.5 w-32 overflow-hidden rounded-full bg-primary/10">
                <div className="h-full w-full bg-primary animate-progress" />
              </div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-60">
                Bhagavad Gita 18.66
              </p>
            </div>
            {message && (
              <p className="text-xs opacity-80 -mb-2 italic text-primary flex items-center gap-2 justify-center animate-shimmer">
                <LoaderPinwheel
                  className="size-3.5 animate-spin"
                  style={{ animationDuration: "600ms" }}
                />
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/5 blur-4xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-4xl" />
      </div>
    </div>
  );
};
