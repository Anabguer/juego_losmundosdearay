@echo off
echo 🚀 Instalando APK en dispositivo...

REM Verificar dispositivo conectado
adb devices

REM Instalar APK
echo 📱 Instalando APK...
adb install app\build\outputs\apk\debug\app-debug.apk

echo ✅ Instalación completada
pause




