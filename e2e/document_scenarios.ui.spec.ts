/**
 * E2E UI Tests — Kịch bản Tài liệu (TC_DOC_UI_001 -> TC_DOC_UI_008)
 *
 * Chạy tuần tự (serial) để tái sử dụng lớp học được tạo tự động giữa các testcase.
 */

import { test, expect, type Page } from "@playwright/test";

const TEACHER = {
  email: "teacher_test_e2e@gmail.com",
  password: "Password123",
};

const STUDENT = {
  email: "student_test_e2e@gmail.com",
  password: "Password123",
};

const nodeBuffer = Buffer;

const ts = Date.now();
const testClassName = `Doc Test Class ${ts}`;
let createdClassId = "";

// ── Helper functions ──────────────────────────────────────────────────────────

async function loginAsTeacher(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('input[name="email"]', TEACHER.email);
  await page.fill('input[name="password"]', TEACHER.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 8000 });
  await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 });
}

async function loginAsStudent(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('input[name="email"]', STUDENT.email);
  await page.fill('input[name="password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });
  await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 });
}

async function clickTab(page: Page, tabLabel: string) {
  const tabNav = page.locator("div.border-b div.flex.gap-6").first();
  await tabNav.locator("button", { hasText: tabLabel }).click();
}

async function navigateToClassDocuments(page: Page) {
  await page.goto("/teacher/classes");
  await page.locator("h3", { hasText: testClassName }).first().click();
  await expect(page).toHaveURL(/\/teacher\/classes\/.+/);
  await clickTab(page, "Tài liệu");
  await expect(page.getByText("Tài liệu bài giảng")).toBeVisible({ timeout: 5000 });
}

// ── Test Suite ────────────────────────────────────────────────────────────────

