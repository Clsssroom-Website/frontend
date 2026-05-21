import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { classroomService } from "../../../services/classroomService";
import { Menu, FileText, Edit3 } from "lucide-react";

import ClassDetailLayout from "../../../components/classes/ClassDetailLayout";
import StreamTab from "../../../components/classes/StreamTab";
import StudentAssignmentsTab from "./tabs/AssignmentsTab";
import StudentGradesTab from "./tabs/GradesTab";
import StudentDocumentsTab from "@/pages/teacher/classes/tabs/DocumentsTab";

import type { Classroom } from "../../../types/classroom";

const STUDENT_TABS = [
  { id: "stream", label: "Bảng tin", icon: <Menu size={18} /> },
  { id: "classwork", label: "Bài tập", icon: <FileText size={18} /> },
  { id: "documents", label: "Tài liệu", icon: <Edit3 size={18} /> },
  { id: "grades", label: "Điểm số", icon: <Edit3 size={18} /> },
];

export default function StudentClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  
  // Set initial active tab based on router state if present
  const [activeTab, setActiveTab] = useState(() => {
    return (location.state as any)?.activeTab || "stream";
  });

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const data: any = await classroomService.getClassDetail(classId!);
        if (data.success) setClassroom(data.data);
      } catch (error) {
        console.error("Failed to fetch classroom:", error);
      }
    };
    if (classId) fetchClassroom();
  }, [classId]);

  // Handle location state updates
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
      // Clear the state so it doesn't trigger again on manual navigation or refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  if (!classroom) return <div className="p-8 text-center text-gray-500">Đang tải lớp học...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case "stream": return <StreamTab classId={classId!} role="student" />;
      case "classwork": 
        return (
          <StudentAssignmentsTab 
            classId={classId!} 
            initialAssignmentId={(location.state as any)?.assignmentId}
          />
        );
      case "documents": return <StudentDocumentsTab classId={classId!} role="student" />;
      case "grades": return <StudentGradesTab classId={classId!} />;
      default: return null;
    }
  };

  return (
    <ClassDetailLayout
      classroom={classroom}
      role="student"
      tabs={STUDENT_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </ClassDetailLayout>
  );
}
