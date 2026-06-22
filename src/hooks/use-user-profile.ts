"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import { QUERY_KEY } from "@/constants";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { UserEditRequest, UserProfile } from "@/types";

export const useUserProfile = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const userId = session?.user?.id;

  const profileQuery = useQuery({
    queryKey: [QUERY_KEY.USER_PROFILE, userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
      return data;
    },
    enabled: !sessionLoading && !!userId,
  });

  const pendingRequestQuery = useQuery({
    queryKey: [QUERY_KEY.USER_PENDING_REQUEST, userId],
    queryFn: async (): Promise<UserEditRequest | null> => {
      if (!userId) return null;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("user_edit_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (error) {
        console.error("Error fetching pending request:", error);
        throw error;
      }
      return data;
    },
    enabled: !sessionLoading && !!userId,
  });

  const interestsQuery = useQuery({
    queryKey: ["user-interests-count", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from("user_service_interests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !sessionLoading && !!userId,
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading:
      profileQuery.isLoading ||
      pendingRequestQuery.isLoading ||
      interestsQuery.isLoading ||
      sessionLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    pendingRequest: pendingRequestQuery.data ?? null,
    isPendingRequestLoading: pendingRequestQuery.isLoading,
    interestsCount: interestsQuery.data ?? 0,
  };
};

export const useSubmitProfileUpdate = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      name: string;
      phone: string | null;
      temple: string | null;
      ashram: string | null;
      purpose: string | null;
      authority_name: string | null;
      authority_email: string | null;
      authority_relationship: string | null;
      requested_role_id?: number | null;
      reason?: string | null;
    }) => {
      if (!session?.user?.id) throw new Error("No active session");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("user_edit_requests")
        .insert({
          user_id: session.user.id,
          name: values.name,
          phone: values.phone,
          temple: values.temple,
          ashram: values.ashram,
          purpose: values.purpose,
          authority_name: values.authority_name,
          authority_email: values.authority_email,
          authority_relationship: values.authority_relationship,
          requested_role_id: values.requested_role_id ?? null,
          reason: values.reason ?? "Profile update request by user",
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (session?.user?.id) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.USER_PENDING_REQUEST, session.user.id],
        });
      }
    },
  });
};
