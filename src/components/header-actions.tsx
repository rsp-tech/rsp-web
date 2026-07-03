import { Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./notification-center";
import { ThemeSelector } from "./theme-selector";
import { buttonVariants } from "./ui/button";
import { UserNav } from "./user-nav";

export const HeaderActions = () => (
  <div className="flex items-center gap-3 shrink-0">
    <div className="hidden md:flex">
      <ThemeSelector />
    </div>
    <div className="hidden md:flex">
      <Link
        href="/settings"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "cursor-pointer text-muted-foreground hover:text-primary transition-colors",
        )}
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </Link>
    </div>
    <NotificationCenter />
    <div className="hidden md:flex">
      <UserNav />
    </div>
  </div>
);
