"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { QueryAttachment } from "@/types";
import { QueryAttachmentPicker } from "./query-attachment-picker";

interface QueryReplyFormProps {
  queryId: string;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  attachments?: QueryAttachment[];
  onAttachmentsChange?: (attachments: QueryAttachment[]) => void;
  onSendReply: () => void;
  sending: boolean;
}

export const QueryReplyForm = ({
  queryId,
  replyText,
  onReplyTextChange,
  attachments = [],
  onAttachmentsChange,
  onSendReply,
  sending,
}: QueryReplyFormProps) => {
  return (
    <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
      <Label
        htmlFor={`reply-text-${queryId}`}
        className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
      >
        Send Follow-Up Message
      </Label>
      <div className="flex gap-2 items-start">
        <Textarea
          id={`reply-text-${queryId}`}
          placeholder="Type your response here..."
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          className="text-xs resize-none"
          style={{ minHeight: "3.75rem" }}
        />
        <Button
          type="button"
          onClick={onSendReply}
          disabled={sending || (!replyText.trim() && attachments.length === 0)}
          className="shrink-0 cursor-pointer"
          style={{ height: "3rem", width: "4rem" }}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      {onAttachmentsChange && (
        <QueryAttachmentPicker
          attachments={attachments}
          onChange={onAttachmentsChange}
          disabled={sending}
        />
      )}
    </div>
  );
};
