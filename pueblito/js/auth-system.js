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
} from 'firebase/auth';
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
} from 'firebase/firestore';
import { auth, db, addToSyncQueue } from './firebase-config.js';

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
      clientId: '439019722673-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Se actualizará con el client ID web
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
  const userRef = doc(db, 'users', user.uid);
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
  } else {
    currentUser = null;
    userData = null;
    console.log('👤 Usuario desautenticado');
  }
  
  notifyAuthCallbacks();
});

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  initializeGoogleAuth();
});
