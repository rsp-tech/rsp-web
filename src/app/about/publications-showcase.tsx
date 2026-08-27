import { ArrowRight } from "lucide-react";
import { SectionHeader } from "./section-header";

interface BookItem {
  tag: string;
  title: string;
  desc: string;
  img: string;
  link: string;
}

const books: BookItem[] = [
  {
    tag: "Bestselling Flagship",
    title: "Decoding the Self",
    desc: "A systematic roadmap to self-discovery, emotional intelligence, and discovering one's authentic identity beyond societal programming.",
    img: "/assets/about/book-decoding-the-self",
    link: "https://voicepublication.in/search?attribute_Author=Radheshyam+Das",
  },
  {
    tag: "Personal Growth",
    title: "The Happiness Paradox",
    desc: "Unraveling why modern achievements often leave an internal void — and how ancient Vedic frameworks yield sustainable, resilient peace.",
    img: "/assets/about/book-happiness-paradox",
    link: "https://voicepublication.in/search?attribute_Author=Radheshyam+Das",
  },
  {
    tag: "Productivity & Purpose",
    title: "Art of Smart Work",
    desc: "Mastering focus, energy management, and ethical work productivity inspired by timeless leadership models from Vedic history.",
    img: "/assets/about/book-smart-work",
    link: "https://voicepublication.in/search?attribute_Author=Radheshyam+Das",
  },
];

export const PublicationsShowcase = () => {
  return (
    <section className="about-books-sec" id="books">
      <div className="about-section-container">
        {/* Title */}
        <SectionHeader
          subtitle="Literary Works"
          title="Author of Bestselling"
          underlinedWord="Books"
          description="Transformative books guiding thousands of professionals, students, and seekers worldwide."
          isDark
        />

        {/* Books Grid */}
        <div className="about-books-grid">
          {books.map((b) => (
            <div
              key={b.title}
              className="about-book-card about-tilt-card reveal-3d"
            >
              <div className="flex flex-col">
                <div className="relative aspect-3/4 max-w-[200px] mx-auto rounded-lg overflow-hidden shadow-2xl mb-6">
                  <picture>
                    <source srcSet={`${b.img}.avif`} type="image/avif" />
                    <source srcSet={`${b.img}.webp`} type="image/webp" />
                    <img
                      src={`${b.img}.jpg`}
                      alt={b.title}
                      width={400}
                      height={533}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </picture>
                </div>

                <span className="text-xs uppercase tracking-widest text-[#c2a383] font-semibold mb-2">
                  {b.tag}
                </span>
                <h3 className="text-2xl font-light font-heading text-white mb-3">
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/75 mb-6">
                  {b.desc}
                </p>
              </div>

              <a
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs uppercase tracking-widest text-[#c2a383] hover:text-white font-semibold transition-colors"
              >
                <span>Order On VOICE Publication</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
