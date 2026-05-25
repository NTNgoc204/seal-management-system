import { Award, Trophy } from 'lucide-react';

export default function Prizes() {
  return (
    <section className="py-20 bg-surface-container-low" id="prizes">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-4">
          <div>
            <span className="font-mono text-xs text-primary-container uppercase font-semibold">
              Yield_Analysis
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight font-sans mt-1">
              REWARD ALLOCATION
            </h2>
          </div>
          <div className="hidden md:block h-px flex-1 mx-8 bg-outline-variant/30"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          
          {/* 2nd Place */}
          <div className="border border-outline-variant/30 p-8 flex flex-col items-center text-center bg-[#0a141d] group hover:border-primary-container/40 transition-all duration-500 order-2 md:order-1">
            <span className="font-mono text-xs text-primary-container mb-6 font-semibold">[PHASE_02_REWARD]</span>
            <div className="w-16 h-16 rounded-full border border-primary-container/30 flex items-center justify-center mb-6 group-hover:bg-[#00f0ff]/10 transition-colors">
              <Award className="text-primary-container" size={30} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-sans">RUNNER UP</h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Access to exclusive mentorship &amp; dev-kit credits.
            </p>
            <div className="mt-auto font-mono text-base font-bold text-primary-container">
              15,000,000 VND
            </div>
          </div>

          {/* 1st Place */}
          <div className="border border-primary-container/50 p-8 flex flex-col items-center text-center bg-surface-container-high glow-cyan relative overflow-hidden group hover:scale-[1.03] transition-all duration-500 z-10 order-1 md:order-2">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary-container shadow-[0_0_10px_#00f0ff]"></div>
            <span className="font-mono text-xs text-primary-container mb-6 tracking-widest font-semibold">CRITICAL_ASSET</span>
            <div className="w-20 h-20 rounded-full border-2 border-primary-container flex items-center justify-center mb-6 bg-primary-container/20 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <Trophy className="text-primary-container" size={40} />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight font-sans">GRAND PRIZE</h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Full hardware sponsorship &amp; Industry internship placement.
            </p>
            <div className="mt-auto font-sans text-xl font-black text-primary-container tracking-wider">
              35,000,000 VND
            </div>
          </div>

          {/* 3rd Place */}
          <div className="border border-outline-variant/30 p-8 flex flex-col items-center text-center bg-[#0a141d] group hover:border-primary-container/40 transition-all duration-500 order-3 md:order-3">
            <span className="font-mono text-xs text-primary-container mb-6 font-semibold">[PHASE_03_REWARD]</span>
            <div className="w-16 h-16 rounded-full border border-primary-container/30 flex items-center justify-center mb-6 group-hover:bg-[#00f0ff]/10 transition-colors">
              <Award className="text-primary-container" size={30} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-sans">THIRD UNIT</h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Advanced cloud subscription &amp; certification vouchers.
            </p>
            <div className="mt-auto font-mono text-base font-bold text-primary-container">
              5,000,000 VND
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
