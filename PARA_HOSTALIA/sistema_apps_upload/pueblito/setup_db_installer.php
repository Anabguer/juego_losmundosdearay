<?php
/**
 * Instalador de Base de Datos - Los Mundos de Aray
 * Ejecutar UNA VEZ y luego BORRAR este archivo
 */

// Configuración
define('DB_HOST', 'PMYSQL165.dns-servicio.com');
define('DB_USUARIO', 'sistema_apps_user');
define('DB_CONTRA', 'GestionUploadSistemaApps!');
define('DB_NOMBRE', '9606966_sistema_apps_db');
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', 3306);

header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>🔧 Instalador BD - Los Mundos de Aray</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
    .box { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .success { color: #28a745; }
    .error { color: #dc3545; }
    .warning { color: #ffc107; }
    h1 { color: #333; }
    pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
    .btn:hover { background: #0056b3; }
  </style>
</head>
<body>
  <h1>🔧 Instalador de Base de Datos</h1>
  <div class="box">';

try {
  // Conectar a la base de datos
  echo '<h2>📡 Conectando a la base de datos...</h2>';
  $dsn = sprintf("mysql:host=%s;port=%d;dbname=%s;charset=%s", DB_HOST, DB_PORT, DB_NOMBRE, DB_CHARSET);
  $pdo = new PDO($dsn, DB_USUARIO, DB_CONTRA, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);
  echo '<p class="success">✅ Conexión exitosa a: ' . DB_NOMBRE . '</p>';
  
  // SQL para crear tablas
  $sql = "
    -- Tabla de aplicaciones
    CREATE TABLE IF NOT EXISTS tbl_aplicaciones (
      id_aplicacion INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      descripcion TEXT,
      url VARCHAR(255),
      icono VARCHAR(255),
      activo TINYINT(1) DEFAULT 1,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    -- Tabla de juegos
    CREATE TABLE IF NOT EXISTS tbl_juegos (
      id_juego INT AUTO_INCREMENT PRIMARY KEY,
      id_aplicacion INT NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      slug VARCHAR(50) NOT NULL UNIQUE,
      descripcion TEXT,
      icono VARCHAR(255),
      activo TINYINT(1) DEFAULT 1,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_aplicacion) REFERENCES tbl_aplicaciones(id_aplicacion) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    -- Tabla de scores
    CREATE TABLE IF NOT EXISTS tbl_scores (
      id_score INT AUTO_INCREMENT PRIMARY KEY,
      id_juego INT NOT NULL,
      jugador VARCHAR(100) DEFAULT 'Aray',
      puntuacion INT NOT NULL,
      nivel_alcanzado INT DEFAULT 1,
      tiempo_jugado INT DEFAULT 0,
      metadata JSON,
      fecha_score TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_juego) REFERENCES tbl_juegos(id_juego) ON DELETE CASCADE,
      INDEX idx_juego_puntuacion (id_juego, puntuacion DESC),
      INDEX idx_fecha (fecha_score DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  ";
  
  echo '<h2>🗄️ Creando tablas...</h2>';
  $pdo->exec($sql);
  echo '<p class="success">✅ Tablas creadas correctamente</p>';
  
  // Insertar aplicación principal
  echo '<h2>📝 Insertando aplicación...</h2>';
  $stmt = $pdo->prepare("
    INSERT INTO tbl_aplicaciones (nombre, descripcion, url, icono, activo) 
    VALUES (?, ?, ?, ?, 1) 
    ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), url = VALUES(url), icono = VALUES(icono)
  ");
  $stmt->execute([
    'Los Mundos de Aray',
    'Juego de aventuras con múltiples minijuegos: plataformas, puzzles, arcade y más',
    '/sistema_apps_upload/pueblito/',
    '/sistema_apps_upload/pueblito/assets/img/logo.png'
  ]);
  echo '<p class="success">✅ Aplicación registrada</p>';
  
  // Obtener ID de la aplicación
  $idApp = $pdo->query("SELECT id_aplicacion FROM tbl_aplicaciones WHERE nombre = 'Los Mundos de Aray'")->fetchColumn();
  
  // Insertar juegos
  echo '<h2>🎮 Insertando minijuegos...</h2>';
  $juegos = [
    ['Edificio - Parkour Ninja', 'edificio', 'Sube saltando de plataforma en plataforma evitando demonios', '/sistema_apps_upload/pueblito/assets/img/juegos/edificio.png'],
    ['Pabellón - Space Invaders', 'pabellon', 'Dispara a los demonios con el tirachinas antes de que te alcancen', '/sistema_apps_upload/pueblito/assets/img/juegos/pabellon.png'],
    ['Río - Salta Troncos', 'rio', 'Cruza el río saltando sobre troncos flotantes', '/sistema_apps_upload/pueblito/assets/img/juegos/rio.png'],
    ['Cole - Amigos VS Demonios', 'cole', 'Match 3: Une amigos para ganar contra los demonios', '/sistema_apps_upload/pueblito/assets/img/juegos/colegio.png'],
    ['Parque - Snake', 'parque', 'Juego clásico de la serpiente recogiendo golosinas', '/sistema_apps_upload/pueblito/assets/img/juegos/parque.png'],
    ['Skate Park', 'skate', 'Skate por el parque evitando obstáculos', '/sistema_apps_upload/pueblito/assets/img/juegos/skate.png'],
    ['Tienda - Match 3', 'tienda', 'Match 3: Une golosinas para conseguir puntos', '/sistema_apps_upload/pueblito/assets/img/juegos/tienda.png'],
    ['Informática - Conecta Cables', 'informatica', 'Conecta los cables correctamente en el menor tiempo', '/sistema_apps_upload/pueblito/assets/img/juegos/informatica.png'],
    ['Casa Yayos - Caza Ratas', 'yayos', 'Whack-a-mole: Golpea las ratas que salen', '/sistema_apps_upload/pueblito/assets/img/juegos/casayayos.png']
  ];
  
  $stmt = $pdo->prepare("
    INSERT INTO tbl_juegos (id_aplicacion, nombre, slug, descripcion, icono, activo) 
    VALUES (?, ?, ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), icono = VALUES(icono)
  ");
  
  foreach ($juegos as $juego) {
    $stmt->execute([$idApp, $juego[0], $juego[1], $juego[2], $juego[3]]);
    echo '<p class="success">✅ ' . htmlspecialchars($juego[0]) . '</p>';
  }
  
  // Verificar
  echo '<h2>🔍 Verificando instalación...</h2>';
  $totalJuegos = $pdo->query("SELECT COUNT(*) FROM tbl_juegos WHERE id_aplicacion = $idApp")->fetchColumn();
  echo '<p class="success">✅ Total de minijuegos registrados: ' . $totalJuegos . '</p>';
  
  // Mostrar juegos
  $stmt = $pdo->query("SELECT nombre, slug FROM tbl_juegos WHERE id_aplicacion = $idApp ORDER BY nombre");
  $juegosLista = $stmt->fetchAll();
  echo '<h3>🎯 Minijuegos disponibles:</h3><ul>';
  foreach ($juegosLista as $j) {
    echo '<li><strong>' . htmlspecialchars($j['nombre']) . '</strong> (slug: ' . htmlspecialchars($j['slug']) . ')</li>';
  }
  echo '</ul>';
  
  echo '</div>';
  echo '<div class="box">
    <h2 class="success">🎉 ¡Instalación completada!</h2>
    <p>La base de datos está lista para usar.</p>
    <p><strong class="warning">⚠️ IMPORTANTE:</strong> Por seguridad, <strong>BORRA ESTE ARCHIVO</strong> ahora:</p>
    <pre>setup_db_installer.php</pre>
    <p><a href="/sistema_apps_upload/pueblito/" class="btn">🎮 Ir al Juego</a></p>
    <p><a href="/sistema_apps_upload/pueblito/php/ranking.php" class="btn">🏆 Ver API Ranking</a></p>
  </div>';
  
} catch (PDOException $e) {
  echo '</div><div class="box">
    <h2 class="error">❌ Error de Conexión</h2>
    <p>No se pudo conectar a la base de datos.</p>
    <pre>' . htmlspecialchars($e->getMessage()) . '</pre>
    <p><strong>Verifica:</strong></p>
    <ul>
      <li>Host: ' . DB_HOST . '</li>
      <li>Usuario: ' . DB_USUARIO . '</li>
      <li>Base de datos: ' . DB_NOMBRE . '</li>
    </ul>
  </div>';
} catch (Exception $e) {
  echo '</div><div class="box">
    <h2 class="error">❌ Error</h2>
    <pre>' . htmlspecialchars($e->getMessage()) . '</pre>
  </div>';
}

echo '</body></html>';

