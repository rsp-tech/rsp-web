import { describe, expect, it, vi } from "vitest";

vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock("@/hooks/use-mention-search", () => ({
  useMentionSearch: () => ({
    mentionQuery: "",
    setMentionQuery: vi.fn(),
    mentionFilterScope: "all",
    setMentionFilterScope: vi.fn(),
    searchingMentions: false,
    filteredMentionResults: [],
    recCount: 0,
    catCount: 0,
    matCount: 0,
    totalCount: 0,
  }),
}));

describe("Query Rich Editor Components suite", () => {
  it("exports CustomLinkDialog as function", async () => {
    const { CustomLinkDialog } = await import("./custom-link-dialog");
    expect(typeof CustomLinkDialog).toBe("function");
  });

  it("exports MentionDialog as function", async () => {
    const { MentionDialog } = await import("./mention-dialog");
    expect(typeof MentionDialog).toBe("function");
  });

  it("exports QueryEditorToolbar as function", async () => {
    const { QueryEditorToolbar } = await import("./query-editor-toolbar");
    expect(typeof QueryEditorToolbar).toBe("function");
  });

  it("exports QueryRichEditor", async () => {
    const { QueryRichEditor } = await import("./query-rich-editor");
    expect(QueryRichEditor).toBeDefined();
  });

  it("exports QueryEditorLazy", async () => {
    const { QueryEditorLazy } = await import("./query-editor-lazy");
    expect(QueryEditorLazy).toBeDefined();
  });
});
