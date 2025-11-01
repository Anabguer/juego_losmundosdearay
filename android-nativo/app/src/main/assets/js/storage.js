/* ========================================
   💾 STORAGE - Gestión unificada de datos
   Sistema híbrido: localStorage + Firebase/GameBridge
   ======================================== */

// ========================================
// 🏗️ ESTRUCTURA UNIFICADA DE DATOS
// ========================================

// Claves de localStorage unificadas
const STORAGE_KEYS = {
  USER_DATA: 'losmundosdearay_user_data',
  SETTINGS: 'losmundosdearay_settings', 
  RESOURCES: 'losmundosdearay_resources',
  PROGRESS: 'losmundosdearay_progress',
  SYNC: 'losmundosdearay_sync'
};

// Estructura unificada por defecto
const DEFAULT_DATA = {
  user: {
    uid: null,
    nick: null,
    email: null,
    photoURL: null,
    createdAt: null,
    lastSeen: null
  },
  settings: {
    audioEnabled: true,
    musicEnabled: true,
    lastGameId: null,
    language: 'es'
  },
  resources: {
    candiesTotal: 0,
    energy: 100
  },
  progress: {
    skate: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    cole: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    yayos: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    parque: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    pabellon: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    informatica: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    tienda: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    rio: { bestLevel: 1, bestScore: 0, lastPlayed: null },
    edificio: { bestLevel: 1, bestScore: 0, lastPlayed: null }
  },
  sync: {
    lastSync: null,
    offlineQueue: [],
    needsSync: false,
    version: 1
  }
};

// ========================================
// 🔧 FUNCIONES DE GESTIÓN UNIFICADA
// ========================================

// Obtener datos unificados de localStorage
// Cache para evitar llamadas excesivas a localStorage
let unifiedDataCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 100; // Cache por 100ms

export const getUnifiedData = () => {
  const now = Date.now();
  
  // Usar cache si está disponible y no ha expirado
  if (unifiedDataCache && (now - lastCacheTime) < CACHE_DURATION) {
    return unifiedDataCache;
  }
  
  const data = JSON.parse(JSON.stringify(DEFAULT_DATA)); // Deep clone
  
  try {
    // Cargar datos estructurados
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      Object.assign(data.user, JSON.parse(userData));
    }
    
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settings) {
      Object.assign(data.settings, JSON.parse(settings));
    }
    
    const resources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    if (resources) {
      Object.assign(data.resources, JSON.parse(resources));
    }
    
    const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (progress) {
      Object.assign(data.progress, JSON.parse(progress));
      // Solo loggear ocasionalmente para evitar spam
      if (Math.random() < 0.01) { // 1% de probabilidad
      }
    }
    
    const sync = localStorage.getItem(STORAGE_KEYS.SYNC);
    if (sync) {
      Object.assign(data.sync, JSON.parse(sync));
    }
    
  } catch (error) {
    console.warn('❌ Error cargando datos unificados:', error);
  }
  
  // Actualizar cache
  unifiedDataCache = data;
  lastCacheTime = now;
  
  return data;
};

// Invalidar cache cuando se actualicen los datos
export const invalidateCache = () => {
  unifiedDataCache = null;
  lastCacheTime = 0;
};

// Guardar datos unificados en localStorage
export const saveUnifiedData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(data.resources));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
    localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(data.sync));
    
    // Invalidar cache después de guardar
    invalidateCache();
    
    return true;
  } catch (error) {
    console.error('❌ Error guardando datos unificados:', error);
    return false;
  }
};


// ========================================
// 🔄 SINCRONIZACIÓN CON FIREBASE/GAMEBRIDGE
// ========================================

