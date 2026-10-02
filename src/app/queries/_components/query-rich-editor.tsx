"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Loader2, Send } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Markdown } from "tiptap-markdown";
import { Button } from "@/components/ui/button";
import type { MentionEntity } from "@/hooks/use-mention-search";
import { CustomLinkDialog } from "./custom-link-dialog";
import { MentionDialog } from "./mention-dialog";
import { QueryEditorToolbar } from "./query-editor-toolbar";

export type { MentionEntity };

export interface QueryRichEditorRef {
  openMentionDialog: () => void;
  openLinkDialog: () => void;
  focus: () => void;
  clearContent: () => void;
}

export interface QueryRichEditorProps {
  editorRef?: React.Ref<QueryRichEditorRef>;
  value: string;
  onChange?: (markdown: string) => void;
  onSend?: (markdown: string) => Promise<void> | void;
  sending?: boolean;
  hasAttachments?: boolean;
  placeholder?: string;
  showSendButton?: boolean;
  sendButtonText?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
}

export const QueryRichEditor = forwardRef<
  QueryRichEditorRef,
  QueryRichEditorProps
>(
  (
    {
      editorRef,
      value,
      onChange,
      onSend,
      sending = false,
      hasAttachments = false,
      placeholder = "Type your message here... Use @ to reference lectures, categories, or study materials.",
      showSendButton = false,
      sendButtonText = "Post Reply",
      minHeight = "6rem",
      disabled = false,
    },
    ref,
  ) => {
    const [mentionDialogOpen, setMentionDialogOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);

    // Tracks if mention dialog was triggered by typing '@' so dismissing it can insert literal '@'
    const openedViaAtRef = useRef(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3],
          },
          link: {
            openOnClick: false,
            HTMLAttributes: {
              class: "text-primary font-medium underline",
            },
          },
        }),
        Markdown.configure({
          html: false,
          transformPastedText: true,
          transformCopiedText: true,
        }),
      ],
      content: value,
      editable: !disabled,
      editorProps: {
        attributes: {
          placeholder,
          class:
            "p-3 text-xs focus:outline-none text-foreground leading-relaxed overflow-y-auto",
          style: `min-height: ${minHeight}; max-height: 18rem;`,
        },
        handleKeyDown: (_view, event) => {
          // Ctrl+Enter or Cmd+Enter to send if onSend is defined
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey) &&
            onSend
          ) {
            event.preventDefault();
            handleSend();
            return true;
          }
          // If user types '@', check whether it's preceded by whitespace or start of document
          if (event.key === "@") {
            const { selection, doc } = _view.state;
            const { from } = selection;
            const charBefore = from > 1 ? doc.textBetween(from - 1, from) : "";

            // If preceded by a non-whitespace character (e.g. typing email "contact@domain.com"),
            // allow natural literal '@' typing without intercepting or opening dialog
            if (charBefore && !/\s/.test(charBefore)) {
              return false;
            }

            event.preventDefault();
            openedViaAtRef.current = true;
            setMentionDialogOpen(true);
            return true;
          }
          return false;
        },
      },
      immediatelyRender: false,
      onUpdate: ({ editor: currentEditor }) => {
        const storage = currentEditor.storage as {
          markdown?: { getMarkdown?: () => string };
        };
        const md = storage?.markdown?.getMarkdown?.() || "";
        onChange?.(md);
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        openMentionDialog: () => {
          openedViaAtRef.current = false;
          setMentionDialogOpen(true);
        },
        openLinkDialog: () => {
          setLinkDialogOpen(true);
        },
        focus: () => {
          editor?.commands.focus();
        },
        clearContent: () => {
          editor?.commands.clearContent();
        },
      }),
      [editor],
    );

    useEffect(() => {
      if (!editorRef) return;
      const methods: QueryRichEditorRef = {
        openMentionDialog: () => {
          openedViaAtRef.current = false;
          setMentionDialogOpen(true);
        },
        openLinkDialog: () => {
          setLinkDialogOpen(true);
        },
        focus: () => {
          editor?.commands.focus();
        },
        clearContent: () => {
          editor?.commands.clearContent();
        },
      };

      if (typeof editorRef === "function") {
        editorRef(methods);
      } else if ("current" in editorRef) {
        (
          editorRef as React.MutableRefObject<QueryRichEditorRef | null>
        ).current = methods;
      }
    }, [editorRef, editor]);

    // Synchronize external value changes (e.g. reset form)
    useEffect(() => {
      if (!editor) return;
      const storage = editor.storage as {
        markdown?: { getMarkdown?: () => string };
      };
      const currentMd = storage?.markdown?.getMarkdown?.() || "";
      if (value !== currentMd) {
        editor.commands.setContent(value || "");
      }
    }, [value, editor]);

    // Synchronize disabled state
    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [disabled, editor]);

    const handleDismissLiteralAt = useCallback(() => {
      const shouldInsert = openedViaAtRef.current;
      openedViaAtRef.current = false;
      setMentionDialogOpen(false);

      if (editor) {
        if (shouldInsert) {
          editor.chain().focus().insertContent("@").run();
        } else {
          editor.commands.focus();
        }
      }
    }, [editor]);

    const handleDismissSpaceAt = useCallback(() => {
      openedViaAtRef.current = false;
      setMentionDialogOpen(false);
      editor?.chain().focus().insertContent("@ ").run();
    }, [editor]);

    const handleCancelMention = useCallback(() => {
      openedViaAtRef.current = false;
      setMentionDialogOpen(false);
      editor?.commands.focus();
    }, [editor]);

    const handleSelectMention = useCallback(
      (entity: MentionEntity) => {
        if (!editor) return;

        openedViaAtRef.current = false;
        const typeLabel =
          entity.type === "recording"
            ? "Lecture"
            : entity.type === "category"
              ? "Category"
              : "Material";
        const label = `${typeLabel}: ${entity.name}`;

        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "text",
              text: label,
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: entity.url,
                  },
                },
              ],
            },
            {
              type: "text",
              text: " ",
            },
          ])
          .run();

        setMentionDialogOpen(false);
      },
      [editor],
    );

    const handleInsertCustomLink = useCallback(
      (url: string, text?: string) => {
        if (!editor) return;

        const displayText = text || url;
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "text",
              text: displayText,
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: url,
                  },
                },
              ],
            },
            {
              type: "text",
              text: " ",
            },
          ])
          .run();
      },
      [editor],
    );

    const handleSend = useCallback(() => {
      if (!editor || sending || !onSend) return;

      const storage = editor.storage as {
        markdown?: { getMarkdown?: () => string };
      };
      const markdown = storage?.markdown?.getMarkdown?.() || "";
      const trimmed = markdown.trim();
      if (!trimmed && !hasAttachments) return;

      onSend(trimmed);
      editor.commands.clearContent();
    }, [editor, sending, hasAttachments, onSend]);

    if (!editor) {
      return (
        <div
          className="w-full rounded-md border border-border bg-background p-3 text-xs text-muted-foreground animate-pulse"
          style={{ minHeight }}
        >
          Loading editor...
        </div>
      );
    }

    return (
      <div className="flex flex-col border border-border rounded-md bg-background overflow-hidden focus-visible:border-ring transition-all">
        {/* Formatting Toolbar */}
        <QueryEditorToolbar
          editor={editor}
          onOpenLinkDialog={() => setLinkDialogOpen(true)}
          onOpenMentionDialog={() => {
            openedViaAtRef.current = false;
            setMentionDialogOpen(true);
          }}
          disabled={disabled || sending}
        />

        {/* TipTap Editable Surface */}
        <EditorContent editor={editor} />

        {/* Optional Bottom Action Bar (used for Reply submit) */}
        {showSendButton && onSend && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/20 text-xs">
            <span className="text-muted-foreground text-xxs flex items-center gap-1">
              <span>Press</span>
              <kbd className="px-1 py-0.5 bg-muted rounded-md border border-border text-xxs font-semibold">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1 py-0.5 bg-muted rounded-md border border-border text-xxs font-semibold">
                Enter
              </kbd>
              <span>to send</span>
            </span>

            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={
                disabled || sending || (editor.isEmpty && !hasAttachments)
              }
              className="gap-1.5 cursor-pointer px-4 font-semibold text-xs h-8"
            >
              {sending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>{sendButtonText}</span>
            </Button>
          </div>
        )}

        {/* Mention Dialog (Orama Search over Lectures, Categories, Materials) */}
        <MentionDialog
          open={mentionDialogOpen}
          onOpenChange={setMentionDialogOpen}
          onSelectMention={handleSelectMention}
          onDismissLiteralAt={handleDismissLiteralAt}
          onDismissSpaceAt={handleDismissSpaceAt}
          onCancel={handleCancelMention}
          isOpenViaAt={openedViaAtRef.current}
        />

        {/* Custom Link Dialog */}
        <CustomLinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          onInsertLink={handleInsertCustomLink}
        />
      </div>
    );
  },
);

QueryRichEditor.displayName = "QueryRichEditor";
