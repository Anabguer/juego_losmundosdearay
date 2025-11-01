/* ========================================
   🎵 MÚSICA DE FONDO
   Reproduce background.mp3 en todas las páginas cuando está habilitada en ajustes
   ======================================== */

// Usar variable global compartida para evitar múltiples instancias
let backgroundMusic = window._backgroundMusicInstance || null;
let isMusicPlaying = false;

// Función para detener cualquier música anterior (solo para limpiar entre páginas)
const stopAllMusic = () => {
  // Solo pausar, NO resetear currentTime para mantener continuidad
  if (window._backgroundMusicInstance) {
    try {
      window._backgroundMusicInstance.pause();
      // NO resetear currentTime aquí - mantener la posición
    } catch (e) {
      console.log('Error deteniendo música anterior:', e);
    }
  }
  if (backgroundMusic) {
    try {
      backgroundMusic.pause();
      // NO resetear currentTime aquí - mantener la posición
    } catch (e) {
      console.log('Error deteniendo música local:', e);
    }
  }
  isMusicPlaying = false;
};

// Función para inicializar la música de fondo
const initBackgroundMusic = () => {
  // Si ya existe una instancia global, usarla
  if (window._backgroundMusicInstance) {
    backgroundMusic = window._backgroundMusicInstance;
    // Verificar si está reproduciéndose
    isMusicPlaying = !window._backgroundMusicInstance.paused;
    return;
  }
  
  // Detener cualquier música anterior antes de crear nueva
  stopAllMusic();
  
  // Crear nueva instancia global
  backgroundMusic = new Audio('audio/background.mp3');
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.3; // Volumen moderado
  backgroundMusic.preload = 'auto';
  
  // Guardar como instancia global compartida
  window._backgroundMusicInstance = backgroundMusic;
  
  // Manejar errores de carga
  backgroundMusic.addEventListener('error', (e) => {
    console.log('No se pudo cargar la música de fondo:', e);
  });
};

// Función para reproducir música
const playBackgroundMusic = () => {
  // Verificar preferencias: primero window.musicEnabled, luego localStorage
  let musicEnabled = window.musicEnabled;
  if (musicEnabled === null || musicEnabled === undefined) {
    const savedMusic = localStorage.getItem('musicEnabled');
    if (savedMusic !== null) {
      musicEnabled = savedMusic === 'true';
      window.musicEnabled = musicEnabled;
      console.log('🎵 Usando preferencia de localStorage:', musicEnabled);
    } else {
      console.log('🔇 Preferencias de música no cargadas aún, no reproduciendo');
      return;
    }
  }
  
  if (!musicEnabled) {
    console.log('🔇 Música deshabilitada por preferencias del usuario');
    return;
  }
  
  // NO llamar stopAllMusic aquí - solo inicializar si es necesario
  if (!backgroundMusic) {
    initBackgroundMusic();
  }
  
  // Verificar si ya está reproduciéndose (usando la instancia global)
  if (window._backgroundMusicInstance && !window._backgroundMusicInstance.paused) {
    console.log('🎵 Música ya está reproduciéndose');
    isMusicPlaying = true;
    return;
  }
  
  // Usar la instancia global si existe
  const musicToPlay = window._backgroundMusicInstance || backgroundMusic;
  
  if (musicToPlay) {
    musicToPlay.play()
      .then(() => {
        isMusicPlaying = true;
        console.log('🎵 Música de fondo iniciada');
      })
      .catch(e => {
        // Error común: requiere interacción del usuario en algunos navegadores
        console.log('⚠️ No se pudo reproducir la música (puede requerir interacción):', e.message);
      });
  }
};

// Función para pausar música (mantener posición para reanudar)
const pauseBackgroundMusic = () => {
  // Guardar posición antes de pausar
  if (window._backgroundMusicInstance && !window._backgroundMusicInstance.paused) {
    window._musicPausedAt = window._backgroundMusicInstance.currentTime;
    window._backgroundMusicInstance.pause();
  }
  if (backgroundMusic && !backgroundMusic.paused) {
    window._musicPausedAt = backgroundMusic.currentTime;
    backgroundMusic.pause();
  }
  isMusicPlaying = false;
  console.log('🔇 Música de fondo pausada (posición guardada)');
};

