# Gravity Lab — Trọng lực

Phòng thí nghiệm mô hình lực hấp dẫn, chạy trên trình duyệt, gồm ba chặng: (1) định luật vạn vật hấp dẫn của Newton qua mô phỏng quỹ đạo; (2) mô hình hấp dẫn thương mại Tinbergen với các nền kinh tế đối tác của Việt Nam; (3) phòng thí nghiệm FDI vào Việt Nam — đọc lại hệ số công bố (Phan & Đỗ, 2019; Xuan & Xing, 2008), mô phỏng tác động của khoảng cách/quy mô thị trường, và ước lượng OLS và PPML trên dữ liệu CSV tải lên.

*A browser-based gravity-model laboratory in three stages: (1) Newtonian gravitation through an orbit simulator; (2) the Tinbergen gravity model of trade with Vietnam's partner economies; (3) an FDI-into-Vietnam lab that replicates published coefficients (Phan & Đỗ, 2019; Xuan & Xing, 2008), simulates distance and market-size effects, and runs OLS and PPML estimation on an uploaded CSV.*

## Chạy thử / Run it

Ứng dụng viết bằng React + TanStack Start (Vite, Tailwind). Cần Node.js 22 trở lên.

*The app is built with React + TanStack Start (Vite, Tailwind). Node.js 22 or later is required.*

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # bản dựng triển khai (Nitro, preset Vercel) / deployable build
```

Bản dựng dùng preset Vercel (có kết xuất phía máy chủ), nên cần triển khai lên Vercel hoặc một nền tảng tương thích, không phải GitHub Pages. Phiên bản HTML tĩnh trước đây vẫn được duy trì tại **https://thuyhuongctu.github.io/BizOn/lab/gravity-lab.html** và được lưu trong lịch sử git của repo này (commit `1857067`).

*The build targets the Vercel preset (server-side rendering), so it must be deployed to Vercel or a compatible platform rather than GitHub Pages. The earlier static HTML version remains online at the URL above and is preserved in this repository's git history (commit `1857067`).*

## Nguồn gốc / Provenance

Repo này là bản sao độc lập (standalone snapshot) của Gravity Lab, tách ra từ hệ sinh thái **[BizOn](https://github.com/thuyhuongctu/BizOn)** — nơi lab này vẫn đang được duy trì và phát triển. Repo riêng này tồn tại để lưu trữ học thuật và xin DOI qua Zenodo cho mục đích trích dẫn độc lập.

*This repository is a standalone snapshot of Gravity Lab, split out of the [BizOn](https://github.com/thuyhuongctu/BizOn) ecosystem, where the lab continues to be maintained. This separate repo exists for academic archiving and an independent Zenodo DOI.*

## Trích dẫn / Citation

Xem [`CITATION.cff`](CITATION.cff). Sau khi gắn với Zenodo, DOI sẽ được thêm vào tệp này.

*See [`CITATION.cff`](CITATION.cff). The DOI will be added here once the repository is connected to Zenodo.*

## Giấy phép / License

Xem [`LICENSE`](LICENSE) — phần mềm độc quyền, lưu trữ công khai nhằm minh bạch học thuật và trích dẫn.

*See [`LICENSE`](LICENSE) — proprietary software, published openly for academic transparency and citation.*

---
© 2026 PGS.TS. Phan Anh Tú & NCS. Đỗ Thùy Hương · Trường Kinh tế, Đại học Cần Thơ
