/* ==========================================================================
   EXTRAS — animaciones e interacción (se carga después de script.js)
   Incluye: modo oscuro, fondo de red, nombre animado, terminal, contadores,
   toast de commits e inclinación de tarjetas.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  root.classList.add("js");

  /* ---------- 1. Modo oscuro ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  let netColor = "37, 99, 235";
  let netColor2 = "124, 58, 237";

  const readNetColor = () => {
    const cs = getComputedStyle(root);
    const v = cs.getPropertyValue("--net-rgb").trim();
    const v2 = cs.getPropertyValue("--net-rgb2").trim();
    if (v) netColor = v;
    if (v2) netColor2 = v2;
  };

  const applyTheme = (theme, persist) => {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
      themeBtn.title = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    }
    if (persist) {
      try { localStorage.setItem("theme", theme); } catch (e) { /* sin almacenamiento */ }
    }
    readNetColor();
  };

  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      root.classList.add("theme-anim");
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
      setTimeout(() => root.classList.remove("theme-anim"), 500);
    });
  }

  /* ---------- 2. Barra de progreso de la página ---------- */
  const bar = document.createElement("div");
  bar.className = "page-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);

  const updateBar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", updateBar, { passive: true });
  window.addEventListener("resize", updateBar, { passive: true });
  updateBar();

  /* ---------- 3. Red de nodos (fondo de toda la página) ---------- */
  const canvas = document.getElementById("net-canvas");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, nodes = [], running = false, rafId = 0;
    const mouse = { x: -999, y: -999 };
    const LINK = 135;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(28, Math.min(80, Math.round((w * h) / 20000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.5 + 1
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (!reduceMotion) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${netColor}, ${(1 - d / LINK) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 170) {
          ctx.strokeStyle = `rgba(${netColor2}, ${(1 - dm / 170) * 0.55})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = `rgba(${netColor}, 0.5)`;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running && !reduceMotion) rafId = requestAnimationFrame(draw);
    };

    const start = () => { if (!running) { running = true; draw(); } };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };

    resize();
    draw();
    if (!reduceMotion) start();

    window.addEventListener("resize", () => { resize(); draw(); }, { passive: true });
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("mouseout", (e) => { if (!e.relatedTarget) mouse.x = mouse.y = -999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!reduceMotion) start();
    });
  }

  /* ---------- 4. Nombre animado: descifrado → desvanecer → repetir ---------- */
  const nameEls = [...document.querySelectorAll(".nm")];
  const squiggle = document.querySelector(".squiggle");

  if (nameEls.length) {
    const GLYPHS = "01<>/{}[]()#$%&*+=_;:".split("");
    const esc = (c) => c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rndGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    const finals = nameEls.map((el) => el.dataset.text || el.textContent.trim());
    const total = finals.reduce((n, t) => n + t.length, 0);

    const setFinal = () => nameEls.forEach((el, i) => { el.textContent = finals[i]; });

    const measure = () => {
      nameEls.forEach((el) => { el.style.minWidth = ""; });
      setFinal();
      nameEls.forEach((el) => { el.style.minWidth = el.getBoundingClientRect().width + "px"; });
    };

    // dir: "in" (aparece) | "out" (desaparece)
    const run = (dur, dir) => new Promise((resolve) => {
      const thresholds = Array.from({ length: total }, (_, g) => (g / total) * 0.55 + Math.random() * 0.2);
      const t0 = performance.now();
      let last = 0;

      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        if (now - last > 42 || p >= 1) {
          last = now;
          let g = 0;
          nameEls.forEach((el, i) => {
            let html = "";
            for (const ch of finals[i]) {
              const th = thresholds[g++];
              const done = p > th + 0.2;
              const mid = p > th;
              let state;
              if (dir === "in") state = done ? "final" : mid ? "scr" : "empty";
              else state = done ? "empty" : mid ? "scr" : "final";
              if (p >= 1) state = dir === "in" ? "final" : "empty";

              if (state === "final") html += esc(ch);
              else if (state === "scr") html += `<span class="scr">${esc(rndGlyph())}</span>`;
              else html += "&nbsp;";
            }
            el.innerHTML = html;
          });
        }
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

    const fontsReady = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, sleep(900)])
      : sleep(0);

    fontsReady.then(async () => {
      measure();

      if (reduceMotion) {
        setFinal();
        root.classList.add("nm-ready");
        if (squiggle) squiggle.classList.add("on");
        return;
      }

      window.addEventListener("resize", () => measure(), { passive: true });
      root.classList.add("nm-ready");

      const title = document.querySelector(".hero-title");
      const glitch = async () => {
        if (!title) return;
        title.classList.add("glitch");
        await sleep(420);
        title.classList.remove("glitch");
      };

      // Ciclo infinito: aparece → glitch → se mantiene → desaparece → pausa
      while (true) {
        if (squiggle) squiggle.classList.remove("on");
        await run(1300, "in");
        if (squiggle) squiggle.classList.add("on");
        await sleep(1100);
        await glitch();
        await sleep(1300);
        await glitch();
        await sleep(900);
        if (squiggle) squiggle.classList.remove("on");
        await run(800, "out");
        await sleep(350);
      }
    });
  }

  /* ---------- 5. Toast estilo terminal (commits / deploy) ---------- */
  const toastText = document.getElementById("dev-toast-text");
  if (toastText) {
    const msgs = [
      '$ git commit -m "feat: portafolio"',
      "✔ build completado · 0 errores",
      "$ git push origin main",
      "☁ desplegando en Azure Static Web Apps",
      "♿ revisando accesibilidad (WCAG)…",
      "$ npm run dev  →  localhost:5500"
    ];
    let i = 0;
    toastText.textContent = msgs[0];
    if (!reduceMotion) {
      setInterval(() => {
        toastText.classList.add("swap");
        setTimeout(() => {
          i = (i + 1) % msgs.length;
          toastText.textContent = msgs[i];
          toastText.classList.remove("swap");
        }, 350);
      }, 2800);
    }
  }

  /* ---------- 6. Terminal que "escribe" comandos ---------- */
  const term = document.getElementById("terminal-body");
  if (term) {
    const script = [
      { cmd: "whoami", out: "steven_huamanlazo" },
      { cmd: "cat carrera.txt", out: "Ingeniería de Sistemas — UNCP\nIX ciclo · Huancayo, Perú" },
      { cmd: "ls stack/", out: "react   javascript   html-css   azure   sql   figma" },
      { cmd: 'grep -i "enfoque" perfil.md', out: "Frontend · UX · Accesibilidad web (WCAG)" },
      { cmd: "echo $OBJETIVO", out: '"Construir software útil, accesible y bien diseñado"' }
    ];

    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const promptHtml = '<span class="t-prompt">steven@uncp</span><span class="t-dim">:~$ </span>';
    let started = false;

    const renderAll = () => {
      term.innerHTML = script.map((l) =>
        `${promptHtml}<span class="t-cmd">${esc(l.cmd)}</span>\n<span class="t-out">${esc(l.out)}</span>\n`
      ).join("") + `${promptHtml}<span class="t-caret"></span>`;
    };

    const play = async () => {
      term.innerHTML = "";
      for (const line of script) {
        const row = document.createElement("div");
        row.innerHTML = `${promptHtml}<span class="t-cmd"></span><span class="t-caret"></span>`;
        term.appendChild(row);
        const cmdEl = row.querySelector(".t-cmd");
        const caret = row.querySelector(".t-caret");
        for (const ch of line.cmd) { cmdEl.textContent += ch; await sleep(42); }
        await sleep(260);
        caret.remove();
        const out = document.createElement("div");
        out.className = "t-out";
        out.textContent = line.out;
        term.appendChild(out);
        await sleep(520);
      }
      const last = document.createElement("div");
      last.innerHTML = `${promptHtml}<span class="t-caret"></span>`;
      term.appendChild(last);
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      renderAll();
    } else {
      new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          obs.disconnect();
          play();
        }
      }, { threshold: 0.35 }).observe(term);
    }
  }

  /* ---------- 7. Contadores animados ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1400;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- 8. Inclinación 3D en tarjetas de proyecto ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }
})();