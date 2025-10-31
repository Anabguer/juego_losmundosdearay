/* ========================================
   🐍 PARQUE - Snake con Aray
   La serpiente clásica con la cabeza de Aray
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, playAudioFile, vibrate, celebrateCandyEarned } from './ui.js';

const BEST_KEY = 'parque';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imagen de Aray
const arayImage = new Image();
arayImage.src = 'img/personaje/aray_head_happy2.png';

// Tipos de dulces (igual que en tienda)
const CANDY_TYPES = ['🍭', '🍬', '🍫', '🍩', '🍪', '🧁', '🍰', '🎂'];
const CANDY_COLORS = ['#ff6b6b', '#4ecdc4', '#8b4513', '#ffb347', '#d2691e', '#ff69b4', '#9b59b6', '#3498db'];

// Estado del juego
const state = {
  gameOver: false,
  paused: false,
  score: 0,
  level: 1,
  snake: [],
  direction: 'right',
  nextDirection: 'right',
  food: { x: 0, y: 0, type: 0 }, // type = índice del emoji
  cellSize: 30,
  cols: 0,
  rows: 0,
  moveDelay: 400, // ms entre movimientos (más lento al inicio)
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
  
  // Botón de pausa
  document.getElementById('btn-pause')?.addEventListener('click', togglePause);
  
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
        const height = containerHeight - 180; // 180px para HUD arriba y controles abajo (más espacio para grid)
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // Centrar el canvas
  canvas.style.margin = '0 auto';
  canvas.style.display = 'block';
  
  ctx.scale(dpr, dpr);
  
  // Calcular grid - usar todo el espacio disponible
  state.cols = Math.floor(width / state.cellSize);
  state.rows = Math.floor(height / state.cellSize);
};

// Dibujar serpiente
const drawSnake = () => {
  // Calcular offset para centrar el grid
  const gridWidth = state.cols * state.cellSize;
  const gridHeight = state.rows * state.cellSize;
  const offsetX = (canvas.width / dpr - gridWidth) / 2;
  const offsetY = (canvas.height / dpr - gridHeight) / 2;
  
  state.snake.forEach((segment, index) => {
    const x = offsetX + segment.x * state.cellSize;
    const y = offsetY + segment.y * state.cellSize;
    
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
  
  // Limpiar animación de nivel si existe
  if (typeof window !== 'undefined' && typeof window.hideLevelUpAnimation === 'function') {
    window.hideLevelUpAnimation();
  }
  
  // CANCELAR cualquier loop anterior
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // LIMPIAR completamente el canvas
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  ctx.clearRect(0, 0, width, height);
  
  // Calcular área del grid
  const gridWidth = state.cols * state.cellSize;
  const gridHeight = state.rows * state.cellSize;
  const offsetX = (width - gridWidth) / 2;
  const offsetY = (height - gridHeight) / 2;
  
  // Dibujar fondo turquesa SOLO sobre el área del grid
  ctx.fillStyle = 'rgba(78, 205, 196, 0.8)'; // Color turquesa al 80% de opacidad
  ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);
  
  // Resetear estado
  state.gameOver = false;
  state.paused = false;
  state.score = 0;
  state.level = 1;
  state.direction = 'right';
  state.nextDirection = 'right';
  state.moveDelay = 400; // Velocidad inicial lenta
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

// Función de pausa
const togglePause = () => {
  state.paused = !state.paused;
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.textContent = state.paused ? '▶' : '⏸';
    pauseBtn.style.background = state.paused ? 'rgba(46, 204, 113, 0.8)' : 'rgba(78, 205, 196, 0.8)';
  }
  
  if (!state.paused) {
    gameLoop(); // Reanudar el loop
  }
};

// Game loop
const gameLoop = () => {
  if (state.gameOver || state.paused) return;
  
  const now = Date.now();
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // LIMPIAR COMPLETAMENTE el canvas primero
  ctx.clearRect(0, 0, width, height);
  
  // Calcular área del grid
  const gridWidth = state.cols * state.cellSize;
  const gridHeight = state.rows * state.cellSize;
  const offsetX = (width - gridWidth) / 2;
  const offsetY = (height - gridHeight) / 2;
  
  // Dibujar fondo turquesa SOLO sobre el área del grid
  ctx.fillStyle = 'rgba(78, 205, 196, 0.8)'; // Color turquesa al 80% de opacidad
  ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);
  
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
  
  // Calcular offset para centrar el grid
  const gridWidth = state.cols * state.cellSize;
  const gridHeight = state.rows * state.cellSize;
  const offsetX = (canvas.width / dpr - gridWidth) / 2;
  const offsetY = (canvas.height / dpr - gridHeight) / 2;
  
  for (let x = 0; x <= state.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x * state.cellSize, offsetY);
    ctx.lineTo(offsetX + x * state.cellSize, offsetY + gridHeight);
    ctx.stroke();
  }
  
  for (let y = 0; y <= state.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * state.cellSize);
    ctx.lineTo(offsetX + gridWidth, offsetY + y * state.cellSize);
    ctx.stroke();
  }
};

// Dibujar comida
const drawFood = () => {
  // Calcular offset para centrar el grid
  const gridWidth = state.cols * state.cellSize;
  const gridHeight = state.rows * state.cellSize;
  const offsetX = (canvas.width / dpr - gridWidth) / 2;
  const offsetY = (canvas.height / dpr - gridHeight) / 2;
  
  const x = offsetX + state.food.x * state.cellSize;
  const y = offsetY + state.food.y * state.cellSize;
  
  // Solo emoji del dulce, sin fondo ni bordes
  ctx.font = `${state.cellSize * 0.8}px Arial`; // Más grande
  ctx.fillStyle = '#000000'; // Color negro para el emoji (visible)
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
      
      // Calcular velocidad basada en el nivel
      // Nivel 1: 400ms, Nivel 2: 370ms, Nivel 3: 340ms, etc.
      // Fórmula: 400 - (nivel - 1) * 20, mínimo 120ms
      state.moveDelay = Math.max(120, 400 - (state.level - 1) * 20);
      
      console.log(`🎉 Nivel ${state.level} - Velocidad ajustada: ${state.moveDelay}ms`);
      
      addCandies(1);
      celebrateCandyEarned();
      
      if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
        window.showLevelUpAnimation(state.level);
      }
    }
    
    // Sonido de galleta (ruta unificada)
    playAudioFile('audio/galleta.mp3', 0.5);
    
    vibrate(30);
    
    spawnFood();
  } else {
    // No comió - quitar cola (mantener tamaño)
    state.snake.pop();
  }
};

// Fin del juego
const endGame = async (message = '🐍 Fin del juego') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  // Sonido
  playAudioFile('audio/perder.mp3', 0.5);
  
  vibrate([200, 100, 200]);
  
  const bestLevel = await getBest('parque');
  const isNewRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    await setBest('parque', state.level); // Guardar NIVEL
    saveScoreToServer('parque', state.level, { level: state.level, score: state.score, candies: getCandies() });
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.8rem 0; font-size: 1.4rem;">😅 Fin del juego</h2>
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
  
  // Controles de botones
  document.getElementById('btn-up')?.addEventListener('click', () => handleKeyPress('ArrowUp'));
  document.getElementById('btn-down')?.addEventListener('click', () => handleKeyPress('ArrowDown'));
  document.getElementById('btn-left')?.addEventListener('click', () => handleKeyPress('ArrowLeft'));
  document.getElementById('btn-right')?.addEventListener('click', () => handleKeyPress('ArrowRight'));
  
  // Botón de pausa
  document.getElementById('btn-pause')?.addEventListener('click', togglePause);
});
