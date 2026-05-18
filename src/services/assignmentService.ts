import api from "./api/axiosClient";

export const assignmentService = {
  getAssignments: async (classId: string, role: "teacher" | "student"): Promise<any> => {
    const endpoint = role === "teacher" 
      ? `/api/v1/classes/${classId}/assignments`
      : `/api/v1/students/classes/${classId}/assignments`;
    return await api.get(endpoint);
  },

  createAssignment: async (classId: string, payload: any): Promise<any> => {
    return await api.post(`/api/v1/classes/${classId}/assignments`, payload);
  },

  updateAssignment: async (classId: string, assignmentId: string, payload: any): Promise<any> => {
    return await api.put(`/api/v1/classes/${classId}/assignments/${assignmentId}`, payload);
  },

  deleteAssignment: async (classId: string, assignmentId: string): Promise<any> => {
    return await api.delete(`/api/v1/classes/${classId}/assignments/${assignmentId}`);
  }
};
