@echo off
echo 🚀 INSTALANDO LOS MUNDOS DE ARAY
echo ================================
echo.

echo 📱 Verificando dispositivo conectado...
adb devices
echo.

echo 🔧 Sincronizando con Capacitor...
npx cap sync android
echo.

echo 🏗️ Compilando e instalando APK...
npx cap run android
echo.

echo ✅ ¡INSTALACIÓN COMPLETADA!
echo 🎮 La app debería abrirse automáticamente en tu dispositivo
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Verificar que aparece el mapa completo
echo 2. Probar botón "🔐 Entrar"
echo 3. Probar login con Google
echo 4. Jugar minijuegos
echo.
pause





