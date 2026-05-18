import type { DashboardStats, ClassSummary, SubmissionToGrade, UpcomingAssignment, RecentActivity } from './types';

export const MOCK_STATS: DashboardStats = {
  totalClasses: 5,
  totalStudents: 142,
  pendingGrades: 18,
};

export const MOCK_CLASSES: ClassSummary[] = [
  { id: '1', name: 'Lập trình Web NC', joinCode: 'WEB2024', studentCount: 45, assignmentCount: 4, status: 'active' },
  { id: '2', name: 'Cơ sở dữ liệu', joinCode: 'DB101', studentCount: 38, assignmentCount: 6, status: 'active' },
  { id: '3', name: 'Kiến trúc phần mềm', joinCode: 'ARCH302', studentCount: 40, assignmentCount: 2, status: 'active' },
  { id: '4', name: 'UI/UX Design', joinCode: 'UX200', studentCount: 19, assignmentCount: 3, status: 'active' },
];

export const MOCK_SUBMISSIONS: SubmissionToGrade[] = [
  { id: '1', assignmentTitle: 'Báo cáo giữa kỳ', studentName: 'Nguyễn Văn A', className: 'Lập trình Web NC', submittedAt: '2 giờ trước' },
  { id: '2', assignmentTitle: 'Thiết kế ERD', studentName: 'Trần Thị B', className: 'Cơ sở dữ liệu', submittedAt: '4 giờ trước' },
  { id: '3', assignmentTitle: 'Báo cáo giữa kỳ', studentName: 'Lê Văn C', className: 'Lập trình Web NC', submittedAt: '5 giờ trước' },
];

export const MOCK_UPCOMING_ASSIGNMENTS: UpcomingAssignment[] = [
  { id: '1', title: 'Đồ án cuối kỳ', className: 'Kiến trúc phần mềm', dueDate: '20/05/2026', status: 'upcoming' },
  { id: '2', title: 'Bài tập CSS', className: 'Lập trình Web NC', dueDate: 'Hôm nay', status: 'urgent' },
  { id: '3', title: 'Prototype Figma', className: 'UI/UX Design', dueDate: 'Ngày mai', status: 'urgent' },
];

export const MOCK_ACTIVITIES: RecentActivity[] = [
  { id: '1', description: 'Nguyễn Văn A đã nộp bài "Báo cáo giữa kỳ"', time: '2 giờ trước', type: 'submission' },
  { id: '2', description: 'Bạn đã tạo bài tập mới trong "Cơ sở dữ liệu"', time: 'Hôm qua', type: 'system' },
  { id: '3', description: 'Trần Thị B đã bình luận trong lớp "Kiến trúc phần mềm"', time: 'Hôm qua', type: 'comment' },
];
