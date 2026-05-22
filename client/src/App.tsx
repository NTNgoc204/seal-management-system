import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import RegisterTeam from './pages/RegisterTeam';
import AdminDashboard from './pages/AdminDashboard';
import TeamArea from './pages/TeamArea';
import GradingBoard from './pages/GradingBoard';
import Leaderboard from './pages/Leaderboard';
import { Trophy, GitBranch, Cpu, Calendar } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (token: string) => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error('Profile fetch failed:', err);
      localStorage.removeItem('token');
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (token: string, loggedUser: any, userRoles: any[]) => {
    localStorage.setItem('token', token);
    setUser(loggedUser);
    setRoles(userRoles || []);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRoles([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-indigo-400 text-lg font-semibold animate-pulse">Loading SEAL Hackathon Platform...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-dark flex flex-col">
        <Navbar user={user} roles={roles} onLogout={handleLogout} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home user={user} roles={roles} />} />
            <Route path="/login" element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
            <Route path="/register-team" element={user ? <RegisterTeam /> : <Navigate to="/login" />} />
            <Route path="/team-area" element={user ? <TeamArea /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/grading" element={user ? <GradingBoard /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; 2026 SEAL Hackathon Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400">Điều khoản</a>
              <a href="#" className="hover:text-slate-400">Bảo mật</a>
              <a href="#" className="hover:text-slate-400">Hỗ trợ kỹ thuật</a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

// Subcomponent: Home Landing Page
interface HomeProps {
  user: any;
  roles: any[];
}

function Home({ user, roles }: HomeProps) {
  return (
    <div className="relative isolate overflow-hidden">
      
      {/* Background radial overlays */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl glow-purple pointer-events-none"></div>
      <div className="absolute top-64 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl glow-blue pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Left Intro Text */}
        <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            Học kỳ Spring / Summer / Fall 2026
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Quản lý SEAL <br />
            <span className="text-gradient-purple-blue">Hackathon</span> Toàn diện
          </h1>
          <p className="text-slate-400 text-base max-w-lg leading-relaxed mx-auto lg:mx-0">
            Hệ thống hỗ trợ quản lý cuộc thi, tự động phân nhóm theo bảng, kéo commits GitHub mỗi 30 phút và phân tích đóng góp của thành viên bằng Gemini AI.
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
            {user ? (
              <Link 
                to={user.isSystemAdmin || roles.some(r => r.role === 'coordinator') ? '/admin' : '/team-area'} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
              >
                Vào Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
              >
                Bắt đầu ngay
              </Link>
            )}
            <Link 
              to="/leaderboard" 
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-8 py-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              Xem Kết quả
            </Link>
          </div>
        </div>

        {/* Right Feature Cards */}
        <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          
          <div className="glass p-6 rounded-2xl glow-purple hover:scale-[1.02] transition-transform duration-300">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl w-fit text-indigo-400 mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Đăng ký Nhóm</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Xác nhận email 100% từ thành viên để hoàn tất. Tự động khoá sổ và phân bảng đấu khi đủ công suất.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl glow-blue hover:scale-[1.02] transition-transform duration-300">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-xl w-fit text-cyan-400 mb-4">
              <GitBranch size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Auto GitHub Repo</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Tự động tạo repo riêng tư dưới Org, tự phân quyền cộng tác viên push cho các thành viên chính thức.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl glow-blue hover:scale-[1.02] transition-transform duration-300">
            <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl w-fit text-sky-400 mb-4">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Trợ lý Gemini AI</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Crawl commits mỗi 30 phút. Đọc patch file để đánh giá chất lượng, dòng code đóng góp và gợi ý điểm.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl glow-purple hover:scale-[1.02] transition-transform duration-300">
            <div className="bg-violet-500/10 border border-violet-500/20 p-3 rounded-xl w-fit text-violet-400 mb-4">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Rubrics & Bảng xếp hạng</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Thiết lập Rubric chi tiết theo trọng số. Chốt khoá điểm của hội đồng thi để lọc ra các đội đi tiếp.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
