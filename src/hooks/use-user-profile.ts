"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import { STORE } from "@/constants";
import { useUserPendingRequestIdb } from "@/hooks/use-user-pending-request-idb";
import { useUserProfileIdb } from "@/hooks/use-user-profile-idb";
import { getDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";

export const useUserProfile = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const userId = session?.user?.id;

  const profileQuery = useUserProfileIdb(userId);
  const pendingRequestQuery = useUserPendingRequestIdb(userId);

  return {
    profile: profileQuery.data ?? null,
    isLoading:
      profileQuery.isLoading || pendingRequestQuery.isLoading || sessionLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    pendingRequest: pendingRequestQuery.data ?? null,
    isPendingRequestLoading: pendingRequestQuery.isLoading,
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

      // 1. Save to IndexedDB immediately
      const db = await getDB();
      if (db) {
        await db.put(STORE.USER_EDIT_REQUESTS, data);
      }

      return data;
    },
    onSuccess: () => {
      if (session?.user?.id) {
        queryClient.invalidateQueries({
          queryKey: [STORE.USER_EDIT_REQUESTS, session.user.id],
        });
      }
    },
  });
};
