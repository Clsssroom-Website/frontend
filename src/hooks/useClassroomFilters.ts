import { useState, useMemo } from "react";
import type { Classroom } from "../types/classroom";

export function useClassroomFilters(classes: Classroom[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filteredClasses = useMemo(() => {
    if (!Array.isArray(classes)) return [];
    
    return classes.filter((cls) => {
      // Vì đã gọi API tìm kiếm, nên phần search ở frontend có thể tắt hoặc giữ lại làm 2 lớp lọc
      const matchesSearch = 
        (cls.className?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
        (cls.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (cls.room?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      if (statusFilter === "All Status") return matchesSearch;
      const isStatusMatch = statusFilter === "Active" ? cls.status === "ACTIVE" : cls.status !== "ACTIVE";
      return matchesSearch && isStatusMatch;
    });
  }, [classes, searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredClasses
  };
}
