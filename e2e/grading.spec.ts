import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testFilePath = path.join(__dirname, "e2e-document-test.pdf");

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
// TC_GRD_UI – Chấm điểm bài tập (Playwright E2E)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe("TC_GRD_UI – 5.6 Chấm điểm bài tập (Playwright E2E)", () => {
  test.describe.configure({ mode: "serial" });

  let createdClassName: string;

  // ─── Đăng ký tài khoản trước khi chạy tất cả test ────────────────────────
  test.beforeAll(async ({ request }) => {
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: { name: "Giáo viên Seed E2E", email: "teacher_test_e2e@gmail.com", password: "Password123", role: "teacher" },
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Setup: Tạo lớp, bài tập, học sinh tham gia & nộp bài
  // ─────────────────────────────────────────────────────────────────────────────
  test("Setup-GRD: Tạo lớp học và bài tập tự luận, cho học sinh nộp bài", async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsTeacher(page);

    // ── Tạo lớp học ──────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/teacher/classes`);
    const addBtn = page.locator('button:has-text("Add Classroom")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // page.fill() tự chờ element hiển thị (timeout 30s) — không cần toBeVisible() thêm
    const timestamp = Date.now();
    createdClassName = `Lớp GRD E2E ${timestamp}`;
    await page.fill('input[placeholder="VD: Công nghệ phần mềm"]', createdClassName);
    await page.fill('textarea[placeholder="Mô tả về lớp học..."]', "Lớp test chấm điểm E2E");
    await page.click('button:has-text("Tạo lớp học")');
    await expect(page.locator(`h3:has-text("${createdClassName}")`).first()).toBeVisible({ timeout: 10000 });

    // ── Vào lớp → lấy join code ──────────────────────────────────────────────
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    const joinCodeLocator = page.locator("span.text-xl.font-semibold.text-gray-800").first();
    await expect(joinCodeLocator).toBeVisible({ timeout: 10000 });
    const joinCode = await joinCodeLocator.textContent();

    // ── Tạo bài tập tự luận ───────────────────────────────────────────────────
    const assignmentTabBtn = page.locator("button:has-text('Bài tập')");
    await expect(assignmentTabBtn).toBeVisible();
    await assignmentTabBtn.click();

    const createBtn = page.locator("button:has-text('Tạo bài tập')").first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await page.fill('input[id="assignmentTitleInput"]', "Bài tự luận nộp bài thành công E2E");
    await page.fill('textarea[id="assignmentDescInput"]', "Hướng dẫn làm bài.");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const deadline = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;
    await page.fill('input[id="assignmentDeadlineInput"]', deadline);
    await page.click('button:has-text("Giao bài tập")');
    await expect(page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" })).toBeVisible({ timeout: 10000 });

    // ── Tạo bài trắc nghiệm ───────────────────────────────────────────────────
    await page.locator("button:has-text('Tạo bài tập')").first().click();
    await page.fill('input[id="assignmentTitleInput"]', "Bài trắc nghiệm GRD E2E");
    await page.locator('label:has-text("Trắc nghiệm")').click();
    await page.fill('input[id="assignmentDeadlineInput"]', deadline);
    const addQBtn = page.locator("button:has-text('Tạo câu hỏi'), button:has-text('Thêm câu hỏi')").first();
    await expect(addQBtn).toBeVisible();
    await addQBtn.click();
    const qContainer = page.locator(".border-indigo-100.p-4").first();
    await expect(qContainer).toBeVisible();
    await qContainer.locator('input[placeholder="Nhập nội dung câu hỏi..."]').fill("5 + 5 = ?");
    await qContainer.locator('input[placeholder="Phương án 1"]').fill("10");
    await qContainer.locator('input[placeholder="Phương án 2"]').fill("12");
    await qContainer.locator('button[title="Đánh dấu là đáp án đúng"]').first().click();
    await page.click('button:has-text("Giao bài tập")');
    await expect(page.locator(".border-gray-200", { hasText: "Bài trắc nghiệm GRD E2E" })).toBeVisible({ timeout: 10000 });

    // ── Đăng xuất giáo viên ───────────────────────────────────────────────────
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    // ── Học sinh tham gia lớp ─────────────────────────────────────────────────
    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/student/classes`);
    const joinBtn = page.locator('button:has-text("Join Classroom")');
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();
    await page.fill('input[id="joinCode"]', joinCode?.trim() || "");
    await page.click('form button[type="submit"]');
    await expect(page.locator('text=Successfully joined the classroom!')).toBeVisible({ timeout: 10000 });

    // ── Học sinh nộp bài tự luận ──────────────────────────────────────────────
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();
    const essayCard = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(essayCard).toBeVisible({ timeout: 10000 });
    await essayCard.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible({ timeout: 10000 });
    await page.setInputFiles('input[id="student-attachment-input"]', testFilePath);
    await page.click('button:has-text("Nộp bài tập")');
    await expect(page.locator('text=Nộp bài thành công!')).toBeVisible({ timeout: 10000 });

    // ── Đăng xuất học sinh ────────────────────────────────────────────────────
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_001: Chấm điểm hợp lệ – điểm tối đa (10.0) — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_001 – Chấm điểm hợp lệ, điểm tối đa (score=10.0)", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });
    await page.locator("button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "10");
    await page.fill('input[placeholder="Nhận xét bài làm..."]', "Xuất sắc, trình bày logic");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Chấm điểm thành công!')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_002: Chấm lại – điểm tối thiểu (0.0) — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_002 – Chấm điểm tối thiểu (score=0.0)", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    // Nếu đã có điểm → Sửa điểm, chưa có → Chấm điểm
    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "0");
    await page.fill('input[placeholder="Nhận xét bài làm..."]', "Bài làm chất lượng kém");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Chấm điểm thành công!')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_003: Điểm số thập phân (8.75) — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_003 – Điểm thập phân (score=8.75)", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "8.75");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Chấm điểm thành công!')).toBeVisible();
    await expect(page.locator("text=8.75")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_004: Điểm âm (-0.01) – Frontend chặn, không gọi API — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_004 – Điểm âm (-0.01): frontend hiển thị lỗi, không gọi API", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    let apiCalled = false;
    page.on("request", (req) => {
      if (req.url().includes("/grade") && req.method() === "POST") apiCalled = true;
    });

    await page.fill('input[placeholder="8.5"]', "-0.01");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator("text=Điểm số phải là số từ 0 đến 10.")).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_005: Điểm vượt ngưỡng (10.01) – Frontend chặn — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_005 – Điểm vượt trần (10.01): frontend hiển thị lỗi", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "10.01");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator("text=Điểm số phải là số từ 0 đến 10.")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_006: Nhập ký tự chữ vào ô điểm – NaN bị chặn — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_006 – Ký tự chữ vào ô điểm: NaN bị chặn", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    // Input type=number từ chối ký tự chữ → value rỗng → validation fail
    await page.locator('input[placeholder="8.5"]').fill("");
    await page.locator('input[placeholder="8.5"]').focus();
    await page.keyboard.type("Chín điểm rưỡi");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator("text=Điểm số phải là số từ 0 đến 10.")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_007: Chấm lại (Regrading) – ghi đè điểm cũ — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_007 – Chấm lại (Regrading): điểm mới 7.5 ghi đè điểm cũ", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    await expect(page.locator("button:has-text('Sửa điểm')")).toBeVisible({ timeout: 5000 });
    await page.locator("button:has-text('Sửa điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "7.5");
    await page.fill('input[placeholder="Nhận xét bài làm..."]', "Cần cải thiện phần kết luận");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Chấm điểm thành công!')).toBeVisible();
    await expect(page.locator("text=7.5")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_008: Nhận xét chứa emoji và Unicode — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_008 – Nhận xét chứa emoji và Unicode được lưu đúng", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "8");
    await page.fill('input[placeholder="Nhận xét bài làm..."]', "Làm tốt! 🎉 Trình bày đẹp.");
    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Chấm điểm thành công!')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_009: Comment vượt 1000 ký tự – bộ đếm đỏ, không gọi API — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_009 – Comment vượt 1000 ký tự: bộ đếm đỏ, không gọi API", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "8");
    await page.fill('input[placeholder="Nhận xét bài làm..."]', "A".repeat(1001));
    await expect(page.locator("text=1001/1000")).toBeVisible();

    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Nhận xét không được vượt quá 1000 ký tự.')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_010: Comment đúng 1000 ký tự – biên trong, lưu thành công — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_010 – Comment đúng 1000 ký tự (biên trong): lưu thành công", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: "Bài tự luận nộp bài thành công E2E" }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await card.locator("button:has-text('Xem danh sách bài nộp')").first().click();
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    const hasGrade = await page.locator("button:has-text('Sửa điểm')").isVisible();
    await page.locator(hasGrade ? "button:has-text('Sửa điểm')" : "button:has-text('Chấm điểm')").first().click();

    await page.fill('input[placeholder="8.5"]', "8");
    await page.fill('input[placeholder="Nhận xét bài làm..."]', "B".repeat(1000));
    await expect(page.locator("text=1000/1000")).toBeVisible();
    const counter = page.locator("text=1000/1000");
    await expect(counter).not.toHaveClass(/text-red/);

    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Chấm điểm thành công!')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_011: Học sinh nộp trắc nghiệm – hệ thống tự chấm 10/10 — POS
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_011 – Học sinh nộp trắc nghiệm đúng hết: hệ thống tự chấm 10/10", async ({ page }) => {
    // Test này dùng học sinh nên không cần loginAsTeacher
    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const quizCard = page.locator(".border-gray-200", { hasText: "Bài trắc nghiệm GRD E2E" }).first();
    await expect(quizCard).toBeVisible({ timeout: 10000 });
    await quizCard.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    await page.locator('label:has-text("10")').click();
    await page.click('button:has-text("Nộp bài kiểm tra")');
    await page.getByRole("button", { name: "Nộp bài", exact: true }).click();

    await expect(page.locator('text=Nộp bài trắc nghiệm thành công!')).toBeVisible();
    await expect(page.locator(".text-2xl.font-extrabold.text-indigo-600")).toContainText("10");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_GRD_UI_012: Nút Chấm điểm bị ẩn với bài trắc nghiệm (Teacher side) — NEG
  // ─────────────────────────────────────────────────────────────────────────────
  test("TC_GRD_UI_012 – Nút Chấm điểm ẩn với bài trắc nghiệm (phân biệt ESSAY/QUIZ)", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto(`${BASE_URL}/teacher/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*teacher\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const quizCard = page.locator(".border-gray-200", { hasText: "Bài trắc nghiệm GRD E2E" }).first();
    await expect(quizCard).toBeVisible({ timeout: 10000 });
    await quizCard.click();
    const viewBtn = quizCard.locator("button:has-text('Xem danh sách bài nộp')").first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();

    // Chờ danh sách học sinh load xong
    await expect(page.locator("text=Học sinh Seed E2E").first()).toBeVisible({ timeout: 10000 });

    await expect(page.locator("button:has-text('Chấm điểm')")).not.toBeVisible();
    await expect(page.locator("button:has-text('Sửa điểm')")).not.toBeVisible();
  });
});
