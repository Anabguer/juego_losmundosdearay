/* ========================================
   🔐 AUTH SYSTEM - Google Sign-In + Firebase
   Sistema de autenticación completo
   ======================================== */

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { 
  signInWithCredential, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db, addToSyncQueue } from './firebase-config.js';
import { getUserRef, getNickRef, APP_ID } from './firebase-constants.js';
import { syncToFirebase } from './storage.js';

// Estado global del usuario
let currentUser = null;
let userData = null;

// Callbacks para cambios de estado
const authCallbacks = [];

export const onAuthChange = (callback) => {
  authCallbacks.push(callback);
  if (currentUser) callback(currentUser, userData);
};

// Inicializar Google Auth
export const initializeGoogleAuth = async () => {
  try {
    await GoogleAuth.initialize({
      clientId: '989954746255-e6gfghahanjo4q8vggkuoafvk2iov6n0.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log('✅ Google Auth inicializado');
  } catch (error) {
    console.error('❌ Error inicializando Google Auth:', error);
  }
};

// Login con Google
export const signInWithGoogle = async () => {
  try {
    console.log('🔐 Iniciando login con Google...');
    
    // Login nativo con Capacitor
    const result = await GoogleAuth.signIn();
    console.log('✅ Login Google exitoso:', result);
    
    // Crear credencial de Firebase
    const credential = GoogleAuthProvider.credential(result.authentication.idToken);
    
    // Autenticar con Firebase
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;
    
    console.log('✅ Usuario autenticado:', user.uid);
    
    // Crear o actualizar usuario en Firestore
    await createOrUpdateUser(user);
    
    // Migrar datos de invitado a Firebase después del login
    // IMPORTANTE: Ejecutar PRIMERO para evitar que otras sincronizaciones sobrescriban
    console.log('🔄 Migrando datos de invitado a Firebase PRIMERO...');
    setTimeout(async () => {
      try {
        console.log('📤 EJECUTANDO syncToFirebase() inmediatamente después del login...');
        await syncToFirebase();
        console.log('✅ Migración de datos de invitado completada - Firebase actualizado');
      } catch (error) {
        console.warn('⚠️ Error en migración de datos:', error);
      }
    }, 500); // Reducir a 500ms para ejecutar ANTES que initAutoSync
    
    return { success: true, user };
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    return { success: false, error: error.message };
  }
};

// Logout
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    await GoogleAuth.signOut();
    currentUser = null;
    userData = null;
    notifyAuthCallbacks();
    console.log('✅ Logout exitoso');
  } catch (error) {
    console.error('❌ Error en logout:', error);
  }
};

// Crear o actualizar usuario en Firestore
const createOrUpdateUser = async (user) => {
  const userRef = getUserRef(db, user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Usuario nuevo - crear documento
    const newUserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Usuario',
      photoURL: user.photoURL,
      candiesTotal: 0,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      settings: {
        lastGameId: null
      }
    };
    
    await setDoc(userRef, newUserData);
    userData = newUserData;
    console.log('✅ Usuario creado:', newUserData);
  } else {
    // Usuario existente - actualizar lastSeen
    await updateDoc(userRef, {
      lastSeen: serverTimestamp()
    });
    userData = userSnap.data();
    console.log('✅ Usuario actualizado:', userData);
  }
};

// Verificar si un nick está disponible
export const isNickAvailable = async (nick) => {
  if (!nick || nick.length < 3) return false;
  
  const lowerNick = nick.toLowerCase().trim();
  const nickRef = doc(db, 'nicks', lowerNick);
  const nickSnap = await getDoc(nickRef);
  
  return !nickSnap.exists();
};

// Establecer nick del usuario
export const setUserNick = async (nick) => {
  if (!currentUser) throw new Error('Usuario no autenticado');
  
  const lowerNick = nick.toLowerCase().trim();
  
  // Verificar disponibilidad
  const available = await isNickAvailable(nick);
  if (!available) {
    throw new Error('Nick no disponible');
  }
  
  try {
    // Crear reserva de nick
    const nickRef = doc(db, 'nicks', lowerNick);
    await setDoc(nickRef, {
      uid: currentUser.uid,
      nick: nick,
      createdAt: serverTimestamp()
    });
    
    // Actualizar usuario
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      nick: nick
    });
    
    userData.nick = nick;
    notifyAuthCallbacks();
    
    console.log('✅ Nick establecido:', nick);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error estableciendo nick:', error);
    return { success: false, error: error.message };
  }
};

// Obtener datos del usuario actual
export const getCurrentUser = () => currentUser;
export const getCurrentUserData = () => userData;

// Notificar cambios de autenticación
const notifyAuthCallbacks = () => {
  authCallbacks.forEach(callback => {
    try {
      callback(currentUser, userData);
    } catch (error) {
      console.error('❌ Error en callback de auth:', error);
    }
  });
};

// Escuchar cambios de autenticación
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    
    // Cargar datos del usuario
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      userData = userSnap.data();
    }
    
    console.log('👤 Usuario autenticado:', user.uid);
    
    // Migrar datos de invitado a Firebase cuando se detecta el login
    // Solo si hay GameBridge disponible (modo Android)
    if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
      console.log('🔄 Detectado login - migrando datos de invitado a Firebase PRIMERO...');
      // IMPORTANTE: Ejecutar INMEDIATAMENTE para evitar que syncBidirectional sobrescriba
      setTimeout(async () => {
        try {
          console.log('📤 EJECUTANDO syncToFirebase() para subir datos de invitado ANTES de cualquier otra sincronización...');
          await syncToFirebase();
          console.log('✅ Migración de datos de invitado completada - Firebase actualizado con datos de invitado');
        } catch (error) {
          console.warn('⚠️ Error en migración de datos:', error);
        }
      }, 500); // Reducir a 500ms para ejecutar ANTES que syncBidirectional
    }
  } else {
    // Usuario desautenticado - resetear datos si estamos en Android
    const wasLoggedIn = currentUser !== null;
    currentUser = null;
    userData = null;
    console.log('👤 Usuario desautenticado');
    
    // Si había un usuario logueado antes y ahora no lo hay, resetear datos
    if (wasLoggedIn && window.GameBridge && typeof window.resetDataOnLogout === 'function') {
      console.log('🔄 Usuario cerró sesión - reseteando datos de localStorage...');
      window.resetDataOnLogout();
    }
  }
  
  notifyAuthCallbacks();
});

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  initializeGoogleAuth();
});
