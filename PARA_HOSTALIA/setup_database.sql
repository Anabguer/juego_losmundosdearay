-- ========================================
-- SETUP BASE DE DATOS - LOS MUNDOS DE ARAY
-- Base de datos: 9606966_sistema_apps_db
-- ========================================

USE 9606966_sistema_apps_db;

-- ========================================
-- 1. TABLA DE APLICACIONES
-- ========================================
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

-- ========================================
-- 2. TABLA DE JUEGOS (minijuegos dentro de Pueblito)
-- ========================================
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

-- ========================================
-- 3. TABLA DE SCORES/RANKING
-- ========================================
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

-- ========================================
-- 4. INSERTAR APLICACIÓN PRINCIPAL
-- ========================================
INSERT INTO tbl_aplicaciones (nombre, descripcion, url, icono, activo) 
VALUES (
  'Los Mundos de Aray',
  'Juego de aventuras con múltiples minijuegos: plataformas, puzzles, arcade y más',
  '/pueblito/',
  '/pueblito/assets/img/logo.png',
  1
) ON DUPLICATE KEY UPDATE 
  descripcion = VALUES(descripcion),
  url = VALUES(url),
  icono = VALUES(icono);

-- ========================================
-- 5. INSERTAR MINIJUEGOS
-- ========================================
SET @id_app = (SELECT id_aplicacion FROM tbl_aplicaciones WHERE nombre = 'Los Mundos de Aray');

INSERT INTO tbl_juegos (id_aplicacion, nombre, slug, descripcion, icono, activo) VALUES
  (@id_app, 'Edificio - Parkour Ninja', 'edificio', 'Sube saltando de plataforma en plataforma evitando demonios', '/pueblito/assets/img/juegos/edificio.png', 1),
  (@id_app, 'Pabellón - Space Invaders', 'pabellon', 'Dispara a los demonios con el tirachinas antes de que te alcancen', '/pueblito/assets/img/juegos/pabellon.png', 1),
  (@id_app, 'Río - Salta Troncos', 'rio', 'Cruza el río saltando sobre troncos flotantes', '/pueblito/assets/img/juegos/rio.png', 1),
  (@id_app, 'Cole - Amigos VS Demonios', 'cole', 'Match 3: Une amigos para ganar contra los demonios', '/pueblito/assets/img/juegos/colegio.png', 1),
  (@id_app, 'Parque - Snake', 'parque', 'Juego clásico de la serpiente recogiendo golosinas', '/pueblito/assets/img/juegos/parque.png', 1),
  (@id_app, 'Skate Park', 'skate', 'Skate por el parque evitando obstáculos', '/pueblito/assets/img/juegos/skate.png', 1),
  (@id_app, 'Tienda - Match 3', 'tienda', 'Match 3: Une golosinas para conseguir puntos', '/pueblito/assets/img/juegos/tienda.png', 1),
  (@id_app, 'Informática - Conecta Cables', 'informatica', 'Conecta los cables correctamente en el menor tiempo', '/pueblito/assets/img/juegos/informatica.png', 1),
  (@id_app, 'Casa Yayos - Caza Ratas', 'yayos', 'Whack-a-mole: Golpea las ratas que salen', '/pueblito/assets/img/juegos/casayayos.png', 1)
ON DUPLICATE KEY UPDATE 
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  icono = VALUES(icono),
  activo = VALUES(activo);

-- ========================================
-- 6. VERIFICACIÓN
-- ========================================
SELECT 
  a.nombre AS aplicacion,
  COUNT(j.id_juego) AS total_juegos
FROM tbl_aplicaciones a
LEFT JOIN tbl_juegos j ON a.id_aplicacion = j.id_aplicacion
WHERE a.nombre = 'Los Mundos de Aray'
GROUP BY a.nombre;

SELECT * FROM tbl_juegos WHERE id_aplicacion = @id_app;

-- ========================================
-- 7. QUERIES ÚTILES
-- ========================================

-- Ver top 10 scores de un juego:
-- SELECT jugador, puntuacion, nivel_alcanzado, fecha_score 
-- FROM tbl_scores 
-- WHERE id_juego = (SELECT id_juego FROM tbl_juegos WHERE slug = 'edificio')
-- ORDER BY puntuacion DESC 
-- LIMIT 10;

-- Ver ranking general (todos los juegos):
-- SELECT j.nombre AS juego, s.jugador, s.puntuacion, s.fecha_score
-- FROM tbl_scores s
-- JOIN tbl_juegos j ON s.id_juego = j.id_juego
-- ORDER BY s.puntuacion DESC
-- LIMIT 50;


