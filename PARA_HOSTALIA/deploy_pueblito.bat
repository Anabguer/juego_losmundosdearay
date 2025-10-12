@echo off
setlocal

set HOST=82.194.68.83
set USER=sistema_apps_user
set PASS=GestionUploadSistemaApps!
set LOCAL=%~dp0sistema_apps_upload\pueblito
set WINSCP=C:\PROGRA~2\WinSCP\WinSCP.com

echo ========================================
echo   DEPLOY PUEBLITO
echo ========================================
echo.

if not exist "%LOCAL%" (
  echo ERROR: No existe %LOCAL%
  pause
  exit /b 1
)

if not exist "%WINSCP%" (
  echo ERROR: No encuentro WinSCP
  pause
  exit /b 1
)

set SCRIPT=%TEMP%\winscp_%RANDOM%.txt
echo open ftps://%USER%:%PASS%@%HOST%/ -explicit -certificate=* > "%SCRIPT%"
echo option batch on >> "%SCRIPT%"
echo option confirm off >> "%SCRIPT%"
echo lcd "%LOCAL%" >> "%SCRIPT%"
echo cd /sistema_apps_upload >> "%SCRIPT%"
echo mkdir pueblito >> "%SCRIPT%"
echo cd pueblito >> "%SCRIPT%"
echo synchronize remote -mirror -criteria=size >> "%SCRIPT%"
echo exit >> "%SCRIPT%"

echo Subiendo archivos...
echo.

"%WINSCP%" /ini=nul /script="%SCRIPT%" /log="%LOCAL%\deploy.log"

set ERR=%ERRORLEVEL%
del "%SCRIPT%" 2>nul

if %ERR%==0 (
  echo.
  echo ========================================
  echo   OK - Deploy completado
  echo   URL: https://colisan.com/sistema_apps_upload/pueblito/
  echo ========================================
) else (
  echo.
  echo ERROR: Codigo %ERR%
  echo Ver log: %LOCAL%\deploy.log
)

echo.
pause
