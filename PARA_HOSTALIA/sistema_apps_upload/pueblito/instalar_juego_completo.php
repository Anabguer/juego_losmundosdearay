<?php
/**
 * 🎮 INSTALADOR COMPLETO - Los Mundos de Aray
 * 
 * Este script:
 * 1. Registra el juego en la tabla "aplicaciones"
 * 2. Crea las tablas necesarias para el sistema de ranking
 */

header('Content-Type: text/html; charset=UTF-8');
require_once 'php/config.php';

?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎮 Instalación - Los Mundos de Aray</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .box {
      background: white;
      border-radius: 20px;
      padding: 35px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 20px;
    }
    h1 { color: #667eea; font-size: 2.2em; margin-bottom: 10px; text-align: center; }
    h2 { color: #333; font-size: 1.4em; margin: 25px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #f0f0f0; }
    p { color: #666; line-height: 1.7; margin: 10px 0; }
    .success { color: #10b981; font-weight: bold; }
    .error { color: #ef4444; font-weight: bold; }
    .warning { color: #f59e0b; font-weight: bold; }
    pre {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 10px 0;
      border-left: 4px solid #667eea;
      font-size: 0.9em;
    }
    .btn {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin: 10px 5px;
      transition: all 0.3s;
    }
    .btn:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    ul { margin: 15px 0; padding-left: 30px; }
    li { color: #666; margin: 8px 0; line-height: 1.6; }
    .code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">
      <h1>🎮 Instalación Completa</h1>
      <p style="text-align: center; font-size: 1.1em;">Los Mundos de Aray</p>
    </div>

<?php

try {
  $pdo = getDB();
  
  if (!$pdo) {
    throw new Exception("No se pudo conectar a la base de datos");
  }
  
  echo '<div class="box">';
  echo '<h2 class="success">✅ Conexión exitosa</h2>';
  echo '<p>Base de datos: <strong>' . DB_NOMBRE . '</strong></p>';
  echo '</div>';
  
  // ========================================
  // PASO 1: REGISTRAR EN TABLA APLICACIONES
  // ========================================
  echo '<div class="box">';
  echo '<h2>📝 Paso 1: Registrar Aplicación</h2>';
  
  // Verificar si ya existe
  $stmt = $pdo->prepare("SELECT app_id, app_codigo FROM aplicaciones WHERE app_codigo = ?");
  $stmt->execute(['losmundosdearay']);
  $existe = $stmt->fetch();
  
  if ($existe) {
    echo '<p class="warning">⚠️ La aplicación ya está registrada (ID: ' . $existe['app_id'] . ')</p>';
  } else {
    // Insertar nueva aplicación
    $stmt = $pdo->prepare("
      INSERT INTO aplicaciones (app_codigo, app_nombre, app_descripcion, activa) 
      VALUES (?, ?, ?, 1)
    ");
    $stmt->execute([
      'losmundosdearay',
      'Los Mundos de Aray',
      'Juego de aventuras con 9 minijuegos: plataformas, puzzles, arcade y más'
    ]);
    
    $appId = $pdo->lastInsertId();
    echo '<p class="success">✅ Aplicación registrada correctamente (ID: ' . $appId . ')</p>';
  }
  
  echo '</div>';
  
  // ========================================
  // PASO 2: CREAR TABLAS DEL JUEGO
  // ========================================
  echo '<div class="box">';
  echo '<h2>🗄️ Paso 2: Crear Tablas del Juego</h2>';
  
  // Tabla 1: losmundosdearay_progreso
  echo '<h3>Tabla: losmundosdearay_progreso</h3>';
  $sql = "
    CREATE TABLE IF NOT EXISTS losmundosdearay_progreso (
      progreso_id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_aplicacion_key VARCHAR(150) NOT NULL UNIQUE,
      nivel_max_global INT DEFAULT 1,
      monedas_total INT DEFAULT 0,
      energia INT DEFAULT 100,
      actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_usuario (usuario_aplicacion_key),
      INDEX idx_monedas (monedas_total DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ";
  $pdo->exec($sql);
  echo '<p class="success">✅ Tabla creada/verificada</p>';
  
  // Tabla 2: losmundosdearay_scores
  echo '<h3>Tabla: losmundosdearay_scores</h3>';
  $sql = "
    CREATE TABLE IF NOT EXISTS losmundosdearay_scores (
      score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
      usuario_aplicacion_key VARCHAR(150) NOT NULL,
      juego_slug VARCHAR(50) NOT NULL,
      puntuacion INT NOT NULL DEFAULT 0,
      nivel_alcanzado INT DEFAULT 1,
      tiempo_segundos INT DEFAULT 0,
      monedas_ganadas INT DEFAULT 0,
      metadata JSON,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_usuario (usuario_aplicacion_key),
      INDEX idx_juego (juego_slug),
      INDEX idx_puntuacion (juego_slug, puntuacion DESC),
      INDEX idx_fecha (fecha DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ";
  $pdo->exec($sql);
  echo '<p class="success">✅ Tabla creada/verificada</p>';
  
  // Tabla 3: losmundosdearay_ranking_cache
  echo '<h3>Tabla: losmundosdearay_ranking_cache</h3>';
  $sql = "
    CREATE TABLE IF NOT EXISTS losmundosdearay_ranking_cache (
      ranking_id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_aplicacion_key VARCHAR(150) NOT NULL,
      email VARCHAR(255),
      nick VARCHAR(255),
      nombre VARCHAR(255),
      puntos_totales BIGINT DEFAULT 0,
      monedas_totales INT DEFAULT 0,
      nivel_max INT DEFAULT 1,
      juegos_completados INT DEFAULT 0,
      mejor_tiempo_total INT DEFAULT 0,
      ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_usuario (usuario_aplicacion_key),
      INDEX idx_puntos (puntos_totales DESC),
      INDEX idx_monedas (monedas_totales DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ";
  $pdo->exec($sql);
  echo '<p class="success">✅ Tabla creada/verificada</p>';
  
  echo '</div>';
  
  // ========================================
  // VERIFICACIÓN FINAL
  // ========================================
  echo '<div class="box">';
  echo '<h2>📊 Verificación Final</h2>';
  
  // Verificar aplicación
  $stmt = $pdo->prepare("SELECT * FROM aplicaciones WHERE app_codigo = 'losmundosdearay'");
  $stmt->execute();
  $app = $stmt->fetch();
  
  if ($app) {
    echo '<p class="success">✅ Aplicación registrada:</p>';
    echo '<ul>';
    echo '<li><strong>ID:</strong> ' . $app['app_id'] . '</li>';
    echo '<li><strong>Código:</strong> ' . $app['app_codigo'] . '</li>';
    echo '<li><strong>Nombre:</strong> ' . $app['app_nombre'] . '</li>';
    echo '<li><strong>Activa:</strong> ' . ($app['activa'] ? 'Sí' : 'No') . '</li>';
    echo '</ul>';
  }
  
  // Verificar tablas
  $tablas = ['losmundosdearay_progreso', 'losmundosdearay_scores', 'losmundosdearay_ranking_cache'];
  $stmt = $pdo->query("SHOW TABLES LIKE 'losmundosdearay_%'");
  $tablasExistentes = $stmt->fetchAll(PDO::FETCH_COLUMN);
  
  echo '<p class="success">✅ Tablas creadas: ' . count($tablasExistentes) . '</p>';
  echo '<ul>';
  foreach ($tablasExistentes as $tabla) {
    $stmt = $pdo->query("SELECT COUNT(*) FROM `$tabla`");
    $count = $stmt->fetchColumn();
    echo '<li><span class="code">' . $tabla . '</span> - ' . $count . ' registros</li>';
  }
  echo '</ul>';
  
  echo '</div>';
  
  // ========================================
  // ÉXITO
  // ========================================
  echo '<div class="box">
    <h2 class="success">🎉 ¡Instalación Completada!</h2>
    <p>El sistema está listo para funcionar:</p>
    <ul>
      <li>✅ Aplicación registrada en el sistema</li>
      <li>✅ Tablas de progreso y ranking creadas</li>
      <li>✅ Sistema de usuarios integrado</li>
    </ul>
    <p><strong class="warning">⚠️ IMPORTANTE:</strong> Por seguridad, <strong>BORRA ESTOS ARCHIVOS</strong> ahora:</p>
    <pre>instalar_juego_completo.php
investigar_bd.php
borrar_tablas.php</pre>
    <p><a href="/sistema_apps_upload/pueblito/" class="btn">🎮 Ir al Juego</a></p>
  </div>';
  
} catch (Exception $e) {
  echo '</div><div class="box">
    <h2 class="error">❌ Error</h2>
    <p>Ocurrió un error durante la instalación:</p>
    <pre>' . htmlspecialchars($e->getMessage()) . '</pre>
    <p>Verifica:</p>
    <ul>
      <li>Credenciales de BD en <code>php/config.php</code></li>
      <li>Permisos de la base de datos</li>
      <li>Que el usuario tiene permisos CREATE TABLE</li>
    </ul>
  </div>';
}

?>

  </div>
</body>
</html>

