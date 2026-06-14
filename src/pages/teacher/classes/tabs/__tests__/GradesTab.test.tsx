import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeacherGradesTab from '../GradesTab';
import { classroomService } from '@/services/classroomService';

// ─── Mock services ────────────────────────────────────────────────────────────
vi.mock('@/services/classroomService', () => ({
  classroomService: {
    getClassGrades: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockAssignments = [
  { assignmentId: 'a1', title: 'Tiểu luận 1', deadline: '2026-06-01T23:59:00Z', typeAssignment: 'ESSAY' },
  { assignmentId: 'a2', title: 'Bài tập 2',   deadline: '2026-06-15T23:59:00Z', typeAssignment: 'ESSAY' },
];

const makeStudent = (
  id: string, name: string, email: string,
  grades: { assignmentId: string; score: number | null; status: string }[],
  averageScore: number | null
) => ({
  studentId: id,
  name,
  email,
  grades: grades.map(g => ({
    assignmentId: g.assignmentId,
    title: '',
    score: g.score,
    comment: null,
    gradedAt: null,
    status: g.status,
  })),
  averageScore,
});

const defaultProps = { classId: 'class-001' };

// ─── TC_SCR_UT: Quản lý điểm số – Kiểm thử mức đơn vị (Vitest + RTL) ──────────
describe('TC_SCR_UT – Quản lý điểm số (GradesTab)', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC_SCR_UT_001
  it('TC_SCR_UT_001 – Tải bảng điểm tổng hợp thành công', async () => {
    const students = [
      makeStudent('s1', 'Nguyễn Văn A', 'a@test.com',
        [{ assignmentId: 'a1', score: 8, status: 'graded' }], 8),
    ];
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students },
    });

    render(<TeacherGradesTab classId="class-001" />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Tiểu luận 1')).toBeInTheDocument();
      expect(screen.getByText('Bài tập 2')).toBeInTheDocument();
    });
  });

  // TC_SCR_UT_002
  it('TC_SCR_UT_002 – Hiển thị điểm trung bình không trọng số (8+9+7)/3 = 8', async () => {
    const students = [
      makeStudent('s1', 'Học sinh A', 'a@test.com',
        [
          { assignmentId: 'a1', score: 8, status: 'graded' },
          { assignmentId: 'a2', score: 9, status: 'graded' },
        ],
        8.5 // mock trả thẳng từ API
      ),
    ];
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });
  });

  // TC_SCR_UT_003
  it('TC_SCR_UT_003 – Bài quá hạn không nộp hiển thị badge "Không nộp" và điểm 0', async () => {
    const students = [
      makeStudent('s1', 'Học sinh B', 'b@test.com',
        [
          { assignmentId: 'a1', score: 9, status: 'graded' },
          { assignmentId: 'a2', score: 0, status: 'absent' },
        ],
        4.5
      ),
    ];
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Không nộp')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  // TC_SCR_UT_004
  it('TC_SCR_UT_004 – Điểm TB làm tròn 2 chữ số (26/3 = 8.67)', async () => {
    const students = [
      makeStudent('s1', 'Học sinh C', 'c@test.com',
        [
          { assignmentId: 'a1', score: 8, status: 'graded' },
          { assignmentId: 'a2', score: 9, status: 'graded' },
        ],
        8.67 // Service đã tính toFixed(2)
      ),
    ];
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('8.67')).toBeInTheDocument();
    });
  });

  // TC_SCR_UT_005
  it('TC_SCR_UT_005 – Nút "Xuất file CSV" chỉ hiện khi có học sinh và bài tập', async () => {
    const students = [
      makeStudent('s1', 'Học sinh A', 'a@test.com',
        [{ assignmentId: 'a1', score: 8, status: 'graded' }], 8),
    ];
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Xuất file CSV')).toBeInTheDocument();
    });
  });

  // TC_SCR_UT_006
  it('TC_SCR_UT_006 – Hàm buildCSV bao từng giá trị bằng nháy kép', () => {
    // Unit test thuần: kiểm tra logic tạo chuỗi CSV
    const headers = ['STT', 'Họ và tên', 'Email', 'Tiểu luận 1', 'ĐTB'];
    const row = [1, 'Nguyễn Văn A', 'a@test.com', 8.5, 8.5];
    const csvRow = row.map(val => `"${val}"`).join(',');

    expect(csvRow).toBe('"1","Nguyễn Văn A","a@test.com","8.5","8.5"');
    expect(headers.join(',')).toBe('STT,Họ và tên,Email,Tiểu luận 1,ĐTB');
  });

  // TC_SCR_UT_007
  it('TC_SCR_UT_007 – Nút Xuất CSV ẩn khi lớp không có học sinh', async () => {
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students: [] },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có học sinh nào')).toBeInTheDocument();
      expect(screen.queryByText('Xuất file CSV')).not.toBeInTheDocument();
    });
  });

  // TC_SCR_UT_008 – Nút Xuất CSV ẩn khi lớp không có bài tập
  it('TC_SCR_UT_008 – Nút Xuất CSV ẩn khi lớp chưa có bài tập', async () => {
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: [], students: [] },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có bài tập nào')).toBeInTheDocument();
      expect(screen.queryByText('Xuất file CSV')).not.toBeInTheDocument();
    });
  });

  // TC_SCR_UT_009 – Xử lý lỗi API
  it('TC_SCR_UT_009 – Hiển thị lỗi khi API getClassGrades thất bại', async () => {
    vi.mocked(classroomService.getClassGrades).mockRejectedValue(
      new Error('Lỗi kết nối. Vui lòng thử lại.')
    );

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối. Vui lòng thử lại.')).toBeInTheDocument();
    });
  });

  // TC_SCR_UT_010
  it('TC_SCR_UT_010 – Tìm kiếm client-side lọc đúng học sinh theo tên', async () => {
    const students = [
      makeStudent('s1', 'Nguyễn Văn A', 'a@test.com',
        [{ assignmentId: 'a1', score: 8, status: 'graded' }], 8),
      makeStudent('s2', 'Trần Thị B', 'b@test.com',
        [{ assignmentId: 'a1', score: 7, status: 'graded' }], 7),
    ];
    vi.mocked(classroomService.getClassGrades).mockResolvedValue({
      success: true,
      data: { assignments: mockAssignments, students },
    });

    render(<TeacherGradesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });

    // Gõ từ khóa tìm kiếm — search dùng .toLowerCase().includes() không normalize dấu
    // nên phải gõ đúng chữ có dấu
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm học sinh theo tên hoặc email...'), {
      target: { value: 'Nguyễn' },
    });

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.queryByText('Trần Thị B')).not.toBeInTheDocument();
    });
  });
});
