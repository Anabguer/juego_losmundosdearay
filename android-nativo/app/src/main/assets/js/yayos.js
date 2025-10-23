/* ========================================
   👴👵 CASA YAYOS - Caza Ratas
   Dispara a las ratas antes de que lleguen abajo
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_yayos';
const BEST_LEVEL_KEY = 'aray_best_level_yayos';

// Canvas y contexto
let canvas, ctx, dpr;

// Cargar imágenes de ratas
const ratImages = [];
const RAT_COUNT = 4;

const loadRatImages = () => {
  for (let i = 1; i <= RAT_COUNT; i++) {
    const img = new Image();
    img.src = `assets/img/enemigos/rata${i}.png`;
    ratImages.push(img);
  }
  
  // Cargar imágenes de Aray para rotación (solo las 4 caras principales)
  const arayImagePaths = [
    'assets/img/personaje/aray_head_happy2.png',
    'assets/img/personaje/aray_head_neutral.png',
    'assets/img/personaje/aray_head_angry.png',
    'assets/img/personaje/aray_head_sleep.png'
  ];
  
  arayImagePaths.forEach(path => {
    const img = new Image();
    img.src = path;
    arayImages.push(img);
  });
};

// Estado del juego
const state = {
  score: 0,
  timeLeft: 90,
  maxTime: 90,
  level: 1,
  rats: [],
  bullets: [],
  gameOver: false,
  lastRatSpawn: 0,
  spawnInterval: 2500, // Empieza con 2.5 segundos entre ratas
  ratSpeed: 1.5 // Velocidad inicial (horizontal) - más lento
};

// Configuración base
const config = {
  ratSize: 80,
  bulletSpeed: 20,
  bulletSize: 10,
  araySize: 80,
  arayX: 50, // Posición fija abajo a la izquierda
  arayY: 0 // Se calculará dinámicamente
};

// Estado del cursor/diana
let mousePos = { x: 0, y: 0 };

// Imágenes de Aray para rotación
let arayImages = [];
let currentArayImageIndex = 0;
let arayAnimationTimer = 0;

// Sistema de partículas para cuando matas una rata
let particles = [];

// Inicializar canvas
const initCanvas = () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Click para disparar
  canvas.addEventListener('click', shoot);
  
  // Actualizar posición del mouse
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });
};

const resizeCanvas = () => {
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.style.cursor = 'none'; // Ocultar cursor normal
  
  ctx.scale(dpr, dpr);
};

// Inicializar juego
const initGame = () => {
  if (!canvas || !ctx) return;
  
  state.score = 0;
  state.level = 1;
  state.timeLeft = 90;
  state.rats = [];
  state.bullets = [];
  state.gameOver = false;
  state.lastRatSpawn = Date.now();
  state.spawnInterval = 2500;
  state.ratSpeed = 1.5;
  
  updateGameHUD();
  startTimer();
  gameLoop();
};

// Timer
let timerInterval = null;

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (state.gameOver) return;
    
    state.timeLeft -= 0.1;
    
    // Aumentar dificultad progresivamente
    const elapsedTime = 90 - state.timeLeft;
    
    // Cada 15 segundos aumenta la dificultad (más gradual)
    if (Math.floor(elapsedTime / 15) > 0) {
      const difficultyLevel = Math.floor(elapsedTime / 15);
      state.spawnInterval = Math.max(1000, 2500 - difficultyLevel * 250); // Más rápido gradualmente
      state.ratSpeed = 1.5 + difficultyLevel * 0.4; // Más veloces gradualmente
    }
    
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endGame();
    }
  }, 100);
};

// Loop del juego
let animationId;
const gameLoop = () => {
  if (state.gameOver) return;
  
  const now = Date.now();
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Calcular posición Y de Aray (abajo a la izquierda)
  config.arayY = height - config.araySize - 20;
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);
  
  // Dibujar Aray
  drawAray();
  
  // Spawn ratas
  if (now - state.lastRatSpawn > state.spawnInterval) {
    spawnRat();
    state.lastRatSpawn = now;
  }
  
  // Actualizar y dibujar ratas
  for (let i = state.rats.length - 1; i >= 0; i--) {
    const rat = state.rats[i];
    
    // Movimiento hacia Aray
    rat.x += rat.vx;
    rat.y += rat.vy;
    
    // Si la rata llega a Aray, activar efecto de muerte
    const distanceToAray = Math.sqrt(
      Math.pow(rat.x - config.arayX, 2) + 
      Math.pow(rat.y - config.arayY, 2)
    );
    
    if (distanceToAray < (config.ratSize + config.araySize) / 2) {
      // Eliminar la rata que llegó a Aray
      state.rats.splice(i, 1);
      // Terminar el juego inmediatamente
      endGame('🐀 ¡Una rata llegó a Aray!');
      return;
    }
    
    // Si la rata sale de la pantalla por abajo, eliminarla
    if (rat.y > height + config.ratSize) {
      state.rats.splice(i, 1);
      continue;
    }
    
    drawRat(rat);
  }
  
  // Actualizar y dibujar balas
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    
    // Eliminar balas fuera de pantalla
    if (bullet.y < 0 || bullet.y > height || bullet.x < 0 || bullet.x > width) {
      state.bullets.splice(i, 1);
      continue;
    }
    
    // Colisión con ratas
    for (let j = state.rats.length - 1; j >= 0; j--) {
      const rat = state.rats[j];
      const distance = Math.hypot(bullet.x - rat.x, bullet.y - rat.y);
      
      if (distance < config.ratSize / 2) {
        // ¡Impacto!
        // Crear partículas en la posición de la rata
        createKillParticles(rat.x, rat.y);
        
        state.rats.splice(j, 1);
        state.bullets.splice(i, 1);
        state.score += 10;
        
        vibrate(20);
        playSound('coin');
        
        // Caramelo cada 100 puntos (removido - solo por nivel)
        // if (state.score > 0 && state.score % 100 === 0) {
        //   addCandies(1);
        //   celebrateCandyEarned();
        // }

      // Nivel cada 100 puntos (10 ratas)
      const newLevel = Math.max(1, Math.floor(state.score / 100) + 1);
      if (newLevel > state.level) {
        state.level = newLevel;
        // Acelerar spawns y ratas un poco
        state.spawnInterval = Math.max(800, state.spawnInterval - 150);
        state.ratSpeed += 0.2;
        addCandies(1);
        celebrateCandyEarned();
        if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
          window.showLevelUpAnimation(state.level);
        }
      }
        
        updateGameHUD();
        break;
      }
    }
    
    drawBullet(bullet);
  }
  
  // Dibujar partículas
  drawParticles();
  
  // Dibujar diana/cursor
  drawCrosshair();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Spawn rata
const spawnRat = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Aparecer desde arriba, moverse hacia Aray (abajo izquierda)
  const x = Math.random() * (width - config.ratSize);
  const y = -config.ratSize;
  
  // Calcular dirección hacia Aray
  const dx = config.arayX - x;
  const dy = config.arayY - y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  state.rats.push({
    x: x,
    y: y,
    vx: (dx / distance) * state.ratSpeed,
    vy: (dy / distance) * state.ratSpeed,
    image: ratImages[Math.floor(Math.random() * ratImages.length)]
  });
};


// Crear partículas cuando matas una rata
const createKillParticles = (x, y) => {
  // Crear 12 partículas
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const speed = 2 + Math.random() * 3; // Velocidad aleatoria
    
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0, // Vida inicial
      decay: 0.02, // Velocidad de desvanecimiento
      size: 3 + Math.random() * 4, // Tamaño aleatorio
      color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)` // Colores dorados/amarillos
    });
  }
};

// Dibujar Aray
const drawAray = () => {
  
  // Actualizar animación de Aray (más lenta)
  arayAnimationTimer += 0.016; // ~60fps
  if (arayAnimationTimer >= 3.0) { // Cambiar cada 3 segundos
    currentArayImageIndex = (currentArayImageIndex + 1) % arayImages.length;
    arayAnimationTimer = 0;
  }
  
  const currentArayImage = arayImages[currentArayImageIndex];
  
  if (currentArayImage && currentArayImage.complete) {
    // Efecto de movimiento sutil (flotación)
    ctx.save();
    
    // Movimiento de flotación suave
    const floatX = Math.sin(arayAnimationTimer * 4) * 3; // 3px de lado a lado
    const floatY = Math.cos(arayAnimationTimer * 3) * 2; // 2px arriba y abajo
    
    // Sombra suave
    ctx.shadowColor = 'rgba(255, 107, 157, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.drawImage(
      currentArayImage,
      config.arayX - config.araySize / 2 + floatX,
      config.arayY - config.araySize / 2 + floatY,
      config.araySize,
      config.araySize
    );
    
    ctx.restore();
  } else {
    // Fallback si la imagen no carga
    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(config.arayX, config.arayY, config.araySize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Dibujar cara simple
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A', config.arayX, config.arayY + 8);
  }
};


// Dibujar partículas
const drawParticles = () => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    
    // Actualizar partícula
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= particle.decay;
    
    // Eliminar partículas muertas
    if (particle.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Dibujar partícula
    ctx.save();
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
};

// Dibujar rata
const drawRat = (rat) => {
  if (rat.image && rat.image.complete) {
    ctx.drawImage(
      rat.image,
      rat.x - config.ratSize / 2,
      rat.y - config.ratSize / 2,
      config.ratSize,
      config.ratSize
    );
  } else {
    // Fallback si la imagen no carga
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(rat.x, rat.y, config.ratSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐀', rat.x, rat.y);
  }
};

// Dibujar bala
const drawBullet = (bullet) => {
  ctx.fillStyle = '#ffff00';
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, config.bulletSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

// Disparar
const shoot = (e) => {
  if (state.gameOver) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Disparo desde Aray hacia donde hiciste click
  const angle = Math.atan2(y - config.arayY, x - config.arayX);
  
  state.bullets.push({ 
    x: config.arayX, 
    y: config.arayY,
    vx: Math.cos(angle) * config.bulletSpeed,
    vy: Math.sin(angle) * config.bulletSpeed
  });
  
  playSound('click');
  vibrate(10);
};

// Dibujar diana/cursor
const drawCrosshair = () => {
  const x = mousePos.x;
  const y = mousePos.y;
  const size = 30;
  
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  
  // Círculo exterior
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  
  // Círculo interior
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
  
  // Cruz
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
};

// End game
const endGame = (reason = '⏰ ¡Se acabó el tiempo!') => {
  state.gameOver = true;
  
  if (animationId) cancelAnimationFrame(animationId);
  if (timerInterval) clearInterval(timerInterval);
  
  // Sonido de perder
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestScore = getBest(BEST_KEY);
  const isNewRecord = state.score > bestScore;
  const bestLevel = parseInt(localStorage.getItem(BEST_LEVEL_KEY)) || 1;
  const isNewLevelRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.level); // Guardar NIVEL, no score
    saveScoreToServer('yayos', state.score, { score: state.score, candies: getCandies() });
  }
  
  if (isNewLevelRecord) {
    localStorage.setItem(BEST_LEVEL_KEY, state.level.toString());
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${reason}</h2>
    <div class="game-stats" style="display: flex; justify-content: center; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, parseInt(localStorage.getItem('aray_best_level_yayos')) || 1)}</div>
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

// Init página
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  loadRatImages();
  initCanvas();
  
  const bestLevel = getBest(BEST_LEVEL_KEY) || 1;
  const bestLevelEl = document.getElementById('best-level');
  if (bestLevelEl) {
    bestLevelEl.textContent = bestLevel;
  }
  
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('game-overlay').classList.add('hidden');
    initGame();
  });
  
  updateHUD();
});
