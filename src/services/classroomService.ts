import api from "./api";
import type { Classroom } from "../pages/classes/types";

export const classroomService = {
  /**
   * Lấy danh sách lớp học dựa trên role
   */
  async getAll(role: "teacher" | "student"): Promise<Classroom[]> {
    const endpoint = role === "teacher" ? "/api/v1/classes" : "/api/v1/students/classes";
    const { data } = await api.get(endpoint);
    return data.success ? data.data : [];
  },

  /**
   * Xóa một lớp học
   */
  async delete(classId: string): Promise<void> {
    await api.delete(`/api/v1/classes/${classId}`);
  },

  /**
   * Có thể thêm các method khác ở đây (create, join, update...)
   */
};