// Sincronizar datos desde Firebase al localStorage
export const syncFromFirebase = async () => {
  if (!window.GameBridge) {
    return false;
  }
  
  
  try {
    const unifiedData = getUnifiedData();
    
    // Obtener datos del usuario desde GameBridge
    if (window.GameBridge.getUser) {
      const userDataStr = window.GameBridge.getUser();
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        Object.assign(unifiedData.user, userData);
      }
    }
    
    // Obtener candies desde GameBridge
    if (window.GameBridge.getCandies) {
      const candiesDataStr = window.GameBridge.getCandies();
      if (candiesDataStr) {
        const candiesData = JSON.parse(candiesDataStr);
        unifiedData.resources.candiesTotal = candiesData.candiesTotal || 0;
        unifiedData.settings.audioEnabled = candiesData.soundEnabled !== undefined ? candiesData.soundEnabled : unifiedData.settings.audioEnabled;
        unifiedData.settings.musicEnabled = candiesData.musicEnabled !== undefined ? candiesData.musicEnabled : unifiedData.settings.musicEnabled;

      }
    }
    
    // Obtener progreso de juegos
    const gameKeys = ['skate', 'cole', 'yayos', 'parque', 'pabellon', 'informatica', 'tienda', 'rio', 'edificio'];
    
    for (const gameKey of gameKeys) {
      if (window.GameBridge.getBestLevel) {
        try {
          const level = await new Promise((resolve) => {
            window.onBestLevelReceived = (level) => {
              resolve(parseInt(level) || 1);
            };
            window.GameBridge.getBestLevel(gameKey);
            setTimeout(() => resolve(1), 2000);
          });
          
          if (unifiedData.progress[gameKey]) {
            unifiedData.progress[gameKey].bestLevel = Math.max(unifiedData.progress[gameKey].bestLevel, level);
            unifiedData.progress[gameKey].lastPlayed = new Date().toISOString();
          }
          

        } catch (error) {
          console.warn(`❌ Error sincronizando ${gameKey}:`, error);
        }
      }
    }
    
    // Actualizar metadatos de sincronización
    unifiedData.sync.lastSync = new Date().toISOString();
    unifiedData.sync.needsSync = false;
    
    // Guardar datos sincronizados
    saveUnifiedData(unifiedData);

    
    return true;
  } catch (error) {
    console.error('❌ Error en sincronización desde Firebase:', error);
    return false;
  }
};

// Sincronización bidireccional: Firebase ↔ localStorage (actualiza al valor más alto)
// IMPORTANTE: Primero compara ambos valores, luego actualiza el que tenga menos
export const syncToFirebase = async () => {
  if (!window.GameBridge) {
    return false;
  }
  
  
  try {
    const unifiedData = getUnifiedData();
    
    // ========== PASO 1: OBTENER Y COMPARAR CARAMELOS ==========
    const userJson = window.GameBridge.getUser() || '{}';
    const user = JSON.parse(userJson);
    const firebaseCandies = user.candiesTotal || 0;
    const localCandies = unifiedData.resources.candiesTotal || 0;
    
    // Calcular el máximo ANTES de modificar nada
    const maxCandies = Math.max(localCandies, firebaseCandies);
    
    // Actualizar ambos al máximo (solo si alguno necesita actualización)
    if (maxCandies !== localCandies || maxCandies !== firebaseCandies) {
      if (maxCandies !== localCandies) {
        // Actualizar localStorage al máximo
        unifiedData.resources.candiesTotal = maxCandies;
        saveUnifiedData(unifiedData);
      }
      
      if (maxCandies !== firebaseCandies) {
        // Actualizar Firebase al máximo
        window.GameBridge.addCandies(maxCandies);
      }
    }
    
    // ========== PASO 2: OBTENER Y COMPARAR NIVELES ==========
    // IMPORTANTE: Niveles y caramelos se sincronizan independientemente
    const gameKeys = ['skate', 'cole', 'yayos', 'parque', 'pabellon', 'informatica', 'tienda', 'rio', 'edificio'];
    
    for (const gameKey of gameKeys) {
      try {
        // PASO 2.1: Obtener nivel LOCAL primero (sin modificar nada)
        const localLevel = unifiedData.progress[gameKey]?.bestLevel || 1;
        
        // PASO 2.2: Obtener nivel de FIREBASE (esperar hasta 5 segundos)
        const firebaseLevel = await new Promise((resolve) => {
          let resolved = false;
          const originalCallback = window.onBestLevelReceived;
          
          window.onBestLevelReceived = (receivedGameId, level) => {
            if (receivedGameId === gameKey && !resolved) {
              resolved = true;
              const parsedLevel = parseInt(level) || 0; // 0 = no existe documento
              window.onBestLevelReceived = originalCallback;
              resolve(parsedLevel);
            } else if (originalCallback && receivedGameId !== gameKey) {
              originalCallback(receivedGameId, level);
            }
          };
          
          window.GameBridge.getBestLevel(gameKey);
          
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              window.onBestLevelReceived = originalCallback;
              resolve(0);
            }
          }, 5000);
        });
        
        // PASO 2.3: COMPARAR AMBOS VALORES (sin modificar nada aún)
        // Normalizar: 0 en Firebase significa "no existe", equivalente a nivel 1
        const firebaseLevelForComparison = firebaseLevel === 0 ? 1 : firebaseLevel;
        
        // PASO 2.4: Calcular el MÁXIMO antes de modificar nada
        const maxLevel = Math.max(localLevel, firebaseLevelForComparison);
        
        // PASO 2.5: Actualizar ambos al máximo (solo si alguno necesita actualización)
        if (maxLevel !== localLevel || maxLevel !== firebaseLevelForComparison) {
          // Actualizar localStorage si no está al máximo
          if (maxLevel !== localLevel) {
            unifiedData.progress[gameKey].bestLevel = maxLevel;
            saveUnifiedData(unifiedData);
          }
          
          // Actualizar Firebase si no está al máximo (usar valor real, no normalizado)
          if (maxLevel > firebaseLevel) {
            window.GameBridge.updateBestLevel(gameKey, maxLevel);
            // Esperar un momento para que se complete
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
      } catch (error) {
        console.warn(`❌ Error sincronizando ${gameKey}:`, error);
      }
    }
    
    // Guardar cambios en localStorage (actualizar los niveles que se cambiaron)
    unifiedData.sync.lastSync = new Date().toISOString();
    unifiedData.sync.needsSync = false;
    saveUnifiedData(unifiedData);
    
    
    return true;
  } catch (error) {
    console.error('❌ Error en sincronización bidireccional:', error);
    return false;
  }
};

