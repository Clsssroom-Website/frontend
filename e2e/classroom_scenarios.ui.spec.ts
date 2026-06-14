/**
 * E2E UI Tests — Kịch bản Classroom (TC_CLASS_UI_001 -> TC_CLASS_UI_008)
 *
 * Chạy tuần tự (serial) để kế thừa dữ liệu lớp học được tạo tự động giữa các testcase.
 */

import { test, expect, Page } from "@playwright/test";

const TEACHER = {
  email: "teacher.test@smartclass.dev",
  password: "Test@1234",
};

const STUDENT = {
  email: "student.test@smartclass.dev",
  password: "Test@1234",
};

const ts = Date.now();
const testClassName = `Công nghệ phần mềm UI Test ${ts}`;
let capturedJoinCode = "";

// ── Helper functions ──────────────────────────────────────────────────────────

async function loginAsTeacher(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#email").fill(TEACHER.email);
  await page.locator("#password").fill(TEACHER.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 8000 });
  await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 });
}

async function loginAsStudent(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#email").fill(STUDENT.email);
  await page.locator("#password").fill(STUDENT.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });
  await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 });
}

async function clickTab(page: Page, tabLabel: string) {
  const tabNav = page.locator("div.border-b div.flex.gap-6").first();
  await tabNav.locator("button", { hasText: tabLabel }).click();
}

// ── Test Suite ────────────────────────────────────────────────────────────────

