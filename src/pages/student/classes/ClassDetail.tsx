import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../../services/api/axiosClient";
import { Menu, FileText, Edit3 } from "lucide-react";

import ClassDetailLayout from "../../../components/classes/ClassDetailLayout";
import StreamTab from "../../../components/classes/StreamTab";
import StudentAssignmentsTab from "./tabs/AssignmentsTab";
import StudentGradesTab from "./tabs/GradesTab";

import type { Classroom } from "../../../types/classroom";

const STUDENT_TABS = [
  { id: "stream", label: "Bảng tin", icon: <Menu size={18} /> },
  { id: "classwork", label: "Bài tập", icon: <FileText size={18} /> },
  { id: "grades", label: "Điểm số", icon: <Edit3 size={18} /> },
];

export default function StudentClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState("stream");

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const data: any = await axiosClient.get(`/api/v1/classes/${classId}`);
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
      case "stream": return <StreamTab classId={classId!} role="student" />;
      case "classwork": return <StudentAssignmentsTab classId={classId!} />;
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
