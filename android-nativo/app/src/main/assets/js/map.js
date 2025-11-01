/* ========================================
   🗺️ MAP - Pueblo navegable con tiles (FIX)
   - BFS por carreteras (1)
   - Origen/Destino convertidos a carretera adyacente
   - Movimiento con transform + energía por paso
   - Modales robustas y navegación a minijuegos
   ======================================== */

import { getCoins, getEnergy, setEnergy, setCoins, getBest, initGuestDataMigration } from './storage.js';
import { updateHUD, toast, showModal, hideModal, playSound, playAudioFile, vibrate } from './ui.js';
import { getAraySprite } from './sprites.js';
import { initAuth, isLoggedIn, getCurrentUser, login, register, logout, getRankingGlobal } from './auth.js';

// Dimensiones
const MAP_WIDTH = 10;
const MAP_HEIGHT = 20;

// MAPA COMPLETO EN BLANCO - SOLO EDIFICIOS
// Coordenadas: Columnas 0-9 (izq→der), Filas A-T (arriba→abajo)
// 0=grass, 1=road, 2=river, 11=dirt, 12=entrance (entrada edificio)
// 3=cole, 4=skate, 5=pabellón, 6=yayos, 7=informatica, 8=edificio, 13=parque, 14=tienda, 15=rio, 16=ranking, 9=building-part
export const MAP = [
//   0  1  2  3  4  5  6  7  8  9
  [ 0, 4, 9, 0, 0, 0, 0, 0, 0, 0],  // A (fila 0) ← Skate A1-A2-B1-B2
  [ 0, 9, 9, 0, 0, 0, 3, 9, 0, 0],  // B (fila 1) ← Skate B1-B2 + Cole B6-B7-C6-C7
  [ 0,12, 1, 1, 1, 1, 9, 9, 0, 0],  // C (fila 2) ← C1 entrada Skate + C2,C3,C4,C5 carretera + Cole C6-C7
  [ 0, 0, 1, 0, 0, 1,12, 0, 0, 0],  // D (fila 3) ← D2 carretera (al lado entrada) + D5 carretera + D6 entrada Cole
  [ 0, 7, 9, 0,11, 1, 1,11, 0, 0],  // E (fila 4) ← Info E1-E2-F1-F2 + E5,E6 carretera + tierra E4,E7
  [ 0, 9, 9,11,11,11, 1, 1,14, 9],  // F (fila 5) ← F6,F7 carretera + tierra F3,F4,F5 + Tienda F8-F9-G8-G9
  [ 0,11,12, 1, 1, 1, 1,12, 9, 9],  // G (fila 6) ← G2 entrada Info + G3,G4,G5,G6 carretera + G7 entrada Tienda + Tienda G8-G9
  [ 0, 0,11, 1,11,11, 0, 0, 0, 0],  // H (fila 7) ← H3 + tierra H2,H4,H5
  [ 0, 0,11, 1,11,11, 0,13, 9, 0],  // I (fila 8) ← Parque I7-I8-J7-J8 + I3 + tierra I2,I4,I5
  [ 6, 9,11, 1, 1, 1,12, 9, 9, 0],  // J (fila 9) ← Yayos J0-J1-K0-K1 + J3,J4,J5,J6 entrada Parque + tierra J2 + carretera en J4 para acceso al ranking
  [ 9, 9,12, 1,16, 9, 0, 0, 0, 0],  // K (fila 10) ← K2 entrada Yayos + K3 + AJUSTES K4 (principal) + K5 (parte)
  [ 0,11,11, 1, 9, 9, 0, 0, 0, 0],  // L (fila 11) ← L3 + tierra L1,L2 + AJUSTES L4-L5 (partes)
  [ 0, 0,11, 1, 0,11,11, 8, 9, 0],  // M (fila 12) ← Edificio M7-M8-N7-N8 + M3 + tierra M2,M5,M6
  [ 0, 0,11, 1, 1, 1,12, 9, 9, 0],  // N (fila 13) ← N6 entrada Edificio + N3,N4,N5 + tierra N2
  [ 0, 0,11,11,11, 1,11,11, 0, 0],  // O (fila 14) ← O5 + tierra O2,O3,O4,O6,O7
  [ 5, 9,11,11, 0, 1,11, 0, 0, 0],  // P (fila 15) ← Pabellón P0-P1-Q0-Q1 + P5 + tierra P2,P3,P6
  [ 9, 9,12, 1, 1, 1, 1, 1,15, 9],  // Q (fila 16) ← Q2 entrada Pabellón + Q3,Q4,Q5,Q6,Q7 carretera + Río Q8-Q9-R8-R9
  [ 0, 0,11,11,11,11,11,12, 9, 9],  // R (fila 17) ← tierra R2,R3,R4,R5,R6 + R7 entrada Río + Río R8-R9
  [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],  // S (fila 18) ← RÍO
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // T (fila 19)
];

// Minijuegos
const ROUTES = {
  school: 'cole.html?v=' + Date.now(),
  skate: 'skate.html?v=' + Date.now(), // Skate runner
  park: 'parque.html?v=' + Date.now(), // Pacman con Aray
  gym: 'pabellon.html?v=' + Date.now(),
  yayos: 'yayos.html?v=' + Date.now(),
  informatica: 'informatica.html?v=' + Date.now(),
  edificio: 'edificio.html?v=' + Date.now(),
  tienda: 'tienda.html?v=' + Date.now(), // Candy Crush de chuches
  rio: 'rio.html?v=' + Date.now() // Juego del río
};

// Estado avatar: posición en celdas (fila/col)
let avatarPos = { row: 13, col: 6 }; // N6 (inicio en puerta del edificio)
let isMoving = false;
let lastInteractionTime = Date.now();
let boredInterval = null;

// Mensajes graciosos de Aray (MÁS CORTOS)
const ARAY_MESSAGES = {
  welcome: [
    '¿Dónde vamos hoy? 🤔',
    '¡Lista para jugar! 🎮',
    '¿Qué hacemos? 😄',
    '¡Vamos a divertirnos! 🌟',
    'Elige un juego! 👉'
  ],
  noEnergy: [
    '¡Dame de comer! 😤',
    '¡Tengo hambre! 🥺',
    '¡Sin energía! 🍕',
    'No puedo más... 😑'
  ],
  bored: [
    '¿Estás ahí? 👀',
    'Me aburrooo... 😴',
    '¿Jugamos? 🥱',
    'Hacemos algo? 😒',
    'ZzZzZ... 💤'
  ],
  afterEat: [
    '¡Ñam ñam! 😋',
    '¡Qué rico! 🤤',
    '¡Riquísimo! 😍',
    '¡Delicia! 🌟'
  ],
  arriving: [
    '¡A jugar! 🎮',
    '¡Vamos! 💪',
    '¡Dale! 🔥',
    '¡A por ello! 😎'
  ]
};

const randomMsg = (category) => {
  const msgs = ARAY_MESSAGES[category];
  return msgs[Math.floor(Math.random() * msgs.length)];
};

const showAraySpeech = (message, duration = 3000) => {
  // Eliminar bocadillo anterior si existe
  const existing = document.querySelector('.aray-speech-bubble');
  if (existing) existing.remove();
  
  const avatar = document.getElementById('avatar');
  if (!avatar) return;
  
  const avatarRect = avatar.getBoundingClientRect();
  
  // Crear bocadillo
  const bubble = document.createElement('div');
  bubble.className = 'aray-speech-bubble';
  bubble.textContent = message;
  
  // Posicionar AL LADO de Aray (no encima para no taparlo)
  bubble.style.left = (avatarRect.right + 20) + 'px';
  bubble.style.top = (avatarRect.top - 10) + 'px';
  
  document.body.appendChild(bubble);
  
  // Eliminar después del tiempo
  setTimeout(() => bubble.remove(), duration);
};

