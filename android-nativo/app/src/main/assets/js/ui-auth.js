/* ========================================
   🎨 UI AUTH - Interfaz de Login y Ranking
   Componentes de UI para autenticación y ranking
   ======================================== */

import { signInWithGoogle, signOut, onAuthChange, setUserNick, getCurrentUser, getCurrentUserData } from './auth-system.js';
import { getTotalCandies, getGlobalRanking, getUserRankingPosition } from './candies-system.js';
import { getAllProgress } from './progress-system.js';

// Elementos del DOM
let loginModal = null;
let rankingModal = null;
let userMenu = null;

// Crear modal de login
const createLoginModal = () => {
  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px; text-align: center;">
      <div class="modal-header">
        <h2 style="margin: 0; color: #d900ff;">🌟 Los Mundos de Aray</h2>
        <button id="login-modal-close" class="modal-close">✕</button>
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
          También puedes jugar sin cuenta, pero tu progreso no se guardará
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
};

// Crear modal de ranking
const createRankingModal = () => {
  const modal = document.createElement('div');
  modal.id = 'ranking-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2 style="margin: 0; color: #d900ff;">🏆 Ranking Global</h2>
        <button id="ranking-modal-close" class="modal-close">✕</button>
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
  
  document.body.appendChild(modal);
  return modal;
};

// Crear menú de usuario
const createUserMenu = () => {
  const menu = document.createElement('div');
  menu.id = 'user-menu';
  menu.className = 'user-menu';
  menu.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 12px;
    border-radius: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
  `;
  
  menu.innerHTML = `
    <div id="user-info" style="display: none;">
      <img id="user-avatar" src="" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
      <span id="user-name" style="font-weight: bold; color: #333;"></span>
      <span id="user-candies" style="color: #d900ff; font-weight: bold;">🍬 0</span>
    </div>
    <button id="login-btn" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;">
      🔐 Entrar
    </button>
    <button id="settings-btn" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;">
      ⚙️ Ajustes
    </button>
    <button id="logout-btn" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem; display: none;">
      🚪 Salir
    </button>
  `;
  
  document.body.appendChild(menu);
  return menu;
};

// Mostrar modal de login
export const showLoginModal = () => {
  if (!loginModal) {
    loginModal = createLoginModal();
  }
  
  loginModal.style.display = 'flex';
  
  // Event listeners
  document.getElementById('login-modal-close').onclick = () => {
    loginModal.style.display = 'none';
  };
  
  document.getElementById('google-signin-btn').onclick = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      loginModal.style.display = 'none';
      showNickSetup();
    } else {
      alert('Error al iniciar sesión: ' + result.error);
    }
  };
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
    const ranking = await getGlobalRanking();
    const userPosition = await getUserRankingPosition();
    
    let html = '<div class="ranking-list">';
    
    ranking.forEach((user, index) => {
      const position = index + 1;
      const isCurrentUser = userPosition && user.uid === getCurrentUser()?.uid;
      
      html += `
        <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}" style="
          display: flex;
          align-items: center;
          padding: 12px;
          margin: 8px 0;
          background: ${isCurrentUser ? '#f0f0ff' : '#f9f9f9'};
          border-radius: 8px;
          border: ${isCurrentUser ? '2px solid #d900ff' : '1px solid #eee'};
        ">
          <div style="width: 40px; text-align: center; font-weight: bold; color: #d900ff;">
            ${position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : position}
          </div>
          <img src="${user.photoURL || 'assets/img/logo.png'}" alt="Avatar" style="
            width: 40px; height: 40px; border-radius: 50%; margin: 0 12px;
          ">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #333;">${user.nick}</div>
          </div>
          <div style="font-weight: bold; color: #d900ff; font-size: 1.1rem;">
            🍬 ${user.candiesTotal.toLocaleString()}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    if (userPosition && !ranking.find(u => u.uid === getCurrentUser()?.uid)) {
      html += `
        <div class="user-position" style="
          margin-top: 20px;
          padding: 12px;
          background: #f0f0ff;
          border-radius: 8px;
          text-align: center;
          border: 2px solid #d900ff;
        ">
          <p style="margin: 0; color: #d900ff; font-weight: bold;">
            Tu posición: #${userPosition.position} de ${userPosition.totalUsers} jugadores
          </p>
          <p style="margin: 5px 0 0 0; color: #666;">
            🍬 ${userPosition.candiesTotal.toLocaleString()} caramelos
          </p>
        </div>
      `;
    }
    
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
  const logoutBtn = document.getElementById('logout-btn');
  
  if (user && userData) {
    userInfo.style.display = 'flex';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    
    document.getElementById('user-avatar').src = userData.photoURL || 'assets/img/logo.png';
    document.getElementById('user-name').textContent = userData.nick || userData.displayName || 'Usuario';
    document.getElementById('user-candies').textContent = `🍬 ${getTotalCandies().toLocaleString()}`;
  } else {
    userInfo.style.display = 'none';
    loginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
  }
};

// Inicializar UI
export const initAuthUI = () => {
  // Crear elementos
  userMenu = createUserMenu();
  
  // Event listeners
  document.getElementById('login-btn').onclick = showLoginModal;
  document.getElementById('settings-btn').onclick = () => {
    // Importar y mostrar modal de ajustes
    import('./ui.js').then(module => {
      if (module.showSettingsModal) {
        module.showSettingsModal();
      }
    });
  };
  document.getElementById('logout-btn').onclick = signOut;
  
  // Escuchar cambios de autenticación
  onAuthChange(updateUserMenu);
  
  console.log('✅ UI de autenticación inicializada');
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initAuthUI);