// Función para detener música completamente
const stopBackgroundMusic = () => {
  stopAllMusic();
  console.log('⏹️ Música de fondo detenida');
};

// Función para verificar si estamos en un juego
const isInGame = () => {
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;
  const gamePages = [
    'yayos.html',
    'skate.html', 
    'parque.html',
    'pabellon.html',
    'informatica.html',
    'edificio.html',
    'tienda.html',
    'rio.html',
    'cole.html'
  ];
  
  // Verificar en pathname o href
  return gamePages.some(page => currentPath.includes(page) || currentHref.includes(page));
};

// Función para manejar el cambio de página
const handlePageChange = () => {
  console.log('🔄 handlePageChange - Página:', window.location.href, 'isInGame:', isInGame());
  // La música debe reproducirse en TODAS las páginas si está habilitada
  // Solo depende de la preferencia del usuario, no de la página
  const savedMusic = localStorage.getItem('musicEnabled');
  if (savedMusic === 'true') {
    window.musicEnabled = true;
    setTimeout(() => {
      playBackgroundMusic();
    }, 50);
  } else {
    // Esperar un poco para que las preferencias se carguen
    setTimeout(() => {
      playBackgroundMusic();
    }, 100);
  }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 DOMContentLoaded - Página:', window.location.href);
  
  // Inicializar música (sin detener, para mantener continuidad)
  initBackgroundMusic();
  
  // La música debe reproducirse en TODAS las páginas si está habilitada
  // Intentar inmediatamente con localStorage
  const savedMusic = localStorage.getItem('musicEnabled');
  if (savedMusic === 'true') {
    window.musicEnabled = true;
    // Pequeño delay para asegurar que el audio está listo
    setTimeout(() => {
      playBackgroundMusic();
    }, 50);
  }
  
  // También esperar a que Firebase cargue (pero con fallback a localStorage)
  let attempts = 0;
  const checkAndPlay = setInterval(() => {
    attempts++;
    
    // Si las preferencias de Firebase están cargadas
    if (window.musicEnabled !== null && window.musicEnabled !== undefined && 
        window.musicEnabled !== (savedMusic === 'true')) {
      clearInterval(checkAndPlay);
      // Firebase tiene preferencia sobre localStorage
      playBackgroundMusic();
    } else if (attempts >= 20) {
      // Timeout después de 2 segundos
      clearInterval(checkAndPlay);
      // Si aún no se ha iniciado y localStorage dice que sí, iniciar
      if (savedMusic === 'true' && (!window._backgroundMusicInstance || window._backgroundMusicInstance.paused)) {
        playBackgroundMusic();
      }
    }
  }, 100);
});

// Escuchar cambios de URL (para navegación SPA)
window.addEventListener('popstate', handlePageChange);

// Función para activar música con interacción del usuario
const enableMusic = () => {
  // La música debe funcionar en TODAS las páginas, no solo en juegos
  // Verificar preferencias
  let musicEnabled = window.musicEnabled;
  if (musicEnabled === null || musicEnabled === undefined) {
    const savedMusic = localStorage.getItem('musicEnabled');
    musicEnabled = savedMusic === 'true';
  }
  
  if (musicEnabled) {
    const musicInstance = window._backgroundMusicInstance || backgroundMusic;
    if (musicInstance && musicInstance.paused) {
      // Si había una posición guardada, restaurarla
      if (window._musicPausedAt !== undefined) {
        musicInstance.currentTime = window._musicPausedAt;
        delete window._musicPausedAt;
      }
      playBackgroundMusic();
    }
  }
};

// Agregar listener para activar música con cualquier interacción (en cualquier página)
document.addEventListener('click', enableMusic, { once: true });
document.addEventListener('touchstart', enableMusic, { once: true });
document.addEventListener('keydown', enableMusic, { once: true });

// Exportar funciones globalmente
window.playBackgroundMusic = playBackgroundMusic;
window.pauseBackgroundMusic = pauseBackgroundMusic;
window.stopBackgroundMusic = stopBackgroundMusic;
window.enableMusic = enableMusic;
window.isInGame = isInGame;
window.handlePageChange = handlePageChange;
