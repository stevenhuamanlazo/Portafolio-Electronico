/* ==========================================================================
   PLUS — pestañas del CV, avance del cuaderno y filtros de proyectos
   ========================================================================== */
(() => {
  const SEMANAS_COMPLETAS = 5;      // ← sube este número cuando termines cada semana
  const TOTAL_SEMANAS = 16;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Pestañas del CV (WAI-ARIA, con flechas) ---------- */
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const n = tabs.length;
        const go = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (go !== undefined) { e.preventDefault(); select(go, true); }
      });
    });
    select(0);
  });

  /* ---------- 2. Botón "Descargar CV": solo aparece si el PDF existe ---------- */
  const cvBtn = document.getElementById("cv-download");
  if (cvBtn) {
    fetch(cvBtn.getAttribute("href"), { method: "HEAD" })
      .then((r) => { if (r.ok) cvBtn.hidden = false; })
      .catch(() => {});
  }

  /* ---------- 3. Avance del cuaderno ---------- */
  const nb = document.getElementById("nb-grid");
  if (nb) {
    for (let n = 1; n <= TOTAL_SEMANAS; n++) {
      const done = n <= SEMANAS_COMPLETAS;
      const a = document.createElement(done ? "a" : "span");
      a.className = "nb-wk" + (done ? " is-done" : "");
      if (done) a.href = "cuaderno.html#semana-" + n; else a.setAttribute("aria-disabled", "true");
      a.innerHTML = n + "<small>" + (done ? "completa" : "pendiente") + "</small>";
      a.setAttribute("aria-label", "Semana " + n + (done ? ", completa" : ", pendiente"));
      nb.appendChild(a);
    }
    const pct = Math.round((SEMANAS_COMPLETAS / TOTAL_SEMANAS) * 100);
    document.getElementById("nb-done").textContent = SEMANAS_COMPLETAS;
    document.getElementById("nb-total").textContent = "de " + TOTAL_SEMANAS + " semanas · " + pct + "%";
    const bar = document.querySelector(".nb-bar");
    bar.setAttribute("aria-valuenow", String(pct));
    const fill = bar.firstElementChild;
    if (reduced) fill.style.width = pct + "%";
    else new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { fill.style.width = pct + "%"; ob.disconnect(); } }), { threshold: 0.4 }).observe(bar);
  }

  /* ---------- 4. Filtros de proyectos ---------- */
  const filters = document.querySelector(".proj-filters");
  if (filters) {
    const cards = [...document.querySelectorAll(".projects-grid .project-card")];
    filters.querySelectorAll(".proj-filter").forEach((btn) => {
      const cat = btn.dataset.cat;
      btn.querySelector("span").textContent = cat === "todos" ? cards.length : cards.filter((c) => c.dataset.cat === cat).length;
      btn.addEventListener("click", () => {
        filters.querySelectorAll(".proj-filter").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        cards.forEach((c) => { c.hidden = !(cat === "todos" || c.dataset.cat === cat); });
        const live = document.getElementById("proj-live");
        if (live) live.textContent = cards.filter((c) => !c.hidden).length + " proyectos mostrados";
      });
    });
  }
})();