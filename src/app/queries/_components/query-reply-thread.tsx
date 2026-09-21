"use client";

import { MessageSquare } from "lucide-react";
import { formatQueryDate } from "@/lib/utils";
import type { QueryAttachment, QueryReplyWithUser } from "@/types";
import { QueryAttachmentList } from "./query-attachment-list";
import { QueryMarkdown } from "./query-markdown";

interface QueryReplyThreadProps {
  replies: QueryReplyWithUser[];
  currentUserId: string;
}

export const QueryReplyThread = ({
  replies,
  currentUserId,
}: QueryReplyThreadProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
        <MessageSquare className="w-3 h-3 text-primary" />
        <span>Conversation Thread ({replies.length})</span>
      </h5>

      {replies.length === 0 ? (
        <p className="text-xs text-muted-foreground opacity-80 italic px-2">
          No response replies yet. We will notify you when administrators
          answer.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {replies.map((reply) => {
            const isAdminReply = reply.user_id !== currentUserId;
            const replierName =
              reply.users?.name || (isAdminReply ? "Support Team" : "Me");

            return (
              <div
                key={reply.id}
                className={`flex flex-col gap-1 p-3 rounded-lg border ${
                  isAdminReply
                    ? "bg-primary/5 border-primary/20 self-start"
                    : "bg-muted/40 border-border self-end"
                }`}
                style={{
                  maxWidth: "85%",
                  ...(isAdminReply ? {} : { textAlign: "right" }),
                }}
              >
                <div
                  className={`flex items-center gap-2 text-xxs text-muted-foreground font-semibold ${
                    isAdminReply ? "justify-start" : "justify-end"
                  }`}
                >
                  <span
                    className={isAdminReply ? "text-primary font-bold" : ""}
                  >
                    {replierName}
                  </span>
                  <span>•</span>
                  <span suppressHydrationWarning>
                    {formatQueryDate(reply.updated_at)}
                  </span>
                </div>
                <div className="mt-0.5 text-left">
                  <QueryMarkdown content={reply.message} />
                </div>
                <QueryAttachmentList
                  attachments={
                    reply.attachments as unknown as QueryAttachment[]
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
