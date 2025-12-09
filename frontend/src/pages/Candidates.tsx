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

  // Update Status
  const handleStatusChange = async (candidate: Candidate, value: number) => {
    if (Number(candidate.status_id) !== 1){
      toast.error("Can only update 'In Progress' candidates");
      return;
    }

    if (![2, 3].includes(value)) {
      toast.error("Invalid status selection");
      return;
    }

    const actionText = value === 2 ? "Accepted" : "Rejected";
    const emailNotice = value === 3 
      ? `

📧 A rejection email will be automatically sent to ${candidate.email}` 
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
                status_label: value === 2 ? "Accepted" : "Rejected" 
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
        </select>
      );
    }

    if (Number(candidate.status_id) === 5) {
       return (
        <select 
          value="closed" 
          disabled 
          className="w-24 px-3 py-1 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
          title="This candidate's status is closed and cannot be changed"
        >
          <option value="closed">Open</option>
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

  const formatWIB = (dateString) => {
    const date = new Date(dateString);

    const datePart = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

    const timePart = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return `${datePart}, ${timePart}`;
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
                    User Interview
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Summary AI
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                      <div className="mr-10">Actions</div>
                    </th>

                  )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.level || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.position || 'N/A'}
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
                        {candidate.residence || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {candidate.schedule ? formatWIB(candidate.schedule) : "No Schedule"}
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
                        {candidate.score || 0}
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
                      {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {renderDropdown(candidate)}
                      </td>
                      )}
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