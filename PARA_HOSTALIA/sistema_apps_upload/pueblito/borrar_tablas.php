<?php
/**
 * 🗑️ BORRAR TABLAS DE BASE DE DATOS
 * Este script borra las tablas: tbl_aplicaciones, tbl_juegos, tbl_scores
 * ⚠️ BORRA ESTE ARCHIVO después de usarlo
 */

header('Content-Type: text/html; charset=UTF-8');

// Configuración de la base de datos
require_once 'php/config.php';

?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🗑️ Borrar Tablas - Los Mundos de Aray</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      width: 100%;
    }
    .box {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 20px;
    }
    h1 {
      color: #667eea;
      font-size: 2.5em;
      margin-bottom: 10px;
      text-align: center;
    }
    h2 {
      color: #333;
      font-size: 1.5em;
      margin: 30px 0 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 10px 0;
    }
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
    }
    .btn {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
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
    ul {
      margin: 15px 0;
      padding-left: 30px;
    }
    li {
      color: #666;
      margin: 8px 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">
      <h1>🗑️ Borrar Tablas</h1>
      <p style="text-align: center; font-size: 1.1em;">Los Mundos de Aray - Base de Datos</p>
    </div>

<?php

try {
  // Conectar a la base de datos
  $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NOMBRE . ";charset=" . DB_CHARSET;
  $options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ];
  
  $pdo = new PDO($dsn, DB_USUARIO, DB_CONTRA, $options);
  
  echo '<div class="box">';
  echo '<h2>✅ Conexión exitosa</h2>';
  echo '<p>Conectado a: <strong>' . DB_HOST . '</strong></p>';
  echo '<p>Base de datos: <strong>' . DB_NOMBRE . '</strong></p>';
  echo '</div>';
  
  // Desactivar verificación de claves foráneas
  echo '<div class="box">';
  echo '<h2>🔧 Preparando borrado...</h2>';
  $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
  echo '<p class="success">✅ Verificación de claves foráneas desactivada</p>';
  
  // Borrar tablas
  echo '<h2>🗑️ Borrando tablas...</h2>';
  
  $tablas = ['tbl_scores', 'tbl_juegos', 'tbl_aplicaciones'];
  
  foreach ($tablas as $tabla) {
    try {
      $pdo->exec("DROP TABLE IF EXISTS $tabla");
      echo "<p class='success'>✅ Tabla <strong>$tabla</strong> borrada correctamente</p>";
    } catch (PDOException $e) {
      echo "<p class='error'>❌ Error al borrar <strong>$tabla</strong>: " . $e->getMessage() . "</p>";
    }
  }
  
  // Reactivar verificación de claves foráneas
  $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
  echo '<p class="success">✅ Verificación de claves foráneas reactivada</p>';
  echo '</div>';
  
  // Verificar que se borraron
  echo '<div class="box">';
  echo '<h2>📊 Verificación final</h2>';
  $stmt = $pdo->query("SHOW TABLES");
  $todasTablas = $stmt->fetchAll(PDO::FETCH_COLUMN);
  
  if (empty($todasTablas)) {
    echo '<p class="success">✅ No quedan tablas en la base de datos</p>';
  } else {
    echo '<p class="warning">⚠️ Quedan ' . count($todasTablas) . ' tablas en la base de datos:</p>';
    echo '<ul>';
    foreach ($todasTablas as $tabla) {
      echo "<li>$tabla</li>";
    }
    echo '</ul>';
  }
  echo '</div>';
  
  echo '<div class="box">
    <h2 class="success">🎉 ¡Borrado completado!</h2>
    <p>Las tablas han sido eliminadas correctamente.</p>
    <p><strong class="warning">⚠️ IMPORTANTE:</strong> Por seguridad, <strong>BORRA ESTE ARCHIVO</strong> ahora:</p>
    <pre>borrar_tablas.php</pre>
    <p><a href="/sistema_apps_upload/pueblito/" class="btn">🏠 Volver al Inicio</a></p>
  </div>';
  
} catch (PDOException $e) {
  echo '</div><div class="box">
    <h2 class="error">❌ Error de Conexión</h2>
    <p>No se pudo conectar a la base de datos:</p>
    <pre>' . htmlspecialchars($e->getMessage()) . '</pre>
    <p><strong>Verifica:</strong></p>
    <ul>
      <li>Credenciales en <code>php/config.php</code></li>
      <li>Que la base de datos existe</li>
      <li>Permisos de usuario</li>
    </ul>
  </div>';
}

?>

  </div>
</body>
</html>

