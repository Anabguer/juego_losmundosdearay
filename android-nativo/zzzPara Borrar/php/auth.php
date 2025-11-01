<?php
/**
 * 🔐 SISTEMA DE AUTENTICACIÓN
 * Los Mundos de Aray
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

// Leer payload
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['action'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Acción no especificada']);
  exit;
}

$action = $data['action'];
$pdo = getDB();

if (!$pdo) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Error de conexión a BD']);
  exit;
}

// ========================================
// REGISTRO
// ========================================
if ($action === 'register') {
  $email = trim($data['email'] ?? '');
  $nombre = trim($data['nombre'] ?? '');
  $nick = trim($data['nick'] ?? '');
  $password = $data['password'] ?? '';
  
  // Validaciones
  if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'error' => 'Email inválido']);
    exit;
  }
  
  if (empty($nombre)) {
    echo json_encode(['ok' => false, 'error' => 'El nombre es obligatorio']);
    exit;
  }
  
  if (empty($nick)) {
    echo json_encode(['ok' => false, 'error' => 'El nick es obligatorio']);
    exit;
  }
  
  if (empty($password) || strlen($password) < 6) {
    echo json_encode(['ok' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
  }
  
  // Crear usuario_aplicacion_key
  $usuarioKey = $email . '_losmundosdearay';
  
  try {
    // Verificar si ya existe
    $stmt = $pdo->prepare("SELECT usuario_aplicacion_key FROM usuarios_aplicaciones WHERE email = ? AND app_codigo = 'losmundosdearay'");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
      echo json_encode(['ok' => false, 'error' => 'Este email ya está registrado']);
      exit;
    }
    
    // Crear usuario
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $pdo->prepare("
      INSERT INTO usuarios_aplicaciones 
      (usuario_aplicacion_key, email, nombre, nick, password_hash, app_codigo, activo, verified_at) 
      VALUES (?, ?, ?, ?, ?, 'losmundosdearay', 1, NOW())
    ");
    $stmt->execute([$usuarioKey, $email, $nombre, $nick, $passwordHash]);
    
    // Crear progreso inicial
    $stmt = $pdo->prepare("
      INSERT INTO losmundosdearay_progreso (usuario_aplicacion_key, nivel_max_global, monedas_total, energia)
      VALUES (?, 1, 0, 100)
    ");
    $stmt->execute([$usuarioKey]);
    
    echo json_encode([
      'ok' => true,
      'mensaje' => '¡Registro exitoso!',
      'usuario' => [
        'key' => $usuarioKey,
        'email' => $email,
        'nombre' => $nombre,
        'nick' => $nick
      ]
    ]);
    
  } catch (PDOException $e) {
    error_log("Error en registro: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al crear usuario']);
  }
  exit;
}

// ========================================
// LOGIN
// ========================================
if ($action === 'login') {
  $email = trim($data['email'] ?? '');
  $password = $data['password'] ?? '';
  
  if (empty($email) || empty($password)) {
    echo json_encode(['ok' => false, 'error' => 'Email y contraseña son obligatorios']);
    exit;
  }
  
  try {
    $stmt = $pdo->prepare("
      SELECT usuario_aplicacion_key, email, nombre, nick, password_hash, activo
      FROM usuarios_aplicaciones
      WHERE email = ? AND app_codigo = 'losmundosdearay'
    ");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
      echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado']);
      exit;
    }
    
    if (!$usuario['activo']) {
      echo json_encode(['ok' => false, 'error' => 'Usuario inactivo']);
      exit;
    }
    
    // Verificar contraseña
    if (!password_verify($password, $usuario['password_hash'])) {
      echo json_encode(['ok' => false, 'error' => 'Contraseña incorrecta']);
      exit;
    }
    
    // Actualizar último acceso
    $stmt = $pdo->prepare("UPDATE usuarios_aplicaciones SET ultimo_acceso = NOW() WHERE usuario_aplicacion_key = ?");
    $stmt->execute([$usuario['usuario_aplicacion_key']]);
    
    // Obtener progreso
    $stmt = $pdo->prepare("SELECT * FROM losmundosdearay_progreso WHERE usuario_aplicacion_key = ?");
    $stmt->execute([$usuario['usuario_aplicacion_key']]);
    $progreso = $stmt->fetch();
    
    if (!$progreso) {
      // Crear progreso si no existe
      $stmt = $pdo->prepare("
        INSERT INTO losmundosdearay_progreso (usuario_aplicacion_key, nivel_max_global, monedas_total, energia)
        VALUES (?, 1, 0, 100)
      ");
      $stmt->execute([$usuario['usuario_aplicacion_key']]);
      
      $progreso = [
        'nivel_max_global' => 1,
        'monedas_total' => 0,
        'energia' => 100
      ];
    }
    
    echo json_encode([
      'ok' => true,
      'mensaje' => '¡Bienvenido/a!',
      'usuario' => [
        'key' => $usuario['usuario_aplicacion_key'],
        'email' => $usuario['email'],
        'nombre' => $usuario['nombre'],
        'nick' => $usuario['nick'],
        'progreso' => $progreso
      ]
    ]);
    
  } catch (PDOException $e) {
    error_log("Error en login: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al iniciar sesión']);
  }
  exit;
}

// ========================================
// VERIFICAR SESIÓN
// ========================================
if ($action === 'verify') {
  $usuarioKey = $data['usuario_key'] ?? '';
  
  if (empty($usuarioKey)) {
    echo json_encode(['ok' => false, 'error' => 'Usuario no especificado']);
    exit;
  }
  
  try {
    $stmt = $pdo->prepare("
      SELECT ua.usuario_aplicacion_key, ua.email, ua.nombre, ua.nick,
             p.nivel_max_global, p.monedas_total, p.energia
      FROM usuarios_aplicaciones ua
      LEFT JOIN losmundosdearay_progreso p ON ua.usuario_aplicacion_key = p.usuario_aplicacion_key
      WHERE ua.usuario_aplicacion_key = ? AND ua.app_codigo = 'losmundosdearay' AND ua.activo = 1
    ");
    $stmt->execute([$usuarioKey]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
      echo json_encode(['ok' => false, 'error' => 'Sesión inválida']);
      exit;
    }
    
    echo json_encode([
      'ok' => true,
      'usuario' => [
        'key' => $usuario['usuario_aplicacion_key'],
        'email' => $usuario['email'],
        'nombre' => $usuario['nombre'],
        'nick' => $usuario['nick'],
        'nivel_max' => $usuario['nivel_max_global'] ?? 1,
        'monedas' => $usuario['monedas_total'] ?? 0,
        'energia' => $usuario['energia'] ?? 100
      ]
    ]);
    
  } catch (PDOException $e) {
    error_log("Error en verify: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error al verificar sesión']);
  }
  exit;
}

// Acción no reconocida
http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Acción no reconocida']);

