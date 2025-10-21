/* ========================================
   💾 STORAGE - Gestión de localStorage
   ======================================== */

// Claves de localStorage
const KEYS = {
  COINS: 'aray_fresitas',
  ENERGY: 'aray_energy',
  BEST_COLE: 'aray_best_cole',
  BEST_PARQUE: 'aray_best_parque',
  BEST_PABELLON: 'aray_best_pabellon'
};

// ========== FRESITAS (MONEDA) ==========
export const getCoins = () => parseInt(localStorage.getItem(KEYS.COINS) || '0', 10);

export const setCoins = (n) => {
  localStorage.setItem(KEYS.COINS, String(Math.max(0, n)));
};

export const addCoins = (n = 1) => {
  setCoins(getCoins() + n);
  
  // Disparar evento personalizado para animación
  window.dispatchEvent(new CustomEvent('candyEarned', { detail: { amount: n } }));
};

// Alias para compatibilidad
export const getCandies = getCoins;
export const setCandies = setCoins;
export const addCandies = addCoins;

// ========== ENERGÍA ==========
export const getEnergy = () => parseInt(localStorage.getItem(KEYS.ENERGY) || '100', 10);

export const setEnergy = (v) => {
  localStorage.setItem(KEYS.ENERGY, String(Math.max(0, Math.min(100, v))));
};

export const addEnergy = (n) => {
  setEnergy(getEnergy() + n);
};

// ========== RÉCORDS ==========
export const getBest = (key) => {
  return parseInt(localStorage.getItem(key) || '0', 10);
};

export const setBest = (key, val) => {
  const current = getBest(key);
  if (val > current) {
    localStorage.setItem(key, String(val));
    return true; // Nuevo récord
  }
  return false;
};

// Shortcuts para cada juego
export const getBestCole = () => getBest(KEYS.BEST_COLE);
export const setBestCole = (val) => setBest(KEYS.BEST_COLE, val);

export const getBestParque = () => getBest(KEYS.BEST_PARQUE);
export const setBestParque = (val) => setBest(KEYS.BEST_PARQUE, val);

export const getBestPabellon = () => getBest(KEYS.BEST_PABELLON);
export const setBestPabellon = (val) => setBest(KEYS.BEST_PABELLON, val);

// ========== GUARDAR EN SERVIDOR (OPCIONAL) ==========
export const saveScoreToServer = async (game, score, meta = {}) => {
  try {
    const response = await fetch('php/save_score.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, score, meta })
    });
    const data = await response.json();
    return data.ok;
  } catch (err) {
    console.warn('No se pudo guardar en servidor:', err);
    return false;
  }
};

// ========== RESET (para debug) ==========
export const resetAll = () => {
  if (confirm('¿Resetear todos los datos?')) {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};

