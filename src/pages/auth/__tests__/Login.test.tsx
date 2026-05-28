import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../Login";
import { authService } from "../../../services/auth.service";
import type { User } from "../../../types/auth.types";

// Mock authService
vi.mock("../../../services/auth.service", () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock useAuthStore state update
const mockSetAuth = vi.fn();
vi.mock("../../../store/useAuthStore", () => {
  return {
    default: {
      getState: () => ({
        setAuth: mockSetAuth,
      }),
      subscribe: vi.fn(),
    },
  };
});

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hiển thị đầy đủ form đăng nhập bao gồm email, mật khẩu và nút submit", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByText(/tạo tài khoản mới/i)).toBeInTheDocument();
  });

  it("đăng nhập thành công và chuyển hướng về trang dashboard tương ứng", async () => {
    vi.useFakeTimers();

    const mockUser: User = { userId: "user-1", name: "Giáo viên A", email: "teacher@gmail.com", role: "teacher" };
    const mockToken = "mock-access-token";

    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        accessToken: mockToken,
        user: mockUser,
      } as any,
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Điền thông tin đăng nhập
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "teacher@gmail.com" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: "12345678" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    // Cho phép tất cả promises và timers chạy xong
    await vi.runAllTimersAsync();

    expect(authService.login).toHaveBeenCalledWith("teacher@gmail.com", "12345678");
    expect(mockSetAuth).toHaveBeenCalledWith(mockUser, mockToken);
    expect(screen.getByText(/Đăng nhập thành công! Đang chuyển hướng.../i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("hiển thị lỗi khi đăng nhập không thành công do sai thông tin", async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error("Email hoặc mật khẩu không chính xác"));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "wrong@gmail.com" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith("wrong@gmail.com", "12345678");
      expect(screen.getByText("Email hoặc mật khẩu không chính xác")).toBeInTheDocument();
      expect(mockSetAuth).not.toHaveBeenCalled();
    });
  });

  it("hiển thị lỗi khi API phản hồi thiếu dữ liệu user hoặc token", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      message: "Thiếu dữ liệu",
      data: {
        accessToken: "",
        user: null as any,
      } as any,
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "teacher@gmail.com" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText("Không nhận được dữ liệu hợp lệ. Vui lòng thử lại.")).toBeInTheDocument();
      expect(mockSetAuth).not.toHaveBeenCalled();
    });
  });

  it("hiển thị lỗi client-side khi email để trống hoặc chỉ có khoảng trắng", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText("Vui lòng nhập địa chỉ email.")).toBeInTheDocument();
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  it("hiển thị lỗi client-side khi email không đúng định dạng", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText("Email không hợp lệ.")).toBeInTheDocument();
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  it("hiển thị lỗi client-side khi mật khẩu để trống", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: "teacher@gmail.com" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();
      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});
