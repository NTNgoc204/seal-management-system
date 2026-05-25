import { Terminal } from 'lucide-react';

export default function About() {
  return (
    <section className="py-20 bg-surface-dim relative border-y border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border border-outline-variant/30 bg-surface-container p-8 md:p-12 relative overflow-hidden laser-scan-effect">
          <div className="max-w-3xl space-y-4">
            <span className="font-mono text-xs text-primary-container uppercase tracking-widest block font-semibold">
              Mission Briefing
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight font-sans">
              ORCHESTRATING INNOVATION
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed font-sans">
              SEAL Hackathon is a premier event at FPT University, bringing together the brightest tech-savvy developers to solve real-world challenges through innovation and code. We provide the substrate; you provide the logic. In this 48-hour pressure cooker, teams will transform abstract concepts into functional prototypes that redefine the possible.
            </p>
          </div>
          <div className="absolute top-6 right-6 text-primary-container/20 hidden lg:block">
            <Terminal size={72} />
          </div>
        </div>
      </div>
    </section>
  );
}