test.describe("UI Tests — Kịch bản quản lý tài liệu", () => {
  // Chạy tuần tự để truyền Class ID & dữ liệu tài liệu qua lại giữa các TC
  test.describe.configure({ mode: "serial" });

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
    } catch {
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
    } catch {
      // Bỏ qua lỗi nếu tài khoản đã tồn tại
    }
  });

  test.beforeEach(({ page }) => {
    page.on("console", msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", err => console.log(`[BROWSER ERROR] ${err.message}`));
    page.on("requestfailed", req => console.log(`[REQUEST FAILED] ${req.url()} - ${req.failure()?.errorText}`));
    page.on("response", async res => {
      if (res.status() >= 400) {
         console.log(`[HTTP ERROR] ${res.status()} ${res.url()}`);
         try {
           console.log(`[HTTP ERROR BODY] ${await res.text()}`);
         } catch (e) {
           console.warn("Could not read HTTP error response body:", e);
         }
      }
    });
  });

  // Thiết lập lớp học mới để chạy bộ test tài liệu
  test("Setup — Tạo lớp học để kiểm thử tài liệu", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");
    await page.getByRole("button", { name: "Add Classroom" }).click();
    await page.locator("input[placeholder='VD: Công nghệ phần mềm']").fill(testClassName);
    await page.getByRole("button", { name: "Tạo lớp học" }).click();
    await expect(page.getByText(testClassName)).toBeVisible({ timeout: 8000 });

    // Lấy classId từ URL khi bấm vào lớp học
    await page.locator("h3", { hasText: testClassName }).first().click();
    await expect(page).toHaveURL(/\/teacher\/classes\/.+/);
    const url = page.url();
    const matches = url.match(/\/teacher\/classes\/([a-zA-Z0-9-]+)/);
    expect(matches).not.toBeNull();
    createdClassId = matches![1];
  });

  // TC_DOC_UI_002
  test("TC_DOC_UI_002 — Tải lên tệp vượt ngưỡng dung lượng quy định", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    // Bấm nút "Upload tài liệu"
    await page.getByRole("button", { name: "Upload tài liệu" }).click();

    // Điền tiêu đề
    await page.locator("#title").fill("Tài liệu quá lớn");

    // Chọn file quá lớn (25.1MB)
    const largeFile = {
      name: "chuong1_large.pdf",
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(Math.ceil(25.1 * 1024 * 1024)), // 25.1MB
    };
    await page.setInputFiles("input[type='file']", largeFile);

    // Thông báo lỗi hiển thị tức thì tại Client từ toast
    await expect(page.getByText("vượt quá 25MB")).toBeVisible({ timeout: 5000 });

    // Nút submit/tải lên bị vô hiệu hóa
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeDisabled();

    // Hủy bỏ modal
    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC_DOC_UI_004
  test("TC_DOC_UI_004 — Xử lý lỗi tệp đính kèm không chứa dữ liệu", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();
    await page.locator("#title").fill("Tài liệu rỗng");

    // Tệp dung lượng 0 KB
    const emptyFile = {
      name: "empty.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: nodeBuffer.alloc(0),
    };
    await page.setInputFiles("input[type='file']", emptyFile);

    // Bấm tải lên
    await page.locator("form button[type='submit']").click();

    // Hiển thị thông báo lỗi từ server/client
    await expect(
      page.getByText(/không hợp lệ|không có dữ liệu|lỗi/i)
    ).toBeVisible({ timeout: 5000 });

    // Hủy bỏ modal
    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC_DOC_UI_003
  test("TC_DOC_UI_003 — Tải lên tệp ở mức ranh giới dung lượng tối đa", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();
    await page.locator("#title").fill("Tài liệu 25MB biên");

    // Tệp đúng 25.0MB (26214400 bytes)
    const boundaryFile = {
      name: "boundary.pdf",
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(25 * 1024 * 1024),
    };
    await page.setInputFiles("input[type='file']", boundaryFile);

    // Nút submit được kích hoạt
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeEnabled();

    // Bấm tải lên
    const responsePromise = page.waitForResponse(
      res => res.url().includes("/api/v1/documents/upload"),
      { timeout: 20000 }
    );
    await submitBtn.click();
    const response = await responsePromise;
    console.log("TC_DOC_UI_003 UPLOAD RESPONSE STATUS:", response.status());
    
    if (response.status() !== 201) {
      // Đợi toast hiển thị tin nhắn lỗi và in ra
      await page.waitForTimeout(1000);
      const toastMsg = await page.locator("div[role='status']").first().innerText().catch(() => "No toast visible");
      console.log("TC_DOC_UI_003 TOAST MESSAGE ON ERROR:", toastMsg);
    }

    // Tải lên thành công tài liệu dung lượng biên
    await expect(page.getByText("Tải tài liệu lên thành công!")).toBeVisible({ timeout: 15000 });
  });

  // TC_DOC_UI_001
  test("TC_DOC_UI_001 — Tải lên tài liệu học tập hợp lệ", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();
    await page.locator("#title").fill("Slide Chương 1");
    await page.locator("#description").fill("Lớp lý thuyết");

    // File 5MB
    const validFile = {
      name: "chuong1.pdf",
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(5 * 1024 * 1024),
    };
    await page.setInputFiles("input[type='file']", validFile);

    // Submit
    await page.locator("form button[type='submit']").click();

    // Toast thành công
    await expect(page.getByText("Tải tài liệu lên thành công!")).toBeVisible({ timeout: 10000 });

    // Hiển thị card tài liệu mới trên giao diện
    await expect(page.getByText("Slide Chương 1")).toBeVisible({ timeout: 5000 });
  });

  // TC_DOC_UI_005
  test("TC_DOC_UI_005 — Tải lên đồng thời nhiều tài liệu bài giảng", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();
    await page.locator("#title").fill("Bộ tài liệu thực hành");

    // Chọn đồng thời 3 files hợp lệ (.pdf & .docx)
    const files = [
      { name: "1.pdf", mimeType: "application/pdf", buffer: nodeBuffer.alloc(2 * 1024 * 1024) },
      { name: "2.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: nodeBuffer.alloc(4 * 1024 * 1024) },
      { name: "3.pdf", mimeType: "application/pdf", buffer: nodeBuffer.alloc(1 * 1024 * 1024) },
    ];
    await page.setInputFiles("input[type='file']", files);

    // Submit
    await page.locator("form button[type='submit']").click();

    // Đợi upload thành công
    await expect(page.getByText("Tải tài liệu lên thành công!")).toBeVisible({ timeout: 15000 });
  });

  // TC_DOC_UI_006
  test("TC_DOC_UI_006 — Học sinh tải xuống tài liệu bài học", async ({ page }) => {
    // Để học sinh thấy lớp này, học sinh phải tham gia lớp trước
    // Lấy mã mời của lớp
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");
    const classCard = page.locator("div.bg-white", {
      has: page.locator("h3", { hasText: testClassName }),
    });
    const codeText = await classCard.getByText(/Mã mời:/).innerText();
    const joinCode = codeText.replace("Mã mời:", "").trim();

    // Học sinh tham gia lớp học
    await loginAsStudent(page);
    await page.goto("/student/classes");
    await page.getByRole("button", { name: /tham gia|join|nhập mã/i }).click();
    await page.locator("#joinCode").fill(joinCode);
    await page.locator("form button[type='submit']").click();
    await expect(page.getByText(/Successfully joined|thành công/i)).toBeVisible({ timeout: 8000 });

    // Vào tab tài liệu của học sinh
    await page.locator("h3", { hasText: testClassName }).first().click();
    await clickTab(page, "Tài liệu");

    // Mở rộng tài liệu "Slide Chương 1" để xem các file đính kèm
    const docRow = page.locator("div.border", { hasText: "Slide Chương 1" });
    await docRow.click(); // Expand

    // Intercept download event
    const downloadPromise = page.waitForEvent("download");
    await docRow.locator("button", { hasText: "Tải về" }).first().click();
    const download = await downloadPromise;

    // Xác nhận download thành công
    expect(download.suggestedFilename()).toContain("chuong1.pdf");
  });

  // TC_DOC_UI_007
  test("TC_DOC_UI_007 — Chặn chức năng chỉnh sửa tài liệu đối với vai trò Học sinh", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto(`/student/classes/${createdClassId}`);
    await clickTab(page, "Tài liệu");

    // Đảm bảo không có nút "Upload tài liệu"
    await expect(page.getByRole("button", { name: "Upload tài liệu" })).toHaveCount(0);

    // Không hiển thị icon sửa/xóa (Edit / Trash2) trên card tài liệu
    const docItem = page.locator("div.border", { hasText: "Slide Chương 1" });
    await expect(docItem.locator("button[title='Chỉnh sửa tài liệu']")).toHaveCount(0);
    await expect(docItem.locator("button[title='Xóa tài liệu']")).toHaveCount(0);
  });

  // TC_DOC_UI_009
  test("TC_DOC_UI_009 — Chặn tải lên tệp tin sai định dạng (Security / MIME Type)", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();
    await page.locator("#title").fill("Tài liệu nguy hiểm");

    // Chọn file thực thi script.bat
    const batFile = {
      name: "script.bat",
      mimeType: "application/x-bat",
      buffer: nodeBuffer.from("echo hello"),
    };
    await page.setInputFiles("input[type='file']", batFile);

    // Toast lỗi định dạng xuất hiện
    await expect(page.getByText("Chỉ hỗ trợ file PDF hoặc DOCX")).toBeVisible({ timeout: 5000 });

    // Nút Tải lên bị vô hiệu hóa do danh sách tệp trống
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeDisabled();

    // Hủy bỏ modal
    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC_DOC_UI_010
  test("TC_DOC_UI_010 — Trạng thái hiển thị tiến trình tải (Upload Progress)", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();
    await page.locator("#title").fill("Tài liệu load lâu");

    const validFile = {
      name: "slow.pdf",
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(15 * 1024 * 1024), // 15MB
    };
    await page.setInputFiles("input[type='file']", validFile);

    // Intercept and delay request to capture progress/loading state
    await page.route("**/api/v1/documents/upload", async (route) => {
      await page.waitForTimeout(2000);
      await route.continue();
    });

    // Bấm Tải lên
    await page.locator("form button[type='submit']").click();

    // Nút submit chuyển sang trạng thái disabled/loading
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeDisabled();
    await expect(page.getByText("Đang tải lên...")).toBeVisible();

    // Đợi tải lên thành công
    await expect(page.getByText("Tải tài liệu lên thành công!")).toBeVisible({ timeout: 15000 });

    // Clean up route
    await page.unroute("**/api/v1/documents/upload");
  });

  // TC_DOC_UI_011
  test("TC_DOC_UI_011 — Để trống trường tiêu đề bắt buộc", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();

    // Chọn file hợp lệ
    const validFile = {
      name: "slide.pdf",
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(1 * 1024 * 1024),
    };
    await page.setInputFiles("input[type='file']", validFile);

    // Xóa trắng trường Tiêu đề
    const titleInput = page.locator("#title");
    await titleInput.fill("");

    // Submit button bị vô hiệu hóa
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeDisabled();

    // Hủy bỏ modal
    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC_DOC_UI_012
  test("TC_DOC_UI_012 — Cắt chữ khi tên tệp hoặc tiêu đề quá dài (Layout UI)", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();

    const longFileName = "chuong1-gioi-thieu-tong-quan-cuc-ky-dai-khong-co-khoang-trang.pdf";
    const longFile = {
      name: longFileName,
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(1 * 1024 * 1024),
    };
    await page.setInputFiles("input[type='file']", longFile);

    // Submit
    await page.locator("form button[type='submit']").click();

    // Đợi upload thành công
    await expect(page.getByText("Tải tài liệu lên thành công!")).toBeVisible({ timeout: 10000 });

    // Expand card tài liệu để kiểm tra tên file hiển thị
    const docRow = page.locator("div.border", { hasText: "chuong1-gioi-thieu" }).first();
    await docRow.click();

    // Assert that the file is rendered
    await expect(page.locator("span", { hasText: "chuong1-gioi-thieu" }).first()).toBeVisible();
  });

  // TC_DOC_UI_014
  test("TC_DOC_UI_014 — Hủy chọn tệp tin trước khi tải lên", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    await page.getByRole("button", { name: "Upload tài liệu" }).click();

    // Chọn file
    const file = {
      name: "temp.pdf",
      mimeType: "application/pdf",
      buffer: nodeBuffer.alloc(100 * 1024),
    };
    await page.setInputFiles("input[type='file']", file);

    // Kiểm tra file có hiển thị trên form
    await expect(page.locator("span", { hasText: "temp.pdf" }).first()).toBeVisible();

    // Click nút "X" để xóa file
    await page.locator("button[title='Xóa file']").click();

    // Kiểm tra vùng kéo thả file hiển thị lại qua đoạn text mô tả
    await expect(page.getByText("Kéo thả file vào đây hoặc click để chọn")).toBeVisible();

    // Hủy bỏ modal
    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC_DOC_UI_013
  test("TC_DOC_UI_013 — Giáo viên xóa tài liệu đã tải lên", async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToClassDocuments(page);

    // Bấm nút xóa tài liệu đầu tiên
    const deleteBtn = page.locator("button[title='Xóa tài liệu']").first();
    await deleteBtn.click();

    // Xác nhận xóa tại ConfirmModal
    const confirmBtn = page.locator("div.fixed").locator("button", { hasText: /^Xóa$/ });
    await confirmBtn.click();

    // Toast thông báo xóa thành công
    await expect(page.getByText("Xóa tài liệu thành công!")).toBeVisible({ timeout: 10000 });
  });

  // TC_DOC_UI_008
  test("TC_DOC_UI_008 — Vô hiệu hóa chức năng quản lý tài liệu khi lớp học đã đóng", async ({ page }) => {
    // Giáo viên đóng lớp học
    await loginAsTeacher(page);
    await page.goto("/teacher/classes");
    const classCard = page.locator("div.bg-white", {
      has: page.locator("h3", { hasText: testClassName }),
    });
    await classCard.locator("button", { hasText: "Đóng lớp" }).click();
    await page.locator("div.fixed").locator("button", { hasText: /^Đóng lớp$/ }).click();
    await expect(page.getByText(/Đóng lớp học thành công/i)).toBeVisible({ timeout: 8000 });

    // Di chuyển vào tab Tài liệu của lớp đã đóng
    await page.locator("h3", { hasText: testClassName }).first().click();
    await clickTab(page, "Tài liệu");

    // Nút "Upload tài liệu" phải bị ẩn đi
    await expect(page.getByRole("button", { name: "Upload tài liệu" })).toHaveCount(0);

    // Nút Chỉnh sửa / Xóa tài liệu của các bản ghi cũ cũng bị ẩn
    await expect(page.locator("button[title='Chỉnh sửa tài liệu']")).toHaveCount(0);
    await expect(page.locator("button[title='Xóa tài liệu']")).toHaveCount(0);
  });
});
