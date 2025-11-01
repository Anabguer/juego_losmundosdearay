/* ========================================
   🎨 UI - Utilidades de interfaz común
   ======================================== */

import { getCoins, getEnergy, getCandies } from './storage.js';

// ========== PANTALLA COMPLETA ==========
export const enterFullscreen = (element = document.documentElement) => {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

export const toggleFullscreen = () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
};

// ========== TOAST ==========
let toastTimeout;

export const toast = (message, duration = 2500) => {
  let toastEl = document.getElementById('toast');
  
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  
  clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
};

// === Modal robusta sin dependencias ===
export function showModal(title, contentNode, addToStack = true) {
  // Si addToStack es true, guardar el modal actual en el stack antes de mostrar el nuevo
  if (addToStack) {
    const currentModal = document.getElementById('modal-root');
    if (currentModal) {
      const currentTitle = currentModal.querySelector('h2')?.textContent || '';
      const currentContent = currentModal.querySelector('.modal-content')?.cloneNode(true);
      if (currentContent) {
        modalStack.push({ title: currentTitle, content: currentContent });
      }
    }
  }
  
  // elimina una anterior si existe (sin manejar stack)
  const existingRoot = document.getElementById('modal-root');
  if (existingRoot) existingRoot.remove();
  window.removeEventListener('keydown', escCloser);

  const root = document.createElement('div');
  root.id = 'modal-root';
  root.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center; z-index: 9999;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    width: min(520px, 92vw);
    background: #fff; border-radius: 16px; padding: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,.3); color: #333;
  `;
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom: 10px;">
      <h2 style="margin:0; font-size:20px; font-weight:900; color:#333;">${title || ''}</h2>
      <button id="modal-x" class="btn btn-outline" style="padding:0 !important; color:#d900ff; font-weight:900; font-size:1.2rem; width:24px !important; height:24px !important; border-radius:50% !important; display:flex !important; align-items:center !important; justify-content:center !important; min-width:24px !important; max-width:24px !important; border:none !important; background:rgba(255,255,255,0.25) !important;">✕</button>
    </div>
  `;
  // Agregar clase modal-content al contenido
  contentNode.classList.add('modal-content');
  card.appendChild(contentNode);
  root.appendChild(card);
  document.body.appendChild(root);

  document.getElementById('modal-x')?.addEventListener('click', hideModal);
  root.addEventListener('click', (e)=>{
    if(e.target === root) hideModal();
  });

  // Esc para cerrar
  window.addEventListener('keydown', escCloser);
  
  // Asegurar que el avatar del pueblo esté oculto cuando se muestra cualquier modal
  setTimeout(() => {
    const avatar = document.querySelector('.avatar');
    if (avatar) {
      avatar.style.display = 'none';
      avatar.style.visibility = 'hidden';
      avatar.style.opacity = '0';
      avatar.style.pointerEvents = 'none';
      avatar.style.zIndex = '-1';
    }
  }, 10);
}
function escCloser(e){ if(e.key==='Escape') hideModal(); }

// Stack de modales para manejar modales apilados
let modalStack = [];

// Función para restaurar event listeners específicos del modal
function restoreModalEventListeners(modalTitle) {
  
  // Si es un modal de juego (contiene botón modal-play-btn)
  const playBtn = document.getElementById('modal-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', (event) => {
      // Obtener la ruta ANTES de cerrar el modal
      const gameRoute = event.target.getAttribute('data-game-route') || 'skate.html';
      
      try { hideModal(); } catch(e) {
        const mr=document.getElementById('modal-root'); if(mr) mr.remove();
      }
      playSound('click');
      
      // Notificar que se va a jugar un juego (para anuncios)
      if (window.GameBridge && window.GameBridge.onGamePlayed) {
        try {
          window.GameBridge.onGamePlayed();
        } catch(e) {
          // Error silencioso
        }
      }
      
      // Navegar a la página HTML del juego
      window.location.href = gameRoute;
    });
  }
  
  // Si es un modal de ranking (contiene botón btn-ranking-modal)
  const rankingBtn = document.getElementById('btn-ranking-modal');
  if (rankingBtn) {
    rankingBtn.addEventListener('click', async () => {
      playSound('click');
      // Obtener información del juego desde el botón
      const gameType = rankingBtn.getAttribute('data-game-type') || 'skate';
      const gameName = rankingBtn.getAttribute('data-game-name') || 'Skate Park';
      
      // Verificar que la función esté disponible
      if (window.showGameRankingModal) {
        await window.showGameRankingModal(gameType, gameName);
      } else {
        console.error('❌ showGameRankingModal no está disponible');
      }
    });
  }
  
  // Si es un modal de ranking específico (contiene botón btn-close-game-ranking)
  const closeRankingBtn = document.getElementById('btn-close-game-ranking');
  if (closeRankingBtn) {
    closeRankingBtn.addEventListener('click', () => {
      hideModal();
    });
  }
}

