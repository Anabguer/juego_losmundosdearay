/* ========================================
   👴👵 CASA YAYOS - Caza Ratas
   Dispara a las ratas antes de que lleguen abajo
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, playAudioFile, vibrate, celebrateCandyEarned } from './ui.js';

const BEST_KEY = 'yayos';

// Canvas y contexto
let canvas, ctx, dpr;

// Cargar imágenes de ratas
const ratImages = [];
const RAT_COUNT = 4;

const loadRatImages = () => {
  for (let i = 1; i <= RAT_COUNT; i++) {
    const img = new Image();
    img.src = `img/enemigos/rata${i}.png`;
    ratImages.push(img);
  }
  
  // Cargar imágenes de Aray para rotación (solo las 4 caras principales)
  const arayImagePaths = [
    'img/personaje/aray_head_happy2.png',
    'img/personaje/aray_head_neutral.png',
    'img/personaje/aray_head_angry.png',
    'img/personaje/aray_head_sleep.png'
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
  level: 1,
  rats: [],
  bullets: [],
  gameOver: false,
  gameStarted: false,
  lastRatSpawn: 0,
  spawnInterval: 2500, // Empieza con 2.5 segundos entre ratas
  ratSpeed: 1.5, // Velocidad inicial (horizontal) - más lento
  ratsKilled: 0 // Contador de ratas matadas
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
const initGame = async () => {
  if (!canvas || !ctx) return;
  
  console.log('🎮 Iniciando juego desde nivel 1');
  
  // Limpiar animación de nivel si existe
  if (typeof window !== 'undefined' && typeof window.hideLevelUpAnimation === 'function') {
    window.hideLevelUpAnimation();
  }
  
  state.score = 0;
  state.level = 1; // SIEMPRE empezar en nivel 1
  state.rats = [];
  state.bullets = [];
  state.gameOver = false;
  state.gameStarted = true;
  state.lastRatSpawn = Date.now();
  state.spawnInterval = 2500;
  state.ratSpeed = 1.5;
  state.ratsKilled = 0; // Reiniciar contador de ratas matadas
  
  updateGameHUD();
  gameLoop();
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
  
  // Solo dibujar elementos del juego si está iniciado
  if (!state.gameStarted) {
    return;
  }
  
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
      
      console.log('🐀 ¡Rata llegó a Aray! ¡Juego terminado!');
      
      // Sonido de rata escapando
      playSound('rat_escape');
      
      // Fin del juego al primer fallo
      endGame('🐀 ¡Una rata llegó a Aray! ¡Juego terminado!');
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
        state.ratsKilled++; // Incrementar contador de ratas matadas
        
        vibrate(20);
        playSound('coin');
        
        // Caramelo cada 100 puntos (removido - solo por nivel)
        // if (state.score > 0 && state.score % 100 === 0) {
        //   addCandies(1);
        //   celebrateCandyEarned();
        // }

    // Nivel cada 10 ratas matadas (1 caramelo por nivel)
    const newLevel = Math.max(1, Math.floor(state.ratsKilled / 10) + 1);
    if (newLevel > state.level) {
      const oldLevel = state.level;
      state.level = newLevel;
      
      console.log(`🎉 ¡Subida de nivel! ${oldLevel} → ${newLevel} (Ratas matadas: ${state.ratsKilled})`);
      
      // Acelerar spawns y ratas un poco
      state.spawnInterval = Math.max(800, state.spawnInterval - 150);
      state.ratSpeed += 0.2;
      
      // Solo actualizar récord si superamos el nivel anterior guardado
      updateFirebaseOnLevelUp(state.level);
      
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
const endGame = async (reason = '⏰ ¡Se acabó el tiempo!') => {
  state.gameOver = true;
  
  if (animationId) cancelAnimationFrame(animationId);
  if (typeof timerInterval !== 'undefined' && timerInterval) clearInterval(timerInterval);
  
  // Sonido de perder
  playAudioFile('audio/perder.mp3', 0.8);
  
  vibrate([200, 100, 200]);
  
  // Guardar nivel de forma asíncrona (sin bloquear la UI)
  const bestLevel = await getBest('yayos');
  const isNewRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    await setBest('yayos', state.level);
    saveScoreToServer('yayos', state.level, { level: state.level, score: state.score, candies: getCandies() });
  }
  
  const overlay = document.getElementById('game-overlay');
  if (!overlay) {
    console.log('⚠️ game-overlay no encontrado, creando uno nuevo');
    return;
  }
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
  
  document.getElementById('btn-restart').addEventListener('click', async () => {
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    await initGame();
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

// Init página
document.addEventListener('DOMContentLoaded', async () => {
  initCommonUI();
  loadRatImages();
  initCanvas();
  
  // El juego debe iniciarse automáticamente sin esperar al botón
  // (ya no hay overlay inicial)
  await initGame();
  
  updateHUD();
});

// ====== CREAR OVERLAY DINÁMICAMENTE ======
const createGameOverlay = () => {
  // Crear el overlay del juego
  const overlay = document.createElement('div');
  overlay.id = 'game-overlay';
  overlay.className = 'game-overlay active';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Arial', sans-serif;
  `;
  
  // Crear el contenido del overlay
  const content = document.createElement('div');
  content.className = 'game-overlay-content';
  content.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  
  // Obtener el mejor nivel (usar cache local)
  const bestLevel = 1; // Valor por defecto
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">🐀 Caza Ratas</h2>
    <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">Toca para disparar y no dejes escapar 3 ratas</p>
    <div class="game-stats" style="display: flex; justify-content: center; gap: 1rem; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.8rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL MÁS ALTO</div>
        <div id="best-level" style="font-size: 1.2rem; font-weight: bold; color: white;">${bestLevel}</div>
      </div>
      <div class="ranking-card" style="background: linear-gradient(135deg, #ffd700, #ffb347); padding: 0.8rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3); min-width: 120px; cursor: pointer;" id="btn-ranking">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">🏆 RANKING</div>
        <div style="font-size: 1.2rem; font-weight: bold; color: white;">Ver Top</div>
      </div>
    </div>
    <button id="btn-start" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 1rem;">
      🎮 Jugar
    </button>
    <button id="btn-back" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.9rem; cursor: pointer; margin-top: 0.5rem; margin-left: 0.5rem;">
      ← Volver
    </button>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Agregar event listeners
  document.getElementById('btn-start').addEventListener('click', async () => {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    await initGame();
  });
  
  document.getElementById('btn-back').addEventListener('click', () => {
    overlay.remove();
  });
  
  document.getElementById('btn-ranking').addEventListener('click', async () => {
    // Importar y mostrar modal de ranking
    const { showRankingModal } = await import('./map.js');
    if (showRankingModal) {
      showRankingModal();
    }
  });
  
  return overlay;
};

// ====== CREAR INTERFAZ COMPLETA DEL JUEGO ======
const createGameInterface = () => {
  // Crear el contenedor principal del juego
  const gameContainer = document.createElement('div');
  gameContainer.id = 'yayos-game-container';
  gameContainer.className = 'game-yayos';
  gameContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    background: #1a1a2e; /* Fondo sólido para ocultar completamente el mapa */
    font-family: 'Arial', sans-serif;
  `;
  
  // Crear el header
  const header = document.createElement('header');
  header.className = 'game-header';
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    z-index: 10001;
  `;
  
  // Botón volver al pueblo
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-outline btn-small';
  backBtn.innerHTML = '← Pueblo';
  backBtn.style.cssText = `
    background: transparent;
    color: white;
    border: 1px solid #667eea;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  // HUD chips
  const hudChips = document.createElement('div');
  hudChips.className = 'hud-chips';
  hudChips.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 300px;
  `;
  
  const scoreChip = document.createElement('div');
  scoreChip.className = 'chip';
  scoreChip.innerHTML = `
    <span class="chip-icon">⭐</span>
    <span id="hud-score">Nivel 1</span>
  `;
  scoreChip.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 15px;
    color: white;
    font-size: 12px;
    white-space: nowrap;
  `;
  
  const candiesChip = document.createElement('div');
  candiesChip.className = 'chip';
  candiesChip.innerHTML = `
    <span class="chip-icon">🍬</span>
    <span id="hud-candies">0</span>
  `;
  candiesChip.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 15px;
    color: white;
    font-size: 12px;
    white-space: nowrap;
  `;
  
  hudChips.appendChild(scoreChip);
  hudChips.appendChild(candiesChip);
  
  header.appendChild(backBtn);
  header.appendChild(hudChips);
  
  // Crear el main
  const main = document.createElement('main');
  main.className = 'game-main';
  main.style.cssText = `
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('img/fondos/casayayos.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    z-index: 10000;
  `;
  
  // Crear el canvas wrapper
  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'game-canvas-wrapper';
  canvasWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    background: rgba(0, 0, 0, 0.1); /* Capa sutil para ocultar el mapa de fondo */
  `;
  
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.style.cssText = `
    width: 100%;
    height: 100%;
    display: block;
  `;
  
  canvasWrapper.appendChild(canvas);
  main.appendChild(canvasWrapper);
  
  // Ensamblar todo
  gameContainer.appendChild(header);
  gameContainer.appendChild(main);
  document.body.appendChild(gameContainer);
  
  // Event listeners
      backBtn.addEventListener('click', () => {
        // Restaurar el avatar del pueblo completamente
        const avatar = document.querySelector('.avatar');
        if (avatar) {
          avatar.style.display = 'block';
          avatar.style.visibility = 'visible';
          avatar.style.opacity = '1';
          avatar.style.pointerEvents = 'auto';
          avatar.style.zIndex = 'auto';
          console.log('✅ Avatar del pueblo restaurado al salir del juego');
        }
        gameContainer.remove();
      });
  
  return { gameContainer, canvas, header, main };
};

// ====== EXPORT PARA CARGA DINÁMICA ======
// Función para probar audio
const testAudio = () => {
  try {
    // Usar playAudioFile para respetar las preferencias de audio
    playAudioFile('audio/iniciojuego.mp3', 0.3);
    console.log('🔊 Audio de prueba funcionando');
  } catch (e) {
    console.log('❌ Error en audio de prueba:', e);
  }
};

export const initYayosGame = () => {
  console.log('🎮 Iniciando juego de Yayos...');
  
  // Probar audio al inicio
  testAudio();
  
  // Ocultar el avatar del pueblo de forma más robusta
  const hideMapAvatar = () => {
    const avatar = document.querySelector('.avatar');
    if (avatar) {
      avatar.style.display = 'none';
      avatar.style.visibility = 'hidden';
      avatar.style.opacity = '0';
      avatar.style.pointerEvents = 'none';
      avatar.style.zIndex = '-1';
      console.log('✅ Avatar del pueblo ocultado completamente');
    } else {
      console.log('⚠️ Avatar del pueblo no encontrado');
    }
    
    // También ocultar cualquier elemento con clase avatar
    const allAvatars = document.querySelectorAll('.avatar');
    allAvatars.forEach(av => {
      av.style.display = 'none';
      av.style.visibility = 'hidden';
      av.style.opacity = '0';
      av.style.pointerEvents = 'none';
      av.style.zIndex = '-1';
    });
  };
  
  hideMapAvatar();
  
  // Asegurar que se mantenga oculto
  setTimeout(hideMapAvatar, 100);
  setTimeout(hideMapAvatar, 500);
  
  // Crear la interfaz completa del juego
  const { gameContainer, canvas, header, main } = createGameInterface();
  
  // Inicializar el canvas
  initCanvas();
  
  // Cargar imágenes
  loadRatImages();
  
  // Crear overlay del juego dentro del main
  const overlay = document.createElement('div');
  overlay.id = 'game-overlay';
  overlay.className = 'game-overlay active';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  // Crear el contenido del overlay
  const content = document.createElement('div');
  content.className = 'game-overlay-content';
  content.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  
  // Obtener el récord personal (usar cache local)
  const personalRecord = 0; // Valor por defecto
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">🐀 Caza Ratas</h2>
    <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">Toca para disparar y no dejes escapar 3 ratas</p>
    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: #666;">Cada partida empieza en nivel 1. ¡Supera tu récord!</p>
    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: #ff6b6b;">⚠️ Si 3 ratas llegan a Aray, pierdes</p>
    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: #4ecdc4;">🎯 Cada 10 ratas matadas = 1 nivel + 1 caramelo</p>
    <div class="game-stats" style="display: flex; justify-content: center; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.8rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3); min-width: 120px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">RÉCORD PERSONAL</div>
        <div id="best-level" style="font-size: 1.2rem; font-weight: bold; color: white;">${personalRecord}</div>
      </div>
    </div>
    <button id="btn-start" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 1rem;">
      🎮 Jugar
    </button>
  `;
  
  overlay.appendChild(content);
  main.appendChild(overlay);
  
  // Agregar event listener para el botón de jugar
  document.getElementById('btn-start').addEventListener('click', async () => {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    await initGame();
  });
  
  // Crear y mostrar el overlay del juego
  createGameOverlay();
};

