/* ==========================================================================
   CUADERNO — carga de semanas
   Cada semana vive en su propio archivo: cuaderno/semanas/semana-01.html ... semana-16.html
   Si el archivo de una semana no existe, se muestra una tarjeta "Pendiente".
   Cuando todas están en pantalla, se activan progreso.js, semanas.js y vista.js (en ese orden).
   ========================================================================== */
(() => {
  const list = document.getElementById("timeline");
  if (!list) return;

  const total = Number(list.dataset.total) || 16;
  const base = list.dataset.base || "cuaderno/semanas/";
  const pad = (n) => String(n).padStart(2, "0");

  /* Tarjeta de una semana que todavía no tiene archivo: misma estructura que las reales */
  const pendiente = (n) => `
<li class="week-card" id="semana-${n}">
  <div class="week-marker" aria-hidden="true">${n}</div>
  <article class="card-body">
    <header class="card-header">
      <span class="week-label">REGISTRO SEMANAL</span>
      <h2>Semana ${n}</h2>
    </header>
    <section class="section-block">
      <h3>1. Descripción de temas aprendidos con mis propias palabras</h3>
      <p class="hint">(Definiciones y procedimientos)</p>
      <div class="placeholder-box">[Escribe aquí los temas aprendidos durante esta semana con tus propias palabras.]</div>
    </section>
    <section class="section-block">
      <h3>2. Ejercicios de laboratorio - Resultados</h3>
      <div class="placeholder-box">[Describe aquí los ejercicios de laboratorio y sus resultados.]</div>
    </section>
    <section class="section-block">
      <h3>3. Reflexión: ¿Qué aprendí? y ¿Cómo aprendí?</h3>
      <div class="placeholder-box">[Escribe aquí qué aprendiste, cómo aprendiste, qué dificultad encontraste y cómo la solucionaste.]</div>
    </section>
  </article>
</li>`;

  /* Devuelve { n, html } o { n, html: null, error: true } si no se pudo leer (p. ej. abierto con file://) */
  const traer = async (n) => {
    try {
      const r = await fetch(base + "semana-" + pad(n) + ".html", { cache: "no-cache" });
      if (r.status === 404) return { n, html: null };
      if (!r.ok) return { n, html: null, error: true };
      return { n, html: await r.text() };
    } catch (e) {
      return { n, html: null, error: true };
    }
  };

  const cargarScript = (src) =>
    new Promise((ok) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = s.onerror = () => ok();
      document.body.appendChild(s);
    });

  (async () => {
    const semanas = await Promise.all(Array.from({ length: total }, (_, i) => traer(i + 1)));

    // Si todas fallaron por error de lectura, casi seguro se abrió el archivo directo (file://)
    if (semanas.every((s) => s.error)) {
      list.innerHTML =
        '<li class="week-error" role="alert"><strong>No se pudieron cargar las semanas.</strong> ' +
        "Abre el cuaderno desde un servidor: Live Server en VS Code o tu enlace de GitHub Pages. " +
        "No funciona con doble clic sobre el archivo.</li>";
      return;
    }

    const frag = document.createDocumentFragment();
    semanas.forEach((s) => {
      const tpl = document.createElement("template");
      tpl.innerHTML = s.html && s.html.trim() ? s.html : pendiente(s.n);
      frag.appendChild(tpl.content);
    });
    list.appendChild(frag);

    // Orden importante: primero el progreso de lectura, luego semanas (acordeón) y luego la vista en columnas
    await cargarScript("cuaderno/js/progreso.js");
    await cargarScript("cuaderno/js/semanas.js");
    await cargarScript("cuaderno/js/vista.js");
    document.documentElement.classList.add("semanas-listas");
  })();
})();