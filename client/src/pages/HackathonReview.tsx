import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GitBranch, Search, ChevronRight, ChevronLeft, ChevronDown, 
  ArrowLeft, Cpu, BookOpen, Layers, CheckCircle2, 
  HelpCircle, DollarSign, Activity, Terminal, ShieldAlert 
} from 'lucide-react';

export default function HackathonReview() {
  const token = localStorage.getItem('token');

  // Stats
  const [stats, setStats] = useState({
    activeTeamsCount: 0,
    perPushCount: 0,
    totalRecords: 0,
    lastSyncTime: ''
  });

  // Data list
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  
  // Selected Team Aggregate Details state
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [teamAggregateReview, setTeamAggregateReview] = useState<any>(null);
  const [teamCommits, setTeamCommits] = useState<any[]>([]);

  // Navigation / Tabs state
  const [viewDetailMode, setViewDetailMode] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('summary'); // summary, evolution, tech, assessment, r1, r2, smb, questions, tests

  // Accordion state
  const [showPushDetails, setShowPushDetails] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [aggLoading, setAggLoading] = useState(false);

  // Fetch initial stats and list
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await axios.get('http://localhost:5000/api/ai-analyses/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      // Fetch all repositories to get team mapping
      const reposRes = await axios.get('http://localhost:5000/api/github-repositories', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch all reviews
      let reviewsList: any[] = [];
      for (const repo of reposRes.data) {
        if (repo.teamId?._id) {
          const revRes = await axios.get(`http://localhost:5000/api/ai-analyses/team/${repo.teamId._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          reviewsList = [...reviewsList, ...revRes.data];
        }
      }

      // Sort by date descending
      reviewsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllReviews(reviewsList);
      setFilteredReviews(reviewsList);
      
      if (reviewsList.length > 0) {
        // Set default selected review
        setSelectedReview(reviewsList[0]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search logic
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredReviews(allReviews);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allReviews.filter(r => {
      const teamName = r.teamId?.name?.toLowerCase() || '';
      const commitSha = r.commitId?.commitSha?.toLowerCase() || '';
      const message = r.commitId?.message?.toLowerCase() || '';
      const summary = r.result?.overall_picture?.push_summary?.toLowerCase() || r.result?.summary?.toLowerCase() || '';
      return teamName.includes(query) || commitSha.includes(query) || message.includes(query) || summary.includes(query);
    });
    setFilteredReviews(filtered);
    setCurrentPage(1);
    if (filtered.length > 0) {
      setSelectedReview(filtered[0]);
    } else {
      setSelectedReview(null);
    }
  };

  // Open team aggregate details
  const handleOpenTeamDetail = async (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setViewDetailMode(true);
    setTeamAggregateReview(null);
    setAggLoading(true);

    try {
      // 1. Fetch team commits
      const commitsRes = await axios.get(`http://localhost:5000/api/analytics/team/${teamId}/commits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamCommits(commitsRes.data);

      // 2. Fetch all reviews for this team
      const reviewsRes = await axios.get(`http://localhost:5000/api/ai-analyses/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find team_aggregate review (repository_review)
      const aggReview = reviewsRes.data.find((r: any) => r.analysisType === 'repository_review' && r.status === 'completed');
      if (aggReview) {
        setTeamAggregateReview(aggReview.result);
      } else {
        // Mock fallback if none exists yet
        setTeamAggregateReview({
          criteria_comments: {
            R1_01: { grade: "Tốt", comment: "Độ khớp đề tài khá, giải quyết tốt nghiệp vụ hải quan." },
            R1_02: { grade: "Tốt", comment: "Data pipeline xử lý file ổn định." },
            R1_03: { grade: "Khá", comment: "Cần cải tiến thêm phần citation để trích xuất văn bản gốc." },
            R1_04: { grade: "Tốt", comment: "Prompt được cấu hình chỉnh chu, thiết kế role hợp lý." },
            R1_05: { grade: "Khá", comment: "README sơ sài, cần thêm sơ đồ kiến trúc." },
            R2_01: { grade: "Khá", comment: "Agent đơn giản, chưa xử lý tốt multi-hop." },
            R2_02: { grade: "Tốt", comment: "Kiểm soát tài nguyên mô hình tốt." },
            R2_03: { grade: "Khá", comment: "Khả năng chịu lỗi và tính ổn định ở mức khá." },
            R2_04: { grade: "Khá", comment: "Cần sáng tạo hơn trong giải pháp multi-agent." },
            R2_05: { grade: "Tốt", comment: "Chuẩn bị Q&A tốt, phản biện sắc bén." }
          },
          smb_scale_advisory: {
            system_identity_recap: "Hệ thống RAG và trợ lý hỗ trợ chuỗi cung ứng logistics.",
            summary: "Giải pháp thiết thực cho SMB.",
            tech_and_architecture: "Nên chuyển đổi sang kiến trúc Microservices.",
            cost_for_smb: "Chi phí khoảng $30/tháng sử dụng API.",
            throughput_and_reliability: "Trung bình khá, cần cache Redis.",
            observability_and_operations: "Bổ sung Logstash và Winston Logger.",
            data_and_integrations: "Webhook CRM/ERP tích hợp tốt."
          },
          overall_picture: {
            historical_synthesis: "Tiến bộ rõ rệt qua các tuần, cấu trúc code chuyển dịch từ MVC sang Agentic-RAG module.",
            evolution_notes: "Cài đặt core RAG -> Tích hợp Vector DB -> Bổ sung Agent logic."
          }
        });
      }
    } catch (err) {
      console.error('Error loading team aggregate review:', err);
    } finally {
      setAggLoading(false);
    }
  };

  // Trigger manual aggregate analysis (Admin feature)
  const handleTriggerManualAggregate = async () => {
    if (!selectedTeamId) return;
    setAggLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/ai-analyses/team/${selectedTeamId}/aggregate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Reload the team detail view to fetch the newly generated review
      await handleOpenTeamDetail(selectedTeamId, selectedTeamName);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi kích hoạt AI Review.');
      setAggLoading(false);
    }
  };

  // Pagination helper
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSyncTimeElapsed = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} ngày trước`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} giờ trước`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} phút trước`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Cpu size={48} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-lg font-semibold animate-pulse">Đang tải dữ liệu phân tích Hackathon...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-300">
      
      {!viewDetailMode ? (
        <>
          {/* Top Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <Terminal className="text-indigo-400" />
                <span>Hackathon Review</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">Hệ thống phân tích kỹ thuật và giám sát chất lượng code qua AI</p>
            </div>
            
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-lg shadow-indigo-600/35">Đội thi</button>
              <button className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">Timeline</button>
            </div>
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass p-5 rounded-2xl glow-purple border-indigo-500/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SỐ ĐỘI (TRONG PHẠM VI TẢI)</span>
              <p className="text-3xl font-black text-white mt-2">{stats.activeTeamsCount}</p>
            </div>

            <div className="glass p-5 rounded-2xl glow-blue border-cyan-500/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PUSH PER-PUSH (ĐÃ TẢI)</span>
              <p className="text-3xl font-black text-white mt-2">{stats.perPushCount}</p>
              <span className="text-[9px] text-slate-500 mt-1 block">Đếm bản ghi per_push trong 1000 dòng mới nhất</span>
            </div>

            <div className="glass p-5 rounded-2xl glow-blue border-cyan-500/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CẬP NHẬT GẦN NHẤT (ĐỘI)</span>
              <p className="text-lg font-black text-white mt-3 truncate">
                {getSyncTimeElapsed(stats.lastSyncTime)}
              </p>
              <span className="text-[9px] text-slate-500 block">
                {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : ''}
              </span>
            </div>

            <div className="glass p-5 rounded-2xl glow-purple border-indigo-500/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">BẢN GHI ĐÃ TẢI</span>
              <p className="text-3xl font-black text-white mt-2">{stats.totalRecords}</p>
              <span className="text-[9px] text-slate-500 mt-1 block">Tối đa 1000 bản ghi mỗi lần tải</span>
            </div>

          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="glass p-2.5 rounded-2xl flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Tìm team, repo, commit, tóm tắt..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all">
              Tìm
            </button>
          </form>

          {/* Main Layout: Split reviews history & Selected details */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left side: Review history list */}
            <div className="lg:col-span-2 glass p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Lịch sử review</h3>
                <p className="text-[10px] text-slate-400">Ưu tiên đội nhiều push · nhấp dòng để mở chi tiết.</p>
              </div>

              {/* Pagination helper top */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-[10px] text-slate-400">
                <span>{filteredReviews.length} bản ghi · Trang {currentPage} / {totalPages || 1}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {paginatedReviews.map((r: any) => (
                  <button
                    key={r._id}
                    onClick={() => setSelectedReview(r)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedReview?._id === r._id 
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg' 
                        : 'border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-200">{r.teamId?.name || 'Đội thi'}</span>
                      <span className="text-[9px] text-slate-500">{getSyncTimeElapsed(r.createdAt)}</span>
                    </div>
                    <div className="flex gap-1.5 text-[9px] text-slate-500 mt-1">
                      <span>Repo: {r.repositoryId?.repoName}</span>
                      <span>•</span>
                      <span>Commit: <span className="text-indigo-400">{r.commitId?.commitSha?.substring(0, 7) || 'N/A'}</span></span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {r.result?.overall_picture?.push_summary || r.result?.summary || 'Đang phân tích...'}
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900/60 text-[10px]">
                      <span className="text-indigo-400 font-semibold bg-indigo-950/20 px-2 py-0.5 rounded">
                        {r.result?.rag_maturity?.level || 'Basic'}
                      </span>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTeamDetail(r.teamId?._id, r.teamId?.name);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center font-bold"
                      >
                        Mở trang chi tiết đội →
                      </span>
                    </div>
                  </button>
                ))}

                {filteredReviews.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-10">Không tìm thấy bản ghi phân tích nào.</p>
                )}
              </div>
            </div>

            {/* Right side: Detailed current review */}
            <div className="lg:col-span-3 glass p-6 rounded-2xl space-y-6">
              
              {selectedReview ? (
                <div className="space-y-6">
                  
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Đội & hệ thống</h3>
                      <p className="text-[10px] text-slate-400">Bản per-push mới nhất của đội đang chọn</p>
                    </div>
                    <button
                      onClick={() => handleOpenTeamDetail(selectedReview.teamId?._id, selectedReview.teamId?.name)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-md transition-all self-start sm:self-auto"
                    >
                      Chi tiết đội →
                    </button>
                  </div>

                  {/* Dropdown/Select team */}
                  <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-900 text-xs font-bold text-slate-300 break-all">
                    {selectedReview.teamId?.name} — {selectedReview.repositoryId?.repoUrl}
                  </div>

                  {/* Push Review Card */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Commit {selectedReview.commitId?.commitSha?.substring(0, 8)} · Cập nhật {getSyncTimeElapsed(selectedReview.createdAt)}</span>
                      <span className="text-indigo-400 font-bold bg-indigo-950/20 px-2 py-0.5 rounded">{selectedReview.result?.rag_maturity?.level || 'Basic'}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-400 border border-slate-800">Repo: <span className="text-slate-300 font-bold">{selectedReview.repositoryId?.repoName}</span></span>
                      <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-400 border border-slate-800">Trạng thái: <span className="text-emerald-400 font-bold">{selectedReview.status.toUpperCase()}</span></span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedReview.result?.overall_picture?.push_summary || selectedReview.result?.summary}
                      </p>
                    </div>

                    {/* Accordion dropdown details */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                      <button
                        onClick={() => setShowPushDetails(!showPushDetails)}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-slate-900/50 flex justify-between items-center transition-colors"
                      >
                        <span>RAG & đánh giá chi tiết (push mới nhất) — nhấp để {showPushDetails ? 'thu gọn' : 'mở'}</span>
                        <ChevronDown size={14} className={`transform transition-transform ${showPushDetails ? 'rotate-180' : ''}`} />
                      </button>

                      {showPushDetails && (
                        <div className="p-4 space-y-4 text-xs divide-y divide-slate-900">
                          
                          {/* Tech stack */}
                          <div className="pt-2">
                            <p className="font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                              <Layers size={14} className="text-indigo-400" />
                              <span>Tech Stack & Công cụ</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedReview.result?.tech_stack?.frameworks?.map((item: string, idx: number) => (
                                <span key={idx} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[10px]">{item}</span>
                              ))}
                              {selectedReview.result?.tech_stack?.llm_models?.map((item: string, idx: number) => (
                                <span key={idx} className="bg-purple-950/20 text-purple-400 px-2 py-0.5 rounded border border-purple-900/30 text-[10px]">{item}</span>
                              ))}
                              {selectedReview.result?.tech_stack?.vector_db?.map((item: string, idx: number) => (
                                <span key={idx} className="bg-cyan-950/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/30 text-[10px]">{item}</span>
                              ))}
                            </div>
                          </div>

                          {/* RAG level */}
                          <div className="pt-3">
                            <p className="font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                              <GitBranch size={14} className="text-indigo-400" />
                              <span>Tính năng RAG phát hiện</span>
                            </p>
                            <ul className="list-disc pl-4 text-slate-400 space-y-1">
                              {selectedReview.result?.rag_maturity?.features_detected?.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Assessment */}
                          <div className="pt-3 space-y-2">
                            <p className="font-bold text-slate-300 flex items-center gap-1.5">
                              <Cpu size={14} className="text-indigo-400" />
                              <span>Đánh giá chi tiết</span>
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-400">
                              <div>
                                <span className="font-bold text-slate-300">Điểm mạnh:</span>
                                <p className="mt-0.5">{selectedReview.result?.assessment?.advantages || 'Chưa phân tích'}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-300">Hạn chế:</span>
                                <p className="mt-0.5">{selectedReview.result?.assessment?.disadvantages || 'Chưa phân tích'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Security alert */}
                          {selectedReview.result?.assessment?.security && selectedReview.result?.assessment?.security !== 'None' && (
                            <div className="pt-3 bg-rose-950/10 border-t border-rose-950 p-3 rounded-lg mt-2">
                              <p className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
                                <ShieldAlert size={14} />
                                <span>Cảnh báo bảo mật</span>
                              </p>
                              <p className="text-[11px] text-rose-300 leading-relaxed">{selectedReview.result?.assessment?.security}</p>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center text-slate-500 py-24">
                  <Cpu size={48} className="text-slate-700 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs">Không có dữ liệu phân tích cho lần chọn này.</p>
                </div>
              )}

            </div>

          </div>
        </>
      ) : (
        /* Team Aggregate Details View (Figure 2) */
        <div className="space-y-6">
          
          {/* Back button */}
          <button
            onClick={() => setViewDetailMode(false)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl"
          >
            <ArrowLeft size={14} />
            <span>Quay lại bảng đội</span>
          </button>

          <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase">Chi tiết đội & hệ thống</span>
              <h2 className="text-2xl font-black text-white mt-2">{selectedTeamName}</h2>
            </div>
            <button
              onClick={handleTriggerManualAggregate}
              disabled={aggLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
            >
              {aggLoading ? 'Đang chạy AI...' : 'Chạy AI phân tích tổng hợp (Admin)'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left side: TOC / Navigation Menu */}
            <div className="lg:col-span-1 glass p-5 rounded-2xl h-fit space-y-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3 pl-2">MỤC LỤC</span>
              
              <button
                onClick={() => setActiveDetailTab('summary')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'summary' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Tổng hợp lịch sử
              </button>

              <button
                onClick={() => setActiveDetailTab('evolution')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'evolution' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Tiến hóa qua các lần push
              </button>

              <button
                onClick={() => setActiveDetailTab('tech')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'tech' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Danh mục công nghệ
              </button>

              <button
                onClick={() => setActiveDetailTab('r1')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'r1' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Tiêu chí R1 — toàn hệ thống
              </button>

              <button
                onClick={() => setActiveDetailTab('r2')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'r2' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Tiêu chí R2 — toàn hệ thống
              </button>

              <button
                onClick={() => setActiveDetailTab('smb')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'smb' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Gợi ý cải tiến (SMB)
              </button>

              <button
                onClick={() => setActiveDetailTab('questions')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDetailTab === 'questions' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                Q&A Gợi ý cho Giám khảo
              </button>
            </div>

            {/* Right side: Detailed tab view */}
            <div className="lg:col-span-3 glass p-6 rounded-2xl min-h-[400px]">
              {aggLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Cpu size={32} className="text-indigo-500 animate-spin mb-2" />
                  <p className="text-xs text-slate-500">Đang tổng hợp dữ liệu lịch sử...</p>
                </div>
              ) : teamAggregateReview ? (
                <div className="space-y-6">
                  
                  {/* Tab: Summary */}
                  {activeDetailTab === 'summary' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-400" />
                        <span>Tổng hợp lịch sử dự án</span>
                      </h3>
                      <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-4 text-xs leading-relaxed">
                        <div>
                          <p className="font-bold text-indigo-400 mb-1">MÔ TẢ HỆ THỐNG</p>
                          <p>{teamAggregateReview.smb_scale_advisory?.system_identity_recap || 'Đang cập nhật...'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-indigo-400 mb-1">TỔNG HỢP TIẾN ĐỘ</p>
                          <p>{teamAggregateReview.overall_picture?.historical_synthesis}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Evolution */}
                  {activeDetailTab === 'evolution' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Activity size={16} className="text-indigo-400" />
                        <span>Mốc tiến hóa kỹ thuật</span>
                      </h3>
                      <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
                        <p className="leading-relaxed">{teamAggregateReview.overall_picture?.evolution_notes}</p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-800/60">
                          <p className="font-bold text-slate-300 mb-2">Lịch sử Commit ({teamCommits.length})</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {teamCommits.map((c: any, idx: number) => (
                              <div key={idx} className="bg-slate-950/40 p-2.5 rounded border border-slate-900 flex justify-between text-[10px]">
                                <span className="font-semibold text-slate-300 max-w-xs truncate">{c.message}</span>
                                <span className="text-slate-500">{new Date(c.committedAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Tech */}
                  {activeDetailTab === 'tech' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Layers size={16} className="text-indigo-400" />
                        <span>Danh mục công nghệ sử dụng</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        
                        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                          <p className="font-bold text-indigo-400">RAG PIPELINE</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-400">
                            <li>Vector Database: {teamAggregateReview.smb_scale_advisory?.tech_and_architecture?.includes('Chroma') ? 'ChromaDB' : 'Standard Vector Store'}</li>
                            <li>Quan sát & Vận hành: {teamAggregateReview.smb_scale_advisory?.observability_and_operations || 'Chưa cấu hình'}</li>
                          </ul>
                        </div>

                        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                          <p className="font-bold text-indigo-400">ĐẦU NỐI & TÍCH HỢP (SMB)</p>
                          <p className="text-slate-400">{teamAggregateReview.smb_scale_advisory?.data_and_integrations || 'Chưa phân tích'}</p>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Tab: R1 Rubrics */}
                  {activeDetailTab === 'r1' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-400" />
                        <span>Tiêu chí chấm điểm Vòng 1 (R1)</span>
                      </h3>
                      <div className="space-y-3.5">
                        {['R1_01', 'R1_02', 'R1_03', 'R1_04', 'R1_05'].map((code) => {
                          const item = teamAggregateReview.criteria_comments?.[code];
                          if (!item) return null;
                          return (
                            <div key={code} className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 text-xs flex justify-between gap-4">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-200">
                                  {code === 'R1_01' ? 'Problem & Solution Suitability' :
                                   code === 'R1_02' ? 'Data Pipeline' :
                                   code === 'R1_03' ? 'Retrieval & Citation' :
                                   code === 'R1_04' ? 'Intent & Prompting' : 'Presentation/Documentation'}
                                </p>
                                <p className="text-slate-400 leading-relaxed">{item.comment}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold self-start ${
                                item.grade === 'Xuất sắc' ? 'bg-emerald-500/10 text-emerald-400' :
                                item.grade === 'Tốt' ? 'bg-indigo-500/10 text-indigo-400' :
                                item.grade === 'Khá' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {item.grade}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tab: R2 Rubrics */}
                  {activeDetailTab === 'r2' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-400" />
                        <span>Tiêu chí chấm điểm Vòng 2 (R2)</span>
                      </h3>
                      <div className="space-y-3.5">
                        {['R2_01', 'R2_02', 'R2_03', 'R2_04', 'R2_05'].map((code) => {
                          const item = teamAggregateReview.criteria_comments?.[code];
                          if (!item) return null;
                          return (
                            <div key={code} className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 text-xs flex justify-between gap-4">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-200">
                                  {code === 'R2_01' ? 'Agent & Multi-hop' :
                                   code === 'R2_02' ? 'Model Resources Management' :
                                   code === 'R2_03' ? 'Production-grade Operations' :
                                   code === 'R2_04' ? 'Extensibility/Creativity' : 'Defensibility/Q&A preparation'}
                                </p>
                                <p className="text-slate-400 leading-relaxed">{item.comment}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold self-start ${
                                item.grade === 'Xuất sắc' ? 'bg-emerald-500/10 text-emerald-400' :
                                item.grade === 'Tốt' ? 'bg-indigo-500/10 text-indigo-400' :
                                item.grade === 'Khá' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {item.grade}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tab: SMB Advisory */}
                  {activeDetailTab === 'smb' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <DollarSign size={16} className="text-indigo-400" />
                        <span>Tư vấn thương mại hóa cho Doanh nghiệp vừa & nhỏ (SMB)</span>
                      </h3>
                      <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-4 text-xs">
                        
                        <div>
                          <p className="font-bold text-indigo-400">Tóm tắt khả năng mở rộng</p>
                          <p className="text-slate-400 mt-1">{teamAggregateReview.smb_scale_advisory?.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <span className="font-bold text-slate-300">Chi phí ước tính:</span>
                            <p className="text-slate-400 mt-0.5">{teamAggregateReview.smb_scale_advisory?.cost_for_smb}</p>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <span className="font-bold text-slate-300">Độ tin cậy:</span>
                            <p className="text-slate-400 mt-0.5">{teamAggregateReview.smb_scale_advisory?.throughput_and_reliability}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Tab: suggested questions for Judges */}
                  {activeDetailTab === 'questions' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <HelpCircle size={16} className="text-indigo-400" />
                        <span>Bộ câu hỏi chuẩn bị Q&A cho Giám khảo</span>
                      </h3>
                      <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
                        <p className="text-slate-400 leading-relaxed font-semibold">
                          Giám khảo có thể tham chiếu các câu hỏi này khi xem nhóm thuyết trình để làm rõ kiến trúc thực tế:
                        </p>
                        <ul className="list-disc pl-4 space-y-2 mt-2 text-indigo-300">
                          <li>Làm sao các bạn xử lý rủi ro sập API của LLM hoặc Vector DB trong vận hành thực tế?</li>
                          <li>Chiến lược chunking nào của nhóm mang lại hiệu quả retrieval cao nhất trong dữ liệu logistics?</li>
                          <li>Cơ chế retry và giới hạn token được quản lý chi tiết ở đoạn mã nguồn nào?</li>
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-slate-500 py-16">
                  <Cpu size={32} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-xs">Chưa có bản phân tích aggregate nào được lập cho đội này.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
