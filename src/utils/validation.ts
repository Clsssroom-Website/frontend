export interface LoginInput {
  email?: string;
  password?: string;
}

export interface RegisterInput {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate login form input
 * @returns Error message if invalid, null if valid
 */
export const validateLogin = (form: LoginInput): string | null => {
  const email = (form.email || "").trim();
  const password = form.password || "";

  if (!email) {
    return "Vui lòng nhập địa chỉ email.";
  }

  if (!emailRegex.test(email)) {
    return "Email không hợp lệ.";
  }

  if (email.length > 255) {
    return "Email không được vượt quá 255 ký tự.";
  }

  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (password.length > 20) {
    return "Mật khẩu không được vượt quá 20 ký tự.";
  }

  return null;
};

/**
 * Validate register form input
 * @returns Error message if invalid, null if valid
 */
export const validateRegister = (form: RegisterInput): string | null => {
  const name = (form.name || "").trim();
  const email = (form.email || "").trim();
  const password = form.password || "";
  const confirmPassword = form.confirmPassword || "";
  const role = form.role || "";

  if (!name) {
    return "Họ tên không được để trống.";
  }

  if (name.length < 2) {
    return "Họ tên phải có ít nhất 2 ký tự.";
  }

  if (name.length > 255) {
    return "Họ tên không được vượt quá 255 ký tự.";
  }

  if (!email) {
    return "Vui lòng nhập địa chỉ email.";
  }

  if (!emailRegex.test(email)) {
    return "Email không hợp lệ.";
  }

  if (email.length > 255) {
    return "Email không được vượt quá 255 ký tự.";
  }

  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (password.length < 7) {
    return "Mật khẩu phải có ít nhất 7 ký tự.";
  }

  if (password.length > 20) {
    return "Mật khẩu không được vượt quá 20 ký tự.";
  }

  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp!";
  }

  if (role !== "student" && role !== "teacher") {
    return "Vai trò chọn không hợp lệ.";
  }

  return null;
};
