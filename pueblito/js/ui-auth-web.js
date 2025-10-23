/* ========================================
   🎨 UI AUTH WEB - Interfaz de Login y Ranking
   Componentes de UI para autenticación y ranking (versión web)
   ======================================== */

import { signInWithGoogle, signOutUser, setUserNick, getCurrentUser, getCurrentUserData } from './auth-system-web.js';
import { getTotalCandies, getRanking } from './candies-system-web.js';
import { updateBestLevel, getBestLevel } from './progress-system-web.js';

// Elementos del DOM
let loginModal = null;
let rankingModal = null;

// Inicializar UI de autenticación
export const initAuthUI = () => {
  console.log('🎨 Inicializando UI de autenticación (Web)...');
  
  // Crear botón de login en el header
  createLoginButton();
  
  // Crear modales
  createLoginModal();
  createRankingModal();
  
  // Actualizar UI inicial
  updateAuthUI();
};

// Crear botón de login
const createLoginButton = () => {
  const header = document.querySelector('header');
  if (!header) return;
  
  const loginBtn = document.createElement('button');
  loginBtn.id = 'login-btn';
  loginBtn.className = 'btn btn-primary';
  loginBtn.style.cssText = `
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    z-index: 1000;
  `;
  loginBtn.innerHTML = '🔐 Entrar';
  loginBtn.onclick = showLoginModal;
  
  header.appendChild(loginBtn);
};

// Crear modal de login
const createLoginModal = () => {
  loginModal = document.createElement('div');
  loginModal.id = 'login-modal';
  loginModal.className = 'modal-overlay';
  loginModal.innerHTML = `
    <div class="modal-content" style="max-width: 400px; text-align: center;">
      <div class="modal-header">
        <h2 style="margin: 0; color: #d900ff;">🎮 Los Mundos de Aray</h2>
        <button id="login-modal-close" class="btn btn-outline" style="position: absolute; top: 1rem; right: 1rem; padding: 4px 6px; color: #d900ff; font-weight: 900; font-size: 1.2rem; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin: 2rem 0;">
          <img src="assets/img/logo.png" alt="Aray" style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 1rem;">
        </div>
        <p style="margin-bottom: 2rem; color: #666; font-size: 1.1rem; font-weight: 500;">Inicia sesión para guardar y ver tu ranking</p>
        <p style="margin-bottom: 2rem; color: #999; font-size: 0.9rem;">Se guardarán tus caramelos y tu progreso entre dispositivos.</p>
        <button id="google-signin-btn" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">
          <span style="margin-right: 0.5rem;">🔐</span>
          Entrar con Google
        </button>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #999;">
          Al iniciar sesión, aceptas nuestros términos de uso
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(loginModal);
  
  // Event listeners
  document.getElementById('login-modal-close').onclick = hideLoginModal;
  document.getElementById('google-signin-btn').onclick = handleGoogleSignIn;
};

// Crear modal de ranking
const createRankingModal = () => {
  rankingModal = document.createElement('div');
  rankingModal.id = 'ranking-modal';
  rankingModal.className = 'modal-overlay';
  rankingModal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2 style="margin: 0; color: #d900ff;">🏆 Ranking Global</h2>
        <button id="ranking-modal-close" class="btn btn-outline" style="position: absolute; top: 1rem; right: 1rem; padding: 4px 6px; color: #d900ff; font-weight: 900; font-size: 1.2rem; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>
      <div class="modal-body">
        <div id="ranking-content" style="max-height: 400px; overflow-y: auto;">
          <div class="loading" style="text-align: center; padding: 2rem;">
            <p>Cargando ranking...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(rankingModal);
};

// Mostrar modal de login
export const showLoginModal = () => {
  if (!loginModal) {
    createLoginModal();
  }
  
  loginModal.style.display = 'flex';
  
  // Event listeners
  document.getElementById('login-modal-close').onclick = hideLoginModal;
  document.getElementById('google-signin-btn').onclick = handleGoogleSignIn;
};

// Ocultar modal de login
export const hideLoginModal = () => {
  if (loginModal) {
    loginModal.style.display = 'none';
  }
};

// Mostrar modal de ranking
export const showRankingModal = async () => {
  const user = getCurrentUser();
  
  // Si no está autenticado, mostrar modal de login
  if (!user) {
    showLoginModal();
    return;
  }
  
  if (!rankingModal) {
    rankingModal = createRankingModal();
  }
  
  rankingModal.style.display = 'flex';
  
  // Cargar ranking
  await loadRanking();
  
  // Event listeners
  document.getElementById('ranking-modal-close').onclick = () => {
    rankingModal.style.display = 'none';
  };
};

// Cargar y mostrar ranking
const loadRanking = async () => {
  const content = document.getElementById('ranking-content');
  content.innerHTML = '<div class="loading" style="text-align: center; padding: 2rem;"><p>Cargando ranking...</p></div>';

  try {
    const ranking = await getRanking(20);
    
    if (ranking.length === 0) {
      content.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;"><p>No hay datos de ranking disponibles</p></div>';
      return;
    }
    
    let html = '<div class="ranking-list">';
    ranking.forEach((user, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
      
      html += `
        <div class="ranking-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; margin: 0.5rem 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #d900ff;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 1.2rem; margin-right: 0.8rem; min-width: 2rem;">${medal}</span>
            <span style="font-weight: 600; color: #333;">${user.nick}</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="color: #d900ff; font-weight: 600;">🍬 ${user.candiesTotal}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    content.innerHTML = html;
  } catch (error) {
    content.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;"><p>Error cargando ranking</p></div>';
  }
};

