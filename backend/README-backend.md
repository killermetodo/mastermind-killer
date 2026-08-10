# Backend del formulario — paso a paso

El formulario guarda cada postulación en una **hoja de cálculo de Google**.
Sin servidor, sin costo, y Camilo revisa y selecciona directo en la hoja.

Toma unos 10 minutos, una sola vez.

---

## 1. Crear la hoja

1. Entra a [sheets.new](https://sheets.new) y crea una hoja nueva.
2. Nómbrala **Mastermind Killer — Postulaciones**.
3. No hace falta escribir encabezados: el script los crea solo.

## 2. Pegar el script

1. En la hoja: menú **Extensiones → Apps Script**.
2. Borra todo lo que aparece en el editor.
3. Pega el contenido completo de [`apps-script.gs`](apps-script.gs).
4. En la línea `var TOKEN = 'cambiar-esta-clave';` reemplaza el texto por una
   clave propia (cualquier cosa larga y rara, ej. `killer-2026-x7t9qm`).
   **Anótala: la vas a usar en el paso 4.**
5. Guarda (icono de disco o Ctrl+S).

## 3. Publicar

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Engranaje ⚙ junto a "Seleccionar tipo" → **Aplicación web**.
3. Configura así:
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario**  ← imprescindible
4. **Implementar** → autoriza los permisos que pide Google
   (aparece una advertencia de "app no verificada": **Configuración avanzada →
   Ir a … (no seguro)**. Es tu propio script, es normal).
5. Copia la **URL de la aplicación web**. Termina en `/exec`.

## 4. Conectar la landing

Abre `assets/js/config.js` y completa:

```js
endpoint: "https://script.google.com/macros/s/AKfy.../exec",
token:    "killer-2026-x7t9qm",   // la misma del paso 2.4
```

Listo. Manda una postulación de prueba y revisa que aparezca la fila.

---

## Cómo se opera después

### Revisar y seleccionar

Cada postulación es una fila. La primera columna (**ID**) es interna: sirve para
que una misma postulación no se guarde dos veces. No la borres ni la edites.

La columna **Escribirle** trae un link de WhatsApp armado solo con el número que
dejó el postulante: un clic y se abre el chat, sin copiar y pegar nada. Si el
número vino sin el `+56` se completa asumiendo Chile; si está incompleto, la
celda queda vacía en vez de dar un link roto.

La última columna es **Estado**, y es la única que escribes tú:

| Escribe en Estado | Significa |
|---|---|
| *(vacío)* | Sin revisar |
| `APROBADO` | Queda dentro de los 10 |
| `RECHAZADO` | No entra |

Escribir `APROBADO` es lo único que hay que hacer para que el contador baje
(si activaste el contador en vivo, ver abajo).

### Aviso por correo

Cada postulación nueva llega también al correo dueño de la hoja, para revisarla
sin abrir Sheets. Si molesta, borra la línea `notificar(data);` del script.

### El marcador de la landing

La página muestra **10 cupos** contra **las postulaciones recibidas**, en vivo.
Los cupos nunca se mueven: la tensión es "somos muchos para 10 lugares".

Marcar `APROBADO` **no** cambia el marcador — esa columna es solo para tu
selección. El número que sube es el total de filas.

Dos modos, en `assets/js/config.js`:

**En vivo (lo que quieres)** — cuenta las postulaciones solo:

```js
contadorEnVivo: true,
```

**Manual** — si aún no conectas el backend:

```js
postulantes: 27,
contadorEnVivo: false,
```

Si el backend no responde, la página cae de vuelta al número manual.
Nunca se rompe ni se queda en blanco.

**Por debajo de 5 postulaciones el bloque no se muestra**, y la página enseña
solo "10 cupos". "3 postulantes para 10 cupos" juega en contra. El umbral se
cambia con `minimoParaMostrar`.

---

## Si cambias el script después

Cada vez que edites `apps-script.gs` tienes que republicar:
**Implementar → Administrar implementaciones → ✏️ editar → Versión: Nueva versión → Implementar**.
La URL no cambia.

## Alternativas

Si prefieres no usar Google: el formulario envía un `POST` con JSON plano al
`endpoint`. Sirve igual con Formspree, Make, n8n, Airtable o cualquier webhook —
solo hay que cambiar la URL en `config.js`.