export function hideModal() {
  const root = document.getElementById('modal-root');
  if (root) root.remove();
  window.removeEventListener('keydown', escCloser);
  
  // Si hay modales en el stack, mostrar el anterior
  if (modalStack.length > 0) {
    const previousModal = modalStack.pop();
    
    // Crear el modal anterior directamente sin usar showModal para evitar recursión
    const newRoot = document.createElement('div');
    newRoot.id = 'modal-root';
    newRoot.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width: min(520px, 92vw);
      background: #fff; border-radius: 16px; padding: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,.3); color: #333;
    `;
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <h2 style="margin:0; font-size:20px; font-weight:900; color:#333;">${previousModal.title || ''}</h2>
        <button id="modal-x" class="btn btn-outline" style="padding:0 !important; color:#d900ff; font-weight:900; font-size:1.2rem; width:24px !important; height:24px !important; border-radius:50% !important; display:flex !important; align-items:center !important; justify-content:center !important; min-width:24px !important; max-width:24px !important; border:none !important; background:rgba(255,255,255,0.25) !important;">✕</button>
      </div>
    `;
    card.appendChild(previousModal.content);
    newRoot.appendChild(card);
    document.body.appendChild(newRoot);

    document.getElementById('modal-x')?.addEventListener('click', hideModal);
    newRoot.addEventListener('click', (e)=>{
      if (e.target === newRoot) hideModal();
    });
    window.addEventListener('keydown', escCloser);
    
    // Restaurar event listeners específicos del modal
    restoreModalEventListeners(previousModal.title);
    
    // Ocultar avatar
    setTimeout(() => {
      const avatar = document.querySelector('.avatar');
      if (avatar) {
        avatar.style.display = 'none';
        avatar.style.visibility = 'hidden';
        avatar.style.opacity = '0';
        avatar.style.pointerEvents = 'none';
        avatar.style.zIndex = '-1';
      }
    }, 10);
    
    return;
  }
  
  // Restaurar el avatar del pueblo cuando se cierra el modal
  const avatar = document.querySelector('.avatar');
  if (avatar) {
    avatar.style.display = 'block';
    avatar.style.visibility = 'visible';
    avatar.style.opacity = '1';
    
    // Actualizar posición del avatar después de restaurarlo
    setTimeout(() => {
      // Intentar importar y llamar updateAvatarPosition si existe
      import('./map.js').then(module => {
        if (module.updateAvatarPosition) {
          module.updateAvatarPosition();
        }
      }).catch(() => {
        // Si no se puede importar, intentar llamar a la función global
        if (window.updateAvatarPosition) {
          window.updateAvatarPosition();
        }
      });
    }, 100);
  }
}

// ========== EFECTO GOLOSINA GANADA ==========
export function celebrateCandyEarned() {
  // Buscar el icono de golosinas en el HUD
  const candyChip = document.querySelector('.chip-icon');
  let targetRect = null;
  
  // Intentar encontrar el contador de golosinas
  const candyCounter = document.getElementById('hud-candies');
  if (candyCounter) {
    targetRect = candyCounter.getBoundingClientRect();
  }
  
  if (!targetRect) return;
  
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  
  // Crear golosina gigante en el centro
  const candy = document.createElement('div');
  candy.className = 'candy-earned';
  candy.textContent = '🍬';
  candy.style.left = '50%';
  candy.style.top = '50%';
  
  // Calcular offset hasta el contador
  const deltaX = targetX - window.innerWidth / 2;
  const deltaY = targetY - window.innerHeight / 2;
  
  candy.style.setProperty('--target-x', `calc(-50% + ${deltaX}px)`);
  candy.style.setProperty('--target-y', `calc(-50% + ${deltaY}px)`);
  
  document.body.appendChild(candy);
  
  // Pulse en el contador
  if (candyCounter) {
    candyCounter.style.animation = 'none';
    setTimeout(() => {
      candyCounter.style.animation = 'pulse 0.3s ease';
      candyCounter.style.transform = 'scale(1.3)';
      setTimeout(() => {
        candyCounter.style.transform = 'scale(1)';
      }, 300);
    }, 1200);
  }
  
  // Eliminar después de la animación
  setTimeout(() => candy.remove(), 1500);
  
  // Sonido y vibración
  playSound('coin');
  vibrate([50, 30, 50, 30, 50]);
}

// ========== CONFIRM MODAL ==========
export const confirmModal = (message, onConfirm) => {
  const content = document.createElement('div');
  content.innerHTML = `
    <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">${message}</p>
    <div style="display: flex; gap: 0.5rem; justify-content: center;">
      <button class="btn btn-primary" id="confirm-yes">Sí</button>
      <button class="btn btn-outline" id="confirm-no">No</button>
    </div>
  `;
  
  showModal('Confirmación', content);
  
  document.getElementById('confirm-yes').addEventListener('click', () => {
    hideModal();
    onConfirm(true);
  });
  
  document.getElementById('confirm-no').addEventListener('click', () => {
    hideModal();
    onConfirm(false);
  });
};

