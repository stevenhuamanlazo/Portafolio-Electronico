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
})();