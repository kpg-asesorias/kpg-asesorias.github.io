/* KpG · comportamiento del sitio. Todo el contenido se ve igual sin JavaScript. */
(function () {
  "use strict";
  var WHATSAPP = "56942652503";
  var UF_RESPALDO = { valor: 41439.89, fecha: "2026-11-30" };
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function wa(texto) { return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texto); }
  function pesos(n, dec) { return "$" + n.toLocaleString("es-CL", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); }

  /* Cabecera con sombra al bajar */
  var cab = $(".cabecera");
  if (cab) {
    var sombra = function () { cab.classList.toggle("con-sombra", window.scrollY > 8); };
    sombra(); window.addEventListener("scroll", sombra, { passive: true });
  }

  /* Revelado suave */
  var revelar = $$("[data-revelar]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    revelar.forEach(function (el) { io.observe(el); });
  } else { revelar.forEach(function (el) { el.classList.add("visible"); }); }

  /* Cerrar el menú móvil al elegir una opción */
  $$(".menu-movil").forEach(function (d) { d.addEventListener("toggle", function () { document.body.classList.toggle("menu-abierto", d.open); }); });
  $$(".menu-movil a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.removeAttribute("open"); }); });

  /* UF del día (si la fuente pública responde; si no, queda el último valor conocido) */
  function pintarUF(valor, fecha, enVivo) {
    $$("[data-uf]").forEach(function (el) { el.textContent = pesos(valor, 2); });
    var f = new Date(fecha + (fecha.length === 10 ? "T12:00:00" : ""));
    $$("[data-uf-fecha]").forEach(function (el) { el.textContent = enVivo ? "hoy" : "al " + f.getDate() + " de " + MESES[f.getMonth()]; });
  }
  pintarUF(UF_RESPALDO.valor, UF_RESPALDO.fecha, false);
  if ($("[data-uf]") && window.fetch) {
    var control = window.AbortController ? new AbortController() : null;
    var reloj = setTimeout(function () { if (control) control.abort(); }, 5000);
    fetch("https://mindicador.cl/api", control ? { signal: control.signal } : {})
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        clearTimeout(reloj);
        if (d && d.uf && d.uf.valor) pintarUF(d.uf.valor, String(d.uf.fecha).slice(0, 10), true);
        if (d && d.utm && d.utm.valor) $$("[data-utm]").forEach(function (el) { el.textContent = pesos(d.utm.valor); el.closest("[data-utm-caja]").hidden = false; });
      })
      .catch(function () { clearTimeout(reloj); });
  }

  /* Próximos vencimientos (fechas generales; feriados no incluidos) */
  function proximo(dia) {
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var mes = hoy.getMonth(), anio = hoy.getFullYear();
    var calc = function (m, a) {
      var d = new Date(a, m, dia);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      return d;
    };
    var v = calc(mes, anio);
    if (v < hoy) v = calc(mes + 1, anio);
    var faltan = Math.round((v - hoy) / 86400000);
    var periodo = new Date(v.getFullYear(), v.getMonth() - 1, 1);
    return { fecha: v, faltan: faltan, periodo: MESES[periodo.getMonth()] };
  }
  [["f29", 20], ["previred", 13]].forEach(function (par) {
    var caja = $("[data-venc='" + par[0] + "']");
    if (!caja) return;
    var p = proximo(par[1]);
    $("[data-dia]", caja).textContent = p.fecha.getDate();
    $("[data-mes]", caja).textContent = MESES_CORTOS[p.fecha.getMonth()];
    $("[data-detalle]", caja).textContent = (par[0] === "f29" ? "Declaración de " : "Cotizaciones de ") + p.periodo + " · " + DIAS[p.fecha.getDay()] + " " + p.fecha.getDate() + " de " + MESES[p.fecha.getMonth()];
    var f = $("[data-faltan]", caja);
    f.textContent = p.faltan === 0 ? "Vence hoy" : p.faltan === 1 ? "Vence mañana" : "Faltan " + p.faltan + " días";
    f.classList.toggle("urgente", p.faltan <= 5);
    f.hidden = false;
  });

  /* Formulario de contacto: llega a WhatsApp ya escrito */
  var form = $("#form-contacto");
  if (form) {
    var params = new URLSearchParams(location.search);
    var pre = params.get("pack") || params.get("servicio");
    if (pre) { var sel = $("#motivo", form); $$("option", sel).forEach(function (o) { if (o.value === pre || o.textContent === pre) sel.value = o.value; }); }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var v = function (id) { var el = $("#" + id, form); return el ? el.value.trim() : ""; };
      var lineas = ["Hola KpG, les escribo desde el sitio web."];
      lineas.push("Nombre: " + v("nombre"));
      if (v("empresa")) lineas.push("Empresa: " + v("empresa"));
      lineas.push("Correo: " + v("correo"));
      if (v("telefono")) lineas.push("Teléfono: " + v("telefono"));
      lineas.push("Necesito: " + v("motivo"));
      if (v("mensaje")) lineas.push("Mi caso: " + v("mensaje"));
      window.open(wa(lineas.join("\n")), "_blank", "noopener");
      form.classList.add("enviado");
    });
  }

  /* Buscador de la página de consultas */
  var buscador = $("#buscar-consultas");
  if (buscador) {
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    buscador.addEventListener("input", function () {
      var q = norm(buscador.value.trim()), hay = 0;
      $$(".categoria-consultas").forEach(function (cat) {
        var visibles = 0;
        $$("details", cat).forEach(function (d) {
          var ok = !q || norm(d.textContent).indexOf(q) !== -1;
          d.hidden = !ok; if (ok) visibles++;
        });
        cat.hidden = visibles === 0; hay += visibles;
      });
      $(".sin-resultados").style.display = hay ? "none" : "block";
    });
  }

  /* ---------- Asistente de consultas (respuestas generales escritas por KpG) ---------- */
  var DATOS = window.KPG_CONSULTAS || [];
  if (!DATOS.length) return;
  var PARADAS = " que como cual cuales cuando donde para con una uno unos unas los las del por mis sus mi su puedo debo tengo hay esta este esto eso son ser hacer tiene tienen quiero necesito saber sobre algo pero porque cuanto cuanta ";
  var n = function (s) { return (" " + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " "); };
  DATOS.forEach(function (d) {
    d._kw = d.kw.map(n);
    d._t = n(d.q).split(" ").filter(function (t) { return t.length > 3 && PARADAS.indexOf(" " + t + " ") === -1; });
  });
  function puntaje(d, q) {
    var s = 0;
    d._kw.forEach(function (k) {
      if (q.indexOf(k) !== -1) s += 3 + k.trim().split(" ").length * 2;
      else if (k.trim().length > 4 && q.indexOf(k.trim()) !== -1) s += 2;
    });
    d._t.forEach(function (t) { if (q.indexOf(" " + t + " ") !== -1) s += 1; });
    return s;
  }
  function buscar(texto) {
    var q = n(texto);
    return DATOS.map(function (d) { return { d: d, s: puntaje(d, q) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; });
  }

  var ICONO = {
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.6a8.6 8.6 0 0 1-12.7 7.6L3.5 20.5l1.4-4.1a8.6 8.6 0 1 1 15.6-4.8Z"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    enviar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  var raiz = document.body.getAttribute("data-raiz") || "";
  var panel = document.createElement("div");
  panel.className = "asistente-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Consultas rápidas de KpG");
  panel.innerHTML =
    '<div class="asistente-cab"><img src="' + raiz + 'assets/kpg-avatar.svg" alt=""><div><b>Consultas rápidas</b><small>Respuestas generales de KpG</small></div>' +
    '<button type="button" data-cerrar aria-label="Cerrar">' + ICONO.cerrar + "</button></div>" +
    '<div class="asistente-mensajes" aria-live="polite"></div>' +
    '<form class="asistente-form"><label class="oculto" for="asistente-texto">Escriba su consulta</label>' +
    '<input id="asistente-texto" autocomplete="off" placeholder="Escriba su duda con sus palabras…" maxlength="300">' +
    '<button type="submit" aria-label="Enviar">' + ICONO.enviar + "</button></form>" +
    '<p class="asistente-pie">Son respuestas generales. Para su caso, le responde un contador por WhatsApp.</p>';
  document.body.appendChild(panel);
  var lista = $(".asistente-mensajes", panel), entrada = $("#asistente-texto", panel), ultimoFoco = null, iniciado = false;

  function mensaje(html, quien) {
    var m = document.createElement("div");
    m.className = "msg " + quien; m.innerHTML = html; lista.appendChild(m);
    lista.scrollTop = lista.scrollHeight; return m;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sugerencias(preguntas) {
    var c = document.createElement("div"); c.className = "sugerencias";
    preguntas.forEach(function (p) { var b = document.createElement("button"); b.type = "button"; b.textContent = p; b.addEventListener("click", function () { preguntar(p); }); c.appendChild(b); });
    lista.appendChild(c); lista.scrollTop = lista.scrollHeight;
  }
  function preguntar(texto) {
    texto = String(texto || "").trim(); if (!texto) return;
    mensaje(esc(texto), "usuario");
    var esp = mensaje('<span class="escribiendo"><i></i><i></i><i></i></span>', "kpg");
    setTimeout(function () {
      esp.remove();
      var r = buscar(texto), mejor = r[0];
      var consulta = wa("Hola KpG, tengo una consulta: " + texto);
      if (mejor && mejor.s >= 4) {
        mensaje("<b>" + esc(mejor.d.q) + "</b><br>" + mejor.d.a +
          '<div class="acciones-msg"><a href="' + consulta + '" target="_blank" rel="noopener">' + ICONO.wa + "Consultar mi caso</a></div>", "kpg");
        var otras = r.slice(1).filter(function (x) { return x.s >= 3; }).slice(0, 2).map(function (x) { return x.d.q; });
        if (otras.length) sugerencias(otras);
      } else {
        mensaje("Para responderle bien necesitamos conocer su caso. Un contador de KpG puede revisarlo con usted." +
          '<div class="acciones-msg"><a href="' + consulta + '" target="_blank" rel="noopener">' + ICONO.wa + "Enviar mi consulta por WhatsApp</a></div>", "kpg");
        sugerencias(["¿Cuándo vence el F29?", "¿Cómo creo una empresa?", "¿Cuánto cuesta trabajar con KpG?"]);
      }
    }, 420);
  }
  function abrir(conPregunta) {
    ultimoFoco = document.activeElement;
    panel.classList.add("abierto");
    if (!iniciado) {
      iniciado = true;
      mensaje("Hola. Escriba su duda con sus palabras y le doy una respuesta general. Si necesita más, se la enviamos a un contador.", "kpg");
      sugerencias(["¿Cuándo vence el F29?", "¿Qué documentos debo enviar cada mes?", "¿Cómo creo una empresa?", "¿Qué pasa si declaro atrasado?"]);
    }
    if (conPregunta) preguntar(conPregunta);
    setTimeout(function () { entrada.focus(); }, 60);
  }
  function cerrar() { panel.classList.remove("abierto"); if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus(); }
  $("[data-cerrar]", panel).addEventListener("click", cerrar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("abierto")) cerrar(); });
  $(".asistente-form", panel).addEventListener("submit", function (e) { e.preventDefault(); var t = entrada.value; entrada.value = ""; preguntar(t); });
  $$("[data-abrir-asistente]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); abrir(); }); });
  $$("[data-preguntar]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); abrir(b.getAttribute("data-preguntar")); }); });
})();
