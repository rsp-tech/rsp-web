import { unstable_cache } from "next/cache";
import { STORE, SYNC_COLUMNS } from "@/constants";
import type { Database } from "@/database.types";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isRoleTable } from "@/lib/sync-utils";
import type { SyncTable } from "@/types";

type SupabaseTable = keyof Database["prod"]["Tables"];

const REVALIDATE_5_MINUTES = 300;

export const getCachedLiveDiff = unstable_cache(
  async (
    table: SyncTable,
    sinceTimestamp: string | null,
    roleId?: number,
  ): Promise<Array<Record<string, unknown>>> => {
    const supabase = getSupabaseServerClient();

    let columns = SYNC_COLUMNS[table]
      ? `${SYNC_COLUMNS[table]}, updated_at`
      : "*, updated_at";

    if (table === STORE.DELETED_RECORDS) {
      columns = "table_name, record_id, updated_at";
    }

    let query = supabase
      .from(table as SupabaseTable)
      .select(columns)
      .order("updated_at", { ascending: true });

    if (sinceTimestamp) {
      query = query.gt("updated_at", sinceTimestamp);
    }

    if (isRoleTable(table)) {
      if (roleId) {
        query = query.or(`allowed_roles.cs.{0},allowed_roles.cs.{${roleId}}`);
      } else {
        query = query.contains("allowed_roles", [0]);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Failed to fetch live diff for ${table}:`, error.message);
      return [];
    }

    return (data as unknown as Array<Record<string, unknown>>) || [];
  },
  ["sync-live-diff"],
  {
    revalidate: REVALIDATE_5_MINUTES,
    tags: ["sync-live-diff"],
  },
);
