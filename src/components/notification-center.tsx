"use client";

import { Bell, BellRing, Check, CircleAlert, Inbox, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, isLoading, markAsRead } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell trigger */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
        className="relative"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-5 h-5 text-primary animate-bounce" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </>
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs cursor-default outline-none border-0 w-full h-full"
          onClick={() => setIsOpen(false)}
          aria-label="Close notifications"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-bold font-heading text-lg text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <div className="p-3 bg-muted rounded-full">
                <Inbox className="w-6 h-6 text-muted-foreground/85" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-center px-4">
                No new notifications available. We'll alert you when there is an
                update.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 border rounded-xl flex gap-3 transition-all ${
                  notif.read
                    ? "bg-background border-border opacity-70"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-xs"
                }`}
              >
                <div className="mt-0.5">
                  <CircleAlert
                    className={`w-4 h-4 ${notif.read ? "text-muted-foreground" : "text-primary"}`}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-semibold text-sm text-foreground pr-4">
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as read"
                        className="text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
