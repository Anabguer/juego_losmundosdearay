/* ========================================
   🐸 RÍO - Frogger (Cruza el río)
   Salta en troncos para cruzar sin caer al agua
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_rio';
const BEST_LEVEL_KEY = 'aray_best_level_rio';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imagen de Aray
const arayImage = new Image();
arayImage.src = 'assets/img/personaje/aray_base.png';

// Estado del juego
const state = {
  gameOver: false,
  score: 0,
  level: 1,
  crossings: 0,
  player: {
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    onLog: null
  },
  logs: [],
  cellSize: 50,
  rows: 8,
  cols: 0,
  offsetY: 0
};

// Cargar imagen de fondo del río
const riverBgImage = new Image();
riverBgImage.src = 'assets/img/fondos/rio.png';

// Configuración base de carriles (se ajusta según nivel)
const getLanes = (level) => {
  const speedMultiplier = 1 + (level - 1) * 0.2; // Aumenta 20% por nivel
  
  return [
    { type: 'safe', speed: 0 }, // Fila 0 (arriba - meta)
    { type: 'water', speed: 1.2 * speedMultiplier, direction: 1 }, // Troncos →
    { type: 'water', speed: 1.5 * speedMultiplier, direction: -1 }, // Troncos ←
    { type: 'water', speed: 1.0 * speedMultiplier, direction: 1 }, // Troncos →
    { type: 'water', speed: 1.4 * speedMultiplier, direction: -1 }, // Troncos ←
    { type: 'water', speed: 1.3 * speedMultiplier, direction: 1 }, // Troncos →
    { type: 'water', speed: 1.7 * speedMultiplier, direction: -1 }, // Troncos ←
    { type: 'safe', speed: 0 }  // Fila 7 (abajo - inicio, césped)
  ];
};

let LANES = getLanes(1);

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
  
  // Calcular grid (dejar margen arriba y abajo)
  const availableHeight = height * 0.8; // 80% de la altura para el juego
  state.cellSize = Math.floor(availableHeight / state.rows);
  state.cols = Math.ceil(width / state.cellSize);
  
  // Calcular offset vertical para centrar con más margen
  const gameHeight = state.rows * state.cellSize;
  state.offsetY = (height - gameHeight) / 2;
};

// Inicializar juego
const initGame = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  state.gameOver = false;
  state.score = 0;
  state.level = 1;
  state.crossings = 0;
  state.logs = [];
  
  // Resetear carriles al nivel 1
  LANES = getLanes(1);
  
  // Jugador empieza abajo
  state.player = {
    x: Math.floor(state.cols / 2),
    y: state.rows - 1,
    gridX: Math.floor(state.cols / 2),
    gridY: state.rows - 1,
    onLog: null
  };
  
  // Generar troncos iniciales (menos troncos, más espacio)
  const numLogs = Math.max(2, 4 - Math.floor(state.level / 2));
  const spacing = state.cellSize * (6 + state.level * 0.8); // Mucho más espacio entre troncos
  
  for (let row = 1; row < state.rows - 1; row++) {
    if (LANES[row].type === 'water') {
      for (let i = 0; i < numLogs; i++) {
        createLog(row, i * spacing);
      }
    }
  }
  
  updateGameHUD();
  gameLoop();
};

// Crear tronco (con tamaño según nivel)
const createLog = (row, offsetX) => {
  const width = canvas.width / dpr;
  
  // Troncos más cortos en niveles altos
  const baseWidth = Math.max(1.5, 2.5 - state.level * 0.15); // Empieza en 2.5, reduce con nivel
  const logWidth = baseWidth + Math.random() * 0.5;
  
  state.logs.push({
    row: row,
    x: LANES[row].direction === 1 ? offsetX : width - offsetX,
    width: logWidth,
    speed: LANES[row].speed,
    direction: LANES[row].direction
  });
};

// Game loop
const gameLoop = () => {
  if (state.gameOver) return;
  
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Limpiar canvas y dibujar fondo del juego
  ctx.fillStyle = '#7BB3FF';
  ctx.fillRect(0, 0, width, height);
  
  // Guardar contexto y aplicar offset
  ctx.save();
  ctx.translate(0, state.offsetY);
  
  // Dibujar área de juego
  drawBackground(width, state.rows * state.cellSize);
  
  ctx.restore();
  
  // Actualizar y dibujar troncos
  for (let i = state.logs.length - 1; i >= 0; i--) {
    const log = state.logs[i];
    log.x += log.speed * log.direction;
    
    // Reciclar troncos que salen de pantalla
    if (log.direction === 1 && log.x > width + state.cellSize * log.width) {
      log.x = -state.cellSize * log.width;
    } else if (log.direction === -1 && log.x < -state.cellSize * log.width) {
      log.x = width + state.cellSize * log.width;
    }
    
    drawLog(log);
  }
  
  // Actualizar jugador si está en un tronco
  if (state.player.onLog) {
    state.player.gridX += state.player.onLog.speed * state.player.onLog.direction / state.cellSize;
    
    // Game Over si sale de pantalla por los lados
    if (state.player.gridX < -1 || state.player.gridX > state.cols) {
      endGame('🌊 ¡Caíste al agua!');
      return;
    }
  }
  
  // Verificar si está en agua sin tronco
  const currentLane = LANES[state.player.gridY];
  if (currentLane && currentLane.type === 'water') {
    // Verificar si está sobre un tronco (con tolerancia mínima del 15%)
    let onLog = false;
    const tolerance = 0.15; // 15% de margen
    
    for (const log of state.logs) {
      if (log.row === state.player.gridY) {
        const logGridX = log.x / state.cellSize;
        const logEnd = logGridX + log.width;
        
        // Comprobar si el jugador está sobre el tronco
        if (state.player.gridX >= logGridX - tolerance && 
            state.player.gridX <= logEnd + tolerance) {
          onLog = true;
          state.player.onLog = log;
          break;
        }
      }
    }
    
    if (!onLog) {
      state.player.onLog = null;
      endGame('🌊 ¡Caíste al agua!');
      return;
    }
  } else {
    state.player.onLog = null;
  }
  
  // Verificar si llegó a la meta
  if (state.player.gridY === 0) {
    // ¡Cruzó el río!
    state.crossings++;
    state.score += 50 * state.level; // Más puntos en niveles altos
    
    // Subir nivel cada 3 cruces
    if (state.crossings % 3 === 0) {
      state.level++;
      
      // Mostrar animación de nivel
      if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
        window.showLevelUpAnimation(state.level);
      }
      
      LANES = getLanes(state.level);
      
      // Regenerar troncos con nueva velocidad y tamaño
      state.logs = [];
      
      // Premio por subir nivel
      addCandies(1);
      celebrateCandyEarned();
      const numLogs = Math.max(2, 4 - Math.floor(state.level / 2)); // Menos troncos en niveles altos
      const spacing = state.cellSize * (6 + state.level * 0.8); // Mucho más espacio entre troncos
      
      for (let row = 1; row < state.rows - 1; row++) {
        if (LANES[row].type === 'water') {
          for (let i = 0; i < numLogs; i++) {
            createLog(row, i * spacing);
          }
        }
      }
      
      // Subir nivel sin notificación visual
    }
    
    // Sonido y vibración
    const audio = new Audio('assets/audio/ganar.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio no disponible'));
    
    vibrate([50, 30, 50, 30, 50]);
    
    // Caramelo cada 100 puntos
    if (state.score > 0 && state.score % 100 === 0) {
      addCandies(1);
      celebrateCandyEarned();
    }
    
    updateGameHUD();
    
    // Reiniciar posición
    state.player.gridX = Math.floor(state.cols / 2);
    state.player.gridY = state.rows - 1;
    state.player.onLog = null;
  }
  
  // Dibujar jugador
  drawPlayer();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Dibujar fondo
const drawBackground = (width, height) => {
  // Dibujar imagen de fondo del río
  if (riverBgImage.complete && riverBgImage.naturalHeight !== 0) {
    // Dibujar la imagen escalada para cubrir toda el área de juego
    ctx.drawImage(riverBgImage, 0, 0, width, height);
  } else {
    // Fallback: fondo azul claro
    ctx.fillStyle = '#7BB3FF';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Dibujar las filas de agua con olas animadas (sin cubrir el fondo)
  for (let row = 1; row < state.rows - 1; row++) {
    const y = row * state.cellSize;
    const lane = LANES[row];
    
    if (lane.type === 'water') {
      // Olas animadas sobre el fondo (sin cubrir el fondo)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        const x = (width / 10) * i + (Date.now() / 10) % 50;
        ctx.arc(x, y + state.cellSize / 2, 8, 0, Math.PI, false);
        ctx.stroke();
      }
    }
  }
};

// Dibujar tronco
const drawLog = (log) => {
  const x = log.x;
  const y = log.row * state.cellSize + state.cellSize * 0.15 + state.offsetY;
  const w = log.width * state.cellSize;
  const h = state.cellSize * 0.7;
  
  // Tronco marrón
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x, y, w, h);
  
  // Textura de madera
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const lineY = y + h * (0.25 + i * 0.25);
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + w, lineY);
    ctx.stroke();
  }
  
  // Borde
  ctx.strokeStyle = '#5C3317';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
};

// Dibujar jugador
const drawPlayer = () => {
  const x = state.player.gridX * state.cellSize;
  const y = state.player.gridY * state.cellSize + state.cellSize * 0.15 + state.offsetY;
  const size = state.cellSize * 0.7;
  
  if (arayImage.complete && arayImage.naturalWidth > 0) {
    ctx.drawImage(arayImage, x, y, size, size);
  } else {
    // Fallback
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x, y, size, size);
    
    ctx.font = `${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐸', x + size / 2, y + size / 2);
  }
};

// Controles
const setupControls = () => {
  // Teclado
  window.addEventListener('keydown', (e) => {
    if (state.gameOver) return;
    
    let newX = state.player.gridX;
    let newY = state.player.gridY;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newY = Math.max(0, state.player.gridY - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newY = Math.min(state.rows - 1, state.player.gridY + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newX = Math.max(0, state.player.gridX - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newX = Math.min(state.cols - 1, state.player.gridX + 1);
    }
    
    if (newX !== state.player.gridX || newY !== state.player.gridY) {
      state.player.gridX = newX;
      state.player.gridY = newY;
      state.player.onLog = null;
      
      playSound('click');
      vibrate(10);
    }
  });
  
  // Touch - usar posición de Aray como referencia
  canvas.addEventListener('pointerdown', (e) => {
    if (state.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calcular posición de Aray en pantalla
    const arayScreenY = state.offsetY + state.player.gridY * state.cellSize + state.cellSize / 2;
    
    let newX = state.player.gridX;
    let newY = state.player.gridY;
    
    // Determinar dirección según dónde tocó respecto a Aray
    if (y < arayScreenY) {
      // Arriba de Aray = SUBIR
      newY = Math.max(0, state.player.gridY - 1);
    } else {
      // Abajo de Aray = BAJAR
      newY = Math.min(state.rows - 1, state.player.gridY + 1);
    }
    
    if (newX !== state.player.gridX || newY !== state.player.gridY) {
      state.player.gridX = newX;
      state.player.gridY = newY;
      state.player.onLog = null;
      
      playSound('click');
      vibrate(10);
    }
    
    e.preventDefault();
  });
};

// End game
const endGame = (reason = '🌊 ¡Caíste al agua!') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.score > bestScore;
  const bestLevel = getBest(BEST_LEVEL_KEY) || 1;
  const isNewLevelRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.score);
    saveScoreToServer('rio', state.score, { score: state.score, candies: getCandies() });
  }
  
  if (isNewLevelRecord) {
    localStorage.setItem(BEST_LEVEL_KEY, state.level.toString());
  }
  
  // SIEMPRE guardar el nivel actual en Firestore (no solo si es récord)
  console.log('🔍 Río - Verificando GameBridge:', {
    gameBridge: !!window.GameBridge,
    updateBestLevel: !!(window.GameBridge && window.GameBridge.updateBestLevel),
    level: state.level,
    windowKeys: Object.keys(window).filter(k => k.includes('Game') || k.includes('Bridge'))
  });

  // Función para intentar guardar con retry
  const trySaveProgress = (retries = 3) => {
    if (window.GameBridge && window.GameBridge.updateBestLevel) {
      console.log('💾 Río - Guardando nivel en Firestore:', state.level);
      try {
        window.GameBridge.updateBestLevel('rio', state.level);
        console.log('✅ Río - updateBestLevel llamado exitosamente');
      } catch (error) {
        console.error('❌ Río - Error llamando updateBestLevel:', error);
      }
    } else if (retries > 0) {
      console.log(`⏳ Río - GameBridge no disponible, reintentando en 500ms... (${retries} intentos restantes)`);
      setTimeout(() => trySaveProgress(retries - 1), 500);
    } else {
      console.error('❌ Río - GameBridge no disponible después de 3 intentos');
      console.log('🔍 Río - window.GameBridge:', window.GameBridge);
      console.log('🔍 Río - updateBestLevel method:', window.GameBridge?.updateBestLevel);
    }
  };

  trySaveProgress();
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${reason}</h2>
    <div class="game-stats" style="display: flex; justify-content: center; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, parseInt(localStorage.getItem('aray_best_level_rio')) || 1)}</div>
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
  
  const bestLevel = getBest(BEST_LEVEL_KEY) || 1;
  const bestLevelEl = document.getElementById('best-level');
  if (bestLevelEl) {
    bestLevelEl.textContent = bestLevel;
  }
  
  document.getElementById('btn-start').addEventListener('click', () => {
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    initGame();
  });
  
  updateHUD();
});