// ====== Init ======
export const initMap = () => {
  // Intentar migrar datos de invitado si el usuario está logueado
  initGuestDataMigration();
  // Fresitas iniciales SOLO si localStorage está completamente vacío (primera vez)
  if (localStorage.length === 0 && getCoins() === 0) {
    setCoins(5);
  }
  renderMap();
  setupAvatar();
  setupEventListeners();
  
  // Hacer updateAvatarPosition disponible globalmente
  window.updateAvatarPosition = updateAvatarPosition;

  // Si el avatar no está sobre carretera, colócalo en la carretera adyacente
  console.log(`🚀 Posición inicial del avatar: fila=${avatarPos.row}, col=${avatarPos.col}`);
  const startRoad = ensureRoadStart(avatarPos.row, avatarPos.col);
  console.log(`🛣️ Carretera encontrada: fila=${startRoad[0]}, col=${startRoad[1]}`);
  avatarPos = { row: startRoad[0], col: startRoad[1] };
  console.log(`✅ Avatar posicionado en: fila=${avatarPos.row}, col=${avatarPos.col}`);
  
  // Mostrar logs en pantalla para debug
  showAraySpeech(`Posición: ${avatarPos.row},${avatarPos.col}`, 3000);

  updateAvatarPosition();
  updateHUD();
  
  // Mensaje de bienvenida
  setTimeout(() => {
    showAraySpeech(randomMsg('welcome'), 3500);
  }, 500);
  
  // Iniciar sistema de aburrimiento
  startBoredSystem();
};

// Sistema de aburrimiento
const startBoredSystem = () => {
  // Cada 20 segundos sin interacción, Aray se queja
  boredInterval = setInterval(() => {
    const timeSinceLastAction = Date.now() - lastInteractionTime;
    if (timeSinceLastAction > 20000 && !isMoving) {
      showAraySpeech(randomMsg('bored'), 4000);
    }
  }, 20000);
};

const resetBoredTimer = () => {
  lastInteractionTime = Date.now();
};

// ====== Render ======
const renderMap = () => {
  const mapEl = document.getElementById('map');
  mapEl.innerHTML = '';
  
  // Letras para coordenadas (A-T)
  const rowLetters = 'ABCDEFGHIJKLMNOPQRST';

  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      const code = MAP[row][col];
      const tile = document.createElement('div');
      tile.className = getTileClass(code, row, col);
      tile.dataset.row = row;
      tile.dataset.col = col;
      
      // Tooltip con coordenadas
      tile.title = `${rowLetters[row]}${col}`;
      
      // Césped aleatorio (código 0)
      if (code === 0) {
        const random = Math.random();
        // 50% cesped1, 20% cesped2, 20% cesped3, 10% cesped4
        if (random < 0.5) tile.classList.add('grass-1');
        else if (random < 0.7) tile.classList.add('grass-2');
        else if (random < 0.9) tile.classList.add('grass-3');
        else tile.classList.add('grass-4');
        
        // Evitar transformaciones que provoquen micro-grietas entre celdas
        tile.style.transform = 'none';
      }
      
      // Tierra aleatoria (código 11)
      if (code === 11) {
        tile.style.transform = 'none';
      }
      
      // Carreteras (código 1)
      if (code === 1) {
        tile.style.transform = 'none';
      }
      
      // Casilla de inicio (código 10)
      if (code === 10) {
        tile.style.transform = 'none';
      }
      
      // Entradas (código 12) - colorear según edificio cercano
      if (code === 12) {
        const entranceColors = {
          'C1': 'entrance-skate',    // Skate
          'D6': 'entrance-cole',     // Cole
          'G2': 'entrance-informatica', // Informática
          'G7': 'entrance-tienda',   // Tienda
          'J6': 'entrance-parque',   // Parque
          'K2': 'entrance-yayos',    // Yayos
          'N6': 'entrance-edificio', // Edificio
          'Q2': 'entrance-pabellon', // Pabellón
          'R7': 'entrance-rio'       // Río
        };
        const coordKey = `${rowLetters[row]}${col}`;
        const colorClass = entranceColors[coordKey];
        if (colorClass) tile.classList.add(colorClass);
      }

      // Edificios clicables (esquina superior izquierda del 2x2)
      const isBuilding = (c) => (c >= 3 && c <= 8) || c === 13 || c === 14 || c === 15;
      if (isBuilding(code)) {
        tile.classList.add('clickable');
        tile.addEventListener('click', () => {
          console.log(`🏢 Edificio en: ${rowLetters[row]}${col} (fila=${row}, col=${col})`);
          onBuildingClick(row, col, code);
        });
        
        // Añadir indicador de récord
        addRecordBadge(tile, code);
      }
      
      // Pieza de Ajustes (código 16) - clickable
      if (code === 16) {
        tile.addEventListener('click', async () => {
          console.log(`⚙️ Ajustes clickeado en: ${rowLetters[row]}${col}`);
          
          // Buscar carretera adyacente
          const adjRoad = findNearestRoad(row, col);
          if (!adjRoad) return;
          
          // Mover Aray hasta la carretera adyacente
          if (isMoving) return;
          resetBoredTimer();
          const start = whereToStart();
          const path = findPath(MAP, start, adjRoad);
          if (path && path.length > 1) {
            await walkPath(path);
            updateAvatarPosition(adjRoad[0], adjRoad[1]);
          }
          
          // Abrir modal de ajustes
          import('./ui.js').then(module => {
            if (module.showSettingsModal) {
              module.showSettingsModal();
            }
          });
        });
      }
      
      // Partes de edificios (código 9) - asignar background-position
      if (code === 9) {
        // Función auxiliar para detectar si es un edificio
        const isBuilding = (c) => (c >= 3 && c <= 8) || c === 13 || c === 14 || c === 15 || c === 16;
        
        // Determinar qué parte es según vecinos
        const topLeft = row > 0 && col > 0 && isBuilding(MAP[row-1][col-1]);
        const topRight = row > 0 && col < MAP_WIDTH-1 && isBuilding(MAP[row-1][col]);
        const bottomLeft = row < MAP_HEIGHT-1 && col > 0 && isBuilding(MAP[row][col-1]);
        
        // Copiar la imagen del edificio principal
        let buildingCode = 0;
        let mainBuildingRow = row;
        let mainBuildingCol = col;
        
        if (row > 0 && isBuilding(MAP[row-1][col])) {
          buildingCode = MAP[row-1][col];
          mainBuildingRow = row - 1;
          mainBuildingCol = col;
        } else if (row > 0 && col > 0 && isBuilding(MAP[row-1][col-1])) {
          buildingCode = MAP[row-1][col-1];
          mainBuildingRow = row - 1;
          mainBuildingCol = col - 1;
        } else if (col > 0 && isBuilding(MAP[row][col-1])) {
          buildingCode = MAP[row][col-1];
          mainBuildingRow = row;
          mainBuildingCol = col - 1;
        }
        
        // Aplicar clase de edificio para la imagen
        const buildingClass = ['', '', '', 'school', 'skate', 'gym', 'yayos', 'informatica', 'edificio', '', '', '', '', 'park', 'tienda', 'rio', 'casilla-central'][buildingCode] || '';
        if (buildingClass) tile.classList.add(buildingClass);
        
        // Posición de la imagen
        if (topRight) tile.classList.add('bottom-left');
        else if (bottomLeft) tile.classList.add('top-right');
        else tile.classList.add('bottom-right');
        
        // HACER CLICABLE - llevar al edificio principal
        if (isBuilding(buildingCode)) {
          tile.classList.add('clickable');
          tile.addEventListener('click', () => {
            console.log(`🏢 Edificio (parte) en: ${rowLetters[row]}${col} → lleva a ${rowLetters[mainBuildingRow]}${mainBuildingCol}`);
            onBuildingClick(mainBuildingRow, mainBuildingCol, buildingCode);
          });
        }
      }

      // (Debug útil) Permite tocar una carretera y caminar hasta ella
      if (code === 1 || code === 10 || code === 12) {
        tile.addEventListener('click', async () => {
          console.log(`🛣️ Carretera: ${rowLetters[row]}${col} (fila=${row}, col=${col})`);
          console.log(`📍 Avatar actual: fila=${avatarPos.row}, col=${avatarPos.col}`);
          if (isMoving) return;
          resetBoredTimer(); // Reiniciar contador
          const start = [avatarPos.row, avatarPos.col]; // Usar posición actual del avatar
          const goal = [row, col];
          console.log(`🎯 Inicio: [${start[0]}, ${start[1]}], Meta: [${goal[0]}, ${goal[1]}]`);
          const path = findPath(MAP, start, goal);
          console.log(`🛤️ Path encontrado:`, path);
          if (!path) { toast('No hay camino por carretera'); return; }
          if (!consumeEnergy(path.length - 1)) return;
          isMoving = true; 
          console.log(`🚶 Iniciando movimiento...`);
          await walkPath(path); 
          console.log(`✅ Movimiento completado. Avatar final: fila=${avatarPos.row}, col=${avatarPos.col}`);
          isMoving = false;
        });
      }
      
      // Click en césped/vacío
      if (code === 0) {
        tile.addEventListener('click', () => {
          console.log(`🌱 Césped: ${rowLetters[row]}${col} (fila=${row}, col=${col})`);
        });
      }

      mapEl.appendChild(tile);
    }
  }

  updateAvatarPosition();
};

