// ─── Attachments ──────────────────────────────────────────────────────────────

export interface Attachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize?: string | null;
}

/** File đã tồn tại trên server (giữ lại khi edit) */
export interface ExistingAttachment {
  kind: "existing";
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize?: string | null;
}

/** File mới được chọn từ máy tính (chưa upload) */
export interface NewAttachment {
  kind: "new";
  file: File;
  previewName: string;
}

export type AttachmentItem = ExistingAttachment | NewAttachment;

// ─── Quiz — DB types (from API response) ─────────────────────────────────────

/** Đáp án của một câu hỏi trắc nghiệm (phía học sinh — không có isCorrect) */
export interface QuizOptionDB {
  optionId: string;
  optionText: string;
  isCorrect?: boolean; // Chỉ có trong response dành cho giáo viên
}

/** Câu hỏi trắc nghiệm trả về từ DB */
export interface QuizQuestionDB {
  questionId: string;
  questionText: string;
  points: number;
  sortOrder: number;
  QuizOptions: QuizOptionDB[];
}

// ─── Quiz — Draft types (dùng trong AssignmentForm) ──────────────────────────

/** Đáp án đang soạn thảo trong form (chưa lưu vào DB) */
export interface QuizOptionDraft {
  _tempId: string;
  optionText: string;
  isCorrect: boolean;
}

/** Câu hỏi đang soạn thảo trong form (chưa lưu vào DB) */
export interface QuizQuestionDraft {
  _tempId: string;
  questionText: string;
  points: number;
  sortOrder: number;
  options: QuizOptionDraft[];
}

// ─── Quiz — Submit payload ────────────────────────────────────────────────────

export interface StudentAnswerPayload {
  questionId: string;
  selectedOptionId: string;
}

// ─── Quiz — Result from server after submit ───────────────────────────────────

export interface QuizAnswerResult {
  questionId: string;
  questionText?: string;
  selectedOptionId: string;
  selectedOptionText?: string;
  correctOptionId?: string;
  isCorrect?: boolean;
  points?: number;
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface Assignment {
  assignmentId: string;
  classId: string;
  title: string;
  description: string;
  deadline: string;
  typeAssignment: string;
  status: string;
  createdAt: string;
  totalSubmissions?: number;
  AssignmentAttachments: Attachment[];
  QuizQuestions?: QuizQuestionDB[];
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface SubmissionAttachment {
  attachmentId: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize?: string | null;
  uploadedAt?: string;
}

export interface SubmissionGrade {
  gradeId: string;
  score: number | null;
  comment?: string | null;
  gradedAt?: string;
}

export interface SubmissionStudent {
  userId: string;
  name: string;
  email: string;
}

export interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: string;
  student: SubmissionStudent | null;
  SubmissionAttachments: SubmissionAttachment[];
  quizAnswers?: QuizAnswerResult[];
  grade: SubmissionGrade | null;
  // Quiz submit response extras
  score?: number;
  comment?: string;
  totalQuestions?: number;
  correctAnswers?: number;
  answers?: QuizAnswerResult[];
}

// ─── Legacy alias (kept for backward compat) ─────────────────────────────────
/** @deprecated Dùng QuizQuestionDraft thay thế */
export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  score: number;
}

/** @deprecated Dùng QuizAnswerResult thay thế */
export interface StudentQuizAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}
