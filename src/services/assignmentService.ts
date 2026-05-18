import api from "../config/axiosClient";

export const assignmentService = {
  getAssignments: async (classId: string, role: "teacher" | "student"): Promise<any> => {
    const endpoint = role === "teacher"
      ? `/classes/${classId}/assignments`
      : `/students/classes/${classId}/assignments`;
    return await api.get(endpoint);
  },

  createAssignment: async (classId: string, payload: any): Promise<any> => {
    return await api.post(`/classes/${classId}/assignments`, payload);
  },

  updateAssignment: async (classId: string, assignmentId: string, payload: any): Promise<any> => {
    return await api.put(`/classes/${classId}/assignments/${assignmentId}`, payload);
  },

  deleteAssignment: async (classId: string, assignmentId: string): Promise<any> => {
    return await api.delete(`/classes/${classId}/assignments/${assignmentId}`);
  }
};
