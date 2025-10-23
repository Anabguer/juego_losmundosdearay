@echo off
echo 🔍 Verificación Completa - Los Mundos de Aray
echo ==============================================

echo.
echo 1. Verificando archivos de juegos...
set /a count=0
for %%f in (skate cole informatica parque tienda yayos edificio pabellon rio) do (
    if exist "app\src\main\assets\www\js\%%f.js" (
        echo ✅ %%f.js existe
        set /a count+=1
    ) else (
        echo ❌ %%f.js NO existe
    )
)
echo 📊 Total de juegos encontrados: %count%/9

echo.
echo 2. Verificando updateBestLevel en cada juego...
for %%f in (skate cole informatica parque tienda yayos edificio pabellon rio) do (
    findstr /C:"updateBestLevel" "app\src\main\assets\www\js\%%f.js" >nul
    if %errorlevel% equ 0 (
        echo ✅ %%f.js tiene updateBestLevel
    ) else (
        echo ❌ %%f.js NO tiene updateBestLevel
    )
)

echo.
echo 3. Verificando trySaveProgress en cada juego...
for %%f in (skate cole informatica parque tienda yayos edificio pabellon rio) do (
    findstr /C:"trySaveProgress" "app\src\main\assets\www\js\%%f.js" >nul
    if %errorlevel% equ 0 (
        echo ✅ %%f.js tiene trySaveProgress
    ) else (
        echo ❌ %%f.js NO tiene trySaveProgress
    )
)

echo.
echo 4. Verificando GameBridge.java...
if exist "app\src\main\java\com\intocables\losmundosdearay\GameBridge.java" (
    echo ✅ GameBridge.java existe
    findstr /C:"runTransaction" "app\src\main\java\com\intocables\losmundosdearay\GameBridge.java" >nul
    if %errorlevel% equ 0 (
        echo ✅ GameBridge.java tiene transacciones
    ) else (
        echo ❌ GameBridge.java NO tiene transacciones
    )
) else (
    echo ❌ GameBridge.java NO existe
)

echo.
echo 5. Verificando archivos de diagnóstico...
if exist "app\src\main\assets\www\diagnostico.html" (
    echo ✅ diagnostico.html existe
) else (
    echo ❌ diagnostico.html NO existe
)

if exist "app\src\main\java\com\intocables\losmundosdearay\TestFirestore.java" (
    echo ✅ TestFirestore.java existe
) else (
    echo ❌ TestFirestore.java NO existe
)

echo.
echo 6. Verificando reglas de Firestore...
if exist "firestore.rules" (
    echo ✅ firestore.rules existe
) else (
    echo ❌ firestore.rules NO existe
)

echo.
echo ✅ Verificación completada
echo.
echo 📱 Para probar:
echo 1. Ejecuta: test-rapido.bat
echo 2. Abre la app
echo 3. Ve a: file:///android_asset/diagnostico.html
echo 4. Ejecuta todos los tests
echo 5. Revisa Logcat para ver los resultados
echo.
pause


