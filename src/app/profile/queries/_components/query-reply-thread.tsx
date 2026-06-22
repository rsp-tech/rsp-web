"use client";

import { MessageSquare } from "lucide-react";
import type { QueryReplyWithUser } from "@/types";

interface QueryReplyThreadProps {
  replies: QueryReplyWithUser[];
  currentUserId: string;
}

export function QueryReplyThread({
  replies,
  currentUserId,
}: QueryReplyThreadProps) {
  return (
    <div className="flex flex-col gap-3">
      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        <span>Conversation Thread ({replies.length})</span>
      </h5>

      {replies.length === 0 ? (
        <p className="text-xs text-muted-foreground/80 italic px-2">
          No response replies yet. We will notify you when administrators
          answer.
        </p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {replies.map((reply) => {
            const isAdminReply = reply.user_id !== currentUserId;
            const replierName =
              reply.users?.name || (isAdminReply ? "Support Team" : "Me");

            return (
              <div
                key={reply.id}
                className={`flex flex-col gap-1 p-3 rounded-lg max-w-[85%] border ${
                  isAdminReply
                    ? "bg-primary/5 border-primary/20 self-start"
                    : "bg-muted/40 border-border/60 self-end text-right"
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-[10px] text-muted-foreground font-semibold ${
                    isAdminReply ? "justify-start" : "justify-end"
                  }`}
                >
                  <span
                    className={isAdminReply ? "text-primary font-bold" : ""}
                  >
                    {replierName}
                  </span>
                  <span>•</span>
                  <span>
                    {reply.created_at
                      ? new Date(reply.created_at).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap mt-0.5 text-left">
                  {reply.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
