@echo off
echo 🚀 Compilando APK con configuración corregida...

REM Verificar archivos
if not exist "app\google-services.json" (
    echo ❌ Copiando google-services.json...
    copy "..\pueblito\google-services.json" "app\"
)

REM Limpiar completamente
echo 🧹 Limpiando proyecto...
call gradlew clean --no-daemon

REM Sincronizar
echo 🔄 Sincronizando...
call gradlew --refresh-dependencies

REM Compilar
echo 🔨 Compilando APK...
call gradlew assembleDebug --no-daemon

if %ERRORLEVEL% EQU 0 (
    echo ✅ APK compilada exitosamente!
    echo 📱 Ubicación: app\build\outputs\apk\debug\app-debug.apk
    
    REM Instalar automáticamente
    echo 📱 Instalando en dispositivo...
    adb install app\build\outputs\apk\debug\app-debug.apk
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ APK instalada y lista para probar!
        echo.
        echo 🧪 Flujo de pruebas:
        echo 1. Abrir app → Juego carga directo
        echo 2. Tocar Ranking sin sesión → Google Sign-In → Nick → Top-20
        echo 3. Con sesión → Ranking directo
    ) else (
        echo ⚠️ APK compilada pero no se pudo instalar automáticamente
        echo Instala manualmente: adb install app\build\outputs\apk\debug\app-debug.apk
    )
) else (
    echo ❌ Error en la compilación
    echo Revisa los logs arriba
)

pause




