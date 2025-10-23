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

// Alias para compatibilidad - REDIRIGIR AL BRIDGE
export const getCandies = () => {
  // Si estamos en Android (GameBridge disponible), usar el bridge
  if (window.GameBridge && window.GameBridge.getCandiesAsync) {
    window.GameBridge.getCandiesAsync();
    return 0; // Valor temporal hasta que llegue la respuesta
  }
  // Fallback web (si se ejecuta en navegador)
  return getCoins();
};

export const setCandies = setCoins;

export const addCandies = (n = 1) => {
  // Si estamos en Android (GameBridge disponible), usar el bridge
  if (window.GameBridge && window.GameBridge.addCandies) {
    window.GameBridge.addCandies(n);
  } else {
    // Fallback web (si se ejecuta en navegador)
    addCoins(n);
  }
};

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

// ========== CALLBACK PARA RECIBIR CARAMELOS DESDE BRIDGE ==========
window.onCandies = (n) => {
  // Actualizar HUD con el valor real desde Firestore
  const coinsEl = document.getElementById('hud-coins');
  if (coinsEl) {
    coinsEl.textContent = formatNumber(n);
  }
  
  // También actualizar otros elementos que muestren caramelos
  const candiesEl = document.getElementById('hud-candies');
  if (candiesEl) {
    candiesEl.textContent = n;
  }
  
  // Disparar evento para animaciones
  window.dispatchEvent(new CustomEvent('candyEarned', { detail: { amount: n } }));
};

// Función auxiliar para formatear números
const formatNumber = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

// ========== RESET (para debug) ==========
export const resetAll = () => {
  if (confirm('¿Resetear todos los datos?')) {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};

