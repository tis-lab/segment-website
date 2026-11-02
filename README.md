# segment-website
A website for the SEGMENT project: SouthEastern Genetics & Genomics Medicine Econsult NeTwork.

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
