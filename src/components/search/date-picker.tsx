"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (startDate: string, endDate: string) => void;
  placeholder: string;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder,
  className,
}: DateRangePickerProps) {
  const selectedRange = React.useMemo<DateRange | undefined>(() => {
    const from = startDate ? new Date(startDate) : undefined;
    const to = endDate ? new Date(endDate) : undefined;
    return { from, to };
  }, [startDate, endDate]);

  const formatLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start h-8 text-left text-xs bg-background border-border",
            !startDate && !endDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
          <span className="truncate">
            {selectedRange?.from ? (
              selectedRange.to ? (
                <>
                  {format(selectedRange.from, "LLL dd, y")}
                  {" - "}
                  {format(selectedRange.to, "LLL dd, y")}
                </>
              ) : (
                format(selectedRange.from, "LLL dd, y")
              )
            ) : (
              placeholder
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: "auto" }}>
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={(range) => {
            const startStr = range?.from ? formatLocal(range.from) : "";
            const endStr = range?.to ? formatLocal(range.to) : "";
            onChange(startStr, endStr);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
