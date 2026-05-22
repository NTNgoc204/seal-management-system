import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Mail, Lock, User, BookOpen, Terminal } from 'lucide-react';

const Github = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface LoginProps {
  onLoginSuccess: (token: string, user: any, roles: any[]) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [university, setUniversity] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const baseUrl = 'http://localhost:5000/api';

    try {
      if (isRegister) {
        const response = await axios.post(`${baseUrl}/auth/register`, {
          email,
          password,
          fullName,
          studentId,
          university,
          githubUsername
        });
        const { token, user } = response.data;
        onLoginSuccess(token, user, []);
        navigate('/');
      } else {
        const response = await axios.post(`${baseUrl}/auth/login`, {
          email,
          password
        });
        const { token, user, roles } = response.data;
        onLoginSuccess(token, user, roles);
        
        // Redirect based on role
        if (user.isSystemAdmin || roles.some((r: any) => r.role === 'coordinator')) {
          navigate('/admin');
        } else if (roles.some((r: any) => r.role === 'judge')) {
          navigate('/grading');
        } else {
          navigate('/team-area');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-gradient-dark">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl glow-purple pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl glow-blue pointer-events-none"></div>

      <div className="w-full max-w-lg glass glow-purple p-8 rounded-3xl relative z-10">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-premium p-3 rounded-2xl text-white mb-4 shadow-lg shadow-indigo-600/30">
            <Terminal size={32} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
          </h2>
          <p className="text-slate-400 text-sm">
            SEAL Hackathon Management System
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-3 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mã số Sinh viên</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-3 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="SE180xxx"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Trường Đại học</label>
                  <input 
                    type="text" 
                    placeholder="FPT University"
                    value={university}
                    onChange={e => setUniversity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tên tài khoản GitHub</label>
                <div className="relative">
                  <Github className="absolute left-4 top-3 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="username-github"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 mt-6 flex items-center justify-center gap-2"
          >
            {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1.5 transition-colors duration-150"
            >
              {isRegister ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
