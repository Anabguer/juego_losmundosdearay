@echo off
echo 🎨 Generando iconos completos de la APK desde logo.png...

set "SOURCE_LOGO=app\src\main\assets\img\logo.png"
set "RES_DIR=app\src\main\res"

if not exist "%SOURCE_LOGO%" (
    echo ❌ Error: No se encuentra el archivo %SOURCE_LOGO%
    pause
    exit /b 1
)
echo ✅ Archivo logo.png encontrado

echo 📁 Creando directorios de recursos...
for %%i in (mdpi hdpi xhdpi xxhdpi xxxhdpi) do (
    mkdir "%RES_DIR%\mipmap-%%i" 2>nul
    mkdir "%RES_DIR%\drawable-%%i" 2>nul
)
mkdir "%RES_DIR%\mipmap-anydpi-v26" 2>nul
mkdir "%RES_DIR%\drawable" 2>nul
mkdir "%RES_DIR%\values" 2>nul
echo ✅ Directorios creados

echo 🖼️ Generando iconos para diferentes resoluciones...
REM Iconos estándar y redondos
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-mdpi\ic_launcher.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-mdpi\ic_launcher_round.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-hdpi\ic_launcher.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-hdpi\ic_launcher_round.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-xhdpi\ic_launcher.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-xhdpi\ic_launcher_round.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-xxhdpi\ic_launcher.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-xxhdpi\ic_launcher_round.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-xxxhdpi\ic_launcher.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\mipmap-xxxhdpi\ic_launcher_round.png"
echo ✅ Iconos copiados a todas las resoluciones

echo 📝 Creando configuración de iconos adaptativos...
REM ic_launcher.xml para iconos adaptativos
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"^>
echo     ^<background android:drawable="@color/ic_launcher_background"/^>
echo     ^<foreground android:drawable="@drawable/ic_launcher_foreground"/^>
echo ^</adaptive-icon^>
) > "%RES_DIR%\mipmap-anydpi-v26\ic_launcher.xml"

REM ic_launcher_round.xml para iconos adaptativos redondos
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"^>
echo     ^<background android:drawable="@color/ic_launcher_background"/^>
echo     ^<foreground android:drawable="@drawable/ic_launcher_foreground"/^>
echo ^</adaptive-icon^>
) > "%RES_DIR%\mipmap-anydpi-v26\ic_launcher_round.xml"

REM colors.xml con color de fondo
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<resources^>
echo     ^<color name="ic_launcher_background"^>#3DDC84^</color^>
echo ^</resources^>
) > "%RES_DIR%\values\colors.xml"

REM Copiar logo como foreground para iconos adaptativos
copy "%SOURCE_LOGO%" "%RES_DIR%\drawable-mdpi\ic_launcher_foreground.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\drawable-hdpi\ic_launcher_foreground.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\drawable-xhdpi\ic_launcher_foreground.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\drawable-xxhdpi\ic_launcher_foreground.png"
copy "%SOURCE_LOGO%" "%RES_DIR%\drawable-xxxhdpi\ic_launcher_foreground.png"
echo ✅ Configuración de iconos adaptativos creada

echo.
echo 🎉 ¡Iconos generados exitosamente!
echo.
echo 📱 Archivos creados:
echo    ✅ Iconos estándar (ic_launcher.png)
echo    ✅ Iconos redondos (ic_launcher_round.png)
echo    ✅ Iconos adaptativos (Android 8.0+)
echo    ✅ Configuración XML
echo.
echo 🚀 Ahora puedes compilar la APK con:
echo    gradlew assembleDebug
echo.
pause
