"use client";

import {
  Bell,
  BellRing,
  CheckCheck,
  FileText,
  Folder,
  Inbox,
  Loader2,
  MessageSquare,
  Music,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { ResolvedNotificationGroup } from "@/types";

const getGroupIcon = (type: ResolvedNotificationGroup["type"]) => {
  switch (type) {
    case "recordings":
      return Music;
    case "materials":
      return FileText;
    case "categories":
      return Folder;
    case "replies":
      return MessageSquare;
    case "requests":
      return UserCheck;
    default:
      return Bell;
  }
};

export const NotificationCenter = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const {
    groups,
    unreadCount,
    isLoading,
    markItemAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const handleItemClick = (
    groupId: string,
    itemId: number | string,
    url: string,
  ) => {
    markItemAsRead(groupId, itemId);
    setOpen(false);
    router.push(url);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Toggle notifications"
          className="relative"
        >
          {unreadCount > 0 ? (
            <>
              <BellRing
                className="w-5 h-5 text-primary"
                style={{ animation: "bounce 1s infinite" }}
              />
              <span
                className="absolute flex h-2 w-2"
                style={{ top: "0.25rem", right: "0.25rem" }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </>
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className={cn("flex flex-col w-full p-0", isMobile ? "" : "max-w-md")}
      >
        <SheetHeader className="border-b border-border p-4 flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2 font-bold">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {unreadCount} new
              </span>
            )}
          </SheetTitle>

          {groups.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => markAllAsRead()}
                  title="Mark all as read"
                  className="text-muted-foreground hover:text-primary"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => clearAll()}
                title="Clear all notifications"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs font-medium">Loading notifications...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <div className="p-3 bg-muted rounded-full">
                <Inbox className="w-6 h-6 text-muted-foreground opacity-80" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-center px-4">
                No new notifications available. We'll alert you when new items
                are synced.
              </p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={groups.map((g) => g.id)}
              className="w-full space-y-4"
            >
              {groups.map((group) => {
                const GroupIcon = getGroupIcon(group.type);
                const hasUnread = group.unreadCount > 0;

                return (
                  <AccordionItem
                    key={group.id}
                    value={group.id}
                    className={cn(
                      "border rounded-xl px-3 transition-all overflow-hidden",
                      hasUnread
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border/40",
                    )}
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2.5 text-left flex-1 pr-4">
                        <div
                          className={cn(
                            "p-2 rounded-lg shrink-0",
                            hasUnread
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <GroupIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {group.title}
                            </h4>
                            {hasUnread && (
                              <span className="shrink-0 px-1.5 py-0.5 text-xxs font-bold bg-primary text-primary-foreground rounded-full">
                                {group.unreadCount} new
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xxs text-muted-foreground opacity-60"
                            suppressHydrationWarning
                          >
                            {new Date(group.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-1 pb-3 space-y-2">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            handleItemClick(group.id, item.id, item.url)
                          }
                          className={cn(
                            "w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 group",
                            item.read
                              ? "bg-background/50 border-border/40 hover:bg-muted opacity-80"
                              : "bg-background border-primary/20 hover:border-border hover:bg-primary/20 shadow-md",
                          )}
                        >
                          <div className="flex-1">
                            <p className="text-xs font-semibold truncate group-hover:text-primary transition-all">
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-xxs text-muted-foreground truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          {!item.read && (
                            <span
                              className="h-2 w-2 rounded-full bg-primary shrink-0"
                              title="Unread"
                            />
                          )}
                        </button>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
