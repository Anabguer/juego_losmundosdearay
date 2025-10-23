<?php
/**
 * Guardar Score en la Base de Datos
 * POST: {juego: 'edificio', puntuacion: 1500, nivel: 5, tiempo: 120}
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

require_once 'config.php';

try {
  // Leer datos POST
  $input = json_decode(file_get_contents('php://input'), true);
  
  if (!$input || !isset($input['juego']) || !isset($input['puntuacion'])) {
    throw new Exception('Datos incompletos');
  }
  
  $db = getDB();
  if (!$db) {
    throw new Exception('Error de conexión a BD');
  }
  
  // Obtener ID del juego
  $stmt = $db->prepare("SELECT id_juego FROM tbl_juegos WHERE slug = ?");
  $stmt->execute([$input['juego']]);
  $juego = $stmt->fetch();
  
  if (!$juego) {
    throw new Exception('Juego no encontrado');
  }
  
  // Insertar score
  $stmt = $db->prepare("
    INSERT INTO tbl_scores (id_juego, jugador, puntuacion, nivel_alcanzado, tiempo_jugado, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  ");
  
  $metadata = json_encode([
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'extra' => $input['metadata'] ?? []
  ]);
  
  $stmt->execute([
    $juego['id_juego'],
    $input['jugador'] ?? 'Aray',
    (int)$input['puntuacion'],
    (int)($input['nivel'] ?? 1),
    (int)($input['tiempo'] ?? 0),
    $metadata
  ]);
  
  echo json_encode([
    'ok' => true,
    'id_score' => $db->lastInsertId(),
    'mensaje' => 'Score guardado correctamente'
  ]);
  
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode([
    'ok' => false,
    'error' => $e->getMessage()
  ]);
}


