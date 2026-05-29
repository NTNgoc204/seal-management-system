import { Link } from "react-router-dom";

interface HeroProps {
  user: any;
  roles: any[];
}

export default function Hero({ user, roles }: HeroProps) {
  const isSystemAdmin = user?.isSystemAdmin;
  const isCoordinator =
    roles?.some((r) => r.role === "coordinator") || isSystemAdmin;
  const dashboardLink = user
    ? isSystemAdmin || isCoordinator
      ? "/admin"
      : "/team-area"
    : "/login";

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden py-12">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 w-full">
        {/* Left Intro Text */}
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 border border-primary-container/30 bg-surface-container-low rounded-none">
            <span className="font-mono text-xs text-primary-container tracking-[0.2em] uppercase font-semibold">
              [SYSTEM_READY: PHASE_01]
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-primary-container leading-tight uppercase font-sans">
            LẬP TRÌNH TƯƠNG LAI:
            <br />
            <span className="text-white">SEAL HACKATHON</span>
          </h1>

          <p className="text-on-surface-variant text-base sm:text-lg max-w-lg leading-relaxed mx-auto md:mx-0 font-sans">
            Khai phóng tiềm năng của bạn trong thử thách lập trình đại học đỉnh
            cao. Sáng tạo giải pháp, làm chủ thuật toán và kiến tạo tương lai.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              to={dashboardLink}
              className="btn-primary px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              {user ? "Vào Dashboard" : "Tham gia ngay"}
            </Link>
            <a
              href="#schedule"
              className="border border-white/20 text-white font-mono text-xs px-8 py-3.5 rounded-none hover:bg-white/5 transition-all duration-300 text-center uppercase tracking-widest"
            >
              Xem Lịch trình
            </a>
          </div>
        </div>

        {/* Right Floating Tech Visual */}
        <div className="relative group flex justify-center">
          <div className="absolute inset-0 bg-primary-container/10 blur-[100px] rounded-full group-hover:bg-primary-container/20 transition-all duration-700 pointer-events-none"></div>
          <img
            alt="Global Tech Hackathon Visual"
            className="relative z-10 w-full max-w-md h-auto drop-shadow-[0_0_40px_rgba(0,240,255,0.3)] animate-pulse"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtuK-UXaQw64W3boFFDbFRfPYiq1TjQNct3lIUEiy_GIssBg1Ya0oRSnxMju2hlxlzp8jFigQWJ5TMT883Dw4uBlLCJYSICsp1cUYFc5gEnpFcfKHgiK_WiB3_0zA8xzUOHlY2pYJIhaBsndKQ_wH_-ytC4XQuplxbCbbcN1_025CrNFRBDXkwgYSVZXbOueHcSuX674iY8LLYZLvJmyvB1OB6SkegDyhabBsZJAwNig8zUSIPBVrCuZ20TrUEtyo8CYVj_gUAMGzC"
            style={{ animation: "float 6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}
