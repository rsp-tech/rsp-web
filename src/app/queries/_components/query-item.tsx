"use client";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  Clock,
  RotateCcw,
  X,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { formatQueryDate } from "@/lib/utils";
import type { QueryAttachment, QueryReplyWithUser, UserQuery } from "@/types";
import { QueryAttachmentList } from "./query-attachment-list";
import { QueryMarkdown } from "./query-markdown";
import { QueryReplyForm } from "./query-reply-form";
import { QueryReplyThread } from "./query-reply-thread";

interface QueryItemProps {
  q: UserQuery;
  replies: QueryReplyWithUser[];
  currentUserId: string;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  replyAttachments?: QueryAttachment[];
  onReplyAttachmentsChange?: (attachments: QueryAttachment[]) => void;
  onSendReply: () => void;
  sending: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  submitError?: string;
  onBack?: () => void;
  onStatusChange?: (newStatus: "open" | "resolved" | "closed") => void;
  statusUpdating?: boolean;
}

export const QueryItem = ({
  q,
  replies,
  currentUserId,
  replyText,
  onReplyTextChange,
  replyAttachments = [],
  onReplyAttachmentsChange,
  onSendReply,
  sending,
  getStatusBadge,
  submitError,
  onBack,
  onStatusChange,
  statusUpdating = false,
}: QueryItemProps) => {
  const isClosed = q.status === "closed" || q.status === "resolved";
  const formattedCreated = formatQueryDate(q.created_at);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Ticket Header & Actions Bar */}
      <div className="border-b border-border/40 p-4 bg-muted/20 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden gap-1 px-2 cursor-pointer"
                style={{ marginLeft: "-0.5rem" }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Tickets</span>
              </Button>
            )}
            <span className="text-xxs font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-md">
              {q.category === "RoleRequest" ? "Role Request" : q.category}
            </span>
            <div>{getStatusBadge(q.status)}</div>
          </div>

          {/* Quick Actions (Resolve / Close / Reopen) */}
          <div className="flex items-center gap-2">
            {!isClosed ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange?.("resolved")}
                  disabled={statusUpdating}
                  className="gap-1.5 cursor-pointer text-xs"
                >
                  <Check className="w-4 h-4 text-primary" />
                  <span>Mark Resolved</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusChange?.("closed")}
                  disabled={statusUpdating}
                  className="gap-1.5 cursor-pointer text-xs"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onStatusChange?.("open")}
                disabled={statusUpdating}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-4 h-4 text-primary" />
                <span>Reopen Ticket</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold font-heading leading-snug">
            {q.subject}
          </h2>
          {formattedCreated && (
            <span
              className="text-xxs text-muted-foreground flex items-center gap-1 shrink-0"
              suppressHydrationWarning
            >
              <Clock className="w-3 h-3" />
              <span>Created: {formattedCreated}</span>
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Conversation Content */}
      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
        style={{ minHeight: 0 }}
      >
        {/* Original Query Message */}
        <div className="bg-card border border-border/40 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-2">
            <span className="font-bold text-foreground">Original Query</span>
            {formattedCreated && (
              <span suppressHydrationWarning>{formattedCreated}</span>
            )}
          </div>
          <QueryMarkdown content={q.message} className="p-2" />
          <QueryAttachmentList
            attachments={q.attachments as unknown as QueryAttachment[]}
          />
        </div>

        {/* Discussion Thread */}
        <QueryReplyThread replies={replies} currentUserId={currentUserId} />
      </div>

      {/* Bottom Composer / Closed Status Banner */}
      <div className="border-t border-border/40 p-4 bg-muted/5 shrink-0">
        {!isClosed ? (
          <div className="flex flex-col gap-2">
            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 flex gap-3 items-start shadow-md mb-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-xs text-destructive">
                    Failed to send reply
                  </p>
                  <p className="text-xxs opacity-80 text-destructive">
                    {submitError}
                  </p>
                </div>
              </div>
            )}
            <QueryReplyForm
              queryId={q.id}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              attachments={replyAttachments}
              onAttachmentsChange={onReplyAttachmentsChange}
              onSendReply={onSendReply}
              sending={sending}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 text-xs bg-muted/40 p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                This ticket is marked as{" "}
                <span className="font-semibold text-foreground">
                  {q.status}
                </span>
                . Reopen to continue the conversation.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onStatusChange?.("open")}
              disabled={statusUpdating}
              className="gap-1.5 cursor-pointer text-xs shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-primary" />
              <span>Reopen Ticket</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
