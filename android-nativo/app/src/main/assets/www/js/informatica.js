/* ========================================
   💻 INFORMÁTICA - Conecta los Cables
   Arrastra puertos a sus parejas antes de que se agote el tiempo
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_informatica';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;
let spawnTimer;

// Estado del juego
const state = {
  connected: 0,
  ports: [],
  draggedPort: null,
  dragOffset: { x: 0, y: 0 },
  gameOver: false,
  nextSpawn: 0,
  spawnInterval: 2000, // 2 segundos entre spawns (constante)
  portTimeLimit: 8000, // 8 segundos para conectar cada puerto
  speedMultiplier: 1,
  batchSize: 1, // nº de pares por oleada (irá subiendo con el nivel)
  level: 1,
  levelStep: 10 // cada 10 conexiones sube de nivel
};

// Tipos de puertos con iconos chulos
const PORT_TYPES = [
  { emoji: '🔌', name: 'Enchufe', color: '#ff4fd8' },
  { emoji: '🔋', name: 'Batería', color: '#00c48c' },
  { emoji: '💡', name: 'Bombilla', color: '#ffb74d' },
  { emoji: '📱', name: 'Móvil', color: '#27e9ff' },
  { emoji: '💻', name: 'Portátil', color: '#b86cff' },
  { emoji: '🖥️', name: 'Monitor', color: '#2a56ff' },
  { emoji: '⌚', name: 'Reloj', color: '#ff6b6b' },
  { emoji: '🎮', name: 'Consola', color: '#4ecdc4' }
];

// Configuración
const config = {
  portSize: 60,
  connectionDistance: 80
};

// ====== Init ======
const initGame = () => {
  state.connected = 0;
  state.level = 1;
  state.ports = [];
  state.draggedPort = null;
  state.gameOver = false;
  // Tras los 2 pares iniciales, esperamos un intervalo completo antes de la primera oleada
  state.nextSpawn = state.spawnInterval;
  state.spawnInterval = 2000; // 2 segundos constante
  state.portTimeLimit = 8000; // 8 segundos constante
  state.speedMultiplier = 1;
  state.batchSize = 1; // por ahora: 1 par por oleada
  
  setupCanvas();
  updateGameHUD();
  
  // Iniciar bucle
  gameLoop();

  // Planificar oleadas periódicas controladas (evita parpadeos)
  if (spawnTimer) clearInterval(spawnTimer);
  spawnTimer = setInterval(tickSpawn, state.spawnInterval);
};

// Setup canvas
const setupCanvas = () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  
  const resize = () => {
    // Canvas ocupa toda la pantalla
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '1';
    
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  };
  
  resize();
  window.addEventListener('resize', resize);
  
  // Touch/mouse events
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
};

// Spawn un nuevo par de puertos
const spawnNewPair = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const padding = 80;
  const topPadding = 150;
  
  // Verificar qué tipos ya están en pantalla
  const usedTypes = new Set();
  state.ports.forEach(port => {
    if (!port.connected) {
      usedTypes.add(port.emoji);
    }
  });
  
  // Filtrar tipos disponibles
  const availableTypes = PORT_TYPES.filter(type => !usedTypes.has(type.emoji));
  
  // Si no hay tipos disponibles, usar cualquiera
  const type = availableTypes.length > 0 
    ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
    : PORT_TYPES[Math.floor(Math.random() * PORT_TYPES.length)];
    
  const pairId = Date.now(); // ID único basado en timestamp
  
  // Sistema de grid para evitar superposiciones
  const cellSize = 80; // Tamaño de celda del grid
  const cols = Math.floor((width - padding * 2) / cellSize);
  const rows = Math.floor((height - topPadding - padding) / cellSize);
  
  // Crear grid de posiciones disponibles
  const availablePositions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = padding + col * cellSize + cellSize / 2;
      const y = topPadding + row * cellSize + cellSize / 2;
      
      // Verificar que no esté demasiado cerca de puertos existentes
      let tooClose = false;
      for (const port of state.ports) {
        if (!port.connected) {
          const dist = Math.hypot(port.x - x, port.y - y);
          if (dist < 100) { // Distancia mínima muy estricta
            tooClose = true;
            break;
          }
        }
      }
      
      if (!tooClose) {
        availablePositions.push({ x, y });
      }
    }
  }
  
  // Si no hay posiciones disponibles, usar posiciones aleatorias con separación forzada
  let x1, y1, x2, y2;
  
  if (availablePositions.length >= 2) {
    // Usar grid
    const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
    x1 = shuffled[0].x + (Math.random() - 0.5) * 20; // Pequeña variación
    y1 = shuffled[0].y + (Math.random() - 0.5) * 20;
    x2 = shuffled[1].x + (Math.random() - 0.5) * 20;
    y2 = shuffled[1].y + (Math.random() - 0.5) * 20;
  } else {
    // Fallback: posiciones aleatorias con separación forzada
    x1 = padding + Math.random() * (width - padding * 2);
    y1 = topPadding + Math.random() * (height - topPadding - padding);
    
    // Asegurar distancia mínima entre pares
    let attempts = 0;
    do {
      x2 = padding + Math.random() * (width - padding * 2);
      y2 = topPadding + Math.random() * (height - topPadding - padding);
      attempts++;
    } while (Math.hypot(x2 - x1, y2 - y1) < 120 && attempts < 50);
    
    // Si sigue muy cerca, forzar separación
    if (Math.hypot(x2 - x1, y2 - y1) < 120) {
      const angle = Math.random() * Math.PI * 2;
      x2 = x1 + Math.cos(angle) * 120;
      y2 = y1 + Math.sin(angle) * 120;
      
      // Mantener dentro de límites
      x2 = Math.max(padding, Math.min(width - padding, x2));
      y2 = Math.max(topPadding, Math.min(height - padding, y2));
    }
  }
  
  const now = Date.now();
  
  // Puerto A
  state.ports.push({
    id: pairId * 2,
    pairId: pairId,
    x: x1,
    y: y1,
    emoji: type.emoji,
    color: type.color,
    name: type.name,
    connected: false,
    connectedTo: null,
    spawnTime: now,
    timeLimit: state.portTimeLimit
  });
  
  // Puerto B (pareja)
  state.ports.push({
    id: pairId * 2 + 1,
    pairId: pairId,
    x: x2,
    y: y2,
    emoji: type.emoji,
    color: type.color,
    name: type.name,
    connected: false,
    connectedTo: null,
    spawnTime: now,
    timeLimit: state.portTimeLimit
  });
};

// Game loop
let lastTime = 0;
const gameLoop = (timestamp = 0) => {
  if (state.gameOver) return;
  
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  if (deltaTime > 0 && deltaTime < 0.1) {
    // Verificar tiempo límite de puertos
    const now = Date.now();
    for (let i = state.ports.length - 1; i >= 0; i--) {
      const port = state.ports[i];
      if (!port.connected && (now - port.spawnTime) > port.timeLimit) {
        // ¡PUERTO EXPIRÓ! Game Over inmediato
        endGame();
        return;
      }
    }
  }
  
  draw();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Controla las oleadas sin depender del delta del frame
const tickSpawn = () => {
  if (state.gameOver) return;
  const maxPairs = 6; // límite visual razonable
  const currentPairs = Math.floor(state.ports.filter(p => !p.connected).length / 2);
  if (currentPairs >= maxPairs) return;

  // Por ahora: un solo par por intervalo fijo
  spawnNewPair();
};

// Dibujar
const draw = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  ctx.clearRect(0, 0, width, height);
  
  // Dibujar conexiones
  state.ports.forEach(port => {
    if (port.connected && port.connectedTo) {
      const other = state.ports.find(p => p.id === port.connectedTo);
      if (other && port.id < other.id) { // Dibujar solo una vez
        drawConnection(port, other);
      }
    }
  });
  
  // Dibujar línea de arrastre
  if (state.draggedPort) {
    drawDragLine(state.draggedPort);
  }
  
  // Dibujar puertos
  state.ports.forEach(port => {
    drawPort(port);
  });
  
  // Ya no necesitamos barra de tiempo global
};

// Dibujar puerto
const drawPort = (port) => {
  const size = config.portSize;
  
  ctx.save();
  
  // Sombra más pronunciada si hay puertos encima
  if (!port.connected) {
    const portsAbove = state.ports.filter(p => 
      !p.connected && p !== port && 
      Math.hypot(p.x - port.x, p.y - port.y) < size
    );
    
    if (portsAbove.length > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 6;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
    }
  }
  
  // Círculo de fondo con efecto de profundidad
  if (!port.connected) {
    const portsAbove = state.ports.filter(p => 
      !p.connected && p !== port && 
      Math.hypot(p.x - port.x, p.y - port.y) < size
    );
    
    if (portsAbove.length > 0) {
      // Puerto debajo - más oscuro
      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
    } else {
      // Puerto arriba - normal
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    }
  } else {
    ctx.fillStyle = 'rgba(0, 200, 120, 0.3)';
  }
  
  ctx.beginPath();
  ctx.arc(port.x, port.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Borde con indicador de tiempo
  if (!port.connected) {
    const now = Date.now();
    const timeLeft = port.timeLimit - (now - port.spawnTime);
    const timePercent = Math.max(0, timeLeft / port.timeLimit);
    
    // Color del borde según tiempo restante
    if (timePercent > 0.5) {
      ctx.strokeStyle = port.color;
    } else if (timePercent > 0.25) {
      ctx.strokeStyle = '#ffb74d';
    } else {
      ctx.strokeStyle = '#ff6b6b';
    }
    
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // Barra de tiempo alrededor del puerto
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(port.x, port.y, size / 2 + 10, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = ctx.strokeStyle === '#ff6b6b' ? '#ff6b6b' : 
                     ctx.strokeStyle === '#ffb74d' ? '#ffb74d' : port.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(port.x, port.y, size / 2 + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timePercent);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#00c878';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  
  ctx.shadowColor = 'transparent';
  
  // Emoji
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(port.emoji, port.x, port.y);
  
  ctx.restore();
};

// Dibujar conexión
const drawConnection = (port1, port2) => {
  ctx.save();
  
  ctx.strokeStyle = port1.color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.shadowColor = port1.color;
  ctx.shadowBlur = 15;
  
  ctx.beginPath();
  ctx.moveTo(port1.x, port1.y);
  
  // Curva bezier
  const mx = (port1.x + port2.x) / 2;
  const my = (port1.y + port2.y) / 2;
  const dist = Math.hypot(port2.x - port1.x, port2.y - port1.y);
  const offset = Math.min(dist * 0.3, 100);
  
  ctx.quadraticCurveTo(mx, my - offset, port2.x, port2.y);
  ctx.stroke();
  
  ctx.restore();
};

// Dibujar línea de arrastre
const drawDragLine = (port) => {
  const mouseX = state.dragOffset.x;
  const mouseY = state.dragOffset.y;
  
  ctx.save();
  
  ctx.strokeStyle = port.color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.setLineDash([10, 5]);
  ctx.globalAlpha = 0.7;
  
  ctx.beginPath();
  ctx.moveTo(port.x, port.y);
  ctx.lineTo(mouseX, mouseY);
  ctx.stroke();
  
  ctx.restore();
};

// Ya no necesitamos barra de tiempo global

// Detectar puerto bajo posición (prioridad por orden de aparición)
const getPortAt = (x, y) => {
  const candidates = [];
  
  // Buscar todos los puertos en esa posición
  for (let i = state.ports.length - 1; i >= 0; i--) {
    const port = state.ports[i];
    if (!port.connected) { // Solo puertos no conectados
      const dist = Math.hypot(port.x - x, port.y - y);
      if (dist < config.portSize / 2) {
        candidates.push({ port, dist, index: i });
      }
    }
  }
  
  if (candidates.length === 0) return null;
  
  // Priorizar el puerto que apareció más recientemente (último en el array)
  candidates.sort((a, b) => b.index - a.index);
  return candidates[0].port;
};

// Obtener posición del mouse/touch
const getPointerPos = (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
};

// Eventos de pointer
const onPointerDown = (e) => {
  if (state.gameOver) return;
  e.preventDefault();
  
  const pos = getPointerPos(e);
  const port = getPortAt(pos.x, pos.y);
  
  if (port && !port.connected) {
    state.draggedPort = port;
    state.dragOffset = pos;
    console.log('🚀 Puerto seleccionado:', port.name);
  }
};

const onPointerMove = (e) => {
  if (!state.draggedPort) return;
  e.preventDefault();
  
  const pos = getPointerPos(e);
  state.dragOffset = pos;
};

const onPointerUp = (e) => {
  if (!state.draggedPort) return;
  e.preventDefault();
  
  const pos = getPointerPos(e);
  const targetPort = getPortAt(pos.x, pos.y);
  
  // Verificar si soltó sobre un puerto válido
  if (targetPort && 
      targetPort !== state.draggedPort && 
      !targetPort.connected &&
      targetPort.pairId === state.draggedPort.pairId) {
    
    // ¡CORRECTO!
    const port1 = state.draggedPort;
    const port2 = targetPort;
    
    port1.connected = true;
    port1.connectedTo = port2.id;
    port2.connected = true;
    port2.connectedTo = port1.id;
    
    state.connected++;
    // subir nivel cada N conexiones y aumentar dificultad
    if (state.connected % state.levelStep === 0) {
      state.level++;
      // +1 par por intervalo hasta un tope de 3
      state.batchSize = Math.min(3, state.batchSize + 1);
      // un pelín más rápido el intervalo, con límite
      state.spawnInterval = Math.max(1200, state.spawnInterval - 200);
      if (spawnTimer) {
        clearInterval(spawnTimer);
        spawnTimer = setInterval(tickSpawn, state.spawnInterval);
      }
      // premio: golosina
      addCandies(1);
      celebrateCandyEarned();
      // overlay de nivel (Lottie) si está disponible
      if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
        window.showLevelUpAnimation(state.level);
      }
    }
    
    // Sonido de conexión correcta
    const audioCorrect = new Audio('assets/audio/conectado.mp3');
    audioCorrect.volume = 0.5;
    audioCorrect.play().catch(e => console.log('Audio no disponible'));
    
    vibrate(50);
    // toast(`✅ ${port1.name} conectado!`); // Removido
    
    // Eliminar puertos conectados después de un breve delay
    setTimeout(() => {
      state.ports = state.ports.filter(p => p.id !== port1.id && p.id !== port2.id);
    }, 800);
    
    // Golosina cada 10 conexiones (más difícil)
    if (state.connected % 10 === 0 && state.connected > 0) {
      addCandies(1);
      celebrateCandyEarned();
    }
    
    updateGameHUD();
    
  } else if (targetPort && targetPort !== state.draggedPort) {
    // Incorrecto - vibración y sonido de error
    const audioError = new Audio('assets/audio/errorconectado.mp3');
    audioError.volume = 0.5;
    audioError.play().catch(e => console.log('Audio no disponible'));
    
    vibrate([100, 50, 100]);
    // toast('❌ Tipo incorrecto'); // Removido
  }
  
  state.draggedPort = null;
};

// Ya no necesitamos subir de nivel

// End game
const endGame = () => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  // Sonido de perder
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.connected > bestScore;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.connected);
    saveScoreToServer('informatica', state.connected, { connected: state.connected, candies: getCandies() });
  }
  
  // SIEMPRE guardar el nivel actual en Firestore (no solo si es récord)
  console.log('🔍 Informática - Verificando GameBridge:', {
    gameBridge: !!window.GameBridge,
    updateBestLevel: !!(window.GameBridge && window.GameBridge.updateBestLevel),
    level: state.connected,
    windowKeys: Object.keys(window).filter(k => k.includes('Game') || k.includes('Bridge'))
  });

  // Función para intentar guardar con retry
  const trySaveProgress = (retries = 3) => {
    if (window.GameBridge && window.GameBridge.updateBestLevel) {
      console.log('💾 Informática - Guardando nivel en Firestore:', state.connected);
      try {
        window.GameBridge.updateBestLevel('informatica', state.connected);
        console.log('✅ Informática - updateBestLevel llamado exitosamente');
      } catch (error) {
        console.error('❌ Informática - Error llamando updateBestLevel:', error);
      }
    } else if (retries > 0) {
      console.log(`⏳ Informática - GameBridge no disponible, reintentando en 500ms... (${retries} intentos restantes)`);
      setTimeout(() => trySaveProgress(retries - 1), 500);
    } else {
      console.error('❌ Informática - GameBridge no disponible después de 3 intentos');
      console.log('🔍 Informática - window.GameBridge:', window.GameBridge);
      console.log('🔍 Informática - updateBestLevel method:', window.GameBridge?.updateBestLevel);
    }
  };

  trySaveProgress();
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.8rem 0; font-size: 1.4rem;">😅 Fin del juego</h2>
    <div class="game-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #ff6b9d, #c44569); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">CONEXIONES</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.connected}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.connected, bestScore)}</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, parseInt(localStorage.getItem('aray_best_level_informatica')) || 1)}</div>
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
  const connectedEl = document.getElementById('hud-connected');
  const candiesEl = document.getElementById('hud-candies');
  
  // Mostrar niveles en vez de nodos conectados
  if (connectedEl) connectedEl.textContent = `Nivel ${state.level}`;
  if (candiesEl) candiesEl.textContent = getCandies();
};

window.updateHUD = updateGameHUD;

// ====== Init página ======
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  
  const bestScore = getBest(BEST_KEY);
  
  // Solo actualizar elementos que existen
  const bestLevelEl = document.getElementById('best-level');
  const totalCandiesEl = document.getElementById('total-candies');
  
  if (bestLevelEl) {
    bestLevelEl.textContent = bestScore;
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