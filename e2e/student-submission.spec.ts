import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testFilePath = path.join(__dirname, "e2e-document-test.pdf");

const BASE_URL = "http://localhost:5173";

test.describe("Student Assignment Submission - End to End Tests", () => {
  test.describe.configure({ mode: "serial" });

  let createdClassName: string;
  let classJoinCode: string;

  test.beforeAll(async ({ request }) => {
    // Đăng ký tài khoản giáo viên dùng để test đăng nhập
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: {
          name: "Giáo viên Seed E2E Student",
          email: "teacher_student_e2e@gmail.com",
          password: "Password123",
          role: "teacher",
        },
      });
    } catch (e) {
      // Bỏ qua lỗi nếu tài khoản đã tồn tại
    }
    // Đăng ký tài khoản học sinh dùng để test đăng nhập
    try {
      await request.post("http://localhost:5000/api/v1/auth/register", {
        data: {
          name: "Học sinh Seed E2E Student",
          email: "student_student_e2e@gmail.com",
          password: "Password123",
          role: "student",
        },
      });
    } catch (e) {
      // Bỏ qua lỗi nếu tài khoản đã tồn tại
    }
  });

  test("Kiểm thử học sinh nộp bài tập tự luận có dung lượng file vượt quá 25MB bị chặn", async ({ page }) => {
    // --- 1. GIAI ĐOẠN GIÁO VIÊN: TẠO LỚP HỌC VÀ BÀI TẬP ---
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', "teacher_student_e2e@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*teacher\/dashboard/);

    await page.goto(`${BASE_URL}/teacher/classes`);
    
    // Đợi trang load và bấm nút Add Classroom
    const addBtn = page.locator('button:has-text("Add Classroom")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Điền thông tin tạo lớp học
    const timestamp = Date.now();
    createdClassName = `Lớp E2E Student Test ${timestamp}`;
    await page.fill('input[placeholder="VD: Công nghệ phần mềm"]', createdClassName);
    await page.fill('textarea[placeholder="Mô tả về lớp học..."]', "Lớp học tự động tạo để test bài nộp của học sinh");
    await page.fill('input[placeholder="VD: A102"]', "Phòng E2E");
    await page.fill('input[placeholder="VD: HK2-2026"]', "HK Test");

    // Click nút Tạo lớp học
    await page.click('button:has-text("Tạo lớp học")');

    // Chờ lớp học mới xuất hiện trên danh sách và click vào
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await expect(classCard).toBeVisible();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    // Lấy mã mời tham gia lớp học
    const joinCodeLocator = page.locator("span.text-xl.font-semibold.text-gray-800").first();
    await expect(joinCodeLocator).toBeVisible();
    classJoinCode = (await joinCodeLocator.textContent())?.trim() || "";

    // Chuyển sang tab Bài tập
    await page.locator("button:has-text('Bài tập')").click();
    await expect(page.locator("text=Danh sách bài tập")).toBeVisible();

    // Click Tạo bài tập
    await page.locator("button:has-text('Tạo bài tập')").first().click();

    // Nhập thông tin form tạo bài tập
    const essayTitle = `Bài tập tự luận giới hạn 25MB - ${timestamp}`;
    await page.fill('input[id="assignmentTitleInput"]', essayTitle);
    await page.fill('textarea[id="assignmentDescInput"]', "Hướng dẫn làm bài tự luận mẫu giới hạn 25MB.");

    // Chọn hạn nộp là 2 ngày sau
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const deadlineVal = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;
    await page.fill('input[id="assignmentDeadlineInput"]', deadlineVal);

    // Click Giao bài tập
    await page.click('button:has-text("Giao bài tập")');

    // Đợi bài tập hiển thị
    const card = page.locator(".border-gray-200", { hasText: essayTitle });
    await expect(card).toBeVisible();

    // Đăng xuất giáo viên bằng cách clear localStorage và cookies
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    // --- 2. GIAI ĐOẠN HỌC SINH: THAM GIA LỚP VÀ KIỂM TRA FILE > 25MB ---
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', "student_student_e2e@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*student\/dashboard/);

    // Đi tới danh sách lớp học và tham gia lớp mới
    await page.goto(`${BASE_URL}/student/classes`);
    const joinBtn = page.locator('button:has-text("Join Classroom")');
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // Điền mã tham gia lớp học
    await page.fill('input[id="joinCode"]', classJoinCode);
    await page.click('form button[type="submit"]');

    // Đợi thông báo thành công
    await expect(page.locator('text=Successfully joined the classroom!')).toBeVisible();

    // Click vào lớp học vừa tham gia
    const studentClassCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await expect(studentClassCard).toBeVisible();
    await studentClassCard.click();
    await page.waitForURL(/.*student\/classes\/.*/);

    // Chuyển sang tab Bài tập
    await page.locator("button:has-text('Bài tập')").click();

    // Click vào bài tập tự luận
    const studentAssignmentCard = page.locator(".border-gray-200", { hasText: essayTitle }).first();
    await expect(studentAssignmentCard).toBeVisible();
    await studentAssignmentCard.click();

    // Chờ loading biến mất (Hướng dẫn hiển thị)
    await expect(page.locator('h3:has-text("Hướng dẫn")')).toBeVisible();

    // Giả lập chọn file nộp bài vượt quá 25MB (26MB)
    await page.evaluate(() => {
      const input = document.getElementById("student-attachment-input") as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        const file = new File([new ArrayBuffer(26 * 1024 * 1024)], "too-large-submission.pdf", { type: "application/pdf" });
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Xác nhận có toast cảnh báo dung lượng vượt giới hạn
    await expect(page.locator('text=Kích thước file "too-large-submission.pdf" vượt quá 25MB.')).toBeVisible();

    // Xác nhận file không được hiển thị trong danh sách chuẩn bị nộp
    await expect(page.locator('span:has-text("too-large-submission.pdf")')).not.toBeVisible();

    // Đóng modal chi tiết bài tập
    await page.click('button[title="Đóng"]');

    // Đăng xuất học sinh
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  });
});