// Añadir badge con récord en el edificio
const addRecordBadge = (tile, buildingCode) => {
  let recordKey = '';
  let recordType = 'Nivel';
  
  switch(buildingCode) {
    case 3: recordKey = 'cole'; break; // Cole
    case 4: recordKey = 'skate'; recordType = 'm'; break; // Skate (metros)
    case 5: recordKey = 'pabellon'; break; // Pabellón
    case 6: recordKey = 'yayos'; break; // Yayos
    case 7: recordKey = 'informatica'; break; // Informática
    case 8: recordKey = 'edificio'; recordType = 'm'; break; // Edificio (metros)
    case 13: recordKey = 'parque'; break; // Parque (Pacman)
    case 14: recordKey = 'tienda'; break; // Tienda
    case 15: recordKey = 'rio'; break; // Río
    default: return;
  }
  
  const record = getBest(recordKey);
  
  // Badge de nivel eliminado - no queremos mostrar niveles
};

const getTileClass = (code, row, col) => {
  const base = 'tile';
  switch (code) {
    case 0: return `${base} grass`;
    case 1: return `${base} road ${getRoadClass(row, col)}`;
    case 2: return `${base} river`;
    case 3: return `${base} school building-2x2`;
    case 4: return `${base} skate building-2x2`; // Skate Park
    case 5: return `${base} gym building-2x2`;
    case 6: return `${base} yayos building-2x2`;
    case 7: return `${base} informatica building-2x2`;
    case 8: return `${base} edificio building-2x2`;
    case 13: return `${base} park building-2x2`; // Parque (Pacman)
    case 14: return `${base} tienda building-2x2`; // Tienda de Chuches
    case 15: return `${base} rio building-2x2`; // Río
    case 16: return `${base} casilla-central building-2x2 clickable`; // Casilla Central (2x2)
    case 9: return `${base} building-part`; // Partes del edificio (invisibles)
    case 10: return `${base} road ${getRoadClass(row, col)} start`; // Casilla de inicio
    case 11: return `${base} dirt`; // Tierra
    case 12: return `${base} entrance`; // Entrada edificio
    default: return base;
  }
};

const getRoadClass = (row, col) => {
  const isRoad = (r, c) => {
    if (r < 0 || c < 0 || r >= MAP_HEIGHT || c >= MAP_WIDTH) return false;
    return MAP[r][c] === 1 || MAP[r][c] === 10 || MAP[r][c] === 12; // 1=road, 10=start, 12=entrance
  };
  
  const up    = isRoad(row - 1, col);
  const down  = isRoad(row + 1, col);
  const left  = isRoad(row, col - 1);
  const right = isRoad(row, col + 1);
  const deg = (up?1:0)+(down?1:0)+(left?1:0)+(right?1:0);

  if (deg === 4) return 'road-x';
  if (deg === 3) return !up ? 'road-t-n' : !down ? 'road-t-s' : !left ? 'road-t-w' : 'road-t-e';
  if (deg === 2) {
    if (up && down) return 'road-v';
    if (left && right) return 'road-h';
    if (up && right) return 'road-ne';
    if (up && left) return 'road-nw';
    if (down && right) return 'road-se';
    if (down && left) return 'road-sw';
  }
  if (deg === 1) return up ? 'road-end-n' : down ? 'road-end-s' : left ? 'road-end-w' : 'road-end-e';
  return 'road-dot';
};

// ====== Avatar & eventos ======
const setupAvatar = () => {
  const avatar = document.getElementById('avatar');
  updateAvatarExpression();
  avatar.style.backgroundSize = 'contain';
  avatar.style.backgroundRepeat = 'no-repeat';
  avatar.style.backgroundPosition = 'center';
  avatar.style.zIndex = '5';
  avatar.classList.add('idle'); // Animación sutil de respiración
};

const updateAvatarExpression = () => {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;
  
  const energy = getEnergy();
  let expression = 'neutral';
  
  if (energy <= 20) {
    expression = 'angry'; // Enfadado cuando tiene poca energía
  }
  
  avatar.style.backgroundImage = `url('${getAraySprite(expression)}')`;
};

const setupEventListeners = () => {
  document.getElementById('btn-eat')?.addEventListener('click', onEatClick);
  window.addEventListener('resize', updateAvatarPosition);
  try { hideModal?.(); } catch(e) {}
};

// ====== Movimiento ======
export const updateAvatarPosition = () => {
  const avatar = document.getElementById('avatar');
  const mapEl = document.getElementById('map');
  if (!avatar || !mapEl) {
    console.warn('❌ Avatar o mapEl no encontrado');
    return;
  }

  // Validar que el avatar esté dentro de los límites del mapa
  if (avatarPos.row < 0 || avatarPos.row >= MAP_HEIGHT || 
      avatarPos.col < 0 || avatarPos.col >= MAP_WIDTH) {
    console.warn('❌ Avatar fuera de límites, corrigiendo posición:', avatarPos);
    // Corregir posición a una carretera válida
    const startRoad = ensureRoadStart(Math.max(0, Math.min(MAP_HEIGHT-1, avatarPos.row)), 
                                     Math.max(0, Math.min(MAP_WIDTH-1, avatarPos.col)));
    avatarPos = { row: startRoad[0], col: startRoad[1] };
    console.log('✅ Posición corregida a:', avatarPos);
  }

  const rect = mapEl.getBoundingClientRect();
  console.log(`🗺️ Map rect: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px, top: ${rect.top.toFixed(1)}px, left: ${rect.left.toFixed(1)}px`);
  
  // Calcular tamaño de cada celda basado en el grid CSS
  const cellW = rect.width / MAP_WIDTH;
  const cellH = rect.height / MAP_HEIGHT;
  
  // Tamaño del avatar (más pequeño que la celda para que se vea bien)
  const avatarW = cellW * 0.8;
  const avatarH = cellH * 0.8;
  
  // Posición del avatar (centrado en la celda, ajustado un poco más arriba)
  const x = rect.left + (avatarPos.col * cellW) + (cellW - avatarW) / 2;
  const y = rect.top + (avatarPos.row * cellH) + (cellH - avatarH) / 2 - (cellH * 0.1); // Subir un 10% de la altura de la celda

  console.log(`🎨 Avatar pos: fila=${avatarPos.row}, col=${avatarPos.col}`);
  console.log(`📐 Celda: ${cellW.toFixed(1)}x${cellH.toFixed(1)}px`);
  console.log(`📍 Avatar: x=${x.toFixed(1)}px, y=${y.toFixed(1)}px, size=${avatarW.toFixed(1)}x${avatarH.toFixed(1)}px`);

  // Aplicar posición absoluta respecto al viewport
  avatar.style.position = 'fixed';
  avatar.style.width = avatarW + 'px';
  avatar.style.height = avatarH + 'px';
  avatar.style.left = x + 'px';
  avatar.style.top = y + 'px';
  avatar.style.zIndex = '10000';
};

