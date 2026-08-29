// biome-ignore-all lint/suspicious/noArrayIndexKey: ok
import {
  BookOpen,
  Building,
  Compass,
  Milestone,
  Plane,
  Sparkles,
} from "lucide-react";

interface TimelineEvent {
  period: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Compass;
}

const timeline: TimelineEvent[] = [
  {
    period: "Early Life & Academic Excellence",
    title: "Vedic Roots & IIT Bombay",
    subtitle: "A thirst for the Absolute Truth",
    description:
      "Born in a devout family near Madurai, Tamil Nadu, surrounded by Vedic chanting and literary classics from Shakespeare to Bhagavad Gita. After graduating with honors from IIT Bombay (M. Tech. Topper) and working as a Senior Research Fellow at CECRI and Mechanical Engineer at Thermax and Mather & Platt, he sought answers beyond materialistic science.",
    icon: Compass,
  },
  {
    period: "1991 – 1994",
    title: "Finding Ultimate Spiritual Shelter",
    subtitle: "Dedication at Chowpatty",
    description:
      "Came in touch with ISKCON in 1991, finding his ultimate spiritual shelter in the teachings of Srila Prabhupada. Deeply inspired by the association of HH Radhanath Swami Maharaja and HH Bhakti Rasamrita Swami Maharaja, he dedicated his life as a full-time brahmacari at Sri Sri Radha Gopinath Mandir, Chowpatty in 1994.",
    icon: Sparkles,
  },
  {
    period: "1995 – 1997",
    title: "Pioneering Pune & Temple Presidentship",
    subtitle: "Youth Outreach in Maharashtra",
    description:
      "Sent to ISKCON Pune under the direction of HH Radhanath Swami Maharaja and GBC HH Gopal Krishna Goswami Maharaja to pioneer youth preaching. In 1997, he assumed the role of Temple President, building a dynamic spiritual center from the ground up.",
    icon: Milestone,
  },
  {
    period: "2000 – 2004",
    title: "Genesis of VOICE & National Festivals",
    subtitle: "Systematic Spiritual Education (BACE to VOICE)",
    description:
      "Founded the famous youth wing BACE (2000), later established as VOICE (2003) to provide SQ-based leadership and spiritual training. In 2004, organized the historic National Youth Festival (NYF) in Pune, bringing together over 5,000 youth from across India.",
    icon: BookOpen,
  },
  {
    period: "2012 – Present",
    title: "The NVCC Spiritual Landmark",
    subtitle: "6-Acre Vedic Cultural Center",
    description:
      "Embarked on constructing the New Vedic Cultural Center (NVCC), Sri Sri Radha Vrindavanchandra Mandir & Balaji Mandir at Katraj-Kondhwa, Pune. Features Govinda's, Bhaktivedanta Model School (BMS), Food For Life, and prasad halls serving thousands of visitors daily.",
    icon: Building,
  },
  {
    period: "2018 – Present",
    title: "Global Duty Officer & Western Outreach",
    subtitle: "Inspiring Universities Across the USA & World",
    description:
      "Appointed as Global Duty Officer (GDO) by the GBC for youth outreach in the West. Conducts extensive annual preaching tours across Harvard, MIT, Stanford, Texas A&M, Berkeley, Chicago, and temples worldwide to mentor the next generation of spiritual leaders.",
    icon: Plane,
  },
];

export const SpiritualJourneyTimeline = () => {
  return (
    <section className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Milestone className="w-4 h-4" />
          <span>Biographical Milestones</span>
        </div>
        <h2 className="about-timeline-section-title font-heading tracking-tight">
          A Life of Dedicated Spiritual Leadership
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          From top engineering academic achievements to leading one of the
          world's most vibrant spiritual and youth training organizations.
        </p>
      </div>

      <div className="about-timeline-track">
        {timeline.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`timeline-${idx}`}
              className="relative flex flex-col gap-2 about-timeline-item group"
            >
              {/* Timeline marker */}
              <div className="about-timeline-marker">
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="about-timeline-badge">{item.period}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {item.subtitle}
                </span>
              </div>

              <h3 className="about-timeline-heading font-heading">
                {item.title}
              </h3>

              <p className="about-timeline-desc">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
