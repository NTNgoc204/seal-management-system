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

  // Tab management state
  const [activeTab, setActiveTab] = useState<'arena' | 'github'>('arena');

  // Rubric Edit Form States
  const [selectedRubricRoundId, setSelectedRubricRoundId] = useState('');
  const [editingRubric, setEditingRubric] = useState(false);
  const [editRubricName, setEditRubricName] = useState('');
  const [editRubricDesc, setEditRubricDesc] = useState('');
  const [editRubricTotalWeight, setEditRubricTotalWeight] = useState('100');
  const [editRubricMaxScore, setEditRubricMaxScore] = useState('10');
  const [editRubricIsActive, setEditRubricIsActive] = useState(true);

  // Criterion States (Advanced)
  const [critMaxScore, setCritMaxScore] = useState('10');
  const [critOrder, setCritOrder] = useState('1');
  const [critGradingLevels, setCritGradingLevels] = useState<any[]>([]);
  const [editingCriterion, setEditingCriterion] = useState<any>(null);

  // Grading Level Form States
  const [levelLabel, setLevelLabel] = useState('');
  const [levelMinScore, setLevelMinScore] = useState('');
  const [levelMaxScore, setLevelMaxScore] = useState('');
  const [levelDesc, setLevelDesc] = useState('');

  // GitHub integration states
  const [githubOrgName, setGithubOrgName] = useState('seal-hackathon-2026');
  const [repos, setRepos] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [linkingTeamId, setLinkingTeamId] = useState('');
  const [manualRepoName, setManualRepoName] = useState('');
  const [manualRepoUrl, setManualRepoUrl] = useState('');
  const [syncingRepoId, setSyncingRepoId] = useState('');

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
      fetchRepositories(selectedEvent._id);
      fetchAllTeams(selectedEvent._id);
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
          githubOrgName,
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
      setGithubOrgName("seal-hackathon-2026");
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
      setSelectedEvent(res.data.event);
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật trạng thái cuộc thi.' });
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

      // Auto select the new round to view rubric
      setSelectedRoundForRubric(newRound);
      setSelectedRubricRoundId(newRound._id);

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

  const fetchRoundsAndRubric = async () => {
    if (!selectedRubricRoundId) {
      setRubric(null);
      setCriteria([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/rubrics/round/${selectedRubricRoundId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRubric(res.data.rubric);
      setCriteria(res.data.criteria || []);
      
      // Populate edit fields if rubric exists
      if (res.data.rubric) {
        setEditRubricName(res.data.rubric.name);
        setEditRubricDesc(res.data.rubric.description || '');
        setEditRubricTotalWeight(String(res.data.rubric.totalWeight || 100));
        setEditRubricMaxScore(String(res.data.rubric.maxCriterionScore || 10));
        setEditRubricIsActive(res.data.rubric.isActive);
      }
    } catch (err) {
      setRubric(null);
      setCriteria([]);
    }
  };

  useEffect(() => {
    fetchRoundsAndRubric();
  }, [selectedRubricRoundId]);

  useEffect(() => {
    // When selected track or rounds change, auto-select a round for rubric selection
    if (selectedTrack && rounds.length > 0) {
      const trackRounds = rounds.filter((r: any) => r.trackId === selectedTrack._id);
      if (trackRounds.length > 0) {
        const roundOne = trackRounds.find((r: any) => r.order === 1) || trackRounds[0];
        setSelectedRubricRoundId(roundOne._id);
      } else {
        setSelectedRubricRoundId('');
        setRubric(null);
        setCriteria([]);
      }
    } else {
      setSelectedRubricRoundId('');
      setRubric(null);
      setCriteria([]);
    }
  }, [selectedTrack, rounds]);

  const handleCreateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedTrack || !selectedRubricRoundId) return;

    try {
      await axios.post(
        'http://localhost:5000/api/rubrics',
        {
          eventId: selectedEvent._id,
          trackId: selectedTrack._id,
          roundId: selectedRubricRoundId,
          name: rubricName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRubricName('');
      setMessage({ type: 'success', text: 'Khởi tạo Rubric thành công!' });
      fetchRoundsAndRubric();
      fetchExistingRubrics();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi khởi tạo Rubric.' });
    }
  };

  const handleUpdateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubric) return;
    try {
      const res = await axios.put(
        `http://localhost:5000/api/rubrics/${rubric._id}`,
        {
          name: editRubricName,
          description: editRubricDesc,
          totalWeight: parseFloat(editRubricTotalWeight),
          maxCriterionScore: parseFloat(editRubricMaxScore),
          isActive: editRubricIsActive
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRubric(res.data);
      setEditingRubric(false);
      setMessage({ type: 'success', text: 'Cập nhật Rubric thành công!' });
      fetchRoundsAndRubric();
      fetchExistingRubrics();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật Rubric.' });
    }
  };

  const handleDeleteRubric = async () => {
    if (!rubric) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa/vô hiệu hóa Rubric này?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/rubrics/${rubric._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRubric(null);
      setCriteria([]);
      setMessage({ type: 'success', text: 'Đã xóa Rubric thành công.' });
      fetchRoundsAndRubric();
      fetchExistingRubrics();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi xóa Rubric.' });
    }
  };

  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubric) return;

    const parsedWeight = parseFloat(critWeight);
    const parsedMaxScore = parseFloat(critMaxScore);
    const parsedOrder = parseInt(critOrder);

    if (isNaN(parsedWeight) || isNaN(parsedMaxScore)) {
      setMessage({ type: 'error', text: 'Trọng số và điểm tối đa phải là số.' });
      return;
    }

    const payload = {
      code: critCode.trim().toUpperCase(),
      name: critName.trim(),
      description: critDesc.trim(),
      weight: parsedWeight,
      maxScore: parsedMaxScore,
      order: isNaN(parsedOrder) ? undefined : parsedOrder,
      gradingLevels: critGradingLevels
    };

    try {
      if (editingCriterion) {
        await axios.put(
          `http://localhost:5000/api/criteria/${editingCriterion._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ type: 'success', text: 'Cập nhật tiêu chí chấm điểm thành công!' });
      } else {
        await axios.post(
          `http://localhost:5000/api/criteria/rubric/${rubric._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ type: 'success', text: 'Đã thêm tiêu chí chấm điểm mới!' });
      }

      setCritCode('');
      setCritName('');
      setCritDesc('');
      setCritWeight('20');
      setCritMaxScore('10');
      setCritOrder('1');
      setCritGradingLevels([]);
      setEditingCriterion(null);
      fetchRoundsAndRubric();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi lưu tiêu chí.' });
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/criteria/${criterionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Đã xóa tiêu chí thành công.' });
      fetchRoundsAndRubric();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi xóa tiêu chí.' });
    }
  };

  const handleStartEditCriterion = (c: any) => {
    setEditingCriterion(c);
    setCritCode(c.code);
    setCritName(c.name);
    setCritDesc(c.description || '');
    setCritWeight(String(c.weight));
    setCritMaxScore(String(c.maxScore || 10));
    setCritOrder(String(c.order || 1));
    setCritGradingLevels(c.gradingLevels || []);
  };

  const handleCancelEditCriterion = () => {
    setEditingCriterion(null);
    setCritCode('');
    setCritName('');
    setCritDesc('');
    setCritWeight('20');
    setCritMaxScore('10');
    setCritOrder('1');
    setCritGradingLevels([]);
  };

  const handleAddGradingLevel = () => {
    if (!levelLabel.trim() || levelMinScore === '' || levelMaxScore === '') {
      alert('Vui lòng điền nhãn, điểm tối thiểu và điểm tối đa.');
      return;
    }
    const min = parseFloat(levelMinScore);
    const max = parseFloat(levelMaxScore);
    if (isNaN(min) || isNaN(max)) {
      alert('Điểm số phải là số.');
      return;
    }
    if (min > max) {
      alert('Điểm tối thiểu không được lớn hơn điểm tối đa.');
      return;
    }

    const newLvl = {
      label: levelLabel.trim(),
      minScore: min,
      maxScore: max,
      description: levelDesc.trim()
    };

    setCritGradingLevels(prev => {
      const updated = [...prev, newLvl];
      return updated.sort((a, b) => a.minScore - b.minScore);
    });

    setLevelLabel('');
    setLevelMinScore('');
    setLevelMaxScore('');
    setLevelDesc('');
  };

  const handleRemoveGradingLevel = (index: number) => {
    setCritGradingLevels(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleLockRubric = async () => {
    if (!rubric) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/rubrics/${rubric._id}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRubric(res.data.rubric);
      setMessage({
        type: "success",
        text: "Đã khóa Rubric thành công! Bảng điểm đã sẵn sàng sử dụng.",
      });
      fetchRoundsAndRubric();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khóa Rubric.",
      });
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  GitHub Organization Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: seal-hackathon-2026"
                  value={githubOrgName}
                  onChange={(e) => setGithubOrgName(e.target.value)}
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
        <div className="space-y-6">
          {/* Event Header Panel */}
          <div className="glass p-6 rounded-2xl relative overflow-hidden bg-gradient-to-r from-indigo-950/20 to-slate-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start flex-col md:flex-row gap-4">
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
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Trạng thái:</label>
                  <select
                    value={selectedEvent.status}
                    onChange={(e) => handleUpdateEventStatus(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option className="bg-slate-900" value="draft">Draft</option>
                    <option className="bg-slate-900" value="registration">Registration</option>
                    <option className="bg-slate-900" value="ongoing">Ongoing</option>
                    <option className="bg-slate-900" value="completed">Completed</option>
                    <option className="bg-slate-900" value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <CalendarPlus size={14} />
                  Tạo cuộc thi mới
                </button>
              </div>
            </div>
            {selectedEvent.description && (
              <p className="text-xs text-slate-400 mt-4 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                {selectedEvent.description}
              </p>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-4 border-b border-slate-800/80 pb-3">
            <button
              onClick={() => setActiveTab("arena")}
              className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "arena"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800"
              }`}
            >
              Arena & Rubric Setup
            </button>
            <button
              onClick={() => setActiveTab("github")}
              className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "github"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800"
              }`}
            >
              <Github size={14} />
              GitHub & AI Review
            </button>
          </div>

          {activeTab === "arena" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Event details, tracks and rounds */}
              <div className="lg:col-span-2 space-y-6">

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
                            setSelectedRubricRoundId(firstRound._id);
                          } else {
                            setSelectedRubricRoundId('');
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
                            setSelectedRubricRoundId(r._id);
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
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5 font-mono">
                <Award size={18} className="text-indigo-400" />
                <span>Cấu hình Rubric & Tiêu chí</span>
              </h3>

              {/* Round Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Chọn Vòng Đấu (Round)</label>
                <select
                  value={selectedRubricRoundId}
                  onChange={e => setSelectedRubricRoundId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">-- Chọn Vòng Đấu --</option>
                  {rounds.filter((r: any) => r.trackId === selectedTrack?._id).map((r: any) => (
                    <option key={r._id} value={r._id}>{r.name} (Vòng {r.order})</option>
                  ))}
                </select>
              </div>

              {selectedRubricRoundId ? (
                rubric ? (
                  editingRubric ? (
                    /* Edit Rubric Form */
                    <form onSubmit={handleUpdateRubric} className="space-y-3.5 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 font-mono">
                      <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Chỉnh sửa Rubric</p>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Tên Rubric</label>
                        <input
                          type="text" required
                          value={editRubricName} onChange={e => setEditRubricName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Mô tả</label>
                        <textarea
                          value={editRubricDesc} onChange={e => setEditRubricDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs" rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Điểm tối đa / Tiêu chí</label>
                        <input
                          type="number" required
                          value={editRubricMaxScore} onChange={e => setEditRubricMaxScore(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editRubricIsActive} onChange={e => setEditRubricIsActive(e.target.checked)}
                          id="edit-rubric-active"
                        />
                        <label htmlFor="edit-rubric-active" className="text-xs text-slate-300">Hoạt động (Active)</label>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer">Lưu</button>
                        <button type="button" onClick={() => setEditingRubric(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-xs cursor-pointer">Hủy</button>
                      </div>
                    </form>
                  ) : (
                    /* Display Rubric Details & Criteria */
                    <div className="space-y-4 font-mono">
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-indigo-400">{rubric.name}</p>
                          {rubric.description && <p className="text-[10px] text-slate-400 mt-0.5">{rubric.description}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">Trọng số: {rubric.totalWeight}% | Max điểm: {rubric.maxCriterionScore}đ</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {rubric.isLocked ? (
                            <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] font-bold font-mono">
                              <Lock size={10} /> ĐÃ KHÓA
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditRubricName(rubric.name);
                                  setEditRubricDesc(rubric.description || '');
                                  setEditRubricTotalWeight(String(rubric.totalWeight));
                                  setEditRubricMaxScore(String(rubric.maxCriterionScore));
                                  setEditRubricIsActive(rubric.isActive);
                                  setEditingRubric(true);
                                }}
                                className="bg-slate-850 hover:bg-slate-800 border border-indigo-500/20 text-[9px] font-bold px-2 py-0.5 rounded text-indigo-450 cursor-pointer"
                              >
                                SỬA
                              </button>
                              <button type="button" onClick={handleDeleteRubric} className="bg-slate-850 hover:bg-slate-800 border border-rose-500/20 text-[9px] font-bold px-2 py-0.5 rounded text-rose-450 cursor-pointer">
                                XÓA
                              </button>
                            </div>
                          )}
                          
                          {!rubric.isLocked && (
                            <button onClick={handleLockRubric} className="bg-indigo-600 hover:bg-indigo-500 text-[9px] font-bold px-2.5 py-1 rounded text-white cursor-pointer">
                              KHÓA RUBRIC
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Weight progress bar */}
                      {(() => {
                        const currentWeightSum = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
                        const isFullyWeighted = Math.abs(currentWeightSum - rubric.totalWeight) < 0.01;
                        return (
                          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-800 text-[10px] space-y-1.5">
                            <div className="flex justify-between items-center font-semibold font-mono">
                              <span className="text-slate-400">Trọng số tiêu chí đã phân bổ:</span>
                              <span className={isFullyWeighted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                {currentWeightSum} / {rubric.totalWeight}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                              <div
                                  className={`h-full transition-all duration-300 ${isFullyWeighted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${Math.min(100, (currentWeightSum / rubric.totalWeight) * 100)}%` }}
                              ></div>
                            </div>
                            {!isFullyWeighted && !rubric.isLocked && (
                              <p className="text-[9px] text-amber-500/80 italic font-mono">
                                * Tổng trọng số tiêu chí phải bằng {rubric.totalWeight}% mới có thể khoá Rubric.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Criteria list */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-300">Tiêu chí chi tiết:</p>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {criteria.map((c: any) => (
                            <div key={c._id} className="bg-slate-900/30 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-slate-200">[{c.code}] {c.name}</span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{c.description || 'Không mô tả.'}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-indigo-400 font-bold">{c.weight}%</span>
                                  <p className="text-[9px] text-slate-500 mt-0.5">Max: {c.maxScore}đ | Hạng: {c.order || 0}</p>
                                </div>
                              </div>

                              {c.gradingLevels && c.gradingLevels.length > 0 && (
                                <div className="pt-1.5 border-t border-slate-850">
                                  <div className="flex flex-wrap gap-1">
                                    {c.gradingLevels.map((lvl: any, idx: number) => (
                                      <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded text-[8px] border border-slate-850 text-slate-400" title={lvl.description}>
                                        <strong className="text-indigo-300">{lvl.label}</strong> ({lvl.minScore}-{lvl.maxScore}đ)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {!rubric.isLocked && (
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCriterion(c)}
                                    className="text-[9px] text-indigo-400 hover:underline font-semibold cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCriterion(c._id)}
                                    className="text-[9px] text-rose-400 hover:underline font-semibold cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {criteria.length === 0 && <p className="text-xs text-slate-500 italic">Chưa có tiêu chí nào.</p>}
                        </div>
                      </div>

                      {/* Add/Edit Criterion Form */}
                      {!rubric.isLocked && (
                        <form onSubmit={handleSaveCriterion} className="space-y-3 pt-3 border-t border-slate-800">
                          <p className="text-xs font-bold text-slate-350">{editingCriterion ? `Sửa tiêu chí [${editingCriterion.code}]` : 'Thêm tiêu chí mới'}</p>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="text" required placeholder="MÃ (e.g. CODE)"
                              value={critCode} onChange={e => setCritCode(e.target.value)}
                              className="w-full px-2 py-1.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200"
                            />
                            <input 
                              type="text" required placeholder="Tên tiêu chí (e.g. Clean Code)"
                              value={critName} onChange={e => setCritName(e.target.value)}
                              className="w-full px-2 py-1.5 rounded text-xs col-span-2 bg-slate-900 border border-slate-800 text-slate-200"
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="number" required placeholder="Trọng số %"
                              value={critWeight} onChange={e => setCritWeight(e.target.value)}
                              className="w-full px-2 py-1.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200"
                            />
                            <input 
                              type="number" required placeholder="Max Điểm"
                              value={critMaxScore} onChange={e => setCritMaxScore(e.target.value)}
                              className="w-full px-2 py-1.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200"
                            />
                            <input 
                              type="number" placeholder="Thứ tự"
                              value={critOrder} onChange={e => setCritOrder(e.target.value)}
                              className="w-full px-2 py-1.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200"
                            />
                          </div>

                          <input 
                            type="text" placeholder="Mô tả tiêu chí"
                            value={critDesc} onChange={e => setCritDesc(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200"
                          />

                          {/* Grading Levels Management in Form */}
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Định nghĩa mức chấm (Grading Levels)</p>
                            
                            {/* Display currently added levels in form */}
                            {critGradingLevels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {critGradingLevels.map((lvl, idx) => (
                                  <div key={idx} className="bg-slate-900 border border-slate-800 text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                    <span className="text-slate-300">
                                      <strong className="text-indigo-400">{lvl.label}</strong> ({lvl.minScore}-{lvl.maxScore}đ)
                                    </span>
                                    <button type="button" onClick={() => handleRemoveGradingLevel(idx)} className="text-rose-400 font-bold hover:text-rose-350">×</button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Form inputs for new level */}
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text" placeholder="Nhãn (Tốt)"
                                value={levelLabel} onChange={e => setLevelLabel(e.target.value)}
                                className="w-full px-2 py-1 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-200"
                              />
                              <input
                                type="number" step="0.1" placeholder="Điểm min (7.0)"
                                value={levelMinScore} onChange={e => setLevelMinScore(e.target.value)}
                                className="w-full px-2 py-1 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-200"
                              />
                              <input
                                type="number" step="0.1" placeholder="Điểm max (8.5)"
                                value={levelMaxScore} onChange={e => setLevelMaxScore(e.target.value)}
                                className="w-full px-2 py-1 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-200"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text" placeholder="Mô tả chi tiết mức chấm này..."
                                value={levelDesc} onChange={e => setLevelDesc(e.target.value)}
                                className="flex-1 px-2 py-1 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-200"
                              />
                              <button
                                type="button"
                                onClick={handleAddGradingLevel}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                + Thêm
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg cursor-pointer">
                              {editingCriterion ? 'Lưu cập nhật' : 'Lưu tiêu chí'}
                            </button>
                            {editingCriterion && (
                              <button type="button" onClick={handleCancelEditCriterion} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-4 rounded-lg cursor-pointer">
                                Hủy sửa
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  )
                ) : (
                  /* Initial Rubric creation form if no rubric exists */
                  <form onSubmit={handleCreateRubric} className="space-y-3 font-mono">
                    <p className="text-xs text-slate-400">Chưa khởi tạo Rubric cho Vòng Đấu này.</p>
                    <input 
                      type="text" required placeholder="Tên Rubric (e.g. Rubric Đánh giá Vòng 1)"
                      value={rubricName} onChange={e => setRubricName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200"
                    />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer">
                      Khởi tạo Rubric
                    </button>
                  </form>
                )
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4 font-mono">Vui lòng chọn Vòng Đấu để cấu hình Rubric.</p>
              )}
            </div>
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
      ) : (
          /* GitHub Integration Tab */
          <div className="glass p-6 rounded-2xl w-full mt-2 space-y-6 font-mono">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Github size={18} className="text-indigo-400" />
              <span>Quản lý GitHub Repositories của các đội thi</span>
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
                          r.syncStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          r.syncStatus === 'syncing' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse border border-indigo-500/20' :
                          r.syncStatus === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}>
                          {r.syncStatus.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleSyncRepo(r._id)}
                          disabled={syncingRepoId === r._id}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          {syncingRepoId === r._id ? 'Đang sync...' : 'AI Sync'}
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
                  <p className="text-[10px] text-slate-550">Tạo repo riêng tư trong tổ chức GitHub và phân quyền cho các thành viên đã xác nhận.</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allTeams.filter((t: any) => !repos.some((r: any) => r.teamId?._id === t._id)).map((t: any) => (
                      <div key={t._id} className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">{t.name}</span>
                        <button
                          onClick={() => handleCreateRepo(t._id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
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
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200"
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
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200"
                    />
                    <input
                      type="url"
                      placeholder="Link Repo (https://github.com/...)"
                      value={manualRepoUrl}
                      onChange={e => setManualRepoUrl(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200"
                    />
                    <button
                      type="submit"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                    >
                      Liên kết Repo
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    )}
  </div>
  );
}
