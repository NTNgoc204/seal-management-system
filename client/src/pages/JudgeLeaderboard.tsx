import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Trophy, Lock, RefreshCw, AlertCircle } from "lucide-react";

export default function JudgeLeaderboard() {
  const token = localStorage.getItem("token");

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [standings, setStandings] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedMessage, setLockedMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch events
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/events")
      .then((res) => {
        setEvents(res.data);
        if (res.data.length > 0) setSelectedEventId(res.data[0]._id);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch event details (rounds)
  useEffect(() => {
    if (!selectedEventId) return;
    axios
      .get(`http://localhost:5000/api/events/${selectedEventId}`)
      .then((res) => {
        setRounds(res.data.rounds || []);
        if (res.data.rounds && res.data.rounds.length > 0) {
          setSelectedRoundId(res.data.rounds[0]._id);
        } else {
          setSelectedRoundId("");
        }
      })
      .catch((err) => console.error(err));
  }, [selectedEventId]);

  const fetchRankings = useCallback(async () => {
    if (!selectedRoundId) {
      setStandings([]);
      return;
    }
    setLoading(true);
    try {
      // Normal leaderboard for judges (completed/finalized standings only)
      const res = await axios.get(
        `http://localhost:5000/api/grades/leaderboard/${selectedRoundId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.locked) {
        setIsLocked(true);
        setLockedMessage(res.data.message || "Bảng xếp hạng chưa được công bố.");
        setStandings([]);
      } else {
        setIsLocked(false);
        setLockedMessage("");
        setStandings(res.data.standings || []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId, token]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);



  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-500" size={28} />
            <span>Bảng xếp hạng chung cuộc</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Xem kết quả xếp hạng chính thức và các đội thi được đi tiếp sau khi ban tổ chức đã công bố.
          </p>
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
            <span>Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}</span>
            <button
              onClick={fetchRankings}
              disabled={loading}
              className="text-blue-600 hover:text-blue-750 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </div>

      {/* Selectors Row */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
            Cuộc thi
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="!bg-slate-50 !border-slate-300 rounded-lg !text-slate-800 text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-64 font-bold shadow-sm cursor-pointer"
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
            Vòng thi
          </label>
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="!bg-slate-50 !border-slate-300 rounded-lg !text-slate-800 text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-80 font-bold shadow-sm cursor-pointer"
          >
            {rounds.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} (Lấy Top {r.advanceTopN})
              </option>
            ))}
            {rounds.length === 0 && <option>Không có vòng thi</option>}
          </select>
        </div>
      </div>

      {/* Standings Grid/Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-24 text-slate-400 text-xs animate-pulse font-mono">
            [ĐANG TẢI BẢNG XẾP HẠNG...]
          </div>
        ) : isLocked ? (
          <div className="text-center py-24 bg-slate-50/20">
            <Lock size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Bảng điểm đang được bảo mật</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
              {lockedMessage || "Kết quả của vòng đấu này chưa được ban tổ chức công bố chính thức. Giám khảo vui lòng quay lại sau."}
            </p>
          </div>
        ) : standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4 w-[15%]">Thứ hạng</th>
                  <th className="px-6 py-4 w-[45%]">Tên đội thi</th>
                  <th className="px-6 py-4 w-[20%] text-center">Điểm trung bình</th>
                  <th className="px-6 py-4 w-[20%] text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {standings.map((row: any) => {
                  const isAdvanced = row.isAdvanced;
                  return (
                    <tr key={row.teamId?._id || row._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Rank */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-150 border border-amber-300 flex items-center justify-center text-amber-800 font-extrabold text-[10px]">
                              🥇 1
                            </span>
                          ) : row.rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-150 border border-slate-250 flex items-center justify-center text-slate-700 font-extrabold text-[10px]">
                              🥈 2
                            </span>
                          ) : row.rank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-850 font-extrabold text-[10px]">
                              🥉 3
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 font-mono text-[10px]">
                              {row.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Team Name */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div>
                          <span className="font-extrabold text-slate-800 block">{row.teamId?.name}</span>
                          {row.trackName && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                              Bảng: {row.trackName} {row.trackRank ? `(Hạng ${row.trackRank})` : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Avg Score */}
                      <td className="px-6 py-5 whitespace-nowrap text-center font-bold text-slate-850 font-mono">
                        {row.averageScore?.toFixed(2)}/10đ
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        {isAdvanced ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                            Được đi tiếp
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Dừng bước
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
          <div className="text-center py-24 bg-slate-50/20">
            <AlertCircle size={36} className="mx-auto text-slate-350 mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Không có dữ liệu xếp hạng nào trong vòng thi này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
