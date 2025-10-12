-- ========================================
-- 🗑️ BORRAR TABLAS (SI EXISTEN)
-- ========================================
-- Ejecutar este SQL desde phpMyAdmin para limpiar

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tbl_scores;
DROP TABLE IF EXISTS tbl_juegos;
DROP TABLE IF EXISTS tbl_aplicaciones;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- ✅ Tablas borradas correctamente
-- ========================================

