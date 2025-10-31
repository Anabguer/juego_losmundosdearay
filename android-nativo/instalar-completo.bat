@echo off
echo 🚀 Script de Instalación - Los Mundos de Aray
echo ================================================
echo.

echo 📋 INSTRUCCIONES PASO A PASO:
echo.
echo 1. 🔥 PRIMERO: Limpiar Firebase
echo    - Ve a https://console.firebase.google.com/
echo    - Selecciona tu proyecto "Los Mundos de Aray"
echo    - Ve a Firestore Database
echo    - Presiona F12 para abrir consola de desarrollador
echo    - Ejecuta el script de verificación y limpieza
echo.
echo 2. 📱 SEGUNDO: Conectar dispositivo Android
echo    - Conecta tu dispositivo Android por USB
echo    - Habilita "Depuración USB" en Opciones de desarrollador
echo    - Autoriza la conexión cuando aparezca el diálogo
echo.
echo 3. 🔧 TERCERO: Instalar aplicación
echo    - Ejecuta este script nuevamente
echo    - O usa: gradlew installDebug
echo.
echo ================================================
echo.

echo 📱 Verificando dispositivo conectado...
echo.

REM Intentar usar adb si está disponible
where adb >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ ADB encontrado en el sistema
    adb devices
    echo.
    
    REM Verificar si hay dispositivos conectados
    for /f "tokens=1" %%i in ('adb devices ^| find "device"') do (
        if not "%%i"=="List" (
            echo 📱 Dispositivo encontrado: %%i
            echo 🔧 Instalando aplicación...
            adb install -r app\build\outputs\apk\debug\app-debug.apk
            
            if %ERRORLEVEL% EQU 0 (
                echo ✅ Aplicación instalada exitosamente
                echo 🎉 ¡Listo para probar la nueva estructura unificada!
            ) else (
                echo ❌ Error instalando la aplicación
                echo 💡 Verifica que el dispositivo esté autorizado para depuración
            )
            goto :end
        )
    )
    
    echo ❌ No se encontraron dispositivos conectados
) else (
    echo ⚠️ ADB no encontrado en el PATH del sistema
    echo 💡 Intentando usar gradlew...
    
    echo 🔧 Instalando aplicación con gradlew...
    gradlew installDebug
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Aplicación instalada exitosamente
        echo 🎉 ¡Listo para probar la nueva estructura unificada!
    ) else (
        echo ❌ Error instalando la aplicación
        echo 💡 Asegúrate de que:
        echo    - El dispositivo esté conectado por USB
        echo    - La depuración USB esté habilitada
        echo    - El dispositivo esté autorizado para depuración
    )
)

:end
echo.
echo 📋 Próximos pasos después de la instalación:
echo 1. Abrir la aplicación en el dispositivo
echo 2. Verificar que se carga la nueva estructura unificada
echo 3. Probar sincronización online/offline
echo 4. Confirmar que los datos se migran automáticamente
echo.
echo 🔍 Para verificar que funciona:
echo - Abre la consola del navegador en el dispositivo
echo - Deberías ver logs de sincronización automática
echo - Los datos se guardarán en la nueva estructura unificada
echo.
pause
