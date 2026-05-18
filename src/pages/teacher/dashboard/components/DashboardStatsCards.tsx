import { BookOpen, ClipboardList, Users } from 'lucide-react';
import type { DashboardStats } from './types';

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng lớp học</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
        </div>
        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng học sinh</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
        </div>
        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Chờ chấm điểm</p>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingGrades}</p>
        </div>
        <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
          <ClipboardList className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
