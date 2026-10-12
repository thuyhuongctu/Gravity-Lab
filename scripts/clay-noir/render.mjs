// Bundle a clay-noir scene and screenshot it.
// Usage: node render.mjs <scene.js> <width> <height> <out.png>
// Needs three@0.169 and esbuild in node_modules (npm i three@0.169 esbuild),
// and Playwright's Chromium (software WebGL through SwiftShader).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const [scene, w, h, out] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), "noir-"));
execFileSync("npx", ["esbuild", resolve(scene), "--bundle", "--loader:.json=json", `--outfile=${dir}/bundle.js`, "--log-level=warning"], { stdio: "inherit", env: { ...process.env, NODE_PATH: resolve("node_modules") } });
writeFileSync(`${dir}/index.html`, `<!doctype html><html><body style="margin:0;background:#000"><script>window.W=${w};window.H=${h}</script><script src="bundle.js"></script></body></html>`);
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await page.goto(`file://${dir}/index.html`);
await page.waitForFunction(() => window.done, null, { timeout: 180000 }).catch(() => errs.push("timeout"));
await page.screenshot({ path: resolve(out) });
console.log(out, errs.length ? JSON.stringify(errs) : "ok");
await browser.close();
