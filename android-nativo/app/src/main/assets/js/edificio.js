/* ========================================
   🏢 EDIFICIO - Sube al Cielo (tipo Pou)
   Rebota en plataformas y sube infinitamente
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, playAudioFile, vibrate, celebrateCandyEarned } from './ui.js';

const BEST_KEY = 'edificio';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imágenes
const arayImage = new Image();
arayImage.src = 'img/personaje/aray_base.png';

const roomImage = new Image();
roomImage.src = 'img/fondos/edificio.png';

// Estado del juego
const state = {
  gameOver: false,
  score: 0,
  level: 1,
  player: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 70 // Más grande
  },
  platforms: [],
  cameraY: 0, // Posición de la cámara (cuánto ha subido)
  clouds: [], // Nubes decorativas
  stars: [] // Estrellas decorativas
};

// Configuración
const config = {
  platformWidth: 100,
  platformHeight: 15,
  platformGap: 180, // Separación inicial más amplia
  gravity: 0.5, // Gravedad moderada para control
  jumpPower: -16, // Ligero aumento para cubrir huecos en nivel 3
  moveSpeed: 4 // Reducido de 6 a 4 para movimiento más lento
};

// Tipos de plataformas
const PLATFORM_TYPES = [
  { name: 'roca', colors: ['#8B7355', '#6B5345'] },
  { name: 'piedra', colors: ['#808080', '#606060'] },
  { name: 'cesped', colors: ['#7CB342', '#558B2F'] },
  { name: 'madera', colors: ['#D4A574', '#B8860B'] },
  { name: 'hielo', colors: ['#B3E5FC', '#81D4FA'] },
  { name: 'nube', colors: ['#FFFFFF', '#E0E0E0'] }
];

// Inicializar canvas
const initCanvas = () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  setupControls();
};

const resizeCanvas = () => {
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  ctx.scale(dpr, dpr);
};

// Inicializar juego
const initGame = () => {
  // Limpiar animación de nivel si existe
  if (typeof window !== 'undefined' && typeof window.hideLevelUpAnimation === 'function') {
    window.hideLevelUpAnimation();
  }
  
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  state.gameOver = false;
  state.score = 0;
  state.level = 1;
  state.cameraY = 0;
  state.platforms = [];
  state.enemies = [];
  
  // Jugador empieza en el centro-abajo (ajustado para tamaño 70)
  state.player = {
    x: width / 2 - 35,
    y: height - 280,
    vx: 0,
    vy: 0,
    size: 70
  };
  
  // Crear nubes decorativas
  state.clouds = [];
  for (let i = 0; i < 10; i++) {
    state.clouds.push({
      x: Math.random() * width,
      y: Math.random() * height - i * 200,
      size: 40 + Math.random() * 40,
      speed: 0.3 + Math.random() * 0.3
    });
  }
  
  // Crear estrellas decorativas
  state.stars = [];
  for (let i = 0; i < 30; i++) {
    state.stars.push({
      x: Math.random() * width,
      y: Math.random() * height - i * 100,
      size: 10 + Math.random() * 10,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  
  // Crear plataforma inicial justo debajo
  state.platforms.push({
    x: width / 2 - config.platformWidth / 2,
    y: height - 150, // Posición absoluta inicial
    width: config.platformWidth,
    height: config.platformHeight,
    typeIndex: 2, // Césped por defecto
    isMoving: false,
    movingSpeed: 0,
    movingDirection: 1,
    minX: 0,
    maxX: width - config.platformWidth,
    hasSpike: false,
    spikePosition: null
  });
  
  // Crear plataformas hacia arriba
  for (let i = 1; i <= 25; i++) {
    createPlatform(width, height - 150 - i * config.platformGap);
  }
  
  updateGameHUD();
  gameLoop();
};

// Crear plataforma
const createPlatform = (width, absoluteY) => {
  const startX = Math.random() * (width - config.platformWidth);
  const typeIndex = Math.floor(Math.random() * PLATFORM_TYPES.length);
  
  // Decidir si la plataforma se mueve, tiene enemigo o pinchos
  const rand = Math.random();
  let isMoving = false;
  let hasEnemy = false;
  let hasSpike = false;
  let spikePosition = null;
  
  // Plataformas móviles aparecen desde nivel 2 (~300 metros)
  if (absoluteY < -300) { 
    if (rand < 0.2) {
      isMoving = true; // 20% plataformas móviles
    }
    // Enemigos eliminados
  }
  
  const platform = {
    x: startX,
    y: absoluteY,
    width: config.platformWidth,
    height: config.platformHeight,
    typeIndex: typeIndex,
    isMoving: isMoving,
    movingSpeed: isMoving ? 0.5 + Math.random() * 0.5 : 0, // Más lento (0.5–1.0)
    movingDirection: Math.random() > 0.5 ? 1 : -1,
    minX: 0,
    maxX: width - config.platformWidth,
    hasSpike: hasSpike,
    spikePosition: spikePosition
  };
  
  state.platforms.push(platform);
  
  // Enemigos eliminados
};

// Función createEnemy eliminada

// Game loop
const gameLoop = () => {
  if (state.gameOver) return;
  
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Limpiar
  ctx.clearRect(0, 0, width, height);
  
  // Fondo: edificio en la primera pantalla, luego cielo con degradados
  const roomHeight = height; // Altura del cuarto = altura de pantalla
  const roomBottomY = -state.cameraY; // Posición del cuarto en pantalla
  
  // Si estamos en la primera pantalla (cameraY < height), mostrar solo edificio
  if (state.cameraY < height) {
    // Dibujar cuarto (edificio.png) que llena toda la pantalla
    if (roomImage.complete && roomImage.naturalWidth > 0) {
      ctx.drawImage(
        roomImage,
        0, 0, // source x, y
        roomImage.naturalWidth, roomImage.naturalHeight, // source width, height
        0, 0, // dest x, y
        width, height // dest width, height
      );
    } else {
      // Fallback: cuarto oscuro
      ctx.fillStyle = '#3a2f5f';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    // Cuando salimos del edificio, mostrar cielo con degradados
    const skyProgress = Math.min((state.cameraY - height) / 2000, 1);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    if (skyProgress < 0.3) {
      // Cielo diurno
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
    } else if (skyProgress < 0.6) {
      // Atardecer
      gradient.addColorStop(0, '#FF6B9D');
      gradient.addColorStop(0.5, '#FFA07A');
      gradient.addColorStop(1, '#FFD700');
    } else {
      // Noche estrellada
      gradient.addColorStop(0, '#0F2027');
      gradient.addColorStop(0.5, '#203A43');
      gradient.addColorStop(1, '#2C5364');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Física del jugador
  state.player.vy += config.gravity;
  state.player.y += state.player.vy;
  state.player.x += state.player.vx;
  
  // Límites laterales con wrap
  if (state.player.x < -state.player.size) {
    state.player.x = width;
  } else if (state.player.x > width) {
    state.player.x = -state.player.size;
  }
  
  // Scroll de cámara cuando el jugador sube
  if (state.player.y < height * 0.4 && state.player.vy < 0) {
    const scroll = height * 0.4 - state.player.y;
    state.cameraY += scroll;
    state.player.y = height * 0.4;
    
    // Mover todas las plataformas hacia abajo
    state.platforms.forEach(p => {
      p.y += scroll;
    });
    
    // Mover nubes, estrellas y enemigos
    state.clouds.forEach(c => {
      c.y += scroll * 0.5; // Más lento que plataformas
    });
    
    state.stars.forEach(s => {
      s.y += scroll * 0.3; // Aún más lento
    });
    
    // Enemigos eliminados
  }
  
  // Actualizar plataformas móviles
  state.platforms.forEach(platform => {
    if (platform.isMoving) {
      platform.x += platform.movingSpeed * platform.movingDirection;
      
      // Rebotar en los bordes de la pantalla
      if (platform.x <= platform.minX) {
        platform.x = platform.minX;
        platform.movingDirection = 1;
      } else if (platform.x >= platform.maxX) {
        platform.x = platform.maxX;
        platform.movingDirection = -1;
      }
    }
  });
  
  // Enemigos eliminados
  
  // Colisión con plataformas (solo cuando cae)
  if (state.player.vy > 0) {
    for (const platform of state.platforms) {
      if (state.player.x + state.player.size > platform.x &&
          state.player.x < platform.x + platform.width &&
          state.player.y + state.player.size >= platform.y &&
          state.player.y + state.player.size <= platform.y + platform.height + 10) {
        
        // Rebotar automáticamente
        state.player.y = platform.y - state.player.size;
        state.player.vy = config.jumpPower;
        
        playSound('click');
        vibrate(20);
      }
    }
  }
  
  // Colisión con enemigos eliminada
  
  // Actualizar score
  state.score = Math.floor(state.cameraY / 10);
  updateGameHUD();
  
  // Generar nuevas plataformas arriba
  const highestPlatform = Math.min(...state.platforms.map(p => p.y));
  if (highestPlatform > -height) {
    for (let i = 0; i < 5; i++) {
      createPlatform(width, highestPlatform - config.platformGap * (i + 1));
    }
  }
  
  // Eliminar plataformas que salieron abajo
  state.platforms = state.platforms.filter(p => p.y < height + 100);
  
  // Generar nuevas nubes arriba
  if (state.clouds.length < 15) {
    state.clouds.push({
      x: Math.random() * width,
      y: -100,
      size: 40 + Math.random() * 40,
      speed: 0.3 + Math.random() * 0.3
    });
  }
  
  // Eliminar nubes que salieron abajo
  state.clouds = state.clouds.filter(c => c.y < height + 100);
  
  // Generar nuevas estrellas arriba
  if (state.stars.length < 40) {
    state.stars.push({
      x: Math.random() * width,
      y: -50,
      size: 10 + Math.random() * 10,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  
  // Eliminar estrellas que salieron abajo
  state.stars = state.stars.filter(s => s.y < height + 100);
  
  // Enemigos eliminados
  
  // Dar caramelos solo por subida de nivel (no cada 100 metros)
  // if (state.score > 0 && state.score % 100 === 0 && state.score !== state.lastCandyScore) {
  //   state.lastCandyScore = state.score;
  //   addCandies(1);
  //   celebrateCandyEarned();
  // }
  
  // Nivel cada 150 metros
  const newLevel = Math.max(1, Math.floor(state.score / 150) + 1);
  if (newLevel > state.level) {
    state.level = newLevel;
    // Aumentar dificultad progresiva: más separación y gravedad gradual
    config.platformGap = Math.max(120, 180 - state.level * 2); // Separación aumenta gradualmente
    config.gravity = Math.min(0.7, 0.5 + state.level * 0.02); // Gravedad aumenta gradualmente
    addCandies(1);
    celebrateCandyEarned();
    if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
      window.showLevelUpAnimation(state.level);
    }
    
    // Guardar nivel inmediatamente cuando se sube
    setBest('edificio', state.level);
    saveScoreToServer('edificio', state.level, { level: state.level, score: state.score, candies: getCandies() });
  }
  
  // Dibujar nubes
  state.clouds.forEach(cloud => {
    cloud.x += cloud.speed;
    if (cloud.x > width + 100) cloud.x = -100;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    
    // Nube con 3 círculos
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  
  // Dibujar estrellas (si es de noche)
  if (state.cameraY > 1200) {
    state.stars.forEach(star => {
      star.twinkle += 0.05;
      const opacity = 0.5 + Math.sin(star.twinkle) * 0.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size / 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  // Dibujar plataformas con diferentes estilos
  state.platforms.forEach(platform => {
    const typeIndex = platform.typeIndex || 0;
    const type = PLATFORM_TYPES[typeIndex];
    const colors = type.colors;
    
    const gradient = ctx.createLinearGradient(
      platform.x, platform.y,
      platform.x + platform.width, platform.y
    );
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Borde con brillo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Textura según tipo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    
    if (type.name === 'roca') {
      // Patrón de piedras
      for (let i = 0; i < 5; i++) {
        const x = platform.x + Math.random() * platform.width;
        const y = platform.y + Math.random() * platform.height;
        ctx.fillRect(x, y, 3, 3);
      }
    } else if (type.name === 'piedra') {
      // Líneas de ladrillo
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(platform.x + platform.width / 2, platform.y);
      ctx.lineTo(platform.x + platform.width / 2, platform.y + platform.height);
      ctx.stroke();
    } else if (type.name === 'cesped') {
      // Puntos verdes (hierba)
      ctx.fillStyle = 'rgba(0, 100, 0, 0.4)';
      for (let i = 0; i < 8; i++) {
        const x = platform.x + (platform.width / 9) * (i + 0.5);
        ctx.fillRect(x, platform.y + 2, 1, 4);
      }
    } else if (type.name === 'madera') {
      // Vetas de madera
      ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const y = platform.y + platform.height * (0.3 + i * 0.2);
        ctx.moveTo(platform.x, y);
        ctx.lineTo(platform.x + platform.width, y);
        ctx.stroke();
      }
    } else if (type.name === 'hielo') {
      // Brillo de hielo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(platform.x + 5, platform.y + 2, platform.width - 10, 3);
    }
    
    // Indicador visual si se mueve (flechitas)
    if (platform.isMoving) {
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('←', platform.x + 15, platform.y + platform.height / 2 + 3);
      ctx.fillText('→', platform.x + platform.width - 15, platform.y + platform.height / 2 + 3);
    }
  });
  
  // Dibujar enemigos eliminado
  
  // Dibujar jugador con sombra
  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowOffsetY = 5;
  
  if (arayImage.complete && arayImage.naturalWidth > 0) {
    ctx.drawImage(
      arayImage,
      state.player.x,
      state.player.y,
      state.player.size,
      state.player.size
    );
  } else {
    // Fallback
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(state.player.x, state.player.y, state.player.size, state.player.size);
  }
  
  ctx.restore();
  
  // Game Over si cae abajo
  if (state.player.y > height + 50) {
    endGame('💥 ¡Fin de juego por caída!');
    return;
  }
  
  animationId = requestAnimationFrame(gameLoop);
};

// Controles
const setupControls = () => {
  // Touch - izquierda/derecha
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    if (x < rect.width / 2) {
      state.player.vx = -config.moveSpeed;
    } else {
      state.player.vx = config.moveSpeed;
    }
  });
  
  canvas.addEventListener('touchend', () => {
    state.player.vx = 0;
  });
  
  // Mouse
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (x < rect.width / 2) {
      state.player.vx = -config.moveSpeed;
    } else {
      state.player.vx = config.moveSpeed;
    }
  });
  
  canvas.addEventListener('mouseup', () => {
    state.player.vx = 0;
  });
  
  // Teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      state.player.vx = -config.moveSpeed;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      state.player.vx = config.moveSpeed;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      state.player.vx = 0;
    }
  });
};

// End game
const endGame = async (reason = '💥 ¡Caíste!') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  playAudioFile('audio/perder.mp3', 0.5);
  
  vibrate([200, 100, 200]);
  
  const bestLevel = await getBest('edificio');
  const isNewRecord = state.level > bestLevel;
  
  // Siempre guardar el nivel actual si es mayor que el guardado
  if (state.level > bestLevel) {
    await setBest('edificio', state.level);
    saveScoreToServer('edificio', state.level, { level: state.level, score: state.score, candies: getCandies() });
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.8rem 0; font-size: 1.4rem;">${reason}</h2>
    <div class="game-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #ff6b9d, #c44569); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3); min-width: 100px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">PUNTOS</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.score}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Puntos conseguidos</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 100px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, bestLevel)}</div>
      </div>
    </div>
    <div style="display: flex; justify-content: center; margin-top: 0.8rem;">
      <button class="btn btn-primary" id="btn-restart" style="padding: 0.6rem 1.2rem; font-size: 1rem;">Reintentar</button>
    </div>
  `;
  
  // Forzar estilos inline para que tenga fondo pero NO tape el header
  const headerHeight = 60; // Altura fija del header
  
  overlay.style.position = 'absolute';
  overlay.style.inset = `${headerHeight}px 0px 0px`;
  overlay.style.width = '100%';
  overlay.style.height = `calc(100% - ${headerHeight}px)`;
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '999'; // Menor que el header (1000)
  
  overlay.classList.add('active');
  overlay.classList.remove('hidden');
  
  document.getElementById('btn-restart').addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    initGame();
  });
};

// Actualizar HUD
const updateGameHUD = () => {
  const hudLevel = document.getElementById('hud-level');
  const candiesEl = document.getElementById('hud-candies');
  
  if (hudLevel) hudLevel.textContent = `Nivel ${state.level}`;
  if (candiesEl) candiesEl.textContent = getCandies();
};

window.updateHUD = updateGameHUD;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  initCanvas();
  
  // El juego debe iniciarse automáticamente sin esperar al botón
  // (ya no hay overlay inicial)
  initGame();
  
  updateHUD();
});

