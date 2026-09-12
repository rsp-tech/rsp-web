"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 overflow-x-hidden overflow-y-auto rounded-lg bg-card p-1 text-foreground shadow-md ring-1 ring-foreground/10 duration-200 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        style={{
          transformOrigin:
            "var(--radix-dropdown-menu-content-transform-origin)",
          width: "var(--radix-dropdown-menu-trigger-width)",
          maxHeight: "var(--radix-dropdown-menu-content-available-height)",
          minWidth: "9rem",
        }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

const dropdownMenuItemVariants = cva(
  "group/dropdown-menu-item relative flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "focus:**:text-accent-foreground",
        destructive:
          "text-destructive focus:bg-destructive/10 focus:text-destructive *:[svg]:text-destructive",
      },
      inset: {
        true: "pl-7",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> &
  VariantProps<typeof dropdownMenuItemVariants>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(dropdownMenuItemVariants({ variant, inset }), className)}
      {...props}
    />
  );
}

const dropdownMenuLabelVariants = cva(
  "px-1.5 py-1 text-xs font-medium text-muted-foreground",
  {
    variants: {
      inset: {
        true: "pl-7",
      },
    },
  },
);

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> &
  VariantProps<typeof dropdownMenuLabelVariants>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn(dropdownMenuLabelVariants({ inset }), className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
};
