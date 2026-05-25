export default function Timeline() {
  return (
    <section className="py-20" id="schedule">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-container uppercase tracking-widest font-sans">
            Sequence of Events
          </h2>
          <p className="font-mono text-xs text-on-surface-variant mt-2">
            EXECUTION_PHASES_ALPHA
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto py-8">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary-container/30 -translate-x-1/2 hidden md:block"></div>
          
          <div className="space-y-12 relative">
            
            {/* Phase 1 */}
            <div className="flex flex-col md:flex-row items-center gap-6 relative">
              <div className="md:w-1/2 md:text-right w-full">
                <h3 className="text-lg font-bold text-white font-sans">Ideation</h3>
                <p className="font-mono text-xs text-primary-container font-semibold mt-1">March 1 - 10</p>
              </div>
              <div className="z-10 w-6 h-6 rounded-full bg-primary-container glow-cyan ring-4 ring-[#0a141d] border-4 border-surface shadow-[0_0_15px_#00f0ff] shrink-0 hidden md:block"></div>
              <div className="md:w-1/2 w-full">
                <p className="text-on-surface-variant text-sm font-sans leading-relaxed">
                  Concept formulation and team validation. Submit your proposal via the secure portal.
                </p>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="flex flex-col md:flex-row items-center gap-6 relative">
              <div className="md:w-1/2 md:text-right w-full order-1 md:order-none">
                <p className="text-on-surface-variant text-sm font-sans leading-relaxed">
                  Main execution block. High-intensity development at FPT Campus Labs.
                </p>
              </div>
              <div className="z-10 w-6 h-6 rounded-full bg-primary-container glow-cyan ring-4 ring-[#0a141d] border-4 border-surface shadow-[0_0_15px_#00f0ff] shrink-0 hidden md:block"></div>
              <div className="md:w-1/2 w-full order-none">
                <h3 className="text-lg font-bold text-white font-sans">Coding</h3>
                <p className="font-mono text-xs text-primary-container font-semibold mt-1">March 15 - 17</p>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex flex-col md:flex-row items-center gap-6 relative">
              <div className="md:w-1/2 md:text-right w-full">
                <h3 className="text-lg font-bold text-white font-sans">Pitching</h3>
                <p className="font-mono text-xs text-primary-container font-semibold mt-1">March 20</p>
              </div>
              <div className="z-10 w-6 h-6 rounded-full bg-primary-container glow-cyan ring-4 ring-[#0a141d] border-4 border-surface shadow-[0_0_15px_#00f0ff] shrink-0 hidden md:block"></div>
              <div className="md:w-1/2 w-full">
                <p className="text-on-surface-variant text-sm font-sans leading-relaxed">
                  Final demonstration to the jury panel. Winner declaration and reward distribution.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
