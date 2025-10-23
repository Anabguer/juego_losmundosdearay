/* ========================================
   🔥 FIREBASE WEB - Versión para navegador
   Configuración de Firebase para web (CDN)
   ======================================== */

// Importar Firebase desde CDN (compatible con navegador)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, enablePersistentCacheIndexAutoCreation } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración de Firebase (desde google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyCZ88_2qctO684sgo28uPWFLYgWqZ5qIHk",
  authDomain: "intocables13.firebaseapp.com",
  projectId: "intocables13",
  storageBucket: "intocables13.firebasestorage.app",
  messagingSenderId: "439019722673",
  appId: "1:439019722673:android:5a78cc103d7c93198c0f90"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Habilitar persistencia offline
try {
  enablePersistentCacheIndexAutoCreation(db);
  console.log('✅ Persistencia offline habilitada');
} catch (error) {
  console.log('⚠️ Persistencia offline ya habilitada o no disponible');
}

// Detectar si estamos en web o Capacitor
const isWeb = typeof window !== 'undefined' && !window.Capacitor;

// Cola de sincronización para modo offline
let syncQueue = [];

export const addToSyncQueue = (operation) => {
  syncQueue.push(operation);
  console.log('📝 Operación añadida a cola de sincronización:', operation);
};

export const processSyncQueue = async () => {
  if (syncQueue.length === 0) return;
  
  console.log(`🔄 Procesando ${syncQueue.length} operaciones pendientes...`);
  
  const operations = [...syncQueue];
  syncQueue = [];
  
  for (const operation of operations) {
    try {
      await operation();
      console.log('✅ Operación sincronizada:', operation);
    } catch (error) {
      console.error('❌ Error sincronizando operación:', error);
      // Re-añadir a la cola si falla
      syncQueue.push(operation);
    }
  }
};

// Detectar cambios de conectividad
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
  console.log('🌐 Conexión restaurada');
  processSyncQueue();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('📴 Sin conexión - modo offline');
});

export { isOnline };

// Función para verificar conectividad
export const checkConnectivity = () => {
  return isOnline;
};

console.log('🔥 Firebase Web configurado correctamente');





