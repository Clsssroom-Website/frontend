import { useState, useEffect } from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { ClassesLayout } from "../../../layout/ClassesLayout";
import { ClassroomCard } from "../../../components/classes/ClassroomCard";
import { ClassroomActionButton } from "../../../components/classes/ClassroomActionButton";
import { CreateClassModal } from "../../../components/classes/CreateClassModal";
import { useClassroomsData } from "../../../hooks/useClassroomsData";
import { useClassroomFilters } from "../../../hooks/useClassroomFilters";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";

export default function TeacherClasses() {
  const { classes, loading, fetchClasses, deleteClass } = useClassroomsData();
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredClasses } = useClassroomFilters(classes);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // States for delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteExecute = async () => {
    if (!classToDelete) return;
    setConfirmOpen(false);
    try {
      const res = await deleteClass(classToDelete.id);
      if (res && res.success) {
        toast.success("Xóa lớp học thành công!");
      } else {
        toast.error(res?.message || "Không thể xóa lớp học.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Lỗi kết nối.");
    } finally {
      setClassToDelete(null);
    }
  };

  // Gọi API mỗi khi searchQuery thay đổi (Sử dụng debounce đơn giản)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(searchQuery);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, fetchClasses]);

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
        <>
          <CreateClassModal
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              setCreateModalOpen(false);
              fetchClasses();
            }}
          />
          <ConfirmModal
            isOpen={confirmOpen}
            title="Xóa lớp học"
            message={`Bạn có chắc chắn muốn xóa lớp học "${classToDelete?.name}" không? Hành động này không thể hoàn tác.`}
            confirmLabel="Xóa"
            cancelLabel="Hủy"
            onConfirm={handleDeleteExecute}
            onCancel={() => {
              setConfirmOpen(false);
              setClassToDelete(null);
            }}
          />
        </>
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
                  setClassToDelete({ id: cls.classId, name: cls.className });
                  setConfirmOpen(true);
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
