import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Candidate } from '../types';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);


const Candidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { user } = useAuthStore();
  const [positions, setPositions] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [levels, setLevels] = useState<string[]>([]);

  

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(() => {
      fetchCandidates(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter, roleFilter, search, levelFilter]);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await api.get('/metrics/levels');
        setLevels(res.data.levels);
      } catch (err) {
        console.error("Failed to fetch levels:", err);
      }
    };
    fetchLevels();
  }, []);


  const fetchCandidates = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('position', roleFilter);
      if (search) params.append('search', search);
      if (levelFilter) params.append('level', levelFilter);


      const response = await api.get(`/candidates?${params.toString()}`);
      setCandidates(response.data.candidates);
    } catch (error: any) {
      if (!silent) {
        toast.error('Failed to fetch candidates');
        console.error('Error:', error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCandidates();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const statusOptions = React.useMemo(() => {
    return [...new Set(candidates.map((c) => c.status_label).filter(Boolean))];
  }, [candidates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'User Interview':
        return 'bg-blue-100 text-blue-800';
      case 'Offering':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get('/candidates/positions');
        setPositions(response.data.positions);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      }
    };
    fetchPositions();
  }, []);



    const handleStatusChange = async (candidate: Candidate, value: number) => {
      console.log("handleStatusChange called:", candidate.id, "current:", candidate.status_id, "new:", value);
      if (Number(candidate.status_id) !== 1 && value === 6){
        toast.error("Can only update 'In Progress' candidates");
        return;
      }

      if (![0,2, 3,7].includes(value)) {
        toast.error("Invalid status selection");
        return;
      }
      
      const actionText = value === 2 ? "Accepted" : value === 3 ? "Rejected" : value === 7 ? "Withdraw" :"Re-Open" 
  
      const emailNotice = value === 3
        ? `📧 A rejection email will be automatically sent to ${candidate.email}`
        : value === 0
          ? `📧 A notification will be sent that the candidate is reopened to ${candidate.email}`
          : '';

      const result = await MySwal.fire({
        title: `Are you sure?`,
        html: `
          <p>Do you really want to <strong>${actionText}</strong> this candidate?</p>
          ${value === 3 ? `<p class="mt-2 text-sm text-gray-600">📧 A rejection email will be sent to <strong>${candidate.email}</strong></p>` : ''}
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        reverseButtons: true,
        focusCancel: true,
        customClass: {
          popup: 'rounded-lg', 
        }
      });
      if (!result.isConfirmed) return; 

      try {
        const res = await api.put(`/candidates/status/${candidate.id}`, { newStatus: value });

        // Update local state using integer status
        setCandidates(prev =>
          prev.map(c =>
            c.id === candidate.id
              ? { 
                  ...c, 
                  status_id: Number(res.data.candidate.status),
                  status_label: value === 2 ? "Accepted" : value === 3 ? "Rejected" : value === 7 ? "Withdraw" :"Re-Open" 
                }
              : c
          )
        );

        const successMessage = value === 3 
          ? "Candidate rejected and email notification sent" 
          : "Candidate status updated successfully";
        
        toast.success(res.data.message || successMessage);
        fetchCandidates(true);
      } catch (err: any) {
        console.error("Error updating status:", err);
        toast.error(err.response?.data?.error || "Failed to update status");
      }
    };

  const renderDropdown = (candidate: Candidate) => {
    if (Number(candidate.status_id) === 1 || Number(candidate.status_id) === 6) {
      return (
        <select 
          value={candidate.status_id}
          onChange={e => handleStatusChange(candidate, Number(e.target.value))}
          className="w-24 px-3 py-1.5 rounded-2xl border border-accent/70 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-white cursor-pointer hover:bg-background/50 transition-all text-primary-900 shadow-sm"
          title="Update candidate status"
        >
          <option value={1}>Open</option>
          <option value={2}>Accepted</option>
          <option value={3}>Rejected</option>
          <option value={7}>Withdraw</option>
        </select>
      );
    }else if(Number(candidate.status_id) === 5) {
       return (
        <select 
          value={candidate.status_id}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value === 0) {
              onScheduleChange(candidate); 
            }
            if (value === 7) {
              handleStatusChange(candidate, value); 
            };
          }}
          className="w-24 px-3 py-1.5 rounded-2xl border border-accent/70 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-white cursor-pointer hover:bg-background/50 transition-all text-primary-900 shadow-sm"
          title="Update candidate status"
        >
          <option value={5}>Open</option>
          <option value={0}>Update Schedule</option>
          <option value={7}>Withdraw</option>
        </select>
      )
    }else if (Number(candidate.status_id) === 3 || Number(candidate.status_id) === 7) {
       return (
        <select 
          value={candidate.status_id}
          onChange={e => handleStatusChange(candidate, Number(e.target.value))}
          className="w-24 px-3 py-1.5 rounded-2xl border border-accent/70 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-white cursor-pointer hover:bg-background/50 transition-all text-primary-900 shadow-sm"
          title="Update candidate status"
        >
          <option value={7}>Close</option>
          <option value={0}>Re-Open</option>
        </select>
      )
    }else{
      return (
        <select 
          value="closed" 
          disabled 
          className="w-24 px-3 py-1 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
          title="This candidate's status is closed and cannot be changed"
        >
          <option value="closed">Closed</option>
        </select>
      )};
  };

  const updateSchedule = async (candidateId: number, positionId: number, schedule: string) => {
      try {
        const res = await api.put("/candidates/schedule", {
          candidate_id: candidateId,
          position_id: positionId,
          schedule: schedule
        });

        return res.data;
      } catch (error) {
        toast.error("Failed to update schedule");
        throw error;
      }
    };

  const onScheduleChange = async (candidate: Candidate) => {
      if (!candidate.schedule) {
        toast.error("Please set interview date first");
        return;
      }

      const result = await MySwal.fire({
        title: "Update Interview Schedule?",
        html: `
          <p>You will send an interview schedule to:</p>
          <p><strong>${candidate.name}</strong> (${candidate.email})</p>
          <br/>
          <p><strong>Interview Date:</strong></p>
          <div style="padding: 10px; background: #f3f3f3; border-radius: 6px; margin-top: 6px;">
            ${formatDateTime(candidate.schedule)}
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Send",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      try {
        await updateSchedule(
          candidate.id,
          candidate.position_id,
          candidate.schedule
        );

        toast.success("Schedule updated successfully ✅");
        fetchCandidates(true);

      } catch (err) {
        console.error("Error updating schedule:", err);
        toast.error("Failed to update schedule ❌");
      }
    };

  const openCVPreview = (link: string) => {
      let fileId = null;

      // Format: https://drive.google.com/file/d/<id>/view
      if (link.includes('/d/')) {
        fileId = link.split('/d/')[1]?.split('/')[0];
      }
      
      // Format: https://drive.google.com/open?id=<id>
      else if (link.includes('open?id=')) {
        fileId = link.split('open?id=')[1];
      }

      if (!fileId) {
        toast.error("There is no CV to preview");
        return;
      }

      MySwal.fire({
        title: 'Curriculum Vitae',
        html: `
          <iframe 
            src="https://drive.google.com/file/d/${fileId}/preview"
            width="100%"
            height="500px"
            style="border:none;border-radius:12px;"
          ></iframe>
        `,
        width: "60%",
        showCloseButton: true,
        showConfirmButton: false
      });
    };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

    const openSummaryModal = (text: string) => {
    const formattedText = text
      .split('\n')
      .map(line => `<p style="margin-bottom:12px;">${line}</p>`)
      .join('');

    MySwal.fire({
      title: "AI Summary",
      html: `
        <div style="
          text-align: justify;
          line-height: 1.6;
          font-size: 14px;
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 6px;
        ">
          ${formattedText}
        </div>
      `,
      width: "60%",
      showCloseButton: true,
      showConfirmButton: false
    });
  };


  
  const openInterviewHistory = async (candidateId: number, positionId: number) => {
  // 🔹 1. SHOW LOADING MODAL FIRST
  MySwal.fire({
    title: "Interview History",
    html: `
      <div style="padding:40px; text-align:center;">
        <div class="swal2-loader" style="margin:0 auto;"></div>
        <p style="margin-top:16px; font-size:14px;">Loading interview history...</p>
      </div>
    `,
    width: "60%",
    showConfirmButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    // 🔹 2. FETCH DATA
    const res = await api.get(
      `/candidates/interview/latest/${candidateId}/${positionId}`
    );

    const records = res.data?.messages || [];

    if (!Array.isArray(records) || records.length === 0) {
      MySwal.close();
      toast.error("No interview history found");
      return;
    }

    const escapeHTML = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const createAudioURL = (binary: any) => {
      if (!binary) return null;

      try {
        const byteArray = new Uint8Array(binary.data || binary);
        const blob = new Blob([byteArray], { type: "audio/webm" });
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error("Failed to create audio URL", err);
        return null;
      }
    };

    // 🔹 3. BUILD UI
    let chatUI = "";

    records.forEach((row: any) => {
      const audioUrl = row.audio_content
        ? createAudioURL(row.audio_content)
        : null;

      chatUI += `
        <!-- QUESTION -->
        <div style="text-align:left; margin:10px 0;">
          <div style="
            display:inline-block;
            padding:10px 14px;
            border-radius:18px;
            max-width:70%;
            background:#f1f5f9;
          ">
            <strong>Question ${row.quest_num}:</strong><br/>
            ${escapeHTML(row.question || "-")}
          </div>
        </div>

        <!-- ANSWER -->
        <div style="text-align:right; margin:12px 0;">
          ${
            audioUrl
              ? `
                <div style="margin-bottom:6px;">
                  <audio controls style="
                    display:inline-block;
                    width:70%;
                    border-radius:10px;
                  ">
                    <source src="${audioUrl}" type="audio/webm" />
                  </audio>
                </div>
              `
              : ""
          }

          <div style="
            display:inline-block;
            padding:12px 14px;
            border-radius:18px;
            max-width:70%;
            background:#4f46e5;
            color:#ffffff;
          ">
            <strong>Answer:</strong><br/>
            ${
              !row.answer ||
              row.answer === "[Tidak ada jawaban terdeteksi]"
                ? "<i>No answer detected</i>"
                : escapeHTML(row.answer)
            }
          </div>
        </div>
      `;
    });

    // 🔹 4. UPDATE MODAL CONTENT
    MySwal.update({
      html: `
        <div style="max-height:500px; overflow:auto;">
          ${chatUI}
        </div>
      `,
      showCloseButton: true,
      allowOutsideClick: true
    });

  } catch (error) {
    console.error(error);
    MySwal.close();
    toast.error("There is no data interview history");
  }
};





  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
        <div className="flex gap-3">
          <div className="md:col-span-2">
            <div className="relative w-[31.25rem]">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-900/50" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-11 pr-4 py-3 border border-accent/60 rounded-2xl focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-primary-900 hover:border-accent shadow-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 ml-auto">
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-accent/60 rounded-2xl focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-primary-900 hover:border-accent shadow-sm"
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

          </div>
          <div className="w-48">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-3 border border-accent/60 rounded-2xl focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-primary-900 hover:border-accent shadow-sm"
            >
              <option value="">All Levels</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 border border-accent/60 rounded-2xl focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-primary-900 hover:border-accent shadow-sm"
            >
              <option value="">All Roles</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSearch}
           className="px-5 py-2.5 bg-primary-500 text-background rounded-2xl hover:bg-primary-600 transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setRoleFilter('');
              setLevelFilter('');
            }}
            className="px-5 py-2.5 bg-accent text-primary-900 rounded-2xl hover:bg-accent/80 transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent/20"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 absolute top-0"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-accent/30">
              <thead className="bg-gradient-to-r from-primary-500/80 to-primary-500/70 border-b border-primary-500/30 rounded-t-2xl">
                <tr>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Phone Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Job Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Residence
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    CV Link
                  </th>                  
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Curt Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Nervous Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Calmmness Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Confident Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Enthusiast Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Tech Knowledge Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Summary AI
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Technical Test
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    User Interview
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Status
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                      <div className="mr-10">Actions</div>
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Interview History
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-accent/20 rounded-b-2xl">
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-900">{candidate.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                        {candidate.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                        <a
                          href={`https://wa.me/${candidate.phone_number.slice(1)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-green-600"
                        >
                          {candidate.phone_number}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.level || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.position || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.residence || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {candidate.cv_link ? (
                            <button
                            onClick={() => openCVPreview(candidate.cv_link)}
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 underline"
                            >
                            <Eye size={16}/> View CV
                            </button>
                        ) : (
                            "No CV uploaded"
                        )}
                      </td>                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                         {candidate.curt
                          ? `${candidate.curt.toFixed(2)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.nervous
                          ? `${candidate.nervous.toFixed(2)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.calmness 
                          ? `${candidate.calmness.toFixed(2)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.confident
                          ? `${candidate.confident.toFixed(2)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.enthusiast
                          ? `${candidate.enthusiast.toFixed(2)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.technical_knowledge
                          ? `${candidate.technical_knowledge.toFixed(2)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900">
                        {candidate.summary ? (
                          <button
                            onClick={() => openSummaryModal(candidate.summary)}
                            className="
                              flex items-center gap-2
                              text-primary-600 hover:text-primary-800
                              hover:underline font-medium
                              whitespace-nowrap underline
                            "
                          >
                            <Eye size={16} /> View Summary
                          </button>
                        ) : (
                          <span className="text-primary-900/50 italic">
                            No Summary
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {candidate.tech_link ? (
                          <a
                            href={candidate.tech_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2
                                text-primary-600 hover:text-primary-800
                                hover:underline font-medium
                                whitespace-nowrap underline"
                          >
                            <Eye size={16} /> View Technical
                          </a>
                        ) : (
                          <span className="text-primary-900/50 italic">
                            No Technical Test
                          </span>
                        )}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        <input
                          type="datetime-local"
                          value={candidate.schedule ? candidate.schedule.slice(0, 16) : ""}
                          onChange={(e) => {
                            const newSchedule = e.target.value;

                            setCandidates((prev) =>
                              prev.map((c) =>
                                c.id === candidate.id && c.position_id === candidate.position_id
                                  ? { ...c, schedule: newSchedule }
                                  : c
                              )
                            );
                          }}
                          className="border px-3 py-1.5 rounded-lg"
                        />

                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        <input
                          type="datetime-local"
                          value={candidate.schedule ? candidate.schedule.slice(0, 16) : ""}
                          readOnly={Number(candidate.status_id) !== 5}
                          onChange={(e) => {
                            if (Number(candidate.status_id) !== 5) return;

                            const newSchedule = e.target.value;

                            setCandidates((prev) =>
                              prev.map((c) =>
                                c.id === candidate.id && c.position_id === candidate.position_id
                                  ? { ...c, schedule: newSchedule }
                                  : c
                              )
                            );
                          }}
                          className="border px-3 py-1.5 rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1.5 inline-flex text-xs leading-5 rounded-full shadow-sm ${getStatusColor(
                            candidate.status_label
                          )}`}
                        >
                          {candidate.status_label.replace('_', ' ')}
                        </span>
                      </td>
                      {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {renderDropdown(candidate)}
                      </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                            onClick={() => openInterviewHistory(candidate.id, candidate.position_id)}
                            className="flex items-center gap-2
                              text-primary-600 hover:text-primary-800
                              hover:underline font-medium
                              whitespace-nowrap underline"
                        >
                            <Eye size={16} />
                            View History
                        </button>
                    </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-primary-900/60">
                      No candidates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Candidates;
