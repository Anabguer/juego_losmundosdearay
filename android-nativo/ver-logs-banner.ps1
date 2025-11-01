Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📋 LOGS DE BANNER ADMOB" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Filtrando logs relacionados con el banner..." -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

# Intentar usar adb si está disponible
$adbPath = $null
if (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe") {
    $adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"
} elseif (Test-Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe") {
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
}

if ($adbPath) {
    & $adbPath logcat -c  # Limpiar logs anteriores
    & $adbPath logcat | Select-String -Pattern "AdManager|MainActivity|AdMob|Banner|AdView" | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "ERROR|❌|Error") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "✅|SUCCESS|Cargado") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "🔵|🔄|🟡") {
            Write-Host $line -ForegroundColor Cyan
        } else {
            Write-Host $line
        }
    }
} else {
    Write-Host "❌ No se encontró adb. Buscando en otras ubicaciones..." -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, ejecuta manualmente:" -ForegroundColor Yellow
    Write-Host "adb logcat | findstr /i 'AdManager MainActivity AdMob Banner AdView'" -ForegroundColor Yellow
}

