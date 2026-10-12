# Clay noir renders

Three.js scenes for the clay-noir art: dark set, one warm spotlight, a cool rim
light, vignette and film grain (`noir.js`).

| Scene | Output | Size |
| --- | --- | --- |
| `map.js` | `public/noir/vietnam.webp`, `public/og.jpg` | 1600 × 1000 |
| `newton.js` | `public/cast/newton.webp` | 1024 × 1024 |
| `orbit.js`, `trade.js`, `fdi.js` | `public/noir/{orbit,trade,fdi}.webp` | 1200 × 675 |
| `icon.js` | `icon-1024.png` → `public/icons/*` | 1024 × 1024 |

The map of Vietnam uses the Natural Earth 1:50m outline (`../vn-map/vnm.json`,
public domain) and places the Hoàng Sa and Trường Sa archipelagos from the
coordinates of their main islands (`vn.js`).

```sh
npm i three@0.169 esbuild        # in a scratch directory
node render.mjs map.js 1600 1000 map.png
```

Rendering uses Playwright's Chromium with software WebGL (SwiftShader). The PNGs
are converted to WebP (quality 82–84).
