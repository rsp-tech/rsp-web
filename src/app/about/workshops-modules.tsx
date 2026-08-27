"use client";

import { Brain, Clock, Flame, HeartHandshake, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./section-header";

interface Workshop {
  num: string;
  title: string;
  desc: string;
  category: "all" | "leadership" | "excellence" | "wellbeing";
}

const workshops: Workshop[] = [
  {
    num: "01",
    title: "Art of Smart Work",
    desc: "Boosting Productivity Through Creativity, Focus & Systemic Prioritization.",
    category: "leadership",
  },
  {
    num: "02",
    title: "Think Clearly, Decide Wisely",
    desc: "Sharpening Judgment and Intuitive Clarity for Better Decisions and Long-Term Results.",
    category: "leadership",
  },
  {
    num: "03",
    title: "Integrity: The Ultimate Advantage",
    desc: "Building Authentic Trust, Unshakeable Credibility & Long-Term Organizational Health.",
    category: "leadership",
  },
  {
    num: "04",
    title: "The Relationship Advantage",
    desc: "Cultivating Deep Empathy, Constructive Collaboration & Enduring Partnerships.",
    category: "leadership",
  },
  {
    num: "05",
    title: "Confidence Without Comparison",
    desc: "Anchoring Self-Worth in Universal Principles and Genuine Self-Discovery.",
    category: "excellence",
  },
  {
    num: "06",
    title: "The Consciousness Code",
    desc: "The Core Foundation of Focus, Self-Discipline & Peak Mental Performance.",
    category: "excellence",
  },
  {
    num: "07",
    title: "Empower Yourself",
    desc: "Five Practical Shastric Tools for Daily Personal Mastery and Meaningful Fulfillment.",
    category: "excellence",
  },
  {
    num: "08",
    title: "Stress to Strength",
    desc: "Transforming Severe Professional Pressures into Positivity and High-Impact Performance.",
    category: "wellbeing",
  },
  {
    num: "09",
    title: "Mastering the Mind",
    desc: "Unlocking Emotional Equilibrium, Mindfulness & Systematic Thought Regulation.",
    category: "wellbeing",
  },
  {
    num: "10",
    title: "The Science of Happiness",
    desc: "Timeless Vedic Sutras for Steady Joy, Lasting Contentment and Balanced Living in a Distracted World.",
    category: "wellbeing",
  },
];

const formats = [
  {
    icon: Clock,
    title: "45-Minute Keynotes",
    desc: "High-impact inspiration for summits and all-hands meetings",
  },
  {
    icon: Users,
    title: "60–90 Min Workshops",
    desc: "Interactive, tool-rich deep dives for teams",
  },
  {
    icon: Flame,
    title: "Half / Full Day Retreats",
    desc: "Comprehensive transformation & immersive experience",
  },
  {
    icon: Brain,
    title: "Executive Sessions",
    desc: "Confidential advisory & leadership alignment",
  },
  {
    icon: HeartHandshake,
    title: "Employee Wellbeing",
    desc: "Structured multi-week mental resilience series",
  },
];

export const WorkshopsModules = () => {
  const [filter, setFilter] = useState<
    "all" | "leadership" | "excellence" | "wellbeing"
  >("all");

  const filtered =
    filter === "all" ? workshops : workshops.filter((w) => w.category === filter);

  return (
    <section
      className="about-section-pad"
      id="workshops"
      style={{ backgroundColor: "var(--bg-cream)" }}
    >
      <div className="about-section-container">
        {/* Title */}
        <SectionHeader
          subtitle="Curated Keynotes & Workshops"
          title="Practical. Relevant."
          underlinedWord="Transformational."
          description="Every session delivers actionable principles that participants can apply immediately — in leadership, decision-making, and daily life."
        />

        {/* Tab Filter */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap reveal-blur">
          <Button
            type="button"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-wider h-9 ${
              filter === "all"
                ? "bg-[var(--primary-dark)] text-white hover:bg-[var(--primary-dark)]/90"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            All Modules
          </Button>
          <Button
            type="button"
            variant={filter === "leadership" ? "default" : "outline"}
            onClick={() => setFilter("leadership")}
            className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-wider h-9 ${
              filter === "leadership"
                ? "bg-[var(--primary-dark)] text-white hover:bg-[var(--primary-dark)]/90"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            Performance & Leadership
          </Button>
          <Button
            type="button"
            variant={filter === "excellence" ? "default" : "outline"}
            onClick={() => setFilter("excellence")}
            className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-wider h-9 ${
              filter === "excellence"
                ? "bg-[var(--primary-dark)] text-white hover:bg-[var(--primary-dark)]/90"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            Personal Excellence
          </Button>
          <Button
            type="button"
            variant={filter === "wellbeing" ? "default" : "outline"}
            onClick={() => setFilter("wellbeing")}
            className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-wider h-9 ${
              filter === "wellbeing"
                ? "bg-[var(--primary-dark)] text-white hover:bg-[var(--primary-dark)]/90"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            Wellbeing & Resilience
          </Button>
        </div>

        {/* Workshops Grid */}
        <div className="about-workshops-grid">
          {filtered.map((w) => (
            <div
              key={w.num}
              className={`about-workshop-card about-tilt-card reveal-3d ${w.num === "10" && filter === "all" ? "capstone" : ""}`}
            >
              <span className="text-3xl font-light font-serif text-[var(--accent-gold)] block mb-4">
                {w.num}
              </span>
              <h3 className="text-xl font-normal font-heading mb-3">
                {w.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {w.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Program Formats */}
        <div className="mt-24 mb-10">
          <SectionHeader
            subtitle="Program Delivery"
            title="Available Formats"
          />
        </div>

        <div className="about-formats-grid">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <div
                key={fmt.title}
                className="about-format-card about-tilt-card reveal-3d"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--bg-cream)] text-[var(--accent-gold-dark)] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-wide mb-2">
                  {fmt.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {fmt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
