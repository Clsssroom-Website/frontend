export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  pendingGrades: number;
}

export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  studentCount: number;
  assignmentCount: number;
  status: 'active' | 'archived';
}

export interface SubmissionToGrade {
  id: string;
  assignmentTitle: string;
  studentName: string;
  className: string;
  submittedAt: string;
}

export interface UpcomingAssignment {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  status: 'upcoming' | 'urgent';
}

export interface RecentActivity {
  id: string;
  description: string;
  time: string;
  type: 'submission' | 'comment' | 'system';
}
