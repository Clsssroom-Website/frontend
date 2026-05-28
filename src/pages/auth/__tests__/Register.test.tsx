import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../Register";
import { authService } from "../../../services/auth.service";

// Mock authService
vi.mock("../../../services/auth.service", () => ({
  authService: {
    register: vi.fn(),
  },
}));

describe("RegisterPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hiển thị đầy đủ form đăng ký bao gồm lựa chọn vai trò, các trường họ tên, email, mật khẩu và mật khẩu xác nhận", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // Lựa chọn vai trò
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();

    // Các ô nhập liệu
    expect(screen.getByLabelText(/Họ và Tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng ký tài khoản/i })).toBeInTheDocument();
  });

  it("thay đổi vai trò của tài khoản khi người dùng click vào thẻ tương ứng", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const teacherRoleButton = screen.getByRole("button", { name: "👨‍🏫Teacher" });
    const studentRoleButton = screen.getByRole("button", { name: "🧑‍🎓Student" });

    // Kiểm tra lớp CSS active (có chi tiết border-indigo-600)
    expect(studentRoleButton).toHaveClass("border-indigo-600");
    expect(teacherRoleButton).not.toHaveClass("border-indigo-600");

    // Click chọn Teacher
    fireEvent.click(teacherRoleButton);
    expect(teacherRoleButton).toHaveClass("border-indigo-600");
    expect(studentRoleButton).not.toHaveClass("border-indigo-600");
  });

  it("đăng ký học sinh thành công và chuyển hướng đến trang đăng nhập", async () => {
    vi.useFakeTimers();

    vi.mocked(authService.register).mockResolvedValue({
      success: true,
      message: "Đăng ký thành công",
      data: {} as any,
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // Điền thông tin
    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: "Nguyễn Văn Học Sinh" } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "studenta@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "Password123" } });

    // Click nộp form
    fireEvent.click(screen.getByRole("button", { name: /Đăng ký tài khoản/i }));

    // Cho phép tất cả promises và timers chạy xong
    await vi.runAllTimersAsync();

    expect(authService.register).toHaveBeenCalledWith({
      name: "Nguyễn Văn Học Sinh",
      email: "studenta@gmail.com",
      password: "Password123",
      role: "student",
    });
    expect(screen.getByText(/Đăng ký thành công! Đang chuyển hướng đến đăng nhập.../i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("hiển thị lỗi khi mật khẩu xác nhận không khớp và không gọi API đăng ký", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: "Nguyễn Văn Học Sinh" } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "studenta@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "Password456" } }); // không khớp

    fireEvent.click(screen.getByRole("button", { name: /Đăng ký tài khoản/i }));

    await waitFor(() => {
      expect(screen.getByText("Mật khẩu xác nhận không khớp!")).toBeInTheDocument();
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  it("hiển thị thông báo lỗi từ server khi đăng ký thất bại do email đã tồn tại", async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error("Email đã được sử dụng"));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: "Nguyễn Trùng Email" } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "duplicate@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng ký tài khoản/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
      expect(screen.getByText("Email đã được sử dụng")).toBeInTheDocument();
    });
  });

  it("hiển thị lỗi khi họ tên để trống hoặc chỉ có khoảng trắng", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "studenta@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng ký tài khoản/i }));

    await waitFor(() => {
      expect(screen.getByText("Họ tên không được để trống.")).toBeInTheDocument();
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  it("hiển thị lỗi khi email không đúng định dạng", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: "Nguyễn Văn Học Sinh" } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng ký tài khoản/i }));

    await waitFor(() => {
      expect(screen.getByText("Email không hợp lệ.")).toBeInTheDocument();
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  it("hiển thị lỗi khi mật khẩu ngắn hơn 7 ký tự", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Họ và Tên/i), { target: { value: "Nguyễn Văn Học Sinh" } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "studenta@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: "123456" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng ký tài khoản/i }));

    await waitFor(() => {
      expect(screen.getByText("Mật khẩu phải có ít nhất 7 ký tự.")).toBeInTheDocument();
      expect(authService.register).not.toHaveBeenCalled();
    });
  });
});
