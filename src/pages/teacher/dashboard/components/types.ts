export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  pendingGrades: number;
}

export interface ClassSummary {
  classId: string;
  className: string;
  joinCode: string | null;
  status: string | null;
  studentCount: number;
  assignmentCount: number;
  createdAt: string | null;
}

export interface SubmissionToGrade {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: string | null;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string | null;
}

export interface UpcomingAssignment {
  assignmentId: string;
  title: string;
  classId: string;
  className: string;
  deadline: string;
  typeAssignment: string | null;
  totalSubmissions: number;
  urgency: 'upcoming' | 'urgent';
}

export interface RecentActivity {
  submissionId: string;
  studentName: string;
  assignmentTitle: string;
  className: string;
  submittedAt: string | null;
}

export interface TeacherDashboardData {
  stats: DashboardStats;
  classes: ClassSummary[];
  pendingSubmissions: SubmissionToGrade[];
  upcomingAssignments: UpcomingAssignment[];
  recentActivities: RecentActivity[];
}
