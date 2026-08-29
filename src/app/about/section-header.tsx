import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  subtitle: string;
  title: string;
  underlinedWord?: string;
  description?: string;
  align?: "center" | "left";
  isDark?: boolean;
  className?: string;
}

export const SectionHeader = ({
  subtitle,
  title,
  underlinedWord,
  description,
  align = "center",
  isDark = false,
  className,
}: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        "about-sec-title-wrap reveal-blur",
        align === "left" && "text-left mb-6",
        className,
      )}
    >
      <span className={cn("about-sec-sub", align === "left" && "text-left")}>
        {subtitle}
      </span>
      <h2
        className={cn(
          "about-sec-title",
          align === "left" && "text-left",
          isDark && "text-white",
        )}
      >
        {title}{" "}
        {underlinedWord && (
          <span className="about-hand-underline">{underlinedWord}</span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "text-sm sm:text-base mt-4 leading-relaxed",
            align === "center" && "max-w-xl mx-auto",
            isDark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
};
