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

export const CommunityGallery = () => {
  return (
    <section
      className="about-section-pad overflow-hidden max-w-full"
      style={{ backgroundColor: "var(--bg-stone)" }}
    >
      <div className="about-section-container mb-12">
        <SectionHeader
          subtitle="Visual Chronicles"
          title="Impact in"
          underlinedWord="Action"
          description="Moments from university auditoriums, corporate workshops, youth leadership festivals, and temple community gatherings."
          className="mb-0"
        />
      </div>

      <div className="flex flex-col gap-4 w-full overflow-hidden max-w-full">
        {/* Row 1 */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="flex gap-4 animate-[aboutMarqueeAnim_45s_linear_infinite] whitespace-nowrap w-max">
            {[...row1, ...row1].map((img, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: infinite marquee clone
                key={idx}
                className="w-64 sm:w-80 aspect-4/3 rounded-xl overflow-hidden shadow-md border border-border/50 shrink-0 bg-muted"
              >
                <picture>
                  <source
                    srcSet={`/assets/about/${img}.avif`}
                    type="image/avif"
                  />
                  <source
                    srcSet={`/assets/about/${img}.webp`}
                    type="image/webp"
                  />
                  <img
                    src={`/assets/about/${img}.jpg`}
                    alt="Community engagement"
                    width={320}
                    height={240}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 (Reverse) */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div
            className="flex gap-4 whitespace-nowrap w-max"
            style={{
              animation: "aboutMarqueeAnim 55s linear infinite reverse",
            }}
          >
            {[...row2, ...row2].map((img, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: infinite marquee clone
                key={idx}
                className="w-64 sm:w-80 aspect-4/3 rounded-xl overflow-hidden shadow-md border border-border/50 shrink-0 bg-muted"
              >
                <picture>
                  <source
                    srcSet={`/assets/about/${img}.avif`}
                    type="image/avif"
                  />
                  <source
                    srcSet={`/assets/about/${img}.webp`}
                    type="image/webp"
                  />
                  <img
                    src={`/assets/about/${img}.jpg`}
                    alt="Community engagement"
                    width={320}
                    height={240}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="flex gap-4 animate-[aboutMarqueeAnim_60s_linear_infinite] whitespace-nowrap w-max">
            {[...row3, ...row3].map((img, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: infinite marquee clone
                key={idx}
                className="w-64 sm:w-80 aspect-4/3 rounded-xl overflow-hidden shadow-md border border-border/50 shrink-0 bg-muted"
              >
                <picture>
                  <source
                    srcSet={`/assets/about/${img}.avif`}
                    type="image/avif"
                  />
                  <source
                    srcSet={`/assets/about/${img}.webp`}
                    type="image/webp"
                  />
                  <img
                    src={`/assets/about/${img}.jpg`}
                    alt="Community engagement"
                    width={320}
                    height={240}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