// Sincronización bidireccional: Firebase ↔ localStorage
const syncBidirectional = async () => {
  
  // Si no hay usuario logueado, no sincronizar con Firebase
  const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn();
  if (!isLoggedIn) {
    return;
  }
  
  try {
    // IMPORTANTE: PRIMERO subir datos de invitado a Firebase (syncToFirebase)
    // Esto asegura que los datos de invitado no se pierdan cuando hay cuenta existente
    await syncToFirebase();
    
    // DESPUÉS hacer sincronización bidireccional completa
    // SINCRONIZACIÓN BIDIRECCIONAL: Firebase ↔ localStorage basada en timestamps
    
    // Verificar si hay datos en localStorage
    const localStorageEmpty = localStorage.length === 0;
    
    // Obtener datos de Firebase si están disponibles
    let firebaseData = null;
    if (window.GameBridge && window.GameBridge.getUser) {
      try {
        const userJson = window.GameBridge.getUser() || '{}';
        const user = JSON.parse(userJson);
        if (user && Object.keys(user).length > 0) {
          firebaseData = {
            user: user,
            timestamp: user.lastSeen || null
          };

        } else {
          console.log('⚠️ getUser() devolvió objeto vacío o inválido');
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo datos de Firebase:', error);
      }
    }
    
    // Obtener datos locales
    let localData = null;
    if (!localStorageEmpty) {
      const unifiedData = getUnifiedData();
      localData = {
            resources: unifiedData.resources,
            progress: unifiedData.progress,
            settings: unifiedData.settings,
            timestamp: unifiedData.sync?.lastSync || null
          };

    }
    
    // LÓGICA DE SINCRONIZACIÓN BIDIRECCIONAL
    
    // Caso 1: localStorage vacío y Firebase tiene datos → Cargar desde Firebase
    if (localStorageEmpty && firebaseData) {

      const unifiedData = getUnifiedData();
      
      // Copiar DATOS DEL USUARIO desde Firebase
      if (firebaseData.user) {
        unifiedData.user = { ...unifiedData.user, ...firebaseData.user };

      }
      
      // Copiar caramelos desde Firebase
      if (firebaseData.user.candiesTotal !== undefined) {
        unifiedData.resources.candiesTotal = firebaseData.user.candiesTotal;
      }
      
      // Descargar TODOS los niveles desde Firebase para cada juego
      const gameIds = ['skate', 'cole', 'yayos', 'parque', 'pabellon', 'informatica', 'tienda', 'rio', 'edificio'];
      let loadedGames = 0;
      
      gameIds.forEach(gameId => {
        if (window.GameBridge && window.GameBridge.getBestLevel) {
          window.GameBridge.getBestLevel(gameId);
          
          // Configurar callback para recibir el nivel
          const originalCallback = window.onBestLevelReceived;
          window.onBestLevelReceived = (receivedGameId, level) => {

            if (unifiedData.progress[receivedGameId] && level > 0) {
              unifiedData.progress[receivedGameId].bestLevel = level;
            }
            loadedGames++;
            
            // Si ya cargamos todos los juegos, guardar
            if (loadedGames === gameIds.length) {
              unifiedData.sync.lastSync = new Date().toISOString();
              saveUnifiedData(unifiedData);

              window.onBestLevelReceived = originalCallback;
            }
          };
          
          // Timeout de seguridad
          setTimeout(() => {
            loadedGames++;
            if (loadedGames === gameIds.length) {
              unifiedData.sync.lastSync = new Date().toISOString();
              saveUnifiedData(unifiedData);
              console.log('✅ Datos cargados desde Firebase (con timeout)');
            }
          }, 3000);
        }
      });
      
      return;
    }
    
    // Caso 2: Ambos tienen datos → Comparar timestamps y usar el más reciente
    if (localData && firebaseData) {
      const localTime = localData.timestamp ? new Date(localData.timestamp) : new Date(0);
      const firebaseTime = firebaseData.timestamp ? new Date(firebaseData.timestamp) : new Date(0);
      
      if (firebaseTime > localTime) {

        const unifiedData = getUnifiedData();
        
        // Copiar DATOS DEL USUARIO desde Firebase
        if (firebaseData.user) {
          unifiedData.user = { ...unifiedData.user, ...firebaseData.user };

        }
        
        // Copiar caramelos desde Firebase
        if (firebaseData.user.candiesTotal !== undefined) {
          unifiedData.resources.candiesTotal = firebaseData.user.candiesTotal;
        }
        
        // Guardar datos del usuario inmediatamente
        saveUnifiedData(unifiedData);
        
        // Descargar TODOS los niveles desde Firebase
        const gameIds = ['skate', 'cole', 'yayos', 'parque', 'pabellon', 'informatica', 'tienda', 'rio', 'edificio'];
        let loadedGames = 0;
        
        gameIds.forEach(gameId => {
          if (window.GameBridge && window.GameBridge.getBestLevel) {
            window.GameBridge.getBestLevel(gameId);
            
            const originalCallback = window.onBestLevelReceived;
            window.onBestLevelReceived = (receivedGameId, level) => {

              if (unifiedData.progress[receivedGameId] && level > 0) {
                unifiedData.progress[receivedGameId].bestLevel = level;
              }
              loadedGames++;
              
              if (loadedGames === gameIds.length) {
                unifiedData.sync.lastSync = new Date().toISOString();
                saveUnifiedData(unifiedData);

                window.onBestLevelReceived = originalCallback;
              }
            };
            
            setTimeout(() => {
              if (loadedGames < gameIds.length) {
                loadedGames++;
                if (loadedGames === gameIds.length) {
                  unifiedData.sync.lastSync = new Date().toISOString();
                  saveUnifiedData(unifiedData);
                  console.log('✅ Datos sincronizados (con timeout)');
                }
              }
            }, 3000);
          }
        });
      } else if (localTime > firebaseTime) {

        
        // Guardar también los datos del usuario en localStorage
        const unifiedData = getUnifiedData();
        if (firebaseData.user) {
          unifiedData.user = { ...unifiedData.user, ...firebaseData.user };

          saveUnifiedData(unifiedData);
        }
        
        await syncToFirebase();
      } else {

        // Priorizar Firebase cuando las fechas son iguales (usuario logueado)
        const unifiedData = getUnifiedData();
        
        if (firebaseData.user.candiesTotal !== undefined) {
          unifiedData.resources.candiesTotal = firebaseData.user.candiesTotal;
        }
        
        // Descargar niveles desde Firebase
        const gameIds = ['skate', 'cole', 'yayos', 'parque', 'pabellon', 'informatica', 'tienda', 'rio', 'edificio'];
        let loadedGames = 0;
        
        gameIds.forEach(gameId => {
          if (window.GameBridge && window.GameBridge.getBestLevel) {
            window.GameBridge.getBestLevel(gameId);
            
            const originalCallback = window.onBestLevelReceived;
            window.onBestLevelReceived = (receivedGameId, level) => {

              if (unifiedData.progress[receivedGameId] && level > 0) {
                unifiedData.progress[receivedGameId].bestLevel = level;
              }
              loadedGames++;
              
              if (loadedGames === gameIds.length) {
                unifiedData.sync.lastSync = new Date().toISOString();
                saveUnifiedData(unifiedData);

                window.onBestLevelReceived = originalCallback;
              }
            };
            
            setTimeout(() => {
              if (loadedGames < gameIds.length) {
                loadedGames++;
                if (loadedGames === gameIds.length) {
                  unifiedData.sync.lastSync = new Date().toISOString();
                  saveUnifiedData(unifiedData);
                  console.log('✅ Sincronización completada (timeout)');
                }
              }
            }, 3000);
          }
        });
      }
      return;
    }
    
    // Caso 3: localStorage vacío y Firebase vacío → No crear datos por defecto
    if (localStorageEmpty && !firebaseData) {

      return;
    }
    
  } catch (error) {
    console.error('❌ Error en sincronización bidireccional:', error);
  }
};

// Inicializar sincronización automática
export const initAutoSync = async () => {

  
  // Si hay GameBridge disponible y el usuario está logueado, sincronizar
  const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn();
  if (window.GameBridge && isLoggedIn) {

    
    // Sincronización bidireccional al inicio
    await syncBidirectional();
    
    // Configurar sincronización periódica bidireccional
    setInterval(async () => {
      if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
        await syncBidirectional();
      }
    }, 30000); // Cada 30 segundos
    
    // Sincronizar cuando vuelve la conexión
    window.addEventListener('online', async () => {

      setTimeout(async () => {
        await syncBidirectional();
      }, 1000);
    });
    
  } else {

  }
};

