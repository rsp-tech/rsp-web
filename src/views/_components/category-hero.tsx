import { BookOpen, Compass } from "lucide-react";

export const CategoryHero = () => {
  return (
    <section className="relative rounded-3xl bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 sm:p-12 overflow-hidden flex flex-col gap-4">
      <div
        className="absolute right-0 bottom-0 top-0 w-1/3 pointer-events-none hidden md:block"
        style={{ opacity: 0.1 }}
      >
        <Compass className="w-full h-full text-primary" />
      </div>
      <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase">
        <BookOpen className="w-4 h-4" />
        <span>Vedic Wisdom Online</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight max-w-2xl text-foreground leading-tight">
        Spiritual Discourses by{" "}
        <span className="text-primary">HG Radheshyamdas</span>
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed font-medium">
        Explore a rich treasury of spiritual lectures, deep commentaries on
        scriptures, and wisdom to guide your daily life.
      </p>
    </section>
  );
};
