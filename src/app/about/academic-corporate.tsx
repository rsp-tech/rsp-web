import { Button } from "@/components/ui/button";
import { SectionHeader } from "./section-header";

export const AcademicCorporate = () => {
  return (
    <div className="flex flex-col">
      {/* Universities Section */}
      <section
        className="about-section-pad"
        style={{ backgroundColor: "var(--bg-white)" }}
      >
        <div className="about-section-container">
          <div className="about-collage-grid">
            <div className="about-collage-card-main reveal-3d">
              <img
                src="https://lh3.googleusercontent.com/d/10AOjH1NOwY0oWFkkS5fZclmRlviAM7SF"
                alt="Academic Lectures at Universities"
                width={800}
                height={500}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex flex-col reveal-right">
              <SectionHeader
                subtitle="Inspiring Top Campuses"
                title="Academic"
                underlinedWord="Keynotes"
                align="left"
              />
              <p className="about-editorial-p">
                Bridging ancient logic with modern academic inquiry, Radheshyam
                Das has conducted highly received guest lectures and seminar
                series at world-class institutions including{" "}
                <strong>
                  MIT, Stanford, Harvard, Cornell, and top IITs & NITs
                </strong>{" "}
                across the globe.
              </p>
              <div className="about-academic-logos reveal-blur">
                {[
                  { name: "MIT", id: "1dphjJV0ZX4x8oAWBBknq4Ez30B9eUFSN" },
                  { name: "HARVARD", id: "1quy14LZTA-A00S9lbmpi7eOEy9Cn5Fs9" },
                  { name: "STANFORD", id: "1s4yTeIC3p6TSs5671kg7DH4d2MKkViXR" },
                  { name: "CORNELL", id: "1cE5k3rZb5IuDB_VG5PUKOTYBWBMukX3W" },
                ].map((logo) => (
                  <img
                    key={logo.name}
                    src={`https://lh3.googleusercontent.com/d/${logo.id}`}
                    alt={logo.name}
                    className="about-academic-logo-img"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Seminars */}
      <section
        className="about-section-pad"
        style={{ backgroundColor: "var(--bg-stone)" }}
      >
        <div className="about-section-container">
          <div className="about-collage-grid about-reverse">
            <div className="flex flex-col reveal-left">
              <SectionHeader
                subtitle="Workplace Excellence"
                title="Corporate"
                underlinedWord="Seminars"
                align="left"
              />
              <p className="about-editorial-p">
                Helping executives and technical teams at{" "}
                <strong>
                  Infosys, Bank of America, Deutsche Bank, Tech Mahindra, and
                  John Deere
                </strong>{" "}
                develop resilient stress-mastery routines, ethical leadership
                frameworks, and clear decision-making processes.
              </p>
              <div>
                <Button
                  asChild
                  size="lg"
                  className="about-btn about-btn-primary"
                >
                  <a href="#workshops">View Workshops</a>
                </Button>
              </div>
            </div>

            <div className="about-collage-card-main reveal-3d">
              <img
                src="https://lh3.googleusercontent.com/d/1TxJjw3uM8TrVckyQqnt_kZ5RBmBNZfZ4"
                alt="Corporate Training Seminar"
                width={800}
                height={500}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
