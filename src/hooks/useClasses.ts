import { useState, useEffect, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { getUserRole } from "../utils/auth";
import type { Classroom } from "../pages/classes/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export function useClasses() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  
  const role = useMemo(() => getUserRole(), []);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const endpoint = role === "teacher" 
        ? `${API_BASE}/api/v1/classes` 
        : `${API_BASE}/api/v1/students/classes`;
        
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
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
      const token = Cookies.get("token");
      await fetch(`${API_BASE}/api/v1/classes/${classId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchClasses();
    } catch (error) {
      console.error("Failed to delete class", error);
    }
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
    classes,
    loading,
    role,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredClasses,
    fetchClasses,
    deleteClass
  };
}
