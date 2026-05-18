export type Role = 'student' | 'teacher';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface BaseResponse {
  success: boolean;
  message: string;
}
