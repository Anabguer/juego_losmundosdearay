# Script para mover archivos no usados a zzzPara Borrar
# Trabaja desde el directorio android-nativo

$destino = "zzzPara Borrar"

# Crear subdirectorios
New-Item -ItemType Directory -Path "$destino\js" -Force | Out-Null
New-Item -ItemType Directory -Path "$destino\img" -Force | Out-Null
New-Item -ItemType Directory -Path "$destino\audio" -Force | Out-Null

# Mover archivos de documentación
Write-Host "Moviendo documentación..."
Move-Item -Path "app\src\main\assets\*.md" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\*.txt" -Destination $destino -Force -ErrorAction SilentlyContinue

# Mover scripts
Write-Host "Moviendo scripts..."
Move-Item -Path "app\src\main\assets\*.bat" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\*.ps1" -Destination $destino -Force -ErrorAction SilentlyContinue

# Mover archivos de prueba/debug
Write-Host "Moviendo archivos de prueba..."
Move-Item -Path "app\src\main\assets\debug.html" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\diagnostico.html" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\test-*.html" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\limpiar-firebase.html" -Destination $destino -Force -ErrorAction SilentlyContinue

# Mover versiones demo/web/standalone (no usadas en Android)
Write-Host "Moviendo versiones web/demo..."
Move-Item -Path "app\src\main\assets\index-demo.html" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\index-web.html" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\index-standalone.html" -Destination $destino -Force -ErrorAction SilentlyContinue

# Mover PHP (no usado en Android APK)
Write-Host "Moviendo archivos PHP..."
Move-Item -Path "app\src\main\assets\index.php" -Destination $destino -Force -ErrorAction SilentlyContinue
if (Test-Path "app\src\main\assets\php") {
    Move-Item -Path "app\src\main\assets\php" -Destination $destino -Force -ErrorAction SilentlyContinue
}

# Mover archivos de configuración no usados
Write-Host "Moviendo configuraciones..."
Move-Item -Path "app\src\main\assets\firestore.rules" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\debug.keystore" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\capacitor.config.json" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\Level Up.json" -Destination $destino -Force -ErrorAction SilentlyContinue

# Mover archivos JS -web.js (versiones web)
Write-Host "Moviendo archivos JS web..."
Move-Item -Path "app\src\main\assets\js\*-web.js" -Destination "$destino\js\" -Force -ErrorAction SilentlyContinue

# Mover archivos JS old/testing
Write-Host "Moviendo archivos JS old/testing..."
Move-Item -Path "app\src\main\assets\js\edificio_old.js" -Destination "$destino\js\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\js\reset-data.js" -Destination "$destino\js\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\js\testing.js" -Destination "$destino\js\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\js\testing-web.js" -Destination "$destino\js\" -Force -ErrorAction SilentlyContinue

# Mover imágenes -copia
Write-Host "Moviendo imágenes copia..."
Get-ChildItem -Path "app\src\main\assets\img" -Recurse -Filter "*-copia*" | Move-Item -Destination "$destino\img\" -Force -ErrorAction SilentlyContinue

# Mover Thumbs.db
Write-Host "Moviendo Thumbs.db..."
Get-ChildItem -Path "app\src\main\assets\img" -Recurse -Filter "Thumbs.db" | Move-Item -Destination "$destino\img\" -Force -ErrorAction SilentlyContinue

# Mover README de img
Write-Host "Moviendo READMEs..."
Move-Item -Path "app\src\main\assets\img\README.txt" -Destination "$destino\img\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\img\SPRITES_README.md" -Destination "$destino\img\" -Force -ErrorAction SilentlyContinue

# Mover HTML de img
Move-Item -Path "app\src\main\assets\img\fondos\minijuego_katana_fruit.html" -Destination "$destino\img\" -Force -ErrorAction SilentlyContinue

# Mover README de audio
Move-Item -Path "app\src\main\assets\audio\README.txt" -Destination "$destino\audio\" -Force -ErrorAction SilentlyContinue

# Mover node_modules
Write-Host "Moviendo node_modules..."
if (Test-Path "app\src\main\assets\node_modules") {
    Move-Item -Path "app\src\main\assets\node_modules" -Destination $destino -Force -ErrorAction SilentlyContinue
}

# Mover package.json
Write-Host "Moviendo package.json..."
Move-Item -Path "app\src\main\assets\package.json" -Destination $destino -Force -ErrorAction SilentlyContinue
Move-Item -Path "app\src\main\assets\package-lock.json" -Destination $destino -Force -ErrorAction SilentlyContinue

Write-Host "¡Limpieza completada!"