// ========== FUNCIONES DE GUARDADO ==========

// Función para guardar el progreso del nivel al final del juego
const saveLevelProgress = async () => {
  try {
    // Obtener el mejor nivel actual (tanto local como Firebase)
    const bestLevel = await getBest('yayos');
    const isNewLevelRecord = state.level > bestLevel;
    
    console.log(`🎮 Final del juego - Nivel actual: ${state.level}, Mejor nivel: ${bestLevel}`);
    
    if (isNewLevelRecord) {
      console.log(`🎉 ¡Nuevo récord de nivel! ${bestLevel} → ${state.level}`);
      
      // Guardar en Firebase usando GameBridge
      try {
        await setBest('yayos', state.level);
        console.log(`✅ Nivel ${state.level} guardado en Firebase`);
      } catch (error) {
        console.warn('⚠️ Error guardando nivel en Firebase:', error);
      }
      
      // También guardar score para compatibilidad (pero el nivel es lo importante)
      setBest(BEST_KEY, state.level); // Guardar NIVEL, no score
      saveScoreToServer('yayos', state.score, { score: state.score, level: state.level, candies: getCandies() });
    } else {
      console.log(`📊 Nivel sin cambio: ${state.level} ≤ ${bestLevel}`);
    }
  } catch (error) {
    console.error('❌ Error guardando progreso del nivel:', error);
  }
};

// ========== FUNCIONES DE FIREBASE ==========

// Función para actualizar Firebase cuando se sube de nivel (solo si superas el récord)
const updateFirebaseOnLevelUp = async (newLevel) => {
  try {
    // Obtener el récord actual
    const currentRecord = 0;
    
    if (newLevel > currentRecord) {
      console.log(`🏆 ¡NUEVO RÉCORD! ${currentRecord} → ${newLevel}`);
      
      // Actualizar nivel máximo usando setBest (que maneja Firebase y localStorage)
      const success = await setBest('yayos', newLevel);
      
      if (success) {
        console.log(`✅ Firebase: Nuevo récord ${newLevel} guardado exitosamente en Yayos`);
      } else {
        console.warn(`⚠️ Firebase: Error guardando récord ${newLevel}`);
      }
    } else {
      console.log(`📊 Nivel ${newLevel} alcanzado (récord: ${currentRecord}) - No se actualiza`);
    }
  } catch (error) {
    console.error('❌ Firebase: Error actualizando nivel en Yayos:', error);
  }
};

