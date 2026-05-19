import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeacherDocumentsTab from '../DocumentsTab';
import { documentService } from '@/services/document.service';

// Mock các dependencies
vi.mock('@/services/document.service', () => ({
  documentService: {
    getDocumentsByClassId: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock component con UploadDocumentModal để không render logic thừa
vi.mock('@/components/classes/UploadDocumentModal', () => ({
  default: ({ isOpen, onUploadSuccess }: any) => (
    isOpen ? (
      <div data-testid="upload-modal">
        <button onClick={onUploadSuccess}>Giả lập Upload Thành Công</button>
      </div>
    ) : null
  ),
}));

describe('TeacherDocumentsTab Component', () => {
  const classId = 'class-123';
  
  const mockDocuments = [
    {
      documentId: 'doc-1',
      classId,
      title: 'Bài giảng React',
      description: 'Slide buổi 1',
      uploadTime: '2026-05-18T10:00:00Z',
      DocumentAttachments: [
        {
          attachmentId: 'att-1',
          documentId: 'doc-1',
          fileName: 'react-1.pdf', // PDF -> có nút Xem trước
          fileUri: 'bucket/react-1.pdf',
          fileSize: 1048576, // 1MB
        }
      ]
    },
    {
      documentId: 'doc-2',
      classId,
      title: 'Bài tập về nhà',
      description: 'Làm bài 1,2,3',
      uploadTime: '2026-05-18T11:00:00Z',
      DocumentAttachments: [
        {
          attachmentId: 'att-2',
          documentId: 'doc-2',
          fileName: 'homework.docx', // DOCX -> Không có Xem trước
          fileUri: 'bucket/homework.docx',
          fileSize: 524288, // 0.5MB
        }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Giả lập window.open
    vi.stubGlobal('open', vi.fn());
  });

  it('hiển thị trạng thái loading khi mới mount', () => {
    // Giả lập API delay
    vi.mocked(documentService.getDocumentsByClassId).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
    );
    
    const { container } = render(<TeacherDocumentsTab classId={classId} />);
    // Kiểm tra có loader (dựa vào class animate-spin)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('hiển thị thông báo khi không có tài liệu', async () => {
    vi.mocked(documentService.getDocumentsByClassId).mockResolvedValue({ success: true, data: [] });
    
    render(<TeacherDocumentsTab classId={classId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Chưa có tài liệu nào')).toBeInTheDocument();
    });
  });

  it('hiển thị danh sách tài liệu thành công và hiển thị file khi click để mở rộng', async () => {
    vi.mocked(documentService.getDocumentsByClassId).mockResolvedValue({ success: true, data: mockDocuments as any });
    
    render(<TeacherDocumentsTab classId={classId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Bài giảng React')).toBeInTheDocument();
      expect(screen.getByText('Slide buổi 1')).toBeInTheDocument();
      expect(screen.getByText('Bài tập về nhà')).toBeInTheDocument();
      expect(screen.getByText('Làm bài 1,2,3')).toBeInTheDocument();
    });

    // Click to expand first document
    fireEvent.click(screen.getByText('Bài giảng React'));

    await waitFor(() => {
      expect(screen.getByText('react-1.pdf')).toBeInTheDocument();
      expect(screen.getByText('(1.00 MB)')).toBeInTheDocument(); // 1048576 byte
      expect(screen.getByText('Xem trước')).toBeInTheDocument();
    });
  });

  it('gọi API tải tài liệu và sinh thẻ a khi bấm Tải về', async () => {
    vi.mocked(documentService.getDocumentsByClassId).mockResolvedValue({ success: true, data: mockDocuments as any });
    vi.mocked(documentService.getDownloadUrl).mockResolvedValue({ success: true, data: 'http://fake.url/download' });
    
    // Mock click event của HTMLAnchorElement
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<TeacherDocumentsTab classId={classId} />);
    
    // Đợi danh sách load
    await waitFor(() => screen.getByText('Bài giảng React'));
    
    // Click to expand
    fireEvent.click(screen.getByText('Bài giảng React'));

    // Bấm tải về
    await waitFor(() => expect(screen.getByText('Tải về')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Tải về'));

    await waitFor(() => {
      expect(documentService.getDownloadUrl).toHaveBeenCalledWith('att-1', 'download');
      expect(clickSpy).toHaveBeenCalled();
    });
    
    clickSpy.mockRestore();
  });

  it('gọi window.open khi bấm Xem trước', async () => {
    vi.mocked(documentService.getDocumentsByClassId).mockResolvedValue({ success: true, data: mockDocuments as any });
    vi.mocked(documentService.getDownloadUrl).mockResolvedValue({ success: true, data: 'http://fake.url/preview' });
    
    render(<TeacherDocumentsTab classId={classId} />);
    
    await waitFor(() => screen.getByText('Bài giảng React'));
    
    // Click to expand
    fireEvent.click(screen.getByText('Bài giảng React'));

    await waitFor(() => expect(screen.getByText('Xem trước')).toBeInTheDocument());
    const previewButton = screen.getByText('Xem trước');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(documentService.getDownloadUrl).toHaveBeenCalledWith('att-1'); // Không có action=download
      expect(window.open).toHaveBeenCalledWith('http://fake.url/preview', '_blank');
    });
  });

  it('làm mới danh sách sau khi upload thành công', async () => {
    vi.mocked(documentService.getDocumentsByClassId).mockResolvedValueOnce({ success: true, data: [] });
    
    render(<TeacherDocumentsTab classId={classId} />);
    
    await waitFor(() => screen.getByText('Chưa có tài liệu nào'));
    expect(documentService.getDocumentsByClassId).toHaveBeenCalledTimes(1);

    // Mở modal
    fireEvent.click(screen.getByText('Upload tài liệu'));
    
    // Mock API trả về danh sách mới sau upload
    vi.mocked(documentService.getDocumentsByClassId).mockResolvedValueOnce({ success: true, data: mockDocuments as any });
    
    // Bấm giả lập upload thành công từ Modal
    fireEvent.click(screen.getByText('Giả lập Upload Thành Công'));

    await waitFor(() => {
      expect(documentService.getDocumentsByClassId).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Bài giảng React')).toBeInTheDocument();
    });
  });
});
