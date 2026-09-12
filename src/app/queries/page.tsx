"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { useSession } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STORE } from "@/constants";
import { useUserQueriesAndReplies } from "@/hooks/use-user-queries-and-replies";
import { getDB } from "@/lib/idb";
import { QueryFilters } from "./_components/query-filters";
import { QueryList } from "./_components/query-list";

export default function UserQueriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, isLoading: sessionLoading } = useSession();

  // Load queries and replies from IndexedDB
  const { data: qData, isLoading: queriesLoading } = useUserQueriesAndReplies(
    session?.user?.id,
  );
  const queries = qData?.queries || [];
  const replies = qData?.replies || {};

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Reply submission states
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});

  const handleSendReply = async (queryId: string) => {
    if (!session?.user) return;
    const text = replyTexts[queryId]?.trim();
    if (!text) return;

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

      setReplyTexts({
        ...replyTexts,
        [queryId]: "",
      });
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
    setReplyTexts({
      ...replyTexts,
      [queryId]: text,
    });
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
          onClick={() => router.push("/profile")}
          className="gap-2"
        >
          <span>Go to Login</span>
        </Button>
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
      matchesStatus = q.status === "open";
    } else if (statusFilter === "closed") {
      matchesStatus = q.status === "resolved" || q.status === "closed";
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge
            variant="outline"
            className="bg-warning/10 text-warning border-warning/20"
          >
            Active / Pending
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
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      {/* Header and Back Link */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary shrink-0" />
              <span>Query Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              View, filter, and track support requests, spiritual questions, and
              role requests.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/contact-us")}
            className="gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Query</span>
          </Button>
        </div>
      </div>

      {/* Main Dashboard Panel */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-lg font-bold">Ticket Filters</CardTitle>
          <CardDescription>
            Narrow down queries by search term, topic category, or active
            status.
          </CardDescription>
        </CardHeader>
        <CardContent
          className="flex flex-col gap-6"
          style={{ paddingTop: "1.5rem" }}
        >
          <QueryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            totalMatches={filteredQueries.length}
          />

          <QueryList
            queries={filteredQueries}
            replies={replies}
            currentUserId={session.user.id}
            replyTexts={replyTexts}
            onReplyTextChange={handleReplyTextChange}
            onSendReply={handleSendReply}
            sendingReply={sendingReply}
            getStatusBadge={getStatusBadge}
            onResetFilters={handleResetFilters}
            onSubmitQueryClick={() => router.push("/contact-us")}
            submitErrors={submitErrors}
          />
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/40 pt-4 bg-muted/5">
          <p className="text-xs text-muted-foreground">
            View volunteering opportunities or manage skills?
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/get-involved")}
            className="gap-1.5 cursor-pointer"
          >
            <span>Get Involved</span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
