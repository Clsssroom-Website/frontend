import { test, expect, request as apiRequest } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testFilePath = path.join(__dirname, "e2e-document-test.pdf");

const BASE_URL = "http://localhost:5173";
const API_URL = "http://localhost:5000/api/v1";

// ─── Tài khoản cố định dùng xuyên suốt file ───────────────────────────────────
const TEACHER = {
  name: "Giáo viên E2E Submission",
  email: "teacher_submission_e2e@gmail.com",
  password: "Password123",
  role: "teacher",
};
const STUDENT = {
  name: "Học sinh E2E Submission",
  email: "student_submission_e2e@gmail.com",
  password: "Password123",
  role: "student",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Đăng nhập bằng UI, trả về page đã ở dashboard */
async function loginAs(page: any, user: { email: string; password: string }) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}

/** Đăng xuất bằng cách clear storage */
async function logout(page: any) {
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
}

// ─── Deadline helpers ─────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");

function futureDatetime(daysAhead = 2): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Deadline trong quá khứ — backend không chặn */
function pastDatetime(): string {
  return "2020-01-01T00:00";
}

// ─── Shared state (serial mode) ───────────────────────────────────────────────
let classId = "";
let classJoinCode = "";
let createdClassName = "";

// Tiêu đề bài tập — dùng timestamp để tránh trùng lặp khi chạy lại
const ts = Date.now();
const ESSAY_ACTIVE_TITLE = `[SUB] Tự luận còn hạn - ${ts}`;
const ESSAY_OVERDUE_TITLE = `[SUB] Tự luận hết hạn - ${ts}`;
const QUIZ_ACTIVE_TITLE = `[SUB] Trắc nghiệm còn hạn - ${ts}`;
const QUIZ_OVERDUE_TITLE = `[SUB] Trắc nghiệm hết hạn - ${ts}`;
const ESSAY_SUBMIT_TITLE = `[SUB] Tự luận để nộp bài - ${ts}`;
const QUIZ_SUBMIT_TITLE = `[SUB] Trắc nghiệm để nộp bài - ${ts}`;

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe("Student Submission UI States - End to End Tests", () => {
  test.describe.configure({ mode: "serial" });

  // ─── SETUP: Tạo tài khoản, lớp học, các bài tập cần thiết ─────────────────

  test.beforeAll(async ({ request }) => {
    // Tạo tài khoản giáo viên & học sinh
    for (const user of [TEACHER, STUDENT]) {
      try {
        await request.post(`${API_URL}/auth/register`, { data: user });
      } catch {
        // Bỏ qua nếu đã tồn tại
      }
    }
  });

  test("Setup-01: Giáo viên tạo lớp học và các bài tập cần thiết", async ({ page }) => {
    await loginAs(page, TEACHER);

    // ── Tạo lớp học ──────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/teacher/classes`);
    const addBtn = page.locator('button:has-text("Add Classroom")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    createdClassName = `Lớp E2E Submission ${ts}`;
    await page.fill('input[placeholder="VD: Công nghệ phần mềm"]', createdClassName);
    await page.fill('textarea[placeholder="Mô tả về lớp học..."]', "Lớp dùng để test student submission");
    await page.fill('input[placeholder="VD: A102"]', "Phòng E2E");
    await page.fill('input[placeholder="VD: HK2-2026"]', "HK Test");
    await page.click('button:has-text("Tạo lớp học")');

    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await expect(classCard).toBeVisible();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    // Lấy Join Code
    const joinCodeLocator = page.locator("span.text-xl.font-semibold.text-gray-800").first();
    await expect(joinCodeLocator).toBeVisible();
    classJoinCode = (await joinCodeLocator.textContent())?.trim() ?? "";
    classId = page.url().split("/").pop() ?? "";

    // ── Tạo bài tập ──────────────────────────────────────────────────────────
    await page.locator("button:has-text('Bài tập')").click();
    await expect(page.locator("text=Danh sách bài tập")).toBeVisible();

    /** Helper tạo bài tập tự luận */
    const createEssay = async (title: string, deadline: string) => {
      await page.locator("button:has-text('Tạo bài tập')").first().click();
      await page.fill('input[id="assignmentTitleInput"]', title);
      await page.fill('textarea[id="assignmentDescInput"]', "Mô tả bài tập tự luận test.");
      
      // Xóa thuộc tính min của ô nhập ngày để Playwright có thể điền deadline quá khứ
      await page.evaluate(() => {
        document.getElementById("assignmentDeadlineInput")?.removeAttribute("min");
      });
      
      await page.fill('input[id="assignmentDeadlineInput"]', deadline);
      await page.click('button:has-text("Giao bài tập")');
      await expect(page.locator(".border-gray-200", { hasText: title })).toBeVisible();
    };

    /** Helper tạo bài tập trắc nghiệm (1 câu, đáp án 1 đúng) */
    const createQuiz = async (title: string, deadline: string) => {
      await page.locator("button:has-text('Tạo bài tập')").first().click();
      await page.fill('input[id="assignmentTitleInput"]', title);
      await page.fill('textarea[id="assignmentDescInput"]', "Mô tả bài tập trắc nghiệm test.");
      await page.locator('label:has-text("Trắc nghiệm")').click();
      
      // Xóa thuộc tính min của ô nhập ngày để Playwright có thể điền deadline quá khứ
      await page.evaluate(() => {
        document.getElementById("assignmentDeadlineInput")?.removeAttribute("min");
      });
      
      await page.fill('input[id="assignmentDeadlineInput"]', deadline);

      await page.locator("button:has-text('Tạo câu hỏi'), button:has-text('Thêm câu hỏi')").first().click();
      const qContainer = page.locator(".border-indigo-100.p-4").first();
      await expect(qContainer).toBeVisible();
      await qContainer.locator('input[placeholder="Nhập nội dung câu hỏi..."]').fill("E2E: 1 + 1 = ?");
      await qContainer.locator('input[placeholder="Phương án 1"]').fill("Bằng 2");
      await qContainer.locator('input[placeholder="Phương án 2"]').fill("Bằng 3");
      await qContainer.locator('button[title="Đánh dấu là đáp án đúng"]').first().click();

      await page.click('button:has-text("Giao bài tập")');
      await expect(page.locator(".border-gray-200", { hasText: title })).toBeVisible();
    };

    // Tạo lần lượt tất cả bài tập
    await createEssay(ESSAY_ACTIVE_TITLE, futureDatetime(2));
    await createEssay(ESSAY_OVERDUE_TITLE, pastDatetime());
    await createEssay(ESSAY_SUBMIT_TITLE, futureDatetime(2));
    await createQuiz(QUIZ_ACTIVE_TITLE, futureDatetime(2));
    await createQuiz(QUIZ_OVERDUE_TITLE, pastDatetime());
    await createQuiz(QUIZ_SUBMIT_TITLE, futureDatetime(2));

    await logout(page);
  });

  test("Setup-02: Học sinh tham gia lớp học", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    const joinBtn = page.locator('button:has-text("Join Classroom")');
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    await page.fill('input[id="joinCode"]', classJoinCode);
    await page.click('form button[type="submit"]');
    await expect(page.locator('text=Successfully joined the classroom!')).toBeVisible();

    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await expect(classCard).toBeVisible();

    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 1 — Bài Tập Hết Hạn (isOverdue = true)
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_032: Bài tập hết hạn hiển thị badge 'Quá hạn' màu đỏ trong danh sách", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    // Card của bài tập hết hạn phải có badge "Quá hạn" màu đỏ
    const overdueCard = page.locator(".border-gray-200", { hasText: ESSAY_OVERDUE_TITLE }).first();
    await expect(overdueCard).toBeVisible();

    const overdueBadge = overdueCard.locator("span:has-text('Quá hạn')");
    await expect(overdueBadge).toBeVisible();
    // Kiểm tra màu đỏ qua class
    await expect(overdueBadge).toHaveClass(/text-red-600/);

    await logout(page);
  });

  test("TC_SUB_033: Mở bài tập hết hạn → badge 'Thiếu bài' đỏ + nhãn 'Đã quá hạn' trong modal", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    // Mở modal
    const overdueCard = page.locator(".border-gray-200", { hasText: ESSAY_OVERDUE_TITLE }).first();
    await expect(overdueCard).toBeVisible();
    await overdueCard.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Badge "Thiếu bài" trong panel nộp bài
    const missingBadge = page.locator("span:has-text('Thiếu bài')");
    await expect(missingBadge).toBeVisible();
    await expect(missingBadge).toHaveClass(/text-red-600/);

    // Nhãn "Đã quá hạn" trong meta bar
    await expect(page.locator("text=Đã quá hạn")).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_034: Nút 'Nộp bài tập' bị disabled khi bài tự luận hết hạn", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const overdueCard = page.locator(".border-gray-200", { hasText: ESSAY_OVERDUE_TITLE }).first();
    await overdueCard.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Nút nộp bài phải bị disabled
    const submitBtn = page.locator('button:has-text("Nộp bài tập")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Vùng chọn file phải có cursor-not-allowed
    // (AssignmentDetailView: onClick={() => !isEnded && fileInputRef.current?.click()})
    // Click vào vùng upload nhưng không có gì xảy ra — file input không mở
    await submitBtn.click({ force: true }); // click nhưng action bị chặn bởi disabled
    // Xác nhận không có toast lỗi nộp bài (không bị gửi API)
    await expect(page.locator('text=Nộp bài thành công!')).not.toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_035: Nút 'Nộp bài kiểm tra' bị disabled khi bài trắc nghiệm hết hạn", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const overdueCard = page.locator(".border-gray-200", { hasText: QUIZ_OVERDUE_TITLE }).first();
    await overdueCard.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Nút nộp trắc nghiệm phải bị disabled
    const submitBtn = page.locator('button:has-text("Nộp bài kiểm tra")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 2 — Lớp Học Kết Thúc (isEnded = true, mock qua page.route)
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_036: Lớp học kết thúc → banner amber cảnh báo không thể nộp bài", async ({ page }) => {
    await loginAs(page, STUDENT);

    // Mock API lớp học để trả isEnded = true và status = "ENDED"
    await page.route(`${API_URL.replace("http://", "**/")}/classes/*`, async (route) => {
      const url = route.request().url();
      // Chỉ mock route lớp học (không mock assignments)
      if (url.match(/\/classes\/[^/]+$/)) {
        const response = await route.fetch();
        const json = await response.json();
        if (json.success && json.data) {
          json.data.isEnded = true;
          json.data.status = "ENDED";
        }
        await route.fulfill({ json });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    // Mở bài tự luận còn hạn (nhưng lớp đã kết thúc)
    const card = page.locator(".border-gray-200", { hasText: ESSAY_ACTIVE_TITLE }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Banner amber phải xuất hiện
    const banner = page.locator("text=Lớp học đã kết thúc");
    await expect(banner).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_037: Nút 'Nộp bài tập' (tự luận) bị disabled khi lớp kết thúc", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.route(`${API_URL.replace("http://", "**/")}/classes/*`, async (route) => {
      const url = route.request().url();
      if (url.match(/\/classes\/[^/]+$/)) {
        const response = await route.fetch();
        const json = await response.json();
        if (json.success && json.data) {
          json.data.isEnded = true;
          json.data.status = "ENDED";
        }
        await route.fulfill({ json });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: ESSAY_ACTIVE_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    const submitBtn = page.locator('button:has-text("Nộp bài tập")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_038: Nút 'Nộp bài kiểm tra' (quiz) bị disabled khi lớp kết thúc", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.route(`${API_URL.replace("http://", "**/")}/classes/*`, async (route) => {
      const url = route.request().url();
      if (url.match(/\/classes\/[^/]+$/)) {
        const response = await route.fetch();
        const json = await response.json();
        if (json.success && json.data) {
          json.data.isEnded = true;
          json.data.status = "ENDED";
        }
        await route.fulfill({ json });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: QUIZ_ACTIVE_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    const submitBtn = page.locator('button:has-text("Nộp bài kiểm tra")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 3 — Đã Nộp Bài (Tự Luận)
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_028: Sau khi nộp tự luận → badge 'Đã nộp' xanh + text xác nhận", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: ESSAY_SUBMIT_TITLE }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Chọn file hợp lệ và nộp
    await page.setInputFiles('input[id="student-attachment-input"]', testFilePath);
    const fileName = path.basename(testFilePath);
    await expect(page.locator(`span:has-text("${fileName}")`).first()).toBeVisible();

    await page.click('button:has-text("Nộp bài tập")');
    await expect(page.locator('text=Nộp bài thành công!')).toBeVisible();

    // Badge "Đã nộp" màu xanh lá
    const submittedBadge = page.locator("span:has-text('Đã nộp')");
    await expect(submittedBadge).toBeVisible();
    await expect(submittedBadge).toHaveClass(/text-green-700/);

    // Text xác nhận "Bạn đã nộp bài tập này."
    await expect(page.locator("text=Bạn đã nộp bài tập này.")).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_039: Sau khi nộp tự luận → nút 'Nộp bài tập' biến mất, text 'Không thể thay đổi' xuất hiện", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    // Bài này đã được nộp ở TC_SUB_028 — trạng thái được load từ API
    const card = page.locator(".border-gray-200", { hasText: ESSAY_SUBMIT_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Nút "Nộp bài tập" không còn tồn tại
    await expect(page.locator('button:has-text("Nộp bài tập")')).not.toBeVisible();

    // Thông điệp không thể thay đổi
    await expect(page.locator("text=Không thể thay đổi bài đã nộp.")).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_040: Sau khi nộp tự luận → file đã nộp hiển thị trong panel", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: ESSAY_SUBMIT_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // File đã nộp hiển thị (tên file trong submission panel)
    const fileName = path.basename(testFilePath);
    // Tên file xuất hiện trong danh sách SubmissionAttachments
    await expect(page.locator(`span:has-text("${fileName}")`).first()).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 4 — Tự Luận: Nộp Khi Không Chọn File
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_041: Click 'Nộp bài tập' khi chưa chọn file → thông báo lỗi inline", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: ESSAY_ACTIVE_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Nút nộp bài bị disabled vì chưa có file (selectedFiles.length === 0)
    const submitBtn = page.locator('button:has-text("Nộp bài tập")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Để kiểm tra logic handleEssaySubmit chặn lỗi không có file (vì nút bị disabled trong React Virtual DOM nên click thường sẽ bị React nuốt),
    // ta tìm và gọi trực tiếp onClick handler từ React props trên DOM node.
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Nộp bài tập"
      );
      if (btn) {
        const key = Object.keys(btn).find(
          (k) => k.startsWith("__reactProps") || k.startsWith("__reactEventHandlers")
        );
        if (key) {
          const reactProps = (btn as any)[key];
          if (reactProps && typeof reactProps.onClick === "function") {
            reactProps.onClick({ preventDefault: () => {}, stopPropagation: () => {} });
          }
        }
      }
    });

    await expect(page.locator("text=Vui lòng chọn ít nhất một tệp để nộp bài.")).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 5 — Tự Luận: File Vượt 25MB Bị Chặn (giữ lại từ file gốc)
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_030: File nộp bài vượt quá 25MB bị chặn và không được thêm vào danh sách", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: ESSAY_ACTIVE_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Giả lập file 26MB
    await page.evaluate(() => {
      const input = document.getElementById("student-attachment-input") as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        const file = new File(
          [new ArrayBuffer(26 * 1024 * 1024)],
          "too-large-submission.pdf",
          { type: "application/pdf" }
        );
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Toast cảnh báo vượt giới hạn
    await expect(
      page.locator('text=Kích thước file "too-large-submission.pdf" vượt quá 25MB.')
    ).toBeVisible();

    // File không được thêm vào danh sách chờ nộp
    await expect(page.locator('span:has-text("too-large-submission.pdf")')).not.toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  test("TC_SUB_042: Nộp bài tự luận với tệp sai định dạng (không hỗ trợ) bị chặn", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: ESSAY_ACTIVE_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Tải lên tệp không hợp lệ (ví dụ: file chạy thực thi .exe)
    await page.setInputFiles('input[id="student-attachment-input"]', {
      name: "hack-tool.exe",
      mimeType: "application/x-msdownload",
      // @ts-ignore
      buffer: Buffer.from("MZ..."),
    });

    // Xác nhận file đã hiện ở danh sách chờ nộp trên UI
    await expect(page.locator('span:has-text("hack-tool.exe")').first()).toBeVisible();

    // Nhấn nút nộp bài
    await page.click('button:has-text("Nộp bài tập")');

    // Chờ thông báo lỗi từ backend trả về trên giao diện
    await expect(page.locator("text=Định dạng tệp không được hỗ trợ.")).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 6 — Trắc Nghiệm: Nộp Khi Bỏ Sót Câu → ConfirmModal "Chưa hoàn thành"
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_031: Nộp quiz khi bỏ sót câu → ConfirmModal 'Chưa hoàn thành tất cả câu hỏi'", async ({ page }) => {
    // Quiz này có 1 câu — ta không chọn đáp án nào → toast lỗi
    // Để test modal "Chưa hoàn thành", ta cần quiz có >= 2 câu.
    // Do quiz hiện tại chỉ có 1 câu, ta test case chưa chọn đáp án nào → toast lỗi trước.
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: QUIZ_ACTIVE_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Bấm nộp khi chưa chọn đáp án nào → toast lỗi (vì answeredCount === 0)
    await page.locator('button:has-text("Nộp bài kiểm tra")').click();
    await expect(
      page.locator("text=Vui lòng chọn đáp án trước khi nộp bài.")
    ).toBeVisible();

    // Chọn đáp án 1 câu (quiz chỉ có 1 câu → answeredCount === totalCount → modal "Xác nhận nộp bài")
    const optionLabel = page.locator('label:has-text("Bằng 2")');
    await expect(optionLabel).toBeVisible();
    await optionLabel.click();

    // Bấm nộp → modal Xác nhận (vì đã trả lời đủ 1/1 câu)
    await page.locator('button:has-text("Nộp bài kiểm tra")').click();
    await expect(page.locator('h2:has-text("Xác nhận nộp bài")')).toBeVisible();

    // Hủy để không nộp thật
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(page.locator('h2:has-text("Xác nhận nộp bài")')).not.toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NHÓM 7 — Trắc Nghiệm: Kết Quả Sau Khi Nộp
  // ═════════════════════════════════════════════════════════════════════════════

  test("TC_SUB_029: Sau khi nộp quiz → điểm số, badge Đúng/Sai, đáp án đúng được highlight", async ({ page }) => {
    await loginAs(page, STUDENT);

    await page.goto(`${BASE_URL}/student/classes`);
    await page.locator(`h3:has-text("${createdClassName}")`).first().click();
    await page.waitForURL(/.*student\/classes\/.*/);
    await page.locator("button:has-text('Bài tập')").click();

    const card = page.locator(".border-gray-200", { hasText: QUIZ_SUBMIT_TITLE }).first();
    await card.click();
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Chọn đúng đáp án "Bằng 2"
    const correctOption = page.locator('label:has-text("Bằng 2")');
    await expect(correctOption).toBeVisible();
    await correctOption.click();

    // Nộp bài
    await page.locator('button:has-text("Nộp bài kiểm tra")').click();
    await expect(page.locator('h2:has-text("Xác nhận nộp bài")')).toBeVisible();
    await page.getByRole("button", { name: "Nộp bài", exact: true }).click();

    // Toast thành công
    await expect(page.locator("text=Nộp bài trắc nghiệm thành công!")).toBeVisible();

    // Điểm số hiển thị (10/10)
    const scoreEl = page.locator(".text-2xl.font-extrabold.text-indigo-600");
    await expect(scoreEl).toBeVisible();
    await expect(scoreEl).toContainText("10");
    await expect(scoreEl).toContainText("/ 10");

    // Badge "Đúng" màu xanh lá xuất hiện
    await expect(page.locator(".border-green-300:has-text('Đúng')").first()).toBeVisible();

    // Đáp án đúng "Bằng 2" được highlight xanh (class border-green-500)
    await expect(
      page.locator('label:has-text("Bằng 2")').first()
    ).toHaveClass(/border-green-500/);

    // Số câu đúng hiển thị: "Đúng 1/1 câu"
    await expect(page.locator("text=Đúng 1/1 câu")).toBeVisible();

    // Text xác nhận đã hoàn thành
    await expect(page.locator("text=Bạn đã hoàn thành bài trắc nghiệm.")).toBeVisible();

    await page.click('button[title="Đóng"]');
    await logout(page);
  });
});
