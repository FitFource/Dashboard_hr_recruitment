import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Calendar,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Candidate, CandidateHistory, CandidateDocument } from '../types';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

const CandidateDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [history, setHistory] = useState<CandidateHistory[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    score: '',
  });

  useEffect(() => {
    fetchCandidateDetails();
    
    // Auto-refresh every 30 seconds (silent refresh)
    const interval = setInterval(() => {
      fetchCandidateDetails(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [id]);

  const fetchCandidateDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/candidates/${id}`);
      setCandidate(response.data.candidate);
      setHistory(response.data.history);
      setDocuments(response.data.documents);
      if (!isEditing) {
        setEditForm({
          status: response.data.candidate.status,
          score: response.data.candidate.score?.toString() || '',
        });
      }
    } catch (error: any) {
      if (!silent) {
        toast.error('Failed to fetch candidate details');
        console.error('Error:', error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const updateData: any = { status: editForm.status };
      if (editForm.score) {
        updateData.score = parseInt(editForm.score);
      }

      await api.put(`/candidates/${id}`, updateData);
      toast.success('Candidate updated successfully');
      setIsEditing(false);
      fetchCandidateDetails();
    } catch (error: any) {
      toast.error('Failed to update candidate');
      console.error('Error:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      await api.delete(`/candidates/${id}`);
      toast.success('Candidate deleted successfully');
      navigate('/candidates');
    } catch (error: any) {
      toast.error('Failed to delete candidate');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Candidate not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/candidates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Candidates
        </button>
        {(user?.role === 'admin' || user?.role === 'recruiter') && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Edit size={20} />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={20} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h2>
            <p className="text-gray-600 mt-1">{candidate.job_role}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
            {candidate.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail size={20} className="text-gray-400" />
            <span>{candidate.email}</span>
          </div>
          {candidate.phone && (
            <div className="flex items-center gap-3 text-gray-700">
              <Phone size={20} className="text-gray-400" />
              <span>{candidate.phone}</span>
            </div>
          )}
          {candidate.location && (
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin size={20} className="text-gray-400" />
              <span>{candidate.location}</span>
            </div>
          )}
          {candidate.years_of_experience && (
            <div className="flex items-center gap-3 text-gray-700">
              <Briefcase size={20} className="text-gray-400" />
              <span>{candidate.years_of_experience} years experience</span>
            </div>
          )}
          {candidate.education && (
            <div className="flex items-center gap-3 text-gray-700">
              <GraduationCap size={20} className="text-gray-400" />
              <span>{candidate.education}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar size={20} className="text-gray-400" />
            <span>Applied: {format(new Date(candidate.applied_date), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {candidate.skills && candidate.skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}


        {isEditing && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status & Score</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.score}
                  onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="0-100"
                />
              </div>
            </div>
            <button
              onClick={handleUpdate}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action History</h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex gap-4 border-l-2 border-primary-500 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.action}</span>
                    {item.performed_by_name && (
                      <span className="text-sm text-gray-500">by {item.performed_by_name}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No history available</p>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.file_name}</p>
                    <p className="text-sm text-gray-500">{doc.document_type}</p>
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No documents uploaded</p>
        )}
      </div>
    </div>
  );
};

export default CandidateDetail;