test.describe("🏫 E2E UI Tests — Kịch bản quản lý lớp học", () => {
  // Đảm bảo chạy tuần tự để truyền dữ liệu (joinCode) giữa các TC
  test.describe.configure({ mode: "serial" });

  // TC_CLASS_UI_001
  test("TC_CLASS_UI_001 — Giáo viên tạo lớp học mới thành công", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");
    await expect(page).toHaveURL(/\/teacher\/classes/);

    // Click "Add Classroom"
    await page.getByRole("button", { name: "Add Classroom" }).click();

    // Điền form
    await page.locator("input[placeholder='VD: Công nghệ phần mềm']").fill(testClassName);
    await page.locator("textarea[placeholder='Mô tả về lớp học...']").fill("Lớp lý thuyết");
    await page.locator("input[placeholder='VD: A102']").fill("A102");
    await page.locator("input[placeholder='VD: HK2-2026']").fill("HK2-2026");

    // Click Tạo lớp
    await page.getByRole("button", { name: "Tạo lớp học" }).click();

    // Chờ toast thành công và lớp mới hiển thị
    await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(testClassName)).toBeVisible({ timeout: 8000 });
  });

  // TC_CLASS_UI_002
  test("TC_CLASS_UI_002 — Tạo lớp học thất bại do trống trường bắt buộc", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Click "Add Classroom"
    await page.getByRole("button", { name: "Add Classroom" }).click();

    // Để trống Tên lớp, chỉ điền Chủ đề
    await page.locator("input[placeholder='VD: HK2-2026']").fill("Toán học");

    // Click Tạo lớp học
    await page.getByRole("button", { name: "Tạo lớp học" }).click();

    // Form bị chặn và hiển thị thông báo lỗi
    await expect(page.getByText("Tên lớp không được để trống.")).toBeVisible();

    // Đóng modal
    await page.locator("button[title='Đóng']").click();
  });

  // TC_CLASS_UI_003
  test("TC_CLASS_UI_003 — Tìm kiếm lớp học", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    const searchInput = page.locator("input[placeholder*='Search']").first();
    await searchInput.fill(testClassName);
    await page.waitForTimeout(700); // Debounce 500ms + buffer

    // Hiển thị lớp vừa tìm kiếm
    await expect(page.getByText(testClassName)).toBeVisible();
  });

  // TC_CLASS_UI_004
  test("TC_CLASS_UI_004 — Sao chép liên kết tham gia nhanh", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Tìm card của lớp vừa tạo
    const classCard = page.locator("div.bg-white", {
      has: page.locator("h3", { hasText: testClassName }),
    });

    // Trích xuất mã mời để dùng cho testcase tham gia lớp
    const codeText = await classCard.getByText(/Mã mời:/).innerText();
    capturedJoinCode = codeText.replace("Mã mời:", "").trim();
    expect(capturedJoinCode.length).toBeGreaterThan(0);

    // Click "Copy link"
    await classCard.locator("button", { hasText: "Copy link" }).click();

    // Toast hiển thị thành công
    await expect(page.getByText("Mã mời đã được copy!")).toBeVisible();
  });

  // TC_CLASS_UI_007
  test("TC_CLASS_UI_007 — Học sinh tham gia lớp thất bại do sai mã", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/classes");

    // Bấm Join Classroom
    await page.getByRole("button", { name: /tham gia|join|nhập mã/i }).click();

    // Nhập sai mã
    await page.locator("#joinCode").fill("SAICODE99");
    await page.locator("form button[type='submit']").click();

    // Đợi hiển thị toast lỗi
    await expect(
      page.getByText(/Không tìm thấy lớp học|An error occurred|không tồn tại|error/i)
    ).toBeVisible({ timeout: 5000 });
  });

  // TC_CLASS_UI_006
  test("TC_CLASS_UI_006 — Học sinh tham gia lớp học thành công bằng mã", async ({ page }) => {
    expect(capturedJoinCode.length).toBeGreaterThan(0);

    await loginAsStudent(page);
    await page.goto("/student/classes");

    // Bấm Join Classroom
    await page.getByRole("button", { name: /tham gia|join|nhập mã/i }).click();

    // Nhập mã mời đã copy của lớp mới tạo
    await page.locator("#joinCode").fill(capturedJoinCode);
    await page.locator("form button[type='submit']").click();

    // Đợi hiển thị toast thành công
    await expect(
      page.getByText(/Successfully joined the classroom!|thành công/i)
    ).toBeVisible({ timeout: 8000 });
  });

  // TC_CLASS_UI_011
  test("TC_CLASS_UI_011 — Cảnh báo khi nhập mã của lớp đã tham gia", async ({ page }) => {
    expect(capturedJoinCode.length).toBeGreaterThan(0);

    await loginAsStudent(page);
    await page.goto("/student/classes");

    // Bấm Join Classroom
    await page.getByRole("button", { name: /tham gia|join|nhập mã/i }).click();

    // Nhập lại mã mời đã tham gia trước đó
    await page.locator("#joinCode").fill(capturedJoinCode);
    await page.locator("form button[type='submit']").click();

    // Hiển thị thông báo "Bạn đã tham gia lớp học này rồi"
    await expect(page.getByText(/Bạn đã tham gia lớp học này rồi/i)).toBeVisible({ timeout: 8000 });
  });

  // TC_CLASS_UI_008
  test("TC_CLASS_UI_008 — Giáo viên trục xuất học sinh khỏi lớp học", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Vào chi tiết lớp học vừa tạo
    await page.locator("h3", { hasText: testClassName }).first().click();
    await expect(page).toHaveURL(/\/teacher\/classes\/.+/);

    // Chuyển sang tab Danh sách sinh viên
    await clickTab(page, "Danh sách sinh viên");

    // Đợi load danh sách thành viên xong
    await expect(page.getByText("Đang tải danh sách...")).toHaveCount(0, { timeout: 8000 });

    // Trục xuất học sinh (nút Trash icon xóa học sinh đầu tiên)
    const deleteBtn = page.locator("button[title='Xóa học sinh này khỏi lớp']").first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // Xác nhận xóa tại ConfirmModal
    const confirmBtn = page.locator("button", { hasText: /^Xóa$/ });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Thông báo thành công
    await expect(page.getByText("Đã xóa học sinh khỏi lớp thành công.")).toBeVisible({ timeout: 8000 });
  });

  // TC_CLASS_UI_005
  test("TC_CLASS_UI_005 — Giáo viên thực hiện đóng/kết thúc lớp học", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Tìm card của lớp
    const classCard = page.locator("div.bg-white", {
      has: page.locator("h3", { hasText: testClassName }),
    });

    // Bấm Đóng lớp
    await classCard.locator("button", { hasText: "Đóng lớp" }).click();

    // Xác nhận đóng lớp trong modal
    const confirmBtn = page.locator("button", { hasText: "Đóng lớp" }).last();
    await confirmBtn.click();

    // Hiển thị toast thông báo thành công
    await expect(page.getByText("Đóng lớp học thành công!")).toBeVisible({ timeout: 8000 });
  });

  // TC_CLASS_UI_009
  test("TC_CLASS_UI_009 — Hủy và làm sạch Form/Modal (Reset Form)", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Mở form và điền dữ liệu
    await page.getByRole("button", { name: "Add Classroom" }).click();
    const nameInput = page.locator("input[placeholder='VD: Công nghệ phần mềm']");
    await nameInput.fill("Tên lớp viết dở");

    // Nhấp nút "Hủy" để đóng form
    await page.getByRole("button", { name: "Hủy" }).click();

    // Mở lại form tạo lớp học
    await page.getByRole("button", { name: "Add Classroom" }).click();

    // Xác nhận ô nhập trống trơn (đã reset)
    await expect(nameInput).toHaveValue("");

    // Đóng form
    await page.locator("button[title='Đóng']").click();
  });

  // TC_CLASS_UI_010
  test("TC_CLASS_UI_010 — Giới hạn ký tự tối đa (Max-length) cho Tên lớp", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Mở form
    await page.getByRole("button", { name: "Add Classroom" }).click();

    // Điền chuỗi quá 100 ký tự (limit = 100)
    const tooLongName = "A".repeat(101);
    await page.locator("input[placeholder='VD: Công nghệ phần mềm']").fill(tooLongName);

    // Click submit
    await page.getByRole("button", { name: "Tạo lớp học" }).click();

    // Hiển thị cảnh báo lỗi max length
    await expect(page.getByText("Tên lớp không được vượt quá 100 ký tự.")).toBeVisible();

    // Đóng modal
    await page.locator("button[title='Đóng']").click();
  });

  // TC_CLASS_UI_012
  test("TC_CLASS_UI_012 — Giao diện trạng thái rỗng (Empty State) khi tìm kiếm không có kết quả", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");

    // Gõ từ khóa tìm kiếm không tồn tại
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await searchInput.fill("NonExistentClassroomUniqueSearchTerm9999");
    await page.waitForTimeout(700); // Debounce 500ms + buffer

    // Hiển thị dòng thông báo Empty State
    await expect(page.getByText("No classes found matching your criteria.")).toBeVisible();
  });
});
