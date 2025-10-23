/* ========================================
   🎉 SISTEMA DE ANIMACIÓN DE NIVEL UP
   Animación Lottie para cambio de nivel
   ======================================== */

// Cargar Lottie
let lottieLoaded = false;
let lottieScript = null;

// Función para cargar Lottie si no está cargado
const loadLottie = () => {
  return new Promise((resolve) => {
    if (lottieLoaded) {
      resolve();
      return;
    }
    
    if (window.lottie) {
      lottieLoaded = true;
      resolve();
      return;
    }
    
    if (lottieScript) {
      lottieScript.onload = () => {
        lottieLoaded = true;
        resolve();
      };
      return;
    }
    
    lottieScript = document.createElement('script');
    lottieScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
    lottieScript.onload = () => {
      lottieLoaded = true;
      resolve();
    };
    document.head.appendChild(lottieScript);
  });
};

// Mostrar animación de nivel up
const showLevelUpAnimation = (newLevel) => {
  loadLottie().then(() => {
    // Crear overlay para la animación
    const overlay = document.createElement('div');
    overlay.id = 'levelup-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent; /* sin fondo para no tapar el juego */
      backdrop-filter: none; /* sin desenfoque */
      box-shadow: none; /* sin sombreado */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      pointer-events: none; /* no bloquear interacción */
    `;
    
    // Contenedor para la animación Lottie
    const animationContainer = document.createElement('div');
    animationContainer.id = 'levelup-animation';
    animationContainer.style.cssText = `
      width: 300px;
      height: 300px;
      margin-bottom: 20px;
      pointer-events: none; /* no captar eventos */
    `;
    
    // Texto del nivel
    const levelText = document.createElement('div');
    levelText.id = 'levelup-text';
    levelText.textContent = `NIVEL ${newLevel}`;
    levelText.style.cssText = `
      font-family: 'Arial', sans-serif;
      font-size: 3rem;
      font-weight: bold;
      color: #FFD700;
      text-shadow: 3px 3px 0px #FF6B35, 6px 6px 0px #C44569;
      text-align: center;
      animation: levelupPulse 0.5s ease-in-out infinite alternate;
      pointer-events: none;
    `;
    
    // Agregar estilos CSS para la animación
    if (!document.getElementById('levelup-styles')) {
      const style = document.createElement('style');
      style.id = 'levelup-styles';
      style.textContent = `
        @keyframes levelupPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        
        @keyframes levelupFadeIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        #levelup-overlay {
          animation: levelupFadeIn 0.5s ease-out;
        }
      `;
      document.head.appendChild(style);
    }
    
    overlay.appendChild(animationContainer);
    overlay.appendChild(levelText);
    document.body.appendChild(overlay);
    
    // Cargar y reproducir animación Lottie
    const animation = lottie.loadAnimation({
      container: animationContainer,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: 'assets/Level Up.json'
    });
    
    // Reproducir sonido de nivel up
    const audio = new Audio('assets/audio/ganar.mp3');
    audio.volume = 0.7;
    audio.play().catch(e => console.log('Audio no disponible'));
    
    // Vibrar para celebrar
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Remover overlay después de la animación
    animation.addEventListener('complete', () => {
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 500);
      }, 1000); // Mostrar texto por 1 segundo adicional
    });
  });
};

// Función para verificar y mostrar cambio de nivel
const checkLevelUp = (currentScore, gameType) => {
  // Definir puntos necesarios para cada nivel
  const levelThresholds = {
    pabellon: [0, 50, 150, 300, 500, 750, 1000, 1300, 1600, 2000],
    yayos: [0, 30, 80, 150, 250, 400, 600, 850, 1150, 1500],
    skate: [0, 40, 100, 200, 350, 550, 800, 1100, 1450, 1850],
    parque: [0, 60, 140, 250, 400, 600, 850, 1150, 1500, 1900],
    informatica: [0, 35, 90, 180, 300, 450, 650, 900, 1200, 1550],
    edificio: [0, 45, 110, 220, 380, 580, 820, 1100, 1420, 1800],
    tienda: [0, 25, 70, 140, 230, 350, 500, 680, 890, 1150],
    rio: [0, 55, 130, 240, 390, 580, 820, 1100, 1430, 1820],
    cole: [0, 40, 100, 200, 350, 550, 800, 1100, 1450, 1850]
  };
  
  const thresholds = levelThresholds[gameType] || levelThresholds.pabellon;
  
  // Encontrar el nivel actual basado en la puntuación
  let currentLevel = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (currentScore >= thresholds[i]) {
      currentLevel = i + 1;
      break;
    }
  }
  
  // Verificar si es un nuevo nivel (guardar en localStorage)
  const levelKey = `aray_level_${gameType}`;
  const lastLevel = parseInt(localStorage.getItem(levelKey) || '1');
  
  if (currentLevel > lastLevel) {
    // ¡Nuevo nivel!
    localStorage.setItem(levelKey, currentLevel.toString());
    showLevelUpAnimation(currentLevel);
    return currentLevel;
  }
  
  return currentLevel;
};

// Exportar funciones
window.showLevelUpAnimation = showLevelUpAnimation;
window.checkLevelUp = checkLevelUp;
