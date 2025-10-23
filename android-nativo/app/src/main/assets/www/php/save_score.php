<?php
/**
 * Save Score - Guarda récords en un archivo JSON
 * NOTA: En Hostalia puede requerir permisos de escritura.
 * Si no funciona, comentar la escritura y usar solo localStorage.
 */

header('Content-Type: application/json; charset=utf-8');

// Leer payload
$payload = json_decode(file_get_contents('php://input'), true);

if (!$payload) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
  exit;
}

// Archivo de scores (intentar diferentes ubicaciones)
$dataDir = __DIR__ . '/../data';
$scoreFile = $dataDir . '/scores.json';

// Crear directorio si no existe
if (!is_dir($dataDir)) {
  @mkdir($dataDir, 0755, true);
}

// Verificar permisos de escritura
if (!is_writable($dataDir)) {
  // Si no hay permisos, devolver OK pero sin guardar
  echo json_encode([
    'ok' => true,
    'warning' => 'No write permissions, score not saved',
    'saved' => false
  ]);
  exit;
}

// Leer scores existentes
$scores = [];
if (file_exists($scoreFile)) {
  $content = file_get_contents($scoreFile);
  $scores = json_decode($content, true) ?: [];
}

// Agregar nuevo score
$scores[] = [
  'when' => date('c'),
  'game' => $payload['game'] ?? 'unknown',
  'score' => intval($payload['score'] ?? 0),
  'meta' => $payload['meta'] ?? []
];

// Limitar a últimos 1000 scores
if (count($scores) > 1000) {
  $scores = array_slice($scores, -1000);
}

// Guardar
$success = file_put_contents(
  $scoreFile,
  json_encode($scores, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode([
  'ok' => true,
  'saved' => $success !== false,
  'total_scores' => count($scores)
]);



