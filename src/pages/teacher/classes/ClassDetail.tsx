import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { classroomService } from "../../../services/classroomService";
import { Menu, Users, FileText, Edit3, TrendingUp } from "lucide-react";

import ClassDetailLayout from "../../../components/classes/ClassDetailLayout";
import StreamTab from "../../../components/classes/StreamTab";
import TeacherPeopleTab from "./tabs/PeopleTab";
import TeacherAssignmentsTab from "./tabs/AssignmentsTab";
import TeacherDocumentsTab from "./tabs/DocumentsTab";
import TeacherGradesTab from "./tabs/GradesTab";

import type { Classroom } from "../../../types/classroom";

const TEACHER_TABS = [
  { id: "stream", label: "Bảng tin", icon: <Menu size={18} /> },
  { id: "people", label: "Danh sách sinh viên", icon: <Users size={18} /> },
  { id: "classwork", label: "Bài tập", icon: <FileText size={18} /> },
  { id: "documents", label: "Tài liệu", icon: <Edit3 size={18} /> },
  { id: "grades", label: "Bảng điểm", icon: <TrendingUp size={18} /> },
];

export default function TeacherClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState("stream");

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

  if (!classroom) return <div className="p-8 text-center text-gray-500">Đang tải lớp học...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case "stream": return <StreamTab classId={classId!} role="teacher" />;
      case "people": return <TeacherPeopleTab classId={classId!} />;
      case "classwork": return <TeacherAssignmentsTab classId={classId!} />;
      case "documents": return <TeacherDocumentsTab classId={classId!} />;
      case "grades": return <TeacherGradesTab classId={classId!} />;
      default: return null;
    }
  };

  return (
    <ClassDetailLayout
      classroom={classroom}
      role="teacher"
      tabs={TEACHER_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </ClassDetailLayout>
  );
}