export const walkPath = async (path, stepMs = 160) => {
  const avatar = document.getElementById('avatar');
  avatar?.classList.remove('idle'); // Quitar animación al moverse
  
  console.log(`🚶 walkPath iniciado con ${path.length} pasos:`, path);
  
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i];
    console.log(`👣 Paso ${i}/${path.length-1}: moviendo a [${r}, ${c}]`);
    
    // Validar que la posición esté dentro de los límites
    if (r >= 0 && r < MAP_HEIGHT && c >= 0 && c < MAP_WIDTH) {
      avatarPos = { row: r, col: c };
      console.log(`📍 AvatarPos actualizado a: fila=${avatarPos.row}, col=${avatarPos.col}`);
      updateAvatarPosition();
      updateAvatarExpression(); // Actualizar expresión durante el movimiento
    } else {
      console.warn('❌ Posición inválida en el path:', [r, c], `(MAP_HEIGHT=${MAP_HEIGHT}, MAP_WIDTH=${MAP_WIDTH})`);
      break; // Detener el movimiento si hay una posición inválida
    }
    
    // Sonido de andar en cada paso
    playAudioFile('audio/andar.mp3', 0.3);
    
    await new Promise(res => setTimeout(res, stepMs));
  }
  
  console.log(`🏁 walkPath completado. Avatar final: fila=${avatarPos.row}, col=${avatarPos.col}`);
  avatar?.classList.add('idle'); // Reactivar animación al terminar
};

// ====== Edificios ======
const onBuildingClick = async (row, col, buildingType) => {
  if (isMoving) { toast('Espera a que termine el movimiento'); return; }

  const buildingName = getBuildingName(buildingType);
  
  // Obtener la entrada específica de cada edificio
  const entrances = {
    3: [3, 6],   // Cole -> D6
    4: [2, 1],   // Skate -> C1
    7: [6, 2],   // Informática -> G2
    14: [6, 7],  // Tienda -> G7
    13: [9, 6],  // Parque -> J6
    6: [10, 2],  // Yayos -> K2
    8: [13, 6],  // Edificio -> N6
    5: [16, 2],  // Pabellón -> Q2
    15: [17, 7], // Río -> R7
    16: [10, 3]  // Ajustes -> K3 (carretera adyacente)
  };
  
  const goalRoad = entrances[buildingType];
  if (!goalRoad) { toast('Entrada no encontrada'); return; }

  const startRoad = whereToStart();
  const path = findPath(MAP, startRoad, goalRoad);
  // Si ya estamos en la entrada del juego, abrir directamente el modal
  if ((!path || path.length < 2)) {
    const atEntrance = Array.isArray(startRoad) && Array.isArray(goalRoad)
      && startRoad[0] === goalRoad[0] && startRoad[1] === goalRoad[1];
    if (atEntrance) {
      playSound('click');
      resetBoredTimer();
      showAraySpeech(randomMsg('arriving'), 1500);
      setTimeout(async () => await showBuildingModal(buildingType, buildingName), 200);
      return;
    }
    console.log('Start:', startRoad, 'Goal:', goalRoad);
    toast('No hay camino por carretera'); 
    return; 
  }

  if (!consumeEnergy(path.length - 1)) return;

  playSound('click');
  resetBoredTimer(); // Reiniciar contador
  isMoving = true; await walkPath(path); isMoving = false;

  // Mensaje al llegar
  showAraySpeech(randomMsg('arriving'), 2000);
  setTimeout(async () => await showBuildingModal(buildingType, buildingName), 500);
};

const getBuildingName = (type) => {
  switch (type) {
    case 3: return 'Cole';
    case 4: return 'Skate Park';
    case 5: return 'Pabellón';
    case 6: return 'Casa Yayos';
    case 7: return 'Informática';
    case 8: return 'Edificio';
    case 13: return 'Parque';
    case 14: return 'Tienda de Chuches';
    case 15: return 'Río';
    case 16: return 'Ajustes';
    default: return 'Lugar';
  }
};

// ====== Energía ======
const consumeEnergy = (steps) => {
  // 1 punto por cada 5 casillas recorridas (redondeo hacia arriba para recorridos cortos)
  const cost = Math.max(1, Math.ceil(steps / 5));
  const have = getEnergy();
  if (have < cost) {
    // Mensaje gracioso cuando no hay energía
    showAraySpeech(randomMsg('noEnergy'), 3000);
    return false;
  }
  setEnergy(have - cost);
  updateHUD();
  updateAvatarExpression(); // Actualizar expresión al gastar energía
  return true;
};

// ====== Comida ======
const onEatClick = () => {
  const energy = getEnergy();

  if (energy >= 100) { toast('Estoy lleno, no puedo más 🤰'); return; }

  // Animar galleta volando hacia Aray
  animateCookieToAray();

  // Reproducir sonido de dar comida (al pulsar botón)
  playAudioFile('audio/darcomida.mp3', 0.5);
  
  vibrate(50);
  resetBoredTimer(); // Reiniciar contador de aburrimiento

  // Cuando llega la galleta (900ms):
  setTimeout(() => {
    // Comer GRATIS - solo recupera energía (no gasta golosinas)
    setEnergy(Math.min(100, energy + 30));
    
    // Cara feliz al comer
    const avatar = document.getElementById('avatar');
    avatar.style.backgroundImage = `url('${getAraySprite('happy')}')`;
    
    showAraySpeech(randomMsg('afterEat'), 2500); // Mensaje gracioso en bocadillo
    updateHUD();
    
    // Volver a la expresión normal (o enfadado si sigue bajo)
    setTimeout(() => {
      updateAvatarExpression();
    }, 800);
  }, 900);
};

const animateCookieToAray = () => {
  const btn = document.getElementById('btn-eat');
  const avatar = document.getElementById('avatar');
  if (!btn || !avatar) return;
  
  const btnRect = btn.getBoundingClientRect();
  const avatarRect = avatar.getBoundingClientRect();
  
  // Calcular posición de Aray (centro)
  const avatarCenterX = avatarRect.left + avatarRect.width / 2;
  const avatarCenterY = avatarRect.top + avatarRect.height / 2;
  
  // Crear galleta
  const cookie = document.createElement('div');
  cookie.className = 'flying-cookie';
  cookie.textContent = '🍪';
  cookie.style.left = btnRect.left + 'px';
  cookie.style.top = btnRect.top + 'px';
  
  // Calcular distancia
  const deltaX = avatarCenterX - btnRect.left;
  const deltaY = avatarCenterY - btnRect.top;
  
  cookie.style.setProperty('--tx', deltaX + 'px');
  cookie.style.setProperty('--ty', deltaY + 'px');
  
  document.body.appendChild(cookie);
  
  // Sonido de comer cuando llega la galleta (900ms = casi al final de la animación 1s)
  setTimeout(() => {
    playAudioFile('audio/galleta.mp3', 0.6);
  }, 900);
  
  // Eliminar después de la animación
  setTimeout(() => cookie.remove(), 1000);
};

