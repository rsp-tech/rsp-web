"use client";

import { Loader2, LogIn, User, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth-modal";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { ProfileDashboardCard } from "./_components/profile-dashboard-card";
import { PersonalSettingsForm } from "./_components/personal-settings-form";
import { useUserProfile, useSubmitProfileUpdate } from "@/hooks/use-user-profile";

const getRoleLabel = (roleId: number | undefined): string => {
  switch (roleId) {
    case 1:
      return "Admin";
    case 2:
      return "Scholar";
    case 3:
      return "VOICE Leader";
    case 4:
      return "Brahmacari";
    case 5:
      return "BVP";
    case 6:
      return "Visitor";
    case 7:
      return "Aspiring Brahmacari";
    case 8:
      return "Manager";
    default:
      return "Visitor";
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  const {
    profile,
    isLoading: profileLoading,
    pendingRequest,
    interestsCount,
  } = useUserProfile();

  const updateMutation = useSubmitProfileUpdate();

  const handleUpdateProfile = async (values: {
    fullName: string;
    phone: string;
    temple: string;
    ashram: string;
    purpose: string;
    authorityName: string;
    authorityEmail: string;
    authorityRelationship: string;
    isVoiceLeader: boolean;
  }) => {
    if (!session?.user) return;

    // Determine the requested role ID based on the user selections
    let requested_role_id: number | null = 6; // Default to Visitor (6)
    if (values.ashram === "Brahmacari") {
      requested_role_id = 4;
    } else if (values.ashram === "Aspiring Brahmacari") {
      requested_role_id = 7;
    } else if (values.isVoiceLeader) {
      requested_role_id = 3;
    } else if (values.ashram === "Student") {
      requested_role_id = 2;
    }

    try {
      await updateMutation.mutateAsync({
        name: values.fullName,
        phone: values.phone || null,
        temple: values.temple || null,
        ashram: values.ashram || null,
        purpose: values.purpose || null,
        authority_name: values.authorityName || null,
        authority_email: values.authorityEmail || null,
        authority_relationship: values.authorityRelationship || null,
        requested_role_id,
        reason: `Settings update (Ashram: ${values.ashram}, VOICE Leader: ${values.isVoiceLeader ? "Yes" : "No"})`,
      });
      toast.success("Settings update request submitted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(
        `Failed to submit settings request: ${err.message || "Unknown error"}`,
      );
    }
  };

  const isLoading = sessionLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">
          Loading profile details...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <User className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            User Profile
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Log in to manage your spiritual profile, update ashram status, and select service preferences.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Login to View Profile</span>
        </Button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences, ashram status, and track leadership responsibilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Dashboard Widget */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <ProfileDashboardCard
            user={session.user}
            fullName={profile?.name || ""}
            ashram={profile?.ashram || ""}
            interestsCount={interestsCount}
            roleId={profile?.role_id}
            getRoleLabel={getRoleLabel}
            onServicesClick={() => router.push("/services")}
            onQueriesClick={() => router.push("/profile/queries")}
          />
        </div>

        {/* Right Column: Settings & Requests */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {pendingRequest && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400 flex gap-3 items-start shadow-sm">
              <Clock className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Update Request Pending Approval</p>
                <p className="text-xs opacity-90">
                  You submitted a settings request on{" "}
                  <span className="font-medium">
                    {pendingRequest.requested_at
                      ? new Date(pendingRequest.requested_at).toLocaleDateString()
                      : "recently"}
                  </span>
                  . These changes are under review by an administrator:
                </p>
                <div className="mt-2 text-xs border-l-2 border-amber-500/30 pl-3 py-1 flex flex-col gap-1 text-muted-foreground dark:text-amber-300/80">
                  {pendingRequest.name !== profile?.name && (
                    <p>• Name change to: <span className="font-medium">{pendingRequest.name}</span></p>
                  )}
                  {pendingRequest.ashram !== profile?.ashram && (
                    <p>• Ashram update to: <span className="font-medium">{pendingRequest.ashram}</span></p>
                  )}
                  {pendingRequest.requested_role_id !== profile?.role_id && (
                    <p>
                      • Role update to:{" "}
                      <span className="font-medium">
                        {getRoleLabel(pendingRequest.requested_role_id ?? undefined)}
                      </span>
                    </p>
                  )}
                  {pendingRequest.phone !== profile?.phone && (
                    <p>• Phone change to: <span className="font-medium">{pendingRequest.phone || "None"}</span></p>
                  )}
                </div>
                <p className="text-[10px] opacity-80 mt-2">
                  To prevent conflicts, you cannot submit another profile update request until the active one is reviewed.
                </p>
              </div>
            </div>
          )}

          <PersonalSettingsForm
            initialValues={{
              fullName: profile?.name || "",
              phone: profile?.phone || "",
              temple: profile?.temple || "",
              ashram: profile?.ashram || "Visitor",
              purpose: profile?.purpose || "",
              authorityName: profile?.authority_name || "",
              authorityEmail: profile?.authority_email || "",
              authorityRelationship: profile?.authority_relationship || "",
              isVoiceLeader: profile?.role_id === 3,
            }}
            onSubmit={handleUpdateProfile}
            updating={updateMutation.isPending}
            hasPendingRequest={!!pendingRequest}
          />
        </div>
      </div>
    </div>
  );
}
