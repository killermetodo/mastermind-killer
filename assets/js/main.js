/* =============================================================
   MASTERMIND KILLER — lógica de la landing
   - Reveal on scroll
   - Contador de cupos (manual o en vivo)
   - Formulario multi-step + envío al backend
   ============================================================= */

(function () {
  "use strict";

  var CFG = Object.assign({
    cuposTotales: 10,
    postulantes: 0,
    minimoParaMostrar: 5,
    contadorEnVivo: false,
    endpoint: "",
    token: "",
    instagramContacto: ""
  }, window.KILLER_CONFIG || {});

  var STORAGE_KEY = "killer_mastermind_postulacion";

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ============================================ 1. Reveal on scroll */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // Red de seguridad: si por lo que sea el observer no dispara
    // (pestaña en segundo plano, navegador raro), mostramos todo igual.
    setTimeout(function () {
      if (!document.querySelector(".reveal.is-in")) {
        items.forEach(function (el) { el.classList.add("is-in"); });
      }
    }, 3000);
  }

  /* ============================== 2. Marcador: cupos vs. postulantes */
  var postulantesActuales = 0;

  function pintarMarcador(postulantes) {
    var cupos = Number(CFG.cuposTotales) || 10;
    postulantes = Math.max(0, Number(postulantes) || 0);
    postulantesActuales = postulantes;

    $$("[data-cupos]").forEach(function (el) { el.textContent = cupos; });
    $$("[data-postulantes]").forEach(function (el) { el.textContent = postulantes; });

    $$("[data-postulantes-lbl]").forEach(function (el) {
      el.textContent = postulantes === 1 ? "postulante" : "postulantes";
    });

    // Con 0 postulaciones el bloque se oculta: "0 postulantes" resta en vez
    // de sumar. Aparece solo, en cuanto llega la primera.
    $$("[data-postulantes-wrap]").forEach(function (el) {
      el.hidden = postulantes < Number(CFG.minimoParaMostrar || 1);
    });

    document.body.classList.toggle("is-sobredemanda", postulantes > cupos);

    var frase = $("[data-marcador-frase]");
    if (frase) {
      if (postulantes > cupos) {
        frase.textContent = "Ya hay más postulantes que cupos. ¿Para quién va a quedar?";
      } else if (postulantes >= Number(CFG.minimoParaMostrar || 1)) {
        frase.textContent = "Las postulaciones están abiertas. Los cupos no se amplían.";
      } else {
        frase.textContent = "Las postulaciones ya están abiertas.";
      }
    }
  }

  function initMarcador() {
    pintarMarcador(CFG.postulantes);

    if (!CFG.contadorEnVivo || !CFG.endpoint) return;

    var url = CFG.endpoint
      + (CFG.endpoint.indexOf("?") === -1 ? "?" : "&")
      + "action=count&token=" + encodeURIComponent(CFG.token);

    fetchConTimeout(url, { method: "GET" }, 8000)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && typeof data.postulantes === "number") pintarMarcador(data.postulantes);
      })
      .catch(function () {
        /* Si el backend falla, queda el valor manual. Nunca rompe la página. */
      });
  }

  /* =============================================== 3. Formulario */
  var form, pasos, pasoActual = 1, enviando = false, envioId = null;

  var MENSAJES = {
    vacio:    "Este campo es obligatorio.",
    corto:    "Necesito más detalle que eso.",
    tel:      "Deja un número de contacto válido.",
    ig:       "Deja tu usuario o el link de tu perfil.",
    motivo:   "Escribe al menos 60 caracteres. Esta respuesta define la selección.",
    historia: "Escribe al menos 80 caracteres. Quiero saber de verdad quién eres."
  };

  // Respuestas largas: mínimo de caracteres por campo.
  var MINIMOS = { historia: 80, motivo: 60 };

  function campoDe(input) {
    return input.closest(".field");
  }

  function marcarError(input, mensaje) {
    var field = campoDe(input);
    if (!field) return;
    field.classList.add("has-error");
    var box = $(".field__error", field);
    if (box) box.textContent = mensaje;
    input.setAttribute("aria-invalid", "true");
  }

  function limpiarError(input) {
    var field = campoDe(input);
    if (!field) return;
    field.classList.remove("has-error");
    var box = $(".field__error", field);
    if (box) box.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function validarCampo(input) {
    var valor = (input.value || "").trim();
    var nombre = input.name;

    if (input.type === "radio") {
      var marcado = form.querySelector('input[name="' + nombre + '"]:checked');
      if (!marcado) { marcarError(input, MENSAJES.vacio); return false; }
      limpiarError(input);
      return true;
    }

    if (!valor) { marcarError(input, MENSAJES.vacio); return false; }

    if (nombre === "nombre" && valor.length < 5) {
      marcarError(input, "Nombre y apellido, por favor."); return false;
    }

    if (nombre === "instagram" && valor.length < 3) {
      marcarError(input, MENSAJES.ig); return false;
    }

    if (nombre === "whatsapp") {
      var digitos = valor.replace(/\D/g, "");
      if (digitos.length < 8) { marcarError(input, MENSAJES.tel); return false; }
    }

    if (MINIMOS[nombre] && valor.length < MINIMOS[nombre]) {
      marcarError(input, MENSAJES[nombre] || MENSAJES.corto); return false;
    }

    if (input.tagName === "TEXTAREA" && !MINIMOS[nombre] && valor.length < 25) {
      marcarError(input, MENSAJES.corto); return false;
    }

    limpiarError(input);
    return true;
  }

  function camposDelPaso(n) {
    var fs = form.querySelector('.step[data-step="' + n + '"]');
    if (!fs) return [];
    var vistos = {};
    return $$("input, select, textarea", fs).filter(function (el) {
      if (el.type === "hidden" || el.name === "empresa") return false;
      if (el.type === "radio") {
        if (vistos[el.name]) return false;   // valida el grupo una sola vez
        vistos[el.name] = true;
      }
      return true;
    });
  }

  function validarPaso(n) {
    var ok = true, primerError = null;
    camposDelPaso(n).forEach(function (input) {
      if (!validarCampo(input)) {
        ok = false;
        if (!primerError) primerError = input;
      }
    });
    if (primerError) {
      var field = campoDe(primerError) || primerError;
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      if (primerError.focus) { try { primerError.focus({ preventScroll: true }); } catch (e) { primerError.focus(); } }
    }
    return ok;
  }

  function irAPaso(n, scroll) {
    pasos.forEach(function (fs) {
      fs.classList.toggle("is-active", Number(fs.dataset.step) === n);
    });
    pasoActual = n;

    var fill = $("[data-steps-fill]");
    if (fill) fill.style.width = (n / pasos.length * 100) + "%";

    var now = $("[data-step-now]");
    if (now) now.textContent = n;

    if (scroll) {
      var anchor = $("#postular");
      if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * `enlace` es opcional: {texto, href}. Se agrega como <a> de verdad para que
   * en el celular se pueda tocar, en vez de dejar una URL pegada en el texto.
   */
  function estado(mensaje, esError, enlace) {
    var box = $("[data-form-status]");
    if (!box) return;
    box.textContent = mensaje || "";
    box.classList.toggle("is-error", !!esError);

    if (enlace && enlace.href) {
      box.appendChild(document.createTextNode(" "));
      var a = document.createElement("a");
      a.href = enlace.href;
      a.textContent = enlace.texto;
      a.target = "_blank";
      a.rel = "noopener";
      box.appendChild(a);
    }
  }

  function recolectar() {
    var data = {};
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.name === "empresa") return;
      if (el.type === "radio") { if (el.checked) data[el.name] = el.value; return; }
      data[el.name] = (el.value || "").trim();
    });

    // Mismo ID en todos los reintentos de esta sesión: el backend lo usa para
    // descartar la fila duplicada si el primer envío sí había llegado.
    if (!envioId) {
      envioId = "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    }
    data.id = envioId;
    data.enviadoEn = new Date().toISOString();
    data.origen = document.referrer || "directo";
    data.utm = window.location.search || "";
    data.token = CFG.token;
    return data;
  }

  function mostrarExito(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    // La propia postulación cuenta: el marcador sube al instante en vez de
    // esperar a la siguiente carga.
    pintarMarcador(postulantesActuales + 1);
    estado("");
    form.hidden = true;
    var done = $("#done");
    if (done) {
      done.hidden = false;
      done.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /** fetch con límite de tiempo: si el servidor no contesta, no dejamos al
   *  usuario mirando un botón "Enviando…" para siempre. */
  function fetchConTimeout(url, opciones, ms) {
    opciones = opciones || {};

    if (typeof AbortController === "undefined") return fetch(url, opciones);

    var ctrl = new AbortController();
    opciones.signal = ctrl.signal;
    var t = setTimeout(function () { ctrl.abort(); }, ms);

    return fetch(url, opciones).then(function (r) {
      clearTimeout(t); return r;
    }, function (err) {
      clearTimeout(t); throw err;
    });
  }

  function enviar(data) {
    // Se envía UNA sola vez. Nunca se reintenta:
    // cuando CORS falla, bloquea leer la respuesta, no el envío — la fila ya
    // quedó escrita. Un reintento duplicaría la postulación en la hoja.
    //
    // text/plain hace que sea una "simple request": así el navegador no dispara
    // el preflight OPTIONS, que Apps Script no sabe responder.
    return fetchConTimeout(CFG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow"
    }, 15000).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (texto) {
      var json = null;
      try { json = JSON.parse(texto); } catch (e) { /* no era JSON */ }

      // Respuesta legible del backend: vale tal cual.
      if (json) return json;

      // No es JSON: Apps Script devuelve HTML cuando el despliegue no existe,
      // se pasó la cuota o el script reventó. Antes se asumía éxito aquí, y eso
      // mostraba "postulación recibida" sin haber guardado nada. Preguntamos.
      return verificar(data.id).then(function (existe) {
        if (existe) return { ok: true, verificado: true };
        throw new Error("El servidor respondió algo que no entiendo");
      });
    }).catch(function (err) {
      // El rechazo no distingue "no llegó" de "llegó pero CORS bloqueó leer la
      // respuesta". En vez de adivinar, le preguntamos al backend si tiene el ID.
      console.warn("[Killer] Sin confirmación legible, verificando:", err);
      return verificar(data.id).then(function (existe) {
        if (existe) return { ok: true, verificado: true };
        throw err;
      });
    });
  }

  /** ¿El backend registró esta postulación? Nunca lanza: responde true/false. */
  function verificar(id) {
    if (!id) return Promise.resolve(false);

    var url = CFG.endpoint
      + (CFG.endpoint.indexOf("?") === -1 ? "?" : "&")
      + "action=check&id=" + encodeURIComponent(id)
      + "&token=" + encodeURIComponent(CFG.token);

    return fetchConTimeout(url, { method: "GET", redirect: "follow" }, 10000)
      .then(function (r) { return r.json(); })
      .then(function (d) { return !!(d && d.existe); })
      .catch(function () { return false; });
  }

  function onSubmit(e) {
    e.preventDefault();
    if (enviando) return;

    if (!validarPaso(pasos.length)) { estado("Revisa los campos marcados.", true); return; }

    // Honeypot: si viene lleno, es un bot. Simulamos éxito sin enviar nada.
    var hp = form.querySelector('input[name="empresa"]');
    if (hp && hp.value) { mostrarExito({}); return; }

    var data = recolectar();
    var btn = $("[data-submit]", form);

    if (navigator.onLine === false) {
      estado("Estás sin conexión. Revisa tu internet y vuelve a enviar.", true);
      return;
    }

    if (!CFG.endpoint) {
      // Modo pruebas: sin backend configurado no se pierde la postulación en silencio.
      console.warn("[Killer] Sin endpoint configurado. Postulación NO enviada:", data);
      estado("Modo pruebas: falta configurar el endpoint en assets/js/config.js", true);
      return;
    }

    enviando = true;
    if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
    estado("Enviando postulación…", false);

    enviar(data)
      .then(function (res) {
        if (res && res.ok === false) throw new Error(res.error || "Rechazado por el servidor");
        mostrarExito(data);
      })
      .catch(function (err) {
        console.error("[Killer] Error al enviar:", err);
        // Rescate: si el envío falla, la persona no se queda sin salida.
        // Va a Instagram, que es de donde viene y donde ya te tiene ubicado.
        var ig = CFG.instagramContacto;
        estado(
          "No pude enviar la postulación. Revisa tu conexión e inténtalo otra vez." +
          (ig ? " Si sigue fallando, escríbeme por Instagram:" : ""),
          true,
          ig ? { texto: "@" + ig, href: "https://instagram.com/" + ig } : null
        );
      })
      .then(function () {
        enviando = false;
        if (btn) { btn.disabled = false; btn.textContent = "Enviar postulación"; }
      });
  }

  function initForm() {
    form = $("#form-postulacion");
    if (!form) return;

    pasos = $$(".step", form);
    var total = $("[data-step-total]");
    if (total) total.textContent = pasos.length;
    irAPaso(1, false);

    $$("[data-next]", form).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (validarPaso(pasoActual)) { estado(""); irAPaso(pasoActual + 1, true); }
        else { estado("Revisa los campos marcados.", true); }
      });
    });

    $$("[data-prev]", form).forEach(function (btn) {
      btn.addEventListener("click", function () { estado(""); irAPaso(pasoActual - 1, true); });
    });

    // Limpia el error apenas el usuario corrige.
    $$("input, select, textarea", form).forEach(function (el) {
      var ev = (el.tagName === "SELECT" || el.type === "radio") ? "change" : "input";
      el.addEventListener(ev, function () {
        if (campoDe(el) && campoDe(el).classList.contains("has-error")) limpiarError(el);
      });
    });

    // Contador de caracteres en vivo para las respuestas con mínimo.
    $$("[data-count-for]", form).forEach(function (salida) {
      var campo = form.querySelector('[name="' + salida.dataset.countFor + '"]');
      if (!campo) return;
      campo.addEventListener("input", function () {
        salida.textContent = campo.value.trim().length;
      });
    });

    // Enter avanza de paso en inputs de una línea (no en textareas).
    form.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var t = e.target;
      if (t.tagName === "TEXTAREA" || t.type === "submit") return;
      e.preventDefault();
      if (pasoActual < pasos.length) {
        if (validarPaso(pasoActual)) irAPaso(pasoActual + 1, true);
      }
    });

    form.addEventListener("submit", onSubmit);

    // Si ya postuló en este dispositivo, no lo hacemos repetir.
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        form.hidden = true;
        var done = $("#done");
        if (done) done.hidden = false;
      }
    } catch (e) {}
  }

  /* =================================================== 4. Arranque */
  function init() {
    initReveal();
    initMarcador();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
