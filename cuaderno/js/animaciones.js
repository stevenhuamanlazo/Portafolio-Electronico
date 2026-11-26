/* ==========================================================================
   PORTAFOLIO — animaciones
   Cárgalo al final del <body> en index.html:
     <script src="js/animaciones.js" defer></script>

   Lo que hace:
   1. Scroll-reveal: aparición suave de secciones al hacer scroll
   2. Partículas de código en el hero (canvas)
   3. Animación de contadores numéricos (stat-num)
   ========================================================================== */
(function () {
  "use strict";

  /* ================================================================
     1. SCROLL-REVEAL
     Agrega la clase .sr a los elementos que deben aparecer al hacer
     scroll, y .is-visible cuando entran en la pantalla.
     ================================================================ */
  const SR_TARGETS = [
    { sel: ".arch-card",        mod: "" },
    { sel: ".service-card",     mod: "sr-scale" },
    { sel: ".project-card",     mod: "" },
    { sel: ".stat-box",         mod: "sr-scale" },
    { sel: ".tech-pill",        mod: "sr-scale" },
    { sel: ".nb-wk",            mod: "" },
    { sel: ".reflect-card",     mod: "" },
    { sel: ".biblio-card",      mod: "" },
    { sel: ".section-title",    mod: "" },
    { sel: ".section-tag",      mod: "" },
    { sel: ".cv-card",          mod: "sr-left" },
    { sel: ".bento-about-container", mod: "sr-right" },
    { sel: ".hero-photo-card",  mod: "sr-right" },
  ];

  const reduced = () =>
    document.documentElement.getAttribute("data-motion") === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduced()) {
    SR_TARGETS.forEach(({ sel, mod }) => {
      document.querySelectorAll(sel).forEach((el) => {
        // No doble-clase
        if (el.classList.contains("sr")) return;
        el.classList.add("sr");
        if (mod) el.classList.add(mod);
      });
    });

    // Grupos: .service-card, .project-card, .stat-box dentro de su contenedor
    [".services-grid", ".projects-grid", ".stats-row", ".bento-grid"].forEach((grid) => {
      const g = document.querySelector(grid);
      if (g) g.classList.add("sr-group");
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    document.querySelectorAll(".sr").forEach((el) => obs.observe(el));
  }

  /* ================================================================
     2. PARTÍCULAS DE CÓDIGO EN EL HERO
     Dibuja fragmentos de código flotando en un <canvas> que se
     inserta dentro del hero.
     ================================================================ */
  const heroSection = document.querySelector(".hero-layout, #inicio, .hero-section, section:first-of-type");
  if (heroSection && !reduced()) {
    const canvas = document.createElement("canvas");
    canvas.id = "code-particles";
    heroSection.appendChild(canvas);

    const SNIPPETS = [
      "const", "=>", "async", "await", "fetch()", ".then()", "{}",
      "</>", "git push", "npm run", "if (", "return", "import",
      "useState", "true", "null", "[]", "API", "HTTP", "CSS",
      "HTML", ".py", "Django", "class", "def", "render()",
    ];

    let W, H, particles;
    const DARK = () => document.documentElement.getAttribute("data-theme") === "dark";

    function resize() {
      W = canvas.width  = heroSection.offsetWidth;
      H = canvas.height = heroSection.offsetHeight;
    }

    function mkParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        txt: SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)],
        size: 10 + Math.random() * 7,
        speedX: (Math.random() - .5) * .35,
        speedY: -0.2 - Math.random() * .45,
        alpha: .15 + Math.random() * .55,
        life:  0,
        maxLife: 220 + Math.random() * 180,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: 38 }, mkParticle);
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      const baseColor = DARK() ? "34, 211, 238" : "3, 105, 161";

      particles.forEach((p, i) => {
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;

        const fade = p.life < 30 ? p.life / 30 : p.life > p.maxLife - 30 ? (p.maxLife - p.life) / 30 : 1;
        ctx.globalAlpha = p.alpha * fade;
        ctx.font = `600 ${p.size}px "SF Mono", "Fira Code", monospace`;
        ctx.fillStyle = `rgb(${baseColor})`;
        ctx.fillText(p.txt, p.x, p.y);

        if (p.life >= p.maxLife) particles[i] = mkParticle();
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", () => { resize(); particles.forEach((p) => { p.x = Math.random() * W; p.y = Math.random() * H; }); });
  }

  /* ================================================================
     3. CONTADORES NUMÉRICOS (animar stat-num, nb-count span…)
     ================================================================ */
  if (!reduced()) {
    const countEls = document.querySelectorAll(".stat-num, .nb-count > span, .reflect-num");
    if (countEls.length) {
      const countObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = parseInt(el.textContent, 10);
            if (isNaN(target)) return;
            countObs.unobserve(el);
            const dur = 1000, start = performance.now();
            const from = Math.max(0, target - Math.ceil(target * .6));
            const tick = (now) => {
              const t = Math.min((now - start) / dur, 1);
              const ease = 1 - Math.pow(1 - t, 3);
              el.textContent = Math.round(from + (target - from) * ease);
              if (t < 1) requestAnimationFrame(tick);
              else el.textContent = target;
            };
            requestAnimationFrame(tick);
          });
        },
        { threshold: 0.5 }
      );
      countEls.forEach((el) => countObs.observe(el));
    }
  }
})();