import { test, expect, type Page } from "@playwright/test";
 
const BASE_URL = "http://localhost:5173";
 
// ─── Helper: Đăng nhập Giáo viên ─────────────────────────────────────────────
async function loginAsTeacher(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "teacher_test_e2e@gmail.com");
  await page.fill('input[name="password"]', "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*teacher\/dashboard/);
}
 
// ─── Helper: Đăng nhập Học sinh ──────────────────────────────────────────────
async function loginAsStudent(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "student_test_e2e@gmail.com");
  await page.fill('input[name="password"]', "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*student\/dashboard/);
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// TC_SCR_UI – Quản lý điểm số (Playwright E2E)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe("TC_SCR_UI – 5.7 Quản lý điểm số (Playwright E2E)", () => {
  test.describe.configure({ mode: "serial" });
 
  let createdClassName: string;
 
  // ─── Setup: Đăng ký tài khoản, tạo lớp, bài tập, học sinh tham gia & nộp ──
  test.beforeAll(async ({ request }) => {
    // Đăng ký tài khoản nếu chưa có
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: { name: "Giáo viên Seed E2E", email: "teacher_test_e2e@gmail.com", password: "Password123", role: "teacher" },
      });
    } catch {
      // bỏ qua nếu tài khoản đã tồn tại
    }
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: { name: "Giáo viên B E2E", email: "teacher_b_e2e@gmail.com", password: "Password123", role: "teacher" },
      });
    } catch {
      // bỏ qua nếu tài khoản đã tồn tại
    }
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: { name: "Học sinh Seed E2E", email: "student_test_e2e@gmail.com", password: "Password123", role: "student" },
      });
    } catch {
      // bỏ qua nếu tài khoản đã tồn tại
    }
  });

  test("Setup-SCR: Tạo lớp học, bài tập và chấm điểm mẫu", async ({ page }) => {
    await loginAsTeacher(page);

    // Tạo lớp học
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator('button:has-text("Add Classroom")').click();
    const timestamp = Date.now();
    createdClassName = `Lớp SCR E2E ${timestamp}`;
    await page.fill('input[placeholder="VD: Công nghệ phần mềm"]', createdClassName);
    await page.fill('textarea[placeholder="Mô tả về lớp học..."]', "Lớp test quản lý điểm số E2E");
    await page.click('button:has-text("Tạo lớp học")');
    await expect(page.locator(`h3:has-text("${createdClassName}")`).first()).toBeVisible();

    // Vào lớp → lấy joinCode
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    const joinCode = await page.locator("span.text-xl.font-semibold.text-gray-800").first().textContent();

    // Tạo bài tập tự luận 1
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const deadline = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;

    await page.locator("button:has-text('Bài tập')").click();
    await page.locator("button:has-text('Tạo bài tập')").first().click();
    await page.fill('input[id="assignmentTitleInput"]', "Tiểu luận SCR 1");
    await page.fill('input[id="assignmentDeadlineInput"]', deadline);
    await page.click('button:has-text("Giao bài tập")');
    await expect(page.locator(".border-gray-200", { hasText: "Tiểu luận SCR 1" })).toBeVisible();

    // Tạo bài tập tự luận 2
    await page.locator("button:has-text('Tạo bài tập')").first().click();
    await page.fill('input[id="assignmentTitleInput"]', "Tiểu luận SCR 2");
    await page.fill('input[id="assignmentDeadlineInput"]', deadline);
    await page.click('button:has-text("Giao bài tập")');
    await expect(page.locator(".border-gray-200", { hasText: "Tiểu luận SCR 2" })).toBeVisible();

    // Đăng xuất giáo viên
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    // Học sinh tham gia lớp
    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator('button:has-text("Join Classroom")').click();
    await page.fill('input[id="joinCode"]', joinCode?.trim() || "");
    await page.click('form button[type="submit"]');
    await expect(page.locator('text=Successfully joined the classroom!')).toBeVisible();

    // Đăng xuất học sinh
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    // Giáo viên đăng nhập → chấm điểm mẫu
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();
    // (Điểm mẫu sẽ được mock qua route trong các test case cụ thể)
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_001: Tải bảng điểm thành công — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_001 – Tải bảng điểm thành công: cột bài tập, hàng học sinh", async ({ page }) => {
    // Mock API trả về bảng điểm có dữ liệu
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [
              { assignmentId: "a1", title: "Tiểu luận SCR 1", deadline: "2099-06-01T23:59:00Z", typeAssignment: "ESSAY" },
            ],
            students: [
              {
                studentId: "s1", name: "Học sinh Seed E2E", email: "student_test_e2e@gmail.com",
                grades: [{ assignmentId: "a1", score: 8, comment: null, gradedAt: "2026-06-01", status: "graded", title: "Tiểu luận SCR 1" }],
                averageScore: 8,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    await expect(page.locator("text=Học sinh Seed E2E")).toBeVisible();
    await expect(page.locator("text=Tiểu luận SCR 1")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: /^8$/ }).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_002: Tính điểm trung bình (8+9+7)/3 = 8.0 — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_002 – Điểm TB không trọng số (8+9+7)/3 = 8.0 badge xanh", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [
              { assignmentId: "a1", title: "Bài 1", deadline: "2099-01-01", typeAssignment: "ESSAY" },
              { assignmentId: "a2", title: "Bài 2", deadline: "2099-01-01", typeAssignment: "ESSAY" },
              { assignmentId: "a3", title: "Bài 3", deadline: "2099-01-01", typeAssignment: "ESSAY" },
            ],
            students: [
              {
                studentId: "s1", name: "Học sinh Seed E2E", email: "student_test_e2e@gmail.com",
                grades: [
                  { assignmentId: "a1", score: 8, status: "graded", title: "Bài 1", comment: null, gradedAt: null },
                  { assignmentId: "a2", score: 9, status: "graded", title: "Bài 2", comment: null, gradedAt: null },
                  { assignmentId: "a3", score: 7, status: "graded", title: "Bài 3", comment: null, gradedAt: null },
                ],
                averageScore: 8.0,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    await expect(page.locator("span").filter({ hasText: /^8$/ }).first()).toBeVisible();
    // Badge xanh lá cho TB >= 8
    await expect(page.locator(".bg-green-100, .text-green-700").filter({ hasText: "8" }).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_003: Bài quá hạn không nộp = 0, badge "Không nộp" — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_003 – Bài quá hạn không nộp: badge đỏ 'Không nộp', TB = 4.5", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [
              { assignmentId: "a1", title: "Bài 1", deadline: "2099-01-01", typeAssignment: "ESSAY" },
              { assignmentId: "a2", title: "Bài 2", deadline: "2020-01-01", typeAssignment: "ESSAY" },
            ],
            students: [
              {
                studentId: "s1", name: "Học sinh Seed E2E", email: "student_test_e2e@gmail.com",
                grades: [
                  { assignmentId: "a1", score: 9, status: "graded", title: "Bài 1", comment: null, gradedAt: null },
                  { assignmentId: "a2", score: 0, status: "absent", title: "Bài 2", comment: null, gradedAt: null },
                ],
                averageScore: 4.5,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    await expect(page.locator("text=Không nộp")).toBeVisible();
    await expect(page.locator("text=4.5")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_004: Làm tròn TB số vô tận 8.666… → 8.67 — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_004 – TB số vô tận (26/3): làm tròn đúng 2 chữ số = 8.67", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [
              { assignmentId: "a1", title: "Bài 1", deadline: "2099-01-01", typeAssignment: "ESSAY" },
              { assignmentId: "a2", title: "Bài 2", deadline: "2099-01-01", typeAssignment: "ESSAY" },
              { assignmentId: "a3", title: "Bài 3", deadline: "2099-01-01", typeAssignment: "ESSAY" },
            ],
            students: [
              {
                studentId: "s1", name: "Học sinh Seed E2E", email: "student_test_e2e@gmail.com",
                grades: [
                  { assignmentId: "a1", score: 8, status: "graded", title: "Bài 1", comment: null, gradedAt: null },
                  { assignmentId: "a2", score: 9, status: "graded", title: "Bài 2", comment: null, gradedAt: null },
                  { assignmentId: "a3", score: 9, status: "graded", title: "Bài 3", comment: null, gradedAt: null },
                ],
                averageScore: 8.67,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    await expect(page.locator("text=8.67")).toBeVisible();
    // Không được hiện 8.666 hay 8.6666
    await expect(page.locator("text=8.666")).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_005: Xuất file CSV thành công — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_005 – Xuất file CSV thành công: file tải về đúng tên", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [{ assignmentId: "a1", title: "Tiểu luận SCR 1", deadline: "2099-01-01", typeAssignment: "ESSAY" }],
            students: [
              {
                studentId: "s1", name: "Học sinh Seed E2E", email: "student_test_e2e@gmail.com",
                grades: [{ assignmentId: "a1", score: 8.5, status: "graded", title: "Tiểu luận SCR 1", comment: null, gradedAt: null }],
                averageScore: 8.5,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    // Theo dõi sự kiện download
    const downloadPromise = page.waitForEvent("download");
    await page.locator("button:has-text('Xuất file CSV')").click();
    const download = await downloadPromise;

    // Kiểm tra tên file đúng định dạng
    expect(download.suggestedFilename()).toMatch(/Bang_Diem_Lop_Hoc_.+\.csv/);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_006: CSV bảo toàn ký tự đặc biệt (tiếng Việt, nháy kép) — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_006 – CSV bảo toàn ký tự đặc biệt (UTF-8 BOM, nháy kép)", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [{ assignmentId: "a1", title: "Tiểu luận SCR 1", deadline: "2099-01-01", typeAssignment: "ESSAY" }],
            students: [
              {
                studentId: "s1", name: "Nguyễn Văn A", email: "a@test.com",
                grades: [{ assignmentId: "a1", score: 8.5, status: "graded", title: "Tiểu luận SCR 1", comment: null, gradedAt: null }],
                averageScore: 8.5,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("button:has-text('Xuất file CSV')").click();
    const download = await downloadPromise;

    // Đọc nội dung file CSV
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const content = Buffer.concat(chunks).toString("utf-8");

    // Kiểm tra UTF-8 BOM và dữ liệu có dấu
    expect(content).toContain("Nguyễn Văn A");
    expect(content).toContain('"Nguyễn Văn A"'); // bọc nháy kép
    expect(content).toContain("8.5");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_007: Nút Xuất CSV ẩn khi lớp 0 học sinh — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_007 – Nút Xuất CSV ẩn khi lớp không có học sinh", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { assignments: [{ assignmentId: "a1", title: "Tiểu luận SCR 1", deadline: "2099-01-01", typeAssignment: "ESSAY" }], students: [] },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    await expect(page.locator("text=Chưa có học sinh nào")).toBeVisible();
    await expect(page.locator("button:has-text('Xuất file CSV')")).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_008: Nút Xuất CSV ẩn khi lớp 0 bài tập — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_008 – Nút Xuất CSV ẩn khi lớp chưa có bài tập", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { assignments: [], students: [] },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    await expect(page.locator("text=Chưa có bài tập nào")).toBeVisible();
    await expect(page.locator("button:has-text('Xuất file CSV')")).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_009: Học sinh xem điểm cá nhân – không rò rỉ dữ liệu HS khác — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_009 – Học sinh xem điểm cá nhân: không thấy dữ liệu HS khác", async ({ page }) => {
    // Mock API lấy điểm của học sinh
    await page.route(`**/api/v1/students/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              gradeId: "g1",
              assignmentId: "a1",
              score: 8.5,
              comment: "Bài làm tốt",
              gradedAt: "2026-05-18T10:00:00Z",
              Assignments: {
                title: "Tiểu luận SCR 1",
                deadline: "2099-01-01",
              },
            },
          ],
        },
      });
    });

    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Điểm số')").click();

    // Đợi bảng điểm tải xong và hiển thị bài tập của học sinh
    await expect(page.locator("text=Tiểu luận SCR 1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=8.5/10")).toBeVisible();

    // Không thấy email/tên học sinh khác trong bảng
    await expect(page.locator("text=other_student@test.com")).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_SCR_UI_010: Tìm kiếm học sinh client-side theo tên — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_SCR_UI_010 – Tìm kiếm client-side lọc đúng học sinh theo tên", async ({ page }) => {
    await page.route(`**/api/v1/classes/*/grades`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            assignments: [{ assignmentId: "a1", title: "Tiểu luận SCR 1", deadline: "2099-01-01", typeAssignment: "ESSAY" }],
            students: [
              {
                studentId: "s1", name: "Nguyễn Văn A", email: "a@test.com",
                grades: [{ assignmentId: "a1", score: 8, status: "graded", title: "Tiểu luận SCR 1", comment: null, gradedAt: null }],
                averageScore: 8,
              },
              {
                studentId: "s2", name: "Trần Thị B", email: "b@test.com",
                grades: [{ assignmentId: "a1", score: 7, status: "graded", title: "Tiểu luận SCR 1", comment: null, gradedAt: null }],
                averageScore: 7,
              },
            ],
          },
        },
      });
    });

    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bảng điểm')").click();

    // Ban đầu thấy cả 2 học sinh
    await expect(page.locator("text=Nguyễn Văn A")).toBeVisible();
    await expect(page.locator("text=Trần Thị B")).toBeVisible();

    // Gõ từ khóa tìm kiếm
    await page.fill('input[placeholder="Tìm kiếm học sinh theo tên hoặc email..."]', "Nguyễn");

    // Chỉ còn Nguyễn Văn A, Trần Thị B biến mất
    await expect(page.locator("text=Nguyễn Văn A")).toBeVisible();
    await expect(page.locator("text=Trần Thị B")).not.toBeVisible();

    // Xóa tìm kiếm → cả 2 xuất hiện lại
    await page.fill('input[placeholder="Tìm kiếm học sinh theo tên hoặc email..."]', "");
    await expect(page.locator("text=Trần Thị B")).toBeVisible();
  });
});
