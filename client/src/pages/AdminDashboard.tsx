import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalendarPlus,
  Award,
  FolderKanban,
  Lock,
  Users,
  Info,
  Settings2,
  ChevronRight,
  BookOpen,
  ListOrdered,
} from "lucide-react";

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const [eventName, setEventName] = useState("");
  const [semester, setSemester] = useState("Spring");
  const [year, setYear] = useState("2026");
  const [desc, setDesc] = useState("");
  const [maxTeams, setMaxTeams] = useState("10");

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [tracks, setTracks] = useState<any[]>([]);
  const [trackName, setTrackName] = useState("");
  const [trackDesc, setTrackDesc] = useState("");
  const [trackMax, setTrackMax] = useState("5");
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedTrackForRound, setSelectedTrackForRound] = useState<any>(null);
  const [roundName, setRoundName] = useState("");
  const [roundOrder, setRoundOrder] = useState("1");
  const [roundDeadline, setRoundDeadline] = useState("");
  const [roundLimit, setRoundLimit] = useState("3");

  const [rubricTypeOption, setRubricTypeOption] = useState<"new" | "existing">(
    "new",
  );
  const [existingRubrics, setExistingRubrics] = useState<any[]>([]);
  const [selectedSourceRubricId, setSelectedSourceRubricId] = useState("");

  const [selectedRoundForRubric, setSelectedRoundForRubric] =
    useState<any>(null);
  const [rubricName, setRubricName] = useState("");
  const [rubric, setRubric] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);

  const [critCode, setCritCode] = useState("");
  const [critName, setCritName] = useState("");
  const [critWeight, setCritWeight] = useState("20");
  const [critDesc, setCritDesc] = useState("");

  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const [roleEmail, setRoleEmail] = useState("");
  const [roleType, setRoleType] = useState("judge");
  const [roleTrackId, setRoleTrackId] = useState("");
  const [eventRoles, setEventRoles] = useState<any[]>([]);
  const [teamsList, setTeamsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchEvents();
    fetchExistingRubrics();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventDetails();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách sự kiện:", err);
    }
  };

  const fetchExistingRubrics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/rubrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingRubrics(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách rubric cũ:", err);
    }
  };

  const fetchEventDetails = async () => {
    if (!selectedEvent) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/events/${selectedEvent._id}`,
      );
      setTracks(res.data.tracks || []);
      setRounds(res.data.rounds || []);

      if (res.data.tracks && res.data.tracks.length > 0 && !selectedTrack) {
        setSelectedTrack(res.data.tracks[0]);
      }
      if (
        res.data.tracks &&
        res.data.tracks.length > 0 &&
        !selectedTrackForRound
      ) {
        setSelectedTrackForRound(res.data.tracks[0]);
      }

      fetchEventRoles();
      fetchTeamsList();
    } catch (err) {
      console.error("Lỗi fetch chi tiết sự kiện:", err);
    }
  };

  const fetchEventRoles = async () => {
    if (!selectedEvent) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/events/${selectedEvent._id}/roles`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setEventRoles(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách quyền thành viên:", err);
    }
  };

  const fetchTeamsList = async () => {
    if (!selectedEvent) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/teams/all/${selectedEvent._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTeamsList(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách đội thi:", err);
    }
  };

  const handleDistributeTeams = async () => {
    if (!selectedEvent) return;
    if (tracks.length === 0) {
      setMessage({
        type: "error",
        text: "Vui lòng khởi tạo ít nhất một bảng đấu (Track) trước.",
      });
      return;
    }

    const unassignedTeams = teamsList.filter(
      (t) => t.status === "confirmed" && !t.trackId,
    );
    if (unassignedTeams.length === 0) {
      setMessage({
        type: "error",
        text: "Không tìm thấy đội thi đã xác nhận nào chưa được chia bảng đấu.",
      });
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn phân chia ngẫu nhiên ${unassignedTeams.length} đội thi vào ${tracks.length} bảng đấu? Hệ thống sẽ tự động tạo repository GitHub cho các đội.`,
      )
    ) {
      return;
    }

    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/distribute-teams`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage({
        type: "success",
        text: res.data.message || "Phân chia bảng đấu ngẫu nhiên thành công!",
      });
      fetchEventDetails();
    } catch (err: any) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Lỗi khi chia bảng đấu ngẫu nhiên.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrack = async (teamId: string, trackId: string) => {
    if (!selectedEvent) return;
    if (trackId === "random" && tracks.length === 0) {
      setMessage({
        type: "error",
        text: "Vui lòng khởi tạo ít nhất một bảng đấu (Track) trước.",
      });
      return;
    }

    if (trackId === "random") {
      if (
        !window.confirm(
          "Bạn có chắc muốn phân bảng đấu ngẫu nhiên cho đội thi này?",
        )
      ) {
        return;
      }
    }

    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/teams/${teamId}/assign-track`,
        { trackId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage({
        type: "success",
        text: res.data.message || "Phân bảng đấu thành công!",
      });
      fetchEventDetails();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi phân bảng đấu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (eventObj: any) => {
    setSelectedEvent(eventObj);
    setSelectedTrack(null);
    setSelectedRoundForRubric(null);
    setRubric(null);
    setCriteria([]);
    setMessage({ type: "", text: "" });

    // Fetch roles immediately when choosing existing event
    axios
      .get(`http://localhost:5000/api/events/${eventObj._id}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEventRoles(res.data || []))
      .catch(console.error);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/events",
        {
          name: eventName,
          semester,
          year: parseInt(year),
          description: desc,
          maxTeams: parseInt(maxTeams),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const newEvent = res.data.event;
      setSelectedEvent(newEvent);
      setTracks([]);
      setRounds([]);
      setSelectedTrack(null);
      setSelectedTrackForRound(null);

      setEventName("");
      setDesc("");
      setMessage({
        type: "success",
        text: "Khởi tạo Cuộc thi thành công! Chi tiết cuộc thi hiển thị bên dưới.",
      });

      fetchEvents();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi tạo cuộc thi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/tracks`,
        {
          name: trackName,
          description: trackDesc,
          maxTeams: parseInt(trackMax),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const newTrack = res.data;
      setTrackName("");
      setTrackDesc("");

      // Update local tracks state
      const updatedTracks = [...tracks, newTrack];
      setTracks(updatedTracks);
      setSelectedTrack(newTrack);
      setSelectedTrackForRound(newTrack);

      setMessage({ type: "success", text: "Thêm bảng đấu thành công!" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi thêm bảng đấu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!selectedTrackForRound) {
      setMessage({
        type: "error",
        text: "Vui lòng tạo/chọn bảng đấu trước khi tạo vòng đấu.",
      });
      return;
    }

    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      // 1. Create the Round
      const roundRes = await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/tracks/${selectedTrackForRound._id}/rounds`,
        {
          name: roundName,
          order: parseInt(roundOrder),
          submissionDeadline: roundDeadline || undefined,
          advanceTopN: parseInt(roundLimit),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const newRound = roundRes.data;

      // 2. Setup Rubric (Create empty or Clone)
      if (rubricTypeOption === "existing" && selectedSourceRubricId) {
        // Clone rubric API
        await axios.post(
          "http://localhost:5000/api/rubrics/clone",
          {
            fromRubricId: selectedSourceRubricId,
            eventId: selectedEvent._id,
            trackId: selectedTrackForRound._id,
            roundId: newRound._id,
            name: `Rubric ${newRound.name}`,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMessage({
          type: "success",
          text: `Tạo vòng đấu và sao chép Rubric thành công!`,
        });
      } else {
        // Create empty Rubric
        await axios.post(
          "http://localhost:5000/api/rubrics",
          {
            eventId: selectedEvent._id,
            trackId: selectedTrackForRound._id,
            roundId: newRound._id,
            name: rubricName || `Rubric ${newRound.name}`,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMessage({
          type: "success",
          text: `Tạo vòng đấu và khởi tạo Rubric trống thành công!`,
        });
      }

      setRoundName("");
      setRoundOrder("1");
      setRoundLimit("3");
      setRoundDeadline("");
      setRubricName("");
      setSelectedSourceRubricId("");

      // Refresh event details
      await fetchEventDetails();

      // Auto select the new round at Step 4 to view rubric
      setSelectedRoundForRubric(newRound);
      fetchRubricForRound(newRound._id);

      // Re-fetch existing rubrics list
      fetchExistingRubrics();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi tạo vòng đấu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRubricForRound = async (roundId: string) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/rubrics/round/${roundId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRubric(res.data.rubric);
      setCriteria(res.data.criteria || []);
    } catch (err) {
      setRubric(null);
      setCriteria([]);
    }
  };

  const handleCreateRubricInDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedRoundForRubric) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/rubrics",
        {
          eventId: selectedEvent._id,
          trackId: selectedRoundForRubric.trackId,
          roundId: selectedRoundForRubric._id,
          name: rubricName || `Rubric ${selectedRoundForRubric.name}`,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRubric(res.data);
      setCriteria([]);
      setRubricName("");
      setMessage({ type: "success", text: "Khởi tạo Rubric thành công!" });
      fetchExistingRubrics();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi tạo Rubric.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubric) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      await axios.post(
        `http://localhost:5000/api/rubrics/${rubric._id}/criteria`,
        {
          code: critCode,
          name: critName,
          weight: parseFloat(critWeight),
          description: critDesc,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCritCode("");
      setCritName("");
      setCritDesc("");
      setMessage({ type: "success", text: "Thêm tiêu chí thành công!" });

      // Reload rubric details
      if (selectedRoundForRubric) {
        fetchRubricForRound(selectedRoundForRubric._id);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi thêm tiêu chí.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLockRubric = async () => {
    if (!rubric) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/rubrics/${rubric._id}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRubric(res.data.rubric);
      setMessage({
        type: "success",
        text: "Đã khóa Rubric thành công! Bảng điểm đã sẵn sàng sử dụng.",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khóa Rubric.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      await axios.post(
        `http://localhost:5000/api/events/${selectedEvent._id}/upload-exam`,
        {
          fileName: attachmentName,
          fileUrl: attachmentUrl,
          trackId: selectedTrack?._id || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAttachmentName("");
      setAttachmentUrl("");
      setMessage({ type: "success", text: "Lưu tài liệu đề thi thành công!" });
      fetchEventDetails();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi tải tài liệu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:5000/api/auth/assign-role",
        {
          userEmail: roleEmail,
          eventId: selectedEvent._id,
          trackId: roleTrackId || undefined,
          role: roleType,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRoleEmail("");
      setRoleTrackId("");
      setMessage({
        type: "success",
        text: `Cấp quyền ${roleType.toUpperCase()} thành công!`,
      });
      fetchEventRoles();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi phân quyền.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedEvent) return;
    if (
      !window.confirm("Bạn có chắc chắn muốn thu hồi quyền của thành viên này?")
    )
      return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      await axios.delete(
        `http://localhost:5000/api/events/${selectedEvent._id}/roles/${roleId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage({
        type: "success",
        text: "Thu hồi quyền thành viên thành công!",
      });
      fetchEventRoles();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi thu hồi quyền.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Settings2 className="text-indigo-400" />
            <span>Thiết lập Cuộc thi (Event Dashboard)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cấu hình cuộc thi, bảng đấu, vòng đấu, rubric chấm điểm và phân
            quyền ban tổ chức.
          </p>
        </div>

        {/* Quick select event */}
        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Xem nhanh cuộc thi:
            </span>
            <select
              value={selectedEvent?._id || ""}
              onChange={(e) => {
                const ev = events.find((event) => event._id === e.target.value);
                if (ev) handleSelectEvent(ev);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:border-indigo-500 outline-none"
            >
              <option value="">-- Chọn cuộc thi --</option>
              {events.map((e: any) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.semester} {e.year})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* System message display */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center gap-2 mb-6 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <Info size={18} />
          <span>{message.text}</span>
        </div>
      )}

      {/* CREATE EVENT */}
      {!selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-mono">
              <CalendarPlus size={20} className="text-indigo-400" />
              <span>BƯỚC 1: KHỞI TẠO HỌC KỲ & CUỘC THI</span>
            </h2>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Tên Cuộc thi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SEAL Hackathon Spring 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Học kỳ
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Năm
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Số Đội Tối Đa (Max Teams)
                  </label>
                  <input
                    type="number"
                    required
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Mô tả Chi tiết Cuộc thi
                </label>
                <textarea
                  placeholder="Nhập thông tin giới thiệu, thời gian, thể lệ chính của sự kiện..."
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                ></textarea>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer font-mono"
                >
                  <span>
                    {loading ? "Đang khởi tạo..." : "Khởi tạo Cuộc thi"}
                  </span>
                  <CalendarPlus size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Quick instructions & list */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-md font-bold text-white mb-3 flex items-center gap-1.5 font-mono">
                <Info size={16} className="text-indigo-400" />
                <span>HƯỚNG DẪN BƯỚC 1</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tạo một cuộc thi mới đại diện cho học kỳ cụ thể. Cuộc thi này sẽ
                chứa các bảng đấu (Tracks) và vòng thi (Rounds) tiếp theo.
              </p>
              <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-indigo-300">
                Lưu ý: Chỉ hệ thống Admin mới được quyền khởi tạo cuộc thi mới.
              </div>
            </div>

            {/* List existing */}
            {events.length > 0 && (
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 font-mono">
                  <FolderKanban size={16} className="text-indigo-400" />
                  <span>CẤU HÌNH SỰ KIỆN SẴN CÓ</span>
                </h3>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {events.map((e: any) => (
                    <button
                      key={e._id}
                      onClick={() => handleSelectEvent(e)}
                      className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 transition-all text-xs"
                    >
                      <div className="flex justify-between font-bold text-slate-200">
                        <span className="truncate max-w-[150px]">{e.name}</span>
                        <span className="text-[10px] text-indigo-400">
                          {e.semester} {e.year}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL DASHBOARD & ROLE ASSIGNMENT */}
      {selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Event details, tracks and rounds */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header Panel */}
            <div className="glass p-6 rounded-2xl relative overflow-hidden bg-gradient-to-r from-indigo-950/20 to-slate-900/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    [DETAIL_BOARD]
                  </span>
                  <h1 className="text-2xl font-black text-white mt-2 font-mono uppercase tracking-tight">
                    {selectedEvent.name}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Học kỳ: {selectedEvent.semester} {selectedEvent.year} |
                    Trạng thái:{" "}
                    <span className="text-indigo-400 font-bold uppercase">
                      {selectedEvent.status}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <CalendarPlus size={14} />
                  Tạo cuộc thi mới
                </button>
              </div>
              {selectedEvent.description && (
                <p className="text-xs text-slate-400 mt-4 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            {/* Config panel: Tracks and Rounds details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tracks list & add track */}
              <div className="glass p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5 font-mono">
                    <FolderKanban size={16} className="text-indigo-400" />
                    <span>Các bảng đấu (Tracks)</span>
                  </h3>
                  <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
                    {tracks.map((t: any) => (
                      <button
                        key={t._id}
                        onClick={() => {
                          setSelectedTrack(t);
                          // Auto select first round of this track
                          const firstRound = rounds.find(
                            (r) => r.trackId === t._id,
                          );
                          if (firstRound) {
                            setSelectedRoundForRubric(firstRound);
                            fetchRubricForRound(firstRound._id);
                          } else {
                            setSelectedRoundForRubric(null);
                            setRubric(null);
                            setCriteria([]);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                          selectedTrack?._id === t._id
                            ? "bg-indigo-600/10 border-indigo-500/50 text-white"
                            : "border-slate-800/80 bg-slate-900/10 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        <span className="font-semibold">
                          {t.name} (Tối đa {t.maxTeams} đội)
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                    {tracks.length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        Chưa có bảng đấu nào.
                      </p>
                    )}
                  </div>
                </div>

                <form
                  onSubmit={handleCreateTrack}
                  className="space-y-3 pt-3 border-t border-slate-800/80"
                >
                  <p className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                    Tạo thêm bảng đấu:
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Tên bảng đấu (e.g. AI & IoT)"
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Số lượng đội tối đa (e.g. 5)"
                    value={trackMax}
                    onChange={(e) => setTrackMax(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer font-mono"
                  >
                    + Thêm Track
                  </button>
                </form>
              </div>

              {/* Rounds List of selected track */}
              <div className="glass p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5 font-mono">
                    <ListOrdered size={16} className="text-indigo-400" />
                    <span>Các Vòng thi ({selectedTrack?.name || "Chung"})</span>
                  </h3>
                  <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
                    {rounds
                      .filter((r: any) => r.trackId === selectedTrack?._id)
                      .map((r: any) => (
                        <button
                          key={r._id}
                          onClick={() => {
                            setSelectedRoundForRubric(r);
                            fetchRubricForRound(r._id);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                            selectedRoundForRubric?._id === r._id
                              ? "bg-indigo-600/10 border-indigo-500/50 text-white font-bold"
                              : "border-slate-800/80 bg-slate-900/10 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          <div>
                            <p>{r.name}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Thứ tự: {r.order} | Lấy Top: {r.advanceTopN}
                            </p>
                          </div>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    {rounds.filter((r: any) => r.trackId === selectedTrack?._id)
                      .length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        Chưa cấu hình vòng thi nào cho bảng đấu này.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick create round form */}
                <form
                  onSubmit={handleCreateRound}
                  className="space-y-3 pt-3 border-t border-slate-800/80"
                >
                  <p className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                    Tạo thêm vòng thi cho bảng này:
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Tên vòng (e.g. Bán kết)"
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      placeholder="Thứ tự (e.g. 2)"
                      value={roundOrder}
                      onChange={(e) => setRoundOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Lấy Top N (e.g. 5)"
                      value={roundLimit}
                      onChange={(e) => setRoundLimit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <input
                    type="datetime-local"
                    required
                    value={roundDeadline}
                    onChange={(e) => setRoundDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                  />

                  {/* Rubric Configuration */}
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Bảng tiêu chí (Rubric):
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 font-mono cursor-pointer">
                        <input
                          type="radio"
                          name="roundRubricOption"
                          value="new"
                          checked={rubricTypeOption === "new"}
                          onChange={() => setRubricTypeOption("new")}
                          className="text-indigo-600 focus:ring-0"
                        />
                        Mới
                      </label>
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 font-mono cursor-pointer">
                        <input
                          type="radio"
                          name="roundRubricOption"
                          value="existing"
                          checked={rubricTypeOption === "existing"}
                          onChange={() => setRubricTypeOption("existing")}
                          className="text-indigo-600 focus:ring-0"
                        />
                        Sao chép cũ
                      </label>
                    </div>

                    {rubricTypeOption === "existing" && (
                      <select
                        value={selectedSourceRubricId}
                        onChange={(e) =>
                          setSelectedSourceRubricId(e.target.value)
                        }
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
                      >
                        <option value="">-- Chọn Rubric cũ --</option>
                        {existingRubrics.map((r: any) => (
                          <option key={r._id} value={r._id}>
                            {r.name} ({r.eventId?.name || "Sự kiện cũ"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer font-mono"
                  >
                    + Thêm Vòng Đấu & Rubric
                  </button>
                </form>
              </div>
            </div>

            {/* Candidates and Teams management panel */}
            <div className="glass p-6 rounded-2xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-1.5 font-mono">
                    <Users size={18} className="text-indigo-400" />
                    <span>Đội thi & Thí sinh ({teamsList.length} đội)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Danh sách các đội thi đã đăng ký và phân nhóm trong sự kiện
                    này
                  </p>
                </div>

                {/* Auto distribute button - Always visible but styled according to state */}
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleDistributeTeams}
                    disabled={
                      loading ||
                      tracks.length === 0 ||
                      !teamsList.some(
                        (t) => t.status === "confirmed" && !t.trackId,
                      )
                    }
                    className={`text-xs font-bold px-4 py-2 rounded-xl text-white font-mono transition-all flex items-center gap-1.5 ${
                      tracks.length > 0 &&
                      teamsList.some(
                        (t) => t.status === "confirmed" && !t.trackId,
                      )
                        ? "bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-lg shadow-indigo-600/25"
                        : "bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    }`}
                  >
                    Chia bảng ngẫu nhiên vào Track
                  </button>
                  {tracks.length === 0 && (
                    <span className="text-[9px] text-rose-400 font-mono">
                      * Cần tạo Bảng đấu (Track) trước
                    </span>
                  )}
                  {tracks.length > 0 &&
                    !teamsList.some(
                      (t) => t.status === "confirmed" && !t.trackId,
                    ) && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        * Không có nhóm thi đấu chờ chia bảng
                      </span>
                    )}
                </div>
              </div>

              {/* Grouped lists */}
              <div className="space-y-6">
                {/* 1. Confirmed Teams */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
                    <span>
                      ✓ Đội thi đã Xác nhận (
                      {teamsList.filter((t) => t.status === "confirmed").length}
                      )
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamsList
                      .filter((t) => t.status === "confirmed")
                      .map((team: any) => (
                        <div
                          key={team._id}
                          className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-400 font-mono">
                                TEAM
                              </span>
                              <h5 className="font-bold text-slate-200 text-sm">
                                {team.name}
                              </h5>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                team.trackId
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {team.trackId?.name ||
                                (team.trackId ? "Đã gán" : "Chưa chia bảng")}
                            </span>
                          </div>

                          {/* Leader & Repo Info */}
                          <div className="text-[11px] text-slate-400 space-y-1">
                            <p>
                              Trưởng nhóm:{" "}
                              <strong className="text-slate-300">
                                {team.leaderId?.fullName}
                              </strong>{" "}
                              ({team.leaderId?.email})
                            </p>
                            {team.repository ? (
                              <p>
                                Repository:{" "}
                                <a
                                  href={team.repository.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-400 hover:underline"
                                >
                                  {team.repository.repoName}
                                </a>
                              </p>
                            ) : (
                              <p className="text-slate-500 italic">
                                GitHub Repo: Chưa cấp phát (chờ chia bảng)
                              </p>
                            )}
                          </div>

                          {/* Members */}
                          <div className="border-t border-slate-800/80 pt-2">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Thành viên ({team.members?.length || 0}):
                            </p>
                            <div className="space-y-1">
                              {team.members?.map((m: any) => (
                                <div
                                  key={m.userId?._id}
                                  className="flex justify-between text-[10px] text-slate-400"
                                >
                                  <span>
                                    • {m.userId?.fullName}{" "}
                                    {m.role === "leader" && (
                                      <span className="text-[9px] text-indigo-400 font-mono font-bold">
                                        (Leader)
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-slate-500 font-mono">
                                    {m.userId?.githubUsername ||
                                      "Chưa liên kết Git"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Assign Track controls */}
                          {!team.trackId && (
                            <div className="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5">
                              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                                Phân chia vào bảng đấu:
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleAssignTrack(team._id, "random")
                                  }
                                  disabled={loading || tracks.length === 0}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-[10px] text-white font-bold py-1.5 px-2 rounded-lg font-mono transition-all flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed border border-indigo-500/20"
                                >
                                  🎲 Phân ngẫu nhiên
                                </button>

                                {tracks.length > 0 && (
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAssignTrack(
                                          team._id,
                                          e.target.value,
                                        );
                                      }
                                    }}
                                    disabled={loading}
                                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold py-1 px-2 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>
                                      -- Chọn Track --
                                    </option>
                                    {tracks.map((track: any) => (
                                      <option key={track._id} value={track._id}>
                                        {track.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              {tracks.length === 0 && (
                                <p className="text-[8px] text-rose-400 font-mono italic">
                                  * Cần tạo Bảng đấu (Track) trước
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    {teamsList.filter((t) => t.status === "confirmed")
                      .length === 0 && (
                      <p className="col-span-2 text-xs text-slate-500 italic text-center py-2">
                        Chưa có đội thi nào xác nhận hoàn tất.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Pending Teams */}
                <div>
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono mb-3">
                    ⏳ Đội thi đang chờ xác nhận (
                    {
                      teamsList.filter((t) => t.status === "pending_confirm")
                        .length
                    }
                    )
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamsList
                      .filter((t) => t.status === "pending_confirm")
                      .map((team: any) => (
                        <div
                          key={team._id}
                          className="bg-slate-900/10 p-4 rounded-xl border border-slate-800/40 space-y-3 opacity-75"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 font-mono">
                                PENDING TEAM
                              </span>
                              <h5 className="font-bold text-slate-400 text-sm">
                                {team.name}
                              </h5>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
                              Chờ duyệt
                            </span>
                          </div>

                          {/* Members with status */}
                          <div className="space-y-1">
                            {team.members?.map((m: any) => (
                              <div
                                key={m.userId?._id}
                                className="flex justify-between items-center text-[10px]"
                              >
                                <span className="text-slate-400">
                                  • {m.userId?.fullName}
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1 rounded ${
                                    m.confirmStatus === "confirmed"
                                      ? "text-emerald-400 bg-emerald-500/5"
                                      : "text-slate-500 bg-slate-800"
                                  }`}
                                >
                                  {m.confirmStatus === "confirmed"
                                    ? "Đã nhận"
                                    : "Chờ xác nhận"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    {teamsList.filter((t) => t.status === "pending_confirm")
                      .length === 0 && (
                      <p className="col-span-2 text-xs text-slate-500 italic text-center py-2">
                        Không có nhóm nào ở trạng thái chờ xác nhận.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rubric and Criterion Configurations */}
            {selectedRoundForRubric ? (
              <div className="glass p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-md font-bold text-white flex items-center gap-1.5 font-mono">
                      <Award size={18} className="text-indigo-400" />
                      <span>Rubric: {selectedRoundForRubric.name}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Cấu hình bảng điểm phục vụ giám khảo chấm giải
                    </p>
                  </div>

                  {rubric && (
                    <div>
                      {rubric.isLocked ? (
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] font-bold font-mono">
                          <Lock size={12} /> ĐÃ KHÓA CHẤM ĐIỂM
                        </span>
                      ) : (
                        <button
                          onClick={handleLockRubric}
                          className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white font-mono cursor-pointer shadow-lg shadow-indigo-600/25"
                        >
                          KHÓA & SỬ DỤNG
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {rubric ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs flex justify-between items-center font-mono">
                      <div>
                        <p className="font-bold text-indigo-400">
                          {rubric.name}
                        </p>
                        <p className="text-slate-400 mt-1">
                          Trọng số: {rubric.totalWeight}% | Điểm tối đa/tiêu
                          chí: {rubric.maxCriterionScore}
                        </p>
                      </div>
                    </div>

                    {/* Criteria List */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-300 font-mono">
                        Các tiêu chí chi tiết:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {criteria.map((c: any) => (
                          <div
                            key={c._id}
                            className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 text-[11px] flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-slate-200 font-mono">
                                [{c.code}]
                              </span>
                              <span className="text-slate-300 ml-1.5">
                                {c.name}
                              </span>
                              {c.description && (
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {c.description}
                                </p>
                              )}
                            </div>
                            <span className="text-indigo-400 font-black text-xs font-mono">
                              {c.weight}%
                            </span>
                          </div>
                        ))}
                      </div>
                      {criteria.length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">
                          Chưa thiết lập tiêu chí. Vui lòng thêm tiêu chí bên
                          dưới.
                        </p>
                      )}
                    </div>

                    {/* Add Criterion form */}
                    {!rubric.isLocked && (
                      <form
                        onSubmit={handleAddCriterion}
                        className="space-y-3 pt-4 border-t border-slate-800/80"
                      >
                        <p className="text-xs font-bold text-slate-300 font-mono">
                          Thêm tiêu chí chấm điểm mới:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 font-mono">
                              Mã tiêu chí
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="E.g. TECH, IDEA"
                              value={critCode}
                              onChange={(e) => setCritCode(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 font-mono">
                              Tên tiêu chí
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="E.g. Chất lượng mã nguồn"
                              value={critName}
                              onChange={(e) => setCritName(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 font-mono">
                              Trọng số (%)
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="30"
                              value={critWeight}
                              onChange={(e) => setCritWeight(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 font-mono">
                              Mô tả chi tiết
                            </label>
                            <input
                              type="text"
                              placeholder="Độ tối ưu codebase, tính clean code..."
                              value={critDesc}
                              onChange={(e) => setCritDesc(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer font-mono"
                        >
                          + Thêm tiêu chí
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleCreateRubricInDetail}
                    className="space-y-3"
                  >
                    <p className="text-xs text-slate-400 italic">
                      Vòng thi này chưa có bảng Rubric tiêu chí. Hãy khởi tạo
                      một bảng Rubric trống bên dưới.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Tên Rubric (e.g. Rubric Đánh giá Vòng 1)"
                        value={rubricName}
                        onChange={(e) => setRubricName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap font-mono"
                      >
                        Khởi tạo Rubric
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="glass p-6 text-center text-slate-500 text-xs italic">
                Vui lòng chọn một Vòng đấu phía trên để quản lý bộ Rubric tiêu
                chí chấm điểm tương ứng.
              </div>
            )}
          </div>

          {/* Right Column: Roles & Exam uploads */}
          <div className="lg:col-span-1 space-y-6">
            {/* Phân quyền thành viên BTC & Thí sinh */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5 font-mono">
                <Users size={16} className="text-indigo-400" />
                <span>Phân quyền thành viên</span>
              </h3>

              <form onSubmit={handleAssignRole} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Email Người dùng
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="giamkhao@domain.com"
                    value={roleEmail}
                    onChange={(e) => setRoleEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Vai trò
                  </label>
                  <select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    <option value="judge">Giám khảo (Judge)</option>
                    <option value="coordinator">
                      Điều phối viên (Coordinator)
                    </option>
                    <option value="mentor">Cố vấn (Mentor)</option>
                    <option value="participant">Thí sinh (Participant)</option>
                  </select>
                </div>

                {(roleType === "judge" ||
                  roleType === "mentor" ||
                  roleType === "participant") && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Bảng đấu (Track)
                    </label>
                    <select
                      value={roleTrackId}
                      onChange={(e) => setRoleTrackId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      <option value="">
                        Toàn bộ cuộc thi (Không chọn Track)
                      </option>
                      {tracks.map((t: any) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer font-mono"
                >
                  Gán Quyền Hạn
                </button>
              </form>
            </div>

            {/* Danh sách thành viên đã phân quyền */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-md font-bold text-white mb-3 flex items-center gap-1.5 font-mono">
                <Users size={16} className="text-indigo-400" />
                <span>Danh sách phân quyền ({eventRoles.length})</span>
              </h3>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {eventRoles.map((role: any) => (
                  <div
                    key={role._id}
                    className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center font-sans"
                  >
                    <div>
                      <p className="font-bold text-slate-200">
                        {role.userId?.fullName || "Không rõ tên"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {role.userId?.email}
                      </p>
                      <p className="text-[10px] text-indigo-400 font-mono mt-0.5 uppercase font-bold">
                        {role.role}{" "}
                        {role.trackId
                          ? `// Bảng: ${role.trackId.name}`
                          : "// Toàn cuộc thi"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveRole(role._id)}
                      className="text-rose-500 hover:text-rose-400 font-bold text-[10px] uppercase font-mono border border-rose-500/20 hover:border-rose-500/40 px-2 py-1 rounded bg-rose-500/5 cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                {eventRoles.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    Chưa có ai được phân quyền cho cuộc thi này.
                  </p>
                )}
              </div>
            </div>

            {/* Tải lên đề thi/tài liệu */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5 font-mono">
                <BookOpen size={16} className="text-indigo-400" />
                <span>Đề bài & Tài liệu đính kèm</span>
              </h3>

              <form onSubmit={handleUploadExam} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Tên Tài liệu
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Đề bài chung, Tài liệu API..."
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Đường dẫn / URL File
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. https://domain.com/exam.pdf"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-[10px] text-slate-400">
                  Tài liệu sẽ được hiển thị ở Bảng điều khiển của thí sinh thuộc
                  bảng đấu đang chọn.
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer font-mono"
                >
                  Tải Lên Tài Liệu
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
