@echo off
setlocal

set HOST=82.194.68.83
set USER=sistema_apps_user
set PASS=GestionUploadSistemaApps!
set LOCAL=%~dp0sistema_apps_upload\pueblito\assets
set WINSCP=C:\PROGRA~2\WinSCP\WinSCP.com

set SCRIPT=%TEMP%\winscp_css_%RANDOM%.txt
echo open ftps://%USER%:%PASS%@%HOST%/ -explicit -certificate=* > "%SCRIPT%"
echo option batch on >> "%SCRIPT%"
echo option confirm off >> "%SCRIPT%"
echo lcd "%LOCAL%" >> "%SCRIPT%"
echo cd /pueblito/assets >> "%SCRIPT%"
echo put styles.css >> "%SCRIPT%"
echo exit >> "%SCRIPT%"

echo Subiendo CSS...
"%WINSCP%" /ini=nul /script="%SCRIPT%"

del "%SCRIPT%" 2>nul
echo CSS subido!
pause

