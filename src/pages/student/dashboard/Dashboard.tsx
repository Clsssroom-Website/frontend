import { useState, useEffect } from 'react';
import { DashboardStatsCards } from './components/DashboardStatsCards';
import { MyClassesTable } from './components/MyClassesTable';
import { RecentGrades } from './components/RecentGrades';
import { UpcomingAssignments } from './components/UpcomingAssignments';
import { RecentActivities } from './components/RecentActivities';
import { dashboardService } from '../../../services/dashboard.service';
import type { StudentDashboardData } from './components/types';
import { Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getStudentDashboard();
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || 'Lỗi tải dữ liệu');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi kết nối tới máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
        <span className="text-lg font-medium text-gray-700">Đang tải bảng điều khiển học tập...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-6 border border-red-200 shadow-sm max-w-lg mx-auto">
        <h3 className="text-lg font-semibold mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-sm">{error || 'Không thể tải dữ liệu dashboard.'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto text-gray-800 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng học tập</h1>
        <p className="text-gray-500 mt-1">Tổng quan hoạt động học tập và kết quả của bạn.</p>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards stats={data.stats} />

      {/* Middle Section: My Classes & Recent Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MyClassesTable classes={data.classes} />
        <RecentGrades grades={data.recentGrades} />
      </div>

      {/* Bottom Section: Upcoming Assignments & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingAssignments assignments={data.upcomingAssignments} />
        <RecentActivities activities={data.recentActivities} />
      </div>
    </div>
  );
}
