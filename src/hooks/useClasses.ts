import { useState, useEffect, useCallback, useMemo } from "react";
import { classroomService } from "../services/classroomService";
import { getUserRole } from "../utils/auth";
import type { Classroom } from "../pages/classes/types";

export function useClasses() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  
  // Modal Facade State
  const [activeModal, setActiveModal] = useState<"create" | "join" | null>(null);
  
  const role = useMemo(() => getUserRole(), []);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classroomService.getAll(role);
      setClasses(data);
    } catch (error) {
      console.error("Failed to fetch classes", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClasses();
  }, [fetchClasses]);

  const deleteClass = useCallback(async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await classroomService.delete(classId);
      await fetchClasses();
    } catch (error) {
      console.error("Failed to delete class", error);
    }
  }, [fetchClasses]);

  // Facade Methods for UI
  const openActionModal = useCallback(() => {
    setActiveModal(role === "teacher" ? "create" : "join");
  }, [role]);

  const closeActionModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleActionSuccess = useCallback(() => {
    setActiveModal(null);
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch = 
        cls.className.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (statusFilter === "All Status") return matchesSearch;
      const isStatusMatch = statusFilter === "Active" ? cls.status === "ACTIVE" : cls.status !== "ACTIVE";
      return matchesSearch && isStatusMatch;
    });
  }, [classes, searchQuery, statusFilter]);

  return {
    loading,
    role,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredClasses,
    deleteClass,
    // Facade Exports
    activeModal,
    openActionModal,
    closeActionModal,
    handleActionSuccess
  };
}
