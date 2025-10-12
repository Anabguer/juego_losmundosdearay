<?php
/**
 * Health Check - Verifica que PHP está funcionando
 */

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
  'ok' => true,
  'php' => PHP_VERSION,
  'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
  'timestamp' => date('c')
], JSON_PRETTY_PRINT);



