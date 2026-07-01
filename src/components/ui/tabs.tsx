"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const TabsListContext = React.createContext<{
  variant?: "default" | "line" | null;
}>({
  variant: "default",
});

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted rounded-lg",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsListContext.Provider value={{ variant }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsListContext.Provider>
  );
}

const tabsTriggerVariants = cva(
  "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 data-active:bg-background data-active:after:absolute after:bg-foreground after:opacity-0 after:transition-all group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5",
  {
    variants: {
      variant: {
        default: "data-active:shadow-md",
        line: "bg-transparent data-active:bg-transparent data-active:after:opacity-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsTrigger({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  const context = React.useContext(TabsListContext);
  const activeVariant = variant ?? context.variant ?? "default";

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant: activeVariant }), className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, tabsListVariants };
