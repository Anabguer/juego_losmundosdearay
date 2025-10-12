/* ========================================
   🏢 EDIFICIO - Sube al Cielo (tipo Pou)
   Rebota en plataformas y sube infinitamente
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js';

const BEST_KEY = 'aray_best_edificio';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imágenes
const arayImage = new Image();
arayImage.src = 'assets/img/personaje/aray_base.png';

const roomImage = new Image();
roomImage.src = 'assets/img/fondos/edificio.png';

// Cargar imágenes de enemigos (zombies)
const enemyImages = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `assets/img/enemigos/zombie${i}.png`;
  enemyImages.push(img);
}

// Estado del juego
const state = {
  gameOver: false,
  score: 0,
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
  stars: [], // Estrellas decorativas
  enemies: [] // Enemigos en plataformas
};

// Configuración
const config = {
  platformWidth: 100,
  platformHeight: 15,
  platformGap: 180, // Mucho más separadas para evitar choques
  gravity: 0.6,
  jumpPower: -17,
  moveSpeed: 6
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
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  state.gameOver = false;
  state.score = 0;
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
  
  if (absoluteY < -200) { // Solo después del cuarto
    if (rand < 0.2) {
      isMoving = true; // 20% plataformas móviles
    } else if (rand < 0.35) {
      hasEnemy = true; // 15% con enemigo
    }
    // Pinchos eliminados
  }
  
  const platform = {
    x: startX,
    y: absoluteY,
    width: config.platformWidth,
    height: config.platformHeight,
    typeIndex: typeIndex,
    isMoving: isMoving,
    movingSpeed: isMoving ? 0.8 + Math.random() * 1.0 : 0, // Más lento
    movingDirection: Math.random() > 0.5 ? 1 : -1,
    minX: 0,
    maxX: width - config.platformWidth,
    hasSpike: hasSpike,
    spikePosition: spikePosition
  };
  
  state.platforms.push(platform);
  
  // Crear enemigo si corresponde
  if (hasEnemy) {
    createEnemy(platform, absoluteY);
  }
};

// Crear enemigo en plataforma
const createEnemy = (platform, platformY) => {
  const enemyImage = enemyImages[Math.floor(Math.random() * enemyImages.length)];
  
  state.enemies.push({
    x: platform.x + 10,
    y: platformY - 40, // Encima de la plataforma
    platformX: platform.x,
    platformWidth: platform.width,
    size: 35,
    speed: 0.2 + Math.random() * 0.3, // Mucho más lento
    direction: Math.random() > 0.5 ? 1 : -1,
    image: enemyImage
  });
};

// Game loop
const gameLoop = () => {
  if (state.gameOver) return;
  
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Limpiar
  ctx.clearRect(0, 0, width, height);
  
  // Fondo: cuarto abajo, luego cielo
  const roomHeight = 800; // Altura del cuarto
  const roomBottomY = -state.cameraY; // Posición del cuarto en pantalla
  
  if (roomBottomY > -roomHeight && roomBottomY < height) {
    // Dibujar cuarto (edificio.png)
    if (roomImage.complete && roomImage.naturalWidth > 0) {
      const roomY = Math.max(0, roomBottomY);
      const roomDrawHeight = Math.min(roomHeight, height - roomY);
      const sourceY = roomBottomY < 0 ? -roomBottomY : 0;
      
      ctx.drawImage(
        roomImage,
        0, sourceY, // source x, y
        roomImage.naturalWidth, roomDrawHeight, // source width, height
        0, roomY, // dest x, y
        width, roomDrawHeight // dest width, height
      );
    } else {
      // Fallback: cuarto oscuro
      ctx.fillStyle = '#3a2f5f';
      ctx.fillRect(0, Math.max(0, roomBottomY), width, roomHeight);
    }
  }
  
  // Fondo del cielo con gradiente según altura
  const skyTop = roomBottomY - roomHeight;
  if (skyTop < height) {
    const skyY = Math.max(0, skyTop);
    const skyHeight = height - skyY;
    
    const skyProgress = Math.min(state.cameraY / 2000, 1);
    const gradient = ctx.createLinearGradient(0, skyY, 0, skyY + skyHeight);
    
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
    ctx.fillRect(0, skyY, width, skyHeight);
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
    
    state.enemies.forEach(e => {
      e.y += scroll; // Se mueven con las plataformas
    });
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
  
  // Actualizar enemigos (se mueven con su plataforma)
  state.enemies.forEach(enemy => {
    // Encontrar la plataforma del enemigo
    const platform = state.platforms.find(p => Math.abs(p.y - enemy.y - 40) < 5);
    
    if (platform) {
      enemy.platformX = platform.x;
      enemy.platformWidth = platform.width;
    }
    
    // Mover enemigo de lado a lado en su plataforma
    enemy.x += enemy.speed * enemy.direction;
    
    // Rebotar en los bordes de la plataforma
    if (enemy.x < enemy.platformX) {
      enemy.x = enemy.platformX;
      enemy.direction = 1;
    } else if (enemy.x + enemy.size > enemy.platformX + enemy.platformWidth) {
      enemy.x = enemy.platformX + enemy.platformWidth - enemy.size;
      enemy.direction = -1;
    }
  });
  
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
  
  // Colisión con enemigos (área reducida, más justo)
  for (const enemy of state.enemies) {
    const margin = 15; // Margen de seguridad
    
    if (state.player.x + state.player.size - margin > enemy.x + margin &&
        state.player.x + margin < enemy.x + enemy.size - margin &&
        state.player.y + state.player.size - margin > enemy.y + margin &&
        state.player.y + margin < enemy.y + enemy.size - margin) {
      
      // Game Over por demonio
      endGame('👿 ¡Te atrapó un demonio!');
      return;
    }
  }
  
  // Pinchos eliminados
  
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
  
  // Eliminar enemigos que salieron abajo
  state.enemies = state.enemies.filter(e => e.y < height + 100);
  
  // Dar caramelos
  if (state.score > 0 && state.score % 100 === 0 && state.score !== state.lastCandyScore) {
    state.lastCandyScore = state.score;
    addCandies(1);
    celebrateCandyEarned();
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
  
  // Dibujar enemigos
  state.enemies.forEach(enemy => {
    ctx.save();
    
    // Voltear imagen según dirección
    if (enemy.direction === -1) {
      ctx.translate(enemy.x + enemy.size, enemy.y);
      ctx.scale(-1, 1);
      ctx.translate(-enemy.x - enemy.size, -enemy.y);
    }
    
    if (enemy.image && enemy.image.complete && enemy.image.naturalWidth > 0) {
      ctx.drawImage(
        enemy.image,
        enemy.x,
        enemy.y,
        enemy.size,
        enemy.size
      );
    } else {
      // Fallback: fantasma emoji
      ctx.font = `${enemy.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👻', enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
    }
    
    ctx.restore();
  });
  
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
    endGame();
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
const endGame = (reason = '💥 ¡Caíste!') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.score > bestScore;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.score);
    saveScoreToServer('edificio', state.score, { score: state.score, candies: getCandies() });
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2>${reason}</h2>
    <div class="game-stats">
      <div class="stat-line">
        <span>Altura alcanzada:</span>
        <strong>${state.score}<span style="color: #d900ff;">m</span></strong>
      </div>
      <div class="stat-line">
        <span>Mejor altura:</span>
        <strong>${Math.max(state.score, bestScore)}<span style="color: #d900ff;">m</span></strong>
      </div>
      <div class="stat-line">
        <span>Golosinas ganadas:</span>
        <strong>${Math.floor(state.score / 100)}</strong>
      </div>
    </div>
    ${isNewRecord ? '<p style="font-size: 1.5rem; margin: 1rem 0;">🏆 ¡NUEVO RÉCORD! 🏆</p>' : ''}
    <div style="display: flex; justify-content: center; margin-top: 16px;">
      <button class="btn btn-primary" id="btn-restart">Reintentar</button>
    </div>
  `;
  
  overlay.classList.add('active');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  
  document.getElementById('btn-restart').addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    initGame();
  });
};

// Actualizar HUD
const updateGameHUD = () => {
  const heightEl = document.getElementById('hud-height');
  const candiesEl = document.getElementById('hud-candies');
  
  if (heightEl) heightEl.textContent = state.score;
  if (candiesEl) candiesEl.textContent = getCandies();
};

window.updateHUD = updateGameHUD;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  initCanvas();
  
  const bestScore = getBest(BEST_KEY);
  document.getElementById('best-height').textContent = bestScore;
  document.getElementById('total-candies').textContent = getCandies();
  
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('game-overlay').classList.add('hidden');
    initGame();
  });
  
  updateHUD();
});

