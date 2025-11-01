/* ========================================
   🔐 AUTH - Sistema de autenticación
   - Gestión de ranking global
   ======================================== */

const AUTH_STORAGE_KEY = 'aray_usuario';
const API_BASE = 'php/';

// Estado de autenticación
let currentUser = null;

// ========================================
// OBTENER RANKING GLOBAL
// ========================================
export const getRankingGlobal = async () => {
  try {
    const response = await fetch(API_BASE + 'ranking.php?action=ranking_global');
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error obteniendo ranking:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};