// ========== ACTUALIZAR HUD ==========
// Throttling global para updateHUD
let lastHUDUpdate = 0;
const HUD_UPDATE_INTERVAL = 500; // Actualizar HUD cada 500ms máximo

export const updateHUD = () => {
  const now = Date.now();
  
  // Solo actualizar si ha pasado suficiente tiempo
  if (now - lastHUDUpdate < HUD_UPDATE_INTERVAL) {
    return;
  }
  
  lastHUDUpdate = now;
  
  const coinsEl = document.getElementById('hud-coins');
  const candiesEl = document.getElementById('hud-candies');
  const energyEl = document.getElementById('hud-energy');
  const hungerBarEl = document.getElementById('hunger-bar-fill');
  const userNickEl = document.getElementById('user-nick');
  
  // Mostrar nick del usuario si está logueado
  if (userNickEl) {
    let userNick = null;
    
        // Intentar obtener nick desde GameBridge
        if (window.GameBridge && window.GameBridge.getUser) {
          try {
            const userDataStr = window.GameBridge.getUser();
            if (userDataStr) {
              const userData = JSON.parse(userDataStr);
              if (userData && userData.nick) {
                userNick = userData.nick;
                // Guardar en localStorage para futuras referencias
                localStorage.setItem('user_nick', userNick);
              }
            }
          } catch (error) {
            // Error silencioso
          }
        }
    
    // Si no se obtuvo desde GameBridge, intentar desde localStorage
    if (!userNick) {
      userNick = localStorage.getItem('user_nick');
    }
    
    // Mostrar nick o "Invitado"
    if (userNick) {
      userNickEl.textContent = userNick;
      userNickEl.style.display = 'block';
    } else {
      // Verificar si el usuario está logueado
      const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn ? window.GameBridge.isUserLoggedIn() : false;
      if (isLoggedIn) {
        userNickEl.textContent = 'Usuario';
        userNickEl.style.display = 'block';
      } else {
        userNickEl.textContent = 'Invitado';
        userNickEl.style.display = 'block';
      }
    }
  }
  
  const updateCandiesValue = () => {
    // Cache para evitar llamadas excesivas a getCandies()
    const now = Date.now();
    if (!window.lastCandiesUpdate || (now - window.lastCandiesUpdate > 2000)) {
      window.cachedCandies = getCandies();
      window.lastCandiesUpdate = now;
    }
    const formatted = formatNumber(window.cachedCandies || 0);
    if (coinsEl) coinsEl.textContent = formatted;
    if (candiesEl) candiesEl.textContent = formatted;
  };

  if (coinsEl || candiesEl) {
    updateCandiesValue();
  }
  
  const currentEnergy = getEnergy();
  
  // Ya no mostramos el número, solo la barra
  
  if (hungerBarEl) {
    const energyPercent = currentEnergy;
    hungerBarEl.style.width = energyPercent + '%';
    
    // Cambiar color según nivel de hambre
    if (energyPercent > 50) {
      hungerBarEl.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
      hungerBarEl.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.5)';
    } else if (energyPercent > 25) {
      hungerBarEl.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
      hungerBarEl.style.boxShadow = '0 0 8px rgba(255, 152, 0, 0.5)';
    } else {
      hungerBarEl.style.background = 'linear-gradient(90deg, #f44336, #ef5350)';
      hungerBarEl.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.5)';
    }
  }
};

// ========== FORMATEO DE NÚMEROS ==========
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// ========== SONIDOS (SIMPLE) ==========
let audioContext;
let audioEnabled = null; // null hasta que se carguen desde Firebase
// Usar la instancia global compartida de background-music.js en lugar de crear una nueva
let backgroundMusic = null; // Se inicializará usando window._backgroundMusicInstance
let musicEnabled = null; // null hasta que se carguen desde Firebase
let audioPreferencesLoaded = false; // Flag para saber si ya se cargaron las preferencias

const initAudio = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Audio no disponible');
      audioEnabled = false;
    }
  }
};

// Función helper para reproducir archivos de audio con verificación de preferencias
export const playAudioFile = (path, volume = 0.5) => {
  // Verificar si el audio está habilitado
  if (window.audioEnabled === null || window.audioEnabled === undefined) {
    return;
  }
  
  if (!window.audioEnabled) {
    return; // Audio desactivado, no reproducir
  }
  
  try {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(e => {
      // Solo loggear errores reales, no cuando simplemente está desactivado
      if (window.audioEnabled) {
        // Audio no disponible
      }
    });
  } catch (e) {
    console.warn('Error reproduciendo audio:', path, e);
  }
};

export const playSound = (type = 'click') => {
  if (window.audioEnabled === null || window.audioEnabled === undefined) {
    return;
  }
  
  if (!window.audioEnabled) {
    return; // Audio desactivado, no reproducir
  }
  
  initAudio();
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'click':
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
        
      case 'coin':
        oscillator.frequency.value = 1200;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
        
      case 'success':
        oscillator.frequency.value = 1500;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      case 'fail':
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      case 'win':
        // Reproducir archivo de audio real usando la función helper
        oscillator.disconnect();
        gainNode.disconnect();
        playAudioFile('assets/audio/match3.mp3', 0.5);
        return; // Salir sin usar el oscillator
        
      case 'rat_escape':
        // Sonido de rata escapando (usar función helper)
        oscillator.disconnect();
        gainNode.disconnect();
        playAudioFile('audio/perder.mp3', 0.6);
        return;
    }
  } catch (e) {
    console.warn('Error reproduciendo sonido:', e);
  }
};

