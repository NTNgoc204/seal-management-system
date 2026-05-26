import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import RegisterTeam from './pages/RegisterTeam';
import AdminDashboard from './pages/AdminDashboard';
import TeamArea from './pages/TeamArea';
import GradingBoard from './pages/GradingBoard';
import Leaderboard from './pages/Leaderboard';
import ProtectedRoute from './components/ProtectedRoute';
import HackathonReview from './pages/HackathonReview';
import GuestPortal from './pages/GuestPortal';

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
            <Route path="/" element={
              user ? (
                user.isSystemAdmin || roles.some((r: any) => r.role === 'coordinator') ? (
                  <Navigate to="/admin" />
                ) : roles.some((r: any) => r.role === 'judge') ? (
                  <Navigate to="/grading" />
                ) : (
                  <Navigate to="/guest-portal" />
                )
              ) : (
                <LandingPage user={user} roles={roles} />
              )
            } />
            <Route path="/login" element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
            
            <Route path="/register-team" element={
              <ProtectedRoute user={user} roles={roles} allowedRoles={['participant']}>
                <RegisterTeam />
              </ProtectedRoute>
            } />

            <Route path="/guest-portal" element={
              <ProtectedRoute user={user} roles={roles} allowedRoles={['participant']}>
                <GuestPortal user={user} />
              </ProtectedRoute>
            } />
            
            <Route path="/team-area" element={
              <ProtectedRoute user={user} roles={roles} allowedRoles={['participant']}>
                <TeamArea />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute user={user} roles={roles} allowedRoles={['coordinator']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/grading" element={
              <ProtectedRoute user={user} roles={roles} allowedRoles={['judge']}>
                <GradingBoard />
              </ProtectedRoute>
            } />
            
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/hackathon-review" element={user ? <HackathonReview /> : <Navigate to="/login" />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
