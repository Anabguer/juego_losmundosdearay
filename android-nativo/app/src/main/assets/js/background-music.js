/* ========================================
   🎵 MÚSICA DE FONDO
   Reproduce background.mp3 solo en los juegos
   ======================================== */

// Usar variable global compartida para evitar múltiples instancias
let backgroundMusic = window._backgroundMusicInstance || null;
let isMusicPlaying = false;

// Función para detener cualquier música anterior
const stopAllMusic = () => {
  // Detener música global si existe
  if (window._backgroundMusicInstance) {
    try {
      window._backgroundMusicInstance.pause();
      window._backgroundMusicInstance.currentTime = 0;
    } catch (e) {
      console.log('Error deteniendo música anterior:', e);
    }
  }
  // Detener esta instancia local si existe
  if (backgroundMusic) {
    try {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
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
  // Verificar si las preferencias están cargadas y la música está habilitada
  if (window.musicEnabled === null || window.musicEnabled === undefined) {
    console.log('🔇 Preferencias de música no cargadas aún, no reproduciendo');
    return;
  }
  
  if (!window.musicEnabled) {
    console.log('🔇 Música deshabilitada por preferencias del usuario');
    return;
  }
  
  // Detener cualquier música anterior antes de iniciar nueva
  stopAllMusic();
  
  if (!backgroundMusic) {
    initBackgroundMusic();
  }
  
  // Verificar si ya está reproduciéndose (usando la instancia global)
  if (window._backgroundMusicInstance && !window._backgroundMusicInstance.paused) {
    console.log('🎵 Música ya está reproduciéndose');
    return;
  }
  
  if (backgroundMusic && !isMusicPlaying) {
    backgroundMusic.play()
      .then(() => {
        isMusicPlaying = true;
        console.log('🎵 Música de fondo iniciada');
      })
      .catch(e => {
        // Silenciar el error - es normal que requiera interacción del usuario
        // console.log('No se pudo reproducir la música:', e);
      });
  }
};

// Función para pausar música
const pauseBackgroundMusic = () => {
  // Pausar instancia global si existe
  if (window._backgroundMusicInstance) {
    window._backgroundMusicInstance.pause();
  }
  // Pausar instancia local si existe
  if (backgroundMusic && isMusicPlaying) {
    backgroundMusic.pause();
    isMusicPlaying = false;
    console.log('🔇 Música de fondo pausada');
  }
};

// Función para detener música completamente
const stopBackgroundMusic = () => {
  stopAllMusic();
  console.log('⏹️ Música de fondo detenida');
};

// Función para verificar si estamos en un juego
const isInGame = () => {
  const currentPath = window.location.pathname;
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
  
  return gamePages.some(page => currentPath.includes(page));
};

// Función para manejar el cambio de página
const handlePageChange = () => {
  if (isInGame()) {
    // Estamos en un juego, reproducir música solo si está habilitada
    playBackgroundMusic();
  } else {
    // No estamos en un juego, pausar música
    pauseBackgroundMusic();
  }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Detener cualquier música anterior al cargar nueva página
  stopAllMusic();
  
  initBackgroundMusic();
  handlePageChange();
});

// Escuchar cambios de URL (para navegación SPA)
window.addEventListener('popstate', handlePageChange);

// Función para activar música con interacción del usuario
const enableMusic = () => {
  // Solo activar si la música está habilitada en las preferencias
  if (window.musicEnabled && backgroundMusic && backgroundMusic.paused) {
    playBackgroundMusic();
  }
};

// Agregar listener para activar música con cualquier interacción
document.addEventListener('click', enableMusic, { once: true });
document.addEventListener('touchstart', enableMusic, { once: true });
document.addEventListener('keydown', enableMusic, { once: true });

// Exportar funciones globalmente
window.playBackgroundMusic = playBackgroundMusic;
window.pauseBackgroundMusic = pauseBackgroundMusic;
window.stopBackgroundMusic = stopBackgroundMusic;
window.enableMusic = enableMusic;
