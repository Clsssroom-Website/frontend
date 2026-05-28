import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '@/services/dashboard.service';
import api from '@/config/axiosClient';

vi.mock('@/config/axiosClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('gọi API get dashboard không có limit', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await dashboardService.getDashboard();
      expect(api.get).toHaveBeenCalledWith('/dashboard');
      expect(result).toEqual(mockResponse);
    });

    it('gọi API get dashboard có limit', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      await dashboardService.getDashboard(10);
      expect(api.get).toHaveBeenCalledWith('/dashboard?limit=10');
    });
  });

  describe('getDashboardStats', () => {
    it('gọi API get dashboard stats', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await dashboardService.getDashboardStats();
      expect(api.get).toHaveBeenCalledWith('/dashboard/stats');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStudentDashboard', () => {
    it('gọi API get student dashboard', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await dashboardService.getStudentDashboard();
      expect(api.get).toHaveBeenCalledWith('/students/dashboard');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPendingSubmissionsToGrade', () => {
    it('gọi API với page và limit mặc định', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await dashboardService.getPendingSubmissionsToGrade();
      expect(api.get).toHaveBeenCalledWith('/dashboard/submissions-to-grade?page=1&limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('gọi API với page và limit custom', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      await dashboardService.getPendingSubmissionsToGrade(2, 20);
      expect(api.get).toHaveBeenCalledWith('/dashboard/submissions-to-grade?page=2&limit=20');
    });

    it('bắn lỗi nếu gặp lỗi network', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Lỗi fetch dashboard'));
      await expect(dashboardService.getPendingSubmissionsToGrade()).rejects.toThrow('Lỗi fetch dashboard');
    });
  });
});