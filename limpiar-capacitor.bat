@echo off
echo 🧹 Limpiando todo lo de Capacitor...

REM Eliminar carpetas de Capacitor
if exist "pueblito\android" rmdir /s /q "pueblito\android"
if exist "pueblito\www" rmdir /s /q "pueblito\www"
if exist "pueblito\node_modules" rmdir /s /q "pueblito\node_modules"

REM Eliminar archivos de Capacitor
if exist "pueblito\package.json" del "pueblito\package.json"
if exist "pueblito\package-lock.json" del "pueblito\package-lock.json"
if exist "pueblito\capacitor.config.json" del "pueblito\capacitor.config.json"
if exist "pueblito\debug.keystore" del "pueblito\debug.keystore"

REM Eliminar archivos de Firebase/Capacitor
if exist "pueblito\js\firebase-*.js" del "pueblito\js\firebase-*.js"
if exist "pueblito\js\*-system*.js" del "pueblito\js\*-system*.js"
if exist "pueblito\js\*-auth*.js" del "pueblito\js\*-auth*.js"
if exist "pueblito\js\testing*.js" del "pueblito\js\testing*.js"
if exist "pueblito\js\web-auth.js" del "pueblito\js\web-auth.js"

REM Eliminar archivos HTML de prueba
if exist "pueblito\index-*.html" del "pueblito\index-*.html"
if exist "pueblito\test-*.html" del "pueblito\test-*.html"

REM Eliminar archivos de documentación
if exist "pueblito\*.md" del "pueblito\*.md"
if exist "pueblito\firestore.rules" del "pueblito\firestore.rules"

REM Eliminar scripts de instalación
if exist "pueblito\*.bat" del "pueblito\*.bat"

echo ✅ Limpieza completada
echo.
echo 📁 Archivos que quedan:
dir pueblito /b
echo.
pause




