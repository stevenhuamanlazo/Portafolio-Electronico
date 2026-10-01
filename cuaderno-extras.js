/* ==========================================================================
   CUADERNO — animaciones e interacción
   Tema (compartido con el portafolio), red de nodos, título animado, chip de terminal
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Respeta la preferencia del sistema Y el interruptor "Pausar animaciones" del panel
  const isReduced = () => {
    const m = root.getAttribute("data-motion");
    return m === "reduce" || (m !== "full" && mql.matches);
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  root.classList.add("js");

  /* ---------- 1. Modo oscuro (misma clave que el portafolio) ---------- */
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

  /* ---------- 2. Red de nodos (fondo de toda la página) ---------- */
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

      if (!isReduced()) {
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

      if (running && !isReduced()) rafId = requestAnimationFrame(draw);
    };

    const start = () => { if (!running) { running = true; draw(); } };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };

    resize();
    draw();
    if (!isReduced()) start();

    window.addEventListener("motionchange", () => {
      if (isReduced()) { stop(); draw(); } else { start(); }
    });
    window.addEventListener("resize", () => { resize(); draw(); }, { passive: true });
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("mouseout", (e) => { if (!e.relatedTarget) mouse.x = mouse.y = -999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!isReduced()) start();
    });
  }

  /* ---------- 3. Título animado: descifrado → glitch → desaparece → vuelve ---------- */
  const nameEls = [...document.querySelectorAll(".nm")];
  const squiggle = document.querySelector(".squiggle");
  const title = document.querySelector(".hero-title");

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

    const glitch = async () => {
      if (!title) return;
      title.classList.add("glitch");
      await sleep(420);
      title.classList.remove("glitch");
    };

    const fontsReady = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, sleep(900)])
      : sleep(0);

    fontsReady.then(async () => {
      measure();


      window.addEventListener("resize", () => measure(), { passive: true });
      root.classList.add("nm-ready");

      while (true) {
        if (isReduced()) {
          setFinal();
          if (squiggle) squiggle.classList.add("on");
          await sleep(500);
          continue;
        }
        if (squiggle) squiggle.classList.remove("on");
        await run(1200, "in");
        if (squiggle) squiggle.classList.add("on");
        await sleep(1100);
        await glitch();
        await sleep(1400);
        await glitch();
        await sleep(900);
        if (squiggle) squiggle.classList.remove("on");
        await run(750, "out");
        await sleep(350);
      }
    });
  }

  /* ---------- 4. Chip estilo terminal ---------- */
  const toastText = document.getElementById("dev-toast-text");
  if (toastText) {
    const msgs = [
      "$ git add semana-1/",
      '$ git commit -m "lab: semana 1"',
      "✔ evidencia guardada",
      "$ git push origin main",
      "📝 reflexión pendiente…"
    ];
    let i = 0;
    toastText.textContent = msgs[0];
    setInterval(() => {
      if (isReduced()) return;
      toastText.classList.add("swap");
      setTimeout(() => {
        i = (i + 1) % msgs.length;
        toastText.textContent = msgs[i];
        toastText.classList.remove("swap");
      }, 350);
    }, 2800);
  }
})();