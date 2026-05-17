import { useState, useEffect, useCallback } from "react";
import { classroomService } from "../services/classroomService";
import type { Classroom } from "../pages/classes/types";

export function useClassroomsData() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classroomService.getClasses();
      // Ensure data is array before setting
      if (Array.isArray(data)) {
        setClasses(data);
      } else if (data && Array.isArray((data as any).data)) {
        setClasses((data as any).data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Failed to fetch classes", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const deleteClass = useCallback(async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await classroomService.deleteClass(classId);
      await fetchClasses();
    } catch (error) {
      console.error("Failed to delete class", error);
    }
  }, [fetchClasses]);

  return { classes, loading, fetchClasses, deleteClass };
}