// ====== Helpers: carreteras y BFS ======
const ensureRoadStart = (row, col) => {
  console.log(`🔍 ensureRoadStart: buscando carretera desde fila=${row}, col=${col}`);
  console.log(`🗺️ Código en esa posición: ${MAP[row][col]}`);
  
  // Si ya es carretera, perfecto
  if (MAP[row][col] === 1) {
    console.log(`✅ Ya está en carretera`);
    return [row, col];
  }
  
  // Busca carretera adyacente (4 dir)
  const near = findNearestRoad(row, col);
  if (near) {
    console.log(`🛣️ Carretera adyacente encontrada: fila=${near[0]}, col=${near[1]}`);
    return near;
  }
  
  // Fallback: primera carretera del mapa
  console.log(`🔍 Buscando primera carretera del mapa...`);
  for (let r=0;r<MAP_HEIGHT;r++) for (let c=0;c<MAP_WIDTH;c++)
    if (MAP[r][c]===1) {
      console.log(`🛣️ Primera carretera encontrada: fila=${r}, col=${c}`);
      return [r,c];
    }
  
  // Si no hay carreteras (improbable)
  console.log(`❌ No se encontraron carreteras, usando posición original`);
  return [row, col];
};

const whereToStart = () => {
  const currentCode = MAP[avatarPos.row][avatarPos.col];
  if (currentCode === 1 || currentCode === 10 || currentCode === 12) return [avatarPos.row, avatarPos.col];
  const near = findNearestRoad(avatarPos.row, avatarPos.col);
  return near ?? [avatarPos.row, avatarPos.col];
};

const findNearestRoad = (row, col) => {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr,dc] of dirs) {
    const rr=row+dr, cc=col+dc;
    if (rr>=0 && rr<MAP_HEIGHT && cc>=0 && cc<MAP_WIDTH) {
      const code = MAP[rr][cc];
      if (code === 1 || code === 10 || code === 12) return [rr,cc]; // carretera, inicio o entrada
    }
  }
  return null;
};

const neighbors = (row, col, grid) => {
  const out = [];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr,dc] of dirs) {
    const rr=row+dr, cc=col+dc;
    if (rr>=0 && rr<grid.length && cc>=0 && cc<grid[0].length) {
      const code = grid[rr][cc];
      if (code === 1 || code === 10 || code === 12) { // carretera, inicio o entrada
        out.push([rr,cc]);
      }
    }
  }
  return out;
};

export const findPath = (grid, start, goal) => {
  console.log(`🔍 findPath: buscando ruta de [${start[0]}, ${start[1]}] a [${goal[0]}, ${goal[1]}]`);
  
  // Validar parámetros de entrada
  if (!start || !goal || !Array.isArray(start) || !Array.isArray(goal)) {
    console.warn('❌ findPath: parámetros inválidos', { start, goal });
    return null;
  }
  
  if (start[0] < 0 || start[0] >= grid.length || start[1] < 0 || start[1] >= grid[0].length ||
      goal[0] < 0 || goal[0] >= grid.length || goal[1] < 0 || goal[1] >= grid[0].length) {
    console.warn('❌ findPath: posiciones fuera de límites', { start, goal, gridSize: [grid.length, grid[0].length] });
    return null;
  }

  const q=[start];
  const key=([r,c])=>`${r},${c}`;
  const seen=new Set([key(start)]);
  const prev=new Map();

  while(q.length){
    const u=q.shift();
    if (u[0]===goal[0] && u[1]===goal[1]){
      const path=[u]; let k=key(u);
      while(prev.has(k)){ const p=prev.get(k); path.push(p); k=key(p); }
      const finalPath = path.reverse();
      console.log(`✅ findPath: ruta encontrada con ${finalPath.length} pasos:`, finalPath);
      return finalPath;
    }
    for(const v of neighbors(u[0],u[1],grid)){
      const kv=key(v);
      if(!seen.has(kv)){ seen.add(kv); prev.set(kv,u); q.push(v); }
    }
  }
  console.warn('❌ findPath: no se encontró ruta');
  return null;
};

// ====== Modal edificios ======
const showBuildingModal = async (buildingType, buildingName) => {
  // Ocultar el avatar del pueblo cuando se muestra el modal
  const avatar = document.querySelector('.avatar');
  if (avatar) {
    avatar.style.display = 'none';
    avatar.style.visibility = 'hidden';
    avatar.style.opacity = '0';
    console.log('✅ Avatar del pueblo ocultado en modal');
  }
  
  // Si es ajustes (tipo 16), abrir modal de ajustes directamente
  if (buildingType === 16) {
    console.log('⚙️ Abriendo modal de ajustes...');
    import('./ui.js').then(module => {
      if (module.showSettingsModal) {
        module.showSettingsModal();
      }
    });
    return;
  }
  
  const info = getBuildingInfo(buildingType);
  const gameRoute = ROUTES[info.type];
  
  // Obtener el nivel desde localStorage usando la estructura unificada
  let record = 1;
  if (info.recordKey) {
    try {
      const { getBest } = await import('./storage.js');
      record = await getBest(info.recordKey) || 1;
    } catch (error) {
      console.log('Error obteniendo nivel:', error);
    }
  }
  
  // Si no hay nivel guardado, intentar obtenerlo desde GameBridge
  if (record === 1 && window.GameBridge && window.GameBridge.getBestLevel) {
    try {
      // Hacer llamada síncrona para obtener el nivel del juego correcto
      const levelData = await new Promise((resolve) => {
        window.onBestLevelReceived = (gameId, level) => {
          // Extraer el gameId de la clave (aray_best_skate -> skate)
          const expectedGameId = info.recordKey.replace('aray_best_', '');
          if (gameId === expectedGameId) {
            resolve(level);
          }
        };
        // Extraer el gameId de la clave (aray_best_skate -> skate)
        const gameId = info.recordKey.replace('aray_best_', '');
        window.GameBridge.getBestLevel(gameId);
        // Timeout después de 1 segundo
        setTimeout(() => resolve(1), 1000);
      });
      record = levelData;
      console.log(`🎮 Nivel obtenido desde GameBridge para ${info.type}:`, record);
    } catch (error) {
      console.log('Error obteniendo nivel desde GameBridge:', error);
    }
  }

  // Sonido de inicio de juego
  playAudioFile('audio/iniciojuego.mp3', 0.5);

  const content = document.createElement('div');
  content.innerHTML = `
    <div style="position:relative; margin-bottom:12px; margin-top:8px;">
      <img src="${info.image}" alt="${buildingName}" 
        style="width:100%; height:160px; object-fit:cover; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.2);"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22160%22%3E%3Crect width=%22400%22 height=%22160%22 fill=%22%23b86cff%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2260%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${info.icon}%3C/text%3E%3C/svg%3E'">
    </div>
    <h3 style="font-size:1.3rem; font-weight:900; color:#000; margin:0 0 8px 0; text-align:center;">${info.icon} ${buildingName}</h3>
    <p style="font-size:0.95rem; line-height:1.5; color:#555; margin-bottom:16px; text-align:center;">${info.description}</p>
    
    <!-- Estadísticas del juego -->
    <div style="display: flex; justify-content: center; gap: 1rem; margin: 1rem 0;">
      <div style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.8rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 100px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem; color: white;">NIVEL MÁS ALTO</div>
        <div id="best-level-display" style="font-size: 1.1rem; font-weight: bold; color: white;">${record || 1}</div>
      </div>
      <div style="background: linear-gradient(135deg, #ffd700, #ffb347); padding: 0.8rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3); min-width: 100px; cursor: pointer;" id="btn-ranking-modal" data-game-type="${info.type}" data-game-name="${buildingName}">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem; color: white;">🏆 RANKING</div>
        <div style="font-size: 1.1rem; font-weight: bold; color: white;">Ver Top</div>
      </div>
    </div>
    
    <button class="btn-modal-play" id="modal-play-btn" data-game-route="${gameRoute}">
      ¡JUGAR AHORA!
    </button>
  `;

  showModal('', content);

  // Ocultar el avatar del pueblo DESPUÉS de mostrar el modal
  setTimeout(() => {
    const avatar = document.querySelector('.avatar');
    if (avatar) {
      avatar.style.display = 'none';
      avatar.style.visibility = 'hidden';
      avatar.style.opacity = '0';
      avatar.style.pointerEvents = 'none';
      avatar.style.zIndex = '-1';
      console.log('✅ Avatar del pueblo ocultado en modal (después de mostrar)');
    }
  }, 50);

  document.getElementById('modal-play-btn')?.addEventListener('click', (event) => {
    // Obtener la ruta ANTES de cerrar el modal
    const gameRoute = event.target.getAttribute('data-game-route') || 'skate.html';
    console.log(`🎮 Navegando a: ${gameRoute}`);
    
    try { hideModal(); } catch(e) {
      const mr=document.getElementById('modal-root'); if(mr) mr.remove();
    }
    playSound('click');
    
    // Notificar que se va a jugar un juego (para anuncios)
    if (window.GameBridge && window.GameBridge.onGamePlayed) {
      try {
        window.GameBridge.onGamePlayed();
      } catch(e) {
        console.log('Error en GameBridge.onGamePlayed:', e);
      }
    }
    
    // Navegar a la página HTML del juego
    window.location.href = gameRoute;
  });

        // Event listener para el botón de ranking
        document.getElementById('btn-ranking-modal')?.addEventListener('click', async () => {
          playSound('click');
          await showGameRankingModal(info.type, buildingName);
        });
};

