/* =============================================================
   CONFIGURACIÓN — Mastermind Killer
   Este es el ÚNICO archivo que Camilo necesita tocar.
   ============================================================= */

window.KILLER_CONFIG = {

  /* ---------------------------------------------------------------
     1. CONTADOR DE CUPOS
     --------------------------------------------------------------- */

  // Cupos del mastermind. Este número NO se mueve: es el que crea la tensión.
  cuposTotales: 10,

  // Postulaciones recibidas. Valor de respaldo, editable a mano.
  // Se ignora si `contadorEnVivo` es true y el backend responde.
  postulantes: 0,

  // Bajo este número, el bloque de postulantes no se muestra:
  // "3 postulantes para 10 cupos" juega en contra. Aparece al llegar aquí.
  minimoParaMostrar: 5,

  // true  → las postulaciones se cuentan solas desde el backend, en vivo.
  // false → usa `postulantes` de arriba.
  // Queda activo: en cuanto pegues el `endpoint`, el marcador es real.
  // Mientras el endpoint esté vacío no pasa nada: usa el valor de arriba.
  contadorEnVivo: true,

  /* ---------------------------------------------------------------
     2. BACKEND DEL FORMULARIO
     --------------------------------------------------------------- */

  // URL del Web App de Google Apps Script (termina en /exec).
  // Ver backend/README-backend.md para el paso a paso.
  // Mientras esté vacío, el formulario NO envía: guarda en el navegador
  // y avisa por consola (modo pruebas).
  endpoint: "https://script.google.com/macros/s/AKfycbwwHndVAnZSY7bSCSYdPLxBth9wWfB8vBvn44qdyHTRGBwPXLAVtdiykxyA-BJ32rLjTw/exec",

  // Clave compartida simple: debe ser idéntica a la del Apps Script.
  // Evita que cualquiera con la URL llene la hoja de basura.
  token: "killer-2026-a7q3xm9k",

  /* ---------------------------------------------------------------
     3. TEXTOS VARIABLES
     --------------------------------------------------------------- */

  // Instagram de rescate: SOLO se muestra si el envío del formulario falla.
  // No es un botón visible: nadie te va a escribir por aquí "porque sí".
  // Sin la arroba. Vacío = no se muestra ningún enlace de respaldo.
  instagramContacto: "camilo_hellfit"
};
