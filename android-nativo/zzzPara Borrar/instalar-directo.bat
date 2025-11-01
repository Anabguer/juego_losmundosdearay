@echo off
echo 🚀 INSTALANDO LOS MUNDOS DE ARAY
echo ================================
echo.

echo 📱 1. Verificando dispositivo...
adb devices
echo.

echo 🔧 2. Sincronizando Capacitor...
call npx cap sync android
echo.

echo 🏗️ 3. Compilando APK...
cd android
call gradlew assembleDebug
echo.

echo 📦 4. Instalando APK...
cd ..
adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.

echo ✅ ¡INSTALACIÓN COMPLETADA!
echo 🎮 Busca "Los Mundos de Aray" en tu dispositivo
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Abrir la app en tu dispositivo
echo 2. Probar login con Google
echo 3. Jugar minijuegos
echo 4. Verificar que se guardan caramelos
echo.
pause


