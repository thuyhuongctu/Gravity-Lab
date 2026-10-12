# Gravity Lab — Trọng lực

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23307833.svg)](https://doi.org/10.5281/zenodo.23307833)

Phòng thí nghiệm mô hình lực hấp dẫn, chạy trên trình duyệt, gồm ba chặng: (1) định luật vạn vật hấp dẫn của Newton qua mô phỏng quỹ đạo; (2) mô hình hấp dẫn thương mại Tinbergen với các nền kinh tế đối tác của Việt Nam; (3) phòng thí nghiệm FDI vào Việt Nam — đọc lại hệ số công bố (Phan & Đỗ, 2019; Xuan & Xing, 2008), mô phỏng tác động của khoảng cách/quy mô thị trường, và ước lượng OLS và PPML trên dữ liệu CSV tải lên.

*A browser-based gravity-model laboratory in three stages: (1) Newtonian gravitation through an orbit simulator; (2) the Tinbergen gravity model of trade with Vietnam's partner economies; (3) an FDI-into-Vietnam lab that replicates published coefficients (Phan & Đỗ, 2019; Xuan & Xing, 2008), simulates distance and market-size effects, and runs OLS and PPML estimation on an uploaded CSV.*

## Chạy thử / Run it

Bản trực tuyến: **https://thuyhuongctu.github.io/Gravity-Lab/** (GitHub Pages, tự triển khai khi nhánh `main` thay đổi).

*Live version at the URL above (GitHub Pages, deployed automatically from `main`).*

Ứng dụng là một trang tĩnh viết bằng React, Vite và Tailwind. Cần Node.js 22 trở lên.

*The app is a static single page built with React, Vite and Tailwind. Node.js 22 or later is required.*

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # bản tĩnh trong dist/ / static build in dist/
npm test         # kiểm tra phần toán: địa cầu, mô hình FDI / unit tests for the globe and FDI maths
```

Thư mục `dist/` dùng đường dẫn tương đối nên chạy được ở bất kỳ máy chủ tĩnh nào (GitHub Pages, Vercel, Netlify, máy chủ trường). Ứng dụng không đăng nhập, không cơ sở dữ liệu, không gọi dịch vụ bên ngoài ngoài Google Fonts. Phiên bản HTML tĩnh trước đây vẫn có tại **https://thuyhuongctu.github.io/BizOn/lab/gravity-lab.html** và trong lịch sử git (commit `1857067`).

*`dist/` uses relative paths, so it runs from any static host (GitHub Pages, Vercel, Netlify, a university server). The app has no sign-in, no database, and no external calls other than Google Fonts. The earlier static HTML version remains at the BizOn URL above and in git history (commit `1857067`).*

## Dữ liệu bản đồ / Map data

Chế độ Thương mại có thêm chế độ xem địa cầu: các nền kinh tế đặt theo tọa độ thật, dòng chảy vẽ bằng cung đường tròn lớn. Trình mô phỏng FDI có một địa cầu các nước nguồn vốn, mỗi cung nối thủ đô với Hà Nội, độ dày theo D^β của mô hình 8; chạm một nước để so sánh. Mục "Vì sao PPML" có phần phát lại theo năm (1990–2004) dòng FDI thực hiện từ dữ liệu Xuan & Xing (2008), đánh dấu các năm bằng 0. Đường biên quốc gia lấy từ Natural Earth (`ne_10m_admin_0_countries`, phạm vi công cộng), rút gọn bằng `scripts/build-land.py` thành `src/data/land.ts`.

*The trade mode adds a globe view: economies sit at their real coordinates and flows are drawn as great-circle arcs. The FDI simulator adds a globe of source countries, each arc joining a capital to Hanoi with its width set by D^β from Model 8; tap a country to compare it. The "Why PPML" panel replays realised FDI year by year (1990–2004) from Xuan & Xing (2008), marking the zero years. Country outlines come from Natural Earth (`ne_10m_admin_0_countries`, public domain), simplified by `scripts/build-land.py` into `src/data/land.ts`.*

## Nguồn gốc / Provenance

Repo này là bản sao độc lập (standalone snapshot) của Gravity Lab, tách ra từ hệ sinh thái **[BizOn](https://github.com/thuyhuongctu/BizOn)** — nơi lab này vẫn đang được duy trì và phát triển. Repo riêng này tồn tại để lưu trữ học thuật và xin DOI qua Zenodo cho mục đích trích dẫn độc lập.

*This repository is a standalone snapshot of Gravity Lab, split out of the [BizOn](https://github.com/thuyhuongctu/BizOn) ecosystem, where the lab continues to be maintained. This separate repo exists for academic archiving and an independent Zenodo DOI.*

## Trích dẫn / Citation

DOI: **[10.5281/zenodo.23307833](https://doi.org/10.5281/zenodo.23307833)**. DOI khái niệm, đại diện mọi phiên bản: [10.5281/zenodo.23307832](https://doi.org/10.5281/zenodo.23307832). Thông tin đầy đủ trong [`CITATION.cff`](CITATION.cff).

*DOI: 10.5281/zenodo.23307833. Concept DOI, covering all versions: 10.5281/zenodo.23307832. Full metadata in [`CITATION.cff`](CITATION.cff).*

> Phan, A. T., & Do, T. H. (2026). *Gravity Lab: a browser-based gravity-model laboratory for FDI into Vietnam* (Version v1.0) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.23307833

Tệp trên Zenodo đang ở chế độ giới hạn: có thể xin truy cập để đọc, tham khảo và trích dẫn. / *Files on Zenodo are restricted and available on request for reading, consultation and citation.*

## Giấy phép / License

Xem [`LICENSE`](LICENSE) — phần mềm độc quyền, lưu trữ công khai nhằm minh bạch học thuật và trích dẫn.

*See [`LICENSE`](LICENSE) — proprietary software, published openly for academic transparency and citation.*

---
© 2026 PGS.TS. Phan Anh Tú & NCS. Đỗ Thùy Hương · Trường Kinh tế, Đại học Cần Thơ
