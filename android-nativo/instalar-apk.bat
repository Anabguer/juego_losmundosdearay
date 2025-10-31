@echo off
echo 🚀 Script de Instalación - Los Mundos de Aray
echo ================================================

echo 📱 Verificando dispositivo conectado...
adb devices

echo.
echo 📦 APK compilado encontrado:
dir app\build\outputs\apk\debug\app-debug.apk

echo.
echo 🔧 Instalando aplicación...
adb install -r app\build\outputs\apk\debug\app-debug.apk

if %ERRORLEVEL% EQU 0 (
    echo ✅ Aplicación instalada exitosamente
    echo 🎉 ¡Listo para probar la nueva estructura unificada!
) else (
    echo ❌ Error instalando la aplicación
    echo 💡 Asegúrate de que:
    echo    - El dispositivo esté conectado por USB
    echo    - La depuración USB esté habilitada
    echo    - El dispositivo esté autorizado para depuración
)

echo.
echo 📋 Próximos pasos:
echo 1. Abrir la aplicación en el dispositivo
echo 2. Verificar que se carga la nueva estructura
echo 3. Probar sincronización online/offline
echo.
pause