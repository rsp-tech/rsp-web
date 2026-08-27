// biome-ignore-all lint/suspicious/noArrayIndexKey: ok

const logos = [
  { name: "Bank of America", src: "/assets/about/logo-bankofamerica" },
  { name: "Microsoft", src: "/assets/about/logo-microsoft" },
  { name: "Amazon", src: "/assets/about/logo-amazon" },
  { name: "Infosys", src: "/assets/about/logo-infosys" },
  { name: "Deutsche Bank", src: "/assets/about/logo-deutschebank" },
  { name: "MIT", src: "/assets/about/logo-mit" },
  { name: "Harvard", src: "/assets/about/logo-harvard" },
  { name: "Stanford", src: "/assets/about/logo-stanford" },
  { name: "Cornell", src: "/assets/about/logo-cornell" },
];

export const LogoMarquee = () => {
  return (
    <section className="flex flex-col gap-4 py-4 overflow-hidden">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Delivered Keynotes & Leadership Seminars At
        </span>
      </div>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex gap-8 sm:gap-12 items-center py-2 animate-[aboutMarqueeAnim_35s_linear_infinite] whitespace-nowrap w-max">
          {[...logos, ...logos, ...logos].map((logo, idx) => (
            <div
              key={`logo-${idx}`}
              className="flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              style={{ minWidth: "120px" }}
            >
              <picture>
                <source srcSet={`${logo.src}.avif`} type="image/avif" />
                <source srcSet={`${logo.src}.webp`} type="image/webp" />
                <img
                  src={`${logo.src}.png`}
                  alt={logo.name}
                  width={140}
                  height={40}
                  className="h-8 sm:h-9 w-auto max-w-[140px] object-contain dark:invert"
                  loading="lazy"
                />
              </picture>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
