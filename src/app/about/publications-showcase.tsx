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
    img: "1NSbUu1nVd82N2VnZNaIeKEZdmd_kcbQI",
    link: "https://voicepublication.in/search?attribute_Author=Radheshyam+Das",
  },
  {
    tag: "Personal Growth",
    title: "The Happiness Paradox",
    desc: "Unraveling why modern achievements often leave an internal void — and how ancient Vedic frameworks yield sustainable, resilient peace.",
    img: "1Gwio2mFWwxEDnUbj3dZGRaEPlmwwXuCK",
    link: "https://voicepublication.in/search?attribute_Author=Radheshyam+Das",
  },
  {
    tag: "Productivity & Purpose",
    title: "Art of Smart Work",
    desc: "Mastering focus, energy management, and ethical work productivity inspired by timeless leadership models from Vedic history.",
    img: "1UkstzKsLRO4yR9Ywkcw6FdgwcXxHrO6l",
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
                <div className="about-book-img-wrap">
                  <img
                    src={`https://lh3.googleusercontent.com/d/${b.img}`}
                    alt={b.title}
                    width={400}
                    height={533}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <span
                  className="about-sec-sub"
                  style={{ textAlign: "left", marginBottom: 8 }}
                >
                  {b.tag}
                </span>
                <h3 className="about-book-title font-heading">{b.title}</h3>
                <p className="about-book-desc">{b.desc}</p>
              </div>

              <a
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="about-book-link"
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
