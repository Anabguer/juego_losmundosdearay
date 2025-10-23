/* ========================================
   🏫 COLE - Amigos VS Demonios
   Toca amigos, evita demonios
   ======================================== */

import { getCandies, addCandies, getBest, setBest, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

const BEST_KEY = 'aray_best_cole';

// Mensajes graciosos para game over
const GAME_OVER_MESSAGES = {
  demonio: [
    '¡Auch! ¡Un demonio! 👹',
    '¡Demonizado! 💀',
    '¡Te pillaron! 😵',
    '¡Ataque demoníaco! ☠️'
  ],
  amigoLost: [
    '¡Perdiste a un amigo! 😢',
    '¡No lo salvaste! 💔',
    '¡Se escapó! 😭',
    '¡Amigo caído! 🥺'
  ]
};

// Canvas y contexto
let canvas, ctx, dpr;

// Estado del juego
const state = {
  score: 0,
  level: 1,
  items: [],
  combo: 0,
  lastComboTime: 0,
  gameOver: false,
  lastItemSpawn: 0,
  speed: 1,
  nextLevelScore: 100 // Puntos para pasar de nivel
};

// Personajes (usar imágenes si existen, sino emojis)
const AMIGOS_IMGS = [
  'assets/img/amigos/amigos1.png',
  'assets/img/amigos/amigos2.png',
  'assets/img/amigos/amigos3.png',
  'assets/img/amigos/amigos4.png',
  'assets/img/amigos/amigos5.png',
  'assets/img/amigos/amigos6.png',
  'assets/img/amigos/amigos7.png', // ARAY - aparece más
  'assets/img/amigos/amigos7.png', // Duplicado para más probabilidad
  'assets/img/amigos/amigos7.png', // Duplicado para más probabilidad
  'assets/img/amigos/amigos7.png'  // Duplicado para más probabilidad (40% de probabilidad)
];

const DEMONIOS = ['👹', '😈', '👺', '💀', '👻'];

// Demonios como imágenes
const DEMONIOS_IMGS = [
  'assets/img/enemigos/zombie1.png',
  'assets/img/enemigos/zombie2.png',
  'assets/img/enemigos/zombie3.png',
  'assets/img/enemigos/zombie4.png'
];

// Precargar imágenes de amigos
const amigosImages = AMIGOS_IMGS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// Precargar imágenes de demonios
const demoniosImages = DEMONIOS_IMGS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// Configuración base
const config = {
  spawnInterval: 1800, // ms entre spawn (MÁS LENTO al inicio)
  fallSpeed: 1.8, // Velocidad de caída (MÁS LENTA)
  itemSize: 90,
  demonioChance: 0.25, // 25% de probabilidad de demonio inicial
  pointsPerLevel: 100 // Puntos necesarios por nivel
};

// Inicializar canvas
const initCanvas = () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
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

// Inicializar juego
const initGame = () => {
  if (!canvas || !ctx) return;
  
  state.score = 0;
  state.level = 1;
  state.lives = state.maxLives;
  state.items = [];
  state.combo = 0;
  state.gameOver = false;
  state.lastItemSpawn = Date.now();
  state.speed = 1;
  state.nextLevelScore = config.pointsPerLevel;
  
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
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);
  
  // Verificar si pasó de nivel
  if (state.score >= state.nextLevelScore) {
    levelUp();
  }
  
  // Velocidad aumenta con el nivel (no con puntos)
  state.speed = 1 + ((state.level - 1) * 0.15); // +15% por nivel
  
  // Spawn items
  if (now - state.lastItemSpawn > config.spawnInterval / state.speed) {
    spawnItem(width, height);
    state.lastItemSpawn = now;
  }
  
  // Actualizar y dibujar items
  updateItems(width, height);
  
  // Reset combo si pasó mucho tiempo
  if (now - state.lastComboTime > 2000) {
    state.combo = 0;
  }
  
  // Actualizar HUD
  updateGameHUD();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Subir de nivel
const levelUp = () => {
  state.level++;
  state.nextLevelScore = state.score + config.pointsPerLevel;
  
  // Sonido de ganar nivel
  const audio = new Audio('assets/audio/ganar.mp3');
  audio.volume = 0.6;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([50, 30, 50]);
  toast(`🎉 ¡NIVEL ${state.level}! 🎉`, 2000);

  // Animación Lottie de Level Up en grande (si está disponible)
  try {
    if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
      window.showLevelUpAnimation(state.level);
    }
  } catch (err) {
    console.log('LevelUp animation no disponible:', err);
  }
  
  // Golosina por subir de nivel
  addCandies(1);
  celebrateCandyEarned();
  updateHUD();
};

