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

  // ---------- "Request an eConsult" state menu ----------
  document.querySelectorAll(".nav-cta").forEach((wrap) => {
    const button = wrap.querySelector("button");
    const menu = wrap.querySelector(".cta-menu");
    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    };
    button.addEventListener("click", () => setOpen(menu.hidden));
    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { setOpen(false); button.focus(); }
    });
  });

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ---------- Hero scene: play the eConsult exchange ----------
  // Question, typing dots, then the answer. Without motion the scene simply shows the finished exchange.
  const scene = document.getElementById("scene");
  if (scene) {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) scene.classList.add("play");
    // Safety net: if animations never run (a hidden tab, a screenshot), still show the finished exchange.
    setTimeout(() => scene.classList.remove("play"), 4500);
  }

  // ---------- "On this page" bar: underline the section being read ----------
  // The current section is the last one whose top has scrolled up under the header and bar.
  const toc = document.querySelector(".toc");
  if (toc) {
    const header = document.querySelector(".site-header");
    const list = toc.querySelector("ol");
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    let shown = null;
    const update = () => {
      const line = (header ? header.offsetHeight : 0) + toc.offsetHeight + 24;
      let current = null;
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && current) current = sections[sections.length - 1];
      if (current === shown) return;
      shown = current;
      links.forEach((a) => a.removeAttribute("aria-current"));
      if (!current) return;
      const link = byId.get(current.id);
      link.setAttribute("aria-current", "location");
      // on narrow screens the row scrolls sideways; keep the current link in view
      if (list.scrollWidth > list.clientWidth) {
        list.scrollLeft = link.offsetLeft - list.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2;
      }
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

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

    diagram.querySelectorAll(".partner-card[data-partner], .marker[data-partner], .state[data-partner]").forEach((el) => {
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
