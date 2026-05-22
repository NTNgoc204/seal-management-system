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
          maxTeams: parseInt(maxTeams)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Tạo cuộc thi thành công!' });
      setEventName('');
      setDesc('');
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo cuộc thi.' });
    } finally {
      setLoading(false);
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
            <div className="glass p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/40">
              <h1 className="text-2xl font-black text-white">{selectedEvent.name}</h1>
              <p className="text-sm text-slate-400 mt-1">Trạng thái: <span className="text-indigo-400 font-bold">{selectedEvent.status.toUpperCase()}</span> | Đăng ký tối đa: {selectedEvent.maxTeams} đội</p>
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
