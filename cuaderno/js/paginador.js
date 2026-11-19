/* ==========================================================================
   CUADERNO — una semana por vez
   Se carga DESPUÉS de vista.js.
   - Barra de semanas 1–16 con Anterior / Siguiente (no flota sobre el contenido)
   - Cada semana tiene una portada con sus números (temas, capturas, código)
   - Las 3 secciones pasan a pestañas: Temas · Laboratorio · Reflexión
   - Al final, tarjetas grandes para ir a la semana anterior o siguiente
   ========================================================================== */
(() => {
  const timeline = document.getElementById("timeline");
  const cards = [...document.querySelectorAll(".week-card")];
  if (!timeline || !cards.length) return;

  const root = document.documentElement;
  root.classList.add("paged");

  const reduced = () => {
    const m = root.getAttribute("data-motion");
    return m === "reduce" || (m !== "full" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
  const say = (msg) => {
    const el = document.getElementById("a11y-live");
    if (el) { el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 30); }
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const N = cards.length;
  const LABEL = { done: "Completa", progress: "En progreso", pending: "Pendiente" };
  const ICONS = [
    '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2"/><path d="M8 7h7M8 11h5"/>',
    '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>'
  ];
  const svg = (p, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

  /* ---------- Datos de cada semana, leídos del propio contenido ---------- */
  const info = cards.map((card, i) => {
    const chip = card.querySelector(".status-chip");
    const state = !chip ? "pending" : chip.classList.contains("is-done") ? "done" : chip.classList.contains("is-progress") ? "progress" : "pending";
    const blocks = [...card.querySelectorAll(".week-panel-inner > .section-block")];
    const hint = blocks[0] && blocks[0].querySelector(":scope > .hint");
    let sub = hint ? hint.textContent.trim().replace(/^\(|\)$/g, "") : "";
    if (state === "pending" || /\[(Escribe|Describe) aquí/i.test(sub)) sub = "";
    const topics = [...card.querySelectorAll("details.topic > summary")].map((s) => s.textContent.trim());
    return {
      n: i + 1, state, sub, topics, blocks,
      shots: card.querySelectorAll(".shot-card").length,
      code: card.querySelectorAll(".code-file").length,
      ex: new Set([...card.querySelectorAll(".subgroup[data-ex]")].map((g) => g.dataset.ex)).size
    };
  });

  /* ---------- Barra de semanas ---------- */
  const bar = document.createElement("nav");
  bar.className = "wk-stepper";
  bar.setAttribute("aria-label", "Navegación entre semanas");
  bar.innerHTML = `
    <button type="button" class="wk-arrow wk-prev" aria-label="Semana anterior">${svg('<path d="m15 18-6-6 6-6"/>', 20)}</button>
    <div class="wk-strip" role="group" aria-label="Elegir semana"></div>
    <button type="button" class="wk-arrow wk-next" aria-label="Semana siguiente">${svg('<path d="m9 18 6-6-6-6"/>', 20)}</button>`;
  const strip = bar.querySelector(".wk-strip");
  const prev = bar.querySelector(".wk-prev");
  const next = bar.querySelector(".wk-next");

  const pills = info.map((m, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wk-pill is-" + m.state;
    b.dataset.i = String(i);
    b.innerHTML = `<span class="wk-pill-n">${m.n}</span>`;
    b.setAttribute("aria-label", "Semana " + m.n + ", " + LABEL[m.state].toLowerCase());
    strip.appendChild(b);
    return b;
  });

  const oldNav = document.querySelector(".week-nav");
  if (oldNav) oldNav.parentNode.insertBefore(bar, oldNav);
  else timeline.parentNode.insertBefore(bar, timeline);

  /* ---------- Portada + pestañas + pie de cada semana ---------- */
  cards.forEach((card, i) => {
    const m = info[i];
    const header = card.querySelector(".card-header");
    const inner = card.querySelector(".week-panel-inner");
    if (!header || !inner) return;

    // Portada
    const stats = [
      [m.topics.length, m.topics.length === 1 ? "tema" : "temas"],
      [m.ex, m.ex === 1 ? "ejercicio" : "ejercicios"],
      [m.shots, m.shots === 1 ? "captura" : "capturas"],
      [m.code, m.code === 1 ? "archivo de código" : "archivos de código"]
    ].filter(([v]) => v > 0);
    const chips = m.topics.slice(0, 6).map((t) => `<li>${esc(t)}</li>`).join("") +
      (m.topics.length > 6 ? `<li class="more">+${m.topics.length - 6}</li>` : "");
    const cover = document.createElement("div");
    cover.className = "wk-cover is-" + m.state;
    cover.innerHTML = `
      <div class="wk-cover-num" aria-hidden="true"><small>SEM</small>${String(m.n).padStart(2, "0")}</div>
      <div class="wk-cover-main">
        <p class="wk-cover-kicker"><span class="wk-dot"></span>${LABEL[m.state]} · Semana ${m.n} de ${N}</p>
        ${m.sub ? `<p class="wk-cover-sub">${esc(m.sub)}</p>` : ""}
        ${chips ? `<ul class="wk-cover-topics" aria-label="Temas de la semana">${chips}</ul>` : ""}
      </div>
      ${stats.length ? `<dl class="wk-cover-stats">${stats.map(([v, l]) => `<div><dt>${l}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}`;
    header.appendChild(cover);

    // Pestañas de sección
    if (m.blocks.length > 1) {
      const tabs = document.createElement("div");
      tabs.className = "wk-tabs";
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", "Secciones de la semana " + m.n);
      const btns = m.blocks.map((block, k) => {
        const h3 = block.querySelector(".col-head h3, :scope > h3");
        const title = h3 ? h3.textContent.replace(/^\d+\s*/, "").trim() : "Sección " + (k + 1);
        const short = ["Temas", "Laboratorio", "Reflexión"][k] || title;
        block.id = block.id || `wk${m.n}-sec${k + 1}`;
        block.setAttribute("role", "tabpanel");
        const b = document.createElement("button");
        b.type = "button";
        b.className = "wk-tab";
        b.id = `wk${m.n}-tab${k + 1}`;
        b.setAttribute("role", "tab");
        b.setAttribute("aria-controls", block.id);
        b.style.setProperty("--col", `var(${["--c-temas", "--c-lab", "--c-ref"][k] || "--accent-amber"})`);
        b.innerHTML = `<span class="wk-tab-ico">${svg(ICONS[k] || ICONS[0])}</span><span class="wk-tab-txt"><strong>${esc(short)}</strong><small>${esc(title)}</small></span>`;
        block.setAttribute("aria-labelledby", b.id);
        tabs.appendChild(b);
        return b;
      });
      const pick = (k, focus) => {
        btns.forEach((b, j) => {
          const on = j === k;
          b.setAttribute("aria-selected", on ? "true" : "false");
          b.tabIndex = on ? 0 : -1;
          m.blocks[j].hidden = !on;
        });
        if (!reduced()) { m.blocks[k].classList.remove("wk-enter"); void m.blocks[k].offsetWidth; m.blocks[k].classList.add("wk-enter"); }
        if (focus) btns[k].focus();
      };
      btns.forEach((b, k) => b.addEventListener("click", () => pick(k)));
      tabs.addEventListener("keydown", (e) => {
        const k = btns.indexOf(document.activeElement);
        if (k < 0) return;
        let to = null;
        if (e.key === "ArrowRight") to = (k + 1) % btns.length;
        else if (e.key === "ArrowLeft") to = (k - 1 + btns.length) % btns.length;
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = btns.length - 1;
        if (to === null) return;
        e.preventDefault(); e.stopPropagation();
        pick(to, true);
      });
      header.appendChild(tabs);
      pick(0);
    }

    // Pie: tarjetas a la semana anterior / siguiente
    card.querySelectorAll(".pager-btn").forEach((b) => {
      const to = Number(b.dataset.go);
      const t = info[to];
      if (!t) return;
      const isNext = b.classList.contains("pager-next");
      b.classList.add("wk-jump");
      b.innerHTML = `
        <span class="wk-jump-dir">${isNext ? "Siguiente" : "Anterior"} ${svg(isNext ? '<path d="M5 12h14M13 6l6 6-6 6"/>' : '<path d="M19 12H5M11 6l-6 6 6 6"/>', 16)}</span>
        <strong>Semana ${t.n}</strong>
        <small>${t.sub ? esc(t.sub) : LABEL[t.state]}</small>`;
    });
  });

  /* ---------- Mostrar una semana ---------- */
  let current = -1;
  const show = (i, opts = {}) => {
    if (i < 0 || i >= N) return;
    const changed = i !== current;
    current = i;

    cards.forEach((c, j) => { c.hidden = j !== i; });
    const card = cards[i];
    card.classList.add("is-visible");
    const btn = card.querySelector(".week-toggle");
    if (btn && btn.getAttribute("aria-expanded") === "false") btn.click();

    pills.forEach((p, j) => {
      if (j === i) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current");
    });
    prev.disabled = i === 0;
    next.disabled = i === N - 1;

    const left = pills[i].offsetLeft - strip.clientWidth / 2 + pills[i].clientWidth / 2;
    strip.scrollTo({ left, behavior: reduced() ? "auto" : "smooth" });

    if (changed && !opts.silent) {
      card.classList.remove("wk-enter");
      void card.offsetWidth;
      if (!reduced()) card.classList.add("wk-enter");
      const top = bar.getBoundingClientRect().top + window.scrollY - 16;
      if (window.scrollY > top) window.scrollTo({ top, behavior: reduced() ? "auto" : "smooth" });
      say("Semana " + (i + 1) + " de " + N + ", " + LABEL[info[i].state].toLowerCase());
    }
    if (!opts.noHash) { try { history.replaceState(null, "", "#semana-" + (i + 1)); } catch (e) { /* file:// */ } }
  };

  /* ---------- Eventos ---------- */
  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  pills.forEach((p) => p.addEventListener("click", () => show(Number(p.dataset.i))));
  document.querySelectorAll(".pager-btn").forEach((b) =>
    b.addEventListener("click", () => show(Number(b.dataset.go)))
  );

  // Flechas del teclado con el foco en la página o en la barra
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target;
    const enBarra = t && t.closest && t.closest(".wk-stepper");
    if (!enBarra && t !== document.body) return;
    e.preventDefault();
    const to = current + (e.key === "ArrowRight" ? 1 : -1);
    if (to < 0 || to >= N) return;
    show(to);
    if (enBarra) pills[to].focus({ preventScroll: true });
  });

  window.addEventListener("hashchange", () => {
    const idx = cards.findIndex((c) => "#" + c.id === location.hash);
    if (idx >= 0) show(idx, { noHash: true });
  });

  /* ---------- Semana inicial: la del enlace, o la última con contenido ---------- */
  const hashIdx = cards.findIndex((c) => "#" + c.id === location.hash);
  let last = 0;
  info.forEach((m, i) => { if (m.state !== "pending") last = i; });
  show(hashIdx >= 0 ? hashIdx : last, { silent: true, noHash: hashIdx < 0 });
  if (hashIdx >= 0) {
    // Con enlace directo, se coloca al inicio de la barra (no a media semana)
    requestAnimationFrame(() => window.scrollTo({ top: bar.getBoundingClientRect().top + window.scrollY - 16, behavior: "auto" }));
  }
})();