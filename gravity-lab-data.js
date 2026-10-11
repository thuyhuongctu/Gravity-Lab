/* Gravity Lab – dữ liệu công bố (chép nguyên từ bài báo gốc, có ghi nguồn)
 * © 2026 PGS.TS. Phan Anh Tú & NCS. Đỗ Thùy Hương. Bảo lưu mọi quyền.
 *
 * Quy ước: mỗi con số ở đây là số ĐÃ CÔNG BỐ, chép theo bảng gốc; không có số
 * mô phỏng. Hệ số dạng [hệ số, sai số chuẩn, sao như trong bài].
 */
(function (root) {
  'use strict';

  const HANOI = [21.0285, 105.8542];

  // ---- Phan & Đỗ (2019), Tạp chí Kinh tế Đối ngoại, số 114, Bảng 6 (REM, robust s.e.) ----
  const paper2019 = {
    cite: 'Phan, A. T., & Đỗ, T. H. (2019). Tạp chí Kinh tế Đối ngoại, (114), 14–26.',
    table: 'Bảng 6 · Table 6',
    estimator: 'REM, robust s.e.',
    sample: { countries: 16, years: '2006–2015' },
    vars: [
      { id: 'cons',    vi: 'Hằng số',                          en: 'Constant' },
      { id: 'lagfdi',  vi: 'Độ trễ FDI (log)',                 en: 'Lagged FDI (log)', group: 'iv' },
      { id: 'geo',     vi: 'Khoảng cách địa lý (log)',         en: 'Geographic distance (log)', group: 'iv' },
      { id: 'inst',    vi: 'Khoảng cách thể chế',              en: 'Institutional distance', group: 'iv' },
      { id: 'cult',    vi: 'Khoảng cách văn hóa',              en: 'Cultural distance', group: 'iv' },
      { id: 'econ',    vi: 'Khoảng cách kinh tế (log)',        en: 'Economic distance (log)', group: 'iv' },
      { id: 'gdpvn',   vi: 'Quy mô thị trường Việt Nam (log)', en: 'Vietnam market size (log)', group: 'iv' },
      { id: 'gdppt',   vi: 'Quy mô thị trường đối tác (log)',  en: 'Partner market size (log)', group: 'iv' },
      { id: 'open',    vi: 'Độ mở thương mại',                 en: 'Trade openness', group: 'ctrl' },
      { id: 'exp',     vi: 'Kinh nghiệm quốc tế',              en: 'International experience', group: 'ctrl' },
      { id: 'corr',    vi: 'Tham nhũng',                       en: 'Corruption', group: 'ctrl' },
      { id: 'fta',     vi: 'Khu vực thương mại tự do',         en: 'Free trade area', group: 'ctrl' }
    ],
    models: [
      { n: 160, r2: 0.0242, p: 0.1279, c: { cons: [5.59, 1.89, '***'], open: [2.02, 1.21, '**'], exp: [0.02, 0.87, ''], corr: [-1.26, 1.09, ''], fta: [0.69, 0.40, '**'] } },
      { n: 159, r2: 0.0058, p: 0.0000, c: { cons: [2.53, 1.82, ''], lagfdi: [0.54, 0.07, '***'], open: [2.95, 1.34, '**'], exp: [0.07, 0.05, ''], corr: [-2.20, 0.94, '**'], fta: [0.71, 0.23, '***'] } },
      { n: 159, r2: 0.0060, p: 0.0000, c: { cons: [3.68, 2.08, '**'], lagfdi: [0.53, 0.07, '***'], geo: [-0.14, 0.13, ''], open: [2.97, 1.34, '**'], exp: [0.06, 0.05, ''], corr: [-2.10, 0.94, '**'], fta: [0.63, 0.24, '***'] } },
      { n: 159, r2: 0.0061, p: 0.0000, c: { cons: [5.50, 2.18, '**'], lagfdi: [0.48, 0.07, '***'], geo: [-0.38, 0.16, '**'], inst: [0.13, 0.06, '**'], open: [2.88, 1.32, '**'], exp: [0.08, 0.05, ''], corr: [-2.30, 0.93, '**'], fta: [0.86, 0.26, '***'] } },
      { n: 159, r2: 0.0068, p: 0.0000, c: { cons: [5.54, 2.33, '**'], lagfdi: [0.48, 0.07, '***'], geo: [-0.38, 0.18, '**'], inst: [0.13, 0.56, '**'], cult: [0.01, 0.16, ''], open: [2.88, 1.33, '**'], exp: [0.08, 0.57, ''], corr: [-2.31, 0.94, '**'], fta: [0.87, 0.26, '***'] } },
      { n: 159, r2: 0.0091, p: 0.0000, c: { cons: [4.33, 2.47, '**'], lagfdi: [0.47, 0.07, '***'], geo: [-0.42, 0.18, '**'], inst: [0.07, 0.68, ''], cult: [-0.02, 0.16, ''], econ: [0.25, 0.17, ''], open: [2.67, 1.34, '**'], exp: [0.08, 0.57, ''], corr: [-2.40, 0.94, '**'], fta: [0.90, 0.26, '***'] } },
      { n: 159, r2: 0.0076, p: 0.0000, c: { cons: [7.38, 4.60, ''], lagfdi: [0.46, 0.07, '***'], geo: [-0.42, 0.18, '**'], inst: [0.07, 0.07, ''], cult: [-0.00, 0.16, ''], econ: [0.26, 0.18, ''], gdpvn: [-0.89, 1.13, ''], open: [2.89, 1.36, '**'], exp: [0.10, 0.06, ''], corr: [-1.51, 1.48, ''], fta: [0.95, 0.27, '***'] } },
      { n: 159, r2: 0.0072, p: 0.0000, c: { cons: [8.32, 4.72, '**'], lagfdi: [0.45, 0.07, '***'], geo: [-0.38, 0.19, '**'], inst: [0.12, 0.08, ''], cult: [0.03, 0.17, ''], econ: [0.33, 0.19, '**'], gdpvn: [-0.87, 1.13, ''], gdppt: [-0.25, 0.27, ''], open: [2.89, 1.37, '**'], exp: [0.11, 0.63, '**'], corr: [-1.54, 1.48, ''], fta: [1.01, 0.28, '***'] } }
    ],
    // Bảng 4: thống kê mô tả (n = 160)
    descriptive: [
      { id: 'fdi',   mean: 5.90,  sd: 1.70, min: 1.81, max: 9.61 },
      { id: 'lagfdi', mean: 5.90, sd: 1.70, min: 1.81, max: 9.61 },
      { id: 'geo',   mean: 8.34,  sd: 0.88, min: 6.77, max: 9.50 },
      { id: 'inst',  mean: 5.01,  sd: 2.59, min: 0.28, max: 8.32 },
      { id: 'cult',  mean: 1.48,  sd: 0.83, min: 0.28, max: 3.01 },
      { id: 'econ',  mean: 9.94,  sd: 0.95, min: 7.16, max: 11.10 },
      { id: 'gdpvn', mean: 7.25,  sd: 0.32, min: 6.68, max: 7.65 },
      { id: 'gdppt', mean: 10.06, sd: 0.94, min: 7.65, max: 11.12 },
      { id: 'open',  mean: 1.57,  sd: 0.12, min: 1.36, max: 1.79 },
      { id: 'exp',   mean: 21.88, sd: 3.40, min: 11,   max: 27 },
      { id: 'corr',  mean: 2.86,  sd: 0.21, min: 2.6,  max: 3.1 },
      { id: 'fta',   mean: 0.39,  sd: 0.49, min: 0,    max: 1 }
    ],
    // Bảng 1: 16 quốc gia; tọa độ thủ đô dùng để tính khoảng cách đại vòng tròn tới Hà Nội
    countries: [
      { id: 'KOR', vi: 'Hàn Quốc',  en: 'Korea',        cap: [37.5665, 126.9780] },
      { id: 'TWN', vi: 'Đài Loan',  en: 'Taiwan',       cap: [25.0330, 121.5654] },
      { id: 'HKG', vi: 'Hồng Kông', en: 'Hong Kong',    cap: [22.3193, 114.1694] },
      { id: 'MYS', vi: 'Ma-lai-xi-a', en: 'Malaysia',   cap: [3.1390, 101.6869] },
      { id: 'CHN', vi: 'Trung Quốc', en: 'China',       cap: [39.9042, 116.4074] },
      { id: 'SGP', vi: 'Xin-ga-po', en: 'Singapore',    cap: [1.3521, 103.8198] },
      { id: 'JPN', vi: 'Nhật Bản',  en: 'Japan',        cap: [35.6762, 139.6503] },
      { id: 'THA', vi: 'Thái Lan',  en: 'Thailand',     cap: [13.7563, 100.5018] },
      { id: 'DEU', vi: 'Đức',       en: 'Germany',      cap: [52.5200, 13.4050] },
      { id: 'FRA', vi: 'Pháp',      en: 'France',       cap: [48.8566, 2.3522] },
      { id: 'NLD', vi: 'Hà Lan',    en: 'Netherlands',  cap: [52.3676, 4.9041] },
      { id: 'RUS', vi: 'Nga',       en: 'Russia',       cap: [55.7558, 37.6173] },
      { id: 'GBR', vi: 'Anh',       en: 'United Kingdom', cap: [51.5074, -0.1278] },
      { id: 'USA', vi: 'Hoa Kỳ',    en: 'United States', cap: [38.9072, -77.0369] },
      { id: 'CAN', vi: 'Ca-na-đa',  en: 'Canada',       cap: [45.4215, -75.6972] },
      { id: 'AUS', vi: 'Úc',        en: 'Australia',    cap: [-35.2809, 149.1300] }
    ]
  };

  // ---- Xuan & Xing (2008), Economics of Transition 16(2), Bảng 1: FDI thực hiện (triệu USD) ----
  const xuanXing2008 = {
    cite: 'Xuan, N. T., & Xing, Y. (2008). Economics of Transition, 16(2), 183–197.',
    table: 'Table 1',
    years: [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004],
    series: [
      { id: 'JPN', en: 'Japan',       vi: 'Nhật Bản',  cap: [35.6762, 139.6503], total: 4459.8, v: [0, 76.4, 1125.4, 114.6, 234.4, 1359.0, 622.65, 324.7, 152.5, 56.3, 56.5, 203.2, 57.7, 40.8, 35.7] },
      { id: 'SGP', en: 'Singapore',   vi: 'Xin-ga-po', cap: [1.3521, 103.8198],  total: 3615.4, v: [0, 527.3, 193.1, 577.3, 542.2, 345.4, 509.0, 186.9, 57.2, 26.3, 52.0, 75.3, 442.1, 78.5, 2.7] },
      { id: 'TWN', en: 'Taiwan',      vi: 'Đài Loan',  cap: [25.0330, 121.5654], total: 2935.6, v: [61.0, 158.9, 512.9, 340.6, 468.6, 264.3, 268.5, 134.1, 81.2, 98.7, 165.5, 177.5, 98.2, 88.4, 17.3] },
      { id: 'KOR', en: 'Korea',       vi: 'Hàn Quốc',  cap: [37.5665, 126.9780], total: 2445.7, note: 'Tổng các ô = 2.455,6; dòng Total trong bài in 2.445,7 (chênh lệch có sẵn trong bản gốc).', v: [0, 52.3, 235.8, 408.2, 340.6, 419.4, 508.6, 54.9, 18.8, 32.8, 41.4, 75.4, 138.0, 79.1, 50.3] },
      { id: 'HKG', en: 'Hong Kong',   vi: 'Hồng Kông', cap: [22.3193, 114.1694], total: 1856.1, v: [49.5, 123.7, 341.5, 295.3, 390.8, 72.7, 329.8, 29.3, 55.2, 28.5, 14.3, 50.0, 50.6, 16.9, 8.0] },
      { id: 'NLD', en: 'Netherlands', vi: 'Hà Lan',    cap: [52.3676, 4.9041],   total: 1784.4, v: [0, 107.4, 6.6, 6.2, 44.2, 149.7, 46.9, 0, 441.0, 2.0, 508.1, 430.0, 0, 18.0, 24.5] },
      { id: 'FRA', en: 'France',      vi: 'Pháp',      cap: [48.8566, 2.3522],   total: 1121.4, v: [0, 61.0, 68.2, 192.1, 14.1, 135.7, 50.5, 203.3, 25.0, 18.8, 1.9, 346.1, 1.2, 3.4, 0] },
      { id: 'MYS', en: 'Malaysia',    vi: 'Ma-lai-xi-a', cap: [3.1390, 101.6869], total: 829.9, v: [152.0, 25.4, 26.2, 117.6, 181.5, 183.4, 13.5, 23.7, 3.6, 9.7, 5.5, 11.8, 60.6, 10.1, 5.3] },
      { id: 'THA', en: 'Thailand',    vi: 'Thái Lan',  cap: [13.7563, 100.5018], total: 805.9, v: [0, 0, 29.3, 204.0, 207.1, 167.7, 50.0, 15.7, 3.7, 34.5, 8.9, 41.5, 10.8, 32.9, 0] },
      { id: 'USA', en: 'United States', vi: 'Hoa Kỳ', cap: [38.9072, -77.0369], total: 727.1, v: [0, 18.6, 0, 0, 73.7, 282.9, 108.0, 58.7, 17.3, 66.5, 56.1, 15.2, 14.2, 14.4, 1.6] }
    ]
  };

  const api = { HANOI, paper2019, xuanXing2008 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GravityData = api;
})(typeof window !== 'undefined' ? window : globalThis);
