# Ghi âm giọng Lumina (Hương AI) · Recording Lumina's voice

Lumina hiện đọc lời giải thích bằng giọng máy của trình duyệt (speech synthesis). Khi bạn ghi âm xong và đặt
các tệp vào `public/narration/`, app sẽ phát giọng thật của bạn; thiếu tệp nào thì cảnh đó vẫn dùng giọng máy.

Lumina currently speaks through the browser's speech synthesis. Once your recordings are in `public/narration/`,
the app plays your voice; any missing file falls back to the synthetic voice.

## 1. Chuẩn bị · Setup

- **Phòng yên tĩnh**, tắt quạt và điều hoà; ghi bằng điện thoại (ứng dụng Ghi âm / Voice Memos) hoặc micro USB.
- Cách micro **15–20 cm**, nói chậm hơn bình thường một chút (app đang đọc ở tốc độ 0,95).
- Để **1 giây im lặng** ở đầu và cuối mỗi tệp; sau đó cắt bớt còn khoảng 0,3 giây.
- Ghi mỗi cảnh thành **một tệp riêng**; nếu nói vấp, ghi lại cả câu từ đầu.
- Xuất **MP3 128 kbps, mono, 44,1 hoặc 48 kHz** (M4A cũng được, nhưng app tìm `.mp3`). Trên điện thoại có thể
  dùng Audacity (máy tính) hoặc ứng dụng Lexis Audio Editor (Android) để cắt và xuất MP3.
- Giữ âm lượng đều giữa các tệp: chuẩn hoá (normalize) về −3 dB hoặc −16 LUFS nếu phần mềm có.

## 2. Tên tệp · File names

Đặt trong `public/narration/`, mỗi cảnh hai tệp (VI và EN), tổng cộng 18 tệp:

| Cảnh | Tiếng Việt | English |
| --- | --- | --- |
| 1 | `scene-1-vi.mp3` | `scene-1-en.mp3` |
| 2 | `scene-2-vi.mp3` | `scene-2-en.mp3` |
| … | … | … |
| 9 | `scene-9-vi.mp3` | `scene-9-en.mp3` |

Chỉ ghi một ngôn ngữ cũng được: ngôn ngữ còn lại dùng giọng máy.

## 3. Kịch bản · Scripts

Đọc đúng như dưới đây; phần trong ngoặc đơn là thuật ngữ tiếng Anh, đọc luôn cả phần đó. Gợi ý đọc số nằm
ở cuối mỗi cảnh.

### Cảnh 1 · Mở đầu

**VI** — Chào mừng đến Gravity Lab. Cuộn để bay qua 9 cảnh, từ khu vườn của Newton đến đầu tư trực tiếp nước ngoài (FDI) vào Việt Nam. Chạm vào tôi ở bất kỳ cảnh nào để nghe giải thích ngắn.

**EN** — Welcome to Gravity Lab. Scroll to fly through nine scenes, from Newton's orchard to foreign direct investment in Viet Nam. Tap me in any scene for a short explanation.

Đọc: "chín cảnh"; "FDI" đọc "ép-đi-ai".

### Cảnh 2 · Newton

**VI** — Định luật vạn vật hấp dẫn (law of universal gravitation) của Newton: lực giữa hai vật tăng theo tích khối lượng (masses) và giảm theo bình phương khoảng cách (distance).

**EN** — Newton's law of universal gravitation: the force between two masses rises with their product and falls with the square of the distance between them.

### Cảnh 3 · Số mũ bằng 2

**VI** — Trong vật lý, số mũ (exponent) của khoảng cách cố định bằng 2. Khoảng cách tăng gấp đôi thì lực còn một phần tư. Chính điều này giữ cho quỹ đạo (orbit) khép kín.

**EN** — In physics the exponent on distance is fixed at two. Double the distance and the force falls to one quarter. This is what keeps planetary orbits closed.

Đọc: "cố định bằng hai".

### Cảnh 4 · Tinbergen

**VI** — Tinbergen áp dụng cùng dạng này cho thương mại (trade). Quy mô kinh tế (economic size) thay cho khối lượng, và số mũ khoảng cách gamma (γ) được ước lượng (estimated) từ dữ liệu thay vì cố định.

**EN** — Tinbergen applied the same form to trade. Economic size replaces mass, and the distance exponent gamma is estimated from data rather than fixed.

Đọc: "Tin-bơ-ghen"; "gamma" đọc "gam-ma".

### Cảnh 5 · Khoảng cách và FDI

**VI** — Với FDI vào Việt Nam, độ co giãn theo khoảng cách (distance elasticity) là −0,38: khoảng cách tăng 1% gắn với FDI giảm khoảng 0,38%.

**EN** — For FDI into Viet Nam, the distance elasticity is minus zero point three eight: a one percent increase in distance is associated with about zero point three eight percent less FDI.

Đọc: "âm không phẩy ba mươi tám"; "tăng một phần trăm"; "giảm khoảng không phẩy ba mươi tám phần trăm".

### Cảnh 6 · FTA

**VI** — Hệ số hiệp định thương mại tự do (FTA coefficient) là 1,01. Vì mô hình ở dạng log, tác động là e mũ 1,01 trừ 1, tức FDI cao hơn khoảng 174,6%.

**EN** — The free-trade agreement coefficient is one point zero one. Because the model is in logs, the effect is e to the one point zero one minus one, about one hundred seventy-five percent higher FDI.

Đọc: "một phẩy không một"; "dạng lốc"; "e mũ một phẩy không một trừ một"; "một trăm bảy mươi tư phẩy sáu phần trăm".

### Cảnh 7 · PPML

**VI** — Lấy log làm mất mọi quan sát bằng 0 (zero flows). Ước lượng Poisson giả hợp lý cực đại (PPML) ước lượng trên mức (levels), giữ lại các giá trị 0 và vẫn nhất quán (consistent) khi phương sai thay đổi (heteroskedasticity).

**EN** — Taking logs drops every zero flow. Poisson pseudo-maximum likelihood, or PPML, estimates the model in levels, keeps the zeros and remains consistent under heteroskedasticity.

Đọc: "Poa-xông"; "PPML" đọc "pi-pi-em-eo".

### Cảnh 8 · Phi hành đoàn

**VI** — Đây là phi hành đoàn (crew): bảy thành viên của lớp, cùng Newton và Tinbergen. Mỗi người mang một bước của lập luận.

**EN** — This is the crew: seven members of the class, with Newton and Tinbergen. Each one carries one step of the argument.

### Cảnh 9 · Kết

**VI** — Giờ đến lượt bạn. Mở phòng thí nghiệm (laboratory) và ước lượng mô hình với dữ liệu của chính bạn.

**EN** — Now it is your turn. Open the laboratory and estimate the model with your own data.

## 4. Đưa vào app · Adding the files

1. Chép 18 tệp vào `public/narration/` trong repo (hoặc gửi cho tôi, tôi sẽ thêm và kiểm tra).
2. Commit và đẩy lên `main`; GitHub Pages tự cập nhật. Service worker lưu tệp sau lần nghe đầu, nên bản
   ngoại tuyến cũng có giọng của bạn.
3. Thử trên web: mở một cảnh, chạm "Lumina giải thích" → "Nghe". Nếu tệp thiếu hoặc lỗi, app tự chuyển về
   giọng máy, không báo lỗi với người dùng.

Kịch bản gốc nằm trong `src/components/SpaceJourney.tsx` (mảng `NARRATION`); nếu sửa lời ở đó thì ghi âm lại
cảnh tương ứng để hai bản khớp nhau.
