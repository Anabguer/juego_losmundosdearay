/* ========================================
   🔐 AUTH - Sistema de autenticación
   - Login/Registro
   - Gestión de sesión (localStorage)
   - Integración con backend
   ======================================== */

const AUTH_STORAGE_KEY = 'aray_usuario';
const API_BASE = 'php/';

// Estado de autenticación
let currentUser = null;

// ========================================
// INICIALIZAR SESIÓN
// ========================================
export const initAuth = async () => {
  // Verificar si hay sesión guardada
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      
      // Verificar sesión con el servidor
      const response = await fetch(API_BASE + 'auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          usuario_key: user.key
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        currentUser = data.usuario;
        return currentUser;
      } else {
        // Sesión inválida
        logout();
      }
    } catch (e) {
      console.error('Error verificando sesión:', e);
      logout();
    }
  }
  
  return null;
};

// ========================================
// LOGIN
// ========================================
export const login = async (email, password) => {
  try {
    const response = await fetch(API_BASE + 'auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: email,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      currentUser = data.usuario;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      return { ok: true, usuario: currentUser };
    } else {
      return { ok: false, error: data.error };
    }
  } catch (e) {
    console.error('Error en login:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};

// ========================================
// REGISTRO
// ========================================
export const register = async (email, nombre, nick, password) => {
  try {
    const response = await fetch(API_BASE + 'auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        email: email,
        nombre: nombre,
        nick: nick,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      currentUser = data.usuario;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      return { ok: true, usuario: currentUser };
    } else {
      return { ok: false, error: data.error };
    }
  } catch (e) {
    console.error('Error en registro:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};

// ========================================
// LOGOUT
// ========================================
export const logout = () => {
  currentUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// ========================================
// OBTENER USUARIO ACTUAL
// ========================================
export const getCurrentUser = () => {
  return currentUser;
};

// ========================================
// VERIFICAR SI ESTÁ LOGUEADO
// ========================================
export const isLoggedIn = () => {
  return currentUser !== null;
};

// ========================================
// GUARDAR SCORE
// ========================================
export const saveScore = async (juegoSlug, puntuacion, nivel, tiempo, monedas, metadata = null) => {
  if (!isLoggedIn()) {
    return { ok: false, error: 'No has iniciado sesión' };
  }
  
  try {
    const response = await fetch(API_BASE + 'ranking.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_score',
        usuario_key: currentUser.key,
        juego: juegoSlug,
        puntuacion: puntuacion,
        nivel: nivel,
        tiempo: tiempo,
        monedas: monedas,
        metadata: metadata
      })
    });
    
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error guardando score:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};

// ========================================
// OBTENER RANKING GLOBAL
// ========================================
export const getRankingGlobal = async () => {
  try {
    const response = await fetch(API_BASE + 'ranking.php?action=ranking_global');
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error obteniendo ranking:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};

// ========================================
// OBTENER RANKING POR JUEGO
// ========================================
export const getRankingJuego = async (juegoSlug) => {
  try {
    const response = await fetch(API_BASE + `ranking.php?action=ranking_juego&juego=${juegoSlug}`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error obteniendo ranking del juego:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};

// ========================================
// OBTENER MIS SCORES
// ========================================
export const getMisScores = async () => {
  if (!isLoggedIn()) {
    return { ok: false, error: 'No has iniciado sesión' };
  }
  
  try {
    const response = await fetch(API_BASE + `ranking.php?action=mis_scores&usuario_key=${currentUser.key}`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error obteniendo mis scores:', e);
    return { ok: false, error: 'Error de conexión' };
  }
};

