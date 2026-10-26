# Google Play listing · Gravity Lab

Copy each block into Play Console → Grow → Store presence → Main store listing. Default language
English (United States); add Vietnamese as a translation. Limits: app name 30, short description 80,
full description 4 000 characters.

| Field                | Value                                                                   |
|----------------------|-------------------------------------------------------------------------|
| App name             | Gravity Lab                                                             |
| Category             | Education                                                               |
| Tags                 | Economics, Statistics, Physics                                          |
| Privacy policy URL   | https://thuyhuongctu.github.io/Gravity-Lab/privacy/                      |
| Website              | https://thuyhuongctu.github.io/Gravity-Lab/                              |
| Email                | thuyhuongctu@gmail.com                                                  |
| Icon 512×512         | public/icons/icon-512.png                                               |
| Feature graphic      | store/play-2026-10-26/feature-graphic-1024x500.png (no alpha channel)   |
| Phone screenshots    | store/play-2026-10-26/screenshot-en-1.jpg … -6 (EN), screenshot-vi-1.jpg … -6 (VI) |
| Content rating       | Everyone (education, no user content, no ads)                           |
| Target audience      | 18 and over                                                             |
| Data safety          | No data collected, no data shared, no encryption needed, deletion N/A   |
| Ads                  | No                                                                      |
| App access           | All functionality available without special access                      |

## Short description · EN (≤ 80)

Learn the gravity model: from Newton's apple to FDI inflows into Viet Nam.

## Short description · VI (≤ 80)

Học mô hình lực hấp dẫn: từ quả táo của Newton đến dòng vốn FDI vào Việt Nam.

## Full description · EN

Gravity Lab is a bilingual (Vietnamese and English) teaching app on the gravity model of international
trade and foreign direct investment, built for undergraduate and master's students in international
business and economics.

A nine-scene story follows the equation from Newton's law of gravitation (1687) through Tinbergen's
trade model (1962), multilateral resistance (Anderson & van Wincoop, 2003) and PPML estimation
(Santos Silva & Tenreyro, 2006) to the FDI gravity model for Viet Nam (Phan & Do, 2019). Lumina, an
offline teaching assistant, narrates each scene and answers questions from the references built
into the app.

Rooms to explore:

• Orbit: change the distance exponent and watch planetary orbits close or precess.
• Trade: a globe of Viet Nam's partners; drag the distance elasticity γ and see flows re-route.
• FDI: the published coefficients of Phan & Do (2019) with an impact calculator, case files
  (Japan vs Korea, Singapore vs Korea) and a sector view of FDI by industry.
• Formula bridge: seven interactive steps from F = G·m₁m₂/r² to ln FDI = β₀ − γ ln D + …,
  with simulations of multilateral resistance and of OLS-on-logs versus PPML.
• Pro (free): load your own CSV panel or the cleaned Viet Nam FDI panel (1990–2004), estimate
  OLS and PPML on the device, run six model checks, read Lumina's plain-language interpretation
  and export a formatted results table (Word, LaTeX) with APA 7 references.
• Exercises: six self-marked questions with a teacher mode.

Everything runs on your device. No account, no analytics, no advertising; CSV files and questions
never leave the phone. Works offline after the first launch.

Authors: Phan Anh Tu and Do Thuy Huong.
Source code: github.com/thuyhuongctu/Gravity-Lab

## Full description · VI

Gravity Lab (Trọng lực) là ứng dụng giảng dạy song ngữ Việt–Anh về mô hình lực hấp dẫn trong thương
mại quốc tế và đầu tư trực tiếp nước ngoài, dành cho sinh viên và học viên cao học ngành kinh doanh
quốc tế và kinh tế.

Câu chuyện chín cảnh đi theo phương trình từ định luật vạn vật hấp dẫn của Newton (1687) qua mô hình
thương mại của Tinbergen (1962), sức cản đa phương (Anderson & van Wincoop, 2003) và ước lượng PPML
(Santos Silva & Tenreyro, 2006) đến mô hình lực hấp dẫn cho FDI vào Việt Nam (Phan & Do, 2019).
Lumina, trợ giảng ngoại tuyến, thuyết minh từng cảnh và trả lời câu hỏi từ tài liệu có sẵn trong app.

Các phòng:

• Quỹ đạo: đổi số mũ của khoảng cách và xem quỹ đạo khép kín hay tiến động.
• Thương mại: bản đồ đối tác của Việt Nam; kéo độ co giãn khoảng cách γ để thấy dòng chảy đổi hướng.
• FDI: hệ số công bố của Phan & Do (2019) với máy tính tác động, hồ sơ điều tra (Nhật Bản so với
  Hàn Quốc, Singapore so với Hàn Quốc) và FDI theo ngành.
• Cầu công thức: bảy bước tương tác từ F = G·m₁m₂/r² đến ln FDI = β₀ − γ ln D + …, có mô phỏng sức
  cản đa phương và so sánh OLS trên log với PPML.
• Pro (miễn phí): nạp bảng CSV của bạn hoặc bộ dữ liệu FDI Việt Nam đã làm sạch (1990–2004), ước
  lượng OLS và PPML ngay trên máy, sáu kiểm tra mô hình, Lumina diễn giải kết quả, xuất bảng kết quả
  (Word, LaTeX) kèm tài liệu tham khảo APA 7.
• Bài tập: sáu câu tự chấm, có chế độ giảng viên.

Mọi thứ chạy trên thiết bị của bạn. Không tài khoản, không theo dõi, không quảng cáo; tệp CSV và câu
hỏi không bao giờ rời khỏi điện thoại. Dùng được ngoại tuyến sau lần mở đầu.

Tác giả: Phan Anh Tú và Đỗ Thùy Hương.
Mã nguồn: github.com/thuyhuongctu/Gravity-Lab

## Release notes · first release

EN: First release. Story, Orbit, Trade and FDI rooms, formula bridge, Pro estimation and exercises.
Runs offline, no account.

VI: Bản đầu tiên. Câu chuyện, các phòng Quỹ đạo, Thương mại, FDI, cầu công thức, ước lượng Pro và
bài tập. Chạy ngoại tuyến, không cần tài khoản.

## Bản Play · Play edition (26/10/2026)

The Android app opens the site with `?src=play` (see `twa-manifest.json` and `src/sim/play-app.ts`). In that
edition the app names no institution, shows no planned prices and no sign-in buttons that do not work yet,
because the Android app is free and has no accounts. The listing above therefore names the authors without an
affiliation. The screenshots in `store/play-2026-10-26/` were taken from that edition; the older
`store/screenshot-*.png` show an earlier interface and are kept only for reference.
