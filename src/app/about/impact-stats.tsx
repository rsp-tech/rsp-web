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
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-5 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-primary tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground mt-1">
              {stat.label}
            </span>
            <span className="text-[11px] text-muted-foreground leading-snug mt-1 hidden sm:block">
              {stat.description}
            </span>
          </div>
        );
      })}
    </section>
  );
};
