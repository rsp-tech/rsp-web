"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import type { QueryAttachment } from "@/types";
import { QueryAttachmentPicker } from "./query-attachment-picker";
import { QueryEditorLazy } from "./query-editor-lazy";
import type { QueryRichEditorRef } from "./query-rich-editor";

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
  const editorRef = useRef<QueryRichEditorRef>(null);

  return (
    <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
      <Label
        htmlFor={`reply-text-${queryId}`}
        className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
      >
        Send Follow-Up Message
      </Label>
      <QueryEditorLazy
        editorRef={editorRef}
        value={replyText}
        onChange={onReplyTextChange}
        onSend={() => onSendReply()}
        sending={sending}
        hasAttachments={attachments.length > 0}
        placeholder="Type your follow-up message here... Type @ to reference lectures, categories, or study materials."
        showSendButton={true}
        sendButtonText="Send Reply"
        minHeight="5rem"
        disabled={sending}
      />
      {onAttachmentsChange && (
        <QueryAttachmentPicker
          attachments={attachments}
          onChange={onAttachmentsChange}
          onAddLinkInline={() => editorRef.current?.openLinkDialog()}
          onSelectContentInline={() => editorRef.current?.openMentionDialog()}
          disabled={sending}
        />
      )}
    </div>
  );
};
