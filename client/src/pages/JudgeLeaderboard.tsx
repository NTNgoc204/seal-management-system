import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Trophy,
  RefreshCw,
  Award,
  Users,
  Search,
  CheckSquare
} from "lucide-react";

export default function JudgeLeaderboard() {
  const token = localStorage.getItem("token");

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedRound, setSelectedRound] = useState<any>(null);

  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch rounds for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    axios
      .get(`http://localhost:5000/api/events/${selectedEventId}`)
      .then((res) => {
        setRounds(res.data.rounds || []);
        if (res.data.rounds && res.data.rounds.length > 0) {
          setSelectedRoundId(res.data.rounds[0]._id);
          setSelectedRound(res.data.rounds[0]);
        } else {
          setSelectedRoundId("");
          setSelectedRound(null);
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
      const res = await axios.get(
        `http://localhost:5000/api/grades/judge-ranking/${selectedRoundId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStandings(res.data.standings || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching judge rankings:", err);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId, token]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Auto-refresh every 30s for active viewing
  useEffect(() => {
    if (!selectedRoundId) return;
    const interval = setInterval(() => {
      fetchRankings();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedRoundId, fetchRankings]);

  const handleRoundChange = (roundId: string) => {
    setSelectedRoundId(roundId);
    const round = rounds.find((r: any) => r._id === roundId);
    setSelectedRound(round || null);
  };

  const filteredStandings = standings.filter(
    (item) =>
      item.teamId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teamId?.topicSubmission?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shadow-inner">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Bảng Xếp Hạng Giám Khảo
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Xem xếp hạng thời gian thực dựa trên điểm trung bình của Ban giám khảo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200/50 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <Users size={12} />
            Chế độ Giám khảo
          </span>

          <button
            onClick={fetchRankings}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Selectors and Search */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">
              Cuộc thi
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-56 font-bold"
            >
              {events.map((e: any) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">
              Vòng đấu
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => handleRoundChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-56 font-bold"
            >
              {rounds.map((r: any) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
              {rounds.length === 0 && <option>Không có vòng đấu</option>}
            </select>
          </div>

          {selectedRound?.status === "completed" && (
            <div className="self-end pb-0.5">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                <CheckSquare size={12} />
                Đã khóa & Công bố
              </span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm đội, đề tài..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-xs pl-9 pr-4 py-1.5 w-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {lastUpdated && (
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Danh sách xếp hạng tạm thời (Live)</span>
            <span>Cập nhật lúc: {lastUpdated.toLocaleTimeString("vi-VN")}</span>
          </div>
        )}

        {loading && standings.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <RefreshCw size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
            Đang tải bảng xếp hạng...
          </div>
        ) : filteredStandings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50/50">
                  <th className="py-4 px-6 w-20 text-center">Hạng</th>
                  <th className="py-4 px-6">Tên Đội</th>
                  <th className="py-4 px-6">Đề Tài Dự Án</th>
                  <th className="py-4 px-6 text-center">Số Lượt Chấm</th>
                  <th className="py-4 px-6 text-center">Điểm Trung Bình</th>
                  <th className="py-4 px-6 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.map((row: any, idx: number) => {
                  const rank = row.rank ?? idx + 1;
                  const rankStyles =
                    rank === 1
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : rank === 2
                        ? "bg-slate-100 text-slate-800 border-slate-200"
                        : rank === 3
                          ? "bg-orange-100 text-orange-850 border-orange-200"
                          : "bg-slate-50 text-slate-650 border-slate-150";

                  return (
                    <tr
                      key={row.teamId?._id || idx}
                      className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="py-4 px-6 text-center font-black">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border font-bold ${rankStyles}`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-800 text-sm block">
                          {row.teamId?.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          ID: {row.teamId?._id?.slice(-6)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-700 block max-w-xs truncate">
                          {row.teamId?.topicSubmission?.title || "Chưa nộp đề tài"}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5 max-w-xs">
                          {row.teamId?.topicSubmission?.description || "Không có mô tả chi tiết."}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600 font-medium">
                        <span className="bg-slate-100 text-slate-750 px-2 py-1 rounded text-[10px] font-bold">
                          {row.judgeCount} Giám khảo
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-blue-600 font-black text-sm">
                          {row.averageScore != null ? row.averageScore.toFixed(2) : "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {selectedRound?.status !== "completed" ? (
                          <span className="inline-flex items-center bg-blue-50 text-blue-650 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                            Đang Đánh Giá
                          </span>
                        ) : row.isAdvanced ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Đã Đi Tiếp
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-slate-100 text-slate-400 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                            Dừng Bước
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
          <div className="text-center py-20 text-slate-400">
            <Award size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider">Không có dữ liệu xếp hạng</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
              Không tìm thấy kết quả xếp hạng nào cho vòng đấu hiện tại hoặc chưa có điểm số nào được nộp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
