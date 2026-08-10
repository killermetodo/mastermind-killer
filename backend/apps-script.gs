/**
 * MASTERMIND KILLER — backend de postulaciones
 * Google Apps Script vinculado a una hoja de cálculo.
 *
 * Guarda cada postulación como una fila y expone el conteo de cupos ocupados.
 * Instrucciones de despliegue: ver README-backend.md
 */

// Debe ser IDÉNTICO al `token` de assets/js/config.js
var TOKEN = 'killer-2026-a7q3xm9k';

// Nombre de la pestaña donde se guardan las postulaciones
var HOJA = 'Postulaciones';

// Total de cupos del mastermind
var CUPOS_TOTALES = 10;

var COLUMNAS = [
  'ID',
  'Fecha',
  'Nombre',
  'Instagram',
  'WhatsApp',
  'Escribirle',   // link directo a wa.me: un clic y se abre el chat
  'Ocupación',
  'Facturación mensual',
  'Qué le cuesta',
  'Su historia',
  'Qué le falta',
  'Por qué quiere entrar',
  'Origen',
  'UTM',
  'Estado'   // vacío | APROBADO | RECHAZADO  ← Camilo escribe aquí
];


/* ------------------------------------------------------------------ */
/*  POST: recibe una postulación                                      */
/* ------------------------------------------------------------------ */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var data = JSON.parse(e.postData.contents);

    if (data.token !== TOKEN) {
      return json({ ok: false, error: 'token inválido' });
    }

    var hoja = getHoja();

    // Si el navegador no pudo leer la confirmación y el usuario reenvió,
    // llega el mismo ID: no duplicamos la fila.
    if (data.id && yaExiste(hoja, data.id)) {
      return json({ ok: true, duplicado: true });
    }

    hoja.appendRow([
      data.id || '',
      data.enviadoEn ? new Date(data.enviadoEn) : new Date(),
      data.nombre      || '',
      data.instagram   || '',
      "'" + (data.whatsapp || ''),   // apóstrofo: evita que Sheets se coma el +
      linkWhatsapp(data.whatsapp),
      data.ocupacion   || '',
      data.facturacion || '',
      data.dificultad  || '',
      data.historia    || '',
      data.brecha      || '',
      data.motivo      || '',
      data.origen      || '',
      data.utm         || '',
      ''
    ]);

    notificar(data);

    return json({ ok: true });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/* ------------------------------------------------------------------ */
/*  GET: consultas de la landing                                      */
/*  ?action=count&token=XXX          →  { postulantes, aprobados }    */
/*  ?action=check&id=XXX&token=XXX   →  { existe: true|false }        */
/* ------------------------------------------------------------------ */
function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.token !== TOKEN) {
    return json({ ok: false, error: 'token inválido' });
  }

  var hoja = getHoja();

  // La landing pregunta si una postulación quedó registrada, para no mostrar
  // un error falso cuando el POST llegó pero CORS bloqueó leer la respuesta.
  if (p.action === 'check') {
    return json({ ok: true, existe: yaExiste(hoja, p.id) });
  }

  if (p.action !== 'count') {
    return json({ ok: false, error: 'acción desconocida' });
  }

  var ultima = hoja.getLastRow();
  var postulantes = ultima > 1 ? ultima - 1 : 0;
  var aprobados = 0;

  if (ultima > 1) {
    var col = COLUMNAS.indexOf('Estado') + 1;
    var estados = hoja.getRange(2, col, ultima - 1, 1).getValues();
    aprobados = estados.filter(function (fila) {
      return String(fila[0]).trim().toUpperCase() === 'APROBADO';
    }).length;
  }

  return json({
    ok: true,
    postulantes: postulantes,   // lo que muestra la landing en vivo
    aprobados: aprobados,       // informativo, para revisar desde la hoja
    cupos: CUPOS_TOTALES
  });
}


/* ------------------------------------------------------------------ */
/*  Utilidades                                                        */
/* ------------------------------------------------------------------ */
function getHoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA);

  if (!hoja) {
    hoja = ss.insertSheet(HOJA);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/**
 * Convierte el WhatsApp escrito por el postulante en un link de wa.me.
 * Se guarda como texto plano: Sheets lo vuelve clicable solo, y así no
 * dependemos del separador de fórmulas, que cambia según el idioma de la hoja.
 *
 * Si el número viene sin código de país se asume Chile (+56), que es de donde
 * viene la convocatoria. Un extranjero que ponga su código queda intacto.
 */
function linkWhatsapp(numero) {
  var tel = String(numero || '').replace(/[^0-9]/g, '');
  if (!tel) return '';

  // 9 dígitos empezando en 9 → móvil chileno sin el 56 (9 1234 5678)
  if (tel.length === 9 && tel.charAt(0) === '9') tel = '56' + tel;

  // 8 dígitos → formato antiguo, sin el 9 inicial ni el código
  else if (tel.length === 8) tel = '569' + tel;

  if (tel.length < 10) return '';   // incompleto: mejor nada que un link roto

  return 'https://wa.me/' + tel;
}

/** ¿Ya guardamos una postulación con este ID? */
function yaExiste(hoja, id) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return false;

  var ids = hoja.getRange(2, 1, ultima - 1, 1).getValues();
  return ids.some(function (fila) { return String(fila[0]) === String(id); });
}

/** Aviso por mail para revisar la postulación el mismo día. */
function notificar(data) {
  try {
    var destino = Session.getEffectiveUser().getEmail();
    if (!destino) return;

    MailApp.sendEmail({
      to: destino,
      subject: 'Nueva postulación Mastermind Killer — ' + (data.nombre || 's/n'),
      body: [
        'Nombre: '      + (data.nombre || ''),
        'Instagram: '   + (data.instagram || ''),
        'WhatsApp: '    + (data.whatsapp || ''),
        'Escribirle: '  + (linkWhatsapp(data.whatsapp) || '—'),
        'Ocupación: '   + (data.ocupacion || ''),
        'Facturación: ' + (data.facturacion || ''),
        '',
        'Qué le cuesta:',        (data.dificultad || ''),
        '',
        'Su historia:',          (data.historia || ''),
        '',
        'Qué le falta:',         (data.brecha || ''),
        '',
        'Por qué quiere entrar:', (data.motivo || '')
      ].join('\n')
    });
  } catch (err) {
    // El correo es un extra: si falla, la fila ya quedó guardada.
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
