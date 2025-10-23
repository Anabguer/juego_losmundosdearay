/* ========================================
   🍬 TIENDA - Match 3 (Candy Crush)
   Haz match de 3 o más golosinas del mismo tipo
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_tienda';

// Canvas y contexto
let canvas, ctx;
let animationId;

// Estado del juego
const state = {
  score: 0,
  board: [],
  selected: null, // {row, col}
  dragging: null, // {row, col, startX, startY, currentX, currentY}
  gameOver: false,
  isProcessing: false,
  gridSize: 7, // Reducido a 7x7 para que sean más grandes
  cellSize: 0,
  offsetX: 0,
  offsetY: 0,
  // Sistema de dificultad progresiva
  level: 1,
  matchCount: 0,
  combo: 0,
  timeLeft: 90, // Tiempo límite en segundos
  maxTime: 90,
  candyTypes: 6, // Empieza con 6 tipos
  // Sistema de bombas
  bombs: [], // [{row, col, timeLeft: 30}]
  lastBombTime: 0,
  bombInterval: 20 // Cada 20 segundos aparece una bomba
};

// Tipos de golosinas con emojis chulos (orden de dificultad)
const ALL_CANDY_TYPES = ['🍭', '🍬', '🍫', '🍩', '🍪', '🧁', '🍰', '🎂'];
const CANDY_COLORS = ['#ff6b6b', '#4ecdc4', '#8b4513', '#ffb347', '#d2691e', '#ff69b4', '#9b59b6', '#3498db'];

// ====== Init ======
const initGame = () => {
  state.score = 0;
  state.selected = null;
  state.gameOver = false;
  state.isProcessing = false;
  state.level = 1;
  state.matchCount = 0;
  state.combo = 0;
  state.timeLeft = 90;
  state.maxTime = 90;
  state.candyTypes = 6;
  state.bombs = [];
  state.lastBombTime = 0;
  
  setupCanvas();
  generateBoard();
  updateGameHUD();
  
  // Iniciar contador de tiempo
  startTimer();
  
  gameLoop();
};

// Timer
let timerInterval = null;
let gameTime = 0;

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  gameTime = 0;
  
  timerInterval = setInterval(() => {
    if (state.gameOver || state.isProcessing) return;
    
    state.timeLeft -= 0.1;
    gameTime += 0.1;
    
    // Actualizar tiempo de bombas
    state.bombs.forEach(bomb => {
      bomb.timeLeft -= 0.1;
      if (bomb.timeLeft <= 0) {
        // ¡BOMBA EXPLOTÓ!
        explodeBomb(bomb);
      }
    });
    
    // Crear nueva bomba cada X segundos
    if (gameTime - state.lastBombTime >= state.bombInterval && state.bombs.length < 2) {
      createBomb();
      state.lastBombTime = gameTime;
    }
    
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endGame();
    }
  }, 100);
};

// Crear bomba en posición aleatoria (solo contador visual)
const createBomb = () => {
  // Buscar una celda que no tenga bomba ya
  let row, col;
  let attempts = 0;
  do {
    row = Math.floor(Math.random() * state.gridSize);
    col = Math.floor(Math.random() * state.gridSize);
    attempts++;
  } while (state.bombs.some(b => b.row === row && b.col === col) && attempts < 50);
  
  state.bombs.push({
    row,
    col,
    timeLeft: 30 // 30 segundos para hacer match con esta celda
  });
  
  vibrate([100, 50, 100]);
  playSound('fail');
};

// Explotar bomba (Game Over)
const explodeBomb = (bomb) => {
  state.gameOver = true;
  
  // Sonido de explosión
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.7;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200, 100, 200]);
  
  // Mostrar que explotó
  setTimeout(() => {
    endGame('💣 ¡LA BOMBA EXPLOTÓ!');
  }, 500);
};

// Setup canvas
const setupCanvas = () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    
    // Calcular tamaño de celda
    const headerHeight = 100; // Ajustado al header estándar
    const availableHeight = height - headerHeight - 10; // Menos margen inferior para aprovechar más espacio
    const availableWidth = width - 20; // Menos margen horizontal
    
    const cellSizeByWidth = availableWidth / state.gridSize;
    const cellSizeByHeight = availableHeight / state.gridSize;
    
    state.cellSize = Math.floor(Math.min(cellSizeByWidth, cellSizeByHeight, 120)); // Aumentado a 120px máximo para chuches más grandes
    
    // Centrar el tablero
    const boardWidth = state.cellSize * state.gridSize;
    const boardHeight = state.cellSize * state.gridSize;
    
    state.offsetX = Math.floor((width - boardWidth) / 2);
    state.offsetY = Math.floor(headerHeight + (availableHeight - boardHeight) / 2);
  };
  
  resize();
  window.addEventListener('resize', resize);
  
  // Touch/mouse events para drag & drop
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
};

// Generar tablero sin matches iniciales
const generateBoard = () => {
  state.board = [];
  
  for (let row = 0; row < state.gridSize; row++) {
    state.board[row] = [];
    for (let col = 0; col < state.gridSize; col++) {
      state.board[row][col] = getRandomCandyNoMatch(row, col);
    }
  }
};

// Obtener candy random que no cree match
const getRandomCandyNoMatch = (row, col) => {
  // Usar solo los tipos de candy según dificultad
  const CANDY_TYPES = ALL_CANDY_TYPES.slice(0, state.candyTypes);
  const available = [...CANDY_TYPES];
  
  // Evitar match horizontal
  if (col >= 2 && 
      state.board[row][col-1] === state.board[row][col-2]) {
    const index = available.indexOf(state.board[row][col-1]);
    if (index > -1) available.splice(index, 1);
  }
  
  // Evitar match vertical
  if (row >= 2 && 
      state.board[row-1][col] === state.board[row-2][col]) {
    const index = available.indexOf(state.board[row-1][col]);
    if (index > -1) available.splice(index, 1);
  }
  
  return available[Math.floor(Math.random() * available.length)];
};

// Game loop
const gameLoop = () => {
  if (state.gameOver) return;
  
  draw();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Dibujar
const draw = () => {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  
  ctx.clearRect(0, 0, width, height);
  
  // Sin fondo - el fondo ya está en el body
  
  // Combo (si hay, abajo del grid con estilo bonito)
  if (state.combo > 1) {
    ctx.save();
    
    // Texto del combo con efecto
    const comboText = `COMBO x${state.combo}!`;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    
    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // Texto con gradiente
    const gradient = ctx.createLinearGradient(width / 2 - 100, 0, width / 2 + 100, 0);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#ff1493');
    gradient.addColorStop(1, '#ff6b6b');
    
    ctx.fillStyle = gradient;
    
    // Posicionar abajo del grid
    const boardSize = state.cellSize * state.gridSize;
    const comboY = state.offsetY + boardSize + 60; // 60px abajo del grid
    ctx.fillText(comboText, width / 2, comboY);
    
    // Borde blanco
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(comboText, width / 2, comboY);
    
    ctx.restore();
  }
  
  // Fondo del tablero
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.strokeStyle = '#ff1493';
  ctx.lineWidth = 4;
  const boardSize = state.cellSize * state.gridSize;
  ctx.fillRect(state.offsetX - 5, state.offsetY - 5, boardSize + 10, boardSize + 10);
  ctx.strokeRect(state.offsetX - 5, state.offsetY - 5, boardSize + 10, boardSize + 10);
  
  // Dibujar tablero
  for (let row = 0; row < state.gridSize; row++) {
    for (let col = 0; col < state.gridSize; col++) {
      // Saltar el candy que se está arrastrando
      if (state.dragging && state.dragging.row === row && state.dragging.col === col) {
        continue;
      }
      
      const x = state.offsetX + col * state.cellSize;
      const y = state.offsetY + row * state.cellSize;
      
      drawCell(x, y, row, col);
    }
  }
  
  // Dibujar candy siendo arrastrado (encima de todo)
  if (state.dragging) {
    const candy = state.board[state.dragging.row][state.dragging.col];
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    const size = state.cellSize - 4;
    const x = state.dragging.currentX - size / 2;
    const y = state.dragging.currentY - size / 2;
    
    // Fondo brillante
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x, y, size, size);
    
    // Borde magenta
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, size, size);
    
    // Candy
    ctx.shadowColor = 'transparent';
    ctx.font = `${size * 0.7}px Arial`; // Aumentado de 0.65 a 0.7 para emojis más grandes cuando se arrastran
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(candy, x + size / 2, y + size / 2);
    
    ctx.restore();
  }
};

// Dibujar celda
const drawCell = (x, y, row, col) => {
  const candy = state.board[row][col];
  const isSelected = state.selected && state.selected.row === row && state.selected.col === col;
  
  // Verificar si es una bomba
  const bomb = state.bombs.find(b => b.row === row && b.col === col);
  
  // Fondo de celda
  if (bomb) {
    // Fondo rojo parpadeante para bomba
    const pulse = bomb.timeLeft < 10 ? Math.sin(Date.now() / 100) * 0.5 + 0.5 : 1;
    ctx.fillStyle = `rgba(255, ${100 * pulse}, ${100 * pulse}, 0.9)`;
  } else {
    ctx.fillStyle = isSelected ? '#ffff00' : 'rgba(255, 255, 255, 0.9)';
  }
  ctx.fillRect(x + 2, y + 2, state.cellSize - 4, state.cellSize - 4);
  
  // Borde
  if (bomb) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 5;
  } else {
    ctx.strokeStyle = isSelected ? '#ff00ff' : '#dddddd';
    ctx.lineWidth = isSelected ? 4 : 2;
  }
  ctx.strokeRect(x + 2, y + 2, state.cellSize - 4, state.cellSize - 4);
  
  // Candy
  if (candy) {
    ctx.font = `${state.cellSize * 0.7}px Arial`; // Aumentado de 0.65 a 0.7 para emojis más grandes
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(candy, x + state.cellSize / 2, y + state.cellSize / 2);
  }
  
  // Contador de bomba (esquina superior derecha, pequeño)
  if (bomb) {
    ctx.save();
    const badgeSize = state.cellSize * 0.4; // 40% del tamaño de celda
    const badgeX = x + state.cellSize - badgeSize - 2;
    const badgeY = y + 2;
    
    // Fondo circular
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Borde
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Número
    ctx.fillStyle = 'white';
    ctx.font = `bold ${badgeSize * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(bomb.timeLeft), badgeX + badgeSize / 2, badgeY + badgeSize / 2);
    ctx.restore();
  }
};

// Obtener posición del pointer
const getPointerPos = (e) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

// Obtener celda en posición
const getCellAt = (x, y) => {
  const col = Math.floor((x - state.offsetX) / state.cellSize);
  const row = Math.floor((y - state.offsetY) / state.cellSize);
  
  if (row < 0 || row >= state.gridSize || col < 0 || col >= state.gridSize) {
    return null;
  }
  
  return { row, col };
};

// Handle pointer down (inicio de drag)
const handlePointerDown = (e) => {
  if (state.gameOver || state.isProcessing) return;
  
  const pos = getPointerPos(e);
  const cell = getCellAt(pos.x, pos.y);
  
  if (!cell) return;
  
  state.dragging = {
    row: cell.row,
    col: cell.col,
    startX: pos.x,
    startY: pos.y,
    currentX: pos.x,
    currentY: pos.y
  };
  
  vibrate(30);
  e.preventDefault();
};

// Handle pointer move (arrastrando)
const handlePointerMove = (e) => {
  if (!state.dragging) return;
  
  const pos = getPointerPos(e);
  state.dragging.currentX = pos.x;
  state.dragging.currentY = pos.y;
  
  e.preventDefault();
};

// Handle pointer up (fin de drag)
const handlePointerUp = (e) => {
  if (!state.dragging) return;
  
  const pos = getPointerPos(e);
  const cell = getCellAt(pos.x, pos.y);
  
  if (cell && (cell.row !== state.dragging.row || cell.col !== state.dragging.col)) {
    // Se soltó en una celda diferente - verificar si es adyacente
    const rowDiff = Math.abs(state.dragging.row - cell.row);
    const colDiff = Math.abs(state.dragging.col - cell.col);
    
    if (rowDiff + colDiff === 1) {
      // Adyacente - intentar swap
      swapCandies(state.dragging.row, state.dragging.col, cell.row, cell.col);
    }
  }
  
  state.dragging = null;
  e.preventDefault();
};

// Intercambiar candies
const swapCandies = async (row1, col1, row2, col2) => {
  state.isProcessing = true;
  
  // Actualizar posición de bombas si se mueven
  state.bombs.forEach(bomb => {
    if (bomb.row === row1 && bomb.col === col1) {
      bomb.row = row2;
      bomb.col = col2;
    } else if (bomb.row === row2 && bomb.col === col2) {
      bomb.row = row1;
      bomb.col = col1;
    }
  });
  
  // Swap
  const temp = state.board[row1][col1];
  state.board[row1][col1] = state.board[row2][col2];
  state.board[row2][col2] = temp;
  
  await sleep(200);
  
  // Verificar matches
  const matches = findAllMatches();
  
  if (matches.length > 0) {
    // Válido
    state.selected = null;
    vibrate(50);
    playSound('win');
    
    await processMatches();
  } else {
    // Inválido - revertir
    const temp2 = state.board[row1][col1];
    state.board[row1][col1] = state.board[row2][col2];
    state.board[row2][col2] = temp2;
    
    // Revertir bombas también
    state.bombs.forEach(bomb => {
      if (bomb.row === row2 && bomb.col === col2) {
        bomb.row = row1;
        bomb.col = col1;
      } else if (bomb.row === row1 && bomb.col === col1) {
        bomb.row = row2;
        bomb.col = col2;
      }
    });
    
    state.selected = null;
    vibrate(20);
    playSound('fail');
  }
  
  state.isProcessing = false;
};

// Encontrar todos los matches
const findAllMatches = () => {
  const matches = new Set();
  
  // Horizontal
  for (let row = 0; row < state.gridSize; row++) {
    for (let col = 0; col < state.gridSize - 2; col++) {
      const candy = state.board[row][col];
      if (!candy) continue;
      
      let count = 1;
      for (let c = col + 1; c < state.gridSize && state.board[row][c] === candy; c++) {
        count++;
      }
      
      if (count >= 3) {
        for (let c = col; c < col + count; c++) {
          matches.add(`${row},${c}`);
        }
      }
    }
  }
  
  // Vertical
  for (let col = 0; col < state.gridSize; col++) {
    for (let row = 0; row < state.gridSize - 2; row++) {
      const candy = state.board[row][col];
      if (!candy) continue;
      
      let count = 1;
      for (let r = row + 1; r < state.gridSize && state.board[r][col] === candy; r++) {
        count++;
      }
      
      if (count >= 3) {
        for (let r = row; r < row + count; r++) {
          matches.add(`${r},${col}`);
        }
      }
    }
  }
  
  return Array.from(matches).map(s => {
    const [row, col] = s.split(',').map(Number);
    return { row, col };
  });
};

// Procesar matches
const processMatches = async () => {
  let hasMatches = true;
  let chainCount = 0;
  
  while (hasMatches) {
    const matches = findAllMatches();
    
    if (matches.length === 0) {
      hasMatches = false;
      state.combo = 0; // Resetear combo
      break;
    }
    
    chainCount++;
    state.combo = chainCount;
    state.matchCount++;
    
    // Verificar si se hizo match con una bomba
    const bombMatched = state.bombs.find(b => 
      matches.some(m => m.row === b.row && m.col === b.col)
    );
    
    if (bombMatched) {
      // ¡Bomba desactivada!
      state.bombs = state.bombs.filter(b => b !== bombMatched);
      vibrate([50, 30, 50, 30, 50]);
      playSound('success');
    }
    
    // Puntos muy reducidos - con multiplicador de combo
    const basePoints = matches.length * 20; // Solo 20 puntos por candy
    const comboMultiplier = state.combo;
    const points = basePoints * comboMultiplier;
    state.score += points;
    
    // Bonus de tiempo por match (reducido)
    const timeBonus = matches.length >= 5 ? 3 : matches.length >= 4 ? 2 : 1;
    state.timeLeft = Math.min(state.timeLeft + timeBonus, state.maxTime);
    
    updateGameHUD();
    
    // Sonido diferente según combo
    if (state.combo >= 3) {
      playSound('success');
    }
    
    // Mostrar combo visual
    if (state.combo > 1) {
      vibrate([50, 30, 50]);
    }
    
    // Eliminar matches
    matches.forEach(m => {
      state.board[m.row][m.col] = null;
    });
    
    await sleep(200);
    
    // Hacer caer
    dropCandies();
    
    await sleep(200);
    
    // Rellenar
    fillBoard();
    
    await sleep(300);
    
    // Sistema de nivel progresivo con animación
    if (state.matchCount >= state.level * 5) {
      state.level++;
      state.matchCount = 0;
      
      // Mostrar animación de level up
      if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
        window.showLevelUpAnimation(state.level);
      }
      
      // Aumentar dificultad
      if (state.level % 3 === 0 && state.candyTypes < ALL_CANDY_TYPES.length) {
        state.candyTypes++; // Más tipos de candy = más difícil
      }
    }
    
    // Premio de caramelos cada 1000 puntos
    if (state.score > 0 && Math.floor(state.score / 1000) > Math.floor((state.score - points) / 1000)) {
      addCandies(1);
      celebrateCandyEarned();
    }
    
    // Nivel cada 1000 puntos
    const newLevel = Math.max(1, Math.floor(state.score / 1000) + 1);
    if (newLevel > state.level) {
      state.level = newLevel;
      // Aumentar dificultad: más tipos de golosinas
      state.candyTypes = Math.min(8, 6 + Math.floor(state.level / 2));
      // Reducir tiempo de bombas
      state.bombInterval = Math.max(10, 20 - Math.floor(state.level / 3));
      addCandies(1);
      celebrateCandyEarned();
      if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
        window.showLevelUpAnimation(state.level);
      }
    }
  }
};

// Hacer caer candies
const dropCandies = () => {
  for (let col = 0; col < state.gridSize; col++) {
    // De abajo hacia arriba
    let writeRow = state.gridSize - 1;
    for (let row = state.gridSize - 1; row >= 0; row--) {
      if (state.board[row][col] !== null) {
        if (writeRow !== row) {
          // Actualizar posición de bombas que caen
          state.bombs.forEach(bomb => {
            if (bomb.row === row && bomb.col === col) {
              bomb.row = writeRow;
            }
          });
          
          state.board[writeRow][col] = state.board[row][col];
          state.board[row][col] = null;
        }
        writeRow--;
      }
    }
  }
};

// Rellenar tablero
const fillBoard = () => {
  for (let row = 0; row < state.gridSize; row++) {
    for (let col = 0; col < state.gridSize; col++) {
      if (state.board[row][col] === null) {
        state.board[row][col] = getRandomCandyNoMatch(row, col);
      }
    }
  }
};

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// End game
const endGame = (reason = '⏰ ¡Se acabó el tiempo!') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  if (timerInterval) clearInterval(timerInterval);
  
  // Sonido de perder
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.score > bestScore;
  const bestLevel = parseInt(localStorage.getItem('aray_best_level_tienda')) || 1;
  const isNewLevelRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.score);
    saveScoreToServer('chuches', state.score, { score: state.score, candies: getCandies() });
  }
  
  if (isNewLevelRecord) {
    localStorage.setItem('aray_best_level_tienda', state.level.toString());
  }
  
  // SIEMPRE guardar el nivel actual en Firestore (no solo si es récord)
  console.log('🔍 Tienda - Verificando GameBridge:', {
    gameBridge: !!window.GameBridge,
    updateBestLevel: !!(window.GameBridge && window.GameBridge.updateBestLevel),
    level: state.level,
    windowKeys: Object.keys(window).filter(k => k.includes('Game') || k.includes('Bridge'))
  });

  // Función para intentar guardar con retry
  const trySaveProgress = (retries = 3) => {
    if (window.GameBridge && window.GameBridge.updateBestLevel) {
      console.log('💾 Tienda - Guardando nivel en Firestore:', state.level);
      try {
        window.GameBridge.updateBestLevel('chuches', state.level);
        console.log('✅ Tienda - updateBestLevel llamado exitosamente');
      } catch (error) {
        console.error('❌ Tienda - Error llamando updateBestLevel:', error);
      }
    } else if (retries > 0) {
      console.log(`⏳ Tienda - GameBridge no disponible, reintentando en 500ms... (${retries} intentos restantes)`);
      setTimeout(() => trySaveProgress(retries - 1), 500);
    } else {
      console.error('❌ Tienda - GameBridge no disponible después de 3 intentos');
      console.log('🔍 Tienda - window.GameBridge:', window.GameBridge);
      console.log('🔍 Tienda - updateBestLevel method:', window.GameBridge?.updateBestLevel);
    }
  };

  trySaveProgress();
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2>${reason}</h2>
    <div class="game-stats" style="display: flex; justify-content: center; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, parseInt(localStorage.getItem('aray_best_level_tienda')) || 1)}</div>
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

// ====== Init página ======
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  
  const bestLevel = getBest('aray_best_level_tienda') || 1;
  
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
});
