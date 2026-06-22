"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QueryReplyFormProps {
  queryId: string;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSendReply: () => void;
  sending: boolean;
}

export function QueryReplyForm({
  queryId,
  replyText,
  onReplyTextChange,
  onSendReply,
  sending,
}: QueryReplyFormProps) {
  return (
    <div className="border-t border-border/50 pt-4 flex flex-col gap-2">
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
          className="min-h-[60px] text-xs resize-none"
        />
        <Button
          type="button"
          onClick={onSendReply}
          disabled={sending || !replyText.trim()}
          className="h-12 w-16 shrink-0 cursor-pointer"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
