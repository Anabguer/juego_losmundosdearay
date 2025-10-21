/* ========================================
   🏀 PABELLÓN - Space Invaders con Tirachinas
   Dispara a los demonios antes de que te alcancen
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_pabellon';
const BEST_LEVEL_KEY = 'aray_best_level_pabellon';

// Canvas y contexto
let canvas, ctx, dpr;
let animationId;

// Cargar imágenes de demonios
const demonImages = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `assets/img/enemigos/zombie${i}.png`;
  demonImages.push(img);
}

// Cargar fondo del pabellón
const bgImage = new Image();
bgImage.src = 'assets/img/fondos/pabellon.png';

// Estado del juego
const state = {
  gameOver: false,
  score: 0,
  demons: [],
  balls: [], // Múltiples pelotas
  particles: [], // Partículas de efectos
  backgroundParticles: [], // Partículas de fondo (chispas de fuego)
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  dragCurrent: { x: 0, y: 0 },
  launchPoint: { x: 0, y: 0 },
  demonSpeed: 0.5,
  demonDirection: 1,
  demonDownSpeed: 15,
  lastDemonMove: 0,
  demonMoveDelay: 800,
  wave: 0
};

// Configuración
const config = {
  ballSize: 35, // Pelota más grande
  demonSize: 50,
  gravity: 0.2, // Menos gravedad para que vuele más
  maxPower: 50 // Mucha más fuerza de la bola
};

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

// Crear partículas de fuego de fondo
const createBackgroundFireParticles = (width, height) => {
  state.backgroundParticles = [];
  
  // Crear múltiples partículas de fuego distribuidas por la pantalla
  for (let i = 0; i < 25; i++) {
    state.backgroundParticles.push({
      x: Math.random() * width,
      y: height + Math.random() * 100, // Empezar desde abajo
      vx: (Math.random() - 0.5) * 2, // Movimiento horizontal suave
      vy: -Math.random() * 3 - 1, // Movimiento hacia arriba
      life: Math.random() * 60 + 40, // Vida variable
      maxLife: Math.random() * 60 + 40,
      size: Math.random() * 4 + 2, // Tamaño variable
      color: `hsl(${Math.random() * 30 + 15}, 100%, ${Math.random() * 30 + 60}%)`, // Colores cálidos
      alpha: Math.random() * 0.8 + 0.2
    });
  }
};

// Actualizar partículas de fondo
const updateBackgroundParticles = (width, height) => {
  for (let i = state.backgroundParticles.length - 1; i >= 0; i--) {
    const particle = state.backgroundParticles[i];
    
    // Actualizar posición
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Añadir un poco de movimiento ondulante
    particle.vx += (Math.random() - 0.5) * 0.1;
    particle.vy += (Math.random() - 0.5) * 0.1;
    
    // Reducir vida
    particle.life--;
    
    // Si la partícula muere o sale de pantalla, crear una nueva
    if (particle.life <= 0 || particle.y < -50 || particle.x < -50 || particle.x > width + 50) {
      state.backgroundParticles[i] = {
        x: Math.random() * width,
        y: height + Math.random() * 50,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        life: Math.random() * 60 + 40,
        maxLife: Math.random() * 60 + 40,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 30 + 15}, 100%, ${Math.random() * 30 + 60}%)`,
        alpha: Math.random() * 0.8 + 0.2
      };
    }
  }
};

// Dibujar partículas de fondo
const drawBackgroundParticles = () => {
  for (const particle of state.backgroundParticles) {
    const alpha = (particle.life / particle.maxLife) * particle.alpha;
    ctx.globalAlpha = alpha;
    
    // Efecto de brillo
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.size * 3;
    
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Efecto de estela
    ctx.globalAlpha = alpha * 0.3;
    ctx.beginPath();
    ctx.arc(particle.x - particle.vx * 2, particle.y - particle.vy * 2, particle.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Resetear efectos
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
};

// Inicializar juego
const initGame = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  state.gameOver = false;
  state.score = 0;
  state.demons = [];
  state.balls = [];
  state.isDragging = false;
  state.demonSpeed = 0.5;
  state.demonDirection = 1;
  state.lastDemonMove = Date.now();
  state.demonMoveDelay = 1000;
  state.wave = 0;
  
  // Crear partículas de fuego de fondo
  createBackgroundFireParticles(width, height);
  
  // Punto de lanzamiento (abajo centro)
  state.launchPoint = {
    x: width / 2,
    y: height - 150
  };
  
  // Crear filas de demonios (empezar con menos)
  const rows = 2; // Solo 2 filas al inicio
  const cols = 4; // Solo 4 columnas
  const spacing = 80;
  const startX = (width - cols * spacing) / 2;
  const startY = 120;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      state.demons.push({
        x: startX + col * spacing,
        y: startY + row * 70,
        size: config.demonSize,
        image: demonImages[Math.floor(Math.random() * demonImages.length)],
        alive: true
      });
    }
  }
  
  updateGameHUD();
  gameLoop();
};

// Game loop
const gameLoop = () => {
  if (state.gameOver) return;
  
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Limpiar
  ctx.clearRect(0, 0, width, height);
  
  // Fondo del pabellón
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else {
    // Fallback: gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Mover formación de demonios con delay (tipo Space Invaders)
  const now = Date.now();
  if (now - state.lastDemonMove > state.demonMoveDelay) {
    let hitEdge = false;
    const moveAmount = 15; // Píxeles por movimiento
    
    state.demons.filter(d => d.alive).forEach(demon => {
      const newX = demon.x + moveAmount * state.demonDirection;
      
      // Verificar límites antes de mover
      if (newX <= 10 || newX + demon.size >= width - 10) {
        hitEdge = true;
      }
    });
    
    // Si van a tocar el borde, cambiar dirección y bajar
    if (hitEdge) {
      state.demonDirection *= -1;
      state.demons.forEach(demon => {
        demon.y += state.demonDownSpeed;
      });
    } else {
      // Mover si no hay borde
      state.demons.forEach(demon => {
        demon.x += moveAmount * state.demonDirection;
      });
    }
    
    state.lastDemonMove = now;
  }
  
  // Actualizar pelotas
  for (let i = state.balls.length - 1; i >= 0; i--) {
    const ball = state.balls[i];
    ball.vy += config.gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Rebotar en los lados
    if (ball.x - config.ballSize / 2 < 0) {
      ball.x = config.ballSize / 2;
      ball.vx *= -0.8; // Rebote con pérdida de energía
      playSound('click');
      vibrate(10);
    } else if (ball.x + config.ballSize / 2 > width) {
      ball.x = width - config.ballSize / 2;
      ball.vx *= -0.8;
      playSound('click');
      vibrate(10);
    }
    
    // Eliminar si sale de pantalla (arriba o abajo)
    if (ball.y < -100 || ball.y > height + 100) {
      state.balls.splice(i, 1);
      continue;
    }
    
    // Colisión con demonios
    for (const demon of state.demons) {
      if (demon.alive &&
          ball.x + config.ballSize / 2 > demon.x &&
          ball.x - config.ballSize / 2 < demon.x + demon.size &&
          ball.y + config.ballSize / 2 > demon.y &&
          ball.y - config.ballSize / 2 < demon.y + demon.size) {
        
        // ¡Impacto!
        demon.alive = false;
        state.balls.splice(i, 1);
        state.score += 10;
        
        // Crear partículas de explosión
        createExplosionParticles(demon.x + demon.size/2, demon.y + demon.size/2);
        
        const audio = new Audio('assets/audio/disparo.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio no disponible'));
        
        vibrate(30);
        updateGameHUD();
        
        // Caramelo cada 100 puntos
        if (state.score > 0 && state.score % 100 === 0) {
          addCandies(1);
          celebrateCandyEarned();
        }
        
        // El nivel sube cuando matas a todos los demonios, no por puntos
        
        break;
      }
    }
  }
  
  // Verificar si todos los demonios fueron eliminados
  const demonsAlive = state.demons.filter(d => d.alive).length;
  if (demonsAlive === 0) {
    // Nueva oleada
    spawnNewWave(width);
  }
  
  // Verificar si los demonios llegaron abajo (GAME OVER)
  for (const demon of state.demons) {
    if (demon.alive && demon.y + demon.size > height - 200) {
      endGame('👿 ¡Los demonios te alcanzaron!');
      return;
    }
  }
  
  // HUD en canvas
  drawHUD(width, demonsAlive);
  
  // Dibujar demonios
  state.demons.forEach(demon => {
    if (demon.alive) {
      drawDemon(demon);
    }
  });
  
  // Actualizar partículas de fondo
  updateBackgroundParticles(width, height);
  
  // Actualizar partículas de efectos
  updateParticles();
  
  // Dibujar partículas de fuego de fondo (detrás de todo)
  drawBackgroundParticles();
  
  // Dibujar pelotas
  state.balls.forEach(ball => {
    drawBall(ball.x, ball.y);
  });
  
  // Dibujar tirachinas
  if (state.isDragging) {
    drawSlingshot();
  } else {
    drawLauncher();
  }
  
  // Dibujar partículas de efectos (encima de todo)
  drawParticles();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Nueva oleada (progresiva)
const spawnNewWave = (width) => {
  // Mostrar animación de nivel ANTES de incrementar
  if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
    window.showLevelUpAnimation(state.wave + 2); // wave + 2 porque wave + 1 es el nivel actual
  }
  
  state.wave++;
  
  // Aumentar filas y columnas progresivamente
  const rows = Math.min(2 + Math.floor(state.wave / 2), 4); // Máximo 4 filas
  const cols = Math.min(4 + Math.floor(state.wave / 3), 6); // Máximo 6 columnas
  const spacing = 80;
  const startX = (width - cols * spacing) / 2;
  const startY = 120;
  
  state.demons = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      state.demons.push({
        x: startX + col * spacing,
        y: startY + row * 70,
        size: config.demonSize,
        image: demonImages[Math.floor(Math.random() * demonImages.length)],
        alive: true
      });
    }
  }
  
  // Reducir delay (más rápido) progresivamente
  state.demonMoveDelay = Math.max(400, state.demonMoveDelay - 80);
  
  // Solo sonido y vibración (sin popup feo)
  const audio = new Audio('assets/audio/ganar.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([100, 50, 100, 50, 100]);
  
  updateGameHUD();
};

// Crear partículas de explosión
const createExplosionParticles = (x, y) => {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      maxLife: 30,
      size: Math.random() * 6 + 3,
      color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)` // Colores cálidos
    });
  }
};

// Dibujar demonio transparente
const drawDemon = (demon) => {
  // Dibujar demonio directamente sin fondo rojo
  if (demon.image && demon.image.complete && demon.image.naturalWidth > 0) {
    // Dibujar imagen del demonio sin efectos de fondo
    ctx.drawImage(
      demon.image,
      demon.x,
      demon.y,
      demon.size,
      demon.size
    );
  } else {
    // Fallback sin fondo rojo - solo emoji
    ctx.font = `${demon.size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👿', demon.x + demon.size / 2, demon.y + demon.size / 2);
  }
};

// Actualizar partículas
const updateParticles = () => {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const particle = state.particles[i];
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.98; // Fricción
    particle.vy *= 0.98;
    particle.life--;
    
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
};

// Dibujar partículas
const drawParticles = () => {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const particle = state.particles[i];
    
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    
    // Efecto de brillo en partículas
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.size * 2;
    
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Efecto de estela
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x - particle.vx * 2, particle.y - particle.vy * 2, particle.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
  
  // Resetear efectos
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
};

// Dibujar pelota
const drawBall = (x, y) => {
  const radius = config.ballSize / 2;
  
  // Pelota naranja
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Líneas negras de basket (rayas curvas)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  
  // Contorno
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Línea horizontal
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.lineTo(x + radius, y);
  ctx.stroke();
  
  // Líneas curvas verticales
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2, false);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(x, y, radius, Math.PI / 2, Math.PI * 1.5, false);
  ctx.stroke();
};

// Dibujar lanzador
const drawLauncher = () => {
  const x = state.launchPoint.x;
  const y = state.launchPoint.y;
  
  // Base del tirachinas (Y de madera)
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  
  // Brazo izquierdo
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 25, y - 50);
  ctx.stroke();
  
  // Brazo derecho
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 25, y - 50);
  ctx.stroke();
  
  // Banda elástica en reposo
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 25, y - 50);
  ctx.lineTo(x, y - 30);
  ctx.lineTo(x + 25, y - 50);
  ctx.stroke();
  
  // Pelota en reposo
  drawBall(x, y - 30);
};

// Dibujar tirachinas tensado
const drawSlingshot = () => {
  const x = state.launchPoint.x;
  const y = state.launchPoint.y;
  
  // Y de madera
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 25, y - 50);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 25, y - 50);
  ctx.stroke();
  
  // Banda elástica tensada
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 25, y - 50);
  ctx.lineTo(state.dragCurrent.x, state.dragCurrent.y);
  ctx.lineTo(x + 25, y - 50);
  ctx.stroke();
  
  // Pelota en posición arrastrada
  drawBall(state.dragCurrent.x, state.dragCurrent.y);
  
  // Flecha de dirección y potencia
  const dx = state.dragCurrent.x - x;
  const dy = state.dragCurrent.y - y;
  const distance = Math.min(Math.hypot(dx, dy), 150);
  
  if (distance > 10) {
    const angle = Math.atan2(dy, dx);
    const arrowLength = distance * 0.5;
    const arrowX = state.dragCurrent.x - Math.cos(angle) * arrowLength;
    const arrowY = state.dragCurrent.y - Math.sin(angle) * arrowLength;
    
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(state.dragCurrent.x, state.dragCurrent.y);
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();
  }
};

// Dibujar HUD (vacío, todo está en el header)
const drawHUD = (width, demonsAlive) => {
  // Nada - todo en el header HTML
};

// Controles
const setupControls = () => {
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Verificar si está cerca del tirachinas
    const dist = Math.hypot(x - state.launchPoint.x, y - state.launchPoint.y);
    if (dist < 100) {
      state.isDragging = true;
      state.dragStart = { x, y };
      state.dragCurrent = { x, y };
    }
    
    e.preventDefault();
  });
  
  canvas.addEventListener('pointermove', (e) => {
    if (!state.isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    state.dragCurrent = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    e.preventDefault();
  });
  
  canvas.addEventListener('pointerup', (e) => {
    if (!state.isDragging) return;
    
    // Calcular velocidad de lanzamiento
    const dx = state.launchPoint.x - state.dragCurrent.x;
    const dy = state.launchPoint.y - state.dragCurrent.y;
    
    const power = Math.min(Math.hypot(dx, dy) / 4, config.maxPower); // Mucho más sensible al arrastre
    const angle = Math.atan2(dy, dx);
    
    // Lanzar pelota con más fuerza
    state.balls.push({
      x: state.launchPoint.x,
      y: state.launchPoint.y - 30,
      vx: Math.cos(angle) * power * 1.5, // Multiplicador de velocidad horizontal
      vy: Math.sin(angle) * power * 1.5  // Multiplicador de velocidad vertical
    });
    
    state.isDragging = false;
    
    playSound('click');
    vibrate(20);
    
    e.preventDefault();
  });
  
  canvas.addEventListener('pointercancel', () => {
    state.isDragging = false;
  });
};

// End game
const endGame = (reason = '👿 ¡Los demonios te alcanzaron!') => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.score > bestScore;
  const bestLevel = getBest(BEST_LEVEL_KEY) || 1;
  const isNewLevelRecord = (state.wave + 1) > bestLevel;
  
  // El nivel se basa en las waves completadas, no en puntos
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.score);
    saveScoreToServer('pabellon', state.score, { score: state.score, candies: getCandies() });
  }
  
  if (isNewLevelRecord) {
    localStorage.setItem(BEST_LEVEL_KEY, (state.wave + 1).toString());
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${reason}</h2>
    <div class="game-stats" style="display: flex; justify-content: center; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.wave + 1}</div>
        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.wave + 1, parseInt(localStorage.getItem('aray_best_level_pabellon')) || 1)}</div>
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
  
  if (scoreEl) scoreEl.textContent = `Nivel ${state.wave + 1}`;
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
