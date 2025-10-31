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
        console.log(`📊 getUnifiedData() cargó progress desde localStorage:`, data.progress);
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
    console.log('💾 saveUnifiedData() llamado con:', {
      candiesTotal: data.resources?.candiesTotal,
      skateLevel: data.progress?.skate?.bestLevel,
      localStorageLength: localStorage.length
    });
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(data.resources));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
    localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(data.sync));
    
    // Invalidar cache después de guardar
    invalidateCache();
    
    console.log('✅ Datos unificados guardados - localStorage ahora tiene', localStorage.length, 'elementos');
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
    console.log('🌐 GameBridge no disponible - modo offline');
    return false;
  }
  
  console.log('🔄 Sincronizando desde Firebase...');
  
  try {
    const unifiedData = getUnifiedData();
    
    // Obtener datos del usuario desde GameBridge
    if (window.GameBridge.getUser) {
      const userDataStr = window.GameBridge.getUser();
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        Object.assign(unifiedData.user, userData);
        console.log('👤 Datos de usuario sincronizados:', userData.nick);
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
        console.log('🍬 Recursos sincronizados:', candiesData);
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
          
          console.log(`🎮 Progreso ${gameKey} sincronizado: nivel ${level}`);
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
    console.log('✅ Sincronización desde Firebase completada');
    
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
    console.log('🌐 GameBridge no disponible - modo offline');
    return false;
  }
  
  console.log('🔄 Iniciando sincronización bidireccional (comparar primero, actualizar después)...');
  
  try {
    const unifiedData = getUnifiedData();
    
    // ========== PASO 1: OBTENER Y COMPARAR CARAMELOS ==========
    const userJson = window.GameBridge.getUser() || '{}';
    const user = JSON.parse(userJson);
    const firebaseCandies = user.candiesTotal || 0;
    const localCandies = unifiedData.resources.candiesTotal || 0;
    
    console.log(`🍬 COMPARACIÓN caramelos - localStorage: ${localCandies}, Firebase: ${firebaseCandies}`);
    
    // Calcular el máximo ANTES de modificar nada
    const maxCandies = Math.max(localCandies, firebaseCandies);
    console.log(`🍬 Valor máximo calculado: ${maxCandies}`);
    
    // Actualizar ambos al máximo (solo si alguno necesita actualización)
    if (maxCandies !== localCandies || maxCandies !== firebaseCandies) {
      if (maxCandies !== localCandies) {
        // Actualizar localStorage al máximo
        unifiedData.resources.candiesTotal = maxCandies;
        saveUnifiedData(unifiedData);
        console.log(`📥 localStorage actualizado: ${localCandies} → ${maxCandies}`);
      }
      
      if (maxCandies !== firebaseCandies) {
        // Actualizar Firebase al máximo
        window.GameBridge.addCandies(maxCandies);
        console.log(`📤 Firebase actualizado: ${firebaseCandies} → ${maxCandies}`);
      }
    } else {
      console.log(`✅ Caramelos ya sincronizados: ${maxCandies}`);
    }
    
    // ========== PASO 2: OBTENER Y COMPARAR NIVELES ==========
    // IMPORTANTE: Niveles y caramelos se sincronizan independientemente
    const gameKeys = ['skate', 'cole', 'yayos', 'parque', 'pabellon', 'informatica', 'tienda', 'rio', 'edificio'];
    
    for (const gameKey of gameKeys) {
      try {
        // PASO 2.1: Obtener nivel LOCAL primero (sin modificar nada)
        const localLevel = unifiedData.progress[gameKey]?.bestLevel || 1;
        console.log(`🎮 ${gameKey} - Nivel LOCAL obtenido: ${localLevel}`);
        
        // PASO 2.2: Obtener nivel de FIREBASE (esperar hasta 5 segundos)
        const firebaseLevel = await new Promise((resolve) => {
          let resolved = false;
          const originalCallback = window.onBestLevelReceived;
          
          window.onBestLevelReceived = (receivedGameId, level) => {
            if (receivedGameId === gameKey && !resolved) {
              resolved = true;
              const parsedLevel = parseInt(level) || 0; // 0 = no existe documento
              console.log(`🎮 ${gameKey} - Nivel FIREBASE obtenido: ${parsedLevel}`);
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
              console.log(`⏰ ${gameKey} - Timeout, asumiendo Firebase = 0 (no existe)`);
              window.onBestLevelReceived = originalCallback;
              resolve(0);
            }
          }, 5000);
        });
        
        // PASO 2.3: COMPARAR AMBOS VALORES (sin modificar nada aún)
        // Normalizar: 0 en Firebase significa "no existe", equivalente a nivel 1
        const firebaseLevelForComparison = firebaseLevel === 0 ? 1 : firebaseLevel;
        
        console.log(`🎮 ${gameKey} - COMPARACIÓN: localStorage=${localLevel}, Firebase=${firebaseLevel} (normalizado=${firebaseLevelForComparison})`);
        
        // PASO 2.4: Calcular el MÁXIMO antes de modificar nada
        const maxLevel = Math.max(localLevel, firebaseLevelForComparison);
        console.log(`🎮 ${gameKey} - Valor máximo calculado: ${maxLevel}`);
        
        // PASO 2.5: Actualizar ambos al máximo (solo si alguno necesita actualización)
        if (maxLevel !== localLevel || maxLevel !== firebaseLevelForComparison) {
          // Actualizar localStorage si no está al máximo
          if (maxLevel !== localLevel) {
            unifiedData.progress[gameKey].bestLevel = maxLevel;
            saveUnifiedData(unifiedData);
            console.log(`📥 ${gameKey} localStorage actualizado: ${localLevel} → ${maxLevel}`);
          }
          
          // Actualizar Firebase si no está al máximo (usar valor real, no normalizado)
          if (maxLevel > firebaseLevel) {
            console.log(`📤 ${gameKey} Firebase necesita actualización: ${firebaseLevel} → ${maxLevel}`);
            window.GameBridge.updateBestLevel(gameKey, maxLevel);
            console.log(`✅ ${gameKey} Comando enviado a Firebase para actualizar a nivel ${maxLevel}`);
            // Esperar un momento para que se complete
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          console.log(`✅ ${gameKey} ya sincronizado: nivel ${maxLevel} (ambos tienen el mismo valor)`);
        }
        
      } catch (error) {
        console.warn(`❌ Error sincronizando ${gameKey}:`, error);
      }
    }
    
    // Guardar cambios en localStorage (actualizar los niveles que se cambiaron)
    unifiedData.sync.lastSync = new Date().toISOString();
    unifiedData.sync.needsSync = false;
    saveUnifiedData(unifiedData);
    
    console.log('✅ Sincronización bidireccional completada');
    console.log('📊 Resumen de sincronización:');
    console.log(`   - Caramelos: localStorage=${localCandies}, Firebase=${firebaseCandies}, Máximo=${maxCandies}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error en sincronización bidireccional:', error);
    return false;
  }
};

// Sincronización bidireccional: Firebase ↔ localStorage
const syncBidirectional = async () => {
  console.log('🔄 Iniciando sincronización bidireccional...');
  
  // Si no hay usuario logueado, no sincronizar con Firebase
  const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn();
  if (!isLoggedIn) {
    console.log('🚫 Usuario no logueado - saltando sincronización bidireccional');
    return;
  }
  
  try {
    // IMPORTANTE: PRIMERO subir datos de invitado a Firebase (syncToFirebase)
    // Esto asegura que los datos de invitado no se pierdan cuando hay cuenta existente
    console.log('📤 PASO 1: Subiendo datos de invitado a Firebase (si los hay)...');
    await syncToFirebase();
    console.log('✅ PASO 1 completado: Datos de invitado subidos a Firebase');
    
    // DESPUÉS hacer sincronización bidireccional completa
    // SINCRONIZACIÓN BIDIRECCIONAL: Firebase ↔ localStorage basada en timestamps
    
    // Verificar si hay datos en localStorage
    const localStorageEmpty = localStorage.length === 0;
    
    // Obtener datos de Firebase si están disponibles
    let firebaseData = null;
    if (window.GameBridge && window.GameBridge.getUser) {
      try {
        const userJson = window.GameBridge.getUser() || '{}';
        console.log('🔍 getUser() devuelve:', userJson);
        const user = JSON.parse(userJson);
        console.log('🔍 getUser() parseado:', user);
        if (user && Object.keys(user).length > 0) {
          firebaseData = {
            user: user,
            timestamp: user.lastSeen || null
          };
          console.log('📥 Datos de Firebase disponibles:', firebaseData);
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
          console.log('💾 Datos locales disponibles');
    }
    
    // LÓGICA DE SINCRONIZACIÓN BIDIRECCIONAL
    
    // Caso 1: localStorage vacío y Firebase tiene datos → Cargar desde Firebase
    if (localStorageEmpty && firebaseData) {
      console.log('📥 localStorage vacío - Cargando desde Firebase...');
      const unifiedData = getUnifiedData();
      
      // Copiar DATOS DEL USUARIO desde Firebase
      if (firebaseData.user) {
        unifiedData.user = { ...unifiedData.user, ...firebaseData.user };
        console.log('👤 Datos de usuario cargados desde Firebase:', firebaseData.user.nick);
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
            console.log(`📥 Nivel recibido para ${receivedGameId}: ${level}`);
            if (unifiedData.progress[receivedGameId] && level > 0) {
              unifiedData.progress[receivedGameId].bestLevel = level;
            }
            loadedGames++;
            
            // Si ya cargamos todos los juegos, guardar
            if (loadedGames === gameIds.length) {
              unifiedData.sync.lastSync = new Date().toISOString();
              saveUnifiedData(unifiedData);
              console.log('✅ Todos los niveles cargados desde Firebase');
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
        console.log('📥 Firebase es más reciente - Sincronizando desde Firebase...');
        const unifiedData = getUnifiedData();
        
        // Copiar DATOS DEL USUARIO desde Firebase
        if (firebaseData.user) {
          unifiedData.user = { ...unifiedData.user, ...firebaseData.user };
          console.log('👤 Datos de usuario sincronizados desde Firebase:', firebaseData.user.nick);
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
              console.log(`📥 Nivel recibido para ${receivedGameId}: ${level}`);
              if (unifiedData.progress[receivedGameId] && level > 0) {
                unifiedData.progress[receivedGameId].bestLevel = level;
              }
              loadedGames++;
              
              if (loadedGames === gameIds.length) {
                unifiedData.sync.lastSync = new Date().toISOString();
                saveUnifiedData(unifiedData);
                console.log('✅ Todos los niveles sincronizados desde Firebase');
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
        console.log('💾 localStorage es más reciente - Sincronizando hacia Firebase...');
        
        // Guardar también los datos del usuario en localStorage
        const unifiedData = getUnifiedData();
        if (firebaseData.user) {
          unifiedData.user = { ...unifiedData.user, ...firebaseData.user };
          console.log('👤 Datos de usuario sincronizados:', firebaseData.user.nick);
          saveUnifiedData(unifiedData);
        }
        
        await syncToFirebase();
        console.log('✅ Sincronizado hacia Firebase (más reciente)');
      } else {
        console.log('ℹ️ Ambos datos tienen la misma fecha - Priorizando Firebase');
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
              console.log(`📥 Nivel recibido para ${receivedGameId}: ${level}`);
              if (unifiedData.progress[receivedGameId] && level > 0) {
                unifiedData.progress[receivedGameId].bestLevel = level;
              }
              loadedGames++;
              
              if (loadedGames === gameIds.length) {
                unifiedData.sync.lastSync = new Date().toISOString();
                saveUnifiedData(unifiedData);
                console.log('✅ Niveles sincronizados desde Firebase');
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
      console.log('⚠️ localStorage y Firebase vacíos - No creando datos por defecto');
      return;
    }
    
  } catch (error) {
    console.error('❌ Error en sincronización bidireccional:', error);
  }
};

// Inicializar sincronización automática
export const initAutoSync = async () => {
  console.log('🚀 Inicializando sincronización automática...');
  
  // Si hay GameBridge disponible y el usuario está logueado, sincronizar
  const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn();
  if (window.GameBridge && isLoggedIn) {
    console.log('👤 Usuario logueado - sincronizando con Firebase...');
    
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
      console.log('🌐 Conexión restaurada - sincronizando...');
      setTimeout(async () => {
        await syncBidirectional();
      }, 1000);
    });
    
  } else {
    console.log('🌐 Usuario no logueado - usando solo localStorage');
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
  console.log(`🍬 addCandies() llamado con ${n} caramelos...`);
  
  const unifiedData = getUnifiedData();
  const oldTotal = unifiedData.resources.candiesTotal;
  unifiedData.resources.candiesTotal += n;
  console.log(`🍬 Caramelos: ${oldTotal} + ${n} = ${unifiedData.resources.candiesTotal}`);
  console.log(`💾 Llamando saveUnifiedData() para caramelos`);
  saveUnifiedData(unifiedData);
  
  // Ya no guardar en clave legacy (se eliminó por no usar código antiguo)
  
  // Solo sincronizar con Firebase si el usuario está logueado
  if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
    // Android - usar GameBridge solo si está logueado
    // IMPORTANTE: Enviamos el VALOR ABSOLUTO (total), no el incremento
    try {
      console.log(`🍬 Usuario logueado - enviando valor absoluto: ${unifiedData.resources.candiesTotal} al GameBridge...`);
      // Enviar el valor absoluto (total actual)
      window.GameBridge.addCandies(unifiedData.resources.candiesTotal);
      console.log(`✅ ${unifiedData.resources.candiesTotal} caramelos sincronizados con GameBridge`);
      
      // Forzar actualización del HUD después de un breve delay
      setTimeout(() => {
        if (window.updateHUD) {
          console.log('🍬 Forzando actualización del HUD...');
          window.updateHUD();
        }
      }, 500);
      
    } catch (error) {
      console.warn('❌ Error enviando caramelos al GameBridge:', error);
    }
  } else {
    // Web - usar localStorage
    console.log(`✅ ${n} caramelos añadidos localmente`);
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
  console.log(`🎮 getBest(${gameId}) devuelve: ${level}`);
  console.log(`📊 unifiedData.progress[${gameId}]:`, unifiedData.progress[gameId]);
  // Siempre usar localStorage como fuente de verdad
  return level;
};

export const setBest = async (gameId, val) => {
  console.log(`🎮 setBest(${gameId}, ${val}) llamado`);
  const unifiedData = getUnifiedData();
  const current = unifiedData.progress[gameId]?.bestLevel || 1;
  console.log(`📊 Nivel actual: ${current}, nuevo nivel: ${val}`);
    
    if (val > current) {
    console.log(`✅ Nuevo récord! Actualizando nivel de ${current} a ${val}`);
    // Actualizar datos unificados
    if (unifiedData.progress[gameId]) {
      unifiedData.progress[gameId].bestLevel = val;
      unifiedData.progress[gameId].lastPlayed = new Date().toISOString();
      console.log(`💾 Llamando saveUnifiedData() para ${gameId}`);
      saveUnifiedData(unifiedData);
    }
    
    // Solo sincronizar con Firebase si el usuario está logueado
    if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
      try {
        console.log(`🔥 Usuario logueado - sincronizando nivel ${val} para ${gameId}`);
        window.GameBridge.updateBestLevel(gameId, val);
        console.log(`✅ Nivel ${val} sincronizado con Firebase`);
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
  unifiedData.sync.offlineQueue = [];
  saveUnifiedData(unifiedData);
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

// Resetear datos de localStorage al estado inicial (para cuando se cierra sesión)
export const resetDataOnLogout = () => {
  console.log('🔄 Reseteando datos de localStorage al estado inicial...');
  
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
  
  console.log('✅ Datos de localStorage reseteados al estado inicial');
  console.log('📊 Estado inicial: 0 caramelos, nivel 1 en todos los juegos');
  console.log('👤 Nick del usuario eliminado - se mostrará "Invitado"');
};

// Inicializar migración automática de datos de invitado al crear nueva cuenta
export const initGuestDataMigration = () => {
  // Verificar si el usuario está logueado y hay datos locales para migrar
  if (window.GameBridge && 
      window.GameBridge.isUserLoggedIn && 
      window.GameBridge.isUserLoggedIn()) {
    
    console.log('🔄 Verificando si hay datos de invitado para migrar a nueva cuenta...');
    
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
      console.log('📦 Detectada cuenta con datos - iniciando sincronización bidireccional...');
      console.log('📦 Datos locales detectados:', localHasData, '- Datos Firebase:', firebaseHasData);
      setTimeout(async () => {
        try {
          // IMPORTANTE: syncToFirebase es bidireccional y usa el valor más alto
          // Se ejecuta primero para subir datos de invitado ANTES de que otros procesos los sobrescriban
          console.log('📤 EJECUTANDO syncToFirebase() desde initGuestDataMigration...');
          await syncToFirebase();
          console.log('✅ Sincronización bidireccional completada (migración de invitado o nueva cuenta)');
        } catch (error) {
          console.warn('⚠️ Error en migración/sincronización:', error);
        }
      }, 300); // Reducir a 300ms para ejecutar PRIMERO
    } else {
      console.log('ℹ️ No hay datos locales ni en Firebase para sincronizar');
    }
  }
};

// Exponer función globalmente para uso desde otros módulos
window.resetDataOnLogout = resetDataOnLogout;

// ========== GUARDAR EN SERVIDOR (OPCIONAL) ==========
export const saveScoreToServer = async (game, score, meta = {}) => {
  try {
    // En Android, no hay servidor PHP disponible, solo usar GameBridge
    console.log(`📤 Guardando score en GameBridge: ${game} = ${score}`, meta);
    
    // Si hay GameBridge disponible, usar su sistema de guardado
    if (window.GameBridge && window.GameBridge.updateBestLevel) {
      // El score ya se guardó en Firebase via setBest/setBestSkate
      console.log('✅ Score guardado via GameBridge/Firebase');
      return true;
    }
    
    // Fallback: solo log
    console.log('⚠️ GameBridge no disponible, score no guardado en servidor');
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

