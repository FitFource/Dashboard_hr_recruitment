import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Users,UserCheck,UserX,Clock  } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {DashboardStats} from '../../types';


const HomeUser: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nextInterview, setNextInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchDashboardData();
    fetchNextInterview();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/metrics/user/overview');
      setStats({
        totalCandidates: response.data.total_candidates || 0,
        acceptedCandidates: response.data.accepted_candidates || 0,
        rejectedCandidates: response.data.rejected_candidates || 0,
        inProgressCandidates: response.data.in_progress_candidates || 0,
        topPositions: []
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextInterview = async () => {
    try {
      const response = await api.get('/metrics/user/next-interview');
      setNextInterview(response.data.next);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load next interview");
    }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!stats) {
    return null; // or loading skeleton
  }


  const total = stats.totalCandidates;

  const acceptedTrend = total
    ? ((stats.acceptedCandidates / total) * 100).toFixed(1)
    : "0";

  const rejectedTrend = total
    ? ((stats.rejectedCandidates / total) * 100).toFixed(1)
    : "0";

  const processedTrend = total
    ? ((stats.inProgressCandidates / total) * 100).toFixed(1)
    : "0";


  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
        <div className="flex items-center gap-4">
          {/* <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-900 rounded-2xl flex items-center justify-center shadow-lg">
            <Award className="w-10 h-10 text-background" />
          </div> */}
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Welcome, {user?.name}!</h1>
            <p className="text-primary-900/70 mt-1">Here's an overview of the home recruitment</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Candidates Card */}
        <div className="bg-gradient-to-br from-white to-accent/30 rounded-3xl shadow-lg border border-accent/50 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-primary-900/70 uppercase tracking-wide">
                Total Candidates
              </p>
              <h3 className="text-4xl font-bold text-primary-900 mt-2">
                {stats.totalCandidates || 0}
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
                {stats.acceptedCandidates || 0}
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
              <p className="text-x  s text-primary-900/70 uppercase tracking-wide">
                Rejected
              </p>
              <h3 className="text-4xl font-bold text-primary-900 mt-2">
                {stats.rejectedCandidates || 0}
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
                {stats.inProgressCandidates || 0}
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

      {/* Next Interview */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-accent/30">
      <h2 className="text-2xl font-bold text-primary-900 mb-6">
        Next Schedule Interview :
      </h2>

      {nextInterview && nextInterview.length > 0 ? (
        <div className="space-y-6">

          {nextInterview.map((item: { candidate_name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; interview_time: string | number | Date; position_name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; level: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; meeting_link: string | undefined; }, idx: React.Key | null | undefined) => (
            <div
              key={idx}
              className={
                `rounded-2xl p-6 border border-accent/30 shadow-sm bg-gray-100/60`
              }
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-semibold text-primary-900">
                  {item.candidate_name}
                </p>
                <span className="text-sm text-primary-900/60">
                  {new Date(item.interview_time).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 rounded-xl p-4 border border-accent/20">
                  <p className="text-primary-900/70 text-sm">Position</p>
                  <p className="font-medium">{item.position_name}</p>
                </div>

                <div className="bg-white/80 rounded-xl p-4 border border-accent/20">
                  <p className="text-primary-900/70 text-sm">Level</p>
                  <p className="font-medium">{item.level}</p>
                </div>

                <a
                  href={item.meeting_link}
                  target="_blank"
                  className="bg-white/80 rounded-xl p-4 border border-accent/20 hover:bg-primary-500/10 transition cursor-pointer"
                >
                  <p className="text-primary-900/70 text-sm">Meeting Link</p>
                  <p className="font-medium text-blue-600 underline">
                    Join Meeting
                  </p>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-primary-900/60">No upcoming interviews.</p>
      )}
      </div>


    </div>
  );
};

export default HomeUser;


