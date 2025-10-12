@echo off
setlocal

set HOST=82.194.68.83
set USER=sistema_apps_user
set PASS=GestionUploadSistemaApps!
set LOCAL=%~dp0sistema_apps_upload\pueblito
set WINSCP=C:\PROGRA~2\WinSCP\WinSCP.com

set SCRIPT=%TEMP%\winscp_borrador_%RANDOM%.txt
echo open ftps://%USER%:%PASS%@%HOST%/ -explicit -certificate=* > "%SCRIPT%"
echo option batch on >> "%SCRIPT%"
echo option confirm off >> "%SCRIPT%"
echo lcd "%LOCAL%" >> "%SCRIPT%"
echo cd /pueblito >> "%SCRIPT%"
echo put borrar_tablas.php >> "%SCRIPT%"
echo put investigar_bd.php >> "%SCRIPT%"
echo put instalar_juego_completo.php >> "%SCRIPT%"
echo put crear_datos_prueba.php >> "%SCRIPT%"
echo exit >> "%SCRIPT%"

echo Subiendo script para borrar tablas...
"%WINSCP%" /ini=nul /script="%SCRIPT%"

del "%SCRIPT%" 2>nul
echo.
echo ========================================
echo   Script subido!
echo   Abre: https://colisan.com/sistema_apps_upload/pueblito/borrar_tablas.php
echo ========================================
pause