// ========================================
// 🎮 FUNCIONES COMPATIBLES CON CÓDIGO EXISTENTE
// ========================================

// Mantener sincronizados coins y candiesTotal
const syncCoinsAndCandies = (data) => {
  data.resources.candiesTotal = data.resources.coins;
  data.resources.coins = data.resources.candiesTotal;
};

// Claves legacy para compatibilidad
// ========== FRESITAS (MONEDA) - COMPATIBLE CON CÓDIGO EXISTENTE ==========
export const getCoins = () => {
  const unifiedData = getUnifiedData();
  return unifiedData.resources.candiesTotal;
};

export const setCoins = (n) => {
  const unifiedData = getUnifiedData();
  unifiedData.resources.candiesTotal = Math.max(0, n);
  saveUnifiedData(unifiedData);
  
  // Ya no guardar en clave legacy (se eliminó por no usar código antiguo)
  
  // Solo sincronizar con Firebase si el usuario está logueado
  if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
    // Enviar el valor absoluto a Firebase
    window.GameBridge.addCandies(unifiedData.resources.candiesTotal);
  }
};

export const addCoins = async (n = 1) => {
  const unifiedData = getUnifiedData();
  unifiedData.resources.candiesTotal += n;
  saveUnifiedData(unifiedData);
  
  // Ya no guardar en clave legacy (se eliminó por no usar código antiguo)
  
  // Solo sincronizar con Firebase si el usuario está logueado
  if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
    // Enviar el valor absoluto a Firebase
    window.GameBridge.addCandies(unifiedData.resources.candiesTotal);
  }
  
  // Disparar evento personalizado para animación
  window.dispatchEvent(new CustomEvent('candyEarned', { detail: { amount: n } }));
};

