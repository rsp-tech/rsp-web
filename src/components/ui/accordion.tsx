"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const Accordion = ({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) => (
  <AccordionPrimitive.Root
    data-slot="accordion"
    className={cn("flex w-full flex-col", className)}
    {...props}
  />
);

const AccordionItem = (
  props: React.ComponentProps<typeof AccordionPrimitive.Item>,
) => <AccordionPrimitive.Item data-slot="accordion-item" {...props} />;

export interface AccordionTriggerProps
  extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
  action?: React.ReactNode;
  headerClassName?: string;
}

const AccordionTrigger = ({
  className,
  children,
  action,
  headerClassName,
  ...props
}: AccordionTriggerProps) => (
  <AccordionPrimitive.Header
    className={cn("flex items-center justify-between w-full", headerClassName)}
  >
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-60 overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="accordion-trigger-icon"
        className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden text-muted-foreground ml-auto size-4"
      />
      <ChevronUpIcon
        data-slot="accordion-trigger-icon"
        className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline text-muted-foreground ml-auto size-4"
      />
    </AccordionPrimitive.Trigger>
    {action}
  </AccordionPrimitive.Header>
);

const AccordionContent = ({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) => (
  <AccordionPrimitive.Content
    data-slot="accordion-content"
    className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
    {...props}
  >
    <div
      className={cn("pt-0 pb-2.5 [&_p:not(:last-child)]:mb-4", className)}
      style={{ height: "var(--radix-accordion-content-height)", ...style }}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
);

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
