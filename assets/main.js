/* SEGMENT website mockup — shared behaviour */
(function () {
  "use strict";

  // ---------- Mobile nav ----------
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ---------- Decorative karyotype (hero) ----------
  // [name, length in Mb, centromere position as fraction of length]
  const CHROMS = [
    ["1", 248, 0.5], ["2", 242, 0.39], ["3", 198, 0.46], ["4", 190, 0.26], ["5", 181, 0.27],
    ["6", 171, 0.35], ["7", 159, 0.38], ["8", 145, 0.31], ["9", 138, 0.31], ["10", 134, 0.3],
    ["11", 135, 0.39], ["12", 133, 0.27], ["13", 114, 0.15], ["14", 107, 0.16], ["15", 102, 0.17],
    ["16", 90, 0.41], ["17", 83, 0.3], ["18", 80, 0.21], ["19", 59, 0.45], ["20", 64, 0.44],
    ["21", 47, 0.26], ["22", 51, 0.28], ["X", 156, 0.39],
  ];
  // Highlighted "segment": NF1 at 17q11.2, matching the example eConsult
  const HIGHLIGHT = { chrom: "17", at: 0.36, size: 0.07 };

  function seeded(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function renderKaryotype(host) {
    const W = 12, GAP = 9, H = 150, TOP = 4, maxLen = 248;
    const width = CHROMS.length * (W + GAP) - GAP;
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${H + 26}`, class: "karyotype", "aria-hidden": "true" });
    const defs = svgEl("defs", {});
    svg.appendChild(defs);
    const rnd = seeded(17);

    CHROMS.forEach(([name, len, cen], i) => {
      const x = i * (W + GAP);
      const h = (len / maxLen) * H;
      const y = TOP + H - h;
      const pH = Math.max(h * cen - 1.5, 4);
      const qY = y + h * cen + 1.5;
      const qH = h * (1 - cen) - 1.5;

      const clip = svgEl("clipPath", { id: `k-clip-${i}` });
      clip.appendChild(svgEl("rect", { x, y, width: W, height: pH, rx: W / 2 }));
      clip.appendChild(svgEl("rect", { x, y: qY, width: W, height: qH, rx: W / 2 }));
      defs.appendChild(clip);

      const g = svgEl("g", { "clip-path": `url(#k-clip-${i})` });
      g.appendChild(svgEl("rect", { x, y, width: W, height: h, fill: "#e8f0f6" }));
      let pos = y + 2 + rnd() * 3;
      while (pos < y + h - 2) {
        const bh = 1.5 + rnd() * 5;
        if (rnd() > 0.35) {
          g.appendChild(svgEl("rect", {
            x, y: pos, width: W, height: bh,
            fill: "#4b9cd3", opacity: (0.25 + rnd() * 0.65).toFixed(2),
          }));
        }
        pos += bh + 2 + rnd() * 6;
      }
      if (name === HIGHLIGHT.chrom) {
        g.appendChild(svgEl("rect", {
          x, y: y + h * HIGHLIGHT.at, width: W, height: h * HIGHLIGHT.size,
          fill: "#e0703f", class: "k-highlight",
        }));
      }
      svg.appendChild(g);

      const label = svgEl("text", {
        x: x + W / 2, y: TOP + H + 18, "text-anchor": "middle",
        "font-size": 9, "font-family": "Inter, sans-serif", "font-weight": 600,
        fill: name === HIGHLIGHT.chrom ? "#f0a185" : "#6f8aa0",
      });
      label.textContent = name;
      svg.appendChild(label);
    });

    host.prepend(svg);
  }

  const karyoHost = document.querySelector("[data-karyotype]");
  if (karyoHost) renderKaryotype(karyoHost);

  // ---------- Partner map leader lines (About page) ----------
  const diagram = document.querySelector(".partner-diagram");
  if (diagram) {
    const overlay = diagram.querySelector(".leaders");
    const wide = window.matchMedia("(min-width: 1061px)");

    function drawLeaders() {
      overlay.replaceChildren();
      if (!wide.matches) return;
      const box = diagram.getBoundingClientRect();
      overlay.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);

      diagram.querySelectorAll(".partner-card[data-partner]").forEach((card) => {
        const key = card.dataset.partner;
        const dot = diagram.querySelector(`.marker[data-partner="${key}"] .dot`);
        if (!dot) return;
        const m = dot.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        const mx = m.left + m.width / 2 - box.left;
        const my = m.top + m.height / 2 - box.top;
        const cardIsLeft = c.left + c.width / 2 - box.left < mx;
        const cx = (cardIsLeft ? c.right : c.left) - box.left;
        const cy = c.top + c.height / 2 - box.top;

        // start the line at the marker's edge, not its centre
        const len = Math.hypot(cx - mx, cy - my) || 1;
        const r = m.width / 2 + 2;
        const sx = mx + ((cx - mx) / len) * r;
        const sy = my + ((cy - my) / len) * r;

        const g = svgEl("g", { "data-partner": key });
        g.appendChild(svgEl("line", { x1: sx, y1: sy, x2: cx, y2: cy }));
        g.appendChild(svgEl("circle", { cx, cy, r: 4 }));
        overlay.appendChild(g);
      });
    }

    function setActive(key) {
      diagram.querySelectorAll("[data-partner]").forEach((el) => {
        el.classList.toggle("is-active", key !== null && el.dataset.partner === key);
      });
    }

    diagram.querySelectorAll(".partner-card[data-partner], .marker[data-partner]").forEach((el) => {
      el.addEventListener("mouseenter", () => setActive(el.dataset.partner));
      el.addEventListener("mouseleave", () => setActive(null));
    });

    drawLeaders();
    window.addEventListener("resize", drawLeaders);
    if (document.fonts) document.fonts.ready.then(drawLeaders);
    new ResizeObserver(drawLeaders).observe(diagram);
  }

  // ---------- Resources library ----------
  const resGrid = document.querySelector("[data-resources]");
  if (resGrid && Array.isArray(window.SEGMENT_RESOURCES)) {
    const CATEGORIES = {
      provider: "Provider guides",
      patient: "Patient materials",
      research: "Research & publications",
      presentation: "Presentations",
    };
    const TYPE_LABEL = {
      provider: "Provider guide",
      patient: "Patient handout",
      research: "Project document",
      presentation: "Presentation",
    };
    const items = window.SEGMENT_RESOURCES;
    const chipsHost = document.querySelector("[data-resource-chips]");
    const search = document.querySelector("[data-resource-search]");
    const empty = document.querySelector("[data-resource-empty]");
    let activeCat = "all";

    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));

    function cover(item) {
      const bars = Array.from({ length: 14 }, (_, i) => {
        const h = 30 + ((i * 37) % 70);
        return `<i class="${i === 9 ? "hot" : ""}" style="height:${h}%"></i>`;
      }).join("");
      return `<div class="res-cover"><span class="k">${esc(TYPE_LABEL[item.category] || item.category)}</span>` +
        `<span class="t">${esc(item.source)}</span><span class="bars">${bars}</span></div>`;
    }

    function card(item) {
      const thumb = item.thumb
        ? `<img src="${esc(item.thumb)}" alt="" loading="lazy">`
        : cover(item);
      const flag = item.placeholder ? `<span class="res-flag">Placeholder · coming soon</span>` : "";
      const fileInfo = [item.file ? "PDF" : null, item.pages ? `${item.pages} pages` : null, item.size]
        .filter(Boolean).join(" · ");
      const actions = item.file
        ? `<a class="btn btn-primary btn-sm" href="${esc(item.file)}" target="_blank" rel="noopener">View PDF</a>` +
          `<a class="btn btn-ghost btn-sm" href="${esc(item.file)}" download>Download</a>`
        : `<span class="btn btn-sm" aria-disabled="true">Coming soon</span>`;
      return `<article class="res-card"${item.partner ? ` data-partner="${esc(item.partner)}"` : ""}>` +
        `<div class="res-thumb">${thumb}${flag}</div>` +
        `<div class="res-body"><div class="res-meta"><span class="type">${esc(TYPE_LABEL[item.category] || item.category)}</span>` +
        `<span>·</span><span>${esc(item.source)}</span>${item.updated ? `<span>·</span><span>${esc(item.updated)}</span>` : ""}</div>` +
        `<h3>${esc(item.title)}</h3><p>${esc(item.description)}</p>` +
        `<div class="res-actions">${actions}${fileInfo ? `<span class="file">${esc(fileInfo)}</span>` : ""}</div></div></article>`;
    }

    function renderChips() {
      const counts = items.reduce((acc, it) => ((acc[it.category] = (acc[it.category] || 0) + 1), acc), {});
      const entries = [["all", "All resources", items.length]].concat(
        Object.keys(CATEGORIES).filter((k) => counts[k]).map((k) => [k, CATEGORIES[k], counts[k]])
      );
      chipsHost.innerHTML = entries.map(([key, label, n]) =>
        `<button type="button" class="chip" data-cat="${key}" aria-pressed="${key === activeCat}">` +
        `${esc(label)}<span class="count">${n}</span></button>`).join("");
    }

    function render() {
      const q = (search?.value || "").trim().toLowerCase();
      const shown = items.filter((it) =>
        (activeCat === "all" || it.category === activeCat) &&
        (!q || [it.title, it.description, it.source].join(" ").toLowerCase().includes(q))
      );
      resGrid.innerHTML = shown.map(card).join("");
      empty?.classList.toggle("is-visible", shown.length === 0);
    }

    chipsHost?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      activeCat = btn.dataset.cat;
      renderChips();
      render();
    });
    search?.addEventListener("input", render);
    renderChips();
    render();
  }
})();
