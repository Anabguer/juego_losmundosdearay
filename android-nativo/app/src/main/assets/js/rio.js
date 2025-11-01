/* ========================================
   🐸 RÍO - Frogger (Cruza el río)
   Salta en troncos para cruzar sin caer al agua
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, playAudioFile, vibrate, celebrateCandyEarned } from './ui.js';

const BEST_KEY = 'rio';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imagen de Aray
const arayImage = new Image();
arayImage.src = 'img/personaje/aray_base.webp';

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

// --- Ajustes finos de movimiento y colisión ---
const PLAYER_WIDTH_CELLS = 0.7;   // hitbox horizontal (coherente con drawPlayer)
const EPSILON = 0.02;             // tolerancia flotante
const MIN_OVERLAP_FRACTION = 0.50; // al menos 50% del jugador debe estar sobre el tronco
const CENTER_MARGIN_FRACTION = 0.10; // margen interior (10%) para que no valgan bordes
const H_STEP_CELLS = 0.25;        // paso lateral pequeño
const V_STEP_ROWS  = 1;           // salto vertical normal

// Cargar imagen de fondo del río
const riverBgImage = new Image();
riverBgImage.src = 'img/fondos/rio.webp';

// Cargar imagen de tronco
const logImage = new Image();
logImage.src = 'img/tronco1.webp';

// Configuración base de carriles (se ajusta según nivel)
const getLanes = (level) => {
  const speedMultiplier = 0.5 + (level - 1) * 0.15; // Empieza más lento, aumenta 15% por nivel
  
  return [
    { type: 'safe', speed: 0 }, // Fila 0 (arriba - meta)
    { type: 'water', speed: 0.8 * speedMultiplier, direction: 1 }, // Troncos →
    { type: 'water', speed: 1.0 * speedMultiplier, direction: -1 }, // Troncos ←
    { type: 'water', speed: 0.7 * speedMultiplier, direction: 1 }, // Troncos →
    { type: 'water', speed: 0.9 * speedMultiplier, direction: -1 }, // Troncos ←
    { type: 'water', speed: 0.8 * speedMultiplier, direction: 1 }, // Troncos →
    { type: 'water', speed: 1.1 * speedMultiplier, direction: -1 }, // Troncos ←
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
  // Limpiar animación de nivel si existe
  if (typeof window !== 'undefined' && typeof window.hideLevelUpAnimation === 'function') {
    window.hideLevelUpAnimation();
  }
  
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
  
  // Generar troncos iniciales (más troncos, menos espacio)
  const numLogs = Math.max(3, 5 - Math.floor(state.level / 3)); // Más troncos
  const spacing = state.cellSize * (3 + state.level * 0.4); // Menos espacio entre troncos
  
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

// Verificar colisión con agua (centralizada)
const checkWaterCollision = () => {
  const currentLane = LANES[state.player.gridY];
  if (currentLane && currentLane.type === 'water') {
    const pLeft  = state.player.gridX;
    const pRight = state.player.gridX + PLAYER_WIDTH_CELLS;
    const pCenter = (pLeft + pRight) / 2;

    let bestLog = null;
    let bestScore = -Infinity;

    for (const log of state.logs) {
      if (log.row !== state.player.gridY) continue;

      const lLeft  = log.x / state.cellSize;
      const lRight = lLeft + log.width;

      // 1️⃣ Centro del jugador dentro del tronco con margen
      const centerMargin = Math.max(log.width * CENTER_MARGIN_FRACTION, 0.05);
      const centerInside =
        pCenter > (lLeft + centerMargin) && pCenter < (lRight - centerMargin);
      if (!centerInside) continue;

      // 2️⃣ Solape mínimo relativo (porcentaje del ancho del jugador)
      const overlap = Math.min(pRight, lRight) - Math.max(pLeft, lLeft);
      const minOverlap = PLAYER_WIDTH_CELLS * MIN_OVERLAP_FRACTION - EPSILON;
      if (overlap <= minOverlap) continue;

      // 3️⃣ Puntuación por solape (elige el tronco más "bajo el jugador")
      const lCenter = (lLeft + lRight) / 2;
      const score = overlap - Math.abs(pCenter - lCenter) * 0.1;
      if (score > bestScore) {
        bestScore = score;
        bestLog = log;
      }
    }

    if (bestLog) {
      state.player.onLog = bestLog;
    } else {
      state.player.onLog = null;
      endGame('🌊 ¡Caíste al agua!');
      return true;
    }
  } else {
    state.player.onLog = null; // zona segura
  }
  return false;
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
  
  // CRÍTICO: Primero verificar colisiones para encontrar el tronco ACTUAL (después de que los troncos se movieron)
  // Luego mover el jugador con el tronco que realmente está debajo
  const currentLane = LANES[state.player.gridY];
  if (currentLane && currentLane.type === 'water') {
    // Verificar colisiones para encontrar el tronco actual (si existe)
    // Esta función actualizará state.player.onLog con el tronco correcto o retornará true si el juego terminó
    if (checkWaterCollision()) {
      // El juego terminó (jugador en agua sin tronco)
      return;
    }
    
    // Si el jugador está en un tronco, moverlo con ese tronco
    if (state.player.onLog) {
      // Mover jugador con el tronco ACTUAL (no el antiguo de state.player.onLog)
      // Usar el tronco que acabamos de encontrar en checkWaterCollision()
      state.player.gridX += state.player.onLog.speed * state.player.onLog.direction / state.cellSize;
      
      // Game Over si sale de pantalla por los lados
      if (state.player.gridX < -1 || state.player.gridX > state.cols) {
        endGame('🌊 ¡Caíste al agua!');
        return;
      }
      
      // Verificar de nuevo después de mover (por si se salió del tronco durante el movimiento)
      if (checkWaterCollision()) {
        // El jugador se salió del tronco durante el movimiento
        return;
      }
    } else {
      // El jugador está en agua pero no está en ningún tronco - esto NO debería pasar
      // porque checkWaterCollision() debería haber terminado el juego
      console.error('⚠️ ERROR CRÍTICO: Jugador en agua pero onLog es null!');
      endGame('🌊 ¡Caíste al agua!');
      return;
    }
  } else {
    // No está en agua, resetear estado
    state.player.onLog = null;
  }
  
  // Verificar si llegó a la meta
  if (state.player.gridY === 0) {
    // ¡Cruzó el río!
    state.crossings++;
    state.score += 50 * state.level; // Más puntos en niveles altos
    
    // Subir nivel cada vez que cruza el río
    state.level++;
    
    // Mostrar animación de nivel
    if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
      window.showLevelUpAnimation(state.level);
    }
    
    // Actualizar configuración de carriles
    LANES = getLanes(state.level);
    
    // Regenerar troncos con nueva velocidad y tamaño
    state.logs = [];
    
    // Premio por subir nivel - caramelo cada cruce
    addCandies(1);
    celebrateCandyEarned();
    
    // Guardar progreso inmediatamente
    setBest('rio', state.level);
    saveScoreToServer('rio', state.level, { level: state.level, score: state.score, candies: getCandies() });
    
    const numLogs = Math.max(3, 5 - Math.floor(state.level / 3)); // Más troncos
    const spacing = state.cellSize * (3 + state.level * 0.4); // Menos espacio entre troncos
    
    for (let row = 1; row < state.rows - 1; row++) {
      if (LANES[row].type === 'water') {
        for (let i = 0; i < numLogs; i++) {
          createLog(row, i * spacing);
        }
      }
    }
    
    // Sonido y vibración
    playAudioFile('audio/ganar.mp3', 0.5);
    
    vibrate([50, 30, 50, 30, 50]);
    
    // Caramelo cada 100 puntos (removido - solo por nivel)
    // if (state.score > 0 && state.score % 100 === 0) {
    //   addCandies(1);
    //   celebrateCandyEarned();
    // }
    
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
  const y = log.row * state.cellSize - state.cellSize * 0.1 + state.offsetY; // Subir más los troncos
  const w = log.width * state.cellSize;
  const h = state.cellSize * 1.4; // Doble de altura (antes era 0.7)
  
  // Dibujar imagen de tronco si está cargada
  if (logImage.complete && logImage.naturalWidth > 0) {
    // Usar clipPath para crear forma orgánica del tronco
    ctx.save();
    ctx.beginPath();
    // Crear forma redondeada para el tronco
    const radius = h * 0.3;
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();
    
    // Dibujar la imagen dentro del área recortada
    ctx.drawImage(logImage, x, y, w, h);
    ctx.restore();
  } else {
    // Fallback: tronco marrón orgánico si la imagen no está cargada
    ctx.fillStyle = '#8B4513';
    const radius = h * 0.3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    
    // Textura de madera orgánica
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const lineY = y + h * (0.25 + i * 0.25);
      ctx.moveTo(x + radius, lineY);
      ctx.lineTo(x + w - radius, lineY);
      ctx.stroke();
    }
  }
};

// Dibujar jugador
const drawPlayer = () => {
  const x = state.player.gridX * state.cellSize;
  const y = state.player.gridY * state.cellSize - state.cellSize * 0.1 + state.offsetY; // Subir el muñeco para alinearlo
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
      newY = Math.max(0, state.player.gridY - V_STEP_ROWS);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newY = Math.min(state.rows - 1, state.player.gridY + V_STEP_ROWS);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newX = Math.max(0, state.player.gridX - H_STEP_CELLS);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newX = Math.min(state.cols - H_STEP_CELLS, state.player.gridX + H_STEP_CELLS);
    }

    if (newX !== state.player.gridX || newY !== state.player.gridY) {
      state.player.gridX = newX;
      state.player.gridY = newY;
      state.player.onLog = null;

      const currentLane = LANES[state.player.gridY];
      if (currentLane && currentLane.type === 'water') {
        if (checkWaterCollision()) return;
      } else {
        checkWaterCollision();
      }

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
    
    // Calcular posición de Aray en pantalla
    const arayScreenX = state.player.gridX * state.cellSize + state.cellSize / 2;
    
    // Determinar dirección según toque
    if (y < arayScreenY - state.cellSize * 0.3) {
      newY = Math.max(0, state.player.gridY - V_STEP_ROWS);
    } else if (y > arayScreenY + state.cellSize * 0.3) {
      newY = Math.min(state.rows - 1, state.player.gridY + V_STEP_ROWS);
    } else if (x < arayScreenX - state.cellSize * 0.3) {
      newX = Math.max(0, state.player.gridX - H_STEP_CELLS);
    } else if (x > arayScreenX + state.cellSize * 0.3) {
      newX = Math.min(state.cols - H_STEP_CELLS, state.player.gridX + H_STEP_CELLS);
    }
    
    if (newX !== state.player.gridX || newY !== state.player.gridY) {
      state.player.gridX = newX;
      state.player.gridY = newY;
      state.player.onLog = null;
      
      // Verificar inmediatamente si está en agua sin tronco
      if (checkWaterCollision()) {
        return; // El juego terminó
      }
      
      playSound('click');
      vibrate(10);
    }
    
    e.preventDefault();
  });
};

// End game
const endGame = async (reason = '🌊 ¡Caíste al agua!') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  playAudioFile('audio/perder.mp3', 0.5);
  
  vibrate([200, 100, 200]);
  
  const bestLevel = await getBest('rio');
  const isNewRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    await setBest('rio', state.level);
    saveScoreToServer('rio', state.level, { level: state.level, score: state.score, candies: getCandies() });
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
let lastHUDUpdate = 0;
const HUD_UPDATE_INTERVAL = 200; // Actualizar HUD cada 200ms en lugar de cada frame

const updateGameHUD = () => {
  const now = Date.now();
  
  // Solo actualizar si ha pasado suficiente tiempo
  if (now - lastHUDUpdate < HUD_UPDATE_INTERVAL) {
    return;
  }
  
  lastHUDUpdate = now;
  
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
