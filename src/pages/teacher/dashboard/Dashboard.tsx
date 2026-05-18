import {
  MOCK_STATS,
  MOCK_CLASSES,
  MOCK_SUBMISSIONS,
  MOCK_UPCOMING_ASSIGNMENTS,
  MOCK_ACTIVITIES
} from './components/mockData';
import { DashboardStatsCards } from './components/DashboardStatsCards';
import { MyClassesTable } from './components/MyClassesTable';
import { SubmissionsToGrade } from './components/SubmissionsToGrade';
import { UpcomingAssignments } from './components/UpcomingAssignments';
import { RecentActivities } from './components/RecentActivities';

export default function TeacherDashboard() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto text-gray-800">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng DashBoard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hoạt động giảng dạy của bạn.</p>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards stats={MOCK_STATS} />

      {/* Middle Section: My Classes & Submissions to Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MyClassesTable classes={MOCK_CLASSES} />
        <SubmissionsToGrade submissions={MOCK_SUBMISSIONS} />
      </div>

      {/* Bottom Section: Upcoming Assignments & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingAssignments assignments={MOCK_UPCOMING_ASSIGNMENTS} />
        <RecentActivities activities={MOCK_ACTIVITIES} />
      </div>
    </div>
  );
}