// ========== MÚSICA DE FONDO ==========
export const initBackgroundMusic = () => {
  // Usar la instancia global compartida de background-music.js si existe
  if (window._backgroundMusicInstance) {
    backgroundMusic = window._backgroundMusicInstance;
    return;
  }
  
  // Si no existe la instancia global, usar la de ui.js (para compatibilidad)
  if (!backgroundMusic) {
    backgroundMusic = new Audio('audio/background.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3; // Volumen bajo para no molestar
    backgroundMusic.preload = 'auto';
    
    // NO reproducir automáticamente - esperar a que se carguen las preferencias
  }
};

// Función eliminada - usar directamente window.playBackgroundMusic de background-music.js
// export const playBackgroundMusic = () => { ... } // ELIMINADO - causa recursión infinita

// Función eliminada - usar directamente window.stopBackgroundMusic de background-music.js
// export const stopBackgroundMusic = () => { ... } // ELIMINADO - causa recursión infinita

export const setMusicEnabled = (enabled) => {
  // Actualizar variables globales inmediatamente
  window.musicEnabled = enabled;
  
  // Actualizar localStorage inmediatamente para que las funciones lo vean
  localStorage.setItem('musicEnabled', enabled.toString());
  
  // Aplicar cambios de música INMEDIATAMENTE antes de guardar en Firebase
  if (enabled) {
    // Inicializar música si no existe
    if (!window._backgroundMusicInstance) {
      if (window.initBackgroundMusic) {
        // Si hay una función global de inicialización, usarla
        const initFunc = typeof window.initBackgroundMusic === 'function' ? window.initBackgroundMusic : null;
        if (initFunc) initFunc();
      }
    }
    // Forzar reproducción
    const musicInstance = window._backgroundMusicInstance;
    if (musicInstance) {
      if (musicInstance.paused) {
        // Si había una posición guardada, restaurarla
        if (window._musicPausedAt !== undefined) {
          musicInstance.currentTime = window._musicPausedAt;
          delete window._musicPausedAt;
        }
        musicInstance.play().catch(e => {
          // Error silencioso
        });
      }
    } else if (window.playBackgroundMusic) {
      // Si no hay instancia, usar la función global
      window.playBackgroundMusic();
    }
  } else {
    // Pausar música inmediatamente
    const musicInstance = window._backgroundMusicInstance;
    if (musicInstance && !musicInstance.paused) {
      window._musicPausedAt = musicInstance.currentTime;
      musicInstance.pause();
    } else if (window.stopBackgroundMusic) {
      window.stopBackgroundMusic();
    }
  }
  
  // Guardar en Firebase después de aplicar el cambio
  saveAudioSettings(window.audioEnabled, enabled);
};

// ========== VIBRACIÓN ==========
export const vibrate = (pattern = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ========== PREVENIR ZOOM EN MÓVIL ==========
export const preventZoom = () => {
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) e.preventDefault();
  }, { passive: false });
};

// ========== EFECTO GOLOSINAS VOLANDO ==========
export const animateCandyToCounter = () => {
  const counter = document.getElementById('hud-candies');
  if (!counter) return;
  
  const candy = document.createElement('div');
  // Usar emoji en lugar de imagen
  candy.textContent = '🍬';
  candy.className = 'flying-candy';
  candy.style.fontSize = '30px';
  
  // Posición inicial aleatoria en la parte inferior central
  const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
  const startY = window.innerHeight * 0.7;
  
  candy.style.left = startX + 'px';
  candy.style.top = startY + 'px';
  
  document.body.appendChild(candy);
  
  // Obtener posición del contador
  const rect = counter.getBoundingClientRect();
  const endX = rect.left + rect.width / 2;
  const endY = rect.top + rect.height / 2;
  
  // Animar hacia el contador
  setTimeout(() => {
    candy.style.left = endX + 'px';
    candy.style.top = endY + 'px';
    candy.style.transform = 'scale(0.3)';
  }, 50);
  
  // Eliminar después de la animación
  setTimeout(() => {
    candy.remove();
    // Efecto de pulso en el contador
    counter.parentElement.classList.add('pulse-candy');
    setTimeout(() => counter.parentElement.classList.remove('pulse-candy'), 500);
  }, 800);
};

// Escuchar evento de golosinas ganadas
if (typeof window !== 'undefined') {
  window.addEventListener('candyEarned', (e) => {
    const amount = e.detail.amount;
    for (let i = 0; i < Math.min(amount, 5); i++) {
      setTimeout(() => animateCandyToCounter(), i * 150);
    }
  });
}

// ========== MODAL DE AJUSTES ==========
export const showSettingsModal = () => {
  // Crear modal de ajustes
  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    color: #333;
  `;
  
  content.innerHTML = `
    <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem; color: #333;">⚙️ Ajustes</h2>
    
    <div style="margin: 1.5rem 0;">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: #555;">🔊 Sonido</h3>
      <label style="display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; margin-bottom: 0.5rem;">
        <input type="checkbox" id="sound-toggle" style="transform: scale(1.2);">
        <span>Activar sonidos</span>
      </label>
      <label style="display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;">
        <input type="checkbox" id="music-toggle" style="transform: scale(1.2);">
        <span>Activar música de fondo</span>
      </label>
    </div>
    
    <div style="margin: 1.5rem 0;">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: #555;">👤 Cuenta</h3>
      <button id="btn-auth" style="background: linear-gradient(135deg, #4285f4, #34a853); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; cursor: pointer; margin: 0.5rem;">
        🔑 Iniciar Sesión
      </button>
    </div>
    
    <div style="margin: 1.5rem 0;">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: #555;">🏆 Rankings</h3>
      <button id="btn-candy-ranking" style="background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; cursor: pointer; margin: 0.5rem;">
        🍬 Ranking Caramelos
      </button>
    </div>
    
    <button id="btn-close-settings" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 0.9rem; cursor: pointer; margin-top: 1rem;">
      Cerrar
    </button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    modal.remove();
  });
  
  // Función para actualizar el botón de autenticación
  const updateAuthButton = () => {
    const authButton = document.getElementById('btn-auth');
    if (!authButton) {
      return;
    }
    
    // Verificar si el usuario está logueado
    const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn ? window.GameBridge.isUserLoggedIn() : false;
    
    if (isLoggedIn) {
      // Usuario logueado - mostrar botón de cerrar sesión
      const userData = window.GameBridge && window.GameBridge.getUser ? window.GameBridge.getUser() : null;
      let nick = 'Usuario';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          nick = user.nick || 'Usuario';
        } catch (e) {
          // Error silencioso
        }
      }
      
      authButton.innerHTML = `🚪 Cerrar Sesión - ${nick}`;
      authButton.style.background = 'linear-gradient(135deg, #ff6b6b, #ff4757)';
    } else {
      // Usuario no logueado - mostrar botón de iniciar sesión
      authButton.innerHTML = '🔑 Entrar con Google';
      authButton.style.background = 'linear-gradient(135deg, #4285f4, #34a853)';
    }
  };
  
  // Actualizar el botón al cargar el modal
  updateAuthButton();
  
  document.getElementById('btn-auth').addEventListener('click', () => {
    const isLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn ? window.GameBridge.isUserLoggedIn() : false;
    
    if (isLoggedIn) {
      // Cerrar sesión
      if (window.GameBridge && window.GameBridge.signOut) {
        window.GameBridge.signOut();
        // Actualizar el botón después de cerrar sesión
        setTimeout(updateAuthButton, 500);
      }
    } else {
      // Iniciar sesión
      if (window.GameBridge && window.GameBridge.signInWithGoogle) {
        window.GameBridge.signInWithGoogle();
      } else {
        alert('Login con Google no disponible en este momento');
      }
    }
  });
  
  document.getElementById('btn-candy-ranking').addEventListener('click', () => {
    modal.remove();
    // Abrir RankingActivity nativa en lugar del modal
    if (window.GameBridge && window.GameBridge.openCandyRanking) {
      window.GameBridge.openCandyRanking();
    } else {
      alert('Ranking no disponible en este momento');
    }
  });
  
  // 1) Estado inmediato desde localStorage (mejor UX)
  (() => {
    const savedAudio = localStorage.getItem('audioEnabled');
    const savedMusic = localStorage.getItem('musicEnabled');
    if (savedAudio !== null) window.audioEnabled = (savedAudio === 'true');
    if (savedMusic !== null) window.musicEnabled = (savedMusic === 'true');
    updateAudioToggles();
  })();

  // 2) Refresco puntual desde Firebase si está logueado
  const refreshOnceFromFirebase = () => {
    if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
      // intento directo
      if (!refreshAudioFromBridge()) {
        // si aún no, esperamos hasta 3s y reintentamos una vez
        const t = setTimeout(() => {
          refreshAudioFromBridge();
          clearTimeout(t);
        }, 1000);
      }
    }
  };
  refreshOnceFromFirebase();
  
  // Cerrar con ESC
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
};


// ========== INICIALIZACIÓN COMÚN ==========
export const initCommonUI = () => {
  preventZoom();
  updateHUD();
  
  // Actualizar HUD cada segundo
  setInterval(updateHUD, 1000);
  
  // Botón fullscreen si existe
  const fsBtn = document.getElementById('btn-fullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', toggleFullscreen);
  }
  
  // Botón de ajustes
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettingsModal);
  }
  
  // Exponer funciones globalmente para que Java pueda llamarlas
  window.updateAudioToggles = updateAudioToggles;
  window.updateHUD = updateHUD;
  window.playAudioFile = playAudioFile; // Exponer globalmente para levelup.js y otros
  // NO reexportar playBackgroundMusic aquí - ya está definido en background-music.js