// Alias para compatibilidad
export const getCandies = () => {
  // Siempre usar localStorage como fuente de verdad
  const unifiedData = getUnifiedData();
  return unifiedData.resources.candiesTotal;
};

export const setCandies = setCoins;

// Sistema simplificado de caramelos
export const addCandies = async (n = 1) => {
  const unifiedData = getUnifiedData();
  const oldTotal = unifiedData.resources.candiesTotal;
  unifiedData.resources.candiesTotal += n;

  saveUnifiedData(unifiedData);
  
  // Ya no guardar en clave legacy (se eliminó por no usar código antiguo)
  
  // Solo sincronizar con Firebase si el usuario está logueado
  if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
    // Android - usar GameBridge solo si está logueado
    // IMPORTANTE: Enviamos el VALOR ABSOLUTO (total), no el incremento
    try {

      // Enviar el valor absoluto (total actual)
      window.GameBridge.addCandies(unifiedData.resources.candiesTotal);

      
      // Forzar actualización del HUD después de un breve delay
      setTimeout(() => {
        if (window.updateHUD) {

          window.updateHUD();
        }
      }, 500);
      
    } catch (error) {
      console.warn('❌ Error enviando caramelos al GameBridge:', error);
    }
  } else {
    // Web - usar localStorage

  }
  
  // Disparar evento personalizado para animación
  window.dispatchEvent(new CustomEvent('candyEarned', { detail: { amount: n } }));
};

