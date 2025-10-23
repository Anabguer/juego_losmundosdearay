<?php
/**
 * 🏆 SISTEMA DE RANKING Y SCORES
 * Los Mundos de Aray
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$pdo = getDB();

if (!$pdo) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Error de conexión']);
  exit;
}

// Leer action desde GET o POST
$action = $_GET['action'] ?? $_POST['action'] ?? 'ranking_global';

// ========================================
// GUARDAR SCORE
// ========================================
if ($action === 'save_score') {
  $input = file_get_contents('php://input');
  $data = json_decode($input, true);
  
  $usuarioKey = $data['usuario_key'] ?? '';
  $juegoSlug = $data['juego'] ?? '';
  $puntuacion = intval($data['puntuacion'] ?? 0);
  $nivel = intval($data['nivel'] ?? 1);
  $tiempo = intval($data['tiempo'] ?? 0);
  $monedas = intval($data['monedas'] ?? 0);
  $metadata = $data['metadata'] ?? null;
  
  if (empty($usuarioKey) || empty($juegoSlug)) {
    echo json_encode(['ok' => false, 'error' => 'Datos incompletos']);
    exit;
  }
  
  try {
    // Guardar score
    $stmt = $pdo->prepare("
      INSERT INTO losmundosdearay_scores 
      (usuario_aplicacion_key, juego_slug, puntuacion, nivel_alcanzado, tiempo_segundos, monedas_ganadas, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$usuarioKey, $juegoSlug, $puntuacion, $nivel, $tiempo, $monedas, json_encode($metadata)]);
    
    // Actualizar progreso
    $stmt = $pdo->prepare("
      UPDATE losmundosdearay_progreso
      SET monedas_total = monedas_total + ?,
          nivel_max_global = GREATEST(nivel_max_global, ?),
          actualizado_at = NOW()
      WHERE usuario_aplicacion_key = ?
    ");
    $stmt->execute([$monedas, $nivel, $usuarioKey]);
    
    // Actualizar cache de ranking
    actualizarRankingCache($pdo, $usuarioKey);
    
    echo json_encode([
      'ok' => true,
      'mensaje' => 'Score guardado',
      'score_id' => $pdo->lastInsertId()
    ]);
    
  } catch (PDOException $e) {
    error_log("Error guardando score: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al guardar']);
  }
  exit;
}

// ========================================
// RANKING GLOBAL
// ========================================
if ($action === 'ranking_global') {
  try {
    $stmt = $pdo->query("
      SELECT 
        rc.nick,
        rc.nombre,
        rc.puntos_totales,
        rc.monedas_totales,
        rc.nivel_max,
        rc.juegos_completados,
        rc.ultima_actividad
      FROM losmundosdearay_ranking_cache rc
      ORDER BY rc.puntos_totales DESC, rc.monedas_totales DESC
      LIMIT 100
    ");
    
    $ranking = $stmt->fetchAll();
    
    echo json_encode([
      'ok' => true,
      'ranking' => $ranking
    ]);
    
  } catch (PDOException $e) {
    error_log("Error obteniendo ranking: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al obtener ranking']);
  }
  exit;
}

// ========================================
// RANKING POR JUEGO
// ========================================
if ($action === 'ranking_juego') {
  $juegoSlug = $_GET['juego'] ?? '';
  
  if (empty($juegoSlug)) {
    echo json_encode(['ok' => false, 'error' => 'Juego no especificado']);
    exit;
  }
  
  try {
    $stmt = $pdo->prepare("
      SELECT 
        ua.nick,
        ua.nombre,
        s.puntuacion,
        s.nivel_alcanzado,
        s.tiempo_segundos,
        s.monedas_ganadas,
        s.fecha
      FROM losmundosdearay_scores s
      JOIN usuarios_aplicaciones ua ON s.usuario_aplicacion_key = ua.usuario_aplicacion_key
      WHERE s.juego_slug = ?
      ORDER BY s.puntuacion DESC, s.tiempo_segundos ASC
      LIMIT 50
    ");
    $stmt->execute([$juegoSlug]);
    
    $ranking = $stmt->fetchAll();
    
    echo json_encode([
      'ok' => true,
      'juego' => $juegoSlug,
      'ranking' => $ranking
    ]);
    
  } catch (PDOException $e) {
    error_log("Error obteniendo ranking por juego: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al obtener ranking']);
  }
  exit;
}

// ========================================
// MIS SCORES
// ========================================
if ($action === 'mis_scores') {
  $usuarioKey = $_GET['usuario_key'] ?? '';
  
  if (empty($usuarioKey)) {
    echo json_encode(['ok' => false, 'error' => 'Usuario no especificado']);
    exit;
  }
  
  try {
    $stmt = $pdo->prepare("
      SELECT 
        juego_slug,
        MAX(puntuacion) as mejor_puntuacion,
        MAX(nivel_alcanzado) as mejor_nivel,
        MIN(tiempo_segundos) as mejor_tiempo,
        SUM(monedas_ganadas) as total_monedas,
        COUNT(*) as veces_jugado,
        MAX(fecha) as ultima_vez
      FROM losmundosdearay_scores
      WHERE usuario_aplicacion_key = ?
      GROUP BY juego_slug
      ORDER BY ultima_vez DESC
    ");
    $stmt->execute([$usuarioKey]);
    
    $scores = $stmt->fetchAll();
    
    echo json_encode([
      'ok' => true,
      'scores' => $scores
    ]);
    
  } catch (PDOException $e) {
    error_log("Error obteniendo mis scores: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al obtener scores']);
  }
  exit;
}

// Action no reconocida
http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Acción no reconocida']);

// ========================================
// FUNCIÓN: ACTUALIZAR CACHE DE RANKING
// ========================================
function actualizarRankingCache($pdo, $usuarioKey) {
  try {
    // Obtener datos del usuario
    $stmt = $pdo->prepare("
      SELECT ua.email, ua.nombre, ua.nick,
             p.nivel_max_global, p.monedas_total
      FROM usuarios_aplicaciones ua
      LEFT JOIN losmundosdearay_progreso p ON ua.usuario_aplicacion_key = p.usuario_aplicacion_key
      WHERE ua.usuario_aplicacion_key = ?
    ");
    $stmt->execute([$usuarioKey]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) return;
    
    // Calcular estadísticas
    $stmt = $pdo->prepare("
      SELECT 
        SUM(puntuacion) as puntos_totales,
        SUM(monedas_ganadas) as monedas_totales,
        COUNT(DISTINCT juego_slug) as juegos_completados,
        SUM(tiempo_segundos) as tiempo_total
      FROM losmundosdearay_scores
      WHERE usuario_aplicacion_key = ?
    ");
    $stmt->execute([$usuarioKey]);
    $stats = $stmt->fetch();
    
    // Insertar o actualizar cache
    $stmt = $pdo->prepare("
      INSERT INTO losmundosdearay_ranking_cache 
      (usuario_aplicacion_key, email, nick, nombre, puntos_totales, monedas_totales, nivel_max, juegos_completados, mejor_tiempo_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        puntos_totales = VALUES(puntos_totales),
        monedas_totales = VALUES(monedas_totales),
        nivel_max = VALUES(nivel_max),
        juegos_completados = VALUES(juegos_completados),
        mejor_tiempo_total = VALUES(mejor_tiempo_total),
        ultima_actividad = NOW()
    ");
    
    $stmt->execute([
      $usuarioKey,
      $usuario['email'],
      $usuario['nick'],
      $usuario['nombre'],
      $stats['puntos_totales'] ?? 0,
      $stats['monedas_totales'] ?? 0,
      $usuario['nivel_max_global'] ?? 1,
      $stats['juegos_completados'] ?? 0,
      $stats['tiempo_total'] ?? 0
    ]);
    
  } catch (PDOException $e) {
    error_log("Error actualizando cache de ranking: " . $e->getMessage());
  }
}
