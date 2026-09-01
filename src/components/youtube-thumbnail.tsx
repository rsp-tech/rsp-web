"use client";

import { useState } from "react";

interface YouTubeThumbnailProps {
  videoId: string;
  initialUrl?: string;
  title: string;
  className?: string;
}

export const YouTubeThumbnail = ({
  videoId,
  initialUrl,
  title,
  className = "w-full h-full object-cover transition-all duration-200",
}: YouTubeThumbnailProps) => {
  // Candidate thumbnail URLs in order of preference:
  // 1. Initial provided URL (or hqdefault)
  // 2. mqdefault (320x180, widely available 16:9)
  // 3. 0.jpg (default high-res player frame)
  // 4. Local fallback image
  const fallbackUrls = [
    initialUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/0.jpg`,
    "/rsp.webp",
  ];

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const advanceFallback = () => {
    if (candidateIndex < fallbackUrls.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // YouTube returns a 120x90 gray placeholder when requested resolution is missing
    if (img.naturalWidth <= 120 && img.naturalHeight <= 90) {
      advanceFallback();
    }
  };

  if (hasFailedAll) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-4 text-center">
        <span className="text-2xl">🪷</span>
        <span className="text-xs font-medium text-muted-foreground line-clamp-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={fallbackUrls[candidateIndex]}
      alt={title}
      loading="lazy"
      onLoad={handleLoad}
      onError={advanceFallback}
      className={className}
    />
  );
};
