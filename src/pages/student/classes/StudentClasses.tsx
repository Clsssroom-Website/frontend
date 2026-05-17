import { useState } from "react";
import { ClassesLayout } from "../../../layout/ClassesLayout";
import { ClassroomCard } from "../../../components/classes/ClassroomCard";
import { ClassroomActionButton } from "../../../components/classes/ClassroomActionButton";
import { JoinClassModal } from "../../../components/classes/JoinClassModal";
import { useClassroomsData } from "../../../hooks/useClassroomsData";
import { useClassroomFilters } from "../../../hooks/useClassroomFilters";

export default function StudentClasses() {
  const { classes, loading, fetchClasses } = useClassroomsData();
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredClasses } = useClassroomFilters(classes);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);

  return (
    <ClassesLayout
      title="My Classrooms"
      description="View and access your enrolled classes"
      actionButton={
        <ClassroomActionButton role="student" onClick={() => setJoinModalOpen(true)} />
      }
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onFilterChange={setStatusFilter}
      loading={loading}
      isEmpty={filteredClasses.length === 0}
      modals={
        <JoinClassModal
          isOpen={isJoinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onSuccess={() => {
            setJoinModalOpen(false);
            fetchClasses();
          }}
        />
      }
    >
      {filteredClasses.map((cls) => (
        <ClassroomCard
          key={cls.classId}
          cls={cls}
          linkTo={`/student/classes/${cls.classId}`}
        />
      ))}
    </ClassesLayout>
  );
}
