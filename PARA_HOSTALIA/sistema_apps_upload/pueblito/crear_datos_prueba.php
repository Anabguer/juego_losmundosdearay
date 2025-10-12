<?php
/**
 * 📊 CREAR DATOS DE PRUEBA
 * Añade usuarios y scores ficticios para probar el ranking
 */

header('Content-Type: text/html; charset=UTF-8');
require_once 'php/config.php';

?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>📊 Datos de Prueba</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #f0f0f0; }
    .box { background: white; padding: 20px; border-radius: 10px; max-width: 800px; margin: 0 auto; }
    h1 { color: #667eea; }
    .success { color: #10b981; font-weight: bold; }
    .error { color: #ef4444; font-weight: bold; }
  </style>
</head>
<body>
  <div class="box">
    <h1>📊 Crear Datos de Prueba</h1>

<?php

try {
  $pdo = getDB();
  
  if (!$pdo) {
    throw new Exception("No se pudo conectar a BD");
  }
  
  echo '<p class="success">✅ Conectado a BD</p>';
  
  // Usuarios de prueba
  $usuarios = [
    ['email' => 'jugador1@test.com', 'nombre' => 'María García', 'nick' => 'maria_gamer'],
    ['email' => 'jugador2@test.com', 'nombre' => 'Pedro López', 'nick' => 'pedrito'],
    ['email' => 'jugador3@test.com', 'nombre' => 'Ana Martínez', 'nick' => 'ana_pro'],
    ['email' => 'jugador4@test.com', 'nombre' => 'Carlos Ruiz', 'nick' => 'carlitos'],
    ['email' => 'jugador5@test.com', 'nombre' => 'Laura Sánchez', 'nick' => 'laura_gamer']
  ];
  
  $passwordHash = password_hash('123456', PASSWORD_BCRYPT);
  
  echo '<h2>Creando usuarios...</h2>';
  
  foreach ($usuarios as $user) {
    $key = $user['email'] . '_losmundosdearay';
    
    try {
      // Crear usuario
      $stmt = $pdo->prepare("
        INSERT INTO usuarios_aplicaciones 
        (usuario_aplicacion_key, email, nombre, nick, password_hash, app_codigo, activo, verified_at)
        VALUES (?, ?, ?, ?, ?, 'losmundosdearay', 1, NOW())
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
      ");
      $stmt->execute([$key, $user['email'], $user['nombre'], $user['nick'], $passwordHash]);
      
      // Crear progreso
      $stmt = $pdo->prepare("
        INSERT INTO losmundosdearay_progreso (usuario_aplicacion_key, nivel_max_global, monedas_total, energia)
        VALUES (?, ?, ?, 100)
        ON DUPLICATE KEY UPDATE nivel_max_global = VALUES(nivel_max_global), monedas_total = VALUES(monedas_total)
      ");
      $nivel = rand(5, 25);
      $monedas = rand(100, 5000);
      $stmt->execute([$key, $nivel, $monedas]);
      
      // Crear scores aleatorios para varios juegos
      $juegos = ['edificio', 'pabellon', 'rio', 'cole', 'tienda', 'parque'];
      foreach ($juegos as $idx => $juego) {
        if (rand(0, 1)) { // 50% de probabilidad
          $stmt = $pdo->prepare("
            INSERT INTO losmundosdearay_scores 
            (usuario_aplicacion_key, juego_slug, puntuacion, nivel_alcanzado, tiempo_segundos, monedas_ganadas)
            VALUES (?, ?, ?, ?, ?, ?)
          ");
          $puntos = rand(100, 10000);
          $nivel = rand(1, 20);
          $tiempo = rand(30, 300);
          $monedas = rand(10, 200);
          $stmt->execute([$key, $juego, $puntos, $nivel, $tiempo, $monedas]);
        }
      }
      
      // Actualizar cache de ranking
      $stmt = $pdo->prepare("
        SELECT 
          SUM(puntuacion) as puntos_totales,
          SUM(monedas_ganadas) as monedas_totales,
          COUNT(DISTINCT juego_slug) as juegos_completados,
          MAX(nivel_alcanzado) as nivel_max
        FROM losmundosdearay_scores
        WHERE usuario_aplicacion_key = ?
      ");
      $stmt->execute([$key]);
      $stats = $stmt->fetch();
      
      $stmt = $pdo->prepare("
        INSERT INTO losmundosdearay_ranking_cache 
        (usuario_aplicacion_key, email, nick, nombre, puntos_totales, monedas_totales, nivel_max, juegos_completados)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          puntos_totales = VALUES(puntos_totales),
          monedas_totales = VALUES(monedas_totales),
          nivel_max = VALUES(nivel_max),
          juegos_completados = VALUES(juegos_completados)
      ");
      $stmt->execute([
        $key,
        $user['email'],
        $user['nick'],
        $user['nombre'],
        $stats['puntos_totales'] ?? 0,
        $stats['monedas_totales'] ?? 0,
        $stats['nivel_max'] ?? 1,
        $stats['juegos_completados'] ?? 0
      ]);
      
      echo '<p class="success">✅ ' . $user['nombre'] . ' (' . $user['nick'] . ') - ' . ($stats['puntos_totales'] ?? 0) . ' puntos</p>';
      
    } catch (PDOException $e) {
      echo '<p class="error">❌ Error con ' . $user['nombre'] . ': ' . $e->getMessage() . '</p>';
    }
  }
  
  // Mostrar ranking final
  echo '<h2>🏆 Ranking Actual:</h2>';
  $stmt = $pdo->query("
    SELECT nick, nombre, puntos_totales, monedas_totales, nivel_max, juegos_completados
    FROM losmundosdearay_ranking_cache
    ORDER BY puntos_totales DESC
    LIMIT 20
  ");
  $ranking = $stmt->fetchAll();
  
  echo '<table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">';
  echo '<tr><th>Pos</th><th>Nick</th><th>Nombre</th><th>Puntos</th><th>Monedas</th><th>Nivel</th><th>Juegos</th></tr>';
  foreach ($ranking as $i => $row) {
    $medal = $i === 0 ? '🥇' : ($i === 1 ? '🥈' : ($i === 2 ? '🥉' : ($i + 1)));
    echo '<tr>';
    echo '<td>' . $medal . '</td>';
    echo '<td><strong>' . htmlspecialchars($row['nick']) . '</strong></td>';
    echo '<td>' . htmlspecialchars($row['nombre']) . '</td>';
    echo '<td><strong>' . number_format($row['puntos_totales']) . '</strong></td>';
    echo '<td>' . $row['monedas_totales'] . ' 🍬</td>';
    echo '<td>Nivel ' . $row['nivel_max'] . '</td>';
    echo '<td>' . $row['juegos_completados'] . '</td>';
    echo '</tr>';
  }
  echo '</table>';
  
  echo '<p style="margin-top:2rem;"><a href="/sistema_apps_upload/pueblito/" style="padding:10px 20px; background:#667eea; color:white; text-decoration:none; border-radius:8px;">🎮 Ir al Juego</a></p>';
  echo '<p style="color:#f59e0b; margin-top:1rem;">⚠️ Contraseña de todos los usuarios de prueba: <strong>123456</strong></p>';
  echo '<p style="color:#888; margin-top:1rem;">🗑️ BORRA ESTE ARCHIVO después de usarlo</p>';
  
} catch (Exception $e) {
  echo '<p class="error">❌ Error: ' . $e->getMessage() . '</p>';
}

?>

  </div>
</body>
</html>

