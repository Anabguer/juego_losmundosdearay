/* ========================================
   🗺️ MAP - Pueblo navegable con tiles (FIX)
   - BFS por carreteras (1)
   - Origen/Destino convertidos a carretera adyacente
   - Movimiento con transform + energía por paso
   - Modales robustas y navegación a minijuegos
   ======================================== */

import { getCoins, getEnergy, setEnergy, setCoins, getBest } from './storage.js';
import { updateHUD, toast, showModal, hideModal, playSound, vibrate } from './ui.js';
import { getAraySprite } from './sprites.js';

// Dimensiones
const MAP_WIDTH = 10;
const MAP_HEIGHT = 20;

// MAPA COMPLETO EN BLANCO - SOLO EDIFICIOS
// Coordenadas: Columnas 0-9 (izq→der), Filas A-T (arriba→abajo)
// 0=grass, 1=road, 2=river, 11=dirt, 12=entrance (entrada edificio)
// 3=cole, 4=skate, 5=pabellón, 6=yayos, 7=informatica, 8=edificio, 13=parque, 14=tienda, 15=rio, 9=building-part
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
  [ 6, 9,11, 1, 1, 1,12, 9, 9, 0],  // J (fila 9) ← Yayos J0-J1-K0-K1 + J3,J4,J5,J6 entrada Parque + tierra J2
  [ 9, 9,12, 1,11,11, 0, 0, 0, 0],  // K (fila 10) ← K2 entrada Yayos + K3 + tierra K4,K5
  [ 0,11,11, 1,11,11, 0, 0, 0, 0],  // L (fila 11) ← L3 + tierra L1,L2,L4,L5
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
  school: 'cole.html',
  skate: 'skate.html', // Skate runner
  park: 'parque.html', // Pacman con Aray
  gym: 'pabellon.html',
  yayos: 'yayos.html',
  informatica: 'informatica.html',
  edificio: 'edificio.html',
  tienda: 'tienda.html', // Candy Crush de chuches
  rio: 'rio.html' // Juego del río
};

