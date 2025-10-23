/* ========================================
   🔐 AUTH SYSTEM WEB - Google Sign-In + Firebase
   Sistema de autenticación para navegador web
   ======================================== */

import { 
  signInWithCredential, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
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
import { auth, db, addToSyncQueue } from './firebase-web.js';

// Estado global del usuario
let currentUser = null;
let userData = null;

// Inicializar Google Auth (versión web)
export const initializeGoogleAuth = async () => {
  try {
    // En web, usamos el popup de Google directamente
    console.log('✅ Google Auth Web inicializado');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Google Auth Web:', error);
    return false;
  }
};

// Función de login con Google (versión web)
export const signInWithGoogle = async () => {
  try {
    console.log('🔐 Iniciando login con Google (Web)...');
    
    // Crear provider de Google
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    // Abrir popup de Google
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log('✅ Login exitoso:', user.email);
    
    // Crear o actualizar perfil de usuario
    await createUserProfile(user);
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ Error en login:', error);
    return { success: false, error: error.message };
  }
};

// Función para cerrar sesión
export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
    currentUser = null;
    userData = null;
    console.log('✅ Sesión cerrada');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    return { success: false, error: error.message };
  }
};

// Crear perfil de usuario si no existe
const createUserProfile = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Crear nuevo usuario
      await setDoc(userRef, {
        nick: null,
        candiesTotal: 0,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        settings: {
          lastGameId: null
        }
      });
      console.log('✅ Nuevo usuario creado:', user.uid);
    } else {
      // Actualizar lastSeen
      await updateDoc(userRef, {
        lastSeen: serverTimestamp()
      });
    }
    
    // Cargar datos del usuario
    await loadUserData(user);
  } catch (error) {
    console.error('❌ Error creando perfil:', error);
  }
};

// Cargar datos del usuario
const loadUserData = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      userData = userSnap.data();
      currentUser = user;
      console.log('✅ Datos de usuario cargados:', userData);
    }
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
  }
};

// Establecer nick del usuario
export const setUserNick = async (nick) => {
  try {
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    const lowerNick = nick.toLowerCase();
    const nickRef = doc(db, 'nicks', lowerNick);
    
    // Verificar si el nick ya existe
    const nickSnap = await getDoc(nickRef);
    if (nickSnap.exists()) {
      return { success: false, error: 'Ese nick ya está en uso' };
    }
    
    // Crear reserva de nick
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
    
    // Actualizar datos locales
    if (userData) {
      userData.nick = nick;
    }
    
    console.log('✅ Nick establecido:', nick);
    return { success: true };
  } catch (error) {
    console.error('❌ Error estableciendo nick:', error);
    return { success: false, error: error.message };
  }
};

// Obtener usuario actual
export const getCurrentUser = () => currentUser;

// Obtener datos del usuario actual
export const getCurrentUserData = () => userData;

// Inicializar listener de autenticación
export const initializeAuth = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('👤 Usuario autenticado:', user.email);
      await loadUserData(user);
    } else {
      console.log('👤 Usuario no autenticado');
      currentUser = null;
      userData = null;
    }
  });
};

console.log('🔐 Auth System Web cargado');