// window.playBackgroundMusic = playBackgroundMusic; // ELIMINADO - causa recursión infinita
  // NO exportar stopBackgroundMusic aquí - ya está en background-music.js
  window.setMusicEnabled = setMusicEnabled;
  
  // Callback para cuando Firebase actualiza las preferencias de audio
  window.onAudioPreferencesUpdated = (soundEnabled, musicEnabled) => {
    
    // Solo actualizar si los valores son diferentes a los actuales (evitar loops)
    const currentMusicEnabled = window.musicEnabled !== null && window.musicEnabled !== undefined 
      ? window.musicEnabled 
      : (localStorage.getItem('musicEnabled') === 'true');
    
    if (currentMusicEnabled === musicEnabled) {
      // Solo actualizar toggles para sincronizar UI
      updateAudioToggles();
      return;
    }
    
    // Actualizar variables globales
    window.audioEnabled = soundEnabled;
    window.musicEnabled = musicEnabled;
    
    // Actualizar localStorage
    localStorage.setItem('audioEnabled', soundEnabled.toString());
    localStorage.setItem('musicEnabled', musicEnabled.toString());
    
    
    // Aplicar cambios de música inmediatamente - se reproduce en TODAS las páginas si está habilitada
    if (musicEnabled) {
      // Inicializar música si no existe
      if (!window._backgroundMusicInstance) {
        if (typeof window.initBackgroundMusic === 'function') {
          window.initBackgroundMusic();
        }
      }
      // Forzar reproducción
      const musicInstance = window._backgroundMusicInstance;
      if (musicInstance) {
        if (musicInstance.paused) {
          if (window._musicPausedAt !== undefined) {
            musicInstance.currentTime = window._musicPausedAt;
            delete window._musicPausedAt;
          }
          musicInstance.play().catch(e => console.log('⚠️ Error reproduciendo:', e.message));
        }
      } else if (window.playBackgroundMusic) {
        window.playBackgroundMusic();
      }
    } else {
      // Pausar música inmediatamente
      const musicInstance = window._backgroundMusicInstance;
      if (musicInstance && !musicInstance.paused) {
        window._musicPausedAt = musicInstance.currentTime;
        musicInstance.pause();
      } else if (window.stopBackgroundMusic) {
        window.stopBackgroundMusic();
      }
    }
    
    // Actualizar toggles si el modal está abierto
    updateAudioToggles();
  };
  
  // Cargar preferencias de audio
  const waitForFirebaseData = () => {
    const checkInterval = setInterval(() => {
      try {
        // Usar getUser() en lugar de getCandies() para obtener soundEnabled y musicEnabled
        const userDataStr = window.GameBridge?.getUser ? window.GameBridge.getUser() : null;
        if (userDataStr && userDataStr !== '{}') {
          const userData = JSON.parse(userDataStr);
          if (userData.nick && userData.nick !== "Usuario" &&
              typeof userData.soundEnabled === 'boolean' &&
              typeof userData.musicEnabled === 'boolean') {
            clearInterval(checkInterval);
            loadAudioPreferences({ force: true }).then(() => {
              initBackgroundMusic();
            });
          }
        }
      } catch (err) {
        // Error silencioso
      }
    }, 500);

    // Timeout de seguridad: caer a localStorage (sin forzar falsos)
    setTimeout(() => {
      clearInterval(checkInterval);
      loadAudioPreferences({ force: true }).then(() => {
        initBackgroundMusic();
      });
    }, 10000);
  };
  waitForFirebaseData();
};

// Fuerza una lectura directa de GameBridge.getUser() y aplica toggles
export const refreshAudioFromBridge = () => {
  try {
    // Usar getUser() en lugar de getCandies() porque getUser() incluye soundEnabled y musicEnabled
    if (!(window.GameBridge && window.GameBridge.getUser)) return false;
    const dataStr = window.GameBridge.getUser();
    if (!dataStr || dataStr === '{}') return false;

    const user = JSON.parse(dataStr);
    
    if (typeof user.soundEnabled === 'boolean' && typeof user.musicEnabled === 'boolean') {
      window.audioEnabled = user.soundEnabled;
      window.musicEnabled = user.musicEnabled;

      // guarda backup
      localStorage.setItem('audioEnabled', String(window.audioEnabled));
      localStorage.setItem('musicEnabled', String(window.musicEnabled));


      // refleja en UI si procede
      if (typeof updateAudioToggles === 'function') updateAudioToggles();

      // música on/off inmediato - se reproduce en TODAS las páginas si está habilitada
      if (window.musicEnabled && window.playBackgroundMusic) {
        window.playBackgroundMusic();
      }
      if (!window.musicEnabled && window.stopBackgroundMusic) window.stopBackgroundMusic();

      return true;
    } else {
      console.log('⚠️ refreshAudioFromBridge() - soundEnabled o musicEnabled no son boolean:', {
        soundEnabled: user.soundEnabled,
        musicEnabled: user.musicEnabled
      });
    }
    return false;
  } catch (e) {
    // Error silencioso
    return false;
  }
};

