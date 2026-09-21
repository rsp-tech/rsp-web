"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogIn, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth-modal";
import { Loading } from "@/components/loading";
import { useSession } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STORE } from "@/constants";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useUserQueriesAndReplies } from "@/hooks/use-user-queries-and-replies";
import { getDB } from "@/lib/idb";
import type { QueryAttachment } from "@/types";
import { NewQueryDialog } from "./_components/new-query-dialog";
import { QueryFilters } from "./_components/query-filters";
import { QueryItem } from "./_components/query-item";
import { QueryList } from "./_components/query-list";

const UserQueriesPage = () => {
  const queryClient = useQueryClient();
  const { session, isLoading: sessionLoading } = useSession();

  // Load queries and replies from IndexedDB
  const { data: qData, isLoading: queriesLoading } = useUserQueriesAndReplies(
    session?.user?.id,
  );
  const queries = qData?.queries || [];
  const replies = qData?.replies || {};

  // Search & Filter state
  const isMobile = useIsMobile();
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [isNewQueryOpen, setIsNewQueryOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Reply submission states
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyAttachments, setReplyAttachments] = useState<
    Record<string, QueryAttachment[]>
  >({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (
    queryId: string,
    newStatus: "open" | "resolved" | "closed",
  ) => {
    if (!session?.user) return;
    setUpdatingStatus(queryId);
    try {
      const res = await fetch("/api/queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_id: queryId,
          status: newStatus,
          user_id: session.user.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update ticket status");
      }

      // Update local IndexedDB
      const db = await getDB();
      if (db && json.data) {
        await db.put(STORE.USER_QUERIES, json.data);
      }

      // Invalidate React Query cache to reflect IDB updates
      queryClient.invalidateQueries({
        queryKey: [STORE.USER_QUERIES, session.user.id],
      });

      const statusLabels: Record<string, string> = {
        open: "reopened",
        resolved: "marked as resolved",
        closed: "closed",
      };
      toast.success(
        `Ticket ${statusLabels[newStatus] || newStatus} successfully.`,
      );
    } catch (err: unknown) {
      console.error("Error updating ticket status:", err);
      const errMsg =
        err instanceof Error ? err.message : "Failed to update ticket status";
      toast.error(errMsg);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSendReply = async (queryId: string) => {
    if (!session?.user) return;
    const text = replyTexts[queryId]?.trim() || "";
    const attachments = replyAttachments[queryId] || [];
    if (!text && attachments.length === 0) return;

    setSubmitErrors((prev) => {
      const copy = { ...prev };
      delete copy[queryId];
      return copy;
    });
    setSendingReply(queryId);
    try {
      const res = await fetch("/api/queries/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_id: queryId,
          user_id: session.user.id,
          message: text,
          attachments,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to send reply");
      }

      // 1. Write the new reply to IndexedDB immediately
      const db = await getDB();
      if (db && json.data) {
        const { users: _, ...replyRow } = json.data;
        await db.put(STORE.QUERY_REPLIES, replyRow);
      }

      // 2. Invalidate the query to trigger a reload from IndexedDB
      queryClient.invalidateQueries({
        queryKey: [STORE.USER_QUERIES, session.user.id],
      });

      toast.success("Reply sent successfully!");

      setReplyTexts((prev) => ({
        ...prev,
        [queryId]: "",
      }));
      setReplyAttachments((prev) => ({
        ...prev,
        [queryId]: [],
      }));
    } catch (e: unknown) {
      console.error("Error sending reply:", e);
      const errMsg = e instanceof Error ? e.message : "Unknown error occurred.";
      setSubmitErrors((prev) => ({
        ...prev,
        [queryId]: errMsg,
      }));
      toast.error(`Failed to send reply: ${errMsg}`);
    } finally {
      setSendingReply(null);
    }
  };

  const handleReplyTextChange = (queryId: string, text: string) => {
    setReplyTexts((prev) => ({
      ...prev,
      [queryId]: text,
    }));
  };

  const handleReplyAttachmentsChange = (
    queryId: string,
    attachments: QueryAttachment[],
  ) => {
    setReplyAttachments((prev) => ({
      ...prev,
      [queryId]: attachments,
    }));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  if (sessionLoading || queriesLoading) {
    return <Loading message="Loading your query dashboard..." />;
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Queries Dashboard
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Log in to view and track your submitted questions, technical
            feedback, and role requests.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Login to View Queries</span>
        </Button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  // Filter queries
  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || q.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = q.status === "open" || q.status === "in_progress";
    } else if (statusFilter === "closed") {
      matchesStatus = q.status === "resolved" || q.status === "closed";
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeQueryId =
    selectedQueryId ?? (!isMobile ? (filteredQueries[0]?.id ?? null) : null);
  const selectedQuery =
    filteredQueries.find((q) => q.id === activeQueryId) ??
    queries.find((q) => q.id === activeQueryId) ??
    null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge
            variant="outline"
            className="bg-warning/10 text-warning border-warning/20"
          >
            Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20"
          >
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-success/10 text-success border-success/20"
          >
            Resolved
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-border"
          >
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col md:flex-row overflow-hidden"
      style={{ height: "calc(100dvh - 3.8rem)" }}
    >
      {/* Left Sidebar: New Query Action, Filters & Tickets List */}
      <div
        className={`w-full shrink-0 flex flex-col h-full overflow-hidden ${
          selectedQueryId && isMobile ? "hidden" : "flex"
        }`}
        style={{
          width: isMobile ? "100%" : "340px",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Top Sidebar Bar with + New Query and Filters */}
        <div className="p-3 border-b border-border/40 bg-muted/20 flex flex-col gap-2.5 shrink-0">
          <Button
            type="button"
            onClick={() => setIsNewQueryOpen(true)}
            className="w-full gap-2 cursor-pointer text-xs font-semibold py-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Query</span>
          </Button>

          <QueryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            totalMatches={filteredQueries.length}
          />
        </div>

        {/* Scrollable Ticket List */}
        <QueryList
          queries={filteredQueries}
          replies={replies}
          selectedQueryId={activeQueryId}
          onSelectQuery={(id) => setSelectedQueryId(id)}
          getStatusBadge={getStatusBadge}
          onResetFilters={handleResetFilters}
          onSubmitQueryClick={() => setIsNewQueryOpen(true)}
        />
      </div>

      {/* Right Reading Pane: Conversation & Composer */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden ${
          !selectedQueryId && isMobile ? "hidden" : "flex"
        }`}
        style={{ minHeight: 0 }}
      >
        {selectedQuery ? (
          <QueryItem
            q={selectedQuery}
            replies={replies[selectedQuery.id] || []}
            currentUserId={session.user.id}
            replyText={replyTexts[selectedQuery.id] || ""}
            onReplyTextChange={(val) =>
              handleReplyTextChange(selectedQuery.id, val)
            }
            replyAttachments={replyAttachments[selectedQuery.id] || []}
            onReplyAttachmentsChange={(atts) =>
              handleReplyAttachmentsChange(selectedQuery.id, atts)
            }
            onSendReply={() => handleSendReply(selectedQuery.id)}
            sending={sendingReply === selectedQuery.id}
            getStatusBadge={getStatusBadge}
            submitError={submitErrors[selectedQuery.id]}
            onBack={() => setSelectedQueryId(null)}
            onStatusChange={(newStatus) =>
              handleStatusChange(selectedQuery.id, newStatus)
            }
            statusUpdating={updatingStatus === selectedQuery.id}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">No Query Selected</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Select a ticket from the sidebar to view the conversation and
              reply.
            </p>
          </div>
        )}
      </div>

      {session?.user && (
        <NewQueryDialog
          open={isNewQueryOpen}
          onOpenChange={setIsNewQueryOpen}
          userId={session.user.id}
          onSuccess={(newQuery) => {
            setSelectedQueryId(newQuery.id);
          }}
        />
      )}
    </div>
  );
};

export default UserQueriesPage;