// ========== ENERGÍA - COMPATIBLE CON CÓDIGO EXISTENTE ==========
export const getEnergy = () => {
  const unifiedData = getUnifiedData();
  return unifiedData.resources.energy;
};

export const setEnergy = (v) => {
  const unifiedData = getUnifiedData();
  unifiedData.resources.energy = Math.max(0, Math.min(100, v));
  saveUnifiedData(unifiedData);
};

export const addEnergy = (n) => {
  const unifiedData = getUnifiedData();
  unifiedData.resources.energy = Math.max(0, Math.min(100, unifiedData.resources.energy + n));
  saveUnifiedData(unifiedData);
};

// ========== RÉCORDS - COMPATIBLE CON CÓDIGO EXISTENTE ==========
export const getBest = async (gameId) => {
  const unifiedData = getUnifiedData();
  const level = unifiedData.progress[gameId]?.bestLevel || 1;

  // Siempre usar localStorage como fuente de verdad
  return level;
};

export const setBest = async (gameId, val) => {
  const unifiedData = getUnifiedData();
  const current = unifiedData.progress[gameId]?.bestLevel || 1;

    
    if (val > current) {

    // Actualizar datos unificados
    if (unifiedData.progress[gameId]) {
      unifiedData.progress[gameId].bestLevel = val;
      unifiedData.progress[gameId].lastPlayed = new Date().toISOString();
      saveUnifiedData(unifiedData);
    }
    
    // Solo sincronizar con Firebase si el usuario está logueado
    if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
      try {

        window.GameBridge.updateBestLevel(gameId, val);

      } catch (error) {
        console.warn('❌ Error sincronizando nivel:', error);
      }
      }
      
      return true; // Nuevo récord
    }
    return false;
};

// Shortcuts para cada juego
export const getBestCole = async () => await getBest('cole');
export const setBestCole = async (val) => await setBest('cole', val);

export const getBestParque = async () => await getBest('parque');
export const setBestParque = async (val) => await setBest('parque', val);

export const getBestPabellon = async () => await getBest('pabellon');
export const setBestPabellon = async (val) => await setBest('pabellon', val);

export const getBestSkate = async () => await getBest('skate');
export const setBestSkate = async (val) => await setBest('skate', val);

// ========== SINCRONIZACIÓN OFFLINE - MEJORADA ==========
export const syncOfflineProgress = async () => {
  if (!window.GameBridge) return;
  
  const unifiedData = getUnifiedData();
  const offlineQueue = unifiedData.sync.offlineQueue;
  
  if (offlineQueue.length === 0) {

    return;
  }
  

  
  for (const item of offlineQueue) {
    try {
      window.GameBridge.updateBestLevel(item.gameId, item.level);

    } catch (error) {
      console.warn(`❌ Error sincronizando ${item.gameId}:`, error);
    }
  }
  
  // Limpiar cola después de sincronizar
  unifiedData.sync.offlineQueue = [];
  saveUnifiedData(unifiedData);

};

