/* ==========================================================================
   CUADERNO — una semana por vez
   Se carga DESPUÉS de vista.js. Muestra solo la semana elegida y agrega una
   barra con Anterior / Siguiente y una tira de semanas 1 a 16.
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

  const N = cards.length;
  const LABEL = { done: "Completa", progress: "En progreso", pending: "Pendiente" };

  /* Estado de cada semana, leído de lo que ya calculó semanas.js */
  const info = cards.map((card) => {
    const chip = card.querySelector(".status-chip");
    const state = !chip ? "pending" : chip.classList.contains("is-done") ? "done" : chip.classList.contains("is-progress") ? "progress" : "pending";
    const txt = card.querySelector(".wp-text");
    return { state, text: txt ? txt.textContent.trim() : "" };
  });

  /* ---------- Barra de semanas ---------- */
  const bar = document.createElement("nav");
  bar.className = "wk-stepper";
  bar.setAttribute("aria-label", "Navegación entre semanas");
  bar.innerHTML = `
    <button type="button" class="wk-arrow wk-prev" aria-label="Semana anterior">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="wk-now" aria-live="off">
      <span class="wk-kicker">Semana</span>
      <strong class="wk-num">1</strong>
      <span class="wk-of">de ${N}</span>
    </div>
    <div class="wk-strip" role="group" aria-label="Elegir semana"></div>
    <button type="button" class="wk-arrow wk-next" aria-label="Semana siguiente">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
    </button>`;
  const strip = bar.querySelector(".wk-strip");
  const prev = bar.querySelector(".wk-prev");
  const next = bar.querySelector(".wk-next");
  const numEl = bar.querySelector(".wk-num");

  const pills = cards.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wk-pill is-" + info[i].state;
    b.dataset.i = String(i);
    b.textContent = String(i + 1);
    b.setAttribute("aria-label", "Semana " + (i + 1) + ", " + LABEL[info[i].state].toLowerCase());
    strip.appendChild(b);
    return b;
  });

  const status = document.createElement("p");
  status.className = "wk-status";
  status.setAttribute("aria-hidden", "true");

  /* Reemplaza la barra anterior (chips + expandir/contraer) */
  const oldNav = document.querySelector(".week-nav");
  if (oldNav) oldNav.parentNode.insertBefore(bar, oldNav);
  else timeline.parentNode.insertBefore(bar, timeline);
  bar.after(status);

  let current = -1;

  const show = (i, opts = {}) => {
    if (i < 0 || i >= N) return;
    const changed = i !== current;
    current = i;

    cards.forEach((c, j) => { c.hidden = j !== i; });
    const card = cards[i];
    card.classList.add("is-visible");

    // La semana mostrada siempre va abierta
    const btn = card.querySelector(".week-toggle");
    if (btn && btn.getAttribute("aria-expanded") === "false") btn.click();

    pills.forEach((p, j) => {
      if (j === i) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current");
    });
    numEl.textContent = String(i + 1);
    prev.disabled = i === 0;
    next.disabled = i === N - 1;
    status.textContent = LABEL[info[i].state] + (info[i].text ? " · " + info[i].text : "");
    status.className = "wk-status is-" + info[i].state;

    // Centrar la pastilla activa en la tira
    const left = pills[i].offsetLeft - strip.clientWidth / 2 + pills[i].clientWidth / 2;
    strip.scrollTo({ left, behavior: reduced() ? "auto" : "smooth" });

    if (changed && !opts.silent) {
      card.classList.remove("wk-enter");
      void card.offsetWidth;                       // reinicia la animación
      if (!reduced()) card.classList.add("wk-enter");

      // Si el usuario estaba más abajo del inicio de la semana, vuelve al inicio
      const top = bar.getBoundingClientRect().bottom + window.scrollY;
      if (window.scrollY > top - 4) window.scrollTo({ top: Math.max(0, top - bar.offsetHeight - 8), behavior: reduced() ? "auto" : "smooth" });
      say("Semana " + (i + 1) + " de " + N + ", " + LABEL[info[i].state].toLowerCase());
    }
    if (!opts.noHash) { try { history.replaceState(null, "", "#semana-" + (i + 1)); } catch (e) { /* file:// */ } }
  };

  /* ---------- Eventos ---------- */
  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  pills.forEach((p) => p.addEventListener("click", () => show(Number(p.dataset.i))));

  // Flechas del teclado: en la barra, o con el foco en la página (sin tocar cuadros de texto ni código)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (document.querySelector("dialog[open]")) return;
    const t = e.target;
    const enBarra = t && t.closest && t.closest(".wk-stepper");
    if (!enBarra && t !== document.body) return;
    e.preventDefault();
    const to = current + (e.key === "ArrowRight" ? 1 : -1);
    if (to < 0 || to >= N) return;
    show(to);
    if (enBarra) pills[to].focus({ preventScroll: true });
  });

  // Botones "← Semana 10 / Semana 12 →" que ya trae cada semana
  document.querySelectorAll(".pager-btn").forEach((b) =>
    b.addEventListener("click", () => show(Number(b.dataset.go)))
  );

  window.addEventListener("hashchange", () => {
    const idx = cards.findIndex((c) => "#" + c.id === location.hash);
    if (idx >= 0) show(idx, { noHash: true });
  });

  /* ---------- Semana inicial: la del enlace, o la última con contenido ---------- */
  const hashIdx = cards.findIndex((c) => "#" + c.id === location.hash);
  let last = 0;
  info.forEach((m, i) => { if (m.state !== "pending") last = i; });
  show(hashIdx >= 0 ? hashIdx : last, { silent: true, noHash: hashIdx < 0 });
  card0Ready();

  function card0Ready() { root.classList.add("paged-listo"); }
})();