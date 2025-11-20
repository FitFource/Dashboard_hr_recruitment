import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, FileText } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { InterviewQuestion } from '../types';
import { useAuthStore } from '../store/authStore';

const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchQuestions();
    
    // Auto-refresh every 30 seconds (silent refresh)
    const interval = setInterval(() => {
      fetchQuestions(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchQuestions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/questions');
      setQuestions(response.data.questions);
    } catch (error: any) {
      if (!silent) {
        toast.error('Failed to fetch questions');
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
      const response = await api.post('/questions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message);
      setShowUpload(false);
      setUploadFile(null);
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload questions');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to delete question');
      console.error('Error:', error);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interview Questions</h2>
          <p className="text-gray-600 mt-1">Manage interview questions for different roles</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Upload size={20} />
            Upload Questions
          </button>
        )}
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Questions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV, Excel, or JSON file with interview questions. Required fields: job_role, question
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
{`job_role,question,category,difficulty,expected_answer
Software Engineer,What is closure in JavaScript?,Technical,medium,A closure is...
Product Manager,How do you prioritize features?,Strategy,medium,I use...`}
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

      {/* Questions List */}
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
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {question.job_role}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        {question.question}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {question.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty || 'N/A'}
                        </span>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDelete(question.id)}
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
                      colSpan={user?.role === 'admin' ? 5 : 4}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No questions found
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

export default Questions;
