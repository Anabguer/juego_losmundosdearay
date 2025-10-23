@echo off
echo 🔥 Desplegando reglas de Firestore...

REM Verificar que Firebase CLI esté instalado
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI no está instalado
    echo Instala con: npm install -g firebase-tools
    pause
    exit /b 1
)

REM Verificar que estemos logueados
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ No estás logueado en Firebase
    echo Ejecuta: firebase login
    pause
    exit /b 1
)

echo ✅ Firebase CLI disponible
echo 📋 Proyectos disponibles:
firebase projects:list

echo.
echo 🔧 Desplegando reglas...
firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo ✅ Reglas desplegadas correctamente
) else (
    echo ❌ Error desplegando reglas
)

pause


