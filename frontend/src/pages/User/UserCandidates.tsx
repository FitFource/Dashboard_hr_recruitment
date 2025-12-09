import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Candidate } from '../../types';
import { useAuthStore } from '../../store/authStore';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;


  

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(() => {
      fetchCandidates(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter, roleFilter, search, levelFilter]);


  const fetchCandidates = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('position', roleFilter);
      if (search) params.append('search', search);
      if (levelFilter) params.append('level', levelFilter);


      const response = await api.get(`/candidates/user/getAll?${params.toString()}`);
      setCandidates(response.data.candidates);

      const uniqueLevels = Array.from(new Set(response.data.candidates.map(c => c.level))).sort();
      setLevels(uniqueLevels);
      
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

 
  const handleStatusChange = async (candidate: Candidate, value: number) => {
    const latestCandidate = candidates.find(
      c => c.id === candidate.id && c.position_id === candidate.position_id
    );

    if (!latestCandidate) {
      toast.error("Candidate not found in state");
      return;
    }

    if (Number(latestCandidate.status_id) !== 1 && value === 5) {
      toast.error("Can only update 'In Progress' candidates");
      return;
    }

    const allowedStatuses = [2, 3, 5, 6];
    if (!allowedStatuses.includes(value)) {
      toast.error("Invalid status selection");
      return;
    }

    const needSchedule = [5, 6];
    if (needSchedule.includes(value) && !latestCandidate.schedule) {
      toast.error("Please set interview date first");
      return;
    }

    const statusMap: Record<number, string> = {
      2: "Accepted",
      3: "Rejected",
      5: "Continue Interviewing",
      6: "Passed Interview",
    };

    let confirmResult;

    // =====================================================
    // 🟦 CASE 1 — STATUS 5 → SEND INTERVIEW SCHEDULE
    // =====================================================
    if (value === 5) {
      confirmResult = await MySwal.fire({
        title: "Send Interview Schedule?",
        html: `
          <p>You will send an interview schedule to:</p>
          <p><strong>${latestCandidate.name}</strong> (${latestCandidate.email})</p>
          <br/>
          <p><strong>Interview Date:</strong></p>
          <div style="padding: 10px; background: #f3f3f3; border-radius: 6px; margin-top: 6px;">
            ${formatDateTime(latestCandidate.schedule)}
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Send",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
    }

    // =====================================================
    // 🟥 CASE 2 — STATUS 3 → REJECT
    // =====================================================
    else if (value === 3) {
      confirmResult = await MySwal.fire({
        title: "Reject Candidate?",
        html: `
          <p>Are you sure you want to reject:</p>
          <p><strong>${latestCandidate.name}</strong></p>
          <p class="mt-2 text-sm text-gray-600">
            📧 A rejection email will be sent to <strong>${latestCandidate.email}</strong>.
          </p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
    }

    // =====================================================
    // 🟥 CASE 3 → Passed
    // =====================================================
    else if (value === 6) {
      confirmResult = await MySwal.fire({
        title: "Passed Candidate?",
        html: `
          <p>Are you sure you want to <strong>Accept ${latestCandidate.name}</strong>?</p>
          <p class="mt-2 text-sm text-gray-600">
            📧 A notification email will be sent to HR Team.
          </p>
          <textarea id="feedbackInput" class="swal2-textarea" placeholder="Provide your feedback for the candidate (optional)" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; width: 80%; min-height: 200px; resize: vertical;"></textarea>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Send",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        preConfirm: () => {
          const inputEl = document.getElementById('feedbackInput') as HTMLTextAreaElement;
          return inputEl?.value || null;
        }
      });
    }


    // =====================================================
    // 🟩 CASE - OTHER STATUS 
    // =====================================================
    else {
      confirmResult = await MySwal.fire({
        title: "Are you sure?",
        html: `
          <p>Do you really want to change the status to:</p>
          <p><strong>${statusMap[value]}</strong></p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        reverseButtons: true,
      });
    }

    if (!confirmResult.isConfirmed) return;

    // =====================================================
    // EXECUTE UPDATE
    // =====================================================
    try {
      if (value === 5) {
        await updateSchedule(
          latestCandidate.id,
          latestCandidate.position_id,
          latestCandidate.schedule
        );
      }

      let feedback = null;
      if (value === 6) {
        feedback = confirmResult.value || "Kindly continue processing the candidate, they are suitable for the role.";
      }

      const res = await api.put(`/candidates/status/${latestCandidate.id}`, {
        newStatus: value,
        feedback 
      });

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === latestCandidate.id && c.position_id === latestCandidate.position_id
            ? {
                ...c,
                status_id: Number(res.data.candidate.status),
                status_label: statusMap[value],
              }
            : c
        )
      );

      // Success toast messages per-case
      if (value === 5) {
        toast.success("Interview schedule sent successfully");
      } else if (value === 3) {
        toast.success("Candidate rejected and email notification sent");
      } else {
        toast.success("Candidate status updated successfully");
      }

      fetchCandidates(true);

    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };


  const renderDropdown = (candidate: Candidate) => {
    const hasSchedule = !!candidate.schedule;
    const status = Number(candidate.status_id);

    if (status === 1) {
      return (
        <select 
          value={candidate.status_id}
          onChange={e => handleStatusChange(candidate, Number(e.target.value))}
          className="w-24 px-3 py-1.5 rounded-2xl border border-accent/70 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-white cursor-pointer hover:bg-background/50 transition-all text-primary-900 shadow-sm"
          title="Update candidate status"
        >
          <option value={1}>Open</option>
          <option value={5}>Interview Process</option>
          <option value={3}>Rejected</option>
        </select>      
      );
    }

    if (status === 5) {
      return (
        <select 
          value={candidate.status_id}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value === 0) {
              onScheduleChange(candidate); // ✅ update schedule
            }
            if (value === 6 || value === 3) {
              handleStatusChange(candidate, value); // ✅ update status
            };
            // e.target.value = "";
          }}
          className="w-24 px-3 py-1.5 rounded-2xl border border-accent/70 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-white cursor-pointer hover:bg-background/50 transition-all text-primary-900 shadow-sm"
          title="Update candidate status"
        >
          <option value={5}>Open</option>
          <option value={0}>Update Schedule</option>
          <option value={6}>Interview Passed</option>
          <option value={3}>Rejected</option>
        </select>      
      );
    }

    return (
      <select
        value="closed"
        disabled
        className="w-24 px-3 py-1 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
      >
        <option value="closed">Closed</option>
      </select>
    );
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
      const fileId = link.split('/d/')[1]?.split('/')[0];

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

    const openSummaryModal = (text: string) => {
    MySwal.fire({
        title: "AI Summary",
        html: `<p style="text-align:left">${text}</p>`,
        width: "60%",
        showCloseButton: true,
        showConfirmButton: false
    });
    };


    const openInterviewHistory = async (candidateId: number, positionId: number) => {
        try {
            const res = await api.get(`/candidates/interview/latest/${candidateId}/${positionId}`);

            const messages = res.data?.messages;

            if (!messages || messages.length === 0) {
            toast.error("No interview history found");
            return;
            }

            const chatUI = messages.map((m: any, index: number) => {
            const isAI = index % 2 === 0;

            return `
                <div style="text-align:${isAI ? "left" : "right"}; margin:10px 0;">
                <div style="
                display:inline-block;
                padding:10px 14px;
                border-radius:18px;
                max-width:70%;
                background:${isAI ? "#f1f5f9" : "#4f46e5"};
                color:${isAI ? "#111" : "#fff"};
                font-size:14px;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
                'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
                ">
                    ${m.chat_history}
                </div>
                </div>
            `;
            }).join("");


            MySwal.fire({
            title: `Interview History`,
            html: `
                <div style="
                max-height:500px;
                overflow:auto;
                padding:8px;
                background:#ffffff;
                border-radius:10px;
                ">
                ${chatUI}
                </div>
            `,
            width: "60%",
            showCloseButton: true,
            showConfirmButton: false
            });

        } catch (error: any) {
            console.error("ERROR:", error);
            toast.error("There is no data interview history");
        }
        };

  const statusOptions = React.useMemo(() => {
      return [...new Set(candidates.map((c) => c.status_label).filter(Boolean))];
    }, [candidates]);

  const filteredCandidates = candidates.filter(c => {
    if (!c.submit_date) return false;
    const submit = new Date(c.submit_date);
    return (!startDate || submit >= startDate) && (!endDate || submit <= endDate);
  });

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
          <div className="relative overflow-visible z-[9999]">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              isClearable
              placeholderText="📅 Apply Date"
              className="w-full px-4 py-3 border border-accent/60 rounded-2xl"
              portalId="root-portal"
              popperPlacement="bottom-start"
            />
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
          <div className="overflow-x-auto overflow-y-visible relative">
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
                    Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Job Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    CV Link
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Residence
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Avg Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Tech Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    SoftSkill Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Summary AI
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Technical Link
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Apply Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Schedule Interview
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Ranking
                  </th>
                  {user?.role === 'user' && (
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
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map(candidate => (
                    <tr key={candidate.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-900">{candidate.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                        {candidate.email || 'Null'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.level || 'Null'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.position || 'Null'}
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
                            "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.residence || 'Null'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.score || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.tech_score || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.soft_score || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900 max-w-xs">
                        {candidate.summary ? (
                            <button
                            onClick={() => openSummaryModal(candidate.summary)}
                            className="text-left line-clamp-3 hover:underline hover:text-primary-600"
                            >
                            {candidate.summary}
                            </button>
                        ) : (
                            'No Summary'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {candidate.tech_link ? (
                            <a
                            href={candidate.tech_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 underline flex items-center gap-2"
                            >
                            <Eye size={16} /> View Technical
                            </a>
                        ) : (
                            'No Technical Link'
                        )}
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

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.submit_date && !isNaN(new Date(candidate.submit_date).getTime())
                          ? new Date(candidate.submit_date.toString().replace(' ', 'T'))
                              .toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                          : 'N/A'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
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

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.rank || 0}
                      </td>
                      {user?.role === 'user' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {renderDropdown(candidate)}
                      </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                            onClick={() => openInterviewHistory(candidate.id, candidate.position_id)}
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 underline"
                        >
                            <Eye size={16} />
                            View
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