// ====== CARGAR JUEGOS COMO MÓDULOS ======
const loadGameModule = async (gameType) => {
  try {
    console.log(`🎮 Cargando juego: ${gameType}`);
    
    // Importar dinámicamente el módulo del juego
    const gameModule = await import(`./${gameType}.js`);
    
    // Si el módulo tiene una función de inicialización, llamarla
    const initFunctionName = `init${gameType.charAt(0).toUpperCase() + gameType.slice(1)}Game`;
    if (gameModule[initFunctionName]) {
      gameModule[initFunctionName]();
    } else if (gameModule.initGame) {
      gameModule.initGame();
    } else if (gameModule.default) {
      gameModule.default();
    } else {
      console.log(`⚠️ Módulo ${gameType} cargado pero sin función de inicialización`);
    }
    
  } catch (error) {
    console.error(`❌ Error cargando juego ${gameType}:`, error);
    
    // Fallback: mostrar mensaje de error
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h3>🎮 Juego no disponible</h3>
        <p>El juego ${gameType} no se pudo cargar.</p>
        <p style="color: #888; font-size: 12px;">Error: ${error.message}</p>
        <button onclick="hideModal()" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px;">Cerrar</button>
      </div>
    `;
    
    showModal(`Error - ${gameType}`, content);
  }
};

const getBuildingInfo = (type) => {
  switch(type){
    case 3: return { type:'school', name:'Cole', icon:'🏫', description:'¡Salva a tus amigos de los demonios!', image:'img/juegos/colegio.webp?v=1', recordKey:'cole', recordType:'nivel' };
    case 4: return { type:'skate', name:'Skate Park', icon:'🛹', description:'¡Corre y salta con tu skate!', image:'img/juegos/skate.webp?v=1', recordKey:'skate', recordType:'nivel' };
    case 5: return { type:'gym',  name:'Pabellón', icon:'🏀', description:'¡Tiros a canasta!', image:'img/juegos/pabellon.webp?v=1', recordKey:'pabellon', recordType:'nivel' };
    case 6: return { type:'yayos', name:'Casa Yayos', icon:'👴👵', description:'¡Dispara a las ratas!', image:'img/juegos/casayayos.webp?v=1', recordKey:'yayos', recordType:'nivel' };
    case 7: return { type:'informatica', name:'Informática', icon:'💻', description:'¡Conecta los cables!', image:'img/juegos/informatica.webp?v=1', recordKey:'informatica', recordType:'nivel' };
    case 8: return { type:'edificio', name:'Edificio', icon:'🏢', description:'¡Escala lo más alto!', image:'img/juegos/edificio.webp?v=1', recordKey:'edificio', recordType:'m' };
    case 13: return { type:'park', name:'Parque', icon:'🎮', description:'¡Come las chuches y escapa de los demonios!', image:'img/juegos/parque.webp?v=1', recordKey:'parque', recordType:'nivel' };
    case 14: return { type:'tienda', name:'Tienda de Chuches', icon:'🍬', description:'¡Conecta 3 chuches del mismo color!', image:'img/juegos/tienda.webp?v=1', recordKey:'tienda', recordType:'nivel' };
    case 15: return { type:'rio', name:'Río', icon:'🌊', description:'¡Salta por las piedras sin caer al agua!', image:'img/juegos/rio.webp?v=1', recordKey:'rio', recordType:'nivel' };
    default: return { type:'unknown', name:'Lugar', icon:'🏠', description:'Un lugar del pueblo.', image:'img/casa.svg', recordKey:'', recordType:'' };
  }
};

// ====== Modal Ranking Yayos ======
const showYayosRankingModal = async () => {
  // Sonido
  playSound('click');
  
  const content = document.createElement('div');
  content.style.cssText = 'max-width: 600px; margin: 0 auto;';
  
  // Obtener ranking de Yayos
  const ranking = await getYayosRanking();
  
  content.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <h2 style="font-size:2rem; margin-bottom:1rem;">🐀 Ranking Yayos</h2>
      <p style="font-size:1.1rem; color:#666; margin-bottom:2rem;">Top jugadores por nivel máximo alcanzado</p>
      
      <div id="yayos-ranking-list" style="max-height: 400px; overflow-y: auto; text-align: left;">
        ${ranking.map((user, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: ${index < 3 ? 'linear-gradient(135deg, #ffd700, #ffb347)' : '#f5f5f5'}; border-radius: 8px; border-left: 4px solid ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ddd'};">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: bold; color: ${index < 3 ? '#fff' : '#333'}; font-size: 1.2rem;">${index + 1}º</span>
              <span style="font-weight: bold; color: ${index < 3 ? '#fff' : '#333'};">${user.nick || 'Jugador'}</span>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; color: ${index < 3 ? '#fff' : '#333'}; font-size: 1.1rem;">Nivel ${user.bestLevel || 1}</div>
              <div style="font-size: 0.8rem; color: ${index < 3 ? 'rgba(255,255,255,0.8)' : '#666'};">${user.candiesTotal || 0} 🍬</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <button id="btn-close-ranking" class="btn-modal-play" style="background:#666; color:white; padding:10px 20px; font-size:1rem; border-radius:8px; border:none; cursor:pointer; margin-top:1rem;">
        Cerrar
      </button>
    </div>
  `;
  
  showModal('🐀 Ranking Yayos', content);
  
  // Event listener para cerrar
  document.getElementById('btn-close-ranking')?.addEventListener('click', () => {
    hideModal();
  });
};

// ====== Modal Ranking Genérico ======
const showRankingModal = async () => {
  // Sonido
  playSound('click');
  
  const content = document.createElement('div');
  content.style.cssText = 'max-width: 600px; margin: 0 auto;';
  
  // Modal simplificado - solo botón Google
  content.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <h2 style="font-size:2rem; margin-bottom:1rem;">🏆 Ranking Global</h2>
      <p style="font-size:1.1rem; color:#666; margin-bottom:2rem;">Inicia sesión con Google para ver el ranking y guardar tus puntuaciones</p>
      
      <button id="btn-google-signin" class="btn-modal-play" style="background:#4285f4; color:white; padding:15px 30px; font-size:1.1rem; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; gap:10px; margin:0 auto;">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Entrar con Google
      </button>
      
      <p style="font-size:0.9rem; color:#888; margin-top:1rem;">
        <a href="#" id="btn-view-ranking" style="color:#667eea; text-decoration:underline;">Ver ranking sin iniciar sesión</a>
      </p>
    </div>
  `;
  
  showModal('🏆 Ranking Global', content);
  
  // Event listeners simplificados
  document.getElementById('btn-google-signin')?.addEventListener('click', () => {
    // Cerrar este modal y abrir modal de ajustes
    hideModal();
    import('./ui.js').then(module => {
      if (module.showSettingsModal) {
        module.showSettingsModal();
      }
    });
  });
  
  document.getElementById('btn-view-ranking')?.addEventListener('click', async () => {
    await loadRankingList();
  });
};

// Función para obtener ranking de Yayos
const getYayosRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getYayosRanking) {
      return new Promise((resolve) => {
        window.onYayosRankingReceived = (ranking) => {
          console.log('📊 Ranking de Yayos recibido:', ranking);
          resolve(ranking || []);
        };
        
        // Timeout después de 5 segundos
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Yayos');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getYayosRanking();
      });
    } else {
      // Fallback: obtener desde localStorage si no hay GameBridge
      const localRanking = localStorage.getItem('yayos_ranking');
      return localRanking ? JSON.parse(localRanking) : [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Yayos:', error);
    return [];
  }
};

// Función para obtener ranking de Skate Park
const getSkateRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getSkateRanking) {
      return new Promise((resolve) => {
        window.onSkateRankingReceived = (ranking) => {
          console.log('📊 Ranking de Skate recibido:', ranking);
          resolve(ranking || []);
        };
        
        // Timeout después de 5 segundos
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Skate');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getSkateRanking();
      });
    } else {
      // Fallback: obtener desde localStorage si no hay GameBridge
      const localRanking = localStorage.getItem('skate_ranking');
      return localRanking ? JSON.parse(localRanking) : [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Skate:', error);
    return [];
  }
};

// Función para obtener ranking de Cole
const getColeRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getColeRanking) {
      return new Promise((resolve) => {
        window.onColeRankingReceived = (ranking) => {
          console.log('📊 Ranking de Cole recibido:', ranking);
          resolve(ranking || []);
        };
        
        // Timeout después de 5 segundos
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Cole');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getColeRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Cole:', error);
    return [];
  }
};

// Función para obtener ranking de Informática
const getInformaticaRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getInformaticaRanking) {
      return new Promise((resolve) => {
        window.onInformaticaRankingReceived = (ranking) => {
          console.log('📊 Ranking de Informática recibido:', ranking);
          resolve(ranking || []);
        };
        
        // Timeout después de 5 segundos
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Informática');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getInformaticaRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Informática:', error);
    return [];
  }
};

// Función para obtener ranking de Edificio
const getEdificioRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getEdificioRanking) {
      return new Promise((resolve) => {
        window.onEdificioRankingReceived = (ranking) => {
          console.log('📊 Ranking de Edificio recibido:', ranking);
          resolve(ranking || []);
        };
        
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Edificio');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getEdificioRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Edificio:', error);
    return [];
  }
};

// Función para obtener ranking de Río
const getRioRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getRioRanking) {
      return new Promise((resolve) => {
        window.onRioRankingReceived = (ranking) => {
          console.log('📊 Ranking de Río recibido:', ranking);
          resolve(ranking || []);
        };
        
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Río');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getRioRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Río:', error);
    return [];
  }
};

// Función para obtener ranking de Parque
const getParqueRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getParqueRanking) {
      return new Promise((resolve) => {
        window.onParqueRankingReceived = (ranking) => {
          console.log('📊 Ranking de Parque recibido:', ranking);
          resolve(ranking || []);
        };
        
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Parque');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getParqueRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Parque:', error);
    return [];
  }
};

// Función para obtener ranking de Tienda
const getTiendaRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getTiendaRanking) {
      return new Promise((resolve) => {
        window.onTiendaRankingReceived = (ranking) => {
          console.log('📊 Ranking de Tienda recibido:', ranking);
          resolve(ranking || []);
        };
        
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Tienda');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getTiendaRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Tienda:', error);
    return [];
  }
};

// Función para obtener ranking de Pabellón
const getPabellonRanking = async () => {
  try {
    if (window.GameBridge && window.GameBridge.getPabellonRanking) {
      return new Promise((resolve) => {
        window.onPabellonRankingReceived = (ranking) => {
          console.log('📊 Ranking de Pabellón recibido:', ranking);
          resolve(ranking || []);
        };
        
        setTimeout(() => {
          console.log('⏰ Timeout obteniendo ranking de Pabellón');
          resolve([]);
        }, 5000);
        
        window.GameBridge.getPabellonRanking();
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo ranking de Pabellón:', error);
    return [];
  }
};

// ====== Modal Ranking Específico por Juego ======
// Hacer la función disponible globalmente
window.showGameRankingModal = async (gameType, gameName) => {
  // Sonido
  playSound('click');
  
  // Obtener información del juego
  const gameInfo = getBuildingInfoByType(gameType);
  const gameIcon = gameInfo ? gameInfo.icon : '🎮';
  
  // Si es Skate Park, Cole, Informática, Tienda, Edificio, Yayos, Pabellón, Río o Parque, mostrar ranking funcional
  if (gameType === 'skate' || gameType === 'school' || gameType === 'informatica' || gameType === 'tienda' || gameType === 'edificio' || gameType === 'yayos' || gameType === 'gym' || gameType === 'rio' || gameType === 'park') {
    let ranking = [];
    
    // Obtener ranking específico para cada juego
    if (gameType === 'skate') {
      ranking = await getSkateRanking();
    } else if (gameType === 'school') {
      ranking = await getColeRanking();
    } else if (gameType === 'informatica') {
      ranking = await getInformaticaRanking();
    } else if (gameType === 'tienda') {
      ranking = await getTiendaRanking();
    } else if (gameType === 'edificio') {
      ranking = await getEdificioRanking();
    } else if (gameType === 'yayos') {
      ranking = await getYayosRanking();
    } else if (gameType === 'gym') {
      ranking = await getPabellonRanking();
    } else if (gameType === 'rio') {
      ranking = await getRioRanking();
    } else if (gameType === 'park') {
      ranking = await getParqueRanking();
    }
    
    // Ordenar inversamente por nivel (de mayor a menor) y luego por caramelos si hay empate
    ranking.sort((a, b) => {
      const levelA = a.bestLevel || 0;
      const levelB = b.bestLevel || 0;
      if (levelB !== levelA) {
        return levelB - levelA; // Mayor nivel primero
      }
      const candiesA = a.candiesTotal || 0;
      const candiesB = b.candiesTotal || 0;
      return candiesB - candiesA; // Más caramelos primero si mismo nivel
    });
    
    // Crear content con ancho mayor para todos los juegos
    const content = document.createElement('div');
    content.style.cssText = 'max-width: 700px; margin: 0 auto; width: 90%;';
    
    // Calcular altura máxima: aproximadamente 10 filas (encabezado + 10 jugadores)
    const maxHeight = 340; // Altura para mostrar ~10 usuarios
    
    // Formato compacto para todos los juegos
    content.innerHTML = `
      <div style="padding: 20px 20px 20px 10px; margin-left: -20px; margin-right: -25px;">
        <div class="ranking-scroll-container" style="max-height: ${maxHeight}px; height: ${maxHeight}px; overflow-y: scroll; overflow-x: hidden; margin-bottom: 2rem; border: 1px solid #ddd; border-radius: 8px; background: white; scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain;">
          <!-- Encabezado -->
          <div style="display: grid; grid-template-columns: 0.8fr 3fr 1fr 1.5fr; gap: 10px; padding: 10px 15px 10px 15px; background: linear-gradient(135deg, #4ecdc4, #44a08d); border-radius: 8px 8px 0 0; font-weight: bold; color: white; font-size: 0.9rem; position: sticky; top: 0; z-index: 10;">
            <div style="text-align: center;">Pos</div>
            <div>Nick</div>
            <div style="text-align: center;">Nivel</div>
            <div style="text-align: right;">Caramelos</div>
          </div>
          
          <!-- Lista de jugadores -->
          ${ranking.map((user, index) => {
            const position = index + 1;
            const trophy = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const posDisplay = index < 3 ? trophy : position;
            return `
            <div style="display: grid; grid-template-columns: 0.8fr 3fr 1fr 1.5fr; gap: 10px; padding: 8px 15px 8px 15px; background: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'}; border-bottom: 1px solid #e0e0e0; font-size: 0.85rem; white-space: nowrap; ${index === ranking.length - 1 ? 'border-bottom: none; border-radius: 0 0 8px 8px;' : ''}">
              <div style="text-align: center; color: #666; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${posDisplay}</div>
              <div style="font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span>${user.nick || 'Jugador'}</span>
              </div>
              <div style="text-align: center; color: #666; white-space: nowrap;">${user.bestLevel || 1}</div>
              <div style="text-align: right; color: #666; white-space: nowrap;">${user.candiesTotal || 0} 🍬</div>
            </div>`;
          }).join('')}
        </div>
        
        <div style="text-align: center;">
          <button id="btn-close-game-ranking" class="btn-modal-play" style="background:#666; color:white; padding:10px 20px; font-size:1rem; border-radius:8px; border:none; cursor:pointer; margin-top: 0.5rem;">
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    showModal(`🏆 Ranking ${gameName}`, content);
    
    // Ocultar scrollbar pero mantener funcionalidad de scroll
    const scrollContainer = content.querySelector('.ranking-scroll-container');
    if (scrollContainer) {
      const style = document.createElement('style');
      style.textContent = `
        .ranking-scroll-container::-webkit-scrollbar { width: 0px; background: transparent; }
        .ranking-scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
      `;
      document.head.appendChild(style);
      // Evitar que el gesto de scroll burbujee al body en móviles
      ['touchstart','touchmove'].forEach(evt => {
        scrollContainer.addEventListener(evt, (e) => {
          e.stopPropagation();
        }, { passive: true });
      });
    }
    
    // Event listener para cerrar
    document.getElementById('btn-close-game-ranking')?.addEventListener('click', () => {
      hideModal();
    });
    return; // Salir temprano después de mostrar el ranking
  } else {
    // Para otros juegos, mostrar "próximamente"
    content.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <h2 style="font-size:2rem; margin-bottom:1rem;">${gameIcon} Ranking ${gameName}</h2>
        <p style="margin-bottom:2rem; color:#666;">Próximamente disponible</p>
        <p style="font-size:0.9rem; color:#888; margin-bottom:2rem;">
          El ranking específico para ${gameName} estará disponible próximamente.
        </p>
        <button id="btn-close-game-ranking" class="btn-modal-play" style="background:#666; color:white; padding:10px 20px; font-size:1rem; border-radius:8px; border:none; cursor:pointer;">
          Cerrar
        </button>
      </div>
    `;
  }
  
  showModal(`🏆 Ranking ${gameName}`, content);
  
  // Event listener para cerrar
  document.getElementById('btn-close-game-ranking')?.addEventListener('click', () => {
    hideModal();
  });
};

// Función auxiliar para obtener información del edificio por tipo
const getBuildingInfoByType = (type) => {
  switch(type){
    case 'school': return { type:'school', name:'Cole', icon:'🏫', description:'¡Salva a tus amigos de los demonios!', image:'img/juegos/colegio.webp?v=1', recordKey:'cole', recordType:'nivel' };
    case 'skate': return { type:'skate', name:'Skate Park', icon:'🛹', description:'¡Corre y salta con tu skate!', image:'img/juegos/skate.webp?v=1', recordKey:'skate', recordType:'nivel' };
    case 'gym': return { type:'gym',  name:'Pabellón', icon:'🏀', description:'¡Tiros a canasta!', image:'img/juegos/pabellon.webp?v=1', recordKey:'pabellon', recordType:'nivel' };
    case 'yayos': return { type:'yayos', name:'Casa Yayos', icon:'👴👵', description:'¡Dispara a las ratas!', image:'img/juegos/casayayos.webp?v=1', recordKey:'yayos', recordType:'nivel' };
    case 'informatica': return { type:'informatica', name:'Informática', icon:'💻', description:'¡Conecta los cables!', image:'img/juegos/informatica.webp?v=1', recordKey:'informatica', recordType:'nivel' };
    case 'edificio': return { type:'edificio', name:'Edificio', icon:'🏢', description:'¡Escala lo más alto!', image:'img/juegos/edificio.webp?v=1', recordKey:'edificio', recordType:'m' };
    case 'park': return { type:'park', name:'Parque', icon:'🎮', description:'¡Come las chuches y escapa de los demonios!', image:'img/juegos/parque.webp?v=1', recordKey:'parque', recordType:'nivel' };
    case 'tienda': return { type:'tienda', name:'Tienda', icon:'🛒', description:'¡Combina las frutas!', image:'img/juegos/tienda.webp?v=1', recordKey:'tienda', recordType:'nivel' };
    case 'rio': return { type:'rio', name:'Río', icon:'🌊', description:'¡Salta los troncos!', image:'img/juegos/rio.webp?v=1', recordKey:'rio', recordType:'nivel' };
    default: return { type:'unknown', name:'Lugar', icon:'🏠', description:'Un lugar del pueblo.', image:'img/casa.svg', recordKey:'', recordType:'' };
  }
};

// Función auxiliar para cargar el ranking
const loadRankingList = async () => {
  console.log('loadRankingList iniciado');
  const rankingDiv = document.getElementById('ranking-list');
  if (!rankingDiv) {
    console.error('No se encontró ranking-list div');
    return;
  }
  
  rankingDiv.innerHTML = '<p style="text-align:center; color:#888;">Cargando...</p>';
  
  const result = await getRankingGlobal();
  console.log('Resultado ranking:', result);
  
  if (!result.ok || !result.ranking || result.ranking.length === 0) {
    rankingDiv.innerHTML = '<p style="text-align:center; color:#888;">No hay datos de ranking aún. <a href="#" onclick="window.location.href=\'/sistema_apps_upload/pueblito/crear_datos_prueba.php\'; return false;" style="color:#667eea;">Crear datos de prueba</a></p>';
    return;
  }
  
  let html = '<div style="background:#f8f9fa; border-radius:12px; padding:1rem;">';
  result.ranking.forEach((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    html += `
      <div style="display:flex; justify-content:space-between; padding:0.8rem; background:white; border-radius:8px; margin-bottom:0.5rem; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          <span style="font-size:1.2rem; font-weight:bold; min-width:2rem;">${medal}</span>
          <div>
            <div style="font-weight:bold; color:#333;">${entry.nick || entry.nombre}</div>
            <div style="font-size:0.85rem; color:#888;">Nivel ${entry.nivel_max}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:bold; color:#667eea;">${entry.puntos_totales.toLocaleString()} pts</div>
          <div style="font-size:0.85rem; color:#f59e0b;">${entry.monedas_totales} 🍬</div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  
  rankingDiv.innerHTML = html;
};

// Exportar función para uso en otros módulos
export { showRankingModal };
