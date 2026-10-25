# AR Tokyo (MVP)

Plataforma web de experiencias de realidad aumentada (RA).
Motor de RA: [MindAR](https://github.com/hiukim/mind-ar-js) (código abierto, MIT) sobre A-Frame.

## Probar en tu computadora (opcional)
1. Instala Node.js (https://nodejs.org, versión LTS)
2. En la carpeta del proyecto: `npm install` y luego `npm start`
3. Abre http://localhost:3000 (viewer) y http://localhost:3000/admin (editor; usuario: cualquiera, contraseña: `cambiame`)

## Variables de entorno
- `ADMIN_PASSWORD`: contraseña del editor (¡cámbiala!)
- `DATA_DIR` y `UPLOAD_DIR`: carpetas donde se guardan datos y archivos (en Render, apúntalas al disco persistente, ej. `/var/data/data` y `/var/data/uploads`)

## Crear el archivo .mind (imagen objetivo)
Sube tu imagen aquí y descarga el `.mind`: https://hiukim.github.io/mind-ar-js-doc/tools/compile
Consejo: imágenes con mucho detalle y contraste (no lisas ni muy repetitivas) funcionan mejor.
