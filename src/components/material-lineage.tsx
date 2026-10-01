import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialLineageProps {
  category?: { name: string } | null;
  recording?: { name: string } | null;
  className?: string;
}

export const MaterialLineage = ({
  category,
  recording,
  className,
}: MaterialLineageProps) => {
  if (!category && !recording) return null;

  return (
    <div
      className={cn(
        "text-xxs text-muted-foreground pl-6 flex items-center gap-1 font-medium truncate",
        className,
      )}
    >
      {category && <span className="shrink-0">{category.name}</span>}
      {category && recording && <ChevronRight className="w-3 h-3 shrink-0" />}
      {recording && <span className="truncate">{recording.name}</span>}
    </div>
  );
};
