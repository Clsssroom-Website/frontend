import { useState, useEffect } from "react";
import { Link as LinkIcon, FolderMinus, FolderPlus } from "lucide-react";
import { ClassesLayout } from "../../../layout/ClassesLayout";
import { ClassroomCard } from "../../../components/classes/ClassroomCard";
import { ClassroomActionButton } from "../../../components/classes/ClassroomActionButton";
import { CreateClassModal } from "../../../components/classes/CreateClassModal";
import { useClassroomsData } from "../../../hooks/useClassroomsData";
import { useClassroomFilters } from "../../../hooks/useClassroomFilters";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { classroomService } from "../../../services/classroomService";

export default function TeacherClasses() {
  const { classes, loading, fetchClasses } = useClassroomsData();
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredClasses } = useClassroomFilters(classes);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // States for toggle status confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [classToToggle, setClassToToggle] = useState<{ id: string; name: string; currentStatus: string } | null>(null);

  const handleToggleStatusExecute = async () => {
    if (!classToToggle) return;
    setConfirmOpen(false);
    
    const isCurrentlyActive = classToToggle.currentStatus === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "ENDED" : "ACTIVE";

    try {
      const res = await classroomService.updateClass(classToToggle.id, { status: nextStatus });
      if (res && res.success) {
        toast.success(isCurrentlyActive ? "Đóng lớp học thành công!" : "Mở lại lớp học thành công!");
        fetchClasses();
      } else {
        toast.error(res?.message || "Không thể thay đổi trạng thái lớp học.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Lỗi kết nối.");
    } finally {
      setClassToToggle(null);
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
            title={classToToggle?.currentStatus === "ACTIVE" ? "Đóng lớp học" : "Mở lại lớp học"}
            message={
              classToToggle?.currentStatus === "ACTIVE"
                ? `Bạn có chắc chắn muốn đóng lớp học "${classToToggle?.name}" không? Học sinh sẽ không thể nộp bài và các hoạt động chỉnh sửa sẽ bị khóa.`
                : `Bạn có chắc chắn muốn mở lại lớp học "${classToToggle?.name}" không?`
            }
            confirmLabel={classToToggle?.currentStatus === "ACTIVE" ? "Đóng lớp" : "Mở lại"}
            cancelLabel="Hủy"
            onConfirm={handleToggleStatusExecute}
            onCancel={() => {
              setConfirmOpen(false);
              setClassToToggle(null);
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
                  setClassToToggle({ id: cls.classId, name: cls.className, currentStatus: cls.status });
                  setConfirmOpen(true);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-md text-sm transition-colors ${
                  cls.status === "ACTIVE"
                    ? "border-amber-200 hover:bg-amber-50 text-amber-600"
                    : "border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                }`}
              >
                {cls.status === "ACTIVE" ? (
                  <>
                    <FolderMinus size={16} />
                    Đóng lớp
                  </>
                ) : (
                  <>
                    <FolderPlus size={16} />
                    Mở lại
                  </>
                )}
              </button>
            </>
          }
        />
      ))}
    </ClassesLayout>
  );
}
