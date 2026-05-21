export interface DashboardStats {
  totalClasses: number;
  totalAssignments: number;
  submittedCount: number;
  pendingAssignments: number;
}

export interface EnrolledClass {
  classId: string;
  className: string;
  teacherName: string;
  studentCount: number;
  assignmentCount: number;
  createdAt: string | null;
}

export interface RecentGrade {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  classId: string;
  className: string;
  score: number | null;
  comment: string | null;
  gradedAt: string | null;
}

export interface UpcomingAssignment {
  assignmentId: string;
  title: string;
  classId: string;
  className: string;
  deadline: string;
  typeAssignment: string | null;
  urgency: 'urgent' | 'upcoming';
}

export interface RecentActivity {
  submissionId: string;
  assignmentTitle: string;
  className: string;
  submittedAt: string | null;
  status: string | null;
  score: number | null;
  gradedAt: string | null;
}

export interface StudentDashboardData {
  stats: DashboardStats;
  classes: EnrolledClass[];
  recentGrades: RecentGrade[];
  upcomingAssignments: UpcomingAssignment[];
  recentActivities: RecentActivity[];
}
