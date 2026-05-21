import { BookOpen, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DashboardStats } from './types';

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Lớp đã tham gia</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
        </div>
        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng số bài tập</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAssignments}</p>
        </div>
        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
          <ClipboardList className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Đã nộp</p>
          <p className="text-3xl font-bold text-green-600">{stats.submittedCount}</p>
        </div>
        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Chưa nộp</p>
          <p className="text-3xl font-bold text-red-600">{stats.pendingAssignments}</p>
        </div>
        <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
