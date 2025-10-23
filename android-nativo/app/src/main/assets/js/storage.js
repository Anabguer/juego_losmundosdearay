/* ========================================
   💾 STORAGE - Gestión de localStorage + GameBridge
   Sistema híbrido: local + Android GameBridge
   ======================================== */

// Claves de localStorage
const KEYS = {
  COINS: 'aray_fresitas',
  ENERGY: 'aray_energy',
  BEST_COLE: 'aray_best_cole',
  BEST_PARQUE: 'aray_best_parque',
  BEST_PABELLON: 'aray_best_pabellon',
  BEST_SKATE: 'aray_best_skate'
};

// ========== FRESITAS (MONEDA) ==========
export const getCoins = () => parseInt(localStorage.getItem(KEYS.COINS) || '0', 10);

export const setCoins = (n) => {
  localStorage.setItem(KEYS.COINS, String(Math.max(0, n)));
};

export const addCoins = async (n = 1) => {
  if (window.GameBridge) {
    // Android - usar GameBridge
    window.GameBridge.addCandies(n);
  } else {
    // Web - usar localStorage
    setCoins(getCoins() + n);
  }
  
  // Disparar evento personalizado para animación
  window.dispatchEvent(new CustomEvent('candyEarned', { detail: { amount: n } }));
};

// Alias para compatibilidad
export const getCandies = () => {
  if (window.GameBridge) {
    // Android - obtener del GameBridge
    try {
      const userJson = window.GameBridge.getUser() || '{}';
      console.log('🍬 getCandies() - JSON del GameBridge:', userJson);
      const user = JSON.parse(userJson);
      const candies = user.candiesTotal || 0;
      console.log('🍬 getCandies() - caramelos obtenidos:', candies);
      return candies;
    } catch (error) {
      console.warn('❌ Error obteniendo caramelos del GameBridge:', error);
      return getCoins(); // Fallback a localStorage
    }
  } else {
    // Web - usar localStorage
    return getCoins();
  }
};

export const setCandies = setCoins;

