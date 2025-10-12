<?php
/**
 * Configuración de la base de datos
 * Los Mundos de Aray
 */

// Configuración de la base de datos
define('DB_HOST', 'PMYSQL165.dns-servicio.com');
define('DB_USUARIO', 'sistema_apps_user');
define('DB_CONTRA', 'GestionUploadSistemaApps!');
define('DB_NOMBRE', '9606966_sistema_apps_db');
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', 3306);

/**
 * Obtener conexión PDO
 */
function getDB() {
  static $pdo = null;
  
  if ($pdo === null) {
    try {
      $dsn = sprintf(
        "mysql:host=%s;port=%d;dbname=%s;charset=%s",
        DB_HOST,
        DB_PORT,
        DB_NOMBRE,
        DB_CHARSET
      );
      
      $pdo = new PDO($dsn, DB_USUARIO, DB_CONTRA, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
      ]);
    } catch (PDOException $e) {
      error_log("Error de conexión BD: " . $e->getMessage());
      return null;
    }
  }
  
  return $pdo;
}

