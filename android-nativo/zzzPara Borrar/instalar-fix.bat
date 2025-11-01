@echo off
echo 🚀 INSTALANDO LOS MUNDOS DE ARAY (FIX JAVA)
echo ===========================================
echo.

echo 🔧 Limpiando cache de Gradle...
cd android
call gradlew clean
cd ..

echo.
echo 📱 Verificando dispositivo...
adb devices

echo.
echo 🏗️ Compilando e instalando APK...
npx cap run android

echo.
echo ✅ ¡INSTALACIÓN COMPLETADA!
echo 🎮 La app debería abrirse automáticamente en tu dispositivo
echo.
pause


