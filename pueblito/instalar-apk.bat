@echo off
echo 🚀 Instalando Los Mundos de Aray en dispositivo Android...
echo.

echo 📱 Verificando dispositivos conectados...
adb devices

echo.
echo 🔧 Sincronizando con Capacitor...
npx cap sync android

echo.
echo 🏗️ Compilando APK...
cd android
call gradlew assembleDebug

echo.
echo 📦 APK generado. Instalando en dispositivo...
cd ..
adb install android\app\build\outputs\apk\debug\app-debug.apk

echo.
echo ✅ ¡APK instalado correctamente!
echo 🎮 Busca "Los Mundos de Aray" en tu dispositivo
echo.
pause





