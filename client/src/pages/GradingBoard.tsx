import { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Sparkles, AlertCircle, Save, CheckCircle, GitCommit, Lock } from 'lucide-react';

export default function GradingBoard() {
  const token = localStorage.getItem('token');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // Rubric & Criteria
  const [rubric, setRubric] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);

  // Commits (to display in sidebar)
  const [commits, setCommits] = useState<any[]>([]);

  // Grade state
  const [scores, setScores] = useState<any>({}); // { criterionId: { scoreValue: 8.5, comment: '...' } }
  const [overallComment, setOverallComment] = useState('');

  // Status indicators
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch events
    axios.get('http://localhost:5000/api/events')
      .then(res => {
        setEvents(res.data);
        if (res.data.length > 0) {
          setSelectedEventId(res.data[0]._id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    // Fetch event details to get rounds and tracks
    axios.get(`http://localhost:5000/api/events/${selectedEventId}`)
      .then(res => {
        setRounds(res.data.rounds || []);
        if (res.data.rounds && res.data.rounds.length > 0) {
          setSelectedRoundId(res.data.rounds[0]._id);
        } else {
          setSelectedRoundId('');
        }
      })
      .catch(err => console.error(err));
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedRoundId) return;
    // Fetch Rubric for round
    axios.get(`http://localhost:5000/api/rubrics/round/${selectedRoundId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setRubric(res.data.rubric);
        setCriteria(res.data.criteria || []);
        // Initialize scores state
        const initial: any = {};
        res.data.criteria.forEach((c: any) => {
          initial[c._id] = { scoreValue: '', comment: '' };
        });
        setScores(initial);
      })
      .catch(err => {
        setRubric(null);
        setCriteria([]);
        console.error('Error fetching rubric:', err);
      });

    // Fetch Teams
    axios.get(`http://localhost:5000/api/teams/all/${selectedEventId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const confirmed = res.data.filter((t: any) => t.status === 'confirmed');
        setTeams(confirmed);
        if (confirmed.length > 0) {
          setSelectedTeam(confirmed[0]);
        } else {
          setSelectedTeam(null);
        }
      })
      .catch(err => console.error(err));
  }, [selectedRoundId]);

  useEffect(() => {
    if (!selectedTeam) {
      setCommits([]);
      return;
    }
    // Fetch commits for selected team
    axios.get(`http://localhost:5000/api/analytics/team/${selectedTeam._id}/commits`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCommits(res.data))
      .catch(err => console.error(err));
  }, [selectedTeam]);

  const handleScoreChange = (critId: string, field: string, val: any) => {
    setScores((prev: any) => ({
      ...prev,
      [critId]: {
        ...prev[critId],
        [field]: val
      }
    }));
  };

  const handleGetAiSuggestion = async () => {
    if (!selectedTeam || !selectedRoundId || !rubric) return;
    setAiLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.get(
        `http://localhost:5000/api/grades/suggestion?teamId=${selectedTeam._id}&roundId=${selectedRoundId}&rubricId=${rubric._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Populate scores
      const updated = { ...scores };
      res.data.forEach((item: any) => {
        if (item.criterionId) {
          updated[item.criterionId] = {
            scoreValue: item.suggestedScore,
            comment: `[Gợi ý của AI]: ${item.comment}`
          };
        }
      });
      setScores(updated);
      setOverallComment('Ý kiến gợi ý tổng quan từ Gemini AI: Nhóm có sự phối hợp git rất tốt, các commit mang tính chất tăng trưởng rõ ràng, logic code vững vàng.');
      setMessage({ type: 'success', text: 'Tải thành công điểm số gợi ý từ Gemini AI!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Không thể tạo gợi ý điểm tự động từ AI.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedRoundId || !rubric) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Validate all scores are filled
    const details = Object.entries(scores).map(([critId, val]: [string, any]) => ({
      criterionId: critId,
      scoreValue: parseFloat(val.scoreValue),
      comment: val.comment
    }));

    if (details.some(d => isNaN(d.scoreValue))) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ điểm số cho tất cả tiêu chí.' });
      setSaving(false);
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:5000/api/grades/submit',
        {
          teamId: selectedTeam._id,
          roundId: selectedRoundId,
          rubricId: rubric._id,
          overallComment,
          details
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: `Nộp điểm thành công! Tổng điểm: ${res.data.totalWeightedScore}/10` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi khi nộp điểm.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLockRound = async () => {
    if (!selectedRoundId || !selectedTeam) return;
    if (!window.confirm('Bạn có chắc chắn muốn khoá vòng đấu này? Sau khi khoá, điểm số của tất cả các đội thi sẽ được chốt và bảng xếp hạng sẽ được công bố chính thức.')) return;

    try {
      await axios.post(
        'http://localhost:5000/api/grades/lock-round',
        {
          eventId: selectedEventId,
          roundId: selectedRoundId,
          trackId: selectedTeam.trackId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Đã hoàn tất khoá điểm và công bố bảng xếp hạng!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khoá vòng đấu.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      
      {/* Selector Headers */}
      <div className="glass p-6 rounded-2xl flex flex-wrap gap-6 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Cuộc thi</label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs w-48"
            >
              {events.map((e: any) => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Vòng đấu (Round)</label>
            <select
              value={selectedRoundId}
              onChange={e => setSelectedRoundId(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs w-48"
            >
              {rounds.map((r: any) => (
                <option key={r._id} value={r._id}>{r.name} (Top {r.advanceTopN})</option>
              ))}
              {rounds.length === 0 && <option>Không có vòng đấu</option>}
            </select>
          </div>
        </div>

        {rubric && (
          <button 
            onClick={handleLockRound}
            className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold px-4 py-2 rounded-xl text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Lock size={14} /> Lock & Publish Round
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs border flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <CheckCircle size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {rubric ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Teams List (1 Col) */}
          <div className="lg:col-span-1 glass p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Award size={16} className="text-indigo-400" />
              <span>Đội thi confirmed ({teams.length})</span>
            </h3>
            
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {teams.map((t: any) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTeam(t)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedTeam?._id === t._id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">{t.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Đề tài: {t.topicSubmission?.title || 'Chưa nộp chủ đề'}</p>
                </button>
              ))}
              {teams.length === 0 && <p className="text-xs text-slate-500 italic text-center py-6">Chưa có đội nào xác nhận đầy đủ.</p>}
            </div>
          </div>

          {/* Main Grading Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTeam ? (
              <div className="glass p-6 rounded-2xl space-y-6">
                
                {/* Team context details */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedTeam.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Lĩnh vực: <span className="text-slate-300 font-semibold">{selectedTeam.topicSubmission?.title || 'Chưa nộp'}</span></p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGetAiSuggestion}
                    disabled={aiLoading}
                    className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    <Sparkles size={14} className={aiLoading ? 'animate-spin' : ''} />
                    <span>{aiLoading ? 'AI đang chấm...' : 'Gợi ý từ Gemini AI'}</span>
                  </button>
                </div>

                <form onSubmit={handleSubmitScores} className="space-y-6">
                  
                  <div className="space-y-4">
                    {criteria.map((c: any) => (
                      <div key={c._id} className="glass-light p-4 rounded-xl border border-slate-800/80 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-indigo-400">[{c.code}]</span>
                            <span className="text-xs font-bold text-slate-200 ml-1.5">{c.name}</span>
                            <p className="text-[10px] text-slate-400 mt-1">{c.description || 'Không mô tả.'}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={c.maxScore}
                              required
                              placeholder={`0 - ${c.maxScore}`}
                              value={scores[c._id]?.scoreValue || ''}
                              onChange={e => handleScoreChange(c._id, 'scoreValue', e.target.value)}
                              className="w-20 px-2 py-1 rounded text-center text-xs"
                            />
                            <span className="text-[10px] text-slate-400">/ {c.maxScore}</span>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Nhận xét cụ thể về tiêu chí này..."
                            value={scores[c._id]?.comment || ''}
                            onChange={e => handleScoreChange(c._id, 'comment', e.target.value)}
                            className="w-full px-3 py-2 rounded text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ý kiến nhận xét tổng quan (Overall comment)</label>
                    <textarea
                      placeholder="Ý kiến đánh giá thế mạnh, điểm yếu và gợi ý phát triển cho nhóm..." rows={4}
                      value={overallComment}
                      onChange={e => setOverallComment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                    ></textarea>
                  </div>

                  <button
                    type="submit" disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25"
                  >
                    <Save size={16} />
                    <span>{saving ? 'Đang lưu điểm số...' : 'Xác nhận Nộp điểm'}</span>
                  </button>

                </form>

              </div>
            ) : (
              <div className="glass p-8 text-center text-slate-500 py-24 rounded-2xl">
                <AlertCircle size={36} className="mx-auto text-slate-700 mb-2" />
                <p className="text-xs">Chưa có đội thi nào để chấm điểm.</p>
              </div>
            )}
          </div>

          {/* Commits Sidebar Column (1 Col) */}
          <div className="lg:col-span-1 glass p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <GitCommit size={16} className="text-indigo-400" />
              <span>Tiến độ commits ({commits.length})</span>
            </h3>
            
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {commits.map((c: any) => (
                <div key={c._id} className="p-3 bg-slate-900/30 rounded-xl border border-slate-800 text-[10px] space-y-1">
                  <p className="font-semibold text-slate-200 truncate">{c.message}</p>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>@{c.authorGithubUsername}</span>
                    <span>{new Date(c.committedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <span className="text-emerald-400">+{c.additions}</span>
                    <span className="text-rose-400">-{c.deletions}</span>
                  </div>
                </div>
              ))}
              {commits.length === 0 && <p className="text-[10px] text-slate-500 italic text-center py-6">Chưa có commit nào.</p>}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
          <Lock size={48} className="text-slate-700 mb-3" />
          <p className="font-semibold text-lg">Rubric chưa được thiết lập hoặc chưa khoá</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">Hệ thống chấm điểm sẽ được kích hoạt sau khi Người điều phối (Coordinator) thiết lập tiêu chí và khoá bảng Rubric của vòng đấu này.</p>
        </div>
      )}

    </div>
  );
}
