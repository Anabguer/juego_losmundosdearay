/* ========================================
   🍬 CANDIES SYSTEM WEB - Sistema de caramelos
   Gestión de caramelos y ranking global
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
import { db, addToSyncQueue, isOnline } from './firebase-web.js';
import { getCurrentUser, getCurrentUserData } from './auth-system-web.js';

// Cache local de caramelos
let localCandies = 0;

// Obtener total de caramelos
export const getTotalCandies = () => {
  const user = getCurrentUser();
  if (user) {
    const userData = getCurrentUserData();
    return userData ? userData.candiesTotal : 0;
  }
  return localCandies;
};

// Añadir caramelos
export const addCandies = async (amount = 1) => {
  const user = getCurrentUser();
  
  if (!user) {
    // Modo offline - guardar localmente
    localCandies += amount;
    localStorage.setItem('localCandies', localCandies.toString());
    console.log(`🍬 +${amount} caramelos (offline). Total local: ${localCandies}`);
    return { success: true, total: localCandies };
  }
  
  try {
    const userRef = doc(db, 'users', user.uid);
    
    if (isOnline()) {
      // Online - actualizar directamente
      await updateDoc(userRef, {
        candiesTotal: increment(amount),
        lastSeen: serverTimestamp()
      });
      
      // Actualizar cache local
      const userData = getCurrentUserData();
      if (userData) {
        userData.candiesTotal += amount;
      }
      
      console.log(`🍬 +${amount} caramelos (online). Total: ${getTotalCandies()}`);
    } else {
      // Offline - añadir a cola de sincronización
      addToSyncQueue(async () => {
        await updateDoc(userRef, {
          candiesTotal: increment(amount),
          lastSeen: serverTimestamp()
        });
      });
      
      // Actualizar cache local
      const userData = getCurrentUserData();
      if (userData) {
        userData.candiesTotal += amount;
      }
      
      console.log(`🍬 +${amount} caramelos (offline, en cola). Total: ${getTotalCandies()}`);
    }
    
    return { success: true, total: getTotalCandies() };
  } catch (error) {
    console.error('❌ Error añadiendo caramelos:', error);
    return { success: false, error: error.message };
  }
};

// Obtener ranking global
export const getRanking = async (limitCount = 20) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('candiesTotal', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const ranking = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nick && data.candiesTotal > 0) {
        ranking.push({
          nick: data.nick,
          candiesTotal: data.candiesTotal,
          uid: doc.id
        });
      }
    });
    
    console.log(`🏆 Ranking cargado: ${ranking.length} usuarios`);
    return ranking;
  } catch (error) {
    console.error('❌ Error cargando ranking:', error);
    return [];
  }
};

// Sincronizar caramelos locales con Firebase
export const syncLocalCandies = async () => {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const localCandiesStr = localStorage.getItem('localCandies');
    if (localCandiesStr) {
      const localAmount = parseInt(localCandiesStr, 10);
      if (localAmount > 0) {
        await addCandies(localAmount);
        localStorage.removeItem('localCandies');
        localCandies = 0;
        console.log(`🔄 Sincronizados ${localAmount} caramelos locales`);
      }
    }
  } catch (error) {
    console.error('❌ Error sincronizando caramelos:', error);
  }
};

console.log('🍬 Candies System Web cargado');





