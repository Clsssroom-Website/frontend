import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignmentService } from '@/services/assignmentService';
import api from '@/config/axiosClient';

vi.mock('@/config/axiosClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('assignmentService', () => {
  const mockClassId = 'class-123';
  const mockAssignmentId = 'assign-123';
  const mockSubmissionId = 'sub-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('lấy danh sách bài tập cho role teacher', async () => {
      const mockResponse = { success: true, data: [] };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.getAssignments(mockClassId, 'teacher');
      
      expect(api.get).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments`);
      expect(result).toEqual(mockResponse);
    });

    it('lấy danh sách bài tập cho role student', async () => {
      const mockResponse = { success: true, data: [] };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.getAssignments(mockClassId, 'student');
      
      expect(api.get).toHaveBeenCalledWith(`/students/classes/${mockClassId}/assignments`);
      expect(result).toEqual(mockResponse);
    });

    it('bắn lỗi nếu gọi thất bại', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));
      await expect(assignmentService.getAssignments(mockClassId, 'student')).rejects.toThrow('Network error');
    });
  });

  describe('getAssignmentDetail', () => {
    it('lấy chi tiết bài tập thành công', async () => {
      const mockResponse = { success: true, data: { assignmentId: mockAssignmentId } };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.getAssignmentDetail(mockAssignmentId);
      expect(api.get).toHaveBeenCalledWith(`/students/assignments/${mockAssignmentId}`);
      expect(result).toEqual(mockResponse);
    });

    it('bắn lỗi nếu lấy chi tiết thất bại', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to get detail'));
      await expect(assignmentService.getAssignmentDetail(mockAssignmentId)).rejects.toThrow('Failed to get detail');
    });
  });

  describe('createAssignment', () => {
    it('tạo bài tập mới gọi api.post với formData, bao gồm quiz json', async () => {
      const mockResponse = { success: true, data: { assignmentId: 'new-id' } };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const payload = {
        title: 'Title',
        deadline: '2026-05-28',
        questions: [{ questionText: 'Q1', points: 10, sortOrder: 1, options: [] }],
        files: [new File([''], 'test.txt')],
      };

      const result = await assignmentService.createAssignment(mockClassId, payload);
      expect(api.post).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments`, expect.any(FormData), {
        headers: { "Content-Type": "multipart/form-data" }
      });
      expect(result).toEqual(mockResponse);
    });

    it('tạo bài tập bị lỗi network', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Create failed'));
      await expect(assignmentService.createAssignment(mockClassId, { title: 'T', deadline: '2026-05-28' })).rejects.toThrow('Create failed');
    });
  });

  describe('updateAssignment', () => {
    it('cho phép cập nhật bài tập', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.put).mockResolvedValueOnce(mockResponse);

      const payload = {
        title: 'Update Title',
      };

      const result = await assignmentService.updateAssignment(mockClassId, mockAssignmentId, payload);
      expect(api.put).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments/${mockAssignmentId}`, expect.any(FormData), {
        headers: { "Content-Type": "multipart/form-data" }
      });
      expect(result).toEqual(mockResponse);
    });

    it('cho phép cập nhật thất bại', async () => {
      vi.mocked(api.put).mockRejectedValueOnce(new Error('Update failed'));
      await expect(assignmentService.updateAssignment(mockClassId, mockAssignmentId, {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteAssignment', () => {
    it('gọi api.delete', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.delete).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.deleteAssignment(mockClassId, mockAssignmentId);
      expect(api.delete).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments/${mockAssignmentId}`);
      expect(result).toEqual(mockResponse);
    });

    it('bắn lỗi network khi gọi api.delete', async () => {
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('Delete failed'));
      await expect(assignmentService.deleteAssignment(mockClassId, mockAssignmentId)).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteAttachment', () => {
    it('gọi api.delete cho attachment', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.delete).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.deleteAttachment(mockClassId, mockAssignmentId, 'att-123');
      expect(api.delete).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments/${mockAssignmentId}/attachments/att-123`);
      expect(result).toEqual(mockResponse);
    });
  });

  // submission cases 
  describe('submitAssignment', () => {
    it('gọi api.post với formData khi nộp tự luận', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.submitAssignment(mockAssignmentId, [new File([''], 'a.txt')]);
      expect(api.post).toHaveBeenCalledWith(`/students/assignments/${mockAssignmentId}/submit`, expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('bắn lỗi khi nộp bài bị lỗi', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Submit Error'));
      await expect(assignmentService.submitAssignment(mockAssignmentId, [])).rejects.toThrow('Submit Error');
    });
  });

  describe('submitQuizAssignment', () => {
    it('gọi api.post để nộp quiz', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const answers = [{ questionId: 'q1', selectedOptionId: 'o1' }];
      const result = await assignmentService.submitQuizAssignment(mockAssignmentId, answers);
      
      expect(api.post).toHaveBeenCalledWith(`/students/assignments/${mockAssignmentId}/submit-quiz`, { answers });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSubmissionAndGrade', () => {
    it('lấy bài nộp và điểm của học sinh', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.getSubmissionAndGrade(mockAssignmentId);
      expect(api.get).toHaveBeenCalledWith(`/students/assignments/${mockAssignmentId}/submission`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSubmissions', () => {
    it('lấy list bài nộp cho giáo viên duyệt', async () => {
      const mockResponse = { success: true, data: [] };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.getSubmissions(mockClassId, mockAssignmentId);
      expect(api.get).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments/${mockAssignmentId}/submissions`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('gradeSubmission', () => {
    it('gọi api.post gửi điểm', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const result = await assignmentService.gradeSubmission(mockClassId, mockAssignmentId, mockSubmissionId, { score: 9.5, comment: 'Good' });
      expect(api.post).toHaveBeenCalledWith(`/classes/${mockClassId}/assignments/${mockAssignmentId}/submissions/${mockSubmissionId}/grade`, { score: 9.5, comment: 'Good' });
      expect(result).toEqual(mockResponse);
    });

    it('bắn lỗi nếu gửi điểm lỗi', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Grade fail'));
      await expect(assignmentService.gradeSubmission(mockClassId, mockAssignmentId, mockSubmissionId, { score: 9 })).rejects.toThrow('Grade fail');
    });
  });

});