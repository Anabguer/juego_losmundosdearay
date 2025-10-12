@echo off
setlocal

set HOST=82.194.68.83
set USER=sistema_apps_user
set PASS=GestionUploadSistemaApps!
set LOCAL=%~dp0sistema_apps_upload\pueblito\php
set WINSCP=C:\PROGRA~2\WinSCP\WinSCP.com

set SCRIPT=%TEMP%\winscp_php_%RANDOM%.txt
echo open ftps://%USER%:%PASS%@%HOST%/ -explicit -certificate=* > "%SCRIPT%"
echo option batch on >> "%SCRIPT%"
echo option confirm off >> "%SCRIPT%"
echo lcd "%LOCAL%" >> "%SCRIPT%"
echo cd /pueblito/php >> "%SCRIPT%"
echo put *.php >> "%SCRIPT%"
echo exit >> "%SCRIPT%"

echo Subiendo archivos PHP...
"%WINSCP%" /ini=nul /script="%SCRIPT%"

del "%SCRIPT%" 2>nul
echo PHP subidos!
pause


