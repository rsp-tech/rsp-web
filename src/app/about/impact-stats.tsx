// biome-ignore-all lint/suspicious/noArrayIndexKey: ok
import { Award, Building2, Home, Trophy, Users } from "lucide-react";

interface StatItem {
  value: string;
  label: string;
  description: string;
  icon: typeof Users;
}

const stats: StatItem[] = [
  {
    value: "500+",
    label: "Brahmacaris Mentored",
    description: "Dedicated full-time monk leaders serving worldwide",
    icon: Users,
  },
  {
    value: "100+",
    label: "VOICE Centers",
    description: "Youth spiritual hostels across India & abroad",
    icon: Home,
  },
  {
    value: "6,000+",
    label: "Congregation Members",
    description: "Thriving practicing community in Pune & Hyderabad",
    icon: Building2,
  },
  {
    value: "#1 Rank",
    label: "Prabhupada Book Marathon",
    description: "Globally bagged top ranks in book distribution",
    icon: Trophy,
  },
  {
    value: "25+ Years",
    label: "Youth Leadership",
    description: "Training at premier IITs, NITs & global universities",
    icon: Award,
  },
];

export const ImpactStats = () => {
  return (
    <section className="about-stats-grid">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="about-stat-card">
            <div className="about-stat-icon">
              <Icon className="w-5 h-5" />
            </div>
            <span className="about-stat-val font-heading">{stat.value}</span>
            <span className="text-xs sm:text-sm font-bold text-foreground mt-1">
              {stat.label}
            </span>
            <span className="about-stat-desc">{stat.description}</span>
          </div>
        );
      })}
    </section>
  );
};
