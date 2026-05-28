import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classroomService } from '@/services/classroomService';
import api from '@/config/axiosClient';

vi.mock('@/config/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

describe('classroomService', () => {
  const mockClassId = 'class-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClasses', () => {
    it('gọi API get (vai trò giáo viên)', async () => {
      const mockResponse = { data: [] };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse as any);

      const result = await classroomService.getClasses('teacher');
      expect(api.get).toHaveBeenCalledWith('/classes', { params: { search: 'teacher' } });
      expect(result).toEqual([]);
    });

    it('gọi API get (vai trò học sinh)', async () => {
      const mockResponse = { data: [] };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse as any);

      const result = await classroomService.getClasses('student');
      expect(api.get).toHaveBeenCalledWith('/classes', { params: { search: 'student' } });
      expect(result).toEqual([]);
    });
  });

  describe('createClass', () => {
    it('gọi API post tạo lớp (giáo viên)', async () => {
      const mockResponse = { data: { classId: mockClassId } };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse as any);

      const payload = { className: 'Math' };
      const result = await classroomService.createClass(payload);
      
      expect(api.post).toHaveBeenCalledWith('/classes', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('joinClass', () => {
    it('gọi API post tham gia lớp (học sinh)', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse as any);

      const result = await classroomService.joinClass('CODE123');
      expect(api.post).toHaveBeenCalledWith('/students/classes/join', { joinCode: 'CODE123' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteClass', () => {
    it('gọi API xóa lớp học', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.delete).mockResolvedValueOnce(mockResponse as any);

      const result = await classroomService.deleteClass(mockClassId);
      expect(api.delete).toHaveBeenCalledWith(`/classes/${mockClassId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateClass', () => {
    it('gọi API put chỉnh sửa lớp', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.put).mockResolvedValueOnce(mockResponse as any);

      const payload = { className: 'Science' };
      const result = await classroomService.updateClass(mockClassId, payload);
      expect(api.put).toHaveBeenCalledWith(`/classes/${mockClassId}`, payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getClassDetail', () => {
    it('gọi API xem chi tiết lớp học', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse as any);
      
      await classroomService.getClassDetail(mockClassId);
      expect(api.get).toHaveBeenCalledWith(`/classes/${mockClassId}`);
    });
  });

  describe('getStudents', () => {
    it('gọi API lấy sinh viên của lớp', async () => {
      await classroomService.getStudents(mockClassId);
      expect(api.get).toHaveBeenCalledWith(`/classes/${mockClassId}/students`);
    });
  });

  describe('getStream', () => {
    it('gọi API xem luồng bảng tin', async () => {
      await classroomService.getStream(mockClassId);
      expect(api.get).toHaveBeenCalledWith(`/classes/${mockClassId}/stream`);
    });
  });

  describe('removeStudent', () => {
    it('gọi API xóa sinh viên khỏi lớp', async () => {
      await classroomService.removeStudent(mockClassId, 'student-123');
      expect(api.delete).toHaveBeenCalledWith(`/classes/${mockClassId}/students/student-123`);
    });
  });

  describe('getStudentGrades', () => {
    it('gọi API xem điểm sinh viên (student)', async () => {
      await classroomService.getStudentGrades(mockClassId);
      expect(api.get).toHaveBeenCalledWith(`/students/classes/${mockClassId}/grades`);
    });
  });

  describe('getClassGrades', () => {
    it('gọi API xem bảng điểm (teacher)', async () => {
      await classroomService.getClassGrades(mockClassId);
      expect(api.get).toHaveBeenCalledWith(`/classes/${mockClassId}/grades`);
    });
  });
});