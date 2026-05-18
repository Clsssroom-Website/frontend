export interface Classroom {
  classId: string;
  teacherId: string;
  className: string;
  description: string;
  room: string;
  topic: string;
  joinCode: string;
  joinLink: string;
  status: string;
  createdAt: string;
  totalStudents?: number;
}