// Sistema simplificado de caramelos
export const addCandies = async (n = 1) => {
  console.log(`🍬 addCandies() llamado con ${n} caramelos...`);
  
  if (window.GameBridge) {
    // Android - usar GameBridge
    try {
      console.log(`🍬 Enviando ${n} caramelos al GameBridge...`);
      window.GameBridge.addCandies(n);
      console.log(`✅ ${n} caramelos enviados al GameBridge`);
      
      // Forzar actualización del HUD después de un breve delay
      setTimeout(() => {
        if (window.updateHUD) {
          console.log('🍬 Forzando actualización del HUD...');
          window.updateHUD();
        }
      }, 500);
      
    } catch (error) {
      console.warn('❌ Error enviando caramelos al GameBridge:', error);
      // Fallback a localStorage
      setCoins(getCoins() + n);
    }
  } else {
    // Web - usar localStorage
    setCoins(getCoins() + n);
    console.log(`✅ ${n} caramelos añadidos localmente`);
  }
  
  // Disparar evento personalizado para animación
  window.dispatchEvent(new CustomEvent('candyEarned', { detail: { amount: n } }));
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
export const getBest = async (key) => {
  if (window.GameBridge) {
    // Android - usar GameBridge
    const gameId = key.replace('aray_best_', '');
    
    return new Promise((resolve) => {
      // Crear callback único para esta solicitud
      const callbackId = Date.now() + '_' + Math.random();
      
      // Configurar callback para recibir el resultado
      const originalCallback = window.onBestLevelReceived;
      window.onBestLevelReceived = (receivedGameId, level) => {
        if (receivedGameId === gameId) {
          // Actualizar cache local
          localStorage.setItem(key, String(level));
          // Restaurar callback original
          window.onBestLevelReceived = originalCallback;
          resolve(level);
        }
      };
      
      // Solicitar nivel máximo
      window.GameBridge.getBestLevel(gameId);
      
      // Timeout de seguridad
      setTimeout(() => {
        if (window.onBestLevelReceived !== originalCallback) {
          console.warn('Timeout en getBest para', gameId);
          window.onBestLevelReceived = originalCallback;
          resolve(parseInt(localStorage.getItem(key) || '0', 10));
        }
      }, 5000);
    });
  } else {
    // Web - usar localStorage
    return parseInt(localStorage.getItem(key) || '0', 10);
  }
};

export const setBest = async (key, val) => {
  if (window.GameBridge) {
    // Android - usar GameBridge con soporte offline
    const gameId = key.replace('aray_best_', '');
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    
    if (val > current) {
      // Asegurar que val sea un número entero
      const levelInt = parseInt(val, 10);
      
      // Guardar en cache local inmediatamente
      localStorage.setItem(key, String(levelInt));
      
      // Intentar guardar en servidor
      try {
        window.GameBridge.updateBestLevel(gameId, levelInt);
        
        // Marcar para sincronización offline
        const offlineQueue = JSON.parse(localStorage.getItem('offline_progress_queue') || '[]');
        offlineQueue.push({
          gameId: gameId,
          level: levelInt,
          timestamp: Date.now()
        });
        localStorage.setItem('offline_progress_queue', JSON.stringify(offlineQueue));
        
        console.log('✅ Progreso guardado en servidor y cola offline');
      } catch (error) {
        console.warn('⚠️ Sin conexión - guardado solo localmente');
      }
      
      return true; // Nuevo récord
    }
    return false;
  } else {
    // Web - usar localStorage
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    if (val > current) {
      localStorage.setItem(key, String(val));
      return true; // Nuevo récord
    }
    return false;
  }
};

// Shortcuts para cada juego
export const getBestCole = async () => await getBest(KEYS.BEST_COLE);
export const setBestCole = async (val) => await setBest(KEYS.BEST_COLE, val);

export const getBestParque = async () => await getBest(KEYS.BEST_PARQUE);
export const setBestParque = async (val) => await setBest(KEYS.BEST_PARQUE, val);

export const getBestPabellon = async () => await getBest(KEYS.BEST_PABELLON);
export const setBestPabellon = async (val) => await setBest(KEYS.BEST_PABELLON, val);

export const getBestSkate = async () => await getBest(KEYS.BEST_SKATE);
export const setBestSkate = async (val) => await setBest(KEYS.BEST_SKATE, val);

// ========== SINCRONIZACIÓN OFFLINE ==========
export const syncOfflineProgress = async () => {
  if (!window.GameBridge) return;
  
  const offlineQueue = JSON.parse(localStorage.getItem('offline_progress_queue') || '[]');
  
  if (offlineQueue.length === 0) {
    console.log('📡 No hay progreso offline para sincronizar');
    return;
  }
  
  console.log(`📡 Sincronizando ${offlineQueue.length} elementos offline...`);
  
  for (const item of offlineQueue) {
    try {
      window.GameBridge.updateBestLevel(item.gameId, item.level);
      console.log(`✅ Sincronizado: ${item.gameId} = ${item.level}`);
    } catch (error) {
      console.warn(`❌ Error sincronizando ${item.gameId}:`, error);
    }
  }
  
  // Limpiar cola después de sincronizar
  localStorage.removeItem('offline_progress_queue');
  console.log('🎉 Sincronización offline completada');
};

// Detectar cuando vuelve la conexión
export const initOfflineSync = () => {
  if (!window.GameBridge) return;
  
  // Sincronizar al cargar la página
  syncOfflineProgress();
  
  // Sincronizar cuando vuelve la conexión
  window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada - sincronizando...');
    setTimeout(syncOfflineProgress, 1000);
  });
  
  // Sincronizar periódicamente
  setInterval(syncOfflineProgress, 30000); // Cada 30 segundos
};

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

