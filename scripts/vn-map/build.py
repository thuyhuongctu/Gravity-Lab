"""Build src/assets/vn-map.svg, the faint Vietnam map behind the pages.

Mainland outline: Natural Earth 1:50m admin-0 (public domain), from vnm.json.
The Hoàng Sa (Paracel) and Trường Sa (Spratly) archipelagos are drawn from the
coordinates of their main features, since the outline does not include them.
Run: python3 scripts/vn-map/build.py
"""
import json, math, os

HERE = os.path.dirname(__file__)
geo = json.load(open(os.path.join(HERE, "vnm.json")))

LON0, LON1, LAT0, LAT1 = 101.8, 118.0, 6.2, 23.6
KX = math.cos(math.radians(15))
S = 60  # px per degree of latitude
W = (LON1 - LON0) * KX * S
H = (LAT1 - LAT0) * S

def P(lon, lat):
    return ((lon - LON0) * KX * S, (LAT1 - lat) * S)

paths = []
for poly in geo["coordinates"]:
    for ring in poly:
        pts = [P(*p) for p in ring]
        paths.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")

HOANG_SA = [(112.34, 16.83), (111.61, 16.53), (111.20, 15.78), (112.73, 16.67), (111.51, 16.45),
            (112.53, 16.05), (111.75, 16.45), (112.26, 16.97), (112.57, 16.58), (111.70, 16.58)]
TRUONG_SA = [(111.92, 8.64), (114.33, 11.43), (114.36, 10.18), (114.33, 9.88), (114.48, 10.38),
             (114.28, 11.05), (112.92, 7.89), (114.36, 10.38), (112.20, 8.85), (113.30, 8.10),
             (115.83, 10.72), (116.27, 9.92), (115.53, 8.85), (113.85, 8.85), (114.70, 9.70),
             (112.90, 9.30), (116.70, 11.10), (114.00, 10.70)]

def dots(pts):
    return "".join(f'<circle cx="{P(*p)[0]:.1f}" cy="{P(*p)[1]:.1f}" r="4"/>' for p in pts)

hs = P(112.0, 17.45); ts = P(114.4, 12.15); ct = P(105.78, 10.03); hn = P(105.85, 21.03)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" fill="currentColor">
<path d="{''.join(paths)}" fill-opacity=".55" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
<g>{dots(HOANG_SA)}{dots(TRUONG_SA)}</g>
<g font-family="Plus Jakarta Sans, Be Vietnam Pro, sans-serif" font-weight="800" font-size="30" text-anchor="middle">
<text x="{hs[0]:.0f}" y="{hs[1]:.0f}">QĐ. Hoàng Sa</text>
<text x="{ts[0]:.0f}" y="{ts[1]:.0f}">QĐ. Trường Sa</text>
</g>
<path d="M{hn[0]:.1f},{hn[1]-26:.1f} l7,20 21,0 -17,12 6,20 -17,-12 -17,12 6,-20 -17,-12 21,0z"/>
<circle cx="{ct[0]:.1f}" cy="{ct[1]:.1f}" r="9"/>
<text x="{ct[0]-16:.0f}" y="{ct[1]+10:.0f}" text-anchor="end" font-family="Plus Jakarta Sans, sans-serif" font-weight="800" font-size="30">Cần Thơ</text>
</svg>
'''
open(os.path.join(HERE, "..", "..", "src", "assets", "vn-map.svg"), "w").write(svg)
print(f"{W:.0f}x{H:.0f}", len(svg))
