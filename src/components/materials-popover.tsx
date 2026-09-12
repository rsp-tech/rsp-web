"use client";

import type { Material } from "@/types";
import { MaterialBadge } from "./material-badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface MaterialsPopoverProps {
  materials: Material[];
  trigger: React.ReactNode;
  m?: string | null;
}

export function MaterialsPopover({
  materials,
  trigger,
  m,
}: MaterialsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="flex flex-col gap-2 p-3 bg-card border border-border shadow-md rounded-xl z-50"
        style={{ width: "20rem", maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border">
          All Materials ({materials.length})
        </div>
        <div
          className="flex flex-wrap gap-1.5 overflow-y-auto"
          style={{ maxHeight: "12rem" }}
        >
          {materials.map((mat) => {
            const isHighlighted = m != null && Number(m) === mat.id;
            return (
              <MaterialBadge
                key={mat.id}
                mat={mat}
                isHighlighted={isHighlighted}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
