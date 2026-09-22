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
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Delivered Keynotes & Leadership Seminars At
        </span>
      </div>

      <div className="relative w-full overflow-hidden about-marquee-mask">
        <div
          className="about-logo-marquee-track"
          style={{ animation: "marquee 35s linear infinite" }}
        >
          {[...logos, ...logos, ...logos].map((logo, idx) => (
            <div key={`logo-${idx}`} className="about-logo-marquee-item">
              <picture>
                <source srcSet={`${logo.src}.avif`} type="image/avif" />
                <img
                  src={`${logo.src}.webp`}
                  alt={logo.name}
                  width={140}
                  height={40}
                  className="about-logo-marquee-img"
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
