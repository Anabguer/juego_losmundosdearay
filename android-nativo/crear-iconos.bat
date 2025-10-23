@echo off
echo 🎨 Creando iconos de la app...

REM Crear directorios
mkdir "app\src\main\res\mipmap-hdpi" 2>nul
mkdir "app\src\main\res\mipmap-mdpi" 2>nul
mkdir "app\src\main\res\mipmap-xhdpi" 2>nul
mkdir "app\src\main\res\mipmap-xxhdpi" 2>nul
mkdir "app\src\main\res\mipmap-xxxhdpi" 2>nul

REM Copiar logo como icono
copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-hdpi\ic_launcher.png"
copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-hdpi\ic_launcher_round.png"

copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-mdpi\ic_launcher.png"
copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-mdpi\ic_launcher_round.png"

copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-xhdpi\ic_launcher.png"
copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"

copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-xxhdpi\ic_launcher.png"
copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"

copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
copy "..\pueblito\assets\img\logo.png" "app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"

echo ✅ Iconos creados
echo.
echo 📱 Ahora puedes compilar la APK
pause




