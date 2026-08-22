import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { STORE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/constants";
import type { Database } from "@/database.types";
import { getCachedCSV } from "../utils";

type CSVRows = string[][];

const getColumnIndex = (rows: CSVRows, column: string): number => {
  const header = rows[0];

  if (!header) {
    throw new Error("CSV is empty");
  }

  const index = header.indexOf(column);

  if (index === -1) {
    throw new Error(`Column "${column}" not found`);
  }

  return index;
};

const filterByValue = (
  rows: CSVRows,
  column: string,
  value: string,
): CSVRows => {
  const columnIndex = getColumnIndex(rows, column);
  return rows.filter((row, index) => index === 0 || row[columnIndex] === value);
};

const filterBySet = (
  rows: CSVRows,
  column: string,
  values: Set<string>,
): CSVRows => {
  const columnIndex = getColumnIndex(rows, column);
  return rows.filter(
    (row, index) => index === 0 || values.has(row[columnIndex]),
  );
};

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const token = authHeader.slice(7);

    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        db: {
          schema: "prod",
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const [
      users,
      userEditRequests,
      userServiceInterests,
      userQueries,
      queryReplies,
    ] = await Promise.all([
      getCachedCSV(STORE.USERS),
      getCachedCSV(STORE.USER_EDIT_REQUESTS),
      getCachedCSV(STORE.USER_SERVICE_INTERESTS),
      getCachedCSV(STORE.USER_QUERIES),
      getCachedCSV(STORE.QUERY_REPLIES),
    ]);

    const filteredUsers = filterByValue(users, "id", user.id);

    const filteredEditRequests = filterByValue(
      userEditRequests,
      "user_id",
      user.id,
    );

    const filteredInterests = filterByValue(
      userServiceInterests,
      "user_id",
      user.id,
    );

    const filteredQueries = filterByValue(userQueries, "user_id", user.id);

    const queryIdIndex = getColumnIndex(filteredQueries, "id");

    const queryIds = new Set(
      filteredQueries.slice(1).map((row) => row[queryIdIndex]),
    );

    const filteredReplies = filterBySet(queryReplies, "query_id", queryIds);

    return Response.json({
      users: filteredUsers,
      user_edit_requests: filteredEditRequests,
      user_service_interests: filteredInterests,
      user_queries: filteredQueries,
      query_replies: filteredReplies,
    });
  } catch (error) {
    console.error(error);

    return new Response("Failed to fetch backup", {
      status: 502,
    });
  }
};
