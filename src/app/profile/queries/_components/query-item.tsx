"use client";

import { AlertCircle, Clock } from "lucide-react";
import type React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { QueryReplyWithUser, UserQuery } from "@/types";
import { QueryReplyForm } from "./query-reply-form";
import { QueryReplyThread } from "./query-reply-thread";

interface QueryItemProps {
  q: UserQuery;
  replies: QueryReplyWithUser[];
  currentUserId: string;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSendReply: () => void;
  sending: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  submitError?: string;
}

export function QueryItem({
  q,
  replies,
  currentUserId,
  replyText,
  onReplyTextChange,
  onSendReply,
  sending,
  getStatusBadge,
  submitError,
}: QueryItemProps) {
  return (
    <AccordionItem
      value={q.id}
      className="px-4 border-none hover:bg-muted/10 transition-colors"
      key={replies.length}
    >
      <AccordionTrigger className="w-full hover:no-underline py-4 flex items-start gap-4 cursor-pointer">
        <div className="flex flex-col gap-1 text-left flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-md">
              {q.category === "RoleRequest" ? "Role Request" : q.category}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {q.created_at
                ? new Date(q.created_at).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })
                : "Date unknown"}
            </span>
          </div>
          <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug truncate mt-1">
            {q.subject}
          </h4>
        </div>
        <div className="self-center shrink-0 mr-2">
          {getStatusBadge(q.status)}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 pt-1 px-1 border-t border-border/40 mt-1">
        <div className="flex flex-col gap-5 mt-2">
          {/* Original Query Message */}
          <div className="bg-card border border-border/60 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold">Original Message</span>
              <span>
                {q.created_at
                  ? new Date(q.created_at).toLocaleTimeString(undefined, {
                      timeStyle: "short",
                    })
                  : ""}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30">
              {q.message}
            </p>
          </div>

          {/* Replies Thread */}
          <QueryReplyThread replies={replies} currentUserId={currentUserId} />

          {/* Reply Input Form */}
          {q.status === "open" ? (
            <div className="flex flex-col gap-2 mt-1">
              {submitError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 flex gap-2.5 items-start shadow-sm mb-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                  <div className="flex flex-col gap-0.5">
                    <p className="font-semibold text-xs text-destructive">
                      Failed to send reply
                    </p>
                    <p className="text-[10px] opacity-90 text-destructive">
                      {submitError}
                    </p>
                  </div>
                </div>
              )}
              <QueryReplyForm
                queryId={q.id}
                replyText={replyText}
                onReplyTextChange={onReplyTextChange}
                onSendReply={onSendReply}
                sending={sending}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border mt-1">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                This ticket is closed/resolved and cannot receive further
                replies.
              </span>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
