import { Link, useLocation } from 'react-router-dom';
import { Terminal, LogOut, Award, Users, ShieldAlert, GitBranch, BarChart2 } from 'lucide-react';

interface NavbarProps {
  user: any;
  roles: any[];
  onLogout: () => void;
}

export default function Navbar({ user, roles, onLogout }: NavbarProps) {
  const location = useLocation();

  const isSystemAdmin = user?.isSystemAdmin;
  const isCoordinator = roles?.some(r => r.role === 'coordinator') || isSystemAdmin;
  const isJudge = roles?.some(r => r.role === 'judge') || isSystemAdmin;
  const isParticipant = roles?.some(r => r.role === 'participant') || (!isSystemAdmin && !isCoordinator && !isJudge);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]' 
      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'}
  `;

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-premium p-2 rounded-xl text-white group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-indigo-500/20">
            <Terminal size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-gradient-purple-blue">SEAL</span>
            <span className="font-semibold text-xs ml-1 bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">HACKATHON</span>
          </div>
        </Link>

        {/* Navigation Items */}
        {user && (
          <div className="hidden md:flex items-center gap-2">
            
            {/* Participant Links */}
            {isParticipant && (
              <>
                <Link to="/register-team" className={linkClass('/register-team')}>
                  <Users size={16} />
                  <span>Đăng ký Đội</span>
                </Link>
                <Link to="/team-area" className={linkClass('/team-area')}>
                  <GitBranch size={16} />
                  <span>Khu vực Đội thi</span>
                </Link>
              </>
            )}

            {/* Coordinator/Admin Links */}
            {isCoordinator && (
              <Link to="/admin" className={linkClass('/admin')}>
                <ShieldAlert size={16} />
                <span>Quản trị viên</span>
              </Link>
            )}

            {/* Judge/Coordinator Links */}
            {isJudge && (
              <Link to="/grading" className={linkClass('/grading')}>
                <Award size={16} />
                <span>Bàn Chấm điểm</span>
              </Link>
            )}

            {/* General Links */}
            <Link to="/leaderboard" className={linkClass('/leaderboard')}>
              <BarChart2 size={16} />
              <span>Bảng xếp hạng</span>
            </Link>
          </div>
        )}

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">{user.fullName}</p>
                <p className="text-xs text-slate-400">
                  {isSystemAdmin ? 'System Admin' : roles[0]?.role ? `${roles[0].role.toUpperCase()}` : 'Participant'}
                </p>
              </div>

              <div className="h-9 w-9 rounded-full bg-gradient-premium flex items-center justify-center text-white text-sm font-bold shadow-md border border-white/10">
                {user.fullName.charAt(0)}
              </div>

              <button 
                onClick={onLogout} 
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200"
            >
              Đăng nhập
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
