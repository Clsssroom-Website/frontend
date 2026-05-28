import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testFilePath = path.join(__dirname, "e2e-document-test.pdf");

const BASE_URL = "http://localhost:5173";

test.describe("Teacher Assignment Management - End to End Tests", () => {
  // Chạy các test case tuần tự vì chúng phụ thuộc vào lớp học đã tạo
  test.describe.configure({ mode: "serial" });

  let createdClassName: string;
  let classJoinCode: string;

  test.beforeAll(async ({ request }) => {
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
  });

  test.beforeEach(async ({ page }) => {
    // Đăng nhập giáo viên trước mỗi test case
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', "teacher_test_e2e@gmail.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button[type="submit"]');

    // Chờ chuyển hướng đến dashboard thành công
    await page.waitForURL(/.*teacher\/dashboard/);
  });

  test("Setup: Tạo lớp học mới dùng để test", async ({ page }) => {
    await page.goto(`${BASE_URL}/teacher/classes`);
    
    // Đợi trang load và bấm nút Add Classroom
    const addBtn = page.locator('button:has-text("Add Classroom")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Điền thông tin tạo lớp học
    const timestamp = Date.now();
    createdClassName = `Lớp E2E Test ${timestamp}`;
    await page.fill('input[placeholder="e.g. Quản lý dự án"]', createdClassName);
    await page.fill('textarea[placeholder="Class description..."]', "Lớp học tự động tạo bằng Playwright E2E");
    await page.fill('input[placeholder="e.g. 2A33"]', "Phòng E2E");
    await page.fill('input[placeholder="e.g. HK1-2025"]', "HK Test");

    // Click nút Create Class
    await page.click('button:has-text("Create Class")');

    // Chờ lớp học mới xuất hiện trên danh sách
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await expect(classCard).toBeVisible();
  });

  test("TC-ASSIGNMENT-001: Tạo bài tập tự luận (ESSAY) thành công có tệp đính kèm", async ({ page }) => {
    // Đảm bảo class đã được tạo trước đó
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();

    // Chờ chuyển hướng vào trang chi tiết lớp học
    await page.waitForURL(/.*teacher\/classes\/.*/);

    // Lấy mã mời tham gia lớp học
    const joinCodeLocator = page.locator("span.text-xl.font-semibold.text-gray-800").first();
    await expect(joinCodeLocator).toBeVisible();
    classJoinCode = (await joinCodeLocator.textContent())?.trim() || "";

    // Chuyển sang tab Bài tập
    const classworkTab = page.locator("button:has-text('Bài tập')");
    await classworkTab.click();

    // Chờ danh sách bài tập được load
    await expect(page.locator("text=Danh sách bài tập")).toBeVisible();

    // Click Tạo bài tập
    await page.locator("button:has-text('Tạo bài tập')").first().click();

    // Nhập thông tin form tạo bài tập
    const timestamp = Date.now();
    const essayTitle = `Bài tự luận E2E - ${timestamp}`;
    await page.fill('input[id="assignmentTitleInput"]', essayTitle);
    await page.fill('textarea[id="assignmentDescInput"]', "Hướng dẫn làm bài tự luận mẫu.");

    // Chọn hạn nộp là 2 ngày sau
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const deadlineVal = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;
    await page.fill('input[id="assignmentDeadlineInput"]', deadlineVal);

    // Đính kèm tệp ảo từ file thực tế trên disk
    await page.setInputFiles('input[id="teacher-attachment-input"]', testFilePath);

    // Click Giao bài tập
    await page.click('button:has-text("Giao bài tập")');

    // Kiểm tra card bài tập đã hiển thị ngoài danh sách
    const card = page.locator(".border-gray-200", { hasText: essayTitle });
    await expect(card).toBeVisible();
    await expect(card.locator('span:has-text("Nộp tệp")')).toBeVisible();
    await expect(card.locator("text=0 bài đã nộp")).toBeVisible();
  });

  test("TC-ASSIGNMENT-002: Tạo bài tập trắc nghiệm (MULTIPLE_CHOICE) thành công với câu hỏi và các phương án", async ({ page }) => {
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    await page.locator("button:has-text('Bài tập')").click();
    await page.locator("button:has-text('Tạo bài tập')").first().click();

    const timestamp = Date.now();
    const quizTitle = `Bài trắc nghiệm E2E - ${timestamp}`;
    await page.fill('input[id="assignmentTitleInput"]', quizTitle);
    
    // Chọn loại hình Trắc nghiệm (Click nhãn label để hoạt động tốt hơn)
    await page.locator('label:has-text("Trắc nghiệm")').click();

    // Hạn nộp là 2 ngày sau
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const deadlineVal = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;
    await page.fill('input[id="assignmentDeadlineInput"]', deadlineVal);

    await page.fill('textarea[id="assignmentDescInput"]', "Vui lòng chọn đáp án chính xác.");

    // Thêm câu hỏi
    const addQuestionBtn = page.locator("button:has-text('Tạo câu hỏi'), button:has-text('Thêm câu hỏi')").first();
    await expect(addQuestionBtn).toBeVisible();
    await addQuestionBtn.click();

    // Điền câu hỏi và phương án trả lời (Sử dụng selector .border-indigo-100.p-4 để tránh trùng với header)
    const qContainer = page.locator(".border-indigo-100.p-4").first();
    await expect(qContainer).toBeVisible();
    
    await qContainer.locator('input[placeholder="Nhập nội dung câu hỏi..."]').fill("E2E Test: 5 + 5 bằng bao nhiêu?");
    await qContainer.locator('input[placeholder="Phương án 1"]').fill("Bằng 10");
    await qContainer.locator('input[placeholder="Phương án 2"]').fill("Bằng 12");

    // Đánh dấu phương án 1 là đúng
    await qContainer.locator('button[title="Đánh dấu là đáp án đúng"]').first().click();

    // Click Giao bài tập
    await page.click('button:has-text("Giao bài tập")');

    // Kiểm tra card bài tập đã hiển thị ngoài danh sách
    const card = page.locator(".border-gray-200", { hasText: quizTitle });
    await expect(card).toBeVisible();
    await expect(card.locator('span:has-text("Trắc nghiệm")')).toBeVisible();
  });

  test("TC-ASSIGNMENT-003: Kiểm tra các trường hợp validation lỗi ở form", async ({ page }) => {
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    await page.locator("button:has-text('Bài tập')").click();
    await page.locator("button:has-text('Tạo bài tập')").first().click();

    // Trường hợp 1: Để trống tiêu đề
    await page.fill('input[id="assignmentTitleInput"]', "");
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const deadlineVal = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;
    await page.fill('input[id="assignmentDeadlineInput"]', deadlineVal);

    await page.click('button:has-text("Giao bài tập")');

    // Check alert error message
    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Vui lòng nhập tiêu đề bài tập.");

    // Điền tiêu đề, chọn trắc nghiệm và test lỗi thiếu câu hỏi/đáp án
    await page.fill('input[id="assignmentTitleInput"]', "Bài trắc nghiệm lỗi E2E");
    await page.locator('label:has-text("Trắc nghiệm")').click();
    
    // Chưa thêm câu hỏi nào
    await page.click('button:has-text("Giao bài tập")');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Vui lòng thêm ít nhất một câu hỏi trắc nghiệm.");

    // Thêm câu hỏi nhưng chưa chọn đáp án đúng
    await page.locator("button:has-text('Tạo câu hỏi'), button:has-text('Thêm câu hỏi')").first().click();
    const qContainer = page.locator(".border-indigo-100.p-4").first();
    await expect(qContainer).toBeVisible();
    
    await qContainer.locator('input[placeholder="Nhập nội dung câu hỏi..."]').fill("E2E Test validation: 1 + 1 = ?");
    await qContainer.locator('input[placeholder="Phương án 1"]').fill("2");
    await qContainer.locator('input[placeholder="Phương án 2"]').fill("3");

    await page.click('button:has-text("Giao bài tập")');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Câu hỏi 1 chưa chọn đáp án đúng.");

    // Click Hủy bỏ để thoát form
    await page.click('button:has-text("Hủy bỏ")');
  });

  test("TC-ASSIGNMENT-004: Chỉnh sửa thông tin bài tập (ESSAY) thành công", async ({ page }) => {
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    await page.locator("button:has-text('Bài tập')").click();

    // Tìm bài tập tự luận đã có (hoặc tạo nhanh một bài tập mới để test)
    const cards = page.locator(".border-gray-200");
    const count = await cards.count();
    
    let targetCard = null;
    let originalTitle = "";
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const isEssay = await card.locator('span:has-text("Nộp tệp")').isVisible();
      if (isEssay) {
        targetCard = card;
        originalTitle = (await card.locator("h3").textContent()) || "";
        break;
      }
    }

    // Nếu không tìm thấy bài essay nào, tạo nhanh một bài
    if (!targetCard) {
      originalTitle = `Bài tự luận test chỉnh sửa - ${Date.now()}`;
      await page.locator("button:has-text('Tạo bài tập')").first().click();
      await page.fill('input[id="assignmentTitleInput"]', originalTitle);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const pad = (n: number) => String(n).padStart(2, "0");
      const deadlineVal = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}T${pad(futureDate.getHours())}:${pad(futureDate.getMinutes())}`;
      await page.fill('input[id="assignmentDeadlineInput"]', deadlineVal);
      await page.click('button:has-text("Giao bài tập")');
      targetCard = page.locator(".border-gray-200", { hasText: originalTitle });
    }

    // Nhấn nút Chỉnh sửa
    await targetCard.locator('button[title="Chỉnh sửa"]').click();

    // Đợi Form xuất hiện và cập nhật thông tin
    await expect(page.locator('h2:has-text("Chỉnh sửa bài tập")')).toBeVisible();
    const newTitle = `[Đã chỉnh sửa] ${originalTitle}`;
    await page.fill('input[id="assignmentTitleInput"]', newTitle);
    await page.fill('textarea[id="assignmentDescInput"]', "Mô tả bài tập tự luận sau khi cập nhật.");

    // Lưu thay đổi
    await page.click('button:has-text("Lưu thay đổi")');

    // Xác nhận tiêu đề mới hiển thị trên danh sách
    const updatedCard = page.locator(".border-gray-200", { hasText: newTitle });
    await expect(updatedCard).toBeVisible();
  });

  test("TC-ASSIGNMENT-007: Không cho phép đính kèm tệp vượt quá 25MB khi tạo bài tập", async ({ page }) => {
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    await page.locator("button:has-text('Bài tập')").click();
    await page.locator("button:has-text('Tạo bài tập')").first().click();

    // Điền tiêu đề
    await page.fill('input[id="assignmentTitleInput"]', "Bài tập test file quá kích thước");

    // Click chọn file input ảo trong browser với kích thước 26MB
    await page.evaluate(() => {
      const input = document.getElementById("teacher-attachment-input") as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        // Tạo file ảo 26MB
        const file = new File([new ArrayBuffer(26 * 1024 * 1024)], "too-large-file.pdf", { type: "application/pdf" });
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Xác nhận xuất hiện toast thông báo lỗi kích thước vượt quá 25MB
    await expect(page.locator('text=Kích thước file "too-large-file.pdf" vượt quá 25MB.')).toBeVisible();

    // Xác nhận file không được thêm vào danh sách hiển thị
    await expect(page.locator('span.text-indigo-700', { hasText: 'too-large-file.pdf' })).not.toBeVisible();

    // Đóng form
    await page.click('button:has-text("Hủy bỏ")');
  });

  test("TC-ASSIGNMENT-006: Không cho phép xoá bài tập đã có học sinh nộp bài", async ({ page }) => {
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    // Intercept response để gán totalSubmissions = 1 cho bài tập có tiêu đề chứa "[Đã chỉnh sửa]"
    await page.route("**/api/v1/classes/*/assignments", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        json.data = json.data.map((asgn: any) => {
          if (asgn.title.includes("[Đã chỉnh sửa]")) {
            return { ...asgn, totalSubmissions: 1 };
          }
          return asgn;
        });
      }
      await route.fulfill({ json });
    });

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    await page.locator("button:has-text('Bài tập')").click();

    // Tìm bài tập có tiêu đề bắt đầu bằng "[Đã chỉnh sửa]"
    const targetCard = page.locator(".border-gray-200", { hasText: "[Đã chỉnh sửa]" }).first();
    await expect(targetCard).toBeVisible();

    // Click nút Xóa bài tập
    await targetCard.locator('button[title="Xóa bài tập"]').click();

    // Xác nhận không hiển thị ConfirmModal
    await expect(page.locator('h2:has-text("Xóa bài tập")')).not.toBeVisible();

    // Xác nhận có thông báo lỗi toast
    await expect(page.locator('text=Không thể xóa bài tập đã có học sinh làm bài.')).toBeVisible();
  });

  test("TC-ASSIGNMENT-008: Không cho phép học sinh nộp tệp vượt quá 25MB cho bài tập tự luận", async ({ page }) => {
    if (!classJoinCode) {
      throw new Error("classJoinCode không được thiết lập!");
    }

    // Đăng xuất giáo viên bằng cách clear localStorage và cookies
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[name="email"]', "student_test_e2e@gmail.com");
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
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await expect(classCard).toBeVisible();
    await classCard.click();
    await page.waitForURL(/.*student\/classes\/.*/);

    // Chuyển sang tab Bài tập
    await page.locator("button:has-text('Bài tập')").click();

    // Click vào bài tập tự luận
    const assignmentCard = page.locator(".border-gray-200", { hasText: "[Đã chỉnh sửa]" }).first();
    await expect(assignmentCard).toBeVisible();
    await assignmentCard.click();

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

    // Đăng xuất học sinh để test tiếp theo đăng nhập giáo viên thành công
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  });

  test("TC-ASSIGNMENT-005: Xoá bài tập thành công", async ({ page }) => {
    if (!createdClassName) {
      throw new Error("createdClassName không được thiết lập ở bước trước!");
    }

    await page.goto(`${BASE_URL}/teacher/classes`);
    const classCard = page.locator(`h3:has-text("${createdClassName}")`).first();
    await classCard.click();
    await page.waitForURL(/.*teacher\/classes\/.*/);

    await page.locator("button:has-text('Bài tập')").click();

    // Tìm bài tập có tiêu đề bắt đầu bằng "[Đã chỉnh sửa]" để xóa
    const targetCard = page.locator(".border-gray-200", { hasText: "[Đã chỉnh sửa]" }).first();
    await expect(targetCard).toBeVisible();

    const titleText = (await targetCard.locator("h3").textContent()) || "";

    // Click nút Xóa bài tập
    await targetCard.locator('button[title="Xóa bài tập"]').click();

    // Xác nhận trong modal Confirm
    await expect(page.locator('h2:has-text("Xóa bài tập")')).toBeVisible();
    await page.click('button:has-text("Xóa")');

    // Chờ và xác nhận bài tập đã biến mất khỏi danh sách
    await expect(page.locator(`h3:has-text("${titleText}")`)).not.toBeVisible();
  });
});
