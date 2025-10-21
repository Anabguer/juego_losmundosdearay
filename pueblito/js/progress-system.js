/* ========================================
   🎮 PROGRESS SYSTEM - Progreso por Minijuego
   Tracking de niveles alcanzados en cada minijuego
   ======================================== */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, addToSyncQueue, isOnline } from './firebase-config.js';
import { getCurrentUser, getCurrentUserData } from './auth-system.js';

// Mapeo de gameIds
export const GAME_IDS = {
  snake: 'snake',
  runner: 'runner', 
  memory: 'memory',
  spaceinvaders: 'spaceinvaders',
  frogger: 'frogger',
  parkour: 'parkour',
  match3: 'match3',
  whackamole: 'whackamole',
  cables: 'cables'
};

// Cache local de progreso
let localProgress = {};

// Función para actualizar el mejor nivel alcanzado
export const updateBestLevel = async (gameId, newLevel) => {
  if (!gameId || !newLevel || newLevel <= 0) return;
  
  const user = getCurrentUser();
  const userData = getCurrentUserData();
  
  if (!user || !userData) {
    console.warn('⚠️ Usuario no autenticado, guardando localmente');
    localProgress[gameId] = Math.max(localProgress[gameId] || 0, newLevel);
    localStorage.setItem('aray_local_progress', JSON.stringify(localProgress));
    return;
  }
  
  const progressId = `${user.uid}_${gameId}`;
  const progressRef = doc(db, 'progress', progressId);
  
  try {
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) {
      // Crear nuevo progreso
      await setDoc(progressRef, {
        uid: user.uid,
        gameId: gameId,
        bestLevel: newLevel,
        updatedAt: serverTimestamp()
      });
      console.log(`🎮 Nuevo progreso creado: ${gameId} nivel ${newLevel}`);
    } else {
      const currentBest = progressSnap.data().bestLevel || 0;
      
      if (newLevel > currentBest) {
        // Actualizar solo si es mejor
        await updateDoc(progressRef, {
          bestLevel: newLevel,
          updatedAt: serverTimestamp()
        });
        console.log(`🎮 Progreso actualizado: ${gameId} nivel ${newLevel} (antes: ${currentBest})`);
      } else {
        console.log(`🎮 Nivel ${newLevel} no supera el mejor ${currentBest} en ${gameId}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error actualizando progreso:', error);
    
    // Operación para sincronizar offline
    const syncOperation = {
      type: 'updateProgress',
      execute: async () => {
        const progressSnap = await getDoc(progressRef);
        
        if (!progressSnap.exists()) {
          await setDoc(progressRef, {
            uid: user.uid,
            gameId: gameId,
            bestLevel: newLevel,
            updatedAt: serverTimestamp()
          });
        } else {
          const currentBest = progressSnap.data().bestLevel || 0;
          if (newLevel > currentBest) {
            await updateDoc(progressRef, {
              bestLevel: newLevel,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    };
    
    if (isOnline) {
      addToSyncQueue(syncOperation);
    }
  }
};

// Función para obtener el mejor nivel de un juego
export const getBestLevel = async (gameId) => {
  const user = getCurrentUser();
  
  if (!user) {
    // Usuario no autenticado - usar cache local
    return localProgress[gameId] || 0;
  }
  
  try {
    const progressId = `${user.uid}_${gameId}`;
    const progressRef = doc(db, 'progress', progressId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return progressSnap.data().bestLevel || 0;
    }
    
    return 0;
    
  } catch (error) {
    console.error('❌ Error obteniendo mejor nivel:', error);
    return localProgress[gameId] || 0;
  }
};

// Función para obtener todos los progresos del usuario
export const getAllProgress = async () => {
  const user = getCurrentUser();
  
  if (!user) {
    return localProgress;
  }
  
  const progress = {};
  
  for (const gameId of Object.values(GAME_IDS)) {
    try {
      const bestLevel = await getBestLevel(gameId);
      progress[gameId] = bestLevel;
    } catch (error) {
      console.error(`❌ Error obteniendo progreso de ${gameId}:`, error);
      progress[gameId] = 0;
    }
  }
  
  return progress;
};

// Función para sincronizar progreso local con Firebase
export const syncLocalProgress = async () => {
  const user = getCurrentUser();
  if (!user) return;
  
  const localData = JSON.parse(localStorage.getItem('aray_local_progress') || '{}');
  
  for (const [gameId, level] of Object.entries(localData)) {
    if (level > 0) {
      await updateBestLevel(gameId, level);
    }
  }
  
  // Limpiar cache local
  localStorage.removeItem('aray_local_progress');
  localProgress = {};
  
  console.log('🎮 Progreso local sincronizado');
};

// Función para mostrar mensaje de progreso
export const showProgressMessage = (gameId, newLevel, previousBest) => {
  const gameNames = {
    snake: 'Parque - Snake',
    runner: 'Skate Park',
    memory: 'Cole - Amigos VS Demonios',
    spaceinvaders: 'Pabellón - Space Invaders',
    frogger: 'Río - Salta Troncos',
    parkour: 'Edificio - Parkour Ninja',
    match3: 'Tienda - Match 3',
    whackamole: 'Yayos - Caza Ratas',
    cables: 'Informática - Conecta Cables'
  };
  
  const gameName = gameNames[gameId] || gameId;
  
  if (newLevel > previousBest) {
    console.log(`🎉 ¡Nuevo récord! ${gameName}: Nivel ${newLevel} (antes: ${previousBest})`);
    return `🎉 ¡Nuevo récord! ${gameName}: Nivel ${newLevel}`;
  } else {
    console.log(`🎮 ${gameName}: Nivel ${newLevel} · Tu mejor: ${previousBest}`);
    return `🎮 ${gameName}: Nivel ${newLevel} · Tu mejor: ${previousBest}`;
  }
};

// Inicializar cache local
const initLocalProgress = () => {
  try {
    localProgress = JSON.parse(localStorage.getItem('aray_local_progress') || '{}');
  } catch (error) {
    localProgress = {};
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initLocalProgress);
