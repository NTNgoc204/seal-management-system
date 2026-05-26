import { FolderKanban, ChevronRight, Users, BookOpen } from "lucide-react";

interface TracksTabProps {
  selectedEvent: any;
  tracks: any[];
  trackName: string;
  setTrackName: (val: string) => void;
  trackDesc: string;
  setTrackDesc: (val: string) => void;
  trackMax: string;
  setTrackMax: (val: string) => void;
  handleCreateTrack: (e: React.FormEvent) => Promise<void>;
  selectedTrack: any;
  setSelectedTrack: (track: any) => void;
  rounds: any[];
  setSelectedRubricRoundId: (id: string) => void;
  setRubric: (rubric: any) => void;
  setCriteria: (criteria: any[]) => void;
  
  // Roles Management Props
  roleEmail: string;
  setRoleEmail: (val: string) => void;
  roleType: string;
  setRoleType: (val: string) => void;
  roleTrackId: string;
  setRoleTrackId: (val: string) => void;
  handleAssignRole: (e: React.FormEvent) => Promise<void>;
  eventRoles: any[];
  handleRemoveRole: (roleId: string) => Promise<void>;
  
  // Attachments Props
  attachmentName: string;
  setAttachmentName: (val: string) => void;
  attachmentUrl: string;
  setAttachmentUrl: (val: string) => void;
  handleUploadExam: (e: React.FormEvent) => Promise<void>;
  
  loading: boolean;
}

export default function TracksTab({
  tracks,
  trackName,
  setTrackName,
  trackMax,
  setTrackMax,
  handleCreateTrack,
  selectedTrack,
  setSelectedTrack,
  rounds,
  setSelectedRubricRoundId,
  setRubric,
  setCriteria,
  
  roleEmail,
  setRoleEmail,
  roleType,
  setRoleType,
  roleTrackId,
  setRoleTrackId,
  handleAssignRole,
  eventRoles,
  handleRemoveRole,
  
  attachmentName,
  setAttachmentName,
  attachmentUrl,
  setAttachmentUrl,
  handleUploadExam,
}: TracksTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Tracks List & Form */}
      <div className="lg:col-span-1 glass p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5 font-mono">
            <FolderKanban size={16} className="text-indigo-400" />
            <span>Các bảng đấu (Tracks)</span>
          </h3>
          <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-1">
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
                    setSelectedRubricRoundId(firstRound._id);
                  } else {
                    setSelectedRubricRoundId("");
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
            + Thêm Bảng đấu
          </button>
        </form>
      </div>

      {/* Column 2: Roles & Permissions */}
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
                <option value="judge">Giám khảo</option>
                <option value="coordinator">
                  Ban tổ chức
                </option>
                <option value="mentor">Cố vấn</option>
                <option value="participant">Thí sinh</option>
              </select>
            </div>

            {(roleType === "judge" ||
              roleType === "mentor" ||
              roleType === "participant") && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Bảng đấu
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
      </div>

      {/* Column 3: Exam Upload / Attachments */}
      <div className="lg:col-span-1 glass p-6 rounded-2xl">
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
            Tài liệu sẽ được hiển thị ở Bảng điều khiển của thí sinh thuộc bảng
            đấu đang chọn.
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
  );
}
