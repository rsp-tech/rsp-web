import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchableSelect } from "@/components/search/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

interface VolunteerItemProps {
  service: Service;
  interests: Map<number, { level: string; notes: string }>;
  handleToggleInterest: (serviceId: number) => void;
  handleUpdateDetail: (
    serviceId: number,
    field: "level" | "notes",
    value: string,
  ) => void;
}

export const VolunteerItem = ({
  service,
  interests,
  handleToggleInterest,
  handleUpdateDetail,
}: VolunteerItemProps) => {
  const isChecked = interests.has(service.id);
  const detail = interests.get(service.id);

  const selectId = useId();
  const textId = useId();

  return (
    <Card
      className={cn(
        "transition-all duration-200 border-2",
        isChecked
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-border",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="flex-1 flex flex-col gap-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {service.name}
            {service.type && (
              <span className="text-xxs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
                {service.type}
              </span>
            )}
          </CardTitle>
          {service.description && (
            <CardDescription className="text-sm">
              {service.description}
            </CardDescription>
          )}
        </div>
        <Button
          type="button"
          variant={isChecked ? "destructive" : "secondary"}
          size="sm"
          onClick={() => handleToggleInterest(service.id)}
          className="shrink-0 gap-1.5"
        >
          {isChecked ? (
            <>
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>I'm Interested</span>
            </>
          )}
        </Button>
      </CardHeader>

      {isChecked && detail && (
        <CardContent
          className="pt-2 flex flex-col gap-4 border-t border-border/40 mt-2 bg-background/50 py-4"
          style={{
            animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={selectId}
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              My Skill / Interest Level
            </label>
            <SearchableSelect
              options={[
                {
                  value: "curious",
                  label: "Curious / Exploring & willing to learn",
                },
                {
                  value: "interested",
                  label: "Interested / Ready to contribute",
                },
                {
                  value: "committed",
                  label: "Committed / Ready to take regular responsibility",
                },
              ]}
              value={detail.level}
              onChange={(val) => handleUpdateDetail(service.id, "level", val)}
              placeholder="Select level"
              className="bg-muted"
              style={{ maxWidth: "20rem" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={textId}
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Additional Notes (e.g. details, availability, past service)
            </label>
            <Textarea
              id={textId}
              value={detail.notes}
              onChange={(e) =>
                handleUpdateDetail(service.id, "notes", e.target.value)
              }
              placeholder="Share any details about how you can support this service..."
              className="bg-muted min-h-20"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};
