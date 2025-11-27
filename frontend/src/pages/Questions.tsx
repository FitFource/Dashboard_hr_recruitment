import React, { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, FileText } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { InterviewQuestion } from '../types';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);


const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
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
    question_text: "",
  });



  useEffect(() => {
    fetchQuestions();
    fetchPositions();
    
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
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get('/questions/positions');

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
    const { level, position_text, question_text } = form;
    if (!level || !position_text || !question_text) {
      toast.error("All fields are required");
      return;
    }

    setUploading(true);
    setLoading(true);

    try {
    
      if (editingId) {
        // Update
        const res = await api.put(`/questions/${editingId}`, {
          level,
          position: position_text,
          question: question_text
        });
        setQuestions(prev =>
          prev.map(q => q.id === editingId ? res.data.question : q)
        );
        toast.success("Question updated");
      } else {
        // Add new
        const res = await api.post(`/questions`, {
          level,
          position: position_text,
          question: question_text
        });
        setQuestions(prev => {
          const exist = prev.find(q => q.id === res.data.question.id);
          if (exist) {
            return prev.map(q => q.id === res.data.question.id ? res.data.question : q);
          }
          return [...prev, res.data.question];
        });

        setShowForm(false);
        setEditingId(null);
        setForm({ level: "", position_text: "", question_text: "" });
        toast.success("Question added");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save question");
    }finally {
      setUploading(false);
      setLoading(false);
      await fetchQuestions();
    }
  };


  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: `Are you sure?`,
      text: `Do you really want to DELETE this question?`,
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
      await api.delete(`/questions/${id}`);
      toast.success("Question deleted successfully");
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error: any) {
      toast.error("Failed to delete question");
      console.error("Error:", error);
    }
  };


  const handleEdit = async (id: number) => {
    const q = questions.find(q => q.id === id);
    if (!q) return;

    const result = await MySwal.fire({
      title: "Edit Question",
      html: `
        <div class="flex flex-col gap-3 text-left">
          <label class="text-sm font-semibold">Question</label>
          <textarea id="edit-question" class="swal2-textarea" rows="4">${q.question}</textarea>
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
        const question = (document.getElementById("edit-question") as HTMLTextAreaElement).value;

        if (!question) {
          Swal.showValidationMessage("All fields are required!");
          return false;
        }

        return { question };
      }
    });

    if (!result.isConfirmed) return;

    const { question } = result.value;

    try {
      const res = await api.put(`/questions/${id}`, {question});
      setQuestions(prev =>
        prev.map(x => x.id === id ? res.data.question : x)
      );

      toast.success("Question updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update question");
    }
  };


  const uniqueRoles = Array.from(new Set(questions.map(q => q.position)));
  const filteredQuestions = questions.filter(q =>
    (roleFilter ? q.position === roleFilter : true) &&
    (levelFilter ? q.level === levelFilter : true)
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-300 tracking-tight">Quick Call Questions</h2>
          <p className="text-dark-300/60 mt-1">Manage interview questions for different roles</p>
        </div>

      
        <div className="flex items-center gap-4 justify-end">
          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="px-3 py-1 border rounded w-40"
            >
              <option value="">All Levels</option>
              {levels.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-1 border rounded w-48" // w-48 = panjang dropdown
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
              Add Question
            </button>
          )}
        </div>
      </div>


      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Question" : "Add New Question"}
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


          {/* Question Text */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Question</label>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 resize-y"
              rows={5}
              placeholder="Enter the question here"
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
                setForm({ level: "", position_text: "", question_text: "" });
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
                    Question
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
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-[#ECEFCA] transition-all">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {question.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {question.position}
                      </td>
                      {/* <td className="px-6 py-4 text-sm text-gray-900 max-w-md whitespace-pre-line leading-relaxed">
                        {((typeof question.question === "string" ? question.question : "").includes("?")
                          ? question.question.split(/(?<=\?)/)     
                          : question.question.split(/(?<=,)/)    
                        )
                          .map((part) => part.trim())
                          .filter((part) => part.length > 0)
                          .join("\n")}
                      </td> */}
                      <td className="px-6 py-4 text-sm text-dark-300 max-w-md whitespace-pre-line leading-relaxed">
                        {(typeof question.question === "string" ? question.question : "")}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 text-right">
                          <button
                            className="px-2 py-1 mr-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            onClick={() => handleEdit(question.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => handleDelete(question.id)}
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
                      colSpan={user?.role === 'admin' ? 3 : 2}
                      className="px-6 py-8 text-center text-sm text-dark-300/60"
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

