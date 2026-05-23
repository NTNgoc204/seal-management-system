import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Trophy, CheckSquare } from 'lucide-react';

export default function Leaderboard() {
  const token = localStorage.getItem('token');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (!selectedRoundId) {
      setStandings([]);
      return;
    }
    setLoading(true);
    axios.get(`http://localhost:5000/api/grades/leaderboard/${selectedRoundId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setStandings(res.data);
      })
      .catch(err => {
        console.error(err);
        setStandings([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedRoundId]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      
      {/* Page header title standing */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-premium p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <Trophy size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Bảng Xếp Hạng Chung Cuộc</h1>
          <p className="text-slate-400 text-sm">Điểm số trung bình từ ban giám khảo và các đội thi đi tiếp</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="glass p-6 rounded-2xl flex flex-wrap gap-4 items-center">
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
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
            {rounds.length === 0 && <option>Không có vòng đấu</option>}
          </select>
        </div>
      </div>

      {/* Standings Grid Table */}
      <div className="glass p-6 rounded-3xl relative overflow-hidden">
        
        {loading ? (
          <p className="text-center text-slate-500 py-12 text-xs">Đang tải bảng điểm xếp hạng...</p>
        ) : standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-4 px-4 w-16 text-center">Thứ Hạng</th>
                  <th className="py-4 px-4">Tên Đội Thi</th>
                  <th className="py-4 px-4">Đề Tài Dự Án</th>
                  <th className="py-4 px-4 text-center">Giám Khảo</th>
                  <th className="py-4 px-4 text-center">Điểm Trung Bình</th>
                  <th className="py-4 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row: any) => {
                  const rankStyles = row.rank === 1 
                    ? 'text-amber-400 bg-amber-500/10' 
                    : row.rank === 2 
                      ? 'text-slate-300 bg-slate-300/10' 
                      : row.rank === 3 
                        ? 'text-amber-600 bg-amber-700/10' 
                        : 'text-slate-400 bg-slate-800/40';

                  return (
                    <tr key={row._id} className="border-b border-slate-850 hover:bg-white/2 transition-colors">
                      <td className="py-4 px-4 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${rankStyles}`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-100 text-sm">
                        {row.teamId?.name}
                      </td>
                      <td className="py-4 px-4 text-slate-300 max-w-xs truncate">
                        {row.teamId?.topicSubmission?.title || 'Chưa nộp đề tài'}
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-slate-300">
                        {row.judgeCount} BGK
                      </td>
                      <td className="py-4 px-4 text-center font-black text-indigo-400 text-sm">
                        {row.averageScore?.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {row.isAdvanced ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-[10px] font-bold">
                            <CheckSquare size={10} /> ĐÃ ĐI TIẾP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-slate-800 text-slate-500 border border-slate-700 px-2 py-1 rounded-md text-[10px]">
                            Bị loại
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-16">
            <BarChart3 size={32} className="mx-auto text-slate-700 mb-2" />
            <p className="text-xs">Bảng xếp hạng chưa được công bố.</p>
            <p className="text-[10px] text-slate-650 max-w-sm mx-auto mt-1">Bảng xếp hạng sẽ tự động hiển thị tại đây sau khi ban tổ chức tiến hành chốt khoá điểm thi và xếp hạng cuối cùng.</p>
          </div>
        )}

      </div>

    </div>
  );
}
