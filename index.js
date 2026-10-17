/* ==========================================================================
   PORTADA — pestañas del CV, avance del cuaderno y filtros de proyectos
   ========================================================================== */
(() => {
  const TOTAL_SEMANAS = 16;
  const RUTA = "cuaderno/semanas/semana-";

  /* Una línea por semana terminada: t = título, d = detalle (pestaña "En el curso"), r = reflexión breve.
     El avance (n de 16) se calcula solo: cuenta los archivos semana-NN.html que ya no tienen textos "[Escribe aquí…]". */
  const SEMANAS = [
    { t: "Fundamentos del desarrollo web", d: "Petición web, estándares, Git y GitHub, hosting", r: "<strong>Fundamentos.</strong> Entendí el recorrido de una petición web y por qué importan los estándares, Git y el hosting." },
    { t: "Requerimientos y HTML5/CSS3", d: "Elicitación, página responsiva y validación", r: "<strong>Requerimientos y HTML5.</strong> Aprendí que un requerimiento debe poder medirse y que una página accesible se valida con herramientas." },
    { t: "Bootstrap y Tailwind", d: "Grilla, componentes y formularios", r: "<strong>Frameworks CSS.</strong> Aprendí a combinar Bootstrap y Tailwind sin que se pisen." },
    { t: "DOM, closures y Canvas", d: "Ruleta, sorteo y simulador orbital", r: "<strong>DOM y Canvas.</strong> Aprendí a guardar estado con closures y a animar con requestAnimationFrame." },
    { t: "React y su entorno", d: "Tres proyectos con Create React App, Vite y Next.js, y Huancayo Explorer", r: "<strong>React.</strong> Comprendí la diferencia entre librería y framework y cómo cada herramienta organiza un proyecto. Después construí Huancayo Explorer con Vite: componentes con props y children, CSS Modules frente a estilos inline y global, y la comprobación de que en CSR el div root llega vacío al navegador." },
    { t: "Componentes, routing y APIs en React", d: "JSX, props, React Router, axios y Minimarket Fresco", r: "<strong>Componentes y APIs.</strong> Aprendí a pasar datos con props y children, a crear rutas con React Router y a consumir una API con axios y async/await." },
    { t: "React Hooks y estado complejo", d: "Examen parcial, Sabores del Perú y Dashboard de tareas", r: "<strong>React Hooks.</strong> Aprendí a controlar cuándo renderiza React, a limpiar los efectos con AbortController y clearInterval, a repartir el estado con useContext y useReducer, y a memoizar solo lo que el Profiler demuestra que mejora." },
  ];
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

  /* ---------- 3. Avance del cuaderno (se calcula solo) ---------- */
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  /* Una semana cuenta como completa si su archivo existe y no conserva textos de plantilla */
  const detectar = async () => {
    const res = await Promise.all(Array.from({ length: TOTAL_SEMANAS }, (_, i) =>
      fetch(RUTA + pad(i + 1) + ".html", { cache: "no-cache" })
        .then((r) => (r.ok ? r.text() : null)).catch(() => undefined)));
    if (res.some((x) => x === undefined)) return null;          // sin servidor (file://): se usa la lista SEMANAS
    return res.map((t) => t !== null && !t.includes("[Escribe aquí") && !t.includes("[Describe aquí"));
  };

  const pintar = (hechas) => {
    const total = hechas.filter(Boolean).length;
    const pct = Math.round((total / TOTAL_SEMANAS) * 100);

    const nb = document.getElementById("nb-grid");
    if (nb) {
      nb.textContent = "";
      hechas.forEach((done, i) => {
        const n = i + 1;
        const a = document.createElement(done ? "a" : "span");
        a.className = "nb-wk" + (done ? " is-done" : "");
        if (done) a.href = "cuaderno.html#semana-" + n; else a.setAttribute("aria-disabled", "true");
        a.innerHTML = n + "<small>" + (done ? "completa" : "pendiente") + "</small>";
        a.setAttribute("aria-label", "Semana " + n + (done ? ", completa" : ", pendiente"));
        nb.appendChild(a);
      });
      document.getElementById("nb-done").textContent = total;
      document.getElementById("nb-total").textContent = "de " + TOTAL_SEMANAS + " semanas · " + pct + "%";
      const bar = document.querySelector(".nb-bar");
      bar.setAttribute("aria-valuenow", String(pct));
      const fill = bar.firstElementChild;
      if (reduced) fill.style.width = pct + "%";
      else new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { fill.style.width = pct + "%"; ob.disconnect(); } }), { threshold: 0.4 }).observe(bar);
    }

    document.querySelectorAll("[data-sem-total]").forEach((el) => { el.textContent = total; });

    /* Pestaña "En el curso" y "Reflexión por semana": una fila por cada semana completa */
    const cv = document.querySelector(".cv-weeks");
    const rf = document.querySelector(".reflect-weeks ol");
    if (cv) cv.textContent = "";
    if (rf) rf.textContent = "";
    hechas.forEach((done, i) => {
      const n = i + 1, w = SEMANAS[i];
      if (!done || !w) return;
      if (cv) cv.insertAdjacentHTML("beforeend", '<li><a href="cuaderno.html#semana-' + n + '"><span class="wk">' + n + '</span><span><strong>' + esc(w.t) + '</strong><small>' + esc(w.d) + '</small></span><span class="ok">✓</span></a></li>');
      if (rf) rf.insertAdjacentHTML("beforeend", '<li><span class="wk">' + n + '</span><p>' + w.r + ' <a href="cuaderno.html#semana-' + n + '">Leer →</a></p></li>');
    });
  };

  const lista = (n) => Array.from({ length: TOTAL_SEMANAS }, (_, i) => i < n);
  pintar(lista(SEMANAS.length));                                   // valor inicial (también sirve sin servidor)
  detectar().then((h) => { if (h) pintar(h); });

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