"use client";

import {
  Award,
  Bell,
  Check,
  Heart,
  Loader2,
  LogIn,
  Mail,
  Phone,
  Send,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth-modal";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { getUserDisplayName } from "@/lib/utils";

const SP_CATEGORIES = [
  { value: "Student", label: "Student (IIT/NIT/College)" },
  { value: "Professional", label: "Working Professional / Corporate" },
  { value: "Congregation", label: "Congregation Member / Grihastha" },
  { value: "Monk", label: "Monk / Full-Time Volunteer (Brahmacari)" },
  { value: "Seeker", label: "Seeker / General Listener" },
];

const ROLES_TO_REQUEST = [
  { value: "Scholar", label: "Scholar / Serious Student" },
  { value: "VOICE Coordinator", label: "VOICE Coordinator / Mentor" },
  { value: "Service Volunteer", label: "Service Volunteer / Coordinator" },
  { value: "Speaker", label: "Preacher / Speaker" },
];

const getRoleLabel = (roleId: number | undefined) => {
  switch (roleId) {
    case 0:
    case undefined:
      return "Listener / Public";
    case 1:
      return "Scholar / Student";
    case 2:
      return "VOICE Coordinator / Mentor";
    case 3:
      return "Preacher / Speaker";
    case 4:
      return "Administrator";
    default:
      return `Custom Role (ID: ${roleId})`;
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [spiritualName, setSpiritualName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Seeker");
  const [subscribedToUpdates, setSubscribedToUpdates] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Role Request state
  const [desiredRole, setDesiredRole] = useState("");
  const [justification, setJustification] = useState("");
  const [submittingRoleRequest, setSubmittingRoleRequest] = useState(false);

  // Stats
  const [interestsCount, setInterestsCount] = useState(0);

  // Populate data when session is loaded
  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata || {};
      setFullName(meta.full_name || "");
      setSpiritualName(meta.spiritual_name || "");
      setPhone(meta.phone || "");
      setCategory(meta.user_category || "Seeker");
      setSubscribedToUpdates(meta.subscribed_to_updates ?? false);

      // Fetch interests count
      const fetchInterestsCount = async () => {
        try {
          const supabase = getSupabaseClient();
          const { count, error } = await supabase
            .from("user_service_interests")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id);
          if (!error && count !== null) {
            setInterestsCount(count);
          }
        } catch (e) {
          console.error("Error fetching service interests count:", e);
        }
      };
      fetchInterestsCount();
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full Name is required.");
      return;
    }

    setUpdatingProfile(true);
    const supabase = getSupabaseClient();

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          spiritual_name: spiritualName,
          phone: phone,
          user_category: category,
          subscribed_to_updates: subscribedToUpdates,
        },
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
      router.refresh();
      // biome-ignore lint/suspicious/noExplicitAny: catch block ok
    } catch (err: any) {
      console.error(err);
      toast.error(
        `Failed to update profile: ${err.message || "Unknown error"}`,
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSubmitRoleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desiredRole) {
      toast.error("Please select a desired role.");
      return;
    }
    if (!justification.trim()) {
      toast.error(
        "Please provide a message/justification for the role request.",
      );
      return;
    }

    setSubmittingRoleRequest(true);
    const supabase = getSupabaseClient();

    try {
      const { error } = await supabase.from("user_queries").insert({
        guest_name: null,
        guest_email: null,
        user_id: session?.user?.id ?? null,
        category: "RoleRequest",
        subject: `Role Request: ${desiredRole}`,
        message: `Desired Role: ${desiredRole}\nSpiritual Category: ${category}\nJustification:\n${justification}`,
        status: "pending",
      });

      if (error) throw error;

      toast.success(
        "Role request submitted successfully! An administrator will review your request.",
      );
      setDesiredRole("");
      setJustification("");
      // biome-ignore lint/suspicious/noExplicitAny: catch block ok
    } catch (err: any) {
      console.error(err);
      toast.error(
        `Failed to submit role request: ${err.message || "Unknown error"}`,
      );
    } finally {
      setSubmittingRoleRequest(false);
    }
  };

  if (sessionLoading) {
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
            Log in to manage your spiritual profile, request role upgrades,
            select categories, and manage updates.
          </p>
        </div>
        <Button onClick={() => setAuthOpen(true)} className="gap-2">
          <LogIn className="w-4 h-4" />
          <span>Login to View Profile</span>
        </Button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const roleId = session.user.app_metadata?.role_id as number | undefined;

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences, volunteer records, and request
          permission access levels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Dashboard Widget */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="border-border/60 overflow-hidden">
            <div className="h-24 bg-linear-to-r from-primary/15 via-primary/5 to-transparent border-b border-border/40" />
            <div className="px-6 pb-6 relative flex flex-col items-center text-center -mt-10">
              <div className="w-20 h-20 rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary font-bold text-2xl shadow-sm mb-3">
                {fullName
                  ? fullName.charAt(0).toUpperCase()
                  : session.user.email?.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-lg font-bold text-foreground">
                {getUserDisplayName(session.user)}
              </h2>
              {spiritualName && (
                <p className="text-xs text-primary font-semibold">
                  {spiritualName}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {session.user.email}
              </p>

              <div className="w-full border-t border-border/60 my-5" />

              <div className="w-full flex flex-col gap-3.5 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground/80" />
                    System Role
                  </span>
                  <span className="font-bold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                    {getRoleLabel(roleId)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-muted-foreground/80" />
                    Spiritual Path
                  </span>
                  <span className="font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full capitalize">
                    {category}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-muted-foreground/80" />
                    Service Interests
                  </span>
                  <span className="font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    {interestsCount}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Settings & Requests */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Card 1: Personal Details */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Personal Settings</span>
              </CardTitle>
              <CardDescription>
                Update your contact details and identify your spiritual or
                volunteer category.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor="full-name"
                    >
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor="spiritual-name"
                    >
                      Spiritual Name (if any)
                    </Label>
                    <Input
                      type="text"
                      id="spiritual-name"
                      value={spiritualName}
                      onChange={(e) => setSpiritualName(e.target.value)}
                      placeholder="e.g. Radhapati Das"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor="phone"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        type="tel"
                        id="phone"
                        className="pl-9"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      htmlFor="category"
                    >
                      Identify Category{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val)}
                    >
                      <SelectTrigger
                        id="category"
                        className="h-8 w-full bg-card border-border text-foreground cursor-pointer"
                      >
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SP_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subscriptions */}
                <div className="flex flex-col gap-3 border-t border-border/50 pt-4 mt-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Updates & Subscriptions
                  </h3>
                  <div className="flex items-start gap-3 mt-1">
                    <input
                      id="opt-in-updates"
                      type="checkbox"
                      checked={subscribedToUpdates}
                      onChange={(e) => setSubscribedToUpdates(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary focus:ring-1 cursor-pointer"
                    />
                    <div className="flex flex-col gap-0.5">
                      <Label
                        htmlFor="opt-in-updates"
                        className="text-xs font-semibold text-foreground cursor-pointer"
                      >
                        Subscribe to spiritual updates and lecture announcements
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Get notify alerts regarding new books, lectures,
                        courses, and updates from HG Radheshyamdas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="gap-1.5"
                >
                  {updatingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Card 2: Request Role Upgrade */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>Request Role Access</span>
              </CardTitle>
              <CardDescription>
                Need access to restricted lectures or coordinator tools? Request
                a role upgrade (excluding administrator).
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitRoleRequest}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor="desired-role"
                  >
                    Desired Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={desiredRole}
                    onValueChange={(val) => setDesiredRole(val)}
                  >
                    <SelectTrigger
                      id="desired-role"
                      className="h-8 w-full bg-card border-border text-foreground cursor-pointer"
                    >
                      <SelectValue placeholder="Select Desired Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES_TO_REQUEST.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor="justification"
                  >
                    Justification / Message{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Provide details about why you need this role upgrade (e.g. details of VOICE youth counseling, spiritual mentor, bhaktivedanta courses details etc.)."
                    className="min-h-[100px] bg-muted/30"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={submittingRoleRequest}
                  className="gap-1.5"
                >
                  {submittingRoleRequest ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Request</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