// Estado avatar: posición en celdas (fila/col)
let avatarPos = { row: 17, col: 9 }; // R9 (inicio en césped)
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
  // Fresitas iniciales si no hay
  if (getCoins() === 0) setCoins(5);
  renderMap();
  setupAvatar();
  setupEventListeners();

  // Si el avatar no está sobre carretera, colócalo en la carretera adyacente
  const startRoad = ensureRoadStart(avatarPos.row, avatarPos.col);
  avatarPos = { row: startRoad[0], col: startRoad[1] };

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
      
      // Partes de edificios (código 9) - asignar background-position
      if (code === 9) {
        // Función auxiliar para detectar si es un edificio
        const isBuilding = (c) => (c >= 3 && c <= 8) || c === 13 || c === 14 || c === 15;
        
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
        const buildingClass = ['', '', '', 'school', 'skate', 'gym', 'yayos', 'informatica', 'edificio', '', '', '', '', 'park', 'tienda', 'rio'][buildingCode] || '';
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
          if (isMoving) return;
          resetBoredTimer(); // Reiniciar contador
          const start = whereToStart();
          const goal = [row, col];
          const path = findPath(MAP, start, goal);
          if (!path) { toast('No hay camino por carretera'); return; }
          if (!consumeEnergy(path.length - 1)) return;
          isMoving = true; await walkPath(path); isMoving = false;
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
    case 3: recordKey = 'aray_best_cole'; break; // Cole
    case 4: recordKey = 'aray_best_skate'; recordType = 'm'; break; // Skate (metros)
    case 5: recordKey = 'aray_best_pabellon'; break; // Pabellón
    case 6: recordKey = 'aray_best_yayos'; break; // Yayos
    case 7: recordKey = 'aray_best_informatica'; break; // Informática
    case 8: recordKey = 'aray_best_edificio'; recordType = 'm'; break; // Edificio (metros)
    case 13: recordKey = 'aray_best_pacman'; break; // Parque (Pacman)
    case 14: recordKey = 'aray_best_tienda'; break; // Tienda
    case 15: recordKey = 'aray_best_rio'; break; // Río
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
const updateAvatarPosition = () => {
  const avatar = document.getElementById('avatar');
  const mapEl = document.getElementById('map');
  if (!avatar || !mapEl) return;

  const rect = mapEl.getBoundingClientRect();
  const padding = 8; // del CSS
  const gap = 2; // del CSS
  
  // Ancho y alto disponibles para las celdas (sin padding)
  const availableWidth = rect.width - (padding * 2);
  const availableHeight = rect.height - (padding * 2);
  
  // Tamaño de cada celda (incluyendo gap)
  const cellW = availableWidth / MAP_WIDTH;
  const cellH = availableHeight / MAP_HEIGHT;
  
  // Tamaño real de la celda (sin gap)
  const tileW = cellW - gap;
  const tileH = cellH - gap;
  
  // Posición centrada en la celda
  const x = padding + (avatarPos.col * cellW) + (gap / 2);
  // Ajuste vertical: subir un poco más el avatar (20% de la altura de la celda)
  const y = padding + (avatarPos.row * cellH) + (gap / 2) - (tileH * 0.2);

  avatar.style.width = tileW + 'px';
  avatar.style.height = tileH + 'px';
  avatar.style.left = x + 'px';
  avatar.style.top = y + 'px';
};

export const walkPath = async (path, stepMs = 160) => {
  const avatar = document.getElementById('avatar');
  avatar?.classList.remove('idle'); // Quitar animación al moverse
  
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i];
    avatarPos = { row: r, col: c };
    updateAvatarPosition();
    updateAvatarExpression(); // Actualizar expresión durante el movimiento
    
    // Sonido de andar en cada paso
    const audio = new Audio('assets/audio/andar.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio no disponible'));
    
    await new Promise(res => setTimeout(res, stepMs));
  }
  
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
    15: [17, 7]  // Río -> R7
  };
  
  const goalRoad = entrances[buildingType];
  if (!goalRoad) { toast('Entrada no encontrada'); return; }

  const startRoad = whereToStart();
  const path = findPath(MAP, startRoad, goalRoad);
  if (!path || path.length < 2) { 
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
  setTimeout(() => showBuildingModal(buildingType, buildingName), 500);
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
    default: return 'Lugar';
  }
};

// ====== Energía ======
const consumeEnergy = (steps) => {
  const have = getEnergy();
  if (have < steps) { 
    // Mensaje gracioso cuando no hay energía
    showAraySpeech(randomMsg('noEnergy'), 3000); 
    return false; 
  }
  setEnergy(have - steps);
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
  const audio = new Audio('assets/audio/darcomida.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
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
    const audioGalleta = new Audio('assets/audio/galleta.mp3');
    audioGalleta.volume = 0.6;
    audioGalleta.play().catch(e => console.log('Audio no disponible'));
  }, 900);
  
  // Eliminar después de la animación
  setTimeout(() => cookie.remove(), 1000);
};

// ====== Helpers: carreteras y BFS ======
const ensureRoadStart = (row, col) => {
  // Si ya es carretera, perfecto
  if (MAP[row][col] === 1) return [row, col];
  // Busca carretera adyacente (4 dir)
  const near = findNearestRoad(row, col);
  if (near) return near;
  // Fallback: primera carretera del mapa
  for (let r=0;r<MAP_HEIGHT;r++) for (let c=0;c<MAP_WIDTH;c++)
    if (MAP[r][c]===1) return [r,c];
  // Si no hay carreteras (improbable)
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
  const q=[start];
  const key=([r,c])=>`${r},${c}`;
  const seen=new Set([key(start)]);
  const prev=new Map();

  while(q.length){
    const u=q.shift();
    if (u[0]===goal[0] && u[1]===goal[1]){
      const path=[u]; let k=key(u);
      while(prev.has(k)){ const p=prev.get(k); path.push(p); k=key(p); }
      return path.reverse();
    }
    for(const v of neighbors(u[0],u[1],grid)){
      const kv=key(v);
      if(!seen.has(kv)){ seen.add(kv); prev.set(kv,u); q.push(v); }
    }
  }
  return null;
};

