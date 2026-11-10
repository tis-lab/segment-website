"""Render the SEGMENT logo kit: the mark on its own and the mark with the SEGMENT wordmark,
in four colorways, as SVG files with the lettering converted to outlines.

The wordmark matches the website header: Barlow Condensed SemiBold with the E's drawn as
three bars and hand-tuned spacing around G-M and N-T.

usage: python tools/render_brand_kit.py path/to/BarlowCondensed-SemiBold.ttf
needs: pip install fonttools   (the font is free from fonts.google.com/specimen/Barlow+Condensed)
writes brand/svg/segment-mark-<colorway>.svg and brand/svg/segment-logo-<colorway>.svg
"""
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

sys.path.insert(0, os.path.dirname(__file__))
from render_logo import DNA, LEFT, LENS, MARK_BOX, RIGHT  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "brand", "svg")

# dark = left bubble, DNA and letters; light = right bubble and the E bars
COLORWAYS = {
    "default": dict(dark="#120f31", light="#2f8f86"),    # site indigo and teal
    "greenwood": dict(dark="#0b3b24", light="#00843d"),  # Greenwood Genetic Center greens
    "emory": dict(dark="#012169", light="#3f73b8"),      # Emory blues
    "unc": dict(dark="#13294b", light="#4b9cd3"),        # UNC navy and Carolina blue
}

# Wordmark geometry, in the mark's units (the mark is 78 units tall), as in the site header:
# the mark is ~1.76x the cap height, the gap after it ~17.6 units.
MARK_H = 78
EM = MARK_H / 1.76 / 0.7
GAP = 17.6
TRACK, GM, NT = 0.07, 0.02, -0.03   # letter spacing and the two hand-tuned pairs, in em
BAR_W = 0.42                         # each barred E, in em


def mark(c, uid):
    # the mask punches the lens out of both bubbles, so whatever is behind shows through
    return (f'<defs><mask id="{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
            f'<rect width="100" height="100" fill="#fff"/><path d="{LENS}" fill="#000"/></mask></defs>'
            f'<g mask="url(#{uid})"><path d="{LEFT}" fill="{c["dark"]}"/><path d="{RIGHT}" fill="{c["light"]}"/></g>'
            f'<g fill="{c["dark"]}">{DNA}</g>')


def wordmark(font, x0, c):
    upm = font["head"].unitsPerEm
    cap = font["OS/2"].sCapHeight
    glyphs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    s = EM / upm
    cap_u = cap * s
    mx, my, mw, mh = (float(v) for v in MARK_BOX.split())
    baseline = my + mh / 2 + cap_u / 2   # centre the capitals on the mark
    x, parts = x0, []

    def letter(ch):
        nonlocal x
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        parts.append(f'<path d="{pen.getCommands()}" fill="{c["dark"]}"/>')
        x += hmtx[name][0] * s

    def bars():
        nonlocal x
        h = cap_u * 0.2
        for k in range(3):
            y = baseline - cap_u + k * 2 * h
            parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{BAR_W * EM:.2f}" height="{h:.2f}" rx="{h / 2:.2f}" fill="{c["light"]}"/>')
        x += BAR_W * EM

    letter("S"); x += TRACK * EM
    bars(); x += TRACK * EM
    letter("G"); x += (TRACK + GM) * EM
    letter("M"); x += TRACK * EM
    bars(); x += TRACK * EM
    letter("N"); x += (TRACK + NT) * EM
    letter("T")
    return "".join(parts), x


def write(name, body, view_box):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="SEGMENT">{body}</svg>\n')
    print("wrote", os.path.normpath(path))


def main(font_path):
    font = TTFont(font_path)
    mx, my, mw, mh = (float(v) for v in MARK_BOX.split())
    for key, c in COLORWAYS.items():
        write(f"segment-mark-{key}.svg", mark(c, f"lens-{key}"), MARK_BOX)
        words, right = wordmark(font, mx + mw + GAP, c)
        write(f"segment-logo-{key}.svg", mark(c, f"lens-{key}") + words, f"{mx:g} {my:g} {right - mx + 2:.2f} {mh:g}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
