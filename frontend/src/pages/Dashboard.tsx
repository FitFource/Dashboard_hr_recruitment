import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, AreaChart as AreaChartIcon} from 'lucide-react';
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
  Area,
  AreaChart,
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { MetricsOverview, TopCandidate, CandidatesByRole } from '../types';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


const COLORS = ['#88B494', '#B5D8BF', '#F4A896', '#ef4444'];

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  const [candidatesByRole, setCandidatesByRole] = useState<CandidatesByRole[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [sortedTrends, setSortedTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  // const [startDate, setStartDate] = useState('');
  // const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [levels, setLevels] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    fetchPositions();
    fetchLevels();
    setSortedTrends(
      trends.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }, [trends]);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds (silent refresh - no loading state)
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [roleFilter, startDate, endDate, levelFilter]);


  const formatDate = (date: Date | null) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
  
  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append('job_role', roleFilter);
      if (levelFilter) params.append('level', levelFilter);
      // if (startDate) params.append('start_date', startDate);
      // if (endDate) params.append('end_date', endDate);
      if (startDate) params.append('start_date', formatDate(startDate));
      if (endDate) params.append('end_date', formatDate(endDate));


      const [overviewRes, topCandidatesRes, byRoleRes, trendsRes] = await Promise.all([
        api.get(`/metrics/overview?${params.toString()}`, { headers: { 'Cache-Control': 'no-cache' } }),
        api.get(`/metrics/top-candidates?${params.toString()}`, { headers: { 'Cache-Control': 'no-cache' } }),
        api.get(`/metrics/top-by-role?${params.toString()}`, { headers: { 'Cache-Control': 'no-cache' } }),
        api.get(`/metrics/trends?${params.toString()}`, { headers: { 'Cache-Control': 'no-cache' } }),
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

  const fetchPositions = async () => {
    try {
      const res = await api.get('/candidates/positions');
      setPositions(res.data.positions || []);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const fetchLevels = async () => {
  try {
      const res = await api.get('/metrics/levels');
      setLevels(res.data.levels || []);
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-mint-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-mint-600 absolute top-0"></div>
        </div>
      </div>
    );
  }

  const pieData = overview
    ? [
        { name: 'Accepted', value: Number(overview.accepted_candidates) },
        { name: 'Rejected', value: Number(overview.rejected_candidates) },
        { name: 'In Progress', value: Number(overview.in_progress_candidates) },
      ]
    : [];


  const total = overview?.total_candidates ?? 0;
  const acceptedTrend = total
    ? (((overview?.accepted_candidates ?? 0) / total) * 100).toFixed(1)
    : "0";

  const rejectedTrend = total
    ? (((overview?.rejected_candidates ?? 0) / total) * 100).toFixed(1)
    : "0";

  const processedTrend = total
    ? (((overview?.in_progress_candidates ?? 0) / total) * 100).toFixed(1)
    : "0";

   return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        {/* Left: Title & subtitle */}
        <div>
          <h2 className="text-3xl font-bold text-primary-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-primary-900/60 mt-2">Track and analyze recruitment progress</p>
        </div>

        {/* Right: Filters */}
        <div className="flex gap-3 mt-4 lg:mt-0">
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="px-4 py-2.5 border border-accent/60 rounded-2xl w-40 text-primary-900 bg-white hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 transition-all shadow-sm hover:shadow-md"
          >
            <option value="">All Levels</option>
            {levels.map(lv => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-accent/60 rounded-2xl w-40 text-primary-900 bg-white hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 transition-all shadow-sm hover:shadow-md"
          >
            <option value="">All Roles</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {/* <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            placeholder="Start"
            className="px-4 py-2.5 border border-accent/60 rounded-2xl text-primary-900 bg-white hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 transition-all shadow-sm hover:shadow-md"
          />

          <input
            type="date"
            name="end_date" 
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-4 py-2.5 border border-accent/60 rounded-2xl text-primary-900 bg-white hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 transition-all shadow-sm hover:shadow-md"
          /> */}

          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable
            placeholderText="📅 Select Apply Date"
            className="w-full px-4 py-3 border border-accent/60 rounded-2xl"
            dateFormat="yyyy-MM-dd"
            popperClassName="z-[99999]"
          />

        </div>
      </div>

    

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Candidates Card */}
        <div className="bg-gradient-to-br from-white to-accent/30 rounded-3xl shadow-lg border border-accent/50 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-primary-900/70 uppercase tracking-wide">
                Total Candidates
              </p>
              <h3 className="text-4xl font-bold text-primary-900 mt-2">
                {overview?.total_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-primary-900 bg-accent/30 px-3 py-1.5 rounded-full shadow-sm">
                  ↑ 100%
                </span>
                <span className="text-xs text-primary-900/50 ml-2">total candidate</span>
              </div>
              <p className="text-xs text-primary-900/40 mt-2">All candidates in system</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-900 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Users className="w-8 h-8 text-background" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Accepted Card */}
        <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl shadow-lg border border-emerald-200/40 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-primary-900/70 uppercase tracking-wide">
                Accepted
              </p>
              <h3 className="text-4xl font-bold text-primary-900 mt-2">
                {overview?.accepted_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full shadow-sm">
                  ↑ {acceptedTrend}%
                </span>
                <span className="text-xs text-primary-900/50 ml-2">vs total</span>
              </div>
              <p className="text-xs text-primary-900/40 mt-2">Successfully hired</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-400/30">
              <UserCheck className="w-8 h-8 text-primary-900" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-lg border border-red-200/40 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-primary-900/70 uppercase tracking-wide">
                Rejected
              </p>
              <h3 className="text-4xl font-bold text-primary-900 mt-2">
                {overview?.rejected_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-red-700 bg-red-100 px-3 py-1.5 rounded-full shadow-sm">
                  ↑ {rejectedTrend}%
                </span>
                <span className="text-xs text-primary-900/50 ml-2">vs total</span>
              </div>
              <p className="text-xs text-primary-900/40 mt-2">Not suitable for role</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-lg shadow-red-400/30">
              <UserX className="w-8 h-8 text-primary-900" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* In-Progress Card */}
        <div className="bg-gradient-to-br from-white to-yellow-100 rounded-3xl shadow-lg border border-yellow-200/40 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-primary-900/70 uppercase tracking-wide">
                In-Progress
              </p>
              <h3 className="text-4xl font-bold text-primary-900 mt-2">
                {overview?.in_progress_candidates || 0}
              </h3>
              <div className="flex items-center mt-3">
                <span className="text-sm text-yellow-700 bg-yellow-100 px-3 py-1.5 rounded-full shadow-sm">
                  ↑ {processedTrend}%
                </span>
                <span className="text-xs text-primary-900/50 ml-2">vs total</span>
              </div>
              <p className="text-xs text-primary-900/40 mt-2">Under review</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-400/30">
              <Clock className="w-8 h-8 text-primary-900" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Candidates by Role */}
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-primary-900 tracking-tight">
                Candidates by Job Role
              </h3>
              <p className="text-sm text-primary-900/60 mt-1">Distribution across positions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={510}>
            <BarChart data={candidatesByRole} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4ebdc" />
              <XAxis 
                dataKey="job_role" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11, fill: '#213448', fontWeight: 600 }}
                stroke="#94B4C1"
              />
              <YAxis tick={{ fontSize: 11, fill: '#213448', fontWeight: 600 }} stroke="#94B4C1" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #94B4C1',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(148, 180, 193, 0.25)',
                  fontWeight: 600
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
                iconType="circle"
              />
              <Bar dataKey="accepted" fill="#10b981" name="Accepted" radius={[10,10,0,0]} />
              <Bar dataKey="in_progress" fill="#FACC15" name="In Progress" radius={[10,10,0,0]} />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[10,10,0,0]} />

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Status Distribution */}
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-primary-900 tracking-tight">
                Status Distribution
              </h3>
              <p className="text-sm text-primary-900/60 mt-1">Current candidate breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => {
                let fillColor = '';
                if (entry.name === 'Accepted') fillColor = '#10b981';
                else if (entry.name === 'Rejected') fillColor = '#ef4444';
                else if (entry.name === 'In Progress') fillColor = '#FACC15';
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #94B4C1',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(148,180,193,0.25)',
                fontWeight: 600
              }}
            />
          </PieChart>
        </ResponsiveContainer>

          
          {/* Legend with counts */}
          <div className="flex justify-center items-center gap-6 mt-20">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#10b981] shadow-sm"></div>
            <div className="text-xs text-primary-900 font-medium">Accepted</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#ef4444] shadow-sm"></div>
            <div className="text-xs text-primary-900 font-medium">Rejected</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FACC15] shadow-sm"></div>
            <div className="text-xs text-primary-900 font-medium">In Progress</div>
          </div>
        </div>
        </div>
      </div>

      {/* Application Trends */}
      {trends.length > 0 && (
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-primary-900 tracking-tight">
                Application Trends
              </h3>
              <p className="text-sm text-primary-900/60 mt-1">Last 7 days activity</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sortedTrends} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
              
              {/* ---- GRADIENT DEFS ---- */}
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#88B494" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#88B494" stopOpacity={0}/>
                </linearGradient>

                <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>

                <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>

                <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FACC15" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                </linearGradient>

              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#d4ebdc" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#213448', fontWeight: 600 }}
                stroke="#94B4C1"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />

              <YAxis tick={{ fontSize: 12, fill: '#213448', fontWeight: 600 }} stroke="#94B4C1" />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #94B4C1",
                  borderRadius: "16px",
                  boxShadow: "0 10px 25px -5px rgba(148, 180, 193, 0.25)",
                  fontWeight: 600
                }}
              />

              <Legend
                iconType="circle"
                wrapperStyle={{ 
                  fontSize: "12px",
                  fontWeight: 700
                }}
              />      

              {/* ===== TOTAL APPLICATIONS ===== */}
              <Area
                type="monotone"
                dataKey="total_applications"
                stroke="#88B494"
                strokeWidth={3}
                fill="url(#colorTotal)"
                name="Total Applications"
                dot={{ fill: "#88B494", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7 }}
              />

              {/* ===== ACCEPTED ===== */}
              <Area
                type="monotone"
                dataKey="accepted"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorAccepted)"
                name="Accepted"
                dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7 }}
              />

              {/* ===== REJECTED ===== */}
              <Area
                type="monotone"
                dataKey="rejected"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#colorRejected)"
                name="Rejected"
                dot={{ fill: "#ef4444", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7 }}
              />

              {/* ===== IN PROGRESS ===== */}
              <Area
                type="monotone"
                dataKey="in_progress"
                stroke="#FACC15"
                strokeWidth={3}
                fill="url(#colorInProgress)"
                name="In Progress"
                dot={{ fill: "#FACC15", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7 }}
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}


      {/* Top Candidates Today */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-primary-900 tracking-tight">
                Most Processed Candidates Today
              </h3>
              <p className="text-sm text-primary-900/60 mt-1">Top 10 candidates with most activity</p>
            </div>
          </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-accent/30">
            <thead className="bg-gradient-to-r from-primary-500/80 to-primary-500/70 border-b border-primary-500/30">
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
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs text-background uppercase tracking-wide">
                  SoftSkill Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-accent/20">
              {topCandidates.length > 0 ? (
                topCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-background/50 transition-colors">                      
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                      {candidate.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                      {candidate.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                      {candidate.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900/70">
                      {candidate.job_role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 inline-flex text-xs leading-5 rounded-full shadow-sm ${
                          candidate.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
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
                        <div
                          className="flex-1 h-2.5 rounded-full mr-2 max-w-[60px] shadow-inner"
                          style={{ backgroundColor: 'rgba(148, 180, 193, 0.3)' }}
                        >
                          <div
                            className="h-2.5 rounded-full shadow-sm"
                            style={{
                              // Convert score 1-5 to percentage (1 = 20%, 5 = 100%)
                              width: `${(candidate.score || 0) * 20}%`,
                              backgroundColor: '#547792',
                            }}
                          />
                        </div>
                        <span className="text-sm text-primary-900">
                          {candidate.score || 'N/A'}
                        </span>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="w-16 h-16 text-accent mb-3" />
                      <p className="text-sm text-primary-900/60">No candidates processed today</p>
                      <p className="text-xs text-primary-900/40 mt-1">Check back later for updates</p>
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
