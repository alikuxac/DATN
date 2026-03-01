# Hướng dẫn cài đặt hệ thống Cuu Tro VN

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để thiết lập và khởi chạy hệ thống **Cuu Tro VN** (Monorepo bao gồm API, Web Admin và Mobile App) trên môi trường local.

## 1. Yêu cầu hệ thống (Prerequisites)
Đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **Node.js**: Phiên bản `>=18`
- **Yarn**: Phiên bản 4.x (dự án đang sử dụng Yarn Workspaces, hiện tại là `4.12.0`)
- **Docker & Docker Compose**: Dùng để chạy cơ sở dữ liệu (MongoDB, Redis) nhanh chóng.
- **Expo Go**: (Tuỳ chọn) Cài ứng dụng "Expo Go" trên điện thoại iOS/Android để thử nghiệm Mobile App thực tế.

---

## 2. Cài đặt các gói Dependency

Mở terminal ở thư mục gốc của dự án (`d:\Do_An\code`) và thực thi lệnh:

```bash
yarn install
```
> Lệnh này sẽ tải toàn bộ các thư viện cần thiết cho tất cả các packages và apps (NestJS, Next.js, Expo). Quá trình này được quản lý đồng bộ bởi Turborepo và Yarn Workspaces.

---

## 3. Cấu hình biến môi trường (.env)

Hệ thống yêu cầu thiết lập biến môi trường riêng cho từng môi trường: `api`, `web`, `native`.

- **Tại `apps/api` (Backend NestJS):**
  1. Copy nội dung từ `apps/api/.env.example` tạo thành file `apps/api/.env`.
  2. Cập nhật các thông tin xác thực quan trọng: Đường dẫn kết nối MongoDB, Redis và các API Key (AWS S3, email Resend, JWT secret...).

- **Tại `apps/web` (Dashboard Next.js):**
  1. Copy file `apps/web/.env.example` tạo thành file `apps/web/.env`.
  2. Cấu hình địa chỉ API kết nối tới backend (Mặc định thường là `http://localhost:3000`).

- **Tại `apps/native` (Mobile App React Native):**
  1. Copy file `apps/native/.env.example` tạo thành file `apps/native/.env`.
  2. Cấu hình địa chỉ API. **Lưu ý đặc biệt:** Để chạy test trên mobile vật lý thông qua mạng LAN local, hãy sử dụng **IP LAN (IPv4)** của máy tính (ví dụ: `http://192.168.1.x:3000`) thay vì `http://localhost:3000`.

---

## 4. Khởi chạy Database (Docker/Docker Compose)

Dự án đã đính kèm sẵn cấu hình Docker để khởi chạy Database (MongoDB, Redis) một cách dễ dàng. Hãy đảm bảo service Docker (hoặc Docker Desktop) của bạn đang chạy.

Mở terminal và chuyển tới thư mục backend:
```bash
cd apps/api
docker-compose -f docker-compose.dev.yml up -d
```
> Lệnh `up -d` sẽ chạy các container ở chế độ ngầm (detach). Bạn có thể mở Docker UI để kiểm tra trạng thái (phải hiển thị `Running`).

*Ghi chú thêm: Nếu Database trống và bạn muốn khởi tạo dữ liệu mẫu (Seeding), hãy đảm bảo backend đã cài đặt xong các packages và chạy:*
```bash
cd apps/api
yarn seed
```

---

## 5. Khởi chạy toàn bộ hệ thống (Dev Server)

Sau khi Database đã hoạt động, bạn hãy làm việc tại thư mục gốc của dự án. Khởi chạy toàn bộ các services bằng chỉ một lệnh duy nhất:

```bash
yarn dev
```

Turborepo sẽ giúp khởi chạy đồng thời:
1. **API (NestJS)**: Lắng nghe ở port backend (mặc định là `3000`).
2. **Web Admin (Next.js)**: Lắng nghe ở port frontend (mặc định là `3001`). Truy cập trình duyệt với địa chỉ `http://localhost:3001`.
3. **Mobile App (Expo)**: Terminal sẽ phát sinh mã QR.
   - Mở ứng dụng **Expo Go** trên điện thoại.
   - Quét mã QR code, Expo sẽ tự động build và hiển thị giao diện React Native.
   - **Lưu ý:** Điện thoại và tính cần kết nối **chung một mạng Wi-Fi/LAN**.

### Xử lý sự cố (Troubleshooting & FAQ)
- **Lỗi API Crash do biến môi trường**: Kiểm tra log trên cửa sổ terminal `api:dev`. Nguyên nhân phổ biến nhất là thiếu các biến `.env` bắt buộc. Hãy cung cấp tạm giá trị giả (mock data) đối với các chuỗi khóa không dùng tới.
- **Node_modules lỗi do version/cache**: Thử dọn dẹp dự án bằng lệnh: `yarn clean` (Lệnh này sẽ xoá toàn bộ `node_modules` và `.turbo` cache theo định nghĩa của dự án), tiếp theo chạy lại `yarn install`.
