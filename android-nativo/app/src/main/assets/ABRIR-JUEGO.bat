@echo off
title Servidor del Juego - Los Mundos de Aray
color 0A
echo.
echo ========================================
echo   LOS MUNDOS DE ARAY - SERVIDOR
echo ========================================
echo.
echo Iniciando servidor en puerto 8000...
echo.

cd /d "%~dp0"

REM Intentar con Node.js
where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo Usando Node.js http-server...
    echo.
    start http://localhost:8000
    npx --yes http-server -p 8000
    goto :end
)

REM Si no hay Node, intentar con Python
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo Usando Python http.server...
    echo.
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

REM Si no hay nada, mostrar instrucciones
echo ERROR: No se encontro Node.js ni Python
echo.
echo Por favor, abre una nueva ventana de PowerShell y ejecuta:
echo   cd "%~dp0"
echo   npx http-server -p 8000 -o
echo.
echo (Node.js ya esta instalado, solo necesitas abrir una terminal NUEVA)
echo.
pause
goto :end

:end



