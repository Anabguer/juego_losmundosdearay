@echo off
echo 🚀 Compilando APK completa para Los Mundos de Aray...

REM Verificar que estamos en el directorio correcto
if not exist "app\build.gradle" (
    echo ❌ Error: No se encuentra app\build.gradle
    echo Asegúrate de ejecutar este script desde la carpeta android-nativo
    pause
    exit /b 1
)

REM Verificar google-services.json
if not exist "app\google-services.json" (
    echo ❌ Error: No se encuentra app\google-services.json
    echo Copiando desde pueblito...
    copy "..\pueblito\google-services.json" "app\"
    if not exist "app\google-services.json" (
        echo ❌ Error: No se pudo copiar google-services.json
        pause
        exit /b 1
    )
)

echo ✅ Archivos verificados

REM Limpiar proyecto
echo 🧹 Limpiando proyecto...
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error en la limpieza
    pause
    exit /b 1
)

REM Compilar APK
echo 🔨 Compilando APK...
call gradlew assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error en la compilación
    pause
    exit /b 1
)

REM Verificar que la APK se generó
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ APK compilada exitosamente!
    echo 📱 Ubicación: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 🎯 Para instalar en tu dispositivo:
    echo adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 🧪 Flujo de pruebas:
    echo 1. Abrir app → Juego carga directo (sin botón login)
    echo 2. Tocar Ranking sin sesión → Google Sign-In → Nick → Top-20
    echo 3. Con sesión → Ranking directo
    echo.
    
    REM Intentar instalar automáticamente
    echo 📱 Intentando instalar automáticamente...
    adb install app\build\outputs\apk\debug\app-debug.apk
    if %ERRORLEVEL% EQU 0 (
        echo ✅ APK instalada exitosamente!
    ) else (
        echo ⚠️ No se pudo instalar automáticamente
        echo Instala manualmente: adb install app\build\outputs\apk\debug\app-debug.apk
    )
) else (
    echo ❌ Error: APK no se generó
)

echo.
pause




