@echo off
echo 🚀 Test Rápido - Los Mundos de Aray
echo =====================================

echo.
echo 1. Compilando APK...
call compilar-completo.bat
if %errorlevel% neq 0 (
    echo ❌ Error en compilación
    pause
    exit /b 1
)

echo.
echo 2. Instalando APK...
call instalar-apk.bat
if %errorlevel% neq 0 (
    echo ❌ Error en instalación
    pause
    exit /b 1
)

echo.
echo 3. Iniciando Logcat...
echo 📱 Abre la app y ve a: file:///android_asset/diagnostico.html
echo 📋 Presiona Ctrl+C para detener el logcat
echo.
adb logcat -s GameBridge:* TestFirestore:* AndroidRuntime:E *:E

pause


