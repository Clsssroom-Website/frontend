import api from "../config/axiosClient";
import type { Assignment, Submission, StudentAnswerPayload } from "../types/assignment";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface QuizOptionInput {
  optionText: string;
  isCorrect: boolean;
}

export interface QuizQuestionInput {
  questionText: string;
  points: number;
  sortOrder: number;
  options: QuizOptionInput[];
}

export const assignmentService = {
  /**
   * Lấy danh sách bài tập theo lớp
   */
  getAssignments: async (
    classId: string,
    role: "teacher" | "student"
  ): Promise<ApiResponse<Assignment[]>> => {
    const endpoint =
      role === "teacher"
        ? `/classes/${classId}/assignments`
        : `/students/classes/${classId}/assignments`;
    const response = await api.get<ApiResponse<Assignment[]>>(endpoint);
    return response as unknown as ApiResponse<Assignment[]>;
  },

  /**
   * Lấy chi tiết bài tập — bao gồm quiz questions (học sinh, không có isCorrect)
   */
  getAssignmentDetail: async (
    assignmentId: string
  ): Promise<ApiResponse<Assignment>> => {
    const response = await api.get<ApiResponse<Assignment>>(
      `/students/assignments/${assignmentId}`
    );
    return response as unknown as ApiResponse<Assignment>;
  },

  /**
   * Tạo bài tập mới — gửi FormData kèm file trực tiếp lên MinIO qua backend.
   * Với MULTIPLE_CHOICE: truyền questions[] thay vì quizData JSON string.
   */
  createAssignment: async (
    classId: string,
    payload: {
      title: string;
      description?: string;
      deadline: string;
      typeAssignment?: string;
      questions?: QuizQuestionInput[];
      files?: File[];
    }
  ): Promise<ApiResponse<Assignment>> => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    formData.append("deadline", payload.deadline);
    if (payload.typeAssignment) formData.append("typeAssignment", payload.typeAssignment);

    // Gửi questions dưới dạng JSON string
    if (payload.questions && payload.questions.length > 0) {
      formData.append("questions", JSON.stringify(payload.questions));
    }

    (payload.files ?? []).forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await api.post<ApiResponse<Assignment>>(
      `/classes/${classId}/assignments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response as unknown as ApiResponse<Assignment>;
  },

  /**
   * Cập nhật bài tập — gửi FormData kèm file mới + IDs của file cũ muốn giữ
   */
  updateAssignment: async (
    classId: string,
    assignmentId: string,
    payload: {
      title?: string;
      description?: string;
      deadline?: string;
      typeAssignment?: string;
      questions?: QuizQuestionInput[];
      keepAttachmentIds?: string[];
      files?: File[];
    }
  ): Promise<ApiResponse<Assignment>> => {
    const formData = new FormData();
    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.deadline !== undefined) formData.append("deadline", payload.deadline);
    if (payload.typeAssignment !== undefined)
      formData.append("typeAssignment", payload.typeAssignment);

    // Gửi questions mới
    if (payload.questions !== undefined) {
      formData.append("questions", JSON.stringify(payload.questions));
    }

    // Gửi danh sách attachmentIds muốn giữ lại dưới dạng JSON
    if (payload.keepAttachmentIds !== undefined) {
      formData.append("keepAttachmentIds", JSON.stringify(payload.keepAttachmentIds));
    }

    (payload.files ?? []).forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await api.put<ApiResponse<Assignment>>(
      `/classes/${classId}/assignments/${assignmentId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response as unknown as ApiResponse<Assignment>;
  },

  /**
   * Xóa bài tập
   */
  deleteAssignment: async (
    classId: string,
    assignmentId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/classes/${classId}/assignments/${assignmentId}`
    );
    return response as unknown as ApiResponse<void>;
  },

  /**
   * Xóa một file đính kèm đơn lẻ
   */
  deleteAttachment: async (
    classId: string,
    assignmentId: string,
    attachmentId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/classes/${classId}/assignments/${assignmentId}/attachments/${attachmentId}`
    );
    return response as unknown as ApiResponse<void>;
  },

  /**
   * Nộp bài tập tự luận (Dành cho học sinh)
   */
  submitAssignment: async (
    assignmentId: string,
    files: File[]
  ): Promise<ApiResponse<Submission>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await api.post<ApiResponse<Submission>>(
      `/students/assignments/${assignmentId}/submit`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response as unknown as ApiResponse<Submission>;
  },

  /**
   * Nộp bài trắc nghiệm — chấm điểm tự động phía server
   * Body: { answers: [{ questionId, selectedOptionId }] }
   */
  submitQuizAssignment: async (
    assignmentId: string,
    answers: StudentAnswerPayload[]
  ): Promise<ApiResponse<Submission>> => {
    const response = await api.post<ApiResponse<Submission>>(
      `/students/assignments/${assignmentId}/submit-quiz`,
      { answers }
    );
    return response as unknown as ApiResponse<Submission>;
  },

  /**
   * Xem bài nộp và điểm (Dành cho học sinh)
   */
  getSubmissionAndGrade: async (
    assignmentId: string
  ): Promise<ApiResponse<Submission | null>> => {
    const response = await api.get<ApiResponse<Submission | null>>(
      `/students/assignments/${assignmentId}/submission`
    );
    return response as unknown as ApiResponse<Submission | null>;
  },

  /**
   * Lấy danh sách bài nộp của học sinh (Dành cho giáo viên)
   */
  getSubmissions: async (
    classId: string,
    assignmentId: string
  ): Promise<ApiResponse<Submission[]>> => {
    const response = await api.get<ApiResponse<Submission[]>>(
      `/classes/${classId}/assignments/${assignmentId}/submissions`
    );
    return response as unknown as ApiResponse<Submission[]>;
  },

  /**
   * Chấm điểm cho bài nộp của học sinh (Dành cho giáo viên)
   */
  gradeSubmission: async (
    classId: string,
    assignmentId: string,
    submissionId: string,
    payload: { score: number; comment?: string }
  ): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(
      `/classes/${classId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      payload
    );
    return response as unknown as ApiResponse<void>;
  },
};
