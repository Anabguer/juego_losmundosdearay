@echo off
setlocal

set HOST=82.194.68.83
set USER=sistema_apps_user
set PASS=GestionUploadSistemaApps!
set LOCAL=%~dp0sistema_apps_upload\pueblito\assets\img
set WINSCP=C:\PROGRA~2\WinSCP\WinSCP.com

set SCRIPT=%TEMP%\winscp_img_%RANDOM%.txt
echo open ftps://%USER%:%PASS%@%HOST%/ -explicit -certificate=* > "%SCRIPT%"
echo option batch on >> "%SCRIPT%"
echo option confirm off >> "%SCRIPT%"
echo lcd "%LOCAL%" >> "%SCRIPT%"
echo cd /pueblito/assets/img >> "%SCRIPT%"
echo put * >> "%SCRIPT%"
echo lcd juegos >> "%SCRIPT%"
echo cd juegos >> "%SCRIPT%"
echo put * >> "%SCRIPT%"
echo lcd .. >> "%SCRIPT%"
echo cd .. >> "%SCRIPT%"
echo lcd fondos >> "%SCRIPT%"
echo cd fondos >> "%SCRIPT%"
echo put * >> "%SCRIPT%"
echo lcd .. >> "%SCRIPT%"
echo cd .. >> "%SCRIPT%"
echo lcd texturas >> "%SCRIPT%"
echo cd texturas >> "%SCRIPT%"
echo put * >> "%SCRIPT%"
echo lcd .. >> "%SCRIPT%"
echo cd .. >> "%SCRIPT%"
echo lcd personaje >> "%SCRIPT%"
echo cd personaje >> "%SCRIPT%"
echo put * >> "%SCRIPT%"
echo exit >> "%SCRIPT%"

echo Subiendo imagenes...
"%WINSCP%" /ini=nul /script="%SCRIPT%"

del "%SCRIPT%" 2>nul
echo Imagenes subidas!
pause

