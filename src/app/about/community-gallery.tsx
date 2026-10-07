import { SectionHeader } from "./section-header";

const row1 = [
  "1HHNnRpF5GUxX4m00_4b4OQLdDVNPAARM", // Community_1
  "1SEUIn5VD1ev667QVeRNyl6sqnI7X9qs0", // Community_3
  "1CJx62N6HQ7NZxv23f3GB7w593Y8OUzcE", // Community_7
  "1WAlAO7ZEDG1o7-vDnKiHu7oxkLpb7V-K", // Community_9
  "1Fe5YufbXZKE8se7us5YVeZuaoKA3iyLw", // Community_11
  "1GU_ndzzkW3V6m_WCnuQpXkH6vPEs6q4J", // Community_14
  "1t-YOFHkOQLf1iJ0npZXW5ltiO2t6wQ-k", // Community_18
  "1DRd4TFA-NhV7KicaP3-KrWrETyFSvOw6", // Community_22
  "1V3t4fPOnbNa1-2wRvOTEtAoamWhVi6qF", // Community_25
];

const row2 = [
  "1BTeWEFTBFWwcb6Xj5HbU2hrKP6beFAZK", // Community_2
  "1NpuRJ6hwM2mGvdPVxEJLIsqDq_09EBvd", // Community_4
  "1lcekvW-IF15sS0WAa1cEfIVxuModkDfq", // Community_6
  "1bfYUlzDvg-R-HiGt6292GA3Xj0u1OL9d", // Community_8
  "1h4XJBiNS5werwfd09z2xXK-mbHr7ra7X", // Community_12
  "1fDl7zqGICO5VzBRi4NI_DYtGpYzV3soS", // Community_15
  "1hzJHtlMeNQfMDMs9kXw8HYSfoFPZCEOY", // Community_19
  "1rpPVqcfXUDCq-v5mJm2snTka5d6H927C", // Community_20
  "1w1MoetlyF7Z42ZA_lTRZksDcvtcoPIvz", // Community_23
];

const row3 = [
  "1CLhgzCbdVYLXHs35lhDKRe307EENo_nj", // Community_5
  "13AAC6AU6CBgnw_ythwQNfXz6iCWS_ypl", // Community_10
  "115sxNTFjTqAAPctfKVLJ6viZsmgVRfjf", // Community_13
  "12FngK8YWrfhtMQn8azh5hC1ADOJs7mg3", // Community_16
  "1SWJveQK3xTqxV9TJDOZDYbenwAhjMLiy", // Community_17
  "1VkG5RGJSVAnxnmQbB_SCkStx3DWXdJg3", // Community_21
  "1VFKZ0cHYCG-6wshzc678_hnilwSwMZnx", // Community_24
  "1HHNnRpF5GUxX4m00_4b4OQLdDVNPAARM", // Community_1
  "1CJx62N6HQ7NZxv23f3GB7w593Y8OUzcE", // Community_7
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
        animation: `marquee ${duration} linear infinite ${reverse ? "reverse" : ""}`,
      }}
    >
      {[...images, ...images].map((driveId, idx) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: infinite marquee clone
          key={idx}
          className="about-gallery-card"
        >
          <img
            src={`https://lh3.googleusercontent.com/d/${driveId}`}
            alt="Community engagement"
            width={320}
            height={240}
            className="about-gallery-img"
            loading="lazy"
          />
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
