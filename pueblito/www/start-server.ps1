# Servidor HTTP simple para el juego
# Puerto: 8000

$port = 8000
$url = "http://localhost:$port"

Write-Host "Iniciando servidor del juego..." -ForegroundColor Cyan
Write-Host "Carpeta: $PWD" -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Abrir navegador automaticamente
Start-Process $url

# Crear listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("$url/")
$listener.Start()

Write-Host "Servidor corriendo en $url" -ForegroundColor Green
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Obtener ruta del archivo
        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.php" }
        
        $filePath = Join-Path $PWD $path.TrimStart('/')
        
        # Determinar tipo MIME
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".php"  { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".json" { "application/json; charset=utf-8" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".gif"  { "image/gif" }
            ".svg"  { "image/svg+xml" }
            ".ico"  { "image/x-icon" }
            default { "application/octet-stream" }
        }
        
        # Servir archivo
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
            
            Write-Host "OK $($request.HttpMethod) $path" -ForegroundColor Green
        }
        else {
            $response.StatusCode = 404
            $errorMsg = "<h1>404 - Not Found</h1><p>$path</p>"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "ERROR $($request.HttpMethod) $path (404)" -ForegroundColor Red
        }
        
        $response.Close()
    }
}
finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "Servidor detenido" -ForegroundColor Yellow
}
