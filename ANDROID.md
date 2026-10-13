# Gravity Lab trên Android (CH Play) · Gravity Lab on Android (Google Play)

Gravity Lab là web app (Vite, GitHub Pages). Bản Android là một **Trusted Web Activity (TWA)**: app mở
`https://thuyhuongctu.github.io/Gravity-Lab/` toàn màn hình, không có thanh địa chỉ, và nhận mọi cập nhật
từ web mà không cần phát hành lại. Cách làm giống hai app đã có của cùng tài khoản (BizOn, EnQuiz), với
packageId cùng họ `io.github.thuyhuongctu.*`.

Gravity Lab is a web app on GitHub Pages. The Android build is a Trusted Web Activity: it opens the site
full-screen, without an address bar, and picks up every web update without a new release.

## 1. Điều kiện · Prerequisites

- Node 18+ và `npm i -g @bubblewrap/cli` (Bubblewrap tải JDK 17 và Android SDK vào `~/.bubblewrap` ở lần chạy đầu).
- Tài khoản Google Play Console (đã có: *Thuy Huong Digital Learning*).
- Repo `thuyhuongctu/thuyhuongctu.github.io` để phục vụ `/.well-known/assetlinks.json` ở gốc tên miền
  (BizOn và EnQuiz đã cần file này, nên repo này hẳn đã có).

## 2. Tạo app · Create the Android project

Từ thư mục này, nơi có `twa-manifest.json` sẵn:

```bash
bubblewrap init --manifest https://thuyhuongctu.github.io/Gravity-Lab/manifest.webmanifest
```

Bubblewrap đọc `twa-manifest.json` (packageId `io.github.thuyhuongctu.gravitylab`, startUrl `/Gravity-Lab/`,
màu `#0a0b0d`, icon maskable). Khi hỏi khoá ký, chỉ vào `android.keystore` với alias `gravitylab`:

```bash
keytool -genkey -v -keystore android.keystore -alias gravitylab -keyalg RSA -keysize 2048 -validity 10000
```

**Giữ kỹ `android.keystore` và hai mật khẩu.** Mất khoá là không cập nhật được app. Không commit khoá lên repo
(`.gitignore` đã loại `*.keystore`).

Trong `twa-manifest.json` sau khi `init`, kiểm tra `targetSdkVersion`: từ 31/08/2026 Google Play yêu cầu
**API 36** cho app mới và bản cập nhật.

```bash
bubblewrap build
```

Kết quả: `app-release-bundle.aab` (tải lên Play) và `app-release-signed.apk` (cài thử trên máy).

## 3. Digital Asset Links

1. Trong Play Console → *App integrity* → *App signing*, bật **Play App Signing** và chép **SHA-256** của
   *App signing key certificate*.
2. Thêm mục này vào `/.well-known/assetlinks.json` trong repo `thuyhuongctu.github.io` (giữ các mục của
   BizOn và EnQuiz, thêm một phần tử vào mảng):

```json
{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "io.github.thuyhuongctu.gravitylab",
    "sha256_cert_fingerprints": ["<SHA-256 từ Play Console>"]
  }
}
```

3. Kiểm tra: `https://thuyhuongctu.github.io/.well-known/assetlinks.json` phải trả về JSON (HTTP 200,
   `Content-Type: application/json`). Khi khớp, app mở không có thanh địa chỉ; khi chưa khớp, app vẫn chạy
   nhưng hiện thanh địa chỉ của Chrome.

Nếu cài thử bằng `.apk` ký bằng khoá upload (trước khi qua Play), thêm cả SHA-256 của khoá upload
(`keytool -list -v -keystore android.keystore`) vào mảng `sha256_cert_fingerprints`.

## 4. Tải lên Play Console · Upload

1. Tạo app mới: tên **Gravity Lab**, ngôn ngữ mặc định English (United States), có bản dịch Tiếng Việt;
   loại *App*, *Miễn phí*; danh mục *Giáo dục*.
2. *Thử nghiệm kín* (closed testing) trước: tải `app-release-bundle.aab`, mời lớp học làm nhóm thử.
3. Tài nguyên cửa hàng trong thư mục `store/`:
   - Biểu tượng 512×512: `public/icons/icon-512.png`
   - Ảnh nổi bật 1024×500: `store/feature-graphic-1024x500.png`
   - Ảnh chụp điện thoại 1080×1920: `store/screenshot-1.png` … `screenshot-4.png` (chụp từ app thật)
4. Mô tả ngắn (≤ 80 ký tự):
   - EN: *Learn the gravity model: from Newton’s apple to FDI flows into Viet Nam.*
   - VI: *Học mô hình lực hấp dẫn: từ quả táo của Newton đến dòng vốn FDI vào Việt Nam.*
5. Chính sách quyền riêng tư: dùng mục *Privacy* ở cuối trang Câu chuyện
   (`https://thuyhuongctu.github.io/Gravity-Lab/`): không tài khoản, không theo dõi, dữ liệu CSV và câu hỏi
   cho Lumina ở lại trên thiết bị. Biểu mẫu *Data safety*: không thu thập, không chia sẻ dữ liệu.
6. Phân loại nội dung: Giáo dục, mọi lứa tuổi; đối tượng mục tiêu 18+ (sinh viên, giảng viên).

## 5. Cập nhật về sau · Later updates

Nội dung web cập nhật tự động. Chỉ cần phát hành lại trên Play khi đổi tên, icon, màu, `targetSdkVersion`
hoặc packageId: tăng `appVersionCode` trong `twa-manifest.json`, rồi `bubblewrap update && bubblewrap build`.

## Chưa làm · Not yet done

Đăng nhập, gói Pro và Google Play Billing (xem `PLAY_STORE_GUIDE.md` trong bản thiết kế) cần máy chủ xác
thực và xác minh giao dịch; app hiện chạy hoàn toàn trên thiết bị, chưa có các phần này.
