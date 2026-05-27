import api from "../config/axiosClient";
import type { TeacherDashboardData, DashboardStats } from "../pages/teacher/dashboard/components/types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const dashboardService = {
  /**
   * Lấy toàn bộ dữ liệu cho trang Dashboard của giáo viên
   */
  getDashboard: async (limit?: number): Promise<ApiResponse<TeacherDashboardData>> => {
    const url = limit ? `/dashboard?limit=${limit}` : "/dashboard";
    const response = await api.get<ApiResponse<TeacherDashboardData>>(url);
    return response as unknown as ApiResponse<TeacherDashboardData>;
  },

  /**
   * Lấy nhanh các thông số thống kê
   */
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return response as unknown as ApiResponse<DashboardStats>;
  },

  /**
   * Lấy toàn bộ dữ liệu cho trang Dashboard của học sinh
   */
  getStudentDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>("/students/dashboard");
    return response as unknown as ApiResponse<any>;
  },

  /**
   * Lấy danh sách bài nộp chưa chấm của giáo viên có phân trang
   */
  getPendingSubmissionsToGrade: async (page = 1, limit = 10): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/dashboard/submissions-to-grade?page=${page}&limit=${limit}`);
    return response as unknown as ApiResponse<any>;
  }
};
