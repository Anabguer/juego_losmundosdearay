/* ========================================
   👴👵 CASA YAYOS - Caza Ratas
   Dispara a las ratas antes de que lleguen abajo
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js';

const BEST_KEY = 'aray_best_yayos';

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
};

// Estado del juego
const state = {
  score: 0,
  timeLeft: 90,
  maxTime: 90,
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
  bulletSize: 10
};

// Estado del cursor/diana
let mousePos = { x: 0, y: 0 };

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
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);
  
  // Spawn ratas
  if (now - state.lastRatSpawn > state.spawnInterval) {
    spawnRat();
    state.lastRatSpawn = now;
  }
  
  // Actualizar y dibujar ratas
  for (let i = state.rats.length - 1; i >= 0; i--) {
    const rat = state.rats[i];
    
    // Movimiento horizontal según dirección
    if (rat.direction === 'right') {
      rat.x += state.ratSpeed;
      // Si sale por la derecha = GAME OVER
      if (rat.x > width + config.ratSize) {
        endGame('💥 ¡Una rata escapó!');
        return;
      }
    } else {
      rat.x -= state.ratSpeed;
      // Si sale por la izquierda = GAME OVER
      if (rat.x < -config.ratSize) {
        endGame('💥 ¡Una rata escapó!');
        return;
      }
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
        state.rats.splice(j, 1);
        state.bullets.splice(i, 1);
        state.score += 10;
        
        vibrate(20);
        playSound('coin');
        
        // Caramelo cada 100 puntos
        if (state.score > 0 && state.score % 100 === 0) {
          addCandies(1);
          celebrateCandyEarned();
        }
        
        updateGameHUD();
        break;
      }
    }
    
    drawBullet(bullet);
  }
  
  // Dibujar diana/cursor
  drawCrosshair();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Spawn rata
const spawnRat = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // Alternar entre derecha e izquierda
  const fromLeft = Math.random() > 0.5;
  
  // Posición Y aleatoria (en el área jugable)
  const y = Math.random() * (height - config.ratSize - 100) + 50;
  
  state.rats.push({
    x: fromLeft ? -config.ratSize : width + config.ratSize,
    y: y,
    direction: fromLeft ? 'right' : 'left',
    image: ratImages[Math.floor(Math.random() * ratImages.length)]
  });
};

// Dibujar rata
const drawRat = (rat) => {
  ctx.save();
  
  // Voltear la imagen según la dirección
  if (rat.direction === 'left') {
    ctx.translate(rat.x, rat.y);
    ctx.scale(-1, 1);
    ctx.translate(-rat.x, -rat.y);
  }
  
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
  
  ctx.restore();
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
  
  // Disparo desde abajo hacia donde hiciste click
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  const angle = Math.atan2(y - height, x - width / 2);
  
  state.bullets.push({ 
    x: width / 2, 
    y: height - 20,
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
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.score);
    saveScoreToServer('yayos', state.score, { score: state.score, candies: getCandies() });
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2>${reason}</h2>
    <div class="game-stats">
      <div class="stat-line">
        <span>Puntuación:</span>
        <strong>${state.score}</strong>
      </div>
      <div class="stat-line">
        <span>Mejor puntuación:</span>
        <strong>${Math.max(state.score, bestScore)}</strong>
      </div>
      <div class="stat-line">
        <span>Golosinas ganadas:</span>
        <strong>${Math.floor(state.score / 100)}</strong>
      </div>
    </div>
    ${isNewRecord ? '<p style="font-size: 1.5rem; margin: 1rem 0;">🏆 ¡NUEVO RÉCORD! 🏆</p>' : ''}
    <div style="display: flex; justify-content: center; margin-top: 16px;">
      <button class="btn btn-primary" id="btn-restart">Reintentar</button>
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
  
  if (scoreEl) scoreEl.textContent = state.score;
  if (candiesEl) candiesEl.textContent = getCandies();
};

window.updateHUD = updateGameHUD;

// Init página
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  loadRatImages();
  initCanvas();
  
  const bestScore = getBest(BEST_KEY);
  document.getElementById('best-score').textContent = bestScore;
  document.getElementById('total-candies').textContent = getCandies();
  
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('game-overlay').classList.add('hidden');
    initGame();
  });
  
  updateHUD();
});
