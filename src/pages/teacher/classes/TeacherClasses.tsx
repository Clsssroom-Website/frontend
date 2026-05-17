import { useState } from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { ClassesLayout } from "../../../layout/ClassesLayout";
import { ClassroomCard } from "../../../components/classes/ClassroomCard";
import { ClassroomActionButton } from "../../../components/classes/ClassroomActionButton";
import { CreateClassModal } from "../../../components/classes/CreateClassModal";
import { useClassroomsData } from "../../../hooks/useClassroomsData";
import { useClassroomFilters } from "../../../hooks/useClassroomFilters";
import toast from "react-hot-toast";

export default function TeacherClasses() {
  const { classes, loading, fetchClasses, deleteClass } = useClassroomsData();
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredClasses } = useClassroomFilters(classes);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <ClassesLayout
      title="Classrooms"
      description="Manage and monitor all classroom facilities"
      actionButton={
        <ClassroomActionButton role="teacher" onClick={() => setCreateModalOpen(true)} />
      }
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onFilterChange={setStatusFilter}
      loading={loading}
      isEmpty={filteredClasses.length === 0}
      modals={
        <CreateClassModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchClasses();
          }}
        />
      }
    >
      {filteredClasses.map((cls) => (
        <ClassroomCard
          key={cls.classId}
          cls={cls}
          linkTo={`/teacher/classes/${cls.classId}`}
          actions={
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(cls.joinCode);
                  toast.success("Mã mời đã được copy!");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 text-sm transition-colors"
              >
                <LinkIcon size={16} />
                Copy link
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteClass(cls.classId);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-red-50 text-red-600 text-sm transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          }
        />
      ))}
    </ClassesLayout>
  );
}
