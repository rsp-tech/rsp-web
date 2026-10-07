// biome-ignore-all lint/suspicious/noArrayIndexKey: ok

const logos = [
  { name: "Bank of America", id: "1UyiyDJ-G8iup-g8aTUP7n026eOzPsy5n" },
  { name: "Microsoft", id: "1XTcqqVivWy3Tl-xQyxe2ss63wa7vk4dU" },
  { name: "Amazon", id: "1KOC3TnR5ST180lBOaO6iS-qR1sYmXAfi" },
  { name: "Infosys", id: "1HD7uO_MzRk3CdutLp6SEtuHX-sj6NLxa" },
  { name: "Deutsche Bank", id: "1er3fAvk4yaAUdgwrkJ9AcM1TS-UbSuCK" },
  { name: "MIT", id: "1dphjJV0ZX4x8oAWBBknq4Ez30B9eUFSN" },
  { name: "Harvard", id: "1quy14LZTA-A00S9lbmpi7eOEy9Cn5Fs9" },
  { name: "Stanford", id: "1s4yTeIC3p6TSs5671kg7DH4d2MKkViXR" },
  { name: "Cornell", id: "1cE5k3rZb5IuDB_VG5PUKOTYBWBMukX3W" },
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
              <img
                src={`https://lh3.googleusercontent.com/d/${logo.id}`}
                alt={logo.name}
                width={140}
                height={40}
                className="about-logo-marquee-img"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
