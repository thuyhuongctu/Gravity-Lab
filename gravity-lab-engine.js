/* Gravity Lab – bộ máy ước lượng (thuần JavaScript, không phụ thuộc thư viện)
 * © 2026 PGS.TS. Phan Anh Tú & NCS. Đỗ Thùy Hương. Bảo lưu mọi quyền.
 *
 * Gồm: đại số ma trận tối thiểu, OLS (sai số chuẩn HC1 hoặc theo cụm),
 * PPML bằng IRLS (Santos Silva & Tenreyro, 2006) với sai số chuẩn sandwich,
 * hiệu ứng cố định năm dạng biến giả, khoảng cách đại vòng tròn, p-value
 * xấp xỉ chuẩn và bộ đọc CSV. Mọi hàm đều thuần (không đụng DOM) để kiểm thử
 * được trong Node. Dữ liệu người dùng chỉ được xử lý trong trình duyệt.
 */
(function (root) {
  'use strict';

  // ---------- Đại số ma trận ----------
  function transposeMul(X, w) {
    // X'WX với W = diag(w) (w bỏ trống = 1)
    const k = X[0].length;
    const out = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < X.length; i++) {
      const xi = X[i], wi = w ? w[i] : 1;
      for (let a = 0; a < k; a++) {
        const v = xi[a] * wi;
        if (v === 0) continue;
        for (let b = a; b < k; b++) out[a][b] += v * xi[b];
      }
    }
    for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) out[a][b] = out[b][a];
    return out;
  }

  function transposeVec(X, v, w) {
    const k = X[0].length;
    const out = new Array(k).fill(0);
    for (let i = 0; i < X.length; i++) {
      const s = v[i] * (w ? w[i] : 1);
      for (let a = 0; a < k; a++) out[a] += X[i][a] * s;
    }
    return out;
  }

  // Nghịch đảo bằng khử Gauss–Jordan có chọn trụ; trả null nếu suy biến.
  function invert(M) {
    const n = M.length;
    const A = M.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
    const scale = Math.max(1e-300, ...M.map(r => Math.max(...r.map(Math.abs))));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12 * scale) return null;
      [A[c], A[p]] = [A[p], A[c]];
      const piv = A[c][c];
      for (let j = 0; j < 2 * n; j++) A[c][j] /= piv;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = A[r][c];
        if (f === 0) continue;
        for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j];
      }
    }
    return A.map(row => row.slice(n));
  }

  function matVec(M, v) { return M.map(row => row.reduce((s, x, j) => s + x * v[j], 0)); }

  function sandwich(Binv, meat) {
    const k = Binv.length;
    const tmp = Binv.map(row => Array.from({ length: k }, (_, j) => row.reduce((s, x, m) => s + x * meat[m][j], 0)));
    return tmp.map(row => Array.from({ length: k }, (_, j) => row.reduce((s, x, m) => s + x * Binv[m][j], 0)));
  }

  // "Thịt" của sandwich: Σ s_g s_g', s_g = Σ_{i∈g} x_i e_i (mỗi quan sát là một cụm nếu không có cluster)
  function meatOf(X, e, cluster) {
    const k = X[0].length;
    const groups = new Map();
    for (let i = 0; i < X.length; i++) {
      const g = cluster ? cluster[i] : i;
      let s = groups.get(g);
      if (!s) { s = new Array(k).fill(0); groups.set(g, s); }
      for (let a = 0; a < k; a++) s[a] += X[i][a] * e[i];
    }
    const M = Array.from({ length: k }, () => new Array(k).fill(0));
    for (const s of groups.values()) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) M[a][b] += s[a] * s[b];
    return { M, G: groups.size };
  }

  // ---------- Phân phối chuẩn ----------
  function normCdf(z) {
    // Abramowitz & Stegun 7.1.26, sai số < 1.5e-7
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
    return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
  }
  function pValue(b, se) {
    if (!(se > 0)) return NaN;
    return 2 * (1 - normCdf(Math.abs(b / se)));
  }
  function stars(p) { return p < 0.01 ? '***' : p < 0.05 ? '**' : p < 0.1 ? '*' : ''; }

  // ---------- Thiết kế ma trận ----------
  // rows: mảng đối tượng; xs: tên biến; opts.yearFE: tên cột năm; opts.unitFE: tên cột đơn vị
  function design(rows, xs, opts) {
    opts = opts || {};
    const names = ['_cons'].concat(xs);
    const fe = [];
    if (opts.yearFE) fe.push(opts.yearFE);
    if (opts.unitFE) fe.push(opts.unitFE);
    const levels = fe.map(col => Array.from(new Set(rows.map(r => String(r[col])))).sort().slice(1));
    fe.forEach((col, f) => levels[f].forEach(l => names.push(col + '=' + l)));
    const X = rows.map(r => {
      const v = [1].concat(xs.map(x => Number(r[x])));
      fe.forEach((col, f) => levels[f].forEach(l => v.push(String(r[col]) === l ? 1 : 0)));
      return v;
    });
    return { X, names };
  }

  // Bỏ cột suy biến (đa cộng tuyến hoàn hảo) theo thứ tự, báo lại tên đã bỏ.
  function dropCollinear(X, names) {
    let keep = names.map((_, j) => j);
    const dropped = [];
    for (let j = 1; j < names.length; j++) {
      const trial = keep.filter(c => c <= j && !dropped.includes(names[c]));
      const sub = X.map(r => trial.map(c => r[c]));
      if (!invert(transposeMul(sub))) dropped.push(names[j]);
    }
    keep = keep.filter(c => !dropped.includes(names[c]));
    return { X: X.map(r => keep.map(c => r[c])), names: keep.map(c => names[c]), dropped };
  }

  function finalize(names, b, V, extra) {
    const coef = names.map((n, j) => {
      const se = Math.sqrt(Math.max(V[j][j], 0));
      const p = pValue(b[j], se);
      return { name: n, b: b[j], se, z: b[j] / se, p, stars: stars(p) };
    });
    return Object.assign({ coef }, extra);
  }

  // ---------- OLS ----------
  function ols(y, X0, names0, opts) {
    opts = opts || {};
    const { X, names, dropped } = dropCollinear(X0, names0);
    const n = X.length, k = X[0].length;
    const XtXi = invert(transposeMul(X));
    if (!XtXi) throw new Error('X\'X suy biến');
    const b = matVec(XtXi, transposeVec(X, y));
    const e = y.map((yi, i) => yi - X[i].reduce((s, x, j) => s + x * b[j], 0));
    const { M, G } = meatOf(X, e, opts.cluster);
    const V = sandwich(XtXi, M);
    const c = opts.cluster ? (G / (G - 1)) * ((n - 1) / (n - k)) : n / (n - k);
    const Vc = V.map(r => r.map(x => x * c));
    const ybar = y.reduce((s, v) => s + v, 0) / n;
    const sst = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
    const sse = e.reduce((s, v) => s + v * v, 0);
    return finalize(names, b, Vc, { method: 'OLS', n, k, r2: 1 - sse / sst, dropped, clusters: opts.cluster ? G : null });
  }

  // ---------- PPML (IRLS) ----------
  function ppml(y, X0, names0, opts) {
    opts = opts || {};
    if (y.some(v => v < 0)) throw new Error('PPML cần biến phụ thuộc không âm');
    const { X, names, dropped } = dropCollinear(X0, names0);
    const n = X.length, k = X[0].length;
    const ybar = y.reduce((s, v) => s + v, 0) / n;
    let mu = y.map(v => (v + ybar) / 2);
    let eta = mu.map(Math.log);
    let b = new Array(k).fill(0), dev = Infinity, iter = 0, converged = false;
    for (; iter < 200; iter++) {
      const z = eta.map((e, i) => e + (y[i] - mu[i]) / mu[i]);
      const XtWXi = invert(transposeMul(X, mu));
      if (!XtWXi) throw new Error('Ma trận thông tin suy biến');
      b = matVec(XtWXi, transposeVec(X, z, mu));
      eta = X.map(r => r.reduce((s, x, j) => s + x * b[j], 0));
      mu = eta.map(e => Math.exp(Math.min(e, 700)));
      const d = 2 * y.reduce((s, v, i) => s + (v > 0 ? v * Math.log(v / mu[i]) : 0) - (v - mu[i]), 0);
      if (Math.abs(d - dev) / (Math.abs(d) + 0.1) < 1e-10) { dev = d; converged = true; break; }
      dev = d;
    }
    const Bi = invert(transposeMul(X, mu));
    const e = y.map((v, i) => v - mu[i]);
    const { M, G } = meatOf(X, e, opts.cluster);
    const V = sandwich(Bi, M);
    const c = opts.cluster ? G / (G - 1) : n / (n - k);
    const Vc = V.map(r => r.map(x => x * c));
    // pseudo-R² = bình phương tương quan giữa y và giá trị dự báo
    const mbar = mu.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxy += (y[i] - ybar) * (mu[i] - mbar); sxx += (mu[i] - mbar) ** 2; syy += (y[i] - ybar) ** 2; }
    return finalize(names, b, Vc, { method: 'PPML', n, k, r2: (sxy * sxy) / (sxx * syy), dropped, iter: iter + 1, converged, clusters: opts.cluster ? G : null });
  }

  // ---------- Tiện ích mô hình lực hấp dẫn ----------
  function haversineKm(a, b) {
    const R = 6371.0088, rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Thay đổi % của y khi x thay đổi dx, mô hình log–log hoặc log–tuyến tính: exp(b·dx) − 1
  function pctChange(b, dx) { return (Math.exp(b * dx) - 1) * 100; }

  // Hệ số dài hạn của mô hình động y_t = ρ y_{t−1} + β x_t: β / (1 − ρ)
  function longRun(beta, rho) { return rho < 1 ? beta / (1 - rho) : NaN; }

  // ---------- CSV ----------
  function parseCSV(text) {
    const lines = [];
    let row = [], cell = '', q = false;
    const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(c => c.trim() !== '')) lines.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some(c => c.trim() !== '')) lines.push(row);
    const head = lines.shift().map(h => h.trim());
    const num = s => {
      const t = s.trim();
      if (t === '' || t === '.' || /^na$/i.test(t)) return NaN;
      const v = Number(sep === ';' ? t.replace(',', '.') : t);
      return Number.isFinite(v) ? v : t;
    };
    return { columns: head, rows: lines.map(l => Object.fromEntries(head.map((h, j) => [h, num(l[j] || '')]))) };
  }

  const api = { invert, ols, ppml, design, dropCollinear, normCdf, pValue, stars, haversineKm, pctChange, longRun, parseCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GravityEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
