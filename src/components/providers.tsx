"use client";

import type { Session } from "@supabase/supabase-js";
import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import { getQueryClient } from "@/lib/query-client";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { PwaRegister } from "./pwa-register";

const PageViewsTracker = dynamic(() =>
  import("./page-views-tracker").then((mod) => mod.PageViewsTracker),
);

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
});

export const useSession = () => useContext(SessionContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // 2. Listen to real-time auth mutations (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, currentSession) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="monk"
      themes={["clean", "monk", "dark"]}
      disableTransitionOnChange
    >
      <Suspense>
        <SessionContext value={{ session, isLoading }}>
          <QueryClientProvider client={getQueryClient()}>
            <PwaRegister />
            {children}
            <PageViewsTracker />
          </QueryClientProvider>
        </SessionContext>
      </Suspense>
    </ThemeProvider>
  );
}
