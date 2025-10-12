<?php
/**
 * 🔍 INVESTIGAR BASE DE DATOS
 * Este script explora la BD multiaplicacion para ver qué tablas y estructura existen
 */

header('Content-Type: text/html; charset=UTF-8');

?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔍 Investigar BD - Los Mundos de Aray</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .box {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 20px;
    }
    h1 { color: #667eea; font-size: 2em; margin-bottom: 10px; }
    h2 { color: #333; font-size: 1.3em; margin: 20px 0 10px; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
    h3 { color: #555; font-size: 1.1em; margin: 15px 0 8px; }
    p { color: #666; line-height: 1.6; margin: 8px 0; }
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
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #667eea;
      color: white;
      font-weight: bold;
    }
    tr:hover { background: #f8f9fa; }
    .code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">
      <h1>🔍 Investigar Base de Datos</h1>
      <p style="text-align: center;">Explorando la estructura de <strong>multiaplicacion</strong></p>
    </div>

<?php

// Usar config.php
require_once 'php/config.php';

$connected = false;
$pdo = null;

try {
  $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NOMBRE . ";charset=" . DB_CHARSET;
  $options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ];
  
  $pdo = new PDO($dsn, DB_USUARIO, DB_CONTRA, $options);
  
  echo '<div class="box">';
  echo '<h2 class="success">✅ Conexión exitosa</h2>';
  echo '<p>Host: <strong>' . DB_HOST . '</strong></p>';
  echo '<p>Base de datos: <strong>' . DB_NOMBRE . '</strong></p>';
  echo '<p>Usuario: <strong>' . DB_USUARIO . '</strong></p>';
  echo '</div>';
  
  $connected = true;
  
} catch (PDOException $e) {
  echo '<div class="box">';
  echo '<h2 class="error">❌ Error de Conexión</h2>';
  echo '<p>Host: <strong>' . DB_HOST . '</strong></p>';
  echo '<p>Base de datos: <strong>' . DB_NOMBRE . '</strong></p>';
  echo '<p>Error: ' . htmlspecialchars($e->getMessage()) . '</p>';
  echo '</div>';
  exit;
}

// ========================================
// LISTAR TODAS LAS BASES DE DATOS
// ========================================
echo '<div class="box">';
echo '<h2>🗄️ Bases de Datos Disponibles</h2>';
try {
  $stmt = $pdo->query("SHOW DATABASES");
  $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
  echo '<p>Encontradas ' . count($dbs) . ' bases de datos:</p>';
  echo '<ul>';
  foreach ($dbs as $db) {
    if (!in_array($db, ['information_schema', 'mysql', 'performance_schema', 'sys'])) {
      echo '<li><strong>' . htmlspecialchars($db) . '</strong></li>';
    }
  }
  echo '</ul>';
} catch (PDOException $e) {
  echo '<p class="error">Error: ' . $e->getMessage() . '</p>';
}
echo '</div>';

// ========================================
// LISTAR TODAS LAS TABLAS
// ========================================
echo '<div class="box">';
echo '<h2>📋 Tablas en la Base de Datos</h2>';
try {
  $stmt = $pdo->query("SHOW TABLES");
  $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
  
  if (empty($tables)) {
    echo '<p class="warning">⚠️ No hay tablas en esta base de datos</p>';
  } else {
    echo '<p>Encontradas <strong>' . count($tables) . '</strong> tablas:</p>';
    echo '<ul>';
    foreach ($tables as $table) {
      echo '<li><span class="code">' . htmlspecialchars($table) . '</span></li>';
    }
    echo '</ul>';
  }
} catch (PDOException $e) {
  echo '<p class="error">Error: ' . $e->getMessage() . '</p>';
}
echo '</div>';

// ========================================
// ANALIZAR CADA TABLA
// ========================================
if (!empty($tables)) {
  foreach ($tables as $table) {
    echo '<div class="box">';
    echo '<h2>📊 Tabla: <span class="code">' . htmlspecialchars($table) . '</span></h2>';
    
    try {
      // Estructura de la tabla
      $stmt = $pdo->query("DESCRIBE `$table`");
      $columns = $stmt->fetchAll();
      
      echo '<h3>Estructura:</h3>';
      echo '<table>';
      echo '<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Key</th><th>Default</th><th>Extra</th></tr>';
      foreach ($columns as $col) {
        echo '<tr>';
        echo '<td><strong>' . htmlspecialchars($col['Field']) . '</strong></td>';
        echo '<td>' . htmlspecialchars($col['Type']) . '</td>';
        echo '<td>' . htmlspecialchars($col['Null']) . '</td>';
        echo '<td>' . htmlspecialchars($col['Key']) . '</td>';
        echo '<td>' . htmlspecialchars($col['Default'] ?? 'NULL') . '</td>';
        echo '<td>' . htmlspecialchars($col['Extra']) . '</td>';
        echo '</tr>';
      }
      echo '</table>';
      
      // Contar registros
      $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
      $count = $stmt->fetchColumn();
      echo '<p>Registros: <strong>' . $count . '</strong></p>';
      
      // Mostrar primeros 3 registros si hay
      if ($count > 0) {
        $stmt = $pdo->query("SELECT * FROM `$table` LIMIT 3");
        $rows = $stmt->fetchAll();
        
        echo '<h3>Primeros registros:</h3>';
        echo '<pre>' . json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
      }
      
    } catch (PDOException $e) {
      echo '<p class="error">Error analizando tabla: ' . $e->getMessage() . '</p>';
    }
    
    echo '</div>';
  }
}

?>

    <div class="box">
      <h2>✅ Análisis Completado</h2>
      <p><strong class="warning">⚠️ BORRA ESTE ARCHIVO</strong> por seguridad:</p>
      <pre>investigar_bd.php</pre>
    </div>
  </div>
</body>
</html>

