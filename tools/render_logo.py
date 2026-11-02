"""Render the SEGMENT "solid mark" logo (option 4) as static SVGs.

Two filled speech bubbles, one per side of a clinician-to-clinician
conversation, overlap; the overlap is cut out (transparent) and holds a
short DNA ladder.

usage: python3 tools/render_logo.py            # writes into assets/
"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")

INDIGO = "#120f31"
THEMES = {
    "light": dict(left=INDIGO, right="#2f8f86", dna=INDIGO),     # on the light header
    "dark": dict(left="#ffffff", right="#3ba99e", dna="#ffffff"),  # on the navy footer and icon
}

LEFT = "M28.8 73.5 A30 30 0 1 0 14.7 67 Q15 80 10 88 Q20 84 28.8 73.5 Z"
RIGHT = "M71.2 73.5 A30 30 0 1 1 85.3 67 Q85 80 90 88 Q80 84 71.2 73.5 Z"
LENS = "M50 18.6 A30 30 0 0 1 50 69.4 A30 30 0 0 1 50 18.6 Z"
DNA = ('<circle cx="50" cy="25.5" r="1.9"/>'
       '<rect x="46" y="30.2" width="8" height="3.6" rx="1.8"/>'
       '<rect x="43" y="36.2" width="14" height="3.6" rx="1.8"/>'
       '<rect x="41" y="42.2" width="18" height="3.6" rx="1.8"/>'
       '<rect x="43" y="48.2" width="14" height="3.6" rx="1.8"/>'
       '<rect x="46" y="54.2" width="8" height="3.6" rx="1.8"/>'
       '<circle cx="50" cy="62.5" r="1.9"/>')


def mark(c, uid):
    # the mask punches the lens out of both bubbles, so whatever is behind shows through
    return (f'<defs><mask id="{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
            f'<rect width="100" height="100" fill="#fff"/><path d="{LENS}" fill="#000"/></mask></defs>\n'
            f'  <g mask="url(#{uid})"><path d="{LEFT}" fill="{c["left"]}"/><path d="{RIGHT}" fill="{c["right"]}"/></g>\n'
            f'  <g fill="{c["dna"]}">{DNA}</g>')


def write(name, body, view_box):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="SEGMENT">\n  {body}\n</svg>\n')
    print("wrote", os.path.normpath(path))


MARK_BOX = "3 12 94 78"  # the bubbles span x 4-96, y 14-88
write("logo-mark.svg", mark(THEMES["light"], "lens-cut"), MARK_BOX)
write("logo-mark-dark.svg", mark(THEMES["dark"], "lens-cut"), MARK_BOX)
write("favicon.svg",
      f'<rect width="100" height="100" rx="22" fill="{INDIGO}"/>\n'
      f'  <g transform="translate(6 7) scale(0.88)">\n  {mark(THEMES["dark"], "lens-cut")}\n  </g>',
      "0 0 100 100")
