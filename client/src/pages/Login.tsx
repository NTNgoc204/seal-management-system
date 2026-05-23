import React, { useState, useEffect } from 'react';
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
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if redirect contains GitHub OAuth authorization code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Clear query params so we don't try to log in again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Auto submit OAuth code to Backend
      const exchangeCode = async () => {
        setLoading(true);
        setError('');
        try {
          const baseUrl = 'http://localhost:5000/api';
          const response = await axios.post(`${baseUrl}/auth/github`, {
            code,
            isMock: false
          });
          const { token, user, roles } = response.data;
          onLoginSuccess(token, user, roles || []);
          if (user.isSystemAdmin || (roles && roles.some((r: any) => r.role === 'coordinator'))) {
            navigate('/admin');
          } else if (roles && roles.some((r: any) => r.role === 'judge')) {
            navigate('/grading');
          } else {
            navigate('/team-area');
          }
        } catch (err: any) {
          console.error(err);
          setError(err.response?.data?.message || 'Lỗi xác thực GitHub bằng code.');
        } finally {
          setLoading(false);
        }
      };
      exchangeCode();
    }
  }, []);

  const handleOAuthClick = (provider: 'google' | 'github') => {
    setError('');
    setOauthProvider(provider);
  };

  const handleOAuthSubmit = async (oauthData: any) => {
    setOauthProvider(null);
    setLoading(true);
    setError('');

    const baseUrl = 'http://localhost:5000/api';

    try {
      let response;
      if (oauthProvider === 'google') {
        response = await axios.post(`${baseUrl}/auth/google`, {
          idToken: oauthData.token,
          email: oauthData.email,
          fullName: oauthData.fullName,
          isMock: oauthData.isMock
        });
      } else {
        response = await axios.post(`${baseUrl}/auth/github`, {
          accessToken: oauthData.token,
          email: oauthData.email,
          fullName: oauthData.fullName,
          githubUsername: oauthData.githubUsername,
          isMock: oauthData.isMock
        });
      }

      const { token, user, roles } = response.data;
      onLoginSuccess(token, user, roles || []);
      
      // Redirect based on role
      if (user.isSystemAdmin || (roles && roles.some((r: any) => r.role === 'coordinator'))) {
        navigate('/admin');
      } else if (roles && roles.some((r: any) => r.role === 'judge')) {
        navigate('/grading');
      } else {
        navigate('/team-area');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || `Lỗi kết nối tài khoản ${oauthProvider === 'google' ? 'Google' : 'GitHub'}.`);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 text-xs uppercase tracking-wider text-slate-500 bg-[#090d16] font-semibold">
            Hoặc đăng nhập bằng
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleOAuthClick('google')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthClick('github')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <Github size={16} />
            GitHub
          </button>
        </div>

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

      {oauthProvider && (
        <OAuthModal
          provider={oauthProvider}
          onClose={() => setOauthProvider(null)}
          onSubmit={handleOAuthSubmit}
        />
      )}
    </div>
  );
}

interface OAuthModalProps {
  provider: 'google' | 'github';
  onClose: () => void;
  onSubmit: (data: { email: string; fullName: string; token: string; isMock: boolean; githubUsername?: string }) => void;
}

function OAuthModal({ provider, onClose, onSubmit }: OAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'mock' | 'real'>('mock');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider === 'google' && activeTab === 'real') {
      const initGoogle = () => {
        // @ts-ignore
        if (window.google) {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '901479860432-9ejc1a1d1r71r9r8gm6bnftvkgb866ge.apps.googleusercontent.com',
            callback: (response: any) => {
              onSubmit({
                email: '',
                fullName: '',
                token: response.credential,
                isMock: false
              });
            }
          });
          // @ts-ignore
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'filled_blue', size: 'large', width: 380, shape: 'pill' }
          );
        }
      };
      
      const timer = setTimeout(initGoogle, 200);
      return () => clearTimeout(timer);
    }
  }, [provider, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'mock') {
      if (!email) {
        setError('Vui lòng nhập Email.');
        return;
      }
      onSubmit({
        email,
        fullName: fullName || email.split('@')[0],
        githubUsername: provider === 'github' ? (githubUsername || email.split('@')[0]) : undefined,
        token: '',
        isMock: true
      });
    } else {
      if (!token) {
        setError(`Vui lòng nhập ${provider === 'google' ? 'Google ID Token' : 'GitHub Access Token'}.`);
        return;
      }
      onSubmit({
        email: '',
        fullName: '',
        token,
        isMock: false
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-md glass glow-purple p-6 rounded-3xl relative">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          {provider === 'google' ? (
            <span className="text-red-400">Google Sign-In</span>
          ) : (
            <span className="text-indigo-400">GitHub Sign-In</span>
          )}
        </h3>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveTab('mock'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'mock' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mô phỏng (Mock)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('real'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'real' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Token thực tế (OAuth)
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'mock' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Họ và Tên (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              {provider === 'github' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">GitHub Username (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="github-username"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {provider === 'google' && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-2">
                  <span className="text-xs text-slate-400 mb-3 font-semibold">Bấm để đăng nhập bằng tài khoản Google thật:</span>
                  <div id="google-signin-button" className="min-h-[40px] flex items-center justify-center"></div>
                  <div className="relative my-4 w-full text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <span className="relative px-2 text-[10px] uppercase tracking-wider text-slate-600 bg-[#0f172a] font-bold">
                      Hoặc dán Token thủ công
                    </span>
                  </div>
                </div>
              )}

              {provider === 'github' && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-2">
                  <span className="text-xs text-slate-400 mb-3 font-semibold">Bấm để xác thực qua tài khoản GitHub thật của bạn:</span>
                  <a
                    href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liz8uHIFRtgdwDwE'}&scope=read:user%20user:email`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-white transition-all cursor-pointer text-center"
                  >
                    <Github size={16} />
                    Đăng nhập bằng GitHub
                  </a>
                  <div className="relative my-4 w-full text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <span className="relative px-2 text-[10px] uppercase tracking-wider text-slate-600 bg-[#0f172a] font-bold">
                      Hoặc dán Token thủ công
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {provider === 'google' ? 'Google ID Token (credential)' : 'GitHub Access Token'}
                </label>
                <textarea
                  required={provider !== 'google'}
                  placeholder={provider === 'google' ? 'Dán Google ID Token tại đây...' : 'Dán GitHub Access Token tại đây...'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  rows={provider === 'google' ? 2 : 3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-2 leading-normal">
                  {provider === 'google' 
                    ? 'Nhập trực tiếp ID Token nhận được từ Google SDK, hoặc sử dụng nút Đăng nhập chính thức ở trên.'
                    : 'Access Token nhận được sau khi hoàn tất quy trình OAuth trao đổi code lấy token.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Xác nhận Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
