/* ========================================
   🎨 UI - Utilidades de interfaz común
   ======================================== */

import { getCoins, getEnergy } from './storage.js';

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
export function showModal(title, contentNode) {
  // elimina una anterior si existe
  hideModal();

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
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <h2 style="margin:0; font-size:20px; font-weight:900; color:#333;">${title || ''}</h2>
      <button id="modal-x" class="btn btn-outline" style="padding:4px 12px; color:#d900ff; font-weight:900; font-size:1.2rem;">✕</button>
    </div>
  `;
  card.appendChild(contentNode);
  root.appendChild(card);
  document.body.appendChild(root);

  document.getElementById('modal-x')?.addEventListener('click', hideModal);
  root.addEventListener('click', (e)=>{
    if(e.target === root) hideModal();
  });

  // Esc para cerrar
  window.addEventListener('keydown', escCloser);
}
function escCloser(e){ if(e.key==='Escape') hideModal(); }

export function hideModal() {
  const root = document.getElementById('modal-root');
  if (root) root.remove();
  window.removeEventListener('keydown', escCloser);
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
export const updateHUD = () => {
  const coinsEl = document.getElementById('hud-coins');
  const energyEl = document.getElementById('hud-energy');
  const hungerBarEl = document.getElementById('hunger-bar-fill');
  
  if (coinsEl) {
    coinsEl.textContent = formatNumber(getCoins());
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
let audioEnabled = true;

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

export const playSound = (type = 'click') => {
  if (!audioEnabled) return;
  
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
        // Reproducir archivo de audio real
        oscillator.disconnect();
        gainNode.disconnect();
        const audio = new Audio('assets/audio/match3.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio no disponible'));
        return; // Salir sin usar el oscillator
    }
  } catch (e) {
    console.warn('Error reproduciendo sonido:', e);
  }
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
};

