import assert from "node:assert/strict";
import { test } from "node:test";
import { isPlayLaunch } from "./play-app.ts";

const web = { search: "", referrer: "", remembered: false };

test("the web edition stays the web edition", () => {
  assert.equal(isPlayLaunch(web), false);
  assert.equal(isPlayLaunch({ ...web, search: "?lang=vi" }), false);
  assert.equal(isPlayLaunch({ ...web, referrer: "https://www.google.com/" }), false);
  assert.equal(
    isPlayLaunch({ ...web, referrer: "android-app://io.github.thuyhuongctu.bizon/" }),
    false,
  );
});

test("the Play build is recognised from its start URL, its referrer or the tab flag", () => {
  assert.equal(isPlayLaunch({ ...web, search: "?src=play" }), true);
  assert.equal(isPlayLaunch({ ...web, search: "?lang=en&src=play" }), true);
  assert.equal(
    isPlayLaunch({ ...web, referrer: "android-app://io.github.thuyhuongctu.gravitylab/" }),
    true,
  );
  assert.equal(isPlayLaunch({ ...web, remembered: true }), true);
});
