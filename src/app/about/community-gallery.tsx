import { SectionHeader } from "./section-header";

const row1 = [
  "Community_1",
  "Community_3",
  "Community_7",
  "Community_9",
  "Community_11",
  "Community_14",
  "Community_18",
  "Community_22",
  "Community_25",
];

const row2 = [
  "Community_2",
  "Community_4",
  "Community_6",
  "Community_8",
  "Community_12",
  "Community_15",
  "Community_19",
  "Community_20",
  "Community_23",
];

const row3 = [
  "Community_5",
  "Community_10",
  "Community_13",
  "Community_16",
  "Community_17",
  "Community_21",
  "Community_24",
  "Community_1",
  "Community_7",
];

interface MarqueeRowProps {
  images: string[];
  duration: string;
  reverse?: boolean;
}

const MarqueeRow = ({ images, duration, reverse = false }: MarqueeRowProps) => (
  <div className="relative w-full overflow-hidden about-marquee-mask">
    <div
      className="flex gap-4 whitespace-nowrap"
      style={{
        width: "max-content",
        animation: `aboutMarqueeAnim ${duration} linear infinite ${reverse ? "reverse" : ""}`,
      }}
    >
      {[...images, ...images].map((img, idx) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: infinite marquee clone
          key={idx}
          className="about-gallery-card"
        >
          <picture>
            <source srcSet={`/assets/about/${img}.avif`} type="image/avif" />
            <source srcSet={`/assets/about/${img}.webp`} type="image/webp" />
            <img
              src={`/assets/about/${img}.jpg`}
              alt="Community engagement"
              width={320}
              height={240}
              className="about-gallery-img"
              loading="lazy"
            />
          </picture>
        </div>
      ))}
    </div>
  </div>
);

export const CommunityGallery = () => {
  return (
    <section
      className="about-section-pad"
      style={{ backgroundColor: "var(--bg-stone)" }}
    >
      <div className="about-section-container">
        <SectionHeader
          subtitle="Visual Chronicles"
          title="Impact in"
          underlinedWord="Action"
          description="Moments from university auditoriums, corporate workshops, youth leadership festivals, and temple community gatherings."
        />
      </div>

      <div className="flex flex-col gap-4 overflow-hidden">
        <MarqueeRow images={row1} duration="45s" />
        <MarqueeRow images={row2} duration="55s" reverse />
        <MarqueeRow images={row3} duration="60s" />
      </div>
    </section>
  );
};
