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
        align === "left" && "about-sec-left",
        className,
      )}
    >
      <span className="about-sec-sub">{subtitle}</span>
      <h2 className={cn("about-sec-title", isDark && "text-white!")}>
        {title}{" "}
        {underlinedWord && (
          <span className="about-hand-underline">{underlinedWord}</span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "about-sec-desc",
            align === "center" && "about-sec-desc-center",
            isDark && "about-sec-desc-dark",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
};
