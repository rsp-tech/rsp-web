import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const CardContext = React.createContext<{
  size?: "default" | "sm" | null;
}>({
  size: "default",
});

const cardVariants = cva(
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
  {
    variants: {
      size: {
        default: "",
        sm: "gap-3 py-3 has-data-[slot=card-footer]:pb-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <CardContext.Provider value={{ size }}>
      <div
        data-slot="card"
        data-size={size}
        className={cn(cardVariants({ size }), className)}
        {...props}
      />
    </CardContext.Provider>
  );
}

const cardHeaderVariants = cva(
  "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4",
  {
    variants: {
      size: {
        default: "",
        sm: "px-3 [.border-b]:pb-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { size } = React.useContext(CardContext);
  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants({ size }), className)}
      {...props}
    />
  );
}

const cardTitleVariants = cva(
  "font-heading text-base leading-snug font-medium",
  {
    variants: {
      size: {
        default: "",
        sm: "text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  const { size } = React.useContext(CardContext);
  return (
    <div
      data-slot="card-title"
      className={cn(cardTitleVariants({ size }), className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

const cardContentVariants = cva(
  "px-4",
  {
    variants: {
      size: {
        default: "",
        sm: "px-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  const { size } = React.useContext(CardContext);
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ size }), className)}
      {...props}
    />
  );
}

const cardFooterVariants = cva(
  "flex items-center rounded-b-xl border-t bg-muted/50 p-4",
  {
    variants: {
      size: {
        default: "",
        sm: "p-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { size } = React.useContext(CardContext);
  return (
    <div
      data-slot="card-footer"
      className={cn(cardFooterVariants({ size }), className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
