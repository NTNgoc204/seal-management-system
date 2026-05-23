import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarPlus, ShieldAlert, Award, FileUp, FolderKanban, Plus, Lock, Users, Info, Settings2 } from 'lucide-react';

export default function AdminDashboard() {
  const token = localStorage.getItem('token');

  // Event creation states
  const [eventName, setEventName] = useState('');
  const [semester, setSemester] = useState('Spring');
  const [year, setYear] = useState('2026');
  const [desc, setDesc] = useState('');
  const [maxTeams, setMaxTeams] = useState('10');
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Track states
  const [tracks, setTracks] = useState<any[]>([]);
  const [trackName, setTrackName] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  const [trackMax, setTrackMax] = useState('5');
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  // Round states
  const [rounds, setRounds] = useState<any[]>([]);
  const [roundName, setRoundName] = useState('');
  const [roundOrder, setRoundOrder] = useState('1');
  const [roundDeadline, setRoundDeadline] = useState('');
  const [roundLimit, setRoundLimit] = useState('3');

  // Rubric States
  const [rubricName, setRubricName] = useState('');
  const [rubric, setRubric] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  
  // Criterion States
  const [critCode, setCritCode] = useState('');
  const [critName, setCritName] = useState('');
  const [critWeight, setCritWeight] = useState('20');
  const [critDesc, setCritDesc] = useState('');

  // Role management states
  const [roleEmail, setRoleEmail] = useState('');
  const [roleType, setRoleType] = useState('judge');

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Attachments state
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // GitHub integration states
  const [githubOrgName, setGithubOrgName] = useState('seal-hackathon-2026');
  const [repos, setRepos] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [linkingTeamId, setLinkingTeamId] = useState('');
  const [manualRepoName, setManualRepoName] = useState('');
  const [manualRepoUrl, setManualRepoUrl] = useState('');
  const [syncingRepoId, setSyncingRepoId] = useState('');

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

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/events');
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEvent) {
        handleSelectEvent(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchRepositories = async (eventId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/github-repositories?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRepos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllTeams = async (eventId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/teams/all/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllTeams(res.data.filter((t: any) => t.status === 'confirmed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvent = async (eventObj: any) => {
    setSelectedEvent(eventObj);
    setSelectedTrack(null);
    setRubric(null);
    setCriteria([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/events/${eventObj._id}`);
      setTracks(res.data.tracks || []);
      setRounds(res.data.rounds || []);
      if (res.data.tracks && res.data.tracks.length > 0) {
        setSelectedTrack(res.data.tracks[0]);
      }
      fetchRepositories(eventObj._id);
      fetchAllTeams(eventObj._id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedTrack) {
      fetchRoundsAndRubric();
    }
  }, [selectedTrack]);

  const fetchRoundsAndRubric = async () => {
    // Try to load rubric for Round 1 of selected track
    const roundOne = rounds.find(r => r.trackId === selectedTrack._id && r.order === 1);
    if (roundOne) {
      try {
        const res = await axios.get(`http://localhost:5000/api/rubrics/round/${roundOne._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRubric(res.data.rubric);
        setCriteria(res.data.criteria);
      } catch (err) {
        setRubric(null);
        setCriteria([]);
      }
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      await axios.post(
        'http://localhost:5000/api/events',
        {
          name: eventName,
          semester,
          year: parseInt(year),
          description: desc,
          maxTeams: parseInt(maxTeams),
          githubOrgName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Tạo cuộc thi thành công!' });
      setEventName('');
      setDesc('');
      setGithubOrgName('seal-hackathon-2026');
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo cuộc thi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEventStatus = async (newStatus: string) => {
    if (!selectedEvent) return;
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/events/${selectedEvent._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Cập nhật trạng thái cuộc thi thành công!' });
      // Update local state
      setSelectedEvent(res.data.event);
      // Fetch all events to update the list status
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật trạng thái cuộc thi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepo = async (teamId: string) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.post(
        'http://localhost:5000/api/github-repositories/create',
        { teamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: res.data.message });
      if (selectedEvent) {
        fetchRepositories(selectedEvent._id);
        fetchAllTeams(selectedEvent._id);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo repository.' });
    }
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingTeamId || !manualRepoName || !manualRepoUrl) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(
        'http://localhost:5000/api/github-repositories/link',
        { teamId: linkingTeamId, repoName: manualRepoName, repoUrl: manualRepoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: res.data.message });
      setManualRepoName('');
      setManualRepoUrl('');
      setLinkingTeamId('');
      if (selectedEvent) {
        fetchRepositories(selectedEvent._id);
        fetchAllTeams(selectedEvent._id);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi liên kết repository.' });
    }
  };

  const handleSyncRepo = async (repoId: string) => {
    setSyncingRepoId(repoId);
    setMessage({ type: '', text: '' });
    try {
      setMessage({ type: 'success', text: 'Đang bắt đầu đồng bộ và chạy AI Review...' });
      const res = await axios.post(
        `http://localhost:5000/api/github-repositories/${repoId}/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: res.data.message });
      if (selectedEvent) {
        fetchRepositories(selectedEvent._id);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi đồng bộ.' });
    } finally {
      setSyncingRepoId('');
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setMessage({ type: '', text: '' });

    try {
      await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/tracks`,
        { name: trackName, description: trackDesc, maxTeams: parseInt(trackMax) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrackName('');
      setTrackDesc('');
      setMessage({ type: 'success', text: 'Tạo bảng đấu thành công!' });
      // Refresh event tracks
      handleSelectEvent(selectedEvent);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo track.' });
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedTrack) return;

    try {
      await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/tracks/${selectedTrack._id}/rounds`,
        { name: roundName, order: parseInt(roundOrder), submissionDeadline: roundDeadline, advanceTopN: parseInt(roundLimit) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoundName('');
      setRoundDeadline('');
      setMessage({ type: 'success', text: 'Thêm vòng đấu thành công!' });
      handleSelectEvent(selectedEvent);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi thêm vòng đấu.' });
    }
  };

  const handleCreateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedTrack || rounds.length === 0) return;
    const roundOne = rounds.find(r => r.trackId === selectedTrack._id && r.order === 1);
    if (!roundOne) {
      setMessage({ type: 'error', text: 'Vui lòng tạo Vòng đấu (Round 1) trước.' });
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/rubrics',
        {
          eventId: selectedEvent._id,
          trackId: selectedTrack._id,
          roundId: roundOne._id,
          name: rubricName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRubricName('');
      setMessage({ type: 'success', text: 'Khởi tạo Rubric thành công!' });
      fetchRoundsAndRubric();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi khởi tạo Rubric.' });
    }
  };

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubric) return;

    try {
      await axios.post(
        `http://localhost:5000/api/rubrics/${rubric._id}/criteria`,
        {
          code: critCode,
          name: critName,
          weight: parseFloat(critWeight),
          description: critDesc
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCritCode('');
      setCritName('');
      setCritDesc('');
      setMessage({ type: 'success', text: 'Đã thêm tiêu chí chấm điểm!' });
      fetchRoundsAndRubric();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi thêm tiêu chí.' });
    }
  };

  const handleLockRubric = async () => {
    if (!rubric) return;
    try {
      await axios.post(
        `http://localhost:5000/api/rubrics/${rubric._id}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Đã khoá Rubric! Hệ thống sẵn sàng cho Giám khảo chấm điểm.' });
      fetchRoundsAndRubric();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khoá Rubric.' });
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      await axios.post(
        'http://localhost:5000/api/auth/assign-role',
        {
          userEmail: roleEmail,
          eventId: selectedEvent._id,
          trackId: selectedTrack?._id,
          role: roleType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoleEmail('');
      setMessage({ type: 'success', text: `Phân quyền ${roleType.toUpperCase()} thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi phân quyền.' });
    }
  };

  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/upload-exam`,
        {
          trackId: selectedTrack?._id,
          fileName: attachmentName,
          fileUrl: attachmentUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttachmentName('');
      setAttachmentUrl('');
      setMessage({ type: 'success', text: 'Tải lên tài liệu đề thi thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi tải tài liệu.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column: Events & Creation */}
      <div className="lg:col-span-1 space-y-8">
        
        {/* Create Event */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CalendarPlus size={20} className="text-indigo-400" />
            <span>Khởi tạo Học kỳ / Cuộc thi</span>
          </h2>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tên Cuộc thi</label>
              <input 
                type="text" required placeholder="SEAL Hackathon 2026"
                value={eventName} onChange={e => setEventName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">GitHub Organization</label>
              <input 
                type="text" placeholder="seal-hackathon-2026"
                value={githubOrgName} onChange={e => setGithubOrgName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Học kỳ</label>
                <select 
                  value={semester} onChange={e => setSemester(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Năm</label>
                <input 
                  type="number" required value={year} onChange={e => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Max Teams</label>
                <input 
                  type="number" required value={maxTeams} onChange={e => setMaxTeams(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Mô tả</label>
              <textarea 
                placeholder="Mô tả cuộc thi..." rows={3}
                value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
              ></textarea>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              {loading ? 'Đang tạo...' : 'Tạo Cuộc thi'}
            </button>
          </form>
        </div>

        {/* List of Semester Events */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FolderKanban size={20} className="text-indigo-400" />
            <span>Danh sách Cuộc thi</span>
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {events.map((e: any) => (
              <button
                key={e._id}
                onClick={() => handleSelectEvent(e)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  selectedEvent?._id === e._id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm">{e.name}</span>
                  <span className="text-xs bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                    {e.semester} {e.year}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{e.description}</p>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Middle & Right Column: Configurations */}
      <div className="lg:col-span-2 space-y-8">
        
        {message.text && (
          <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <Info size={18} />
            <span>{message.text}</span>
          </div>
        )}

        {selectedEvent ? (
          <div className="space-y-8">
            
            {/* Header Event title info */}
            <div className="glass p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">{selectedEvent.name}</h1>
                <p className="text-sm text-slate-400 mt-1">Trạng thái: <span className="text-indigo-400 font-bold">{selectedEvent.status.toUpperCase()}</span> | Đăng ký tối đa: {selectedEvent.maxTeams} đội</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300">Trạng thái:</label>
                <select
                  value={selectedEvent.status}
                  onChange={(e) => handleUpdateEventStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="registration">Mở đăng ký (Registration)</option>
                  <option value="ongoing">Đang diễn ra (Ongoing)</option>
                  <option value="completed">Hoàn thành (Completed)</option>
                  <option value="cancelled">Hủy (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Config: Tracks, Rounds & File upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Tracks configuration */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Settings2 size={18} className="text-indigo-400" />
                  <span>Bảng đấu (Tracks)</span>
                </h3>

                <div className="space-y-4 mb-6">
                  {tracks.map((t: any) => (
                    <button
                      key={t._id}
                      onClick={() => setSelectedTrack(t)}
                      className={`w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center ${
                        selectedTrack?._id === t._id 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-white' 
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{t.name} (Tối đa: {t.maxTeams} nhóm)</span>
                      <span className="text-[10px] text-slate-400">{t.description || 'Không mô tả'}</span>
                    </button>
                  ))}
                  {tracks.length === 0 && <p className="text-xs text-slate-500">Chưa có bảng đấu nào.</p>}
                </div>

                <form onSubmit={handleCreateTrack} className="space-y-3">
                  <input 
                    type="text" required placeholder="Tên bảng đấu (e.g. AI & IoT)"
                    value={trackName} onChange={e => setTrackName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs"
                  />
                  <input 
                    type="text" placeholder="Mô tả ngắn"
                    value={trackDesc} onChange={e => setTrackDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs"
                  />
                  <input 
                    type="number" placeholder="Số lượng tối đa (e.g. 10)"
                    value={trackMax} onChange={e => setTrackMax(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs"
                  />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1">
                    <Plus size={14} /> Add Track
                  </button>
                </form>
              </div>

              {/* Rounds & Exam file uploads */}
              <div className="glass p-6 rounded-2xl space-y-6">
                
                {/* Upload exam details */}
                <div>
                  <h3 className="text-md font-bold text-white mb-3 flex items-center gap-1.5">
                    <FileUp size={16} className="text-indigo-400" />
                    <span>Đề thi & Tài liệu ({selectedTrack?.name || 'Chung'})</span>
                  </h3>
                  <form onSubmit={handleUploadExam} className="space-y-3">
                    <input 
                      type="text" required placeholder="Tên tài liệu (e.g. Đề thi vòng 1)"
                      value={attachmentName} onChange={e => setAttachmentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                    />
                    <input 
                      type="text" required placeholder="Đường dẫn file (e.g. /files/round1.pdf)"
                      value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                    />
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg">
                      Lưu Tài liệu
                    </button>
                  </form>
                </div>

                <hr className="border-slate-800" />

                {/* Create Rounds */}
                <div>
                  <h3 className="text-md font-bold text-white mb-3 flex items-center gap-1.5">
                    <Plus size={16} className="text-indigo-400" />
                    <span>Cấu hình Vòng đấu (Rounds)</span>
                  </h3>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {rounds.filter((r: any) => r.trackId === selectedTrack?._id).map((r: any) => (
                      <span key={r._id} className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-1 rounded-full font-semibold">
                        {r.name} (Top {r.advanceTopN})
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleCreateRound} className="space-y-3">
                    <input 
                      type="text" required placeholder="Tên vòng đấu (e.g. Vòng Sơ loại)"
                      value={roundName} onChange={e => setRoundName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="number" placeholder="Thứ tự (1)"
                        value={roundOrder} onChange={e => setRoundOrder(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs col-span-1"
                      />
                      <input 
                        type="number" placeholder="Chọn Top N (3)"
                        value={roundLimit} onChange={e => setRoundLimit(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs col-span-2"
                      />
                    </div>
                    <input 
                      type="datetime-local" placeholder="Hạn nộp bài"
                      value={roundDeadline} onChange={e => setRoundDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                    />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg">
                      Thêm Vòng đấu
                    </button>
                  </form>
                </div>

              </div>

            </div>

            {/* Rubrics & Criteria and roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Rubric Configuration */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award size={18} className="text-indigo-400" />
                  <span>Rubric chấm điểm (Round 1)</span>
                </h3>

                {rubric ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-200">{rubric.name}</p>
                        <p className="text-slate-400 mt-0.5">Trọng số: {rubric.totalWeight}% | Max điểm/tiêu chí: {rubric.maxCriterionScore}</p>
                      </div>
                      <div>
                        {rubric.isLocked ? (
                          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold">
                            <Lock size={12} /> ĐÃ KHOÁ
                          </span>
                        ) : (
                          <button onClick={handleLockRubric} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-3 py-1 rounded text-white">
                            KHOÁ RUBRIC
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Criteria list */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-300">Tiêu chí chi tiết:</p>
                      {criteria.map((c: any) => (
                        <div key={c._id} className="bg-slate-900/30 p-2.5 rounded border border-slate-800 text-[11px] flex justify-between">
                          <span className="font-semibold text-slate-200">[{c.code}] {c.name}</span>
                          <span className="text-indigo-400 font-bold">{c.weight}%</span>
                        </div>
                      ))}
                      {criteria.length === 0 && <p className="text-xs text-slate-500">Chưa có tiêu chí nào.</p>}
                    </div>

                    {!rubric.isLocked && (
                      <form onSubmit={handleAddCriterion} className="space-y-2.5 pt-3 border-t border-slate-800">
                        <p className="text-xs font-bold text-slate-300">Thêm tiêu chí:</p>
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" required placeholder="MÃ (GIT)"
                            value={critCode} onChange={e => setCritCode(e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-[11px]"
                          />
                          <input 
                            type="text" required placeholder="Tên (Git Usage)"
                            value={critName} onChange={e => setCritName(e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-[11px] col-span-2"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="number" required placeholder="Trọng số %"
                            value={critWeight} onChange={e => setCritWeight(e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-[11px]"
                          />
                          <input 
                            type="text" placeholder="Mô tả"
                            value={critDesc} onChange={e => setCritDesc(e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-[11px] col-span-2"
                          />
                        </div>
                        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold py-1.5 rounded">
                          Thêm tiêu chí
                        </button>
                      </form>
                    )}

                  </div>
                ) : (
                  <form onSubmit={handleCreateRubric} className="space-y-3">
                    <p className="text-xs text-slate-400">Chưa khởi tạo Rubric cho Vòng 1 của Track này.</p>
                    <input 
                      type="text" required placeholder="Tên Rubric (e.g. Rubric Đánh giá Vòng 1)"
                      value={rubricName} onChange={e => setRubricName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                    />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg">
                      Khởi tạo Rubric
                    </button>
                  </form>
                )}
              </div>

              {/* Event Roles Management */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" />
                  <span>Phân quyền thành viên Ban Tổ chức</span>
                </h3>

                <form onSubmit={handleAssignRole} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Người dùng</label>
                    <input 
                      type="email" required placeholder="giamkhao@domain.com"
                      value={roleEmail} onChange={e => setRoleEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Vai trò</label>
                    <select 
                      value={roleType} onChange={e => setRoleType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-xs"
                    >
                      <option value="judge">Giám khảo (Judge)</option>
                      <option value="coordinator">Người điều phối (Coordinator)</option>
                      <option value="mentor">Cố vấn (Mentor)</option>
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg">
                    Cấp quyền thành viên
                  </button>
                </form>
              </div>

            </div>

            {/* GitHub Repositories Management */}
            <div className="glass p-6 rounded-2xl w-full mt-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Github size={18} className="text-indigo-400" />
                <span>Quản lý GitHub Repositories của các Đội thi</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Repos List */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh sách Repositories ({repos.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {repos.map((r: any) => (
                      <div key={r._id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">{r.teamId?.name || 'Đội thi'}</p>
                          <a href={r.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline break-all block">{r.repoUrl || r.repoName}</a>
                          <div className="flex gap-2 text-[10px] text-slate-400">
                            <span>Mặc định: <span className="text-slate-300 font-semibold">{r.defaultBranch || 'main'}</span></span>
                            <span>•</span>
                            <span>Đồng bộ cuối: <span className="text-slate-300">{r.lastSyncedAt ? new Date(r.lastSyncedAt).toLocaleString() : 'Chưa đồng bộ'}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.syncStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                            r.syncStatus === 'syncing' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                            r.syncStatus === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {r.syncStatus.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleSyncRepo(r._id)}
                            disabled={syncingRepoId === r._id}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-3 py-1.5 rounded text-[10px] font-semibold transition-all"
                          >
                            {syncingRepoId === r._id ? 'Đang sync...' : 'Đồng bộ'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {repos.length === 0 && <p className="text-xs text-slate-500 italic">Chưa có repository nào được cấu hình cho cuộc thi này.</p>}
                  </div>
                </div>

                {/* Provision or Link Repo */}
                <div className="space-y-6">
                  {/* Auto Provision list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cấp Repo tự động</h4>
                    <p className="text-[10px] text-slate-500">Tạo repo riêng tư trong tổ chức GitHub và phân quyền cho các thành viên đã xác nhận.</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {allTeams.filter((t: any) => !repos.some((r: any) => r.teamId?._id === t._id)).map((t: any) => (
                        <div key={t._id} className="bg-slate-900/30 p-2.5 rounded border border-slate-800/80 flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300 truncate max-w-[120px]">{t.name}</span>
                          <button
                            onClick={() => handleCreateRepo(t._id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[9px] font-bold"
                          >
                            Tạo Repo
                          </button>
                        </div>
                      ))}
                      {allTeams.filter((t: any) => !repos.some((r: any) => r.teamId?._id === t._id)).length === 0 && (
                        <p className="text-[10px] text-slate-500 italic">Tất cả đội confirmed đã được cấp repo.</p>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Manual Link Form */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Liên kết repo thủ công</h4>
                    <form onSubmit={handleLinkRepo} className="space-y-2">
                      <select
                        value={linkingTeamId}
                        onChange={e => setLinkingTeamId(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-lg text-xs"
                      >
                        <option value="">Chọn đội...</option>
                        {allTeams.filter((t: any) => !repos.some((r: any) => r.teamId?._id === t._id)).map((t: any) => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Tên Repo (e.g. team-alpha-repo)"
                        value={manualRepoName}
                        onChange={e => setManualRepoName(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-lg text-xs"
                      />
                      <input
                        type="url"
                        placeholder="Link Repo (https://github.com/...)"
                        value={manualRepoUrl}
                        onChange={e => setManualRepoUrl(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-lg text-xs"
                      />
                      <button
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 rounded-lg"
                      >
                        Liên kết Repo
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="glass p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
            <ShieldAlert size={48} className="text-slate-600 mb-3" />
            <p className="font-semibold text-lg">Chưa chọn Cuộc thi</p>
            <p className="text-sm text-slate-500 max-w-sm mt-1">Vui lòng chọn hoặc tạo một cuộc thi bên cột trái để tiến hành cấu hình chi tiết.</p>
          </div>
        )}

      </div>

    </div>
  );
}
