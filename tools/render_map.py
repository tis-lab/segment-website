"""Render a Southeast US partner map (inline SVG) from us-atlas TopoJSON.

usage: python3 -I render_map.py <states-10m.json> <out.svg>
"""
import json
import math
import sys

topo_path, out_path = sys.argv[1], sys.argv[2]
topo = json.load(open(topo_path))

# ---- view + projection (Albers equal-area conic) ----
LON0, LAT0, PAR1, PAR2 = -82.0, 33.5, 29.5, 37.5
VIEW = (-88.4, -75.2, 30.0, 37.3)  # lon_min, lon_max, lat_min, lat_max
OUT_W = 640

r = math.radians
n = (math.sin(r(PAR1)) + math.sin(r(PAR2))) / 2
C = math.cos(r(PAR1)) ** 2 + 2 * n * math.sin(r(PAR1))
rho0 = math.sqrt(C - 2 * n * math.sin(r(LAT0))) / n


def albers(lon, lat):
    rho = math.sqrt(C - 2 * n * math.sin(r(lat))) / n
    theta = n * r(lon - LON0)
    return rho * math.sin(theta), -(rho0 - rho * math.cos(theta))


# fit the view box
samples = []
for i in range(41):
    t = i / 40
    lon = VIEW[0] + t * (VIEW[1] - VIEW[0])
    lat = VIEW[2] + t * (VIEW[3] - VIEW[2])
    samples += [albers(lon, VIEW[2]), albers(lon, VIEW[3]), albers(VIEW[0], lat), albers(VIEW[1], lat)]
minx = min(p[0] for p in samples)
maxx = max(p[0] for p in samples)
# use inner edges vertically so no blank corners show
top = max(albers(VIEW[0], VIEW[3])[1], albers(VIEW[1], VIEW[3])[1], albers(LON0, VIEW[3])[1])
bottom = min(albers(VIEW[0], VIEW[2])[1], albers(VIEW[1], VIEW[2])[1], albers(LON0, VIEW[2])[1])
top = min(albers(LON0, VIEW[3])[1], top)
scale = OUT_W / (maxx - minx)
OUT_H = round((bottom - top) * scale)


def project(lon, lat):
    x, y = albers(lon, lat)
    return (x - minx) * scale, (y - top) * scale


# ---- decode topojson ----
sx, sy = topo["transform"]["scale"]
tx, ty = topo["transform"]["translate"]
arcs = []
for arc in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)


def ring(indices):
    pts = []
    for idx in indices:
        a = arcs[idx] if idx >= 0 else arcs[~idx][::-1]
        pts.extend(a if not pts else a[1:])
    return pts


def path_for(geom):
    polys = geom["arcs"] if geom["type"] == "MultiPolygon" else [geom["arcs"]]
    parts = []
    hit = False
    for poly in polys:
        for rg in poly:
            pts = ring(rg)
            if any(VIEW[0] - 0.3 < lon < VIEW[1] + 0.3 and VIEW[2] - 0.3 < lat < VIEW[3] + 0.3 for lon, lat in pts):
                hit = True
            proj = [project(lon, lat) for lon, lat in pts]
            kept = [proj[0]]
            for p in proj[1:]:
                if math.hypot(p[0] - kept[-1][0], p[1] - kept[-1][1]) >= 0.7:
                    kept.append(p)
            if len(kept) < 3:
                continue
            parts.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in kept) + "Z")
    return "".join(parts) if hit else None


ABBR = {
    "Kentucky": "KY", "Virginia": "VA", "West Virginia": "WV", "Tennessee": "TN",
    "North Carolina": "NC", "South Carolina": "SC", "Georgia": "GA", "Alabama": "AL",
    "Mississippi": "MS", "Florida": "FL", "Maryland": "MD", "Delaware": "DE",
    "Louisiana": "LA", "Arkansas": "AR", "Ohio": "OH", "Indiana": "IN",
    "Illinois": "IL", "Missouri": "MO", "District of Columbia": "DC", "Pennsylvania": "PA",
    "New Jersey": "NJ",
}
# network states, tagged with the partner that serves them
NETWORK = {"NC": "unc", "SC": "ggc", "GA": "emory"}

state_paths = []
for g in topo["objects"]["states"]["geometries"]:
    name = g["properties"]["name"]
    d = path_for(g)
    if not d:
        continue
    ab = ABBR.get(name, name)
    cls = "state net" if ab in NETWORK else "state"
    partner = f' data-partner="{NETWORK[ab]}"' if ab in NETWORK else ""
    state_paths.append(f'<path class="{cls}" data-state="{ab}"{partner} d="{d}"><title>{name}</title></path>')

LABELS = {
    "TN": (-86.4, 35.8), "NC": (-80.9, 35.55), "SC": (-80.55, 33.55), "GA": (-83.5, 32.35),
    "AL": (-86.75, 32.7), "VA": (-78.6, 36.95), "KY": (-85.0, 36.95), "FL": (-83.0, 30.35),
}
label_svg = []
for ab, (lon, lat) in LABELS.items():
    x, y = project(lon, lat)
    cls = "state-label net" if ab in NETWORK else "state-label"
    partner = f' data-partner="{NETWORK[ab]}"' if ab in NETWORK else ""
    label_svg.append(f'<text class="{cls}"{partner} x="{x:.1f}" y="{y:.1f}">{ab}</text>')

PARTNERS = [
    # key, lon, lat, city, hub?, label dx/anchor
    ("unc", -79.0558, 35.9049, "Chapel Hill, NC", True, 16, "start"),
    ("ggc", -82.1618, 34.1954, "Greenwood, SC", False, 14, "start"),
    ("emory", -84.3240, 33.7925, "Atlanta, GA", False, -14, "end"),
]
marker_svg = []
for i, (key, lon, lat, city, hub, dx, anchor) in enumerate(PARTNERS, 1):
    x, y = project(lon, lat)
    cls = "marker hub" if hub else "marker"
    marker_svg.append(
        f'<g class="{cls}" data-partner="{key}" transform="translate({x:.1f} {y:.1f})">'
        f'<circle class="pulse" r="9"/><circle class="halo" r="15"/><circle class="dot" r="9"/>'
        f'<text class="marker-num" y="3.6">{i}</text>'
        f'<text class="city" x="{dx}" y="-12" text-anchor="{anchor}">{city}</text></g>'
    )

svg = (
    f'<svg class="se-map" viewBox="0 0 {OUT_W} {OUT_H}" role="img" '
    f'aria-label="Map of the southeastern United States showing SEGMENT sites in Chapel Hill, North Carolina; '
    f'Greenwood, South Carolina; and Atlanta, Georgia">\n'
    f'<rect class="water" width="{OUT_W}" height="{OUT_H}"/>\n'
    f'<g class="states">{"".join(state_paths)}</g>\n'
    f'<g class="state-labels">{"".join(label_svg)}</g>\n'
    f'<g class="markers">{"".join(marker_svg)}</g>\n'
    f'</svg>'
)
open(out_path, "w").write(svg)
print(f"wrote {out_path}: {OUT_W}x{OUT_H}, {len(state_paths)} states, {len(svg)//1024} KB")
