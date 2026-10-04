/* ==========================================================================
   CUADERNO — vista de semana: pestañas del laboratorio + ampliar columna
   Se carga DESPUÉS de semanas.js (que ya envolvió las secciones en .week-panel-inner)
   ========================================================================== */
(() => {
  const mqDesktop = window.matchMedia ? window.matchMedia("(min-width: 1100px)") : { matches: false };
  const reduced = () => {
    const m = document.documentElement.getAttribute("data-motion");
    return m === "reduce" || (m !== "full" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
  const live = (msg) => {
    const el = document.getElementById("a11y-live");
    if (el) { el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 30); }
  };

  document.querySelectorAll(".week-card").forEach((card) => {
    const n = (card.id || "").replace("semana-", "") || "x";
    const blocks = [...card.querySelectorAll(".week-panel-inner > .section-block")];

    /* ---------- 1. Cabecera de columna: número + título + botón ampliar ---------- */
    blocks.forEach((block, i) => {
      const h3 = block.querySelector(":scope > h3");
      if (!h3) return;
      const label = h3.textContent.trim();
      h3.id = h3.id || "col-title-" + n + "-" + (i + 1);
      const num = document.createElement("span");
      num.className = "col-num";
      num.setAttribute("aria-hidden", "true");
      num.textContent = String(i + 1);
      // El título ya empieza con "1. "; se quita porque ahora va el círculo numerado
      h3.textContent = label.replace(/^\d+\.\s*/, "");
      h3.prepend(num);

      const head = document.createElement("div");
      head.className = "col-head";
      block.insertBefore(head, h3);
      head.appendChild(h3);

      const zoom = document.createElement("button");
      zoom.type = "button";
      zoom.className = "col-zoom";
      zoom.setAttribute("aria-pressed", "false");
      zoom.setAttribute("aria-label", "Ampliar columna: " + h3.textContent.trim());
      zoom.title = "Ampliar / reducir columna";
      zoom.textContent = "⤢";
      head.appendChild(zoom);

      // Columna con scroll: debe poder recorrerse con teclado
      block.setAttribute("role", "region");
      block.setAttribute("aria-labelledby", h3.id);
      block.tabIndex = 0;

      zoom.addEventListener("click", () => {
        const on = !block.classList.contains("is-zoom");
        blocks.forEach((b) => {
          b.classList.remove("is-zoom");
          const z = b.querySelector(".col-zoom");
          if (z) { z.setAttribute("aria-pressed", "false"); z.textContent = "⤢"; }
        });
        if (on) {
          block.classList.add("is-zoom");
          zoom.setAttribute("aria-pressed", "true");
          zoom.textContent = "⤡";
          block.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "nearest" });
        }
        live(on ? "Columna ampliada" : "Columna reducida");
      });
    });

    /* ---------- 1b. Temas desplegables: abrir / cerrar todos ---------- */
    blocks.forEach((block) => {
      const topics = [...block.querySelectorAll("details.topic")];
      if (topics.length < 2) return;
      const bar = document.createElement("div");
      bar.className = "topic-tools";
      bar.innerHTML =
        '<button type="button" data-open="1">Abrir todos</button>' +
        '<button type="button" data-open="0">Cerrar todos</button>';
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const open = b.dataset.open === "1";
        topics.forEach((t) => { t.open = open; });
        live(open ? "Todos los temas abiertos" : "Todos los temas cerrados");
      });
      topics[0].parentNode.insertBefore(bar, topics[0]);
    });

    /* ---------- 2. Pestañas en el laboratorio ---------- */
    card.querySelectorAll(".lab-grid").forEach((grid, gi) => {
      const items = [...grid.querySelectorAll(":scope > .lab-item")];
      if (items.length < 2) return;
      grid.classList.add("is-tabs");

      const list = document.createElement("div");
      list.className = "lab-tabs";
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-label", "Secciones del laboratorio");
      grid.insertBefore(list, grid.firstChild);

      const tabs = items.map((item, i) => {
        const dt = item.querySelector("dt");
        let text = dt ? dt.textContent.trim() : "Sección " + (i + 1);
        text = text.replace(/^Captura$/, "Capturas").replace(/^Código de la Práctica$/, "Código");
        if (dt) dt.classList.add("sr-only");

        const id = "tab-" + n + "-" + gi + "-" + i;
        const tab = document.createElement("button");
        tab.type = "button";
        tab.id = id;
        tab.className = "lab-tab";
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", id + "-panel");
        tab.textContent = text;
        const count = item.querySelectorAll(".shot-card").length;
        if (count) {
          const c = document.createElement("span");
          c.className = "tab-count";
          c.textContent = String(count);
          c.setAttribute("aria-label", count + " capturas");
          tab.appendChild(c);
        }
        item.id = id + "-panel";
        item.setAttribute("role", "tabpanel");
        item.setAttribute("aria-labelledby", id);
        list.appendChild(tab);
        return tab;
      });

      const select = (idx, focus) => {
        idx = (idx + tabs.length) % tabs.length;
        tabs.forEach((t, i) => {
          const on = i === idx;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          items[i].hidden = !on;
        });
        if (focus) {
          tabs[idx].focus();
          tabs[idx].scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      };

      tabs.forEach((t, i) => {
        t.addEventListener("click", () => select(i, false));
        t.addEventListener("keydown", (e) => {
          const cur = tabs.indexOf(t);
          if (e.key === "ArrowRight") { e.preventDefault(); select(cur + 1, true); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); select(cur - 1, true); }
          else if (e.key === "Home") { e.preventDefault(); select(0, true); }
          else if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
        });
      });
      select(0, false);
    });
  });
  /* ---------- 3. Filtro por ejercicio (capturas y código) ---------- */
  document.querySelectorAll(".subgroups").forEach((wrap) => {
    const groups = [...wrap.querySelectorAll(":scope > .subgroup")];
    if (groups.length < 2) return;

    const bar = document.createElement("div");
    bar.className = "seg";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", wrap.dataset.label || "Filtrar por ejercicio");

    const count = (g) => g.querySelectorAll(".shot-card, .code-file").length;
    const make = (key, text, num, ex) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "seg-btn";
      b.dataset.key = key;
      if (ex) b.dataset.ex = ex;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="seg-dot" aria-hidden="true"></span>' + text + '<span class="seg-num">' + num + "</span>";
      bar.appendChild(b);
      return b;
    };

    const showAll = wrap.dataset.default === "all";
    if (showAll) make("all", "Todas", groups.reduce((n, g) => n + count(g), 0), "");
    groups.forEach((g, i) => make(String(i), g.dataset.short || "Grupo " + (i + 1), count(g), g.dataset.ex));

    const select = (key) => {
      [...bar.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key)));
      groups.forEach((g, i) => { g.hidden = !(key === "all" || key === String(i)); });
    };
    bar.addEventListener("click", (e) => {
      const b = e.target.closest(".seg-btn");
      if (!b) return;
      select(b.dataset.key);
      const g = b.dataset.key === "all" ? null : groups[Number(b.dataset.key)];
      live(g ? g.dataset.label + " seleccionado" : "Mostrando todos los ejercicios");
    });
    wrap.parentNode.insertBefore(bar, wrap);
    select(showAll ? "all" : "0");
  });

  /* ---------- 4. Código: archivos recortados con "Ver código completo" ---------- */
  document.querySelectorAll(".code-file").forEach((file) => {
    const pre = file.querySelector("pre");
    const name = file.querySelector(".file-name");
    if (!pre || !name) return;
    const lines = (pre.textContent.replace(/\n$/, "").match(/\n/g) || []).length + 1;

    const head = document.createElement("div");
    head.className = "file-head";
    name.parentNode.insertBefore(head, name);
    head.appendChild(name);
    const meta = document.createElement("span");
    meta.className = "file-meta";
    meta.textContent = lines + " líneas";
    head.appendChild(meta);

    if (lines <= 16) return;
    file.classList.add("is-collapsed");
    const more = document.createElement("button");
    more.type = "button";
    more.className = "code-more";
    more.setAttribute("aria-expanded", "false");
    more.textContent = "Ver código completo (" + lines + " líneas)";
    file.appendChild(more);
    more.addEventListener("click", () => {
      const open = file.classList.toggle("is-collapsed") === false;
      more.setAttribute("aria-expanded", String(open));
      more.textContent = open ? "Ver menos" : "Ver código completo (" + lines + " líneas)";
      if (!open) file.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
    });
  });
})();