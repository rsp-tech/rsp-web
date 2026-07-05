"use client";
import { useIsMobile } from "@/hooks/use-is-mobile";

export const RSPPhoto = () => {
  const isMobile = useIsMobile();

  return (
    <picture>
      <source srcSet="/rsp.avif" type="image/avif" />
      <img
        src="/rsp.webp"
        alt="His Grace Radheshyam Das, M. Tech., IIT, Mumbai"
        width={256}
        height={320}
        className="rounded-xl border border-border"
        style={
          isMobile
            ? {
                width: "100%",
                margin: "0.5rem auto",
              }
            : {
                float: "right",
                margin: "0.5rem 0 0.5rem 1rem",
              }
        }
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
};
