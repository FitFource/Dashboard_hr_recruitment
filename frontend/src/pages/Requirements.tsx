import React, { useEffect, useState } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { JobRequirement } from '../types';
import { useAuthStore } from '../store/authStore';

const Requirements: React.FC = () => {
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchRequirements();
    
    // Auto-refresh every 30 seconds (silent refresh)
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

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await api.post('/requirements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message);
      setShowUpload(false);
      setUploadFile(null);
      fetchRequirements();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload requirements');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return;

    try {
      await api.delete(`/requirements/${id}`);
      toast.success('Requirement deleted successfully');
      fetchRequirements();
    } catch (error: any) {
      toast.error('Failed to delete requirement');
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Requirements</h2>
          <p className="text-gray-600 mt-1">Manage job requirements for different roles</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Upload size={20} />
            Upload Requirements
          </button>
        )}
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Requirements</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV, Excel, or JSON file with job requirements. Required fields: job_role, requirement_type, description
          </p>
          
          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="mx-auto text-gray-400 mb-2" size={48} />
              <label className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Choose a file
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-1">CSV, Excel, or JSON (max 10MB)</p>
              {uploadFile && (
                <p className="text-sm text-gray-900 mt-2">Selected: {uploadFile.name}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">File Format Example (CSV):</h4>
            <pre className="text-xs text-blue-800 overflow-x-auto">
{`job_role,requirement_type,description,is_mandatory,minimum_years_experience,required_skills
Software Engineer,Technical Skills,Proficient in JavaScript and React,true,3,"JavaScript,React,Node.js"
Product Manager,Experience,Product management experience,true,5,`}
            </pre>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Upload
            </button>
            <button
              onClick={() => {
                setShowUpload(false);
                setUploadFile(null);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandatory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min. Experience
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requirements.length > 0 ? (
                  requirements.map((requirement) => (
                    <tr key={requirement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {requirement.job_role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {requirement.requirement_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        {requirement.description}
                        {requirement.required_skills && requirement.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {requirement.required_skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            requirement.is_mandatory
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {requirement.is_mandatory ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {requirement.minimum_years_experience
                          ? `${requirement.minimum_years_experience} years`
                          : 'N/A'}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDelete(requirement.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={user?.role === 'admin' ? 6 : 5}
                      className="px-6 py-8 text-center text-sm text-gray-500"
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
