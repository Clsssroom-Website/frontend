import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentService } from '@/services/document.service';
import api from '@/config/axiosClient';
import type { Document } from '@/types/document';

// Mock axiosClient (api)
vi.mock('@/config/axiosClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('documentService', () => {
  const mockClassId = 'class-123';
  const mockDocumentId = 'doc-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('gọi API upload chính xác và trả về dữ liệu', async () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content']), 'test.pdf');
      mockFormData.append('classId', mockClassId);

      const mockResponse = {
        success: true,
        data: { documentId: mockDocumentId, title: 'test.pdf' } as Document,
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const result = await documentService.uploadDocument(mockFormData);

      expect(api.post).toHaveBeenCalledWith('/documents/upload', mockFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('bắn lỗi nếu upload thất bại', async () => {
      const mockFormData = new FormData();
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Upload failed'));

      await expect(documentService.uploadDocument(mockFormData)).rejects.toThrow('Upload failed');
    });
  });

  describe('getDocumentsByClassId', () => {
    it('lấy danh sách tài liệu thành công', async () => {
      const mockResponse = {
        success: true,
        data: [{ documentId: 'doc-1', title: 'Doc 1' }] as Document[],
      };

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await documentService.getDocumentsByClassId(mockClassId);

      expect(api.get).toHaveBeenCalledWith(`/documents/class/${mockClassId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDownloadUrl', () => {
    const mockAttachmentId = 'att-123';

    it('lấy URL xem trước (không có action download)', async () => {
      const mockResponse = {
        success: true,
        data: 'http://localhost:9000/presigned-preview-url',
      };

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await documentService.getDownloadUrl(mockAttachmentId);

      expect(api.get).toHaveBeenCalledWith(`/documents/attachment/${mockAttachmentId}/download`);
      expect(result).toEqual(mockResponse);
    });

    it('lấy URL tải về (có action download)', async () => {
      const mockResponse = {
        success: true,
        data: 'http://localhost:9000/presigned-download-url',
      };

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await documentService.getDownloadUrl(mockAttachmentId, 'download');

      expect(api.get).toHaveBeenCalledWith(`/documents/attachment/${mockAttachmentId}/download?action=download`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateDocument', () => {
    it('gọi API chỉnh sửa tài liệu với data', async () => {
      const mockResponse = {
        success: true,
        data: { documentId: mockDocumentId, title: 'Updated' },
      };

      vi.mocked(api.put).mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('title', 'Updated');
      const result = await documentService.updateDocument(mockDocumentId, formData);

      expect(api.put).toHaveBeenCalledWith(`/documents/${mockDocumentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteDocument', () => {
    it('gọi API xóa tài liệu', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted successfully',
      };

      vi.mocked(api.delete).mockResolvedValueOnce(mockResponse);

      const result = await documentService.deleteDocument(mockDocumentId);

      expect(api.delete).toHaveBeenCalledWith(`/documents/${mockDocumentId}`);
      expect(result).toEqual(mockResponse);
    });
  });
});
