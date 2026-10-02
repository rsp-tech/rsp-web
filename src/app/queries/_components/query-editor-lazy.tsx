"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type {
  QueryRichEditorProps,
  QueryRichEditorRef,
} from "./query-rich-editor";

const QueryRichEditor = dynamic(
  () => import("./query-rich-editor").then((mod) => mod.QueryRichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-md border border-border bg-background p-3 text-xs text-muted-foreground animate-pulse min-h-20 flex items-center justify-center">
        Loading editor...
      </div>
    ),
  },
);

export const QueryEditorLazy = forwardRef<
  QueryRichEditorRef,
  QueryRichEditorProps
>((props, ref) => {
  return <QueryRichEditor editorRef={props.editorRef || ref} {...props} />;
});

QueryEditorLazy.displayName = "QueryEditorLazy";
