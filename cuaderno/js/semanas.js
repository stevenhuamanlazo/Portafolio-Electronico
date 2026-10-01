/* ==========================================================================
   CUADERNO — semanas dinámicas + panel de accesibilidad
   Mejora progresiva: si el JS falla, el cuaderno sigue siendo legible.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
  };
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => {
    const m = root.getAttribute("data-motion");
    return m === "reduce" || (m !== "full" && mql.matches);
  };

  /* ---------- Región en vivo para lectores de pantalla ---------- */
  const live = document.createElement("div");
  live.id = "a11y-live";
  live.className = "sr-only";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  const say = (msg) => {
    live.textContent = "";
    setTimeout(() => { live.textContent = msg; }, 60);
  };

  /* ==========================================================================
     PANEL DE ACCESIBILIDAD
     ========================================================================== */
  const SIZES = [87.5, 100, 112.5, 125, 150];
  const savedSize = SIZES.indexOf(Number(store.get("a11y-size")));
  let sizeIdx = savedSize < 0 ? 1 : savedSize;

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "a11y-toggle";
  toggleBtn.id = "a11y-toggle";
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.setAttribute("aria-controls", "a11y-panel");
  toggleBtn.setAttribute("aria-label", "Opciones de accesibilidad");
  toggleBtn.title = "Opciones de accesibilidad";
  toggleBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5l-3.5 6M12 14.5l3.5 6"/></svg>';

  const panel = document.createElement("div");
  panel.id = "a11y-panel";
  panel.className = "a11y-panel";
  panel.hidden = true;
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "Opciones de accesibilidad");
  panel.innerHTML = `
    <h2 class="a11y-title">Accesibilidad</h2>
    <div class="a11y-row">
      <span class="a11y-label" id="a11y-size-label">Tamaño del texto</span>
      <div class="a11y-size" role="group" aria-labelledby="a11y-size-label">
        <button type="button" id="a11y-smaller" aria-label="Reducir tamaño del texto">A−</button>
        <output id="a11y-size-out" aria-live="polite">100%</output>
        <button type="button" id="a11y-bigger" aria-label="Aumentar tamaño del texto">A+</button>
      </div>
    </div>
    <button type="button" class="a11y-switch" role="switch" aria-checked="false" id="sw-contrast">
      <span class="sw-text"><strong>Alto contraste</strong><small>Colores más fuertes y sin fondos animados</small></span><span class="sw-track" aria-hidden="true"><i></i></span>
    </button>
    <button type="button" class="a11y-switch" role="switch" aria-checked="false" id="sw-font">
      <span class="sw-text"><strong>Fuente legible</strong><small>Tipografía Atkinson Hyperlegible</small></span><span class="sw-track" aria-hidden="true"><i></i></span>
    </button>
    <button type="button" class="a11y-switch" role="switch" aria-checked="false" id="sw-motion">
      <span class="sw-text"><strong>Pausar animaciones</strong><small>Detiene fondo, glitch y movimientos</small></span><span class="sw-track" aria-hidden="true"><i></i></span>
    </button>
    <button type="button" class="a11y-reset" id="a11y-reset">Restablecer preferencias</button>
  `;
  document.body.append(toggleBtn, panel);

  const $ = (id) => document.getElementById(id);
  const swContrast = $("sw-contrast");
  const swFont = $("sw-font");
  const swMotion = $("sw-motion");
  const sizeOut = $("a11y-size-out");
  const smaller = $("a11y-smaller");
  const bigger = $("a11y-bigger");

  const setSwitch = (btn, on) => btn.setAttribute("aria-checked", String(on));

  const applySize = (announce) => {
    const pct = SIZES[sizeIdx];
    root.style.fontSize = pct === 100 ? "" : pct + "%";
    sizeOut.textContent = pct + "%";
    smaller.disabled = sizeIdx === 0;
    bigger.disabled = sizeIdx === SIZES.length - 1;
    if (pct === 100) store.del("a11y-size"); else store.set("a11y-size", String(pct));
    if (announce) say("Tamaño del texto " + pct + " por ciento");
  };

  const applyContrast = (on, announce) => {
    if (on) root.setAttribute("data-contrast", "high"); else root.removeAttribute("data-contrast");
    setSwitch(swContrast, on);
    if (on) store.set("a11y-contrast", "high"); else store.del("a11y-contrast");
    if (announce) say(on ? "Alto contraste activado" : "Alto contraste desactivado");
  };

  const applyFont = (on, announce) => {
    if (on) root.setAttribute("data-font", "legible"); else root.removeAttribute("data-font");
    setSwitch(swFont, on);
    if (on) store.set("a11y-font", "legible"); else store.del("a11y-font");
    if (announce) say(on ? "Fuente legible activada" : "Fuente legible desactivada");
  };

  const applyMotion = (paused, announce) => {
    if (paused) {
      root.setAttribute("data-motion", "reduce");
      store.set("a11y-motion", "reduce");
    } else if (mql.matches) {
      root.setAttribute("data-motion", "full");
      store.set("a11y-motion", "full");
    } else {
      root.removeAttribute("data-motion");
      store.del("a11y-motion");
    }
    setSwitch(swMotion, paused);
    window.dispatchEvent(new Event("motionchange"));
    if (announce) say(paused ? "Animaciones pausadas" : "Animaciones activadas");
  };

  // Estado inicial (el <head> ya aplicó los atributos antes de pintar)
  applySize(false);
  setSwitch(swContrast, root.getAttribute("data-contrast") === "high");
  setSwitch(swFont, root.getAttribute("data-font") === "legible");
  setSwitch(swMotion, isReduced());

  smaller.addEventListener("click", () => { if (sizeIdx > 0) { sizeIdx--; applySize(true); } });
  bigger.addEventListener("click", () => { if (sizeIdx < SIZES.length - 1) { sizeIdx++; applySize(true); } });
  swContrast.addEventListener("click", () => applyContrast(swContrast.getAttribute("aria-checked") !== "true", true));
  swFont.addEventListener("click", () => applyFont(swFont.getAttribute("aria-checked") !== "true", true));
  swMotion.addEventListener("click", () => applyMotion(swMotion.getAttribute("aria-checked") !== "true", true));

  $("a11y-reset").addEventListener("click", () => {
    ["a11y-size", "a11y-contrast", "a11y-font", "a11y-motion"].forEach(store.del);
    sizeIdx = 1;
    root.removeAttribute("data-motion");
    applySize(false);
    applyContrast(false, false);
    applyFont(false, false);
    setSwitch(swMotion, isReduced());
    window.dispatchEvent(new Event("motionchange"));
    say("Preferencias de accesibilidad restablecidas");
  });

  const openPanel = (open) => {
    panel.hidden = !open;
    toggleBtn.setAttribute("aria-expanded", String(open));
    if (open) smaller.focus(); else toggleBtn.focus();
  };
  toggleBtn.addEventListener("click", () => openPanel(panel.hidden));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) openPanel(false);
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
      panel.hidden = true;
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ==========================================================================
     SEMANAS DINÁMICAS
     ========================================================================== */
  const timeline = document.querySelector(".timeline");
  const cards = [...document.querySelectorAll(".week-card")];
  if (!timeline || !cards.length) return;

  const isPending = (block) => {
    const texts = [...block.querySelectorAll(".placeholder-box, .entry, dd")].filter((el) => !el.querySelector("pre"));
    // Pendiente si queda algún texto tipo [Escribe aquí…] / [Pega aquí…]
    const marker = /\[(escribe|pega|describe|anota|inserta|agrega)[^\]]*\]/i;
    const placeholder = texts.some((el) => el.textContent.trim().startsWith("[") || marker.test(el.textContent));
    const code = block.querySelector("pre code");
    const codePending = !!code && /Pega aqu[ií]/i.test(code.textContent);
    return placeholder || codePending;
  };

  const STATE_LABEL = { done: "● Completa", progress: "◐ En progreso", pending: "○ Pendiente" };
  const STATE_SR = { done: "completa", progress: "en progreso", pending: "pendiente" };
  const model = [];

  cards.forEach((card, i) => {
    const n = i + 1;
    card.id = "semana-" + n; // siempre único, aunque dupliques un bloque
    const body = card.querySelector(".card-body");
    const header = card.querySelector(".card-header");
    const h2 = header.querySelector("h2");
    const title = h2.textContent.trim();
    const blocks = [...body.querySelectorAll(":scope > .section-block")];
    const total = blocks.length;
    const done = blocks.filter((b) => !isPending(b)).length;
    const state = done === total && total > 0 ? "done" : done === 0 ? "pending" : "progress";

    // Panel colapsable
    const panelEl = document.createElement("div");
    panelEl.className = "week-panel";
    panelEl.id = "week-panel-" + n;
    panelEl.setAttribute("role", "region");
    panelEl.setAttribute("aria-labelledby", "week-title-" + n);
    const inner = document.createElement("div");
    inner.className = "week-panel-inner";
    blocks.forEach((b) => inner.appendChild(b));
    panelEl.appendChild(inner);
    body.appendChild(panelEl);

    // Título convertido en botón (patrón acordeón WAI-ARIA)
    h2.id = "week-title-" + n;
    h2.textContent = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "week-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", panelEl.id);
    btn.setAttribute("aria-describedby", "week-meta-" + n);
    btn.innerHTML =
      '<span class="wt-title"></span>' +
      '<svg class="wt-chev" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    btn.querySelector(".wt-title").textContent = title;
    h2.appendChild(btn);

    // Progreso de la semana
    const pct = total ? Math.round((done / total) * 100) : 0;
    const meta = document.createElement("div");
    meta.className = "week-meta";
    meta.id = "week-meta-" + n;
    meta.innerHTML =
      `<span class="status-chip is-${state}">${STATE_LABEL[state]}</span>` +
      `<span class="wp-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>` +
      `<span class="wp-text">${done} de ${total} secciones completas</span>`;
    header.appendChild(meta);

    model.push({ card, btn, panel: panelEl, inner, title, n, done, total, state, open: false });
  });

  // Paginador entre semanas
  model.forEach((m, i) => {
    const hasPrev = i > 0;
    const hasNext = i < model.length - 1;
    if (!hasPrev && !hasNext) return;
    const pager = document.createElement("nav");
    pager.className = "week-pager";
    pager.setAttribute("aria-label", "Cambiar de semana desde " + m.title);
    if (hasPrev) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pager-btn"; b.dataset.go = String(i - 1);
      b.textContent = "← " + model[i - 1].title;
      pager.appendChild(b);
    }
    if (hasNext) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pager-btn pager-next"; b.dataset.go = String(i + 1);
      b.textContent = model[i + 1].title + " →";
      pager.appendChild(b);
    }
    m.inner.appendChild(pager);
  });

  // Resumen + navegación
  const totalDone = model.reduce((s, m) => s + m.done, 0);
  const totalSections = model.reduce((s, m) => s + m.total, 0);
  const totalPct = totalSections ? Math.round((totalDone / totalSections) * 100) : 0;

  const summary = document.createElement("section");
  summary.className = "notebook-summary";
  summary.setAttribute("aria-label", "Resumen del cuaderno");
  summary.innerHTML = `
    <div class="sum-stats">
      <div class="sum-card"><strong>${model.length}</strong><span>semanas registradas</span></div>
      <div class="sum-card"><strong>${totalDone}/${totalSections}</strong><span>secciones completas</span></div>
      <div class="sum-card"><strong>${totalPct}%</strong><span>avance total</span></div>
    </div>
    <div class="sum-bar" role="progressbar" aria-label="Avance total del cuaderno" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${totalPct}"><i style="width:${totalPct}%"></i></div>
  `;

  const nav = document.createElement("nav");
  nav.className = "week-nav";
  nav.setAttribute("aria-label", "Ir a una semana");
  const chipList = document.createElement("div");
  chipList.className = "wn-list";
  const chips = model.map((m, i) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "wn-chip";
    c.dataset.go = String(i);
    c.innerHTML = `<i class="wn-dot is-${m.state}" aria-hidden="true"></i><span>${m.title}</span><span class="sr-only"> (${STATE_SR[m.state]})</span>`;
    chipList.appendChild(c);
    return c;
  });
  const tools = document.createElement("div");
  tools.className = "wn-tools";
  tools.innerHTML =
    '<button type="button" class="wn-tool" id="expand-all">Expandir todo</button>' +
    '<button type="button" class="wn-tool" id="collapse-all">Contraer todo</button>';
  nav.append(chipList, tools);
  timeline.parentNode.insertBefore(summary, timeline);
  timeline.parentNode.insertBefore(nav, timeline);

  // Apertura / cierre
  const setOpen = (i, open, announce) => {
    const m = model[i];
    m.open = open;
    m.card.classList.toggle("collapsed", !open);
    m.btn.setAttribute("aria-expanded", String(open));
    m.panel.toggleAttribute("inert", !open);
    if (announce) say(m.title + (open ? " expandida" : " contraída"));
  };

  const goTo = (i, opts = {}) => {
    if (opts.exclusive) model.forEach((m, j) => { if (j !== i && m.open) setOpen(j, false, false); });
    setOpen(i, true, false);
    setTimeout(() => {
      model[i].card.scrollIntoView({ behavior: isReduced() ? "auto" : "smooth", block: "start" });
      if (opts.focus !== false) model[i].btn.focus({ preventScroll: true });
      try { history.replaceState(null, "", "#" + model[i].card.id); } catch (e) { /* file:// */ }
    }, 60);
    say(model[i].title + " abierta");
  };

  model.forEach((m, i) => {
    m.btn.addEventListener("click", () => setOpen(i, !m.open, true));
  });
  chips.forEach((c) => c.addEventListener("click", () => goTo(Number(c.dataset.go))));
  document.querySelectorAll(".pager-btn").forEach((b) =>
    b.addEventListener("click", () => goTo(Number(b.dataset.go), { exclusive: true }))
  );
  $("expand-all").addEventListener("click", () => { model.forEach((m, i) => setOpen(i, true, false)); say("Todas las semanas expandidas"); });
  $("collapse-all").addEventListener("click", () => { model.forEach((m, i) => setOpen(i, false, false)); say("Todas las semanas contraídas"); });

  // Estado inicial: solo la primera abierta (o la del enlace #semana-N)
  const hashIdx = cards.findIndex((c) => "#" + c.id === location.hash);
  model.forEach((m, i) => setOpen(i, i === (hashIdx >= 0 ? hashIdx : 0), false));
  if (hashIdx >= 0) setTimeout(() => goTo(hashIdx, { focus: false }), 250);
  window.addEventListener("hashchange", () => {
    const idx = cards.findIndex((c) => "#" + c.id === location.hash);
    if (idx >= 0) goTo(idx, { focus: false });
  });

  // Semana actual resaltada al hacer scroll
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = cards.indexOf(entry.target);
        chips.forEach((c, j) => {
          if (j === idx) {
            c.setAttribute("aria-current", "true");
            const left = c.offsetLeft - chipList.clientWidth / 2 + c.clientWidth / 2;
            chipList.scrollTo({ left, behavior: isReduced() ? "auto" : "smooth" });
          } else {
            c.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });
    cards.forEach((c) => spy.observe(c));
  }

  /* ---------- Código: región accesible por teclado + botón copiar ---------- */
  document.querySelectorAll("pre").forEach((pre) => {
    const weekCard = pre.closest(".week-card");
    const weekTitle = weekCard ? model[cards.indexOf(weekCard)].title : "la práctica";
    pre.setAttribute("tabindex", "0");
    pre.setAttribute("role", "region");
    pre.setAttribute("aria-label", "Código de " + weekTitle + ". Usa las flechas para desplazarte.");

    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-btn";
    copy.textContent = "Copiar";
    copy.setAttribute("aria-label", "Copiar el código de " + weekTitle);
    wrap.appendChild(copy);

    let timer = 0;
    const done = (ok) => {
      copy.textContent = ok ? "¡Copiado!" : "No se pudo";
      say(ok ? "Código copiado al portapapeles" : "No se pudo copiar el código");
      clearTimeout(timer);
      timer = setTimeout(() => { copy.textContent = "Copiar"; }, 1800);
    };
    copy.addEventListener("click", async () => {
      const text = (pre.querySelector("code") || pre).textContent;
      try {
        await navigator.clipboard.writeText(text);
        done(true);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        ta.remove();
        done(ok);
      }
    });
  });

  /* ---------- Capturas: aviso si falta la imagen + ampliación accesible ---------- */
  const shotLinks = [...document.querySelectorAll(".shot-link")];
  shotLinks.forEach((a) => {
    const img = a.querySelector("img");
    if (!img) return;
    const markMissing = () => { a.classList.add("is-missing"); a.dataset.path = img.getAttribute("src") || ""; };
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener("error", markMissing);
    img.addEventListener("load", () => a.classList.remove("is-missing"));
  });

  if (shotLinks.length) {
    const dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.setAttribute("aria-label", "Vista ampliada de la captura");
    dlg.innerHTML =
      '<div class="lb-inner">' +
      '<img class="lb-img" alt="">' +
      '<div class="lb-bar">' +
      '<button type="button" class="lb-btn" data-d="-1" aria-label="Captura anterior">←</button>' +
      '<p class="lb-cap" aria-live="polite"></p>' +
      '<button type="button" class="lb-btn" data-d="1" aria-label="Captura siguiente">→</button>' +
      '<button type="button" class="lb-btn lb-close" aria-label="Cerrar vista ampliada">✕</button>' +
      "</div></div>";
    document.body.appendChild(dlg);

    const lbImg = dlg.querySelector(".lb-img");
    const lbCap = dlg.querySelector(".lb-cap");
    let current = 0;
    let opener = null;

    const show = (i) => {
      current = (i + shotLinks.length) % shotLinks.length;
      const a = shotLinks[current];
      const fig = a.closest("figure");
      const caption = fig && fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent.trim() : "";
      lbImg.src = a.getAttribute("href");
      lbImg.alt = a.querySelector("img") ? a.querySelector("img").alt : "";
      lbCap.textContent = (current + 1) + " de " + shotLinks.length + ": " + caption;
    };

    shotLinks.forEach((a, i) => {
      a.addEventListener("click", (e) => {
        if (a.classList.contains("is-missing")) { e.preventDefault(); return; }
        if (typeof dlg.showModal !== "function") return; // sin soporte: se abre la imagen en otra pestaña
        e.preventDefault();
        opener = a;
        show(i);
        dlg.showModal();
      });
    });

    dlg.querySelectorAll("[data-d]").forEach((b) =>
      b.addEventListener("click", () => show(current + Number(b.dataset.d)))
    );
    dlg.querySelector(".lb-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    dlg.addEventListener("close", () => { if (opener) opener.focus(); });
  }
})();