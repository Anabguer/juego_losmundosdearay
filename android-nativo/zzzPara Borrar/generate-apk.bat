@echo off
echo 🚀 Generando APK de Los Mundos de Aray...
echo.

echo 📱 Sincronizando con Capacitor...
npx cap sync android

echo.
echo 🔧 Abriendo Android Studio...
npx cap open android

echo.
echo 📋 INSTRUCCIONES:
echo 1. En Android Studio, verificar Gradle JDK = 17
echo 2. Build → Clean Project
echo 3. Build → Rebuild Project
echo 4. Build → Build Bundle(s) / APK(s) → Build APK(s)
echo 5. El APK estará en: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ✅ Proceso completado!
pause


