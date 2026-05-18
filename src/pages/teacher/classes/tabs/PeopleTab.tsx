import { useEffect, useState } from "react";
import { classroomService } from "../../../../services/classroomService";
import { Users, Mail, Calendar, AlertCircle } from "lucide-react";

interface Student {
  enrollmentId: string;
  joinTime: string;
  status: string;
  student: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
}

interface PeopleTabProps {
  classId: string;
}


export default function TeacherPeopleTab({ classId }: PeopleTabProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data: any = await classroomService.getStudents(classId);
        if (data && data.success) {
          setStudents(data.data);
        } else {
          setError(data?.message || "Không thể tải danh sách học sinh.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [classId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải danh sách...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
      <AlertCircle size={32} />
      <p>{error}</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium">
        <Users size={20} />
        <span>Danh sách học sinh ({students.length} người)</span>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Users size={48} className="text-gray-300" />
          <p className="text-lg font-medium">Chưa có học sinh nào</p>
          <p className="text-sm">Chia sẻ mã lớp để học sinh tham gia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((enrollment) => (
            <div key={enrollment.enrollmentId} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
                {enrollment.student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{enrollment.student.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Mail size={12} />
                  <span className="truncate">{enrollment.student.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <Calendar size={12} />
                <span>Tham gia {new Date(enrollment.joinTime).toLocaleDateString("vi-VN")}</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${enrollment.status === "JOINED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {enrollment.status === "JOINED" ? "Đang học" : enrollment.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
