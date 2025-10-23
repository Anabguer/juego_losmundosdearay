/* ========================================
   🐍 PARQUE - Snake con Aray
   La serpiente clásica con la cabeza de Aray
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_parque';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imagen de Aray
const arayImage = new Image();
arayImage.src = 'assets/img/personaje/aray_head_happy2.png';

// Tipos de dulces (igual que en tienda)
const CANDY_TYPES = ['🍭', '🍬', '🍫', '🍩', '🍪', '🧁', '🍰', '🎂'];
const CANDY_COLORS = ['#ff6b6b', '#4ecdc4', '#8b4513', '#ffb347', '#d2691e', '#ff69b4', '#9b59b6', '#3498db'];

// Estado del juego
const state = {
  gameOver: false,
  score: 0,
  level: 1,
  snake: [],
  direction: 'right',
  nextDirection: 'right',
  food: { x: 0, y: 0, type: 0 }, // type = índice del emoji
  cellSize: 20,
  cols: 0,
  rows: 0,
  moveDelay: 250, // ms entre movimientos (más lento)
  lastMove: 0
};

// Teclas presionadas
const keys = {};

// Inicializar canvas
const initCanvas = () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Controles de teclado
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      handleKeyPress(e.key);
    }
  });
  
  // Controles de botones
  document.getElementById('btn-up')?.addEventListener('click', () => handleKeyPress('ArrowUp'));
  document.getElementById('btn-down')?.addEventListener('click', () => handleKeyPress('ArrowDown'));
  document.getElementById('btn-left')?.addEventListener('click', () => handleKeyPress('ArrowLeft'));
  document.getElementById('btn-right')?.addEventListener('click', () => handleKeyPress('ArrowRight'));
  
  // Touch controls
  let touchStartX = 0;
  let touchStartY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  
  canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal
      if (dx > 30) handleKeyPress('ArrowRight');
      else if (dx < -30) handleKeyPress('ArrowLeft');
    } else {
      // Vertical
      if (dy > 30) handleKeyPress('ArrowDown');
      else if (dy < -30) handleKeyPress('ArrowUp');
    }
  });
};

const handleKeyPress = (key) => {
  // Evitar ir en dirección opuesta
  switch (key) {
    case 'ArrowUp':
      if (state.direction !== 'down') state.nextDirection = 'up';
      break;
    case 'ArrowDown':
      if (state.direction !== 'up') state.nextDirection = 'down';
      break;
    case 'ArrowLeft':
      if (state.direction !== 'right') state.nextDirection = 'left';
      break;
    case 'ArrowRight':
      if (state.direction !== 'left') state.nextDirection = 'right';
      break;
  }
};

const resizeCanvas = () => {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
        // Tamaño equilibrado - ocupa casi toda la pantalla con márgenes apropiados
        const width = containerWidth - 20; // 20px margen horizontal
        const height = containerHeight - 220; // 220px para HUD arriba y controles abajo (más espacio para botones)
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // Centrar el canvas
  canvas.style.margin = '0 auto';
  canvas.style.display = 'block';
  
  ctx.scale(dpr, dpr);
  
  // Calcular grid
  state.cols = Math.floor(width / state.cellSize);
  state.rows = Math.floor(height / state.cellSize);
};

// Dibujar serpiente
const drawSnake = () => {
  state.snake.forEach((segment, index) => {
    const x = segment.x * state.cellSize;
    const y = segment.y * state.cellSize;
    
    if (index === 0) {
      // Cabeza - imagen de Aray rotada
      if (arayImage.complete && arayImage.naturalWidth > 0) {
        ctx.save();
        
        const centerX = x + state.cellSize / 2;
        const centerY = y + state.cellSize / 2;
        
        ctx.translate(centerX, centerY);
        
        // Rotar según dirección
        switch (state.direction) {
          case 'right':
            // Sin rotación (0°)
            break;
          case 'left':
            ctx.rotate(Math.PI); // 180°
            break;
          case 'up':
            ctx.rotate(-Math.PI / 2); // -90°
            break;
          case 'down':
            ctx.rotate(Math.PI / 2); // 90°
            break;
        }
        
        const size = state.cellSize * 0.95;
        ctx.drawImage(
          arayImage,
          -size / 2,
          -size / 2,
          size,
          size
        );
        
        ctx.restore();
      } else {
        // Fallback: cuadrado verde brillante
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 2, y + 2, state.cellSize - 4, state.cellSize - 4);
        ctx.strokeStyle = '#00cc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, state.cellSize - 4, state.cellSize - 4);
      }
    } else {
      // Cuerpo - verde con gradiente
      const greenValue = Math.max(150 - index * 3, 80);
      ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
      ctx.fillRect(x + 3, y + 3, state.cellSize - 6, state.cellSize - 6);
      
      // Borde sutil
      ctx.strokeStyle = '#004400';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, state.cellSize - 6, state.cellSize - 6);
    }
  });
};

// Inicializar juego
const initGame = () => {
  console.log('🐍 Iniciando Snake...');
  
  state.gameOver = false;
  state.score = 0;
  state.level = 1;
  state.direction = 'right';
  state.nextDirection = 'right';
  state.lastMove = Date.now();
  
  // Crear serpiente inicial (3 segmentos en el centro)
  const centerX = Math.floor(state.cols / 2);
  const centerY = Math.floor(state.rows / 2);
  
  state.snake = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY }
  ];
  
  // Crear comida
  spawnFood();
  
  updateGameHUD();
  gameLoop();
};

// Spawn comida
const spawnFood = () => {
  let validPosition = false;
  
  while (!validPosition) {
    state.food.x = Math.floor(Math.random() * state.cols);
    state.food.y = Math.floor(Math.random() * state.rows);
    state.food.type = Math.floor(Math.random() * CANDY_TYPES.length); // Tipo aleatorio
    
    // Verificar que no esté en la serpiente
    validPosition = !state.snake.some(segment => 
      segment.x === state.food.x && segment.y === state.food.y
    );
  }
};

// Game loop
const gameLoop = () => {
  if (state.gameOver) return;
  
  const now = Date.now();
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Limpiar
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);
  
  // Dibujar grid (opcional)
  drawGrid();
  
  // Mover serpiente
  if (now - state.lastMove > state.moveDelay) {
    moveSnake();
    state.lastMove = now;
  }
  
  // Dibujar comida
  drawFood();
  
  // Dibujar serpiente
  drawSnake();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Dibujar grid
const drawGrid = () => {
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  
  for (let x = 0; x <= state.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * state.cellSize, 0);
    ctx.lineTo(x * state.cellSize, state.rows * state.cellSize);
    ctx.stroke();
  }
  
  for (let y = 0; y <= state.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * state.cellSize);
    ctx.lineTo(state.cols * state.cellSize, y * state.cellSize);
    ctx.stroke();
  }
};

// Dibujar comida
const drawFood = () => {
  const x = state.food.x * state.cellSize;
  const y = state.food.y * state.cellSize;
  
  // Solo emoji del dulce, sin fondo ni bordes
  ctx.font = `${state.cellSize * 0.8}px Arial`; // Más grande
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    CANDY_TYPES[state.food.type],
    x + state.cellSize / 2,
    y + state.cellSize / 2
  );
};

// Mover serpiente
const moveSnake = () => {
  // Actualizar dirección
  state.direction = state.nextDirection;
  
  // Calcular nueva posición de la cabeza
  const head = { ...state.snake[0] };
  
  switch (state.direction) {
    case 'up':
      head.y--;
      break;
    case 'down':
      head.y++;
      break;
    case 'left':
      head.x--;
      break;
    case 'right':
      head.x++;
      break;
  }
  
  // Verificar colisión con paredes
  if (head.x < 0 || head.x >= state.cols || head.y < 0 || head.y >= state.rows) {
    endGame('💥 ¡Chocaste con la pared!');
    return;
  }
  
  // Verificar colisión con el cuerpo
  if (state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    endGame('🐍 ¡Te mordiste a ti mismo!');
    return;
  }
  
  // Añadir nueva cabeza
  state.snake.unshift(head);
  
  // Verificar si comió
  if (head.x === state.food.x && head.y === state.food.y) {
    // Crecer (no quitar la cola)
    state.score += 10;
    updateGameHUD();
    // Nivel: cada 50 puntos (5 comidas)
    const newLevel = Math.max(1, Math.floor(state.score / 50) + 1);
    if (newLevel > state.level) {
      state.level = newLevel;
      // acelerar ligeramente
      state.moveDelay = Math.max(120, state.moveDelay - 15);
      addCandies(1);
      celebrateCandyEarned();
      if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
        window.showLevelUpAnimation(state.level);
      }
    }
    
    // Sonido de galleta
    const audio = new Audio('assets/audio/galleta.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio no disponible'));
    
    vibrate(30);
    
    // Caramelo cada 100 puntos
    if (state.score > 0 && state.score % 100 === 0) {
      addCandies(1);
      celebrateCandyEarned();
    }
    
    // Aumentar velocidad cada 100 puntos (más gradual)
    if (state.score % 100 === 0 && state.moveDelay > 100) {
      state.moveDelay -= 15;
    }
    
    spawnFood();
  } else {
    // No comió - quitar cola (mantener tamaño)
    state.snake.pop();
  }
};

// Fin del juego
const endGame = (message = '🐍 Fin del juego') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  // Sonido
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.score > bestScore;
  const bestLevel = parseInt(localStorage.getItem('aray_best_level_parque')) || 1;
  const isNewLevelRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.score);
    saveScoreToServer('parque', state.score, { score: state.score, candies: getCandies() });
  }
  
  if (isNewLevelRecord) {
    localStorage.setItem('aray_best_level_parque', state.level.toString());
  }
  
  // SIEMPRE guardar el nivel actual en Firestore (no solo si es récord)
  console.log('🔍 Parque - Verificando GameBridge:', {
    gameBridge: !!window.GameBridge,
    updateBestLevel: !!(window.GameBridge && window.GameBridge.updateBestLevel),
    level: state.level,
    windowKeys: Object.keys(window).filter(k => k.includes('Game') || k.includes('Bridge'))
  });
  
  // Función para intentar guardar con retry
  const trySaveProgress = (retries = 3) => {
    if (window.GameBridge && window.GameBridge.updateBestLevel) {
      console.log('💾 Parque - Guardando nivel en Firestore:', state.level);
      try {
        window.GameBridge.updateBestLevel('parque', state.level);
        console.log('✅ Parque - updateBestLevel llamado exitosamente');
      } catch (error) {
        console.error('❌ Parque - Error llamando updateBestLevel:', error);
      }
    } else if (retries > 0) {
      console.log(`⏳ Parque - GameBridge no disponible, reintentando en 500ms... (${retries} intentos restantes)`);
      setTimeout(() => trySaveProgress(retries - 1), 500);
    } else {
      console.error('❌ Parque - GameBridge no disponible después de 3 intentos');
      console.log('🔍 Parque - window.GameBridge:', window.GameBridge);
      console.log('🔍 Parque - updateBestLevel method:', window.GameBridge?.updateBestLevel);
    }
  };
  
  trySaveProgress();
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2>${message}</h2>
    <div class="game-stats" style="display: flex; justify-content: center; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, parseInt(localStorage.getItem('aray_best_level_parque')) || 1)}</div>
      </div>
    </div>
    <div style="display: flex; justify-content: center; margin-top: 0.8rem;">
      <button class="btn btn-primary" id="btn-restart" style="padding: 0.6rem 1.2rem; font-size: 1rem;">Reintentar</button>
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
  const scoreEl = document.getElementById('hud-score');
  const candiesEl = document.getElementById('hud-candies');
  
  if (scoreEl) scoreEl.textContent = `Nivel ${state.level}`;
  if (candiesEl) candiesEl.textContent = getCandies();
};

window.updateHUD = updateGameHUD;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  initCanvas();
  
  const bestLevel = getBest('aray_best_level_parque') || 1;
  
  // Solo actualizar elementos que existen
  const bestLevelEl = document.getElementById('best-level');
  const bestScoreEl = document.getElementById('best-score');
  const totalCandiesEl = document.getElementById('total-candies');
  
  if (bestLevelEl) {
    bestLevelEl.textContent = bestLevel;
  }
  if (bestScoreEl) {
    bestScoreEl.textContent = getBest(BEST_KEY);
  }
  if (totalCandiesEl) {
    totalCandiesEl.textContent = getCandies();
  }
  
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('game-overlay').classList.add('hidden');
    initGame();
  });
  
  updateHUD();
  
  // Controles de botones
  document.getElementById('btn-up')?.addEventListener('click', () => handleKeyPress('ArrowUp'));
  document.getElementById('btn-down')?.addEventListener('click', () => handleKeyPress('ArrowDown'));
  document.getElementById('btn-left')?.addEventListener('click', () => handleKeyPress('ArrowLeft'));
  document.getElementById('btn-right')?.addEventListener('click', () => handleKeyPress('ArrowRight'));
});
