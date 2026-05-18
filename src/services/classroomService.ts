import api from "../config/axiosClient";
import type { Classroom } from "../types/classroom";

export const classroomService = {
  /**
   * Lấy danh sách lớp học của người dùng hiện tại
   */
  async getClasses(): Promise<Classroom[]> {
    const data: any = await api.get("/classes");
    // axiosClient interceptor đã trả về trực tiếp response.data, nên payload là data.data
    return data.data || [];
  },

  /**
   * Tạo một lớp học mới (Dành cho giáo viên)
   */
  async createClass(payload: Partial<Classroom>): Promise<any> {
    const data = await api.post("/classes", payload);
    return data;
  },

  /**
   * Tham gia lớp học (Dành cho học sinh)
   */
  async joinClass(joinCode: string): Promise<any> {
    const data = await api.post("/students/classes/join", { joinCode });
    return data;
  },

  /**
   * Xóa một lớp học (Dành cho giáo viên)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteClass(classId: string): Promise<any> {
    const data = await api.delete(`/classes/${classId}`);
    return data;
  },

  /**
   * Lấy chi tiết lớp học
   */
  async getClassDetail(classId: string): Promise<any> {
    return await api.get(`/classes/${classId}`);
  },

  /**
   * Lấy danh sách sinh viên của lớp
   */
  async getStudents(classId: string): Promise<any> {
    return await api.get(`/classes/${classId}/students`);
  },

  /**
   * Lấy danh sách bảng tin (stream)
   */
  async getStream(classId: string): Promise<any> {
    return await api.get(`/classes/${classId}/stream`);
  },
};