// Función para cargar preferencias de audio desde Firebase o localStorage
// Función para guardar configuraciones (adaptada de MemoFlip)
const saveAudioSettings = (soundEnabled, musicEnabled) => {
  // Guardar en localStorage inmediatamente (como MemoFlip)
  localStorage.setItem('audioEnabled', soundEnabled.toString());
  localStorage.setItem('musicEnabled', musicEnabled.toString());
  console.log('⚙️ Configuraciones guardadas en localStorage - sonido:', soundEnabled, 'música:', musicEnabled);
  
  // También guardar en Firestore si hay usuario
  if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {
    try {
      // Usar GameBridge para guardar en Firestore (estructura original)
      if (window.GameBridge.updateAudioPreferences) {
        window.GameBridge.updateAudioPreferences(soundEnabled, musicEnabled);
        console.log('⚙️ Configuraciones guardadas en Firestore:', { soundEnabled, musicEnabled });
      }
    } catch (error) {
      console.error('❌ Error guardando configuraciones en Firestore:', error);
    }
  }
};

const loadAudioPreferences = ({ force = false } = {}) => {
  // Permite recarga si force=true
  if (audioPreferencesLoaded && !force) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    // ---- RUTA ANDROID / LOGUEADO ----
    if (window.GameBridge && window.GameBridge.isUserLoggedIn && window.GameBridge.isUserLoggedIn()) {

      // 1) Intento inmediato desde bridge
      const applied = refreshAudioFromBridge();
      if (applied) {
        audioPreferencesLoaded = true;
        return resolve();
      }

      // 2) Configurar callback tardío
      window.onAudioPreferencesLoaded = () => {
        const ok = refreshAudioFromBridge();
        audioPreferencesLoaded = true; // ahora sí
        window.onAudioPreferencesLoaded = null;
        resolve();
      };

      // 3) Timeout de seguridad: NO fuerces false; cae a localStorage si existe
      setTimeout(() => {
        if (window.onAudioPreferencesLoaded) {
          const savedAudio = localStorage.getItem('audioEnabled');
          const savedMusic = localStorage.getItem('musicEnabled');

          // Si hay algo guardado, úsalo; si no, deja null (no tocar checks aún)
          if (savedAudio !== null) window.audioEnabled = (savedAudio === 'true');
          if (savedMusic !== null) window.musicEnabled = (savedMusic === 'true');

          if (typeof updateAudioToggles === 'function') updateAudioToggles();

          // NO marcamos audioPreferencesLoaded si seguimos en null, para permitir refresco posterior
          if (savedAudio !== null && savedMusic !== null) audioPreferencesLoaded = true;

          window.onAudioPreferencesLoaded = null;
          resolve();
        }
      }, 3000);

    // ---- RUTA WEB / NO LOGUEADO ----
    } else {
      const savedAudioEnabled = localStorage.getItem('audioEnabled');
      const savedMusicEnabled = localStorage.getItem('musicEnabled');

      window.audioEnabled = savedAudioEnabled !== null ? savedAudioEnabled === 'true' : null;
      window.musicEnabled = savedMusicEnabled !== null ? savedMusicEnabled === 'true' : null;

      if (typeof updateAudioToggles === 'function') updateAudioToggles();

      // Música solo si es true conocido
      if (window.musicEnabled === true && window.playBackgroundMusic) window.playBackgroundMusic();

      // Solo marcamos "cargadas" si tenemos valores reales (no null)
      audioPreferencesLoaded = (window.audioEnabled !== null && window.musicEnabled !== null);
      resolve();
    }
  });
};

// Función para actualizar los toggles de audio
const updateAudioToggles = () => {
  const soundToggle = document.getElementById('sound-toggle');
  const musicToggle = document.getElementById('music-toggle');
  
  // Usar las variables globales en lugar de las locales
  const currentAudioEnabled = window.audioEnabled;
  const currentMusicEnabled = window.musicEnabled;
  
  
  // Solo actualizar si los valores no son null
  if (currentAudioEnabled === null || currentAudioEnabled === undefined || 
      currentMusicEnabled === null || currentMusicEnabled === undefined) {
    return;
  }
  
  if (soundToggle) {
    // Evitar eventos durante la actualización
    if (soundToggle._changeHandler) {
      soundToggle.removeEventListener('change', soundToggle._changeHandler);
    }
    
    // Actualizar el estado del toggle
    soundToggle.checked = currentAudioEnabled;
    console.log('🔊 Toggle de sonido actualizado a:', currentAudioEnabled);
    
    // Re-agregar el event listener
    soundToggle._changeHandler = (e) => {
      console.log('🔊 Toggle de sonido cambiado a:', e.target.checked);
      
      // Actualizar variables globales inmediatamente
      window.audioEnabled = e.target.checked;
      
      console.log('🔊 Variables actualizadas - audioEnabled:', window.audioEnabled);
      
      // Guardar usando la función adaptada de MemoFlip
      saveAudioSettings(e.target.checked, window.musicEnabled);
      
      console.log('🔊 Sonido:', window.audioEnabled ? 'Activado' : 'Desactivado');
    };
    soundToggle.addEventListener('change', soundToggle._changeHandler);
  }
  
  if (musicToggle) {
    // Evitar eventos durante la actualización
    if (musicToggle._changeHandler) {
      musicToggle.removeEventListener('change', musicToggle._changeHandler);
    }
    
    // Actualizar el estado del toggle
    musicToggle.checked = currentMusicEnabled;
    
    // Re-agregar el event listener
    musicToggle._changeHandler = (e) => {
      setMusicEnabled(e.target.checked);
    };
    musicToggle.addEventListener('change', musicToggle._changeHandler);
  }
};

