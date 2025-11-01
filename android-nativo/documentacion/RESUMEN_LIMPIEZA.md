# Resumen de Limpieza del Código

## Archivos Movidos a zzzPara Borrar

### Categorías de archivos movidos:

1. **Documentación** (.md, .txt)
   - README.md, INSTRUCCIONES_*.md, etc.
   - README.txt de audio e img

2. **Scripts de desarrollo** (.bat, .ps1, .py)
   - Scripts de instalación, compilación, etc.

3. **Archivos de prueba/debug**
   - debug.html, diagnostico.html, test-*.html
   - limpiar-firebase.html

4. **Versiones web/demo**
   - index-demo.html, index-web.html, index-standalone.html
   - Archivos JS con sufijo -web.js

5. **Archivos PHP** (no usados en Android APK)
   - Carpeta php/ completa
   - index.php

6. **Archivos de configuración no usados**
   - firestore.rules
   - debug.keystore
   - capacitor.config.json
   - Level Up.json

7. **Imágenes duplicadas**
   - Archivos con "-copia" en el nombre
   - Thumbs.db

8. **Archivos old/testing**
   - edificio_old.js
   - reset-data.js
   - testing.js, testing-web.js

9. **Node modules**
   - node_modules/
   - package.json, package-lock.json

## Funciones Comentadas (NO ELIMINADAS)

### En auth.js:
- `initAuth()` - No se usa
- `login()` - No se usa
- `register()` - No se usa
- `logout()` - No se usa
- `getCurrentUser()` - No se usa (hay otra versión en auth-system.js)
- `isLoggedIn()` - No se usa
- `saveScore()` - No se usa (se usa saveScoreToServer de storage.js)
- `getRankingJuego()` - No se usa
- `getMisScores()` - No se usa

### En sprites.js:
- `getMamaSprite()` - Solo usada en test-sprites.html (movido)
- `preloadSprites()` - Solo usada en test-sprites.html (movido)
- `animateRun()` - Solo usada en test-sprites.html (movido)
- `createSpriteElement()` - Solo usada en test-sprites.html (movido)

### En ui.js:
- `showCandyRanking()` - No se usa en el código actual

### En map.js:
- Importaciones no usadas de auth.js (solo se usa getRankingGlobal)

## Funciones que SÍ se usan (NO comentadas):
- Todas las funciones de storage.js
- Todas las funciones de juegos (cole.js, yayos.js, etc.)
- getRankingGlobal() de auth.js
- getAraySprite() de sprites.js
- Todas las funciones de ui.js excepto showCandyRanking
- Todas las funciones de background-music.js

## Nota Importante:
Todas las funciones comentadas están marcadas con comentarios `/* COMENTADO - FUNCIÓN NO USADA */` 
y pueden ser descomentadas fácilmente si se necesitan en el futuro.

