import { test } from "node:test";
import assert from "node:assert/strict";
import { KB, ask, normalize, search } from "./tutor.ts";

const expect = (q: string, id: string) => {
  const r = ask(q);
  assert.equal(r.kind, "answer", `no answer for “${q}”`);
  if (r.kind === "answer") assert.equal(r.entry.id, id, `“${q}”`);
};

test("diacritics and đ are folded", () => {
  assert.equal(normalize("Đường khoảng cách"), "duong khoang cach");
});

test("Vietnamese questions, with or without diacritics, find the right entry", () => {
  expect("PPML là gì", "ppml");
  expect("vi sao khong dung OLS khi co so 0", "zeros");
  expect("hệ số -0.38 nghĩa là gì", "elasticity");
  expect("FTA dài hạn", "fta-long-run");
  expect("luc can da phuong", "mrt");
  expect("huy chuong vang", "medals");
  expect("cách tải dữ liệu lên", "upload");
  expect("Phan Do 2019 kết quả", "phan-do-2019");
});

test("common student questions reach the right entry", () => {
  expect("mô hình trọng lực là gì", "gravity-overview");
  expect("OLS là gì", "ols");
  expect("Hausman test", "re-fe");
  expect("R bình phương là gì", "r2");
  expect("what does R² mean", "r2");
  expect("khoảng cách văn hóa", "pd-variables");
  expect("làm sao thêm hành tinh", "orbit-room");
  expect("phòng thương mại dùng thế nào", "trade-room");
  expect("bài hát của app", "song");
  expect("Newton sinh năm nào", "newton-bio");
  expect("Tinbergen nhận Nobel năm nào", "tinbergen");
});

test("English questions find the right entry", () => {
  expect("distance puzzle", "distance-puzzle");
  expect("what is multilateral resistance", "mrt");
  expect("why use pair fixed effects", "pair-fe-distance");
  expect("heteroskedasticity", "ppml");
});

test("off-topic questions get no answer rather than a guess", () => {
  for (const q of ["thời tiết hôm nay thế nào", "nấu phở", "bitcoin price", "Who won the world cup", ""]) {
    assert.equal(ask(q).kind, "none", q);
  }
});

test("every entry is found by its own question, in both languages", () => {
  for (const e of KB) {
    assert.equal(search(e.q.vi)[0]?.entry.id, e.id, e.q.vi);
    assert.equal(search(e.q.en)[0]?.entry.id, e.id, e.q.en);
  }
});

test("entries are complete and ids unique", () => {
  const ids = new Set<string>();
  for (const e of KB) {
    assert.ok(!ids.has(e.id), e.id);
    ids.add(e.id);
    for (const s of [e.q.vi, e.q.en, e.a.vi, e.a.en]) assert.ok(s.length > 10, e.id);
  }
});
