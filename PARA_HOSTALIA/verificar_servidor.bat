@echo off
setlocal

set HOST=82.194.68.83
set USER=sistema_apps_user
set PASS=GestionUploadSistemaApps!
set WINSCP=C:\PROGRA~2\WinSCP\WinSCP.com

set SCRIPT=%TEMP%\winscp_ver_%RANDOM%.txt
echo open ftps://%USER%:%PASS%@%HOST%/ -explicit -certificate=* > "%SCRIPT%"
echo option batch on >> "%SCRIPT%"
echo option confirm off >> "%SCRIPT%"
echo cd /pueblito >> "%SCRIPT%"
echo ls >> "%SCRIPT%"
echo exit >> "%SCRIPT%"

echo Listando archivos en /pueblito...
echo.
"%WINSCP%" /ini=nul /script="%SCRIPT%"

del "%SCRIPT%" 2>nul
pause