// ====== Modal edificios ======
const showBuildingModal = (buildingType, buildingName) => {
  const info = getBuildingInfo(buildingType);
  const gameRoute = ROUTES[info.type];
  const record = getBest(info.recordKey);

  // Sonido de inicio de juego
  const audio = new Audio('assets/audio/iniciojuego.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));

  const content = document.createElement('div');
  content.innerHTML = `
    <div style="position:relative; margin-bottom:12px; margin-top:8px;">
      <img src="${info.image}" alt="${buildingName}" 
        style="width:100%; height:160px; object-fit:cover; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.2);"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22160%22%3E%3Crect width=%22400%22 height=%22160%22 fill=%22%23b86cff%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2260%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${info.icon}%3C/text%3E%3C/svg%3E'">
      <!-- Récord eliminado - no queremos mostrar niveles -->
    </div>
    <h3 style="font-size:1.3rem; font-weight:900; color:#000; margin:0 0 8px 0; text-align:center;">${info.icon} ${buildingName}</h3>
    <p style="font-size:0.95rem; line-height:1.5; color:#555; margin-bottom:16px; text-align:center;">${info.description}</p>
    <button class="btn-modal-play" id="modal-play-btn">
      ¡JUGAR AHORA!
    </button>
  `;

  showModal('', content);

  document.getElementById('modal-play-btn')?.addEventListener('click', () => {
    try { hideModal(); } catch(e) {
      const mr=document.getElementById('modal-root'); if(mr) mr.remove();
    }
    playSound('click');
    window.location.href = gameRoute;
  });
};

const getBuildingInfo = (type) => {
  switch(type){
    case 3: return { type:'school', name:'Cole', icon:'🏫', description:'¡Salva a tus amigos de los demonios!', image:'assets/img/juegos/colegio.png?v=1', recordKey:'aray_best_cole', recordType:'nivel' };
    case 4: return { type:'skate', name:'Skate Park', icon:'🛹', description:'¡Corre y salta con tu skate!', image:'assets/img/juegos/skate.png?v=1', recordKey:'aray_best_skate', recordType:'m' };
    case 5: return { type:'gym',  name:'Pabellón', icon:'🏀', description:'¡Tiros a canasta!', image:'assets/img/juegos/pabellon.png?v=1', recordKey:'aray_best_pabellon', recordType:'nivel' };
    case 6: return { type:'yayos', name:'Casa Yayos', icon:'👴👵', description:'¡Dispara a las ratas!', image:'assets/img/juegos/casayayos.png?v=1', recordKey:'aray_best_yayos', recordType:'nivel' };
    case 7: return { type:'informatica', name:'Informática', icon:'💻', description:'¡Conecta los cables!', image:'assets/img/juegos/informatica.png?v=1', recordKey:'aray_best_informatica', recordType:'nivel' };
    case 8: return { type:'edificio', name:'Edificio', icon:'🏢', description:'¡Escala lo más alto!', image:'assets/img/juegos/edificio.png?v=1', recordKey:'aray_best_edificio', recordType:'m' };
    case 13: return { type:'park', name:'Parque', icon:'🎮', description:'¡Come las chuches y escapa de los demonios!', image:'assets/img/juegos/parque.png?v=1', recordKey:'aray_best_pacman', recordType:'nivel' };
    case 14: return { type:'tienda', name:'Tienda de Chuches', icon:'🍬', description:'¡Conecta 3 chuches del mismo color!', image:'assets/img/juegos/tienda.png?v=1', recordKey:'aray_best_tienda', recordType:'nivel' };
    case 15: return { type:'rio', name:'Río', icon:'🌊', description:'¡Salta por las piedras sin caer al agua!', image:'assets/img/juegos/rio.png?v=1', recordKey:'aray_best_rio', recordType:'nivel' };
    default: return { type:'unknown', name:'Lugar', icon:'🏠', description:'Un lugar del pueblo.', image:'assets/img/casa.svg', recordKey:'', recordType:'' };
  }
};