// Detectar cuando vuelve la conexión
export const initOfflineSync = () => {
  if (!window.GameBridge) return;
  
  // Sincronizar al cargar la página
  syncOfflineProgress();
  
  // Sincronizar cuando vuelve la conexión
  window.addEventListener('online', () => {

    setTimeout(syncOfflineProgress, 1000);
  });
  
  // Sincronizar periódicamente
  setInterval(syncOfflineProgress, 30000); // Cada 30 segundos
};

// Resetear datos de localStorage al estado inicial (para cuando se cierra sesión)
export const resetDataOnLogout = () => {

  
  const unifiedData = getUnifiedData();
  
  // Guardar preferencias de audio/música (son del dispositivo, no del usuario)
  const audioEnabled = unifiedData.settings.audioEnabled;
  const musicEnabled = unifiedData.settings.musicEnabled;
  
  // Resetear todos los datos a valores iniciales
  const resetData = JSON.parse(JSON.stringify(DEFAULT_DATA)); // Deep clone
  
  // Restaurar preferencias de audio/música
  resetData.settings.audioEnabled = audioEnabled;
  resetData.settings.musicEnabled = musicEnabled;
  
  // Guardar datos reseteados
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(resetData.user));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(resetData.settings));
  localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resetData.resources));
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(resetData.progress));
  localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(resetData.sync));
  
  // Limpiar nick del usuario (clave legacy que se puede estar usando)
  localStorage.removeItem('user_nick');
  localStorage.removeItem('nick');
  localStorage.removeItem('userNick');
  
  // Invalidar cache
  unifiedDataCache = null;
  lastCacheTime = 0;
  



};

// Inicializar migración automática de datos de invitado al crear nueva cuenta
export const initGuestDataMigration = () => {
  // Verificar si el usuario está logueado y hay datos locales para migrar
  if (window.GameBridge && 
      window.GameBridge.isUserLoggedIn && 
      window.GameBridge.isUserLoggedIn()) {
    

    
    const unifiedData = getUnifiedData();
    
    // Verificar si la cuenta de Firebase está vacía (nueva cuenta)
    const userJson = window.GameBridge.getUser() || '{}';
    const user = JSON.parse(userJson);
    const firebaseCandies = user.candiesTotal || 0;
    const firebaseHasData = firebaseCandies > 0 || 
                           Object.values(unifiedData.progress).some(p => {
                             // Verificar si algún juego tiene nivel > 1 en Firebase
                             // (esto se verifica durante syncToFirebase)
                             return false; // Se verifica durante sync
                           });
    
    const localHasData = unifiedData.resources.candiesTotal > 0 || 
                        Object.values(unifiedData.progress).some(p => p.bestLevel > 1);
    
    // Si hay datos locales (como invitado) o si Firebase tiene datos, hacer sincronización bidireccional
    if (localHasData || firebaseHasData) {


      setTimeout(async () => {
        try {
          // IMPORTANTE: syncToFirebase es bidireccional y usa el valor más alto
          // Se ejecuta primero para subir datos de invitado ANTES de que otros procesos los sobrescriban
          await syncToFirebase();
        } catch (error) {
          console.warn('⚠️ Error en migración/sincronización:', error);
        }
      }, 300); // Reducir a 300ms para ejecutar PRIMERO
    } else {

    }
  }
};

// Exponer función globalmente para uso desde otros módulos
window.resetDataOnLogout = resetDataOnLogout;

// ========== GUARDAR EN SERVIDOR (OPCIONAL) ==========
export const saveScoreToServer = async (game, score, meta = {}) => {
  try {
    // En Android, no hay servidor PHP disponible, solo usar GameBridge

    
    // Si hay GameBridge disponible, usar su sistema de guardado
    if (window.GameBridge && window.GameBridge.updateBestLevel) {
      // El score ya se guardó en Firebase via setBest/setBestSkate

      return true;
    }
    
    // Fallback: solo log

    return false;
  } catch (err) {
    console.warn('No se pudo guardar en servidor:', err);
    return false;
  }
};

// ========== RESET (para debug) ==========
export const resetAll = () => {
  if (confirm('¿Resetear todos los datos?')) {
    // Limpiar datos unificados
    Object.values(STORAGE_KEYS).forEach(key => {
      if (typeof key === 'string') {
        localStorage.removeItem(key);
      }
    });
    
    window.location.reload();
  }
};

