"use client";

import {
  Bell,
  BellRing,
  Check,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    markGroupAsRead,
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => markAllAsRead()}
                      aria-label="Mark all as read"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Mark all as read</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => clearAll()}
                    aria-label="Clear all notifications"
                    className="text-muted-foreground hover:text-destructive mr-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Clear all notifications
                </TooltipContent>
              </Tooltip>
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
                    <AccordionTrigger
                      className="hover:no-underline py-3 overflow-hidden"
                      action={
                        hasUnread ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markGroupAsRead(group.id);
                                }}
                                aria-label="Mark group as read"
                                className="text-muted-foreground hover:text-primary shrink-0 ml-1"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Mark group as read
                            </TooltipContent>
                          </Tooltip>
                        ) : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5 text-left flex-1 pr-4 overflow-hidden">
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
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <h4 className="font-semibold text-sm truncate">
                                  {group.title}
                                </h4>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                {group.title}
                              </TooltipContent>
                            </Tooltip>
                            {hasUnread && (
                              <span className="shrink-0 px-1.5 py-0.5 text-xxs font-bold bg-primary text-primary-foreground rounded-full">
                                {group.unreadCount} new
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xxs text-muted-foreground opacity-60 truncate"
                            suppressHydrationWarning
                          >
                            {new Date(group.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-1 pb-3 space-y-2">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 group overflow-hidden",
                            item.read
                              ? "bg-background/50 border-border/40 hover:bg-muted opacity-80"
                              : "bg-background border-primary/20 hover:border-border hover:bg-primary/20 shadow-md",
                          )}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemClick(group.id, item.id, item.url)
                                }
                                className="flex-1 text-left cursor-pointer overflow-hidden"
                              >
                                <p className="text-xs font-semibold truncate group-hover:text-primary transition-all">
                                  {item.title}
                                </p>
                                {item.subtitle && (
                                  <p className="text-xxs text-muted-foreground truncate mt-0.5">
                                    {item.subtitle}
                                  </p>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-semibold text-xs">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xxs text-muted-foreground mt-1">
                                  {item.subtitle}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>

                          {!item.read && (
                            <div className="flex items-center gap-2 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markItemAsRead(group.id, item.id);
                                    }}
                                    aria-label="Mark as read"
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  Mark as read
                                </TooltipContent>
                              </Tooltip>
                              <span
                                className="h-2 w-2 rounded-full bg-primary shrink-0"
                                title="Unread"
                              />
                            </div>
                          )}
                        </div>
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
