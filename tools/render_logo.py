"""Render the SEGMENT "helix ring" logo mark (option 10) as static SVGs.

A circular double helix with three partner nodes on its crossings:
UNC Health (top), Greenwood Genetic Center (lower right) and Emory Healthcare
(lower left), joined by a faint triangle.

usage: python3 tools/render_logo.py            # writes into assets/
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")

# halo = the background the mark sits on; it cuts the gaps where strands cross
THEMES = {
    "light": dict(s1="#0f766e", s2="#0d2233", rung="#c3cfd8", halo="#f4f6f8",
                  unc="#4b9cd3", ggc="#00843d", emory="#012169"),
    "dark": dict(s1="#3ba99e", s2="#e8f0f6", rung="#3f5a70", halo="#0d2233",
                 unc="#4b9cd3", ggc="#1fa25a", emory="#7d93d6"),
}

CX, CY, R, AMP, TWISTS, STEPS = 50, 52, 33, 7, 3, 240
STRAND_W, HALO, RUNG_W, RUNG_EVERY, RUNG_MIN, NODE_R = 3.2, 2.2, 1.6, 7, 2.2, 9


def pts(arr):
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in arr)


def mark(c):
    s1, s2, off = [], [], []
    for i in range(STEPS + 1):
        th = -math.pi / 2 + 2 * math.pi * i / STEPS
        o = AMP * math.sin(TWISTS * (th + math.pi / 2))
        nx, ny = math.cos(th), math.sin(th)
        s1.append((CX + (R + o) * nx, CY + (R + o) * ny))
        s2.append((CX + (R - o) * nx, CY + (R - o) * ny))
        off.append(o)
    strands = {"s1": s1, "s2": s2}

    def at(deg):
        a = math.radians(deg)
        return CX + R * math.cos(a), CY + R * math.sin(a)

    nodes = [(at(-90), c["unc"]), (at(30), c["ggc"]), (at(150), c["emory"])]
    out = [f'<polygon points="{pts([n[0] for n in nodes])}" fill="none" stroke="{c["rung"]}" stroke-width="2" stroke-linejoin="round"/>']
    for i in range(0, STEPS + 1, RUNG_EVERY):
        if abs(off[i]) < RUNG_MIN:
            continue
        (x1, y1), (x2, y2) = s1[i], s2[i]
        out.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{c["rung"]}" stroke-width="{RUNG_W}" stroke-linecap="round"/>')
    # alternate which strand is in front every half twist
    seg = STEPS / (2 * TWISTS)
    pieces = []
    for j in range(2 * TWISTS):
        front = "s1" if j % 2 == 0 else "s2"
        pieces.append((round(j * seg), round((j + 1) * seg), front, "s2" if front == "s1" else "s1"))
    line = lambda arr, color, w: f'<polyline points="{pts(arr)}" fill="none" stroke="{color}" stroke-width="{w:g}" stroke-linecap="round" stroke-linejoin="round"/>'
    for a, b, front, back in pieces:
        out.append(line(strands[back][a:b + 1], c[back], STRAND_W))
    for a, b, front, back in pieces:
        out.append(line(strands[front][a:b + 1], c["halo"], STRAND_W + 2 * HALO))
        out.append(line(strands[front][a:b + 1], c[front], STRAND_W))
    for (x, y), fill in nodes:
        out.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{NODE_R}" fill="{fill}" stroke="{c["halo"]}" stroke-width="3.5"/>')
    return "\n  ".join(out)


def write(name, body, view_box):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="SEGMENT">\n  {body}\n</svg>\n')
    print("wrote", os.path.normpath(path))


write("logo-mark.svg", mark(THEMES["light"]), "4 5 92 92")
write("logo-mark-dark.svg", mark(THEMES["dark"]), "4 5 92 92")
write("favicon.svg", f'<rect width="100" height="100" rx="22" fill="#0d2233"/>\n  <g transform="translate(9 9) scale(0.82)">\n  {mark(THEMES["dark"])}\n  </g>', "0 0 100 100")
