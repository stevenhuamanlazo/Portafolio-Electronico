/* =========================================================
   Bitácora de Aprendizaje — Script Interactivo
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Barra de progreso de lectura
  const progressBar = document.getElementById("scroll-progress");

  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;

    progressBar.style.width = `${value}%`;
    progressBar.setAttribute("aria-valuenow", String(value));
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  // 2. Animación de entrada al hacer scroll (IntersectionObserver)
  const weekCards = document.querySelectorAll(".week-card");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    weekCards.forEach((card) => card.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // Deja de observar una vez animado
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    weekCards.forEach((card) => observer.observe(card));
  }
});