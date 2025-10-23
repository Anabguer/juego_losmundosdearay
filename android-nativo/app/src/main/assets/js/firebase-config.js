/* ========================================
   🔥 FIREBASE CONFIGURATION
   Configuración de Firebase Auth + Firestore
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// Habilitar persistencia offline
try {
  enablePersistentCacheIndexAutoCreation(db);
  console.log('✅ Persistencia offline habilitada');
} catch (error) {
  console.log('⚠️ Persistencia offline ya habilitada o no disponible');
}

// Configurar modo offline
let isOnline = navigator.onLine;

// Función para manejar cambios de conectividad
const handleOnlineStatus = () => {
  isOnline = navigator.onLine;
  if (isOnline) {
    enableNetwork(db);
    console.log('🌐 Conectado - Sincronizando datos...');
    // Aquí se ejecutará la cola de sincronización
    syncPendingData();
  } else {
    disableNetwork(db);
    console.log('📱 Modo offline - Datos en caché');
  }
};

// Escuchar cambios de conectividad
window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOnlineStatus);

// Cola de sincronización para datos pendientes
let pendingSyncQueue = [];

export const addToSyncQueue = (operation) => {
  pendingSyncQueue.push(operation);
  console.log(`📝 Operación añadida a cola: ${operation.type}`);
};

export const syncPendingData = async () => {
  if (!isOnline || pendingSyncQueue.length === 0) return;
  
  console.log(`🔄 Sincronizando ${pendingSyncQueue.length} operaciones...`);
  
  const queue = [...pendingSyncQueue];
  pendingSyncQueue = [];
  
  for (const operation of queue) {
    try {
      await operation.execute();
      console.log(`✅ Sincronizado: ${operation.type}`);
    } catch (error) {
      console.error(`❌ Error sincronizando ${operation.type}:`, error);
      // Re-añadir a la cola si falla
      pendingSyncQueue.push(operation);
    }
  }
};

// Inicializar estado de conectividad
handleOnlineStatus();

export default app;
