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
  getDashboard: async (): Promise<ApiResponse<TeacherDashboardData>> => {
    const response = await api.get<ApiResponse<TeacherDashboardData>>("/dashboard");
    return response as unknown as ApiResponse<TeacherDashboardData>;
  },

  /**
   * Lấy nhanh các thông số thống kê
   */
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return response as unknown as ApiResponse<DashboardStats>;
  }
};
