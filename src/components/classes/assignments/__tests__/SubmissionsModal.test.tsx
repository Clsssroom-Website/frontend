import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubmissionsModal from '../SubmissionsModal';
import { assignmentService } from '@/services/assignmentService';
import type { Assignment, Submission } from '@/types/assignment';

// ─── Mock services ────────────────────────────────────────────────────────────
vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    getSubmissions: vi.fn(),
    gradeSubmission: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockAssignment: Assignment = {
  assignmentId: 'assignment-001',
  classId: 'class-001',
  title: 'Tiểu luận 1',
  description: 'Bài tự luận',
  deadline: '2099-12-31T23:59:00Z',
  typeAssignment: 'ESSAY',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  AssignmentAttachments: [],
};

const mockSubmission: Submission = {
  submissionId: 'sub-001',
  assignmentId: 'assignment-001',
  studentId: 'student-001',
  submittedAt: '2026-05-01T10:00:00Z',
  status: 'SUBMITTED',
  student: { userId: 'student-001', name: 'Nguyễn Văn A', email: 'a@example.com' },
  SubmissionAttachments: [],
  quizAnswers: [],
  grade: null,
};

const defaultProps = {
  isOpen: true,
  classId: 'class-001',
  assignment: mockAssignment,
  onClose: vi.fn(),
  isEnded: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const openGradeForm = async () => {
  await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Chấm điểm'));
  await waitFor(() => expect(screen.getByPlaceholderText('8.5')).toBeInTheDocument());
};

// ─── TC_GRD_UT: Chấm điểm bài tập – Kiểm thử mức đơn vị (Vitest + RTL) ────────
describe('TC_GRD_UT – Chấm điểm bài tập (SubmissionsModal)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignmentService.getSubmissions).mockResolvedValue({
      success: true,
      data: [mockSubmission],
    });
  });

  // TC_GRD_UT_001
  it('TC_GRD_UT_001 – Chấm điểm hợp lệ với mức điểm cao nhất (score=10)', async () => {
    vi.mocked(assignmentService.gradeSubmission).mockResolvedValue({ success: true, message: 'Chấm điểm thành công!', data: undefined });

    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('Nhận xét bài làm...'), {
      target: { value: 'Xuất sắc, trình bày logic' },
    });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(assignmentService.gradeSubmission).toHaveBeenCalledWith(
        'class-001', 'assignment-001', 'sub-001',
        { score: 10, comment: 'Xuất sắc, trình bày logic' }
      );
    });
  });

  // TC_GRD_UT_002
  it('TC_GRD_UT_002 – Chấm điểm tối thiểu (score=0) được lưu thành công', async () => {
    vi.mocked(assignmentService.gradeSubmission).mockResolvedValue({ success: true, message: 'Chấm điểm thành công!', data: undefined });

    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(assignmentService.gradeSubmission).toHaveBeenCalledWith(
        'class-001', 'assignment-001', 'sub-001',
        expect.objectContaining({ score: 0 })
      );
    });
  });

  // TC_GRD_UT_003
  it('TC_GRD_UT_003 – Điểm thập phân được làm tròn 2 chữ số trước khi gửi (8.75)', async () => {
    vi.mocked(assignmentService.gradeSubmission).mockResolvedValue({ success: true, message: '', data: undefined });

    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '8.75' } });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(assignmentService.gradeSubmission).toHaveBeenCalledWith(
        'class-001', 'assignment-001', 'sub-001',
        expect.objectContaining({ score: 8.75 })
      );
    });
  });

  // TC_GRD_UT_004
  it('TC_GRD_UT_004 – Nhập điểm âm (-1.5): hiện lỗi, không gọi API', async () => {
    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '-1.5' } });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(screen.getByText('Điểm số phải là số từ 0 đến 10.')).toBeInTheDocument();
    });
    expect(assignmentService.gradeSubmission).not.toHaveBeenCalled();
  });

  // TC_GRD_UT_005
  it('TC_GRD_UT_005 – Nhập điểm vượt trần (11.0): hiện lỗi, không gọi API', async () => {
    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '11' } });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(screen.getByText('Điểm số phải là số từ 0 đến 10.')).toBeInTheDocument();
    });
    expect(assignmentService.gradeSubmission).not.toHaveBeenCalled();
  });

  // TC_GRD_UT_006
  it('TC_GRD_UT_006 – Nhập ký tự chữ vào ô điểm: NaN bị chặn, không gọi API', async () => {
    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: 'Chín điểm rưỡi' } });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(screen.getByText('Điểm số phải là số từ 0 đến 10.')).toBeInTheDocument();
    });
    expect(assignmentService.gradeSubmission).not.toHaveBeenCalled();
  });

  // TC_GRD_UT_007
  it('TC_GRD_UT_007 – Chấm lại (regrading): gọi API với điểm mới 7.5', async () => {
    const submissionWithGrade: Submission = {
      ...mockSubmission,
      grade: { gradeId: 'grade-001', score: 9.0, comment: 'Tốt', gradedAt: '2026-05-01T11:00:00Z' },
    };
    vi.mocked(assignmentService.getSubmissions).mockResolvedValue({ success: true, data: [submissionWithGrade] });
    vi.mocked(assignmentService.gradeSubmission).mockResolvedValue({ success: true, message: '', data: undefined });

    render(<SubmissionsModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sửa điểm'));

    await waitFor(() => expect(screen.getByPlaceholderText('8.5')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '7.5' } });
    fireEvent.change(screen.getByPlaceholderText('Nhận xét bài làm...'), {
      target: { value: 'Cần cải thiện phần kết luận' },
    });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(assignmentService.gradeSubmission).toHaveBeenCalledWith(
        'class-001', 'assignment-001', 'sub-001',
        { score: 7.5, comment: 'Cần cải thiện phần kết luận' }
      );
    });
  });

  // TC_GRD_UT_008
  it('TC_GRD_UT_008 – Nhận xét chứa emoji và ký tự Unicode được gửi đúng', async () => {
    vi.mocked(assignmentService.gradeSubmission).mockResolvedValue({ success: true, message: '', data: undefined });

    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    const emojiComment = 'Làm tốt! 🎉 Trình bày đẹp. <b>Giỏi!</b>';
    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '8' } });
    fireEvent.change(screen.getByPlaceholderText('Nhận xét bài làm...'), {
      target: { value: emojiComment },
    });
    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(assignmentService.gradeSubmission).toHaveBeenCalledWith(
        'class-001', 'assignment-001', 'sub-001',
        expect.objectContaining({ comment: emojiComment })
      );
    });
  });

  // TC_GRD_UT_009
  it('TC_GRD_UT_009 – Nhận xét vượt 1000 ký tự: bộ đếm đỏ, không gọi API', async () => {
    const toast = (await import('react-hot-toast')).default;

    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    const longComment = 'A'.repeat(1001);
    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '8' } });
    fireEvent.change(screen.getByPlaceholderText('Nhận xét bài làm...'), {
      target: { value: longComment },
    });

    // Bộ đếm hiển thị màu đỏ (vượt giới hạn)
    const counter = screen.getByText(`1001/1000`);
    expect(counter).toBeInTheDocument();
    expect(counter.className).toMatch(/text-red/);

    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Nhận xét không được vượt quá 1000 ký tự.');
    });
    expect(assignmentService.gradeSubmission).not.toHaveBeenCalled();
  });

  // TC_GRD_UT_010 – BVA: comment đúng 1000 ký tự (biên trong hợp lệ)
  it('TC_GRD_UT_010 – Comment đúng 1000 ký tự (biên trong): lưu thành công, bộ đếm không đỏ', async () => {
    vi.mocked(assignmentService.gradeSubmission).mockResolvedValue({ success: true, message: 'Chấm điểm thành công!', data: undefined });

    render(<SubmissionsModal {...defaultProps} />);
    await openGradeForm();

    const exactComment = 'B'.repeat(1000);
    fireEvent.change(screen.getByPlaceholderText('8.5'), { target: { value: '8' } });
    fireEvent.change(screen.getByPlaceholderText('Nhận xét bài làm...'), {
      target: { value: exactComment },
    });

    // Bộ đếm 1000/1000 — không chuyển màu đỏ
    const counter = screen.getByText('1000/1000');
    expect(counter).toBeInTheDocument();
    expect(counter.className).not.toMatch(/text-red/);

    fireEvent.click(screen.getByText('Lưu'));

    await waitFor(() => {
      expect(assignmentService.gradeSubmission).toHaveBeenCalledWith(
        'class-001', 'assignment-001', 'sub-001',
        expect.objectContaining({ score: 8 })
      );
    });
  });

  // TC_GRD_UT_011
  it('TC_GRD_UT_011 – Bài trắc nghiệm: nút Chấm điểm và Sửa điểm không hiển thị', async () => {
    const quizAssignment: Assignment = { ...mockAssignment, typeAssignment: 'MULTIPLE_CHOICE' };
    const quizSubmission: Submission = {
      ...mockSubmission,
      quizAnswers: [{ questionId: 'q1', selectedOptionId: 'o1', selectedOptionText: 'A', questionText: 'Câu 1?', isCorrect: true }],
      grade: { gradeId: 'g1', score: 8, comment: null, gradedAt: '2026-05-01T00:00:00Z' },
    };
    vi.mocked(assignmentService.getSubmissions).mockResolvedValue({ success: true, data: [quizSubmission] });

    render(<SubmissionsModal {...defaultProps} assignment={quizAssignment} />);

    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());
    expect(screen.queryByText('Chấm điểm')).not.toBeInTheDocument();
    expect(screen.queryByText('Sửa điểm')).not.toBeInTheDocument();
  });

  // TC_GRD_UT_012 – Bài trắc nghiệm: Hiển thị điểm số trắc nghiệm tự động và danh sách câu hỏi khi click xem
  it('TC_GRD_UT_012 – Bài trắc nghiệm: hiển thị điểm tự động và danh sách câu trả lời chi tiết', async () => {
    const quizAssignment: Assignment = { ...mockAssignment, typeAssignment: 'MULTIPLE_CHOICE' };
    const quizSubmission: Submission = {
      ...mockSubmission,
      quizAnswers: [
        { questionId: 'q1', selectedOptionId: 'o1', selectedOptionText: 'Đáp án A', questionText: 'Câu hỏi 1?', isCorrect: true },
        { questionId: 'q2', selectedOptionId: 'o2', selectedOptionText: 'Đáp án B', questionText: 'Câu hỏi 2?', isCorrect: false },
      ],
      grade: { gradeId: 'g1', score: 5.0, comment: 'Hệ thống tự động chấm', gradedAt: '2026-05-01T00:00:00Z' },
    };
    vi.mocked(assignmentService.getSubmissions).mockResolvedValue({ success: true, data: [quizSubmission] });

    render(<SubmissionsModal {...defaultProps} assignment={quizAssignment} />);

    // Chờ render tên học sinh
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());

    // 1. Kiểm tra hiển thị điểm số và số câu đúng/sai ở badge
    expect(screen.getByText('5/10 — Đúng 1/2 câu')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Điểm số lớn ở góc phải

    // 2. Kiểm tra xem nút xem câu trả lời có hiển thị không
    const toggleBtn = screen.getByText('Xem câu trả lời (2 câu)');
    expect(toggleBtn).toBeInTheDocument();

    // 3. Click xem chi tiết câu trả lời
    fireEvent.click(toggleBtn);

    // 4. Kiểm tra xem các câu hỏi và trạng thái Đúng/Sai có hiển thị không
    await waitFor(() => {
      expect(screen.getByText('Câu hỏi 1?')).toBeInTheDocument();
      expect(screen.getByText('Đáp án A')).toBeInTheDocument();
      expect(screen.getByText('Đúng')).toBeInTheDocument();

      expect(screen.getByText('Câu hỏi 2?')).toBeInTheDocument();
      expect(screen.getByText('Đáp án B')).toBeInTheDocument();
      expect(screen.getByText('Sai')).toBeInTheDocument();
    });

    // 5. Click để ẩn
    fireEvent.click(screen.getByText('Ẩn câu trả lời (2 câu)'));
    await waitFor(() => {
      expect(screen.queryByText('Câu hỏi 1?')).not.toBeInTheDocument();
    });
  });
});
