document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Efecto máquina de escribir (rol) */
  const typedEl = document.getElementById("typed-name");
  if (typedEl && !prefersReducedMotion) {
    const roles = [
      "Desarrollador Frontend",
      "Especialista en UI/UX",
      "Ingeniero de Sistemas",
      "Apasionado por la Accesibilidad"
    ];
    let roleIndex = 0;
    let charIndex = roles[0].length;
    let isDeleting = true; // empieza borrando el texto inicial del HTML

    const type = () => {
      const current = roles[roleIndex];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }
      typedEl.textContent = current.substring(0, charIndex);

      let delay = isDeleting ? 40 : 90;

      if (!isDeleting && charIndex === current.length) {
        delay = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = 400;
      }
      setTimeout(type, delay);
    };
    setTimeout(type, 2200);
  }

  /* 2. Menú móvil */
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  const closeMenu = () => {
    if (!toggle || !nav) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* 3. Header con sombra al hacer scroll */
  const header = document.getElementById("site-header");
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 4. Enlace activo según la sección visible */
  const navLinks = document.querySelectorAll(".main-nav a");
  const sections = [...navLinks]
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) =>
              link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* 5. Animación de entrada al hacer scroll */
  const revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }
});