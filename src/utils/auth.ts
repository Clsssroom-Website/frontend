import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export type UserRole = "student" | "teacher";

interface TokenPayload {
  role?: UserRole;
  [key: string]: unknown;
}

/**
 * Lấy role của user từ token trong cookie.
 * @returns "student" hoặc "teacher" (Mặc định là "student" nếu không có token hoặc token lỗi)
 */
export const getUserRole = (): UserRole => {
  const token = Cookies.get("token");
  if (!token) return "student";

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.role === "teacher" ? "teacher" : "student";
  } catch (error) {
    console.error("Failed to decode token:", error);
    return "student";
  }
};
