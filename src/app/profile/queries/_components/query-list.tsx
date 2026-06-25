"use client";

import { MessageSquare } from "lucide-react";
import type React from "react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { QueryReplyWithUser, UserQuery } from "@/types";
import { QueryItem } from "./query-item";

interface QueryListProps {
  queries: UserQuery[];
  replies: Record<string, QueryReplyWithUser[]>;
  currentUserId: string;
  replyTexts: Record<string, string>;
  onReplyTextChange: (queryId: string, text: string) => void;
  onSendReply: (queryId: string) => void;
  sendingReply: string | null;
  getStatusBadge: (status: string) => React.ReactNode;
  onResetFilters: () => void;
  onSubmitQueryClick: () => void;
  submitErrors?: Record<string, string>;
}

export function QueryList({
  queries,
  replies,
  currentUserId,
  replyTexts,
  onReplyTextChange,
  onSendReply,
  sendingReply,
  getStatusBadge,
  onResetFilters,
  onSubmitQueryClick,
  submitErrors,
}: QueryListProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed rounded-xl flex flex-col items-center gap-3">
        <MessageSquare className="w-12 h-12 text-muted-foreground opacity-60" />
        <h3 className="font-bold text-foreground">No queries match</h3>
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
    <Accordion
      type="single"
      collapsible
      className="w-full border border-border rounded-lg overflow-hidden bg-card/25 divide-y divide-border/40"
      key={queries.length}
    >
      {queries.map((q) => (
        <QueryItem
          key={q.id}
          q={q}
          replies={replies[q.id] || []}
          currentUserId={currentUserId}
          replyText={replyTexts[q.id] || ""}
          onReplyTextChange={(val) => onReplyTextChange(q.id, val)}
          onSendReply={() => onSendReply(q.id)}
          sending={sendingReply === q.id}
          getStatusBadge={getStatusBadge}
          submitError={submitErrors?.[q.id]}
        />
      ))}
    </Accordion>
  );
}
