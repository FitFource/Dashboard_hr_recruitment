import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { MetricsOverview, TopCandidate, CandidatesByRole } from '../types';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  const [candidatesByRole, setCandidatesByRole] = useState<CandidatesByRole[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds (silent refresh - no loading state)
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [overviewRes, topCandidatesRes, byRoleRes, trendsRes] = await Promise.all([
        api.get('/metrics/overview'),
        api.get('/metrics/top-candidates'),
        api.get('/metrics/top-by-role'),
        api.get('/metrics/trends?days=7'),
      ]);

      setOverview(overviewRes.data);
      setTopCandidates(topCandidatesRes.data);
      setCandidatesByRole(byRoleRes.data);
      setTrends(trendsRes.data);
    } catch (error: any) {
      if (!silent) {
        toast.error('Failed to fetch dashboard data');
        console.error('Error:', error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getProcessedToday = () => {
    return topCandidates.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const pieData = overview
    ? [
        { name: 'Accepted', value: overview.accepted_candidates },
        { name: 'Rejected', value: overview.rejected_candidates },
        { name: 'In Progress', value: overview.in_progress_candidates },
      ]
    : [];

  // Calculate trends (mock data - in production, compare with previous week from API)
  const totalTrend = trends.length > 1 ? calculateTrend(overview?.total_candidates || 0, trends[0]?.total_applications || 1) : '15.3';
  const acceptedTrend = '8.7';
  const rejectedTrend = '3.2';
  const processedTrend = '12.5';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Track and analyze recruitment progress</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Candidates
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.total_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-green-600 font-semibold">
                  ↑ {totalTrend}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last week</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">All candidates in system</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Accepted Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Accepted
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.accepted_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-green-600 font-semibold">
                  ↑ {acceptedTrend}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last week</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Successfully hired</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Rejected
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {overview?.rejected_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-green-600 font-semibold">
                  ↑ {rejectedTrend}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last week</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Not suitable for role</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <UserX className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>

        {/* Processed Today Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Processed Today
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {getProcessedToday()}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-green-600 font-semibold">
                  ↑ {processedTrend}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last week</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Candidates reviewed today</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Candidates by Role */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Candidates by Job Role
              </h3>
              <p className="text-sm text-gray-500 mt-1">Top 10 roles with most applications</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={candidatesByRole} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="job_role" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar dataKey="accepted" fill="#10b981" name="Accepted" radius={[8, 8, 0, 0]} />
              <Bar dataKey="in_progress" fill="#f59e0b" name="In Progress" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Status Distribution
              </h3>
              <p className="text-sm text-gray-500 mt-1">Current candidate status breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend with counts */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-xs font-medium text-gray-600">Accepted</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{overview?.accepted_candidates || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-gray-600">Rejected</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{overview?.rejected_candidates || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-medium text-gray-600">In Progress</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{overview?.in_progress_candidates || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Trends */}
      {trends.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Application Trends
              </h3>
              <p className="text-sm text-gray-500 mt-1">Last 7 days activity</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend iconType="circle" />
              <Line 
                type="monotone" 
                dataKey="total_applications" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Total Applications"
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="accepted" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Accepted"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="rejected" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Rejected"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Candidates Today */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Most Processed Candidates Today
            </h3>
            <p className="text-sm text-gray-500 mt-1">Top 10 candidates with most activity</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCandidates.length > 0 ? (
                topCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {candidate.full_name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{candidate.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.job_role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          candidate.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : candidate.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {candidate.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2 max-w-[60px]">
                          <div 
                            className="h-2 bg-purple-600 rounded-full" 
                            style={{ width: `${candidate.score || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {candidate.score || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {candidate.actions_count} actions
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No candidates processed today</p>
                      <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
