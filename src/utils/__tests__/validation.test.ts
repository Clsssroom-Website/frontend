import { describe, it, expect } from "vitest";
import { validateLogin, validateRegister } from "../validation";

describe("Validation Utility Functions", () => {
  describe("validateLogin", () => {
    it("should return null for valid login input", () => {
      const result = validateLogin({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toBeNull();
    });

    it("should return error message when email is empty", () => {
      const result = validateLogin({
        email: "   ",
        password: "password123",
      });
      expect(result).toBe("Vui lòng nhập địa chỉ email.");
    });

    it("should return error message when email is invalid format", () => {
      const result = validateLogin({
        email: "invalid-email",
        password: "password123",
      });
      expect(result).toBe("Email không hợp lệ.");
    });

    it("should return error message when password is empty", () => {
      const result = validateLogin({
        email: "test@example.com",
        password: "",
      });
      expect(result).toBe("Vui lòng nhập mật khẩu.");
    });

    it("should return error message when email is too long", () => {
      const result = validateLogin({
        email: "a".repeat(256) + "@example.com",
        password: "password123",
      });
      expect(result).toBe("Email không được vượt quá 255 ký tự.");
    });

    it("should return error message when password is too long", () => {
      const result = validateLogin({
        email: "test@example.com",
        password: "a".repeat(21),
      });
      expect(result).toBe("Mật khẩu không được vượt quá 20 ký tự.");
    });
  });

  describe("validateRegister", () => {
    const validRegisterInput = {
      name: "John Doe",
      email: "john@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      role: "student",
    };

    it("should return null for valid register input", () => {
      const result = validateRegister(validRegisterInput);
      expect(result).toBeNull();
    });

    it("should return error message when name is empty", () => {
      const result = validateRegister({
        ...validRegisterInput,
        name: "   ",
      });
      expect(result).toBe("Họ tên không được để trống.");
    });

    it("should return error message when name is too short", () => {
      const result = validateRegister({
        ...validRegisterInput,
        name: "A",
      });
      expect(result).toBe("Họ tên phải có ít nhất 2 ký tự.");
    });

    it("should return error message when email is empty", () => {
      const result = validateRegister({
        ...validRegisterInput,
        email: "",
      });
      expect(result).toBe("Vui lòng nhập địa chỉ email.");
    });

    it("should return error message when email is invalid", () => {
      const result = validateRegister({
        ...validRegisterInput,
        email: "invalid-email",
      });
      expect(result).toBe("Email không hợp lệ.");
    });

    it("should return error message when password is empty", () => {
      const result = validateRegister({
        ...validRegisterInput,
        password: "",
      });
      expect(result).toBe("Vui lòng nhập mật khẩu.");
    });

    it("should return error message when password is too short", () => {
      const resultShort = validateRegister({
        ...validRegisterInput,
        password: "123456",
        confirmPassword: "123456",
      });
      expect(resultShort).toBe("Mật khẩu phải có ít nhất 7 ký tự.");
    });

    it("should return error message when password mismatch", () => {
      const result = validateRegister({
        ...validRegisterInput,
        confirmPassword: "differentpassword",
      });
      expect(result).toBe("Mật khẩu xác nhận không khớp!");
    });

    it("should return error message when role is invalid", () => {
      const result = validateRegister({
        ...validRegisterInput,
        role: "admin",
      });
      expect(result).toBe("Vai trò chọn không hợp lệ.");
    });

    it("should return error message when name is too long", () => {
      const result = validateRegister({
        ...validRegisterInput,
        name: "a".repeat(256),
      });
      expect(result).toBe("Họ tên không được vượt quá 255 ký tự.");
    });

    it("should return error message when email is too long", () => {
      const result = validateRegister({
        ...validRegisterInput,
        email: "a".repeat(256) + "@example.com",
      });
      expect(result).toBe("Email không được vượt quá 255 ký tự.");
    });

    it("should return error message when password is too long", () => {
      const result = validateRegister({
        ...validRegisterInput,
        password: "a".repeat(21),
        confirmPassword: "a".repeat(21),
      });
      expect(result).toBe("Mật khẩu không được vượt quá 20 ký tự.");
    });
  });
});
