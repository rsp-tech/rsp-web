"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "./providers";
import { Skeleton } from "./ui/skeleton";

export const CurrentUserAvatar = () => {
  const { session, isLoading } = useSession();
  const profileImage = session?.user.user_metadata.avatar_url ?? null;
  const name =
    session?.user.user_metadata.full_name ??
    session?.user.email?.split("@")[0] ??
    "?";
  const initials = name
    ?.split(" ")
    ?.map((word: string) => word[0])
    ?.join("")
    ?.toUpperCase();

  return isLoading ? (
    <Skeleton className="h-8 w-8 rounded-full" />
  ) : (
    <Avatar>
      {profileImage && <AvatarImage src={profileImage} alt={initials} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};
