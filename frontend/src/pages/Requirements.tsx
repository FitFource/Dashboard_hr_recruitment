import React, { useEffect, useState, useMemo } from "react";
import { Upload, Trash2, FileText } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { JobRequirement } from '../types';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);


const Requirements: React.FC = () => {
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const [roleFilter, setRoleFilter] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [levelFilter, setLevelFilter] = useState('');
  const [form, setForm] = useState({
    level: "",
    position_text: "",
    requirement_text: ""
  });


  useEffect(() => {
    fetchRequirements();
    fetchPositions();
    
    const interval = setInterval(() => {
      fetchRequirements(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRequirements = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/requirements');
      setRequirements(response.data.requirements);
    } catch (error: any) {
      if (!silent) {
        toast.error('Failed to fetch requirements');
        console.error('Error:', error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get('/requirements/positions');

      let uniqueLevels: string[] = [];
      let uniquePositions: string[] = [];

      if (Array.isArray(res.data)) {
        uniqueLevels = Array.from(new Set(res.data.map((p: any) => p.level)));
        uniquePositions = Array.from(new Set(res.data.map((p: any) => p.position)));
      }
      else if (res.data.level && res.data.position) {
        uniqueLevels = Array.from(new Set(res.data.level));
        uniquePositions = Array.from(new Set(res.data.position));
      }

      setLevels(uniqueLevels);
      setPositions(uniquePositions);

    } catch (err) {
      console.error('Failed to fetch levels/positions', err);
      toast.error('Failed to fetch levels/positions');
    }
  };

  const handleSave = async () => {
    const { level, position_text, requirement_text} = form;
    if (!level || !position_text || !requirement_text) {
      toast.error("All fields are required");
      return;
    }

    setUploading(true);
    setLoading(true);

    try {
    
      if (editingId) {
        // Update
        const res = await api.put(`/requirements/${editingId}`, {
          level,
          position: position_text,
          requirements: requirement_text
        });
        setRequirements(prev =>
          prev.map(q => q.id === editingId ? res.data.requirements : q)
        );
        toast.success("Job Requirements updated");
      } else {
        // Add new
        const res = await api.post(`/requirements`, {
          level,
          position: position_text,
          requirements: requirement_text
        });
        setRequirements(prev => {
          const exist = prev.find(q => q.id === res.data.requirements.id);
          if (exist) {
            return prev.map(q => q.id === res.data.requirements.id ? res.data.requirements : q);
          }
          return [...prev, res.data.requirements];
        });

        setShowForm(false);
        setEditingId(null);
        setForm({ level: "", position_text: "", requirement_text: "" });
        toast.success("Job Requirements added");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save requirements");
    }finally {
      setUploading(false);
      setLoading(false);
      await fetchRequirements();
    }
  };

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: `Are you sure?`,
      text: `Do you really want to DELETE this requirements?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: "rounded-lg",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/requirements/${id}`);
      toast.success("Job Requirements deleted successfully");
      setRequirements(prev => prev.filter(q => q.id !== id));
    } catch (error: any) {
      toast.error("Failed to delete requirements");
      console.error("Error:", error);
    }
  };

  const handleEdit = async (id: number) => {
    const q = requirements.find(q => q.id === id);
    if (!q) return;

    const result = await MySwal.fire({
      title: "Edit Job Requirements",
      html: `
        <div class="flex flex-col gap-3 text-left">
          <label class="text-sm font-semibold">Requirements</label>
          <textarea id="edit-requirements" class="swal2-textarea" rows="4">${q.requirements}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      customClass: {
        popup: "rounded-lg",
      },
      preConfirm: () => {
        const requirements = (document.getElementById("edit-requirements") as HTMLTextAreaElement)?.value;

        if (!requirements) {
          Swal.showValidationMessage("Requirements cannot be empty!");
          return false;
        }

        return { requirements };
      }
    });

    if (!result.isConfirmed) return;

    const { requirements: newRequirements } = result.value;

    try {
      const res = await api.put(`/requirements/${id}`, {
        requirements: newRequirements
      });

      setRequirements(prev =>
        prev.map(x => x.id === id ? res.data.requirements : x)
      );

      toast.success("Job Requirements updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update requirements");
    }
  };

  const uniqueLevels = Array.from(new Set(requirements.map(q => q.level)));
  const uniqueRoles = Array.from(new Set(requirements.map(q => q.position)));
  const filteredRequirements = requirements.filter(q =>
    (roleFilter ? q.position === roleFilter : true) &&
    (levelFilter ? q.level === levelFilter : true)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-300 tracking-tight">Job Requirements</h2>
          <p className="text-dark-300/60 mt-1">Manage job requirements for different roles</p>
        </div>

        <div className="flex items-center gap-4 justify-end">
          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="px-3 py-1 border rounded w-40"
            >
              <option value="">All Levels</option>
              {uniqueLevels.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-1 border rounded w-48" 
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 
                        bg-[#94B4C1] text-dark-300 rounded-xl
                        hover:bg-[#547792] hover:text-white
                        transition-all shadow-sm hover:shadow-md"
          >
            <Upload size={20} />
            Add Requirement
          </button>
        )}
        </div>
      </div>

      
      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Requirements" : "Add New Requirement"}
          </h3>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Level</label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              >
                <option value="">Select Level</option>
                {levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Job Role</label>
              <select
                value={form.position_text}
                onChange={e => setForm({ ...form, position_text: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              >
                <option value="">Select Job Role</option>
                {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
          </div>

          {/* Requirements Text */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Requirements</label>
            <textarea
              value={form.requirement_text}
              onChange={(e) => setForm({ ...form, requirement_text: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 resize-y"
              rows={5}
              placeholder="Enter the job requirement here"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={uploading}
              className={`
                px-6 py-2 rounded-lg text-white font-semibold
                ${uploading
                  ? "bg-[#547792]/40 cursor-not-allowed"
                  : "bg-[#547792] hover:bg-[#466680] transition-all shadow-sm hover:shadow-md"
                }
              `}
            >
              {editingId ? "Update" : "Save"}
            </button>

            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm({ level: "", position_text: "", requirement_text: "" });
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-primary-500/80 to-primary-500/70 border-b border-primary-500/30 rounded-t-2xl">
                <tr>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Job Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                    Description
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                      <div className="flex justify-end w-full pr-7">
                        Actions
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequirements.length > 0 ? (
                  filteredRequirements.map((r) => (
                    <tr key={r.id} className="hover:bg-mint-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {r.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {r.position}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-300 max-w-md whitespace-pre-line leading-relaxed">
                        {(typeof r.requirements === "string" ? r.requirements : "")}
                      </td>

                      {/* <td className="px-6 py-4 text-sm text-gray-900 whitespace-pre-line leading-relaxed">
                        {r.requirements}
                      </td> */}

                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 text-right">
                          <button
                            className="px-2 py-1 mr-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            onClick={() => handleEdit(r.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => handleDelete(r.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center text-dark-300/60 py-8"
                    >
                      No requirements found
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

export default Requirements;

