"use client";

import { Menu } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";

const MobileDrawerContent = dynamic(
  () =>
    import("./mobile-drawer-content").then((mod) => mod.MobileDrawerContent),
  { ssr: false },
);

export function MobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="w-8 h-8 md:hidden hover:bg-accent transition-all shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <MobileDrawerContent {...{ setOpen }} />
    </Sheet>
  );
}
