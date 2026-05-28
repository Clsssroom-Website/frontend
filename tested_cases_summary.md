# 📋 Danh Sách Các Test Case Đã Được Kiểm Thử Frontend (All 13 Tests Pass)

Tài liệu này liệt kê toàn bộ **13 test cases** được viết bằng **Vitest** và **React Testing Library** để kiểm tra hoạt động của phần Frontend SmartClass. Các test case này được cấu hình mock API để chạy độc lập.

---

## 🔍 Tóm Tắt Số Lượng Kiểm Thử Frontend

| STT | File / Nhóm kiểm thử | Thư mục / File nguồn | Số test cases | Trạng thái |
|:---:|:---|:---|:---:|:---:|
| 1 | **Document Service** | `src/services/__tests__/document.service.test.ts` | **7** | ✅ Pass |
| 2 | **Teacher Documents Tab Component** | `src/pages/teacher/classes/tabs/__tests__/DocumentsTab.test.tsx` | **6** | ✅ Pass |
| **-** | **Tổng Cộng** | **-** | **13** | ✅ **All Pass** |

---

## 🛠️ Chi Tiết Các Test Case Theo Từng Module

### 1. Document Service (`document.service.test.ts` - 7 Tests)
Kiểm thử các cuộc gọi API liên quan đến quản lý tài liệu.
- [x] **uploadDocument**:
  - [x] Gọi API upload chính xác (POST `/documents/upload`) và trả về dữ liệu.
  - [x] Bắn ra lỗi nếu API upload gặp sự cố (thất bại).
- [x] **getDocumentsByClassId**:
  - [x] Lấy danh sách tài liệu theo lớp học thành công (GET `/documents/class/:classId`).
- [x] **getDownloadUrl**:
  - [x] Lấy URL xem trước (GET `/documents/attachment/:id/download` không kèm action).
  - [x] Lấy URL tải về trực tiếp (GET `/documents/attachment/:id/download?action=download`).
- [x] **updateDocument**:
  - [x] Gọi API chỉnh sửa thông tin tài liệu kèm dữ liệu FormData (PUT `/documents/:id`).
- [x] **deleteDocument**:
  - [x] Gọi API xóa tài liệu theo ID (DELETE `/documents/:id`).

---

### 2. Teacher Documents Tab Component (`DocumentsTab.test.tsx` - 6 Tests)
Kiểm thử giao diện Tab tài liệu bài giảng của giáo viên.
- [x] **Hiển thị trạng thái loading**:
  - [x] Hiển thị loader (`animate-spin`) khi component mới mount và đang gọi API lấy danh sách tài liệu.
- [x] **Hiển thị giao diện khi không có tài liệu**:
  - [x] Hiển thị thông báo "Chưa có tài liệu nào" khi API trả về danh sách rỗng.
- [x] **Hiển thị danh sách tài liệu**:
  - [x] Hiển thị chính xác tên, mô tả tài liệu khi tải thành công.
  - [x] Khi click vào tài liệu, giao diện sẽ mở rộng hiển thị danh sách file đính kèm, kích thước file và các nút chức năng.
- [x] **Tải tài liệu về máy**:
  - [x] Gọi API lấy đường dẫn tải về, tự động tạo và kích hoạt sự kiện click của thẻ `<a>` để bắt đầu tải xuống.
- [x] **Xem trước tài liệu**:
  - [x] Gọi API lấy link xem trước và mở trong tab trình duyệt mới bằng `window.open` với target `_blank`.
- [x] **Làm mới danh sách sau khi Upload**:
  - [x] Mở modal tải lên tài liệu, giả lập tải lên thành công và tự động gọi lại API để làm mới danh sách tài liệu hiển thị.
