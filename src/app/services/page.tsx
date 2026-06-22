"use client";

import { Heart, Loader2, LogIn, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth-modal";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { Service, UserServiceInterest } from "@/types";
import Loading from "../loading";
import { ServiceItem } from "./service-item";

interface ServiceInterest {
  service_id: number;
  level: string;
  notes: string;
}

export default function ServicesPage() {
  const { session, isLoading: sessionLoading } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [interests, setInterests] = useState<Map<number, ServiceInterest>>(
    new Map(),
  );
  const [initialInterests, setInitialInterests] = useState<
    Map<number, ServiceInterest>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Load services and user interests
  useEffect(() => {
    async function loadData() {
      try {
        const db = await getDB();
        if (!db) return;
        const allServices = await db.getAll(STORE.SERVICES);
        // Sort by order_ind
        const sorted = allServices.sort(
          (a, b) => (a.order_ind ?? 0) - (b.order_ind ?? 0),
        );
        setServices(sorted);

        if (session?.user) {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from("user_service_interests")
            .select("service_id, level, notes")
            .eq("user_id", session.user.id);

          if (error) throw error;

          const interestMap = new Map<number, ServiceInterest>();
          for (const item of data || []) {
            interestMap.set(item.service_id, {
              service_id: item.service_id,
              level: item.level ?? "Basic",
              notes: item.notes ?? "",
            });
          }
          setInterests(new Map(interestMap));
          setInitialInterests(new Map(interestMap));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load services or interests data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  const handleToggleInterest = (serviceId: number) => {
    const next = new Map(interests);
    if (next.has(serviceId)) {
      next.delete(serviceId);
    } else {
      next.set(serviceId, {
        service_id: serviceId,
        level: "Basic",
        notes: "",
      });
    }
    setInterests(next);
  };

  const handleUpdateDetail = (
    serviceId: number,
    field: "level" | "notes",
    value: string,
  ) => {
    const next = new Map(interests);
    const item = next.get(serviceId);
    if (item) {
      next.set(serviceId, {
        ...item,
        [field]: value,
      });
      setInterests(next);
    }
  };

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    const supabase = getSupabaseClient();

    try {
      const toUpsert: UserServiceInterest[] = [];
      const toDelete: number[] = [];

      // Determine additions/updates
      for (const [id, interest] of interests.entries()) {
        toUpsert.push({
          user_id: session.user.id,
          service_id: id,
          level: interest.level,
          notes: interest.notes,
        });
      }

      // Determine deletions
      for (const id of initialInterests.keys()) {
        if (!interests.has(id)) {
          toDelete.push(id);
        }
      }

      // Execute deletes
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_service_interests")
          .delete()
          .eq("user_id", session.user.id)
          .in("service_id", toDelete);

        if (deleteError) throw deleteError;
      }

      // Execute upserts
      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("user_service_interests")
          .upsert(toUpsert);

        if (upsertError) throw upsertError;
      }

      setInitialInterests(new Map(interests));
      toast.success("Service interests saved successfully!");
      // biome-ignore lint/suspicious/noExplicitAny: ok for catch err
    } catch (err: any) {
      console.error(err);
      toast.error(
        `Failed to save interests: ${err.message || "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || loading) {
    return <Loading message="Loading service opportunities..." />;
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Heart className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Service Opportunities
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Log in to view available devotional services and sign up to
            contribute your skills.
          </p>
        </div>
        <Button onClick={() => setAuthOpen(true)} className="gap-2">
          <LogIn className="w-4 h-4" />
          <span>Login to Register Interests</span>
        </Button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
          Devotional Service Opportunities
        </h1>
        <p className="text-muted-foreground text-sm">
          Select the services you would like to volunteer for, select your
          familiarity/skill level, and leave notes on how you can contribute.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {services.length === 0 ? (
          <p className="text-muted-foreground text-center py-12 border border-dashed rounded-xl text-sm">
            No service opportunities currently listed.
          </p>
        ) : (
          services.map((service, idx) => (
            <div
              key={service.id}
              className="animate-stagger-fade-in-up"
              style={
                { "--stagger-delay": `${idx * 50}ms` } as React.CSSProperties
              }
            >
              <ServiceItem
                {...{
                  service,
                  interests,
                  handleToggleInterest,
                  handleUpdateDetail,
                }}
              />
            </div>
          ))
        )}
      </div>

      {services.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-border/80">
          <Button
            type="button"
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 px-6"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Interests</span>
          </Button>
        </div>
      )}
    </div>
  );
}
