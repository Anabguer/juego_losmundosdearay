/* ========================================
   🎮 PROGRESS SYSTEM WEB - Sistema de progreso
   Tracking de niveles por minijuego
   ======================================== */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, addToSyncQueue, isOnline } from './firebase-web.js';
import { getCurrentUser, getCurrentUserData } from './auth-system-web.js';

// Mapeo de gameIds
export const GAME_IDS = {
  'cole': 'cole',
  'parque': 'snake',
  'pabellon': 'pabellon',
  'edificio': 'edificio',
  'rio': 'rio',
  'yayos': 'yayos',
  'tienda': 'tienda',
  'skate': 'skate',
  'informatica': 'informatica'
};

// Obtener mejor nivel para un juego
export const getBestLevel = async (gameId) => {
  const user = getCurrentUser();
  if (!user) {
    // Modo offline - usar localStorage
    const key = `best_${gameId}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
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
    return 0;
  }
};

// Actualizar mejor nivel
export const updateBestLevel = async (gameId, newLevel) => {
  const user = getCurrentUser();
  
  if (!user) {
    // Modo offline - guardar localmente
    const key = `best_${gameId}`;
    const currentBest = parseInt(localStorage.getItem(key) || '0', 10);
    if (newLevel > currentBest) {
      localStorage.setItem(key, newLevel.toString());
      console.log(`🎮 Mejor nivel ${gameId}: ${newLevel} (offline)`);
    }
    return newLevel > currentBest;
  }
  
  try {
    const progressId = `${user.uid}_${gameId}`;
    const progressRef = doc(db, 'progress', progressId);
    const progressSnap = await getDoc(progressRef);
    
    const currentBest = progressSnap.exists() ? progressSnap.data().bestLevel : 0;
    
    if (newLevel > currentBest) {
      if (isOnline()) {
        // Online - actualizar directamente
        await setDoc(progressRef, {
          uid: user.uid,
          gameId: gameId,
          bestLevel: newLevel,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log(`🎮 Mejor nivel ${gameId}: ${newLevel} (online)`);
      } else {
        // Offline - añadir a cola de sincronización
        addToSyncQueue(async () => {
          await setDoc(progressRef, {
            uid: user.uid,
            gameId: gameId,
            bestLevel: newLevel,
            updatedAt: serverTimestamp()
          }, { merge: true });
        });
        
        console.log(`🎮 Mejor nivel ${gameId}: ${newLevel} (offline, en cola)`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error actualizando mejor nivel:', error);
    return false;
  }
};

// Sincronizar progreso local con Firebase
export const syncLocalProgress = async () => {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    for (const [key, gameId] of Object.entries(GAME_IDS)) {
      const localKey = `best_${gameId}`;
      const localLevel = parseInt(localStorage.getItem(localKey) || '0', 10);
      
      if (localLevel > 0) {
        const currentBest = await getBestLevel(gameId);
        if (localLevel > currentBest) {
          await updateBestLevel(gameId, localLevel);
          localStorage.removeItem(localKey);
          console.log(`🔄 Sincronizado progreso ${gameId}: nivel ${localLevel}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error sincronizando progreso:', error);
  }
};

console.log('🎮 Progress System Web cargado');


