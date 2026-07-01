"use client";
import { ExternalLink, Heart, Mail, MessageSquare, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getRoleLabel } from "../utils";

interface ProfileDashboardCardProps {
  user: { email?: string };
  fullName: string;
  ashram: string;
  roleId: number | undefined;
  onServicesClick: () => void;
  onQueriesClick: () => void;
}

export function ProfileDashboardCard({
  user,
  fullName,
  ashram,
  roleId,
  onServicesClick,
  onQueriesClick,
}: ProfileDashboardCardProps) {
  return (
    <Card className="border-border overflow-hidden p-0">
      <div
        className="bg-linear-to-r from-primary/20 via-primary/5 to-transparent border-b border-border/40"
        style={{ height: "6rem" }}
      />
      <div
        className="px-6 pb-6 relative flex flex-col items-center text-center"
        style={{ marginTop: "-2.5rem" }}
      >
        <div
          className="rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary font-bold text-2xl shadow-md mb-4"
          style={{ height: "5rem", width: "5rem" }}
        >
          {fullName
            ? fullName.charAt(0).toUpperCase()
            : user.email?.charAt(0).toUpperCase()}
        </div>

        <h2 className="text-lg font-bold ">
          {fullName || user.email?.split("@")[0] || "User"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {user.email}
        </p>

        <div
          className="w-full border-t border-border"
          style={{ margin: "1.25rem 0" }}
        />

        <div className="w-full flex flex-col gap-4 text-left">
          <div className="flex items-center gap-2 text-xs">
            {[1, 4, 5, 7, 8].includes(roleId ?? 0) && (
              <span
                className={`font-bold p-2 rounded-full border text-xs flex gap-1 ${
                  roleId === 4 || roleId === 7
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                <Shield className="size-4 text-muted-foreground opacity-80" />
                {getRoleLabel(roleId)}
              </span>
            )}
            {ashram && (
              <span className="font-bold bg-muted px-2.5 py-0.5 rounded-full capitalize">
                {ashram}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-muted-foreground opacity-80" />
              Service Interests
            </span>
            <button
              type="button"
              onClick={onServicesClick}
              className="font-bold bg-muted hover:bg-primary/20 hover:text-primary transition-all px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-muted-foreground opacity-80" />
              Support Tickets
            </span>
            <button
              type="button"
              onClick={onQueriesClick}
              className="font-bold bg-muted hover:bg-primary/20 hover:text-primary transition-all px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