// ========== MANEJO DE VISIBILIDAD DE PÁGINA (minimizar/maximizar) ==========
// Pausar música cuando se minimiza y reanudar cuando se maximiza
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Página oculta (app minimizada)
    if (backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.pause();
      // Guardar el tiempo actual para reanudar desde ahí
      window._musicPausedAt = backgroundMusic.currentTime;
    }
  } else {
    // Página visible (app maximizada)
    // Verificar si la música está habilitada (tanto window.musicEnabled como localStorage)
    const musicEnabled = window.musicEnabled !== false && 
                         localStorage.getItem('musicEnabled') !== 'false' &&
                         localStorage.getItem('musicEnabled') !== null;
    if (musicEnabled && backgroundMusic && backgroundMusic.paused) {
      // Reanudar desde donde se pausó
      if (window._musicPausedAt !== undefined) {
        backgroundMusic.currentTime = window._musicPausedAt;
        delete window._musicPausedAt;
      }
      backgroundMusic.play().catch(e => {
        console.log('⚠️ No se pudo reanudar música:', e);
      });
    }
  }
});

// También manejar eventos de blur/focus como respaldo
window.addEventListener('blur', () => {
  if (backgroundMusic && !backgroundMusic.paused) {
    backgroundMusic.pause();
    window._musicPausedAt = backgroundMusic.currentTime;
  }
});

window.addEventListener('focus', () => {
  // Verificar si la música está habilitada (tanto window.musicEnabled como localStorage)
  const musicEnabled = window.musicEnabled !== false && 
                       localStorage.getItem('musicEnabled') !== 'false' &&
                       localStorage.getItem('musicEnabled') !== null;
  if (musicEnabled && backgroundMusic && backgroundMusic.paused) {
    if (window._musicPausedAt !== undefined) {
      backgroundMusic.currentTime = window._musicPausedAt;
      delete window._musicPausedAt;
    }
    backgroundMusic.play().catch(e => {
      console.log('⚠️ No se pudo reanudar música:', e);
    });
  }
});

// Callback para cuando se complete el cierre de sesión
window.onSignOutComplete = () => {
  console.log('🚪🚪🚪 onSignOutComplete() llamado desde Java 🚪🚪🚪');
  console.log('🚪 Sesión cerrada exitosamente');
  
  // Resetear datos de localStorage al estado inicial
  if (typeof window.resetDataOnLogout === 'function') {
    console.log('🔄 Reseteando datos de localStorage...');
    window.resetDataOnLogout();
  } else {
    console.warn('⚠️ resetDataOnLogout no disponible, usando método alternativo...');
    // Fallback: limpiar manualmente
    import('./storage.js').then(({ resetDataOnLogout }) => {
      resetDataOnLogout();
    }).catch(error => {
      console.error('❌ Error importando resetDataOnLogout:', error);
    });
  }
  
  // Verificar el estado después del cierre de sesión
  const isStillLoggedIn = window.GameBridge && window.GameBridge.isUserLoggedIn ? window.GameBridge.isUserLoggedIn() : false;
  console.log('🚪 ¿Sigue logueado después del signOut?:', isStillLoggedIn);
  
  // Forzar actualización del nick a "Invitado" inmediatamente
  const userNickEl = document.getElementById('user-nick');
  if (userNickEl) {
    userNickEl.textContent = 'Invitado';
    userNickEl.style.display = 'block';
    console.log('👤 Nick actualizado a "Invitado" después del cierre de sesión');
  }
  
  // Actualizar HUD para reflejar que el usuario ya no está logueado
  updateHUD();
  
  // Si hay un modal de ajustes abierto, actualizar el botón
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) {
    console.log('🚪 Modal de ajustes encontrado, actualizando botón...');
    const updateAuthButton = () => {
      const authButton = document.getElementById('btn-auth');
      if (authButton) {
        authButton.innerHTML = '🔑 Entrar con Google';
        authButton.style.background = 'linear-gradient(135deg, #4285f4, #34a853)';
        console.log('🚪 Botón actualizado a "Entrar con Google"');
      }
    };
    updateAuthButton();
  }
};

