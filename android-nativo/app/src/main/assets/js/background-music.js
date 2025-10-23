/* ========================================
   🎵 MÚSICA DE FONDO
   Reproduce background.mp3 solo en los juegos
   ======================================== */

let backgroundMusic = null;
let isMusicPlaying = false;

// Función para inicializar la música de fondo
const initBackgroundMusic = () => {
  if (backgroundMusic) return;
  
  backgroundMusic = new Audio('assets/audio/background.mp3');
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.3; // Volumen moderado
  backgroundMusic.preload = 'auto';
  
  // Manejar errores de carga
  backgroundMusic.addEventListener('error', (e) => {
    console.log('No se pudo cargar la música de fondo:', e);
  });
};

// Función para reproducir música
const playBackgroundMusic = () => {
  if (!backgroundMusic) {
    initBackgroundMusic();
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
  if (backgroundMusic && isMusicPlaying) {
    backgroundMusic.pause();
    isMusicPlaying = false;
    console.log('🔇 Música de fondo pausada');
  }
};

// Función para detener música completamente
const stopBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    isMusicPlaying = false;
    console.log('⏹️ Música de fondo detenida');
  }
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
    // Estamos en un juego, reproducir música
    playBackgroundMusic();
  } else {
    // No estamos en un juego, pausar música
    pauseBackgroundMusic();
  }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  initBackgroundMusic();
  handlePageChange();
});

// Escuchar cambios de URL (para navegación SPA)
window.addEventListener('popstate', handlePageChange);

// Función para activar música con interacción del usuario
const enableMusic = () => {
  if (backgroundMusic && backgroundMusic.paused) {
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
