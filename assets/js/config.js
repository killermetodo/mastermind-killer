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

  // Bajo este número, el bloque de postulantes no se muestra.
  // En 3: el marcador aparece pronto, que es lo que se pidió. Ponerlo en 1
  // mostraría "1 postulante para 10 cupos" al primero que entre, y eso resta
  // en vez de sumar. Subirlo a 5 o 10 hace que aparezca ya con fuerza.
  minimoParaMostrar: 3,

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
