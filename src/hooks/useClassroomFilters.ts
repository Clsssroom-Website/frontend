import { useState, useMemo } from "react";
import type { Classroom } from "../types/classroom";

export function useClassroomFilters(classes: Classroom[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filteredClasses = useMemo(() => {
    if (!Array.isArray(classes)) return [];
    
    return classes.filter((cls) => {
      if (statusFilter === "All Status") return true;
      const isStatusMatch = statusFilter === "Active" ? cls.status === "ACTIVE" : cls.status !== "ACTIVE";
      return isStatusMatch;
    });
  }, [classes, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredClasses
  };
}
