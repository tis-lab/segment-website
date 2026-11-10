# segment-website
A website for the SEGMENT project: SouthEastern Genomics Medicine Econsult NeTwork.

This is a static design mockup (plain HTML/CSS/JS, no build step). Text highlighted in yellow on the pages is placeholder content.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Landing page: project overview |
| `econsults.html` | Learn about eConsults: what they are, why to request one, how they work, best practices, eConsult vs. referral, where to submit in each state, FAQ |
| `resources.html` | Resource library of downloadable PDFs, with filtering and search |
| `about.html` | About us: mission, partner map (UNC Health, Greenwood Genetic Center, Emory Healthcare), research aims, team, funding |

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Add a resource (PDF)

1. Put the PDF in `resources/pdfs/`.
2. Optionally make a cover image from its first page (macOS):
   `sips -s format jpeg -Z 640 resources/pdfs/NAME.pdf --out resources/thumbs/NAME.jpg`
3. Add an entry to `assets/resources-data.js`. Entries without a `file` show as "Coming soon".

## Regenerate the partner map

The map on `about.html` is an inline SVG drawn from US state boundaries ([us-atlas](https://github.com/topojson/us-atlas)):

```bash
curl -sSLo states-10m.json https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json
python3 tools/render_map.py states-10m.json se-map.svg
```

Replace the `<svg class="se-map">…</svg>` element in `about.html` with the output. Marker locations, map bounds and state labels are set at the top of `tools/render_map.py`.

## Regenerate the logo

The logo mark (two overlapping speech bubbles with DNA in the overlap) is drawn by a script that writes the header mark, the dark footer mark and the browser-tab icon; colors and shapes are at the top of it:

```bash
python3 tools/render_logo.py
```

## Cache busting

Pages link to `assets/` files with a `?v=` tag (for example `assets/styles.css?v=20261102-4`). GitHub Pages lets browsers cache files for 10 minutes, so after changing the logo, styles or scripts, bump the tag in all four HTML files so visitors get the new version right away:

```bash
sed -i '' 's/?v=20261102-4/?v=NEW-TAG/g' *.html
```

## Logo files

`brand/` holds the SEGMENT logo on its own (`segment-mark-*`) and with the SEGMENT wordmark (`segment-logo-*`), in four colorways: `default` (indigo and teal), `greenwood`, `emory` and `unc`. Each comes as an SVG in `brand/svg/` (lettering converted to outlines, so no font is needed) and a transparent PNG in `brand/png/`. `brand/segment-logo-kit-preview.png` shows them all.

To regenerate the SVGs after changing colors or shapes (colorways are at the top of the script):

```bash
pip install fonttools
python3 tools/render_brand_kit.py path/to/BarlowCondensed-SemiBold.ttf
```

Barlow Condensed is free from Google Fonts.