// Mostrar configuración de nick
const showNickSetup = () => {
  const userData = getCurrentUserData();
  if (!userData || userData.nick) return;
  
  // Crear modal de nick
  const nickModal = document.createElement('div');
  nickModal.id = 'nick-modal';
  nickModal.className = 'modal-overlay';
  nickModal.innerHTML = `
    <div class="modal-content" style="max-width: 400px; text-align: center;">
      <div class="modal-header">
        <h2 style="margin: 0; color: #d900ff;">🎮 Elige tu Nick</h2>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 1.5rem; color: #666;">Elige un nombre único para aparecer en el ranking</p>
        <input type="text" id="nick-input" placeholder="Tu nick aquí..." style="
          width: 100%;
          padding: 1rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          text-align: center;
        " value="${userData.displayName || ''}">
        <div id="nick-error" style="color: #ff4444; margin-bottom: 1rem; display: none;"></div>
        <button id="save-nick-btn" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">
          💾 Guardar Nick
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(nickModal);
  nickModal.style.display = 'flex';
  
  const nickInput = document.getElementById('nick-input');
  const saveBtn = document.getElementById('save-nick-btn');
  const errorDiv = document.getElementById('nick-error');
  
  const saveNick = async () => {
    const nick = nickInput.value.trim();
    if (!nick) {
      errorDiv.textContent = 'Por favor, introduce un nick';
      errorDiv.style.display = 'block';
      return;
    }
    
    if (nick.length < 3) {
      errorDiv.textContent = 'El nick debe tener al menos 3 caracteres';
      errorDiv.style.display = 'block';
      return;
    }
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
    
    try {
      const result = await setUserNick(nick);
      if (result.success) {
        document.body.removeChild(nickModal);
      } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Guardar Nick';
      }
    } catch (error) {
      errorDiv.textContent = 'Error: ' + error.message;
      errorDiv.style.display = 'block';
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Guardar Nick';
    }
  };
  
  saveBtn.onclick = saveNick;
  nickInput.onkeypress = (e) => {
    if (e.key === 'Enter') saveNick();
  };
  
  // Focus en el input
  setTimeout(() => nickInput.focus(), 100);
};

// Actualizar menú de usuario
const updateUserMenu = (user, userData) => {
  const userInfo = document.getElementById('user-info');
  const loginBtn = document.getElementById('login-btn');

  if (user && userData) {
    // Usuario autenticado
    if (loginBtn) {
      loginBtn.innerHTML = `👤 ${userData.nick || user.displayName || 'Usuario'}`;
      loginBtn.onclick = () => {
        // Mostrar menú de usuario
        showUserMenu(user, userData);
      };
    }
    
    // Mostrar configuración de nick si no tiene
    if (!userData.nick) {
      setTimeout(() => showNickSetup(), 1000);
    }
  } else {
    // Usuario no autenticado
    if (loginBtn) {
      loginBtn.innerHTML = '🔐 Entrar';
      loginBtn.onclick = showLoginModal;
    }
  }
};

// Mostrar menú de usuario
const showUserMenu = (user, userData) => {
  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.style.cssText = `
    position: absolute;
    top: 3rem;
    right: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 1rem;
    min-width: 200px;
    z-index: 1001;
  `;
  
  menu.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <p style="margin: 0; font-weight: 600; color: #333;">${userData.nick || user.displayName}</p>
      <p style="margin: 0; font-size: 0.9rem; color: #666;">🍬 ${getTotalCandies()} caramelos</p>
    </div>
    <button class="btn btn-outline" onclick="showRankingModal()" style="width: 100%; margin-bottom: 0.5rem;">
      🏆 Ver Ranking
    </button>
    <button class="btn btn-outline" onclick="signOutUser()" style="width: 100%;">
      🚪 Cerrar Sesión
    </button>
  `;
  
  document.body.appendChild(menu);
  
  // Cerrar menú al hacer click fuera
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target.id !== 'login-btn') {
        document.body.removeChild(menu);
      }
    }, { once: true });
  }, 100);
};

// Manejar login con Google
const handleGoogleSignIn = async () => {
  const btn = document.getElementById('google-signin-btn');
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<span style="margin-right: 0.5rem;">⏳</span>Iniciando sesión...';
  
  try {
    const result = await signInWithGoogle();
    if (result.success) {
      hideLoginModal();
      updateAuthUI();
    } else {
      alert('Error al iniciar sesión: ' + result.error);
    }
  } catch (error) {
    alert('Error al iniciar sesión: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};

// Actualizar UI de autenticación
export const updateAuthUI = () => {
  const user = getCurrentUser();
  const userData = getCurrentUserData();
  updateUserMenu(user, userData);
};

// Función para mostrar toast
export const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 500;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
};

// Hacer funciones disponibles globalmente
window.showRankingModal = showRankingModal;
window.signOutUser = signOutUser;

console.log('🎨 UI Auth Web cargado');





