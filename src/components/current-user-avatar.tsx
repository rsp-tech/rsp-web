"use client";

import { getUserDisplayName } from "@/lib/utils";
import { useSession } from "./providers";
import { Skeleton } from "./ui/skeleton";

export const CurrentUserAvatar = () => {
  const { session, isLoading } = useSession();
  const profileImage = session?.user.user_metadata["avatar_url"] ?? null;
  const name = getUserDisplayName(session?.user, "?");
  const words = name.split(" ");
  const initials = [words[0], words.length > 1 ? (words.pop() ?? "") : ""]
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return isLoading ? (
    <Skeleton className="h-8 w-8 rounded-full" />
  ) : !profileImage ? (
    <img
      src={profileImage}
      alt=""
      className="h-8 w-8 rounded-full object-cover border border-border bg-muted"
    />
  ) : (
    <span className="h-8 w-8 rounded-full border border-border flex justify-center items-center text-sm bg-muted text-muted-foreground">
      {initials}
    </span>
  );
};
