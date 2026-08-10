# Mastermind Killer — Primera Edición

Landing de postulación para la primera edición del Mastermind Killer.
Presencial, gratuito, 10 cupos.

Paso 3 del embudo: recibe gente ya calificada por DM y captura la postulación.
No vende en frío — refuerza la decisión, genera prestigio y captura la data.

---

## Estructura

```
mastermind-killer/
├── index.html                    ← la página completa
├── assets/
│   ├── css/styles.css            ← sistema visual Killer
│   └── js/
│       ├── config.js             ← ⚠️ el único archivo que Camilo edita
│       └── main.js               ← contador + formulario multi-step
└── backend/
    ├── apps-script.gs            ← se pega en Google Apps Script
    └── README-backend.md         ← cómo conectar la hoja (10 min)
```

## Puesta en marcha

1. **Conecta el backend** → sigue [`backend/README-backend.md`](backend/README-backend.md).
   Mientras el `endpoint` esté vacío, el formulario no envía: avisa en pantalla
   que está en modo pruebas (nunca traga una postulación en silencio).
2. **Ajusta el contador** en `assets/js/config.js` (`cuposOcupados`).
3. **Publica.** Es HTML estático: sirve arrastrar la carpeta a
   [Netlify Drop](https://app.netlify.com/drop), o usar Vercel, Cloudflare Pages
   o GitHub Pages. No necesita build ni servidor.

Para verlo en local, desde esta carpeta:

```bash
python -m http.server 5500
```

## Lo que hay que completar antes de publicar

| Dónde | Qué falta |
|---|---|
| `assets/js/config.js` | `endpoint` y `token` del backend |
| `assets/js/config.js` | `cuposOcupados` real |
| `assets/js/config.js` | `whatsappContacto` (respaldo si falla el envío) |
| `index.html` (`og:image`) | imagen 1200×630 en la estética Killer — el link se comparte por WhatsApp e Instagram |
| `index.html` (`og:url`) | dominio final |

**Fecha y lugar** quedan como *"se confirman a los seleccionados"* en las tres
apariciones (contador, cierre y pantalla de éxito). Cuando se definan, buscar
ese texto y reemplazarlo.

---

## Decisiones tomadas

**Formulario nativo, no Typeform.** Embebido en la misma página con el mismo
sistema visual. Un iframe rompe la estética premium y la sensación de marca
propia. Va en 3 pasos para que 8 preguntas no se sientan un muro.

**El filtro está en el formulario, no en la puerta.** Dos campos exigen extensión
real y muestran el contador en vivo: *"cuéntame tu historia"* (150 caracteres) y
*"por qué quieres ser parte"* (120). Las otras respuestas abiertas piden 25.
Quien no está dispuesto a escribir unas líneas se autodescarta — que es
exactamente el filtro que buscas.

**El marcador enfrenta cupos contra postulantes.** No es "quedan X de 10" — es
**10 cupos / 27 postulantes**, en tiempo real. Los cupos no se mueven nunca; lo
que sube es la competencia. Cuando los postulantes superan los cupos, esa cifra
pasa a blanco, los cupos bajan a gris y aparece "¿para quién va a quedar?".

Con menos de 5 postulaciones el bloque se oculta y solo se ve "10 cupos": mostrar
"3 postulantes" jugaría en contra. El umbral es configurable.

**Doble modo del marcador.** En vivo desde el backend, o manual si aún no está
conectado. Si el backend cae, vuelve al valor manual: la página nunca muestra un
marcador roto o en blanco.

**El envío no adivina.** Apps Script a veces responde sin cabeceras CORS: el
navegador rechaza el `fetch` aunque la fila ya se haya escrito. Reintentar ahí
duplicaría la postulación; asumir éxito perdería postulaciones si el endpoint
está mal configurado. Así que se envía **una sola vez** y, si no se puede leer la
respuesta, la página le pregunta al backend por el ID del envío. Confirmado →
pantalla de éxito. No confirmado → error real con opción de reintentar (mismo ID,
el backend descarta el duplicado). Hay timeout de 15s para que el botón nunca
quede colgado en "Enviando…".

**Anti-doble-postulación.** Quien ya postuló desde ese dispositivo ve la pantalla
de confirmación en vez del formulario. Hay honeypot contra bots y un token
compartido para que nadie con la URL llene la hoja de basura.

**Tracking de los headlines.** El sistema de marca pide tracking 300 en títulos.
A 300 (0.3em) un headline de 80px se vuelve ilegible en móvil, donde va a llegar
casi todo el tráfico. Los display van a **0.10em** y el 300 completo se reserva
para eyebrows, labels y botones — que es donde ese tracking lee como premium.
Ambos valores están en `styles.css` como `--track-title` y `--track-300`, en un
solo lugar por si quieres moverlos.

**El hero cabe entero en el pliegue.** El titular escala con la altura de la
ventana además del ancho (`min(8.5vw, 8vh)`), porque en un portátil de 1280×665
un titular fijo empujaba el CTA y el contador fuera de pantalla. En pantallas
altas crece hasta 80px; en bajas cae a ~53px y el titular entra en dos líneas.
Verificado en 1280×665 y en 375×812: en ambas, el contador queda sobre el
pliegue.

**Mobile-first.** Todo el CSS parte en móvil y crece. Los inputs usan 16px en
pantallas chicas para que iOS no haga zoom al enfocar, y los botones ocupan el
ancho completo hasta los 640px.

**Sin dependencias.** HTML, CSS y JS plano. Solo se cargan las fuentes de Google.
Si quieres cero llamadas externas, descarga Montserrat e Inter a `assets/fonts/`
y reemplaza el `<link>` por `@font-face`.