// Spawn item
const spawnItem = (width, height) => {
  // Más demonios en niveles altos
  const demonioChance = Math.min(0.5, config.demonioChance + (state.level - 1) * 0.03);
  const isDemonio = Math.random() < demonioChance;
  const x = 50 + Math.random() * (width - 100);
  
  state.items.push({
    x: x,
    y: -60,
    size: config.itemSize,
    emoji: isDemonio 
      ? DEMONIOS[Math.floor(Math.random() * DEMONIOS.length)]
      : null,
    image: isDemonio 
      ? demoniosImages[Math.floor(Math.random() * demoniosImages.length)]
      : amigosImages[Math.floor(Math.random() * amigosImages.length)],
    isDemonio: isDemonio,
    caught: false,
    rotation: 0
  });
};

// Actualizar items
const updateItems = (width, height) => {
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    
    if (item.caught) continue;
    
    // Caer
    item.y += config.fallSpeed * state.speed;
    
    // Dibujar
    ctx.save();
    
    // Brillo para amigos, oscuro para demonios
    if (!item.isDemonio) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#4caf50';
    } else {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f44336';
    }
    
    if (item.image && item.image.complete && item.image.naturalWidth > 0) {
      // Dibujar imagen (amigo o demonio)
      ctx.drawImage(
        item.image,
        item.x - item.size / 2,
        item.y - item.size / 2,
        item.size,
        item.size
      );
    } else {
      // Fallback a emoji
      ctx.font = `${item.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji || (item.isDemonio ? '👹' : '👦'), item.x, item.y);
    }
    
    ctx.restore();
    
    // Eliminar si salió de pantalla abajo
    if (item.y > height + 60) {
      state.items.splice(i, 1);
      
      // Si era un amigo que se cayó → GAME OVER
      if (!item.isDemonio) {
        const msg = GAME_OVER_MESSAGES.amigoLost[Math.floor(Math.random() * GAME_OVER_MESSAGES.amigoLost.length)];
        toast(msg, 2000);
        setTimeout(() => endGame(), 1000);
      }
    }
  }
};

// Ya no hay sistema de vidas - se eliminó

// Click/tap en canvas
const onCanvasClick = (e) => {
  if (state.gameOver) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Verificar si tocó algún item
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    if (item.caught) continue;
    
    const dx = x - item.x;
    const dy = y - item.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < item.size / 2) {
      // ¡Tocado!
      item.caught = true;
      state.items.splice(i, 1);
      
      if (item.isDemonio) {
        // ¡Tocó un demonio! efecto impacto + game over
        zombieHitEffect(item.x, item.y);
        playSound('fail');
        vibrate([300, 100, 300]);
        const msg = GAME_OVER_MESSAGES.demonio[Math.floor(Math.random() * GAME_OVER_MESSAGES.demonio.length)];
        toast(msg, 2000);
        setTimeout(() => endGame(), 1000);
      } else {
        // ¡Tocó un amigo! Gana puntos
        const points = 10 + (state.combo * 5);
        state.score += points;
        state.combo++;
        state.lastComboTime = Date.now();
        
        // Sonido de premio amigos
        const audio = new Audio('assets/audio/premioamigos.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio no disponible'));
        
        // Partículas brillantes al salvar a un amigo
        saveParticlesBurst(item.x, item.y);
        
        // Golosina cada 50 puntos
        if (state.score % 50 === 0) {
          addCandies(1);
          celebrateCandyEarned();
          updateHUD();
        }
        
        playSound('coin');
        vibrate(20);
        
        // Combo visual
        if (state.combo >= 3) {
          toast(`¡Combo x${state.combo}! 🔥`, 1000);
        }
      }
      
      break; // Solo un item por click
    }
  }
};

// Crear partícula de puntos
const createParticle = (x, y, text, color) => {
  const particle = {
    x: x,
    y: y,
    vy: -3,
    text: text,
    color: color,
    alpha: 1,
    time: Date.now()
  };
  
  // Dibujar partícula en el siguiente frame
  const drawParticle = () => {
    const age = Date.now() - particle.time;
    if (age > 1000) return;
    
    particle.y += particle.vy;
    particle.alpha = 1 - (age / 1000);
    
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = particle.color;
    ctx.textAlign = 'center';
    ctx.fillText(particle.text, particle.x, particle.y);
    ctx.restore();
    
    requestAnimationFrame(drawParticle);
  };
  
  drawParticle();
};

// Partículas brillantes al rescatar (no confeti, puntos luminosos)
const saveParticlesBurst = (x, y) => {
  const colors = ['rgba(255,255,255,1)', 'rgba(0,255,255,1)', 'rgba(255,255,150,1)'];
  const particles = Array.from({ length: 25 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 1.5) * 4,
    size: 2 + Math.random() * 3,
    life: 700 + Math.random() * 400,
    born: Date.now(),
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const draw = () => {
    const now = Date.now();
    let alive = false;
    particles.forEach(p => {
      const age = now - p.born;
      if (age < p.life) {
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // leve gravedad
        const alpha = 1 - age / p.life;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = 'lighter';
        // dibujar como círculo suave
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    if (alive) requestAnimationFrame(draw);
  };
  draw();
};

// Golpe de zombie/demonio
const zombieHitEffect = (x, y) => {
  const start = Date.now();
  const dur = 300;
  const draw = () => {
    const t = Date.now() - start;
    if (t > dur) return;
    const p = t / dur;
    const alpha = 0.7 * (1 - p);
    const radius = 80 + 40 * p;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grd.addColorStop(0, 'rgba(255,0,0,0.9)');
    grd.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    requestAnimationFrame(draw);
  };
  draw();
};

// Fin del juego
const endGame = () => {
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  // Sonido de perder
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const bestLevel = getBest(BEST_KEY);
  const isNewRecord = state.level > bestLevel;
  
  if (isNewRecord) {
    setBest(BEST_KEY, state.level);
    saveScoreToServer('cole', state.level, { score: state.score, candies: getCandies() });
  }
  
  const overlay = document.getElementById('game-overlay');
  const content = overlay.querySelector('.game-overlay-content');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.8rem 0; font-size: 1.4rem;">😅 Fin del juego</h2>
    <div class="game-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #ff6b9d, #c44569); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3); min-width: 100px;">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">AMIGOS</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${Math.floor(state.score / 10)}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Puntos: ${state.score}</div>
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
  
  overlay.classList.add('active');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex'; // Forzar visibilidad
  
  document.getElementById('btn-restart').addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    initGame();
  });
};

// Control táctil
const setupControls = () => {
  let isDrawing = false;
  
  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const touch = e.touches[0];
    onCanvasClick({
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  }, { passive: false });
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDrawing = false;
  }, { passive: false });
  
  // Mouse events
  canvas.addEventListener('click', onCanvasClick);
};

// Actualizar HUD
const updateGameHUD = () => {
  document.getElementById('hud-score').textContent = state.score;
  document.getElementById('hud-candies').textContent = getCandies();
};

// Override del updateHUD global
window.updateHUD = updateGameHUD;

// Pausa cuando pierde foco
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !state.gameOver) {
    state.gameOver = true;
    cancelAnimationFrame(animationId);
    toast('⏸️ Juego pausado');
  }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  initCanvas();
  setupControls();
  
  // Mostrar stats iniciales
  const bestLevel = getBest(BEST_KEY);
  document.getElementById('best-score').textContent = bestLevel > 0 ? bestLevel : '1';
  
  // Botón start
  document.getElementById('btn-start').addEventListener('click', () => {
    const overlay = document.getElementById('game-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.display = 'none';
    }
    playSound('click');
    initGame();
  });
});
