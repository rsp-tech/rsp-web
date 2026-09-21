"use client";

import { MessageSquare } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompactDate } from "@/lib/utils";
import type { QueryAttachment, QueryReplyWithUser, UserQuery } from "@/types";

interface QueryListProps {
  queries: UserQuery[];
  replies: Record<string, QueryReplyWithUser[]>;
  selectedQueryId?: string | null;
  onSelectQuery?: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  onResetFilters: () => void;
  onSubmitQueryClick: () => void;
  // Optional legacy props for compatibility with existing tests
  currentUserId?: string;
  replyTexts?: Record<string, string>;
  onReplyTextChange?: (queryId: string, text: string) => void;
  replyAttachments?: Record<string, QueryAttachment[]>;
  onReplyAttachmentsChange?: (
    queryId: string,
    attachments: QueryAttachment[],
  ) => void;
  onSendReply?: (queryId: string) => void;
  sendingReply?: string | null;
  submitErrors?: Record<string, string>;
}

export const QueryList = ({
  queries,
  replies,
  selectedQueryId,
  onSelectQuery,
  getStatusBadge,
  onResetFilters,
  onSubmitQueryClick,
}: QueryListProps) => {
  if (queries.length === 0) {
    return (
      <div className="text-center py-16 px-4 flex flex-col items-center gap-3">
        <MessageSquare className="w-10 h-10 text-muted-foreground opacity-60" />
        <h3 className="font-bold">No queries match</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          We couldn't find any tickets matching your search filters. Try
          resetting your search terms or send a new request.
        </p>
        <div className="flex gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="cursor-pointer"
          >
            Reset Filters
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmitQueryClick}
            className="cursor-pointer"
          >
            <span>Submit Query</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col divide-y divide-border/40 overflow-y-auto flex-1"
      style={{ minHeight: 0 }}
    >
      {queries.map((q) => {
        const isSelected = q.id === selectedQueryId;
        const qReplies = replies[q.id] || [];
        const latestReply = qReplies[qReplies.length - 1];
        const snippet = latestReply?.message || q.message;
        const timeStamp = formatCompactDate(q.created_at);

        return (
          <Button
            key={q.id}
            type="button"
            variant="ghost"
            onClick={() => onSelectQuery?.(q.id)}
            className={`w-full p-3 text-left flex flex-col gap-1.5 justify-start transition-all cursor-pointer ${
              isSelected ? "bg-muted" : "hover:bg-muted"
            }`}
            style={{
              height: "auto",
              alignItems: "stretch",
              borderRadius: 0,
              borderLeft: isSelected
                ? "3px solid var(--primary)"
                : "3px solid transparent",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xxs font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-md truncate">
                {q.category === "RoleRequest" ? "Role Request" : q.category}
              </span>
              {timeStamp && (
                <span
                  className="text-xxs text-muted-foreground shrink-0"
                  suppressHydrationWarning
                >
                  {timeStamp}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold truncate leading-snug">
              {q.subject}
            </span>
            <p className="text-xs text-muted-foreground truncate leading-relaxed">
              {snippet}
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div>{getStatusBadge(q.status)}</div>
              {qReplies.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xxs gap-1 py-0.5 px-1.5"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{qReplies.length}</span>
                </Badge>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
};
