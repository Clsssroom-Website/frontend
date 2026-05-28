import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("Authentication Module - End to End Tests", () => {
  
  test.beforeAll(async ({ request }) => {
    // Đăng ký tài khoản học sinh dùng để test đăng nhập
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: {
          name: "Học sinh Seed E2E",
          email: "student_test_e2e@gmail.com",
          password: "Password123",
          role: "student",
        },
      });
    } catch (e) {
      // Bỏ qua lỗi nếu tài khoản đã tồn tại
    }

    // Đăng ký tài khoản giáo viên dùng để test đăng nhập
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: {
          name: "Giáo viên Seed E2E",
          email: "teacher_test_e2e@gmail.com",
          password: "Password123",
          role: "teacher",
        },
      });
    } catch (e) {
      // Bỏ qua lỗi nếu tài khoản đã tồn tại
    }
  });

  test.beforeEach(async ({ page }) => {
    // Di chuyển đến trang login trước mỗi test case
    await page.goto(`${BASE_URL}/login`);
  });

  test("TC-AUTH-001: Đăng nhập thành công với tài khoản học sinh hợp lệ", async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator("h2")).toContainText("Đăng nhập vào SmartClass");

    await page.fill('input[name="email"]', "student_test_e2e@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button[type="submit"]');

    // Chờ chuyển hướng đến trang Dashboard của học sinh
    await page.waitForURL(/.*student\/dashboard/);
    await expect(page).toHaveURL(/.*student\/dashboard/);
  });

  test("TC-AUTH-002: Đăng nhập thành công với tài khoản giáo viên hợp lệ", async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', "teacher_test_e2e@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button[type="submit"]');

    // Chờ chuyển hướng đến trang Dashboard của giáo viên
    await page.waitForURL(/.*teacher\/dashboard/);
    await expect(page).toHaveURL(/.*teacher\/dashboard/);
  });

  test("TC-AUTH-003: Đăng nhập thất bại do thông tin không chính xác", async ({ page }) => {
    await page.fill('input[name="email"]', "invalid_user@gmail.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Kiểm tra thông báo lỗi hiển thị trên giao diện
    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Email hoặc mật khẩu không chính xác|không tồn tại|không đúng/i);
  });

  test("TC-AUTH-004: Đăng ký thành công tài khoản học sinh mới", async ({ page }) => {
    await page.click("text=tạo tài khoản mới");
    await page.waitForURL(/.*register/);

    // Click chọn vai trò Student
    const studentCard = page.locator("button:has-text('Student')");
    await studentCard.click();
    await expect(studentCard).toHaveClass(/border-indigo-600/);

    // Điền form đăng ký
    const randomEmail = `test_student_${Date.now()}@gmail.com`;
    await page.fill('input[name="name"]', "Học sinh Tự động");
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    await page.click('button[type="submit"]');

    // Chờ thông báo đăng ký thành công và chuyển hướng đến trang login
    await expect(page.locator("text=Đăng ký thành công")).toBeVisible();
    await page.waitForURL(/.*login/);
  });

  test("TC-AUTH-005: Đăng ký thành công tài khoản giáo viên mới", async ({ page }) => {
    await page.click("text=tạo tài khoản mới");
    await page.waitForURL(/.*register/);

    // Click chọn vai trò Teacher
    const teacherCard = page.locator("button:has-text('Teacher')");
    await teacherCard.click();
    await expect(teacherCard).toHaveClass(/border-indigo-600/);

    // Điền form đăng ký
    const randomEmail = `test_teacher_${Date.now()}@gmail.com`;
    await page.fill('input[name="name"]', "Giáo viên Tự động");
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    await page.click('button[type="submit"]');

    // Chờ thông báo đăng ký thành công và chuyển hướng đến trang login
    await expect(page.locator("text=Đăng ký thành công")).toBeVisible();
    await page.waitForURL(/.*login/);
  });

  test("TC-AUTH-006: Đăng ký thất bại khi mật khẩu xác nhận không khớp", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', "Học sinh lỗi pass");
    await page.fill('input[name="email"]', "error_pass@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password456");

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Mật khẩu xác nhận không khớp!");
  });

  test("TC-AUTH-008: Đăng ký thất bại khi bỏ trống họ tên", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="email"]', "test_email@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Họ tên không được để trống.");
  });

  test("TC-AUTH-009: Đăng ký thất bại khi bỏ trống email", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', "Học sinh Test");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Vui lòng nhập địa chỉ email.");
  });

  test("TC-AUTH-010: Đăng ký thất bại khi định dạng email không hợp lệ", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', "Học sinh Test");
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Email không hợp lệ.");
  });

  test("TC-AUTH-011: Đăng ký thất bại khi bỏ trống mật khẩu", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', "Học sinh Test");
    await page.fill('input[name="email"]', "test_email@gmail.com");

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Vui lòng nhập mật khẩu.");
  });

  test("TC-AUTH-012: Đăng ký thất bại khi mật khẩu ngắn hơn 7 ký tự", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', "Học sinh Test");
    await page.fill('input[name="email"]', "test_email@gmail.com");
    await page.fill('input[name="password"]', "123456");
    await page.fill('input[name="confirmPassword"]', "123456");

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Mật khẩu phải có ít nhất 7 ký tự.");
  });

  test("TC-AUTH-013: Đăng ký thất bại khi mật khẩu dài hơn 20 ký tự", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', "Học sinh Test");
    await page.fill('input[name="email"]', "test_email@gmail.com");
    await page.fill('input[name="password"]', "1".repeat(21));
    await page.fill('input[name="confirmPassword"]', "1".repeat(21));

    await page.click('button[type="submit"]');

    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Mật khẩu không được vượt quá 20 ký tự.");
  });

  test("TC-AUTH-014: Đăng xuất khỏi hệ thống thành công", async ({ page }) => {
    await page.fill('input[name="email"]', "student_test_e2e@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Tìm và click nút Đăng xuất
    const logoutBtn = page.locator("button:has-text('Đăng xuất'), a:has-text('Đăng xuất'), [title='Đăng xuất']");
    await logoutBtn.click();

    await page.waitForURL(/.*login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
