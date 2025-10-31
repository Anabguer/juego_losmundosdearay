@echo off
echo 🚀 Instalación Manual - Los Mundos de Aray
echo ================================================
echo.

echo 📱 Dispositivo detectado via Chrome DevTools
echo 🔧 Preparando instalación manual...
echo.

echo 📦 APK compilado encontrado:
dir app\build\outputs\apk\debug\app-debug.apk

echo.
echo 📋 INSTRUCCIONES PARA INSTALACIÓN MANUAL:
echo.
echo 1. 📱 En tu dispositivo Android:
echo    - Abre Chrome
echo    - Ve a: chrome://inspect/#devices
echo    - Busca "Los Mundos de Aray" en la lista
echo    - Haz clic en "Inspect"
echo.
echo 2. 🔧 En la consola de Chrome DevTools:
echo    - Ve a la pestaña "Console"
echo    - Ejecuta el script de verificación de Firebase
echo    - Ejecuta el script de limpieza si es necesario
echo.
echo 3. 📦 Para instalar el APK:
echo    - Copia el archivo: app\build\outputs\apk\debug\app-debug.apk
echo    - Envía el APK al dispositivo (WhatsApp, email, etc.)
echo    - Instala manualmente en el dispositivo
echo.
echo 4. ✅ Verificar funcionamiento:
echo    - Abre la aplicación
echo    - Verifica que se carga la nueva estructura unificada
echo    - Prueba sincronización online/offline
echo.

echo 📋 SCRIPT DE FIREBASE PARA EJECUTAR EN CHROME DEVTOOLS:
echo ================================================
echo.
echo 🔍 Script de Verificación:
echo.
echo async function verificarEstructura() {
echo   try {
echo     const appsSnapshot = await firebase.firestore()
echo       .collection('apps')
echo       .doc('aray')
echo       .collection('users')
echo       .get();
echo     console.log('Multi-App usuarios:', appsSnapshot.size);
echo     
echo     const usersSnapshot = await firebase.firestore()
echo       .collection('users')
echo       .get();
echo     console.log('Legacy usuarios:', usersSnapshot.size);
echo     
echo     return { multiApp: appsSnapshot.size, legacy: usersSnapshot.size };
echo   } catch (error) {
echo     console.error('Error:', error);
echo   }
echo }
echo verificarEstructura();
echo.
echo 🗑️ Script de Limpieza (EJECUTAR SOLO SI ESTÁS SEGURO):
echo.
echo async function limpiarFirebase() {
echo   try {
echo     const appsSnapshot = await firebase.firestore()
echo       .collection('apps')
echo       .doc('aray')
echo       .collection('users')
echo       .get();
echo     const batch1 = firebase.firestore().batch();
echo     appsSnapshot.docs.forEach(doc => batch1.delete(doc.ref));
echo     await batch1.commit();
echo     console.log('Multi-App limpiado:', appsSnapshot.size);
echo     
echo     const usersSnapshot = await firebase.firestore()
echo       .collection('users')
echo       .get();
echo     const batch2 = firebase.firestore().batch();
echo     usersSnapshot.docs.forEach(doc => batch2.delete(doc.ref));
echo     await batch2.commit();
echo     console.log('Legacy limpiado:', usersSnapshot.size);
echo     console.log('✅ Firebase limpio - listo para nueva estructura');
echo   } catch (error) {
echo     console.error('Error:', error);
echo   }
echo }
echo limpiarFirebase();
echo.
echo ================================================
echo.
pause
