"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  style,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn("relative flex w-full items-center select-none", className)}
      style={{ touchAction: "none", ...style }}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative overflow-hidden rounded-full bg-muted w-full"
        style={{ flexGrow: 1, height: "0.25rem" }}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-primary select-none h-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          // biome-ignore lint/suspicious/noArrayIndexKey: ok here
          key={index}
          className="relative flex h-3 w-3 shrink-0 rounded-full border border-border bg-muted transition-colors select-none disabled:pointer-events-none disabled:opacity-60"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
