@echo off
echo 🚀 Compilando app Android nativa con UX mejorada...

REM Limpiar cache
.\gradlew clean

REM Compilar APK
.\gradlew assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo ✅ APK compilada exitosamente en: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 📱 Para instalar en tu dispositivo:
    echo adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 🎯 Flujo de UX:
    echo 1. Abrir app → Juego carga directamente
    echo 2. Tocar Ranking → Si no hay sesión → Login Google → Nick → Ranking
    echo 3. Si ya hay sesión → Ranking directo
    echo.
) else (
    echo ❌ Error en la compilación
    echo Revisa los logs arriba
)

pause
