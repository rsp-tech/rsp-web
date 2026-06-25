"use client";

import { ArrowLeft, ExternalLink, MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { QueryReplyWithUser, UserQuery } from "@/types";
import { QueryFilters } from "./_components/query-filters";
import { QueryList } from "./_components/query-list";

export default function UserQueriesPage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession();
  const [queries, setQueries] = useState<UserQuery[]>([]);
  const [replies, setReplies] = useState<Record<string, QueryReplyWithUser[]>>(
    {},
  );
  const [_loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Reply submission states
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session?.user) {
      const fetchQueriesAndReplies = async () => {
        setLoading(true);
        try {
          const supabase = getSupabaseClient();

          // 1. Fetch user queries
          const { data: queriesData, error: queriesError } = await supabase
            .from("user_queries")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

          if (queriesError) throw queriesError;

          if (queriesData) {
            setQueries(queriesData);

            // 2. Fetch replies for these queries if there are any
            const queryIds = queriesData.map((q) => q.id);
            if (queryIds.length > 0) {
              const { data: repliesData, error: repliesError } = await supabase
                .from("query_replies")
                .select("*, users(name, email)")
                .in("query_id", queryIds)
                .order("created_at", { ascending: true });

              if (repliesError) throw repliesError;

              if (repliesData) {
                const repliesMap: Record<string, QueryReplyWithUser[]> = {};
                for (const reply of repliesData) {
                  if (!repliesMap[reply.query_id]) {
                    repliesMap[reply.query_id] = [];
                  }
                  repliesMap[reply.query_id].push(
                    reply as unknown as QueryReplyWithUser,
                  );
                }
                setReplies(repliesMap);
              }
            }
          }
        } catch (e) {
          console.error("Error fetching queries and replies:", e);
          toast.error("Failed to load query messages.");
        } finally {
          setLoading(false);
        }
      };
      fetchQueriesAndReplies();
    }
  }, [session]);

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
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("query_replies")
        .insert({
          query_id: queryId,
          user_id: session.user.id,
          message: text,
        })
        .select("*, users(name, email)")
        .single();

      if (error) throw error;

      toast.success("Reply sent successfully!");

      const newReply = data as unknown as QueryReplyWithUser;
      const currentReplies = replies[queryId] || [];
      setReplies({
        ...replies,
        [queryId]: [...currentReplies, newReply],
      });

      setReplyTexts({
        ...replyTexts,
        [queryId]: "",
      });
      // biome-ignore lint/suspicious/noExplicitAny: catch block
    } catch (e: any) {
      console.error("Error sending reply:", e);
      const errMsg = e.message || "Unknown error occurred.";
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

  if (sessionLoading) {
    return <Loading message="Loading your query dashboard..." />;
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
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
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/profile")}
            className="gap-1.5 h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight flex items-center gap-2">
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
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
          <CardTitle className="text-lg font-bold">Ticket Filters</CardTitle>
          <CardDescription>
            Narrow down queries by search term, topic category, or active
            status.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-6">
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
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
