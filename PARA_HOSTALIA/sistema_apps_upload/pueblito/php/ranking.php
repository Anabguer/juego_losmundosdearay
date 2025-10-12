<?php
/**
 * Obtener Ranking
 * GET: ?juego=edificio&limit=10
 * GET: ?general=1&limit=50
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
  $db = getDB();
  if (!$db) {
    throw new Exception('Error de conexión a BD');
  }
  
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
  $limit = min($limit, 100); // Máximo 100 resultados
  
  // Ranking general (todos los juegos)
  if (isset($_GET['general'])) {
    $stmt = $db->prepare("
      SELECT 
        j.nombre AS juego,
        j.slug,
        j.icono,
        s.jugador,
        s.puntuacion,
        s.nivel_alcanzado AS nivel,
        s.tiempo_jugado AS tiempo,
        DATE_FORMAT(s.fecha_score, '%d/%m/%Y %H:%i') AS fecha
      FROM tbl_scores s
      JOIN tbl_juegos j ON s.id_juego = j.id_juego
      WHERE j.activo = 1
      ORDER BY s.puntuacion DESC
      LIMIT ?
    ");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $ranking = $stmt->fetchAll();
    
    echo json_encode([
      'ok' => true,
      'tipo' => 'general',
      'total' => count($ranking),
      'ranking' => $ranking
    ]);
    
  // Ranking por juego específico
  } else if (isset($_GET['juego'])) {
    $stmt = $db->prepare("
      SELECT 
        s.jugador,
        s.puntuacion,
        s.nivel_alcanzado AS nivel,
        s.tiempo_jugado AS tiempo,
        DATE_FORMAT(s.fecha_score, '%d/%m/%Y %H:%i') AS fecha
      FROM tbl_scores s
      JOIN tbl_juegos j ON s.id_juego = j.id_juego
      WHERE j.slug = ? AND j.activo = 1
      ORDER BY s.puntuacion DESC
      LIMIT ?
    ");
    $stmt->execute([$_GET['juego'], $limit]);
    
    $ranking = $stmt->fetchAll();
    
    echo json_encode([
      'ok' => true,
      'tipo' => 'juego',
      'juego' => $_GET['juego'],
      'total' => count($ranking),
      'ranking' => $ranking
    ]);
    
  // Listado de juegos disponibles
  } else {
    $stmt = $db->query("
      SELECT 
        j.nombre,
        j.slug,
        j.descripcion,
        j.icono,
        COUNT(s.id_score) AS total_scores,
        MAX(s.puntuacion) AS mejor_score
      FROM tbl_juegos j
      LEFT JOIN tbl_scores s ON j.id_juego = s.id_juego
      WHERE j.activo = 1
      GROUP BY j.id_juego
      ORDER BY j.nombre
    ");
    
    $juegos = $stmt->fetchAll();
    
    echo json_encode([
      'ok' => true,
      'tipo' => 'juegos',
      'total' => count($juegos),
      'juegos' => $juegos
    ]);
  }
  
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode([
    'ok' => false,
    'error' => $e->getMessage()
  ]);
}

