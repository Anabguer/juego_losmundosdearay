/* ========================================
   🍬 CANDIES SYSTEM - Sistema de Caramelos y Ranking
   Gestión de caramelos, ranking global y sincronización offline
   ======================================== */

import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, addToSyncQueue, isOnline } from './firebase-config.js';
import { getCurrentUser, getCurrentUserData } from './auth-system.js';

// Cache local de caramelos
let localCandies = 0;

// Función para añadir caramelos
export const addCandies = async (amount) => {
  if (!amount || amount <= 0) return;
  
  const user = getCurrentUser();
  const userData = getCurrentUserData();
  
  if (!user || !userData) {
    console.warn('⚠️ Usuario no autenticado, guardando localmente');
    localCandies += amount;
    localStorage.setItem('aray_local_candies', localCandies.toString());
    return;
  }
  
  // Actualizar localmente inmediatamente
  localCandies += amount;
  localStorage.setItem('aray_local_candies', localCandies.toString());
  
  // Operación para sincronizar con Firebase
  const syncOperation = {
    type: 'addCandies',
    execute: async () => {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        candiesTotal: increment(amount),
        lastSeen: serverTimestamp()
      });
      
      // Actualizar datos locales
      userData.candiesTotal += amount;
      console.log(`🍬 +${amount} caramelos sincronizados`);
    }
  };
  
  if (isOnline) {
    try {
      await syncOperation.execute();
    } catch (error) {
      console.error('❌ Error sincronizando caramelos:', error);
      addToSyncQueue(syncOperation);
    }
  } else {
    addToSyncQueue(syncOperation);
  }
};

// Función para obtener caramelos totales
export const getTotalCandies = () => {
  const userData = getCurrentUserData();
  if (userData) {
    return userData.candiesTotal || 0;
  }
  return parseInt(localStorage.getItem('aray_local_candies') || '0', 10);
};

// Función para obtener ranking global (Top 20)
export const getGlobalRanking = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      orderBy('candiesTotal', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const ranking = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      ranking.push({
        uid: doc.id,
        nick: data.nick || data.displayName || 'Usuario',
        candiesTotal: data.candiesTotal || 0,
        photoURL: data.photoURL
      });
    });
    
    return ranking;
    
  } catch (error) {
    console.error('❌ Error obteniendo ranking:', error);
    return [];
  }
};

// Función para obtener posición del usuario en el ranking
export const getUserRankingPosition = async () => {
  const user = getCurrentUser();
  const userData = getCurrentUserData();
  
  if (!user || !userData) return null;
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      orderBy('candiesTotal', 'desc')
    );
    
    const snapshot = await getDocs(q);
    let position = 1;
    
    for (const doc of snapshot.docs) {
      if (doc.id === user.uid) {
        return {
          position,
          totalUsers: snapshot.size,
          candiesTotal: userData.candiesTotal || 0
        };
      }
      position++;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error obteniendo posición:', error);
    return null;
  }
};

// Función para sincronizar caramelos locales con Firebase
export const syncLocalCandies = async () => {
  const user = getCurrentUser();
  if (!user) return;
  
  const localAmount = parseInt(localStorage.getItem('aray_local_candies') || '0', 10);
  if (localAmount <= 0) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      candiesTotal: increment(localAmount),
      lastSeen: serverTimestamp()
    });
    
    // Limpiar cache local
    localStorage.removeItem('aray_local_candies');
    localCandies = 0;
    
    console.log(`🍬 ${localAmount} caramelos locales sincronizados`);
    
  } catch (error) {
    console.error('❌ Error sincronizando caramelos locales:', error);
  }
};

// Inicializar cache local
const initLocalCandies = () => {
  localCandies = parseInt(localStorage.getItem('aray_local_candies') || '0', 10);
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initLocalCandies);
