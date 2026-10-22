import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldSuggestVietnamese } from "./lang-hint.ts";

const base = { languages: ["en-US"], timeZone: "Europe/London", chosen: null, dismissed: false };

test("suggests Vietnamese from the language list or the Viet Nam time zone", () => {
  assert.equal(shouldSuggestVietnamese({ ...base, languages: ["en-US", "vi-VN"] }), true);
  assert.equal(shouldSuggestVietnamese({ ...base, languages: ["VI"] }), true);
  assert.equal(shouldSuggestVietnamese({ ...base, timeZone: "Asia/Ho_Chi_Minh" }), true);
  assert.equal(shouldSuggestVietnamese({ ...base, timeZone: "Asia/Saigon" }), true);
  assert.equal(shouldSuggestVietnamese(base), false);
});

test("stays quiet once a language is chosen or the hint was answered", () => {
  const vn = { ...base, languages: ["vi-VN"] };
  assert.equal(shouldSuggestVietnamese({ ...vn, chosen: "en" }), false);
  assert.equal(shouldSuggestVietnamese({ ...vn, chosen: "vi" }), false);
  assert.equal(shouldSuggestVietnamese({ ...vn, dismissed: true }), false);
  assert.equal(shouldSuggestVietnamese({ ...vn, chosen: "fr" }), true);
});
