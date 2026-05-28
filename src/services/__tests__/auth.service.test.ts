import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';
import axiosClient from '@/config/axiosClient';

vi.mock('@/config/axiosClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('gọi API login', async () => {
      const mockResponse = { success: true, token: 'abc' };
      vi.mocked(axiosClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.login('test@test.com', '123456');
      
      expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: '123456' });
      expect(result).toEqual(mockResponse);
    });

    it('login lỗi throw exception', async () => {
      vi.mocked(axiosClient.post).mockRejectedValueOnce(new Error('Sai mật khẩu'));

      await expect(authService.login('test@test.com', '123')).rejects.toThrow('Sai mật khẩu');
    });
  });

  describe('register', () => {
    it('gọi API register', async () => {
      const mockResponse = { success: true };
      vi.mocked(axiosClient.post).mockResolvedValueOnce(mockResponse);

      const data = { name: 'Thanh', email: 'thanh@test.com', password: '123' };
      const result = await authService.register(data);

      expect(axiosClient.post).toHaveBeenCalledWith('/auth/register', data);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('gọi API logout', async () => {
      const mockResponse = { success: true };
      vi.mocked(axiosClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.logout();

      expect(axiosClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual(mockResponse);
    });
  });
});