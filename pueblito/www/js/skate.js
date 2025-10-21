/* ========================================
   🛹 SKATE PARK - Skate Infinito
   ======================================== */

import { getCandies, addCandies, getBestParque, setBestParque, saveScoreToServer } from './storage.js';
import { initCommonUI, updateHUD, toast, playSound, vibrate, celebrateCandyEarned } from './ui.js?v=3';

// Canvas y contexto
let canvas, ctx, dpr;

// Sprites de Aray corriendo
const runSprites = [
  new Image(),
  new Image()
];
// Solo usar run1 para ambos (más estable)
runSprites[0].src = 'assets/img/personaje/aray_run1.png?v=2';
runSprites[1].src = 'assets/img/personaje/aray_run1.png?v=2';

// Sprites de mamá (obstáculos) - SIN mama_base
const mamaNames = ['enfadada', 'bocata', 'comida', 'abrigo', 'tareas'];
const mamaSprites = [];
mamaNames.forEach(name => {
  const img = new Image();
  img.src = `assets/img/personaje_mama/mama_${name}.png`;
  img.onerror = () => console.warn(`⚠️ No se pudo cargar: mama_${name}.png`);
  img.onload = () => console.log(`✅ Cargada: mama_${name}.png`);
  mamaSprites.push(img);
});

// Estado del juego
const state = {
  distance: 0,
  speed: 200, // MÁS LENTO - velocidad inicial más pausada
  baseSpeed: 200,
  groundX: 0, // Posición del suelo (se mueve como el Dino)
  skyY: 0, // Posición vertical del cielo (paralaje)
  player: null,
  isJumping: false,
  doubleJumpAvailable: false, // Para doble salto
  velocityY: 0, // Velocidad vertical en px/segundo
  impulso: 900, // Fuerza del salto (como Dino)
  gravedad: 2500, // Gravedad en px/segundo² (como Dino)
  obstacles: [],
  coins: [],
  clouds: [], // Nubes decorativas
  stars: [], // Estrellas decorativas
  starsCollected: 0, // Contador de estrellas recogidas
  lastCandyDistance: 0, // Última distancia donde diste golosina
  gameOver: false,
  running: false,
  level: 1,
  lastObstacleSpawn: 0,
  lastCoinSpawn: 0,
  lastCloudSpawn: 0
};

// Configuración
const config = {
  playerSize: 60, // Más grande
  playerX: 60, // Más a la izquierda
  groundY: null, // Se calcula según canvas
  obstacleWidth: 70, // Mama más ancha y visible
  obstacleHeightMin: 90, // Mama grande
  obstacleHeightMax: 110, // Mama más grande que Aray
  obstacleSpawnInterval: 2500, // Tiempo entre obstáculos
  coinSize: 25, // Estrellas más pequeñas
  coinSpawnChance: 0.15 // REDUCIDO - menos estrellas (antes 0.3)
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
  
  // Actualizar groundY (usar valor ajustable)
  config.groundY = height - window.groundYOffset;
  
  // Detectar orientación y ajustar
  const isLandscape = width > height;
  if (isLandscape) {
    // Más espacio horizontal = mejor experiencia
    config.obstacleSpawnInterval = 2500; // Más tiempo entre obstáculos
    toast('📱 Modo horizontal: ¡más espacio para correr!', 2000);
  } else {
    // Vertical normal
    config.obstacleSpawnInterval = 2000;
  }
};

// Inicializar juego
const initGame = () => {
  console.log('🎮 Iniciando Runner...');
  
  if (!canvas || !ctx) {
    console.error('❌ Canvas no disponible');
    return;
  }
  
  // Reset estado
  state.distance = 0;
  state.level = 1;
  state.speed = state.baseSpeed;
  state.isJumping = false;
  state.jumpVelocity = 0;
  state.obstacles = [];
  state.coins = [];
  state.gameOver = false;
  state.running = true; // ¡Activar el juego!
  state.lastObstacleSpawn = Date.now();
  state.lastCoinSpawn = Date.now();
  state.runFrame = 0;
  state.lastFrameTime = 0;
  
  // Asegurar groundY (usar valor ajustable)
  const height = canvas.height / dpr;
  config.groundY = height - window.groundYOffset;
  
  // Crear jugador
  state.player = {
    x: config.playerX,
    y: config.groundY - config.playerSize,
    size: config.playerSize,
    velocityY: 0
  };
  
  console.log('✅ Runner iniciado:', { 
    player: state.player,
    groundY: config.groundY,
    canvasHeight: height
  });
  
  updateGameHUD();
  lastTime = Date.now();
  gameLoop();
};

// Spawn nube decorativa
const spawnCloud = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  state.clouds.push({
    x: width + 50,
    y: 50 + Math.random() * (height / 3), // En la parte superior
    size: 30 + Math.random() * 30,
    speed: 0.3 + Math.random() * 0.3 // Muy lento
  });
};

// Dibujar cielo con decoraciones
const drawSky = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  // NO dibujar fondo - dejar transparente para ver el fondo del body
  // Solo dibujar decoraciones (nubes y estrellas)
  
  // Actualizar y dibujar nubes y mensajes
  for (let i = state.clouds.length - 1; i >= 0; i--) {
    const cloud = state.clouds[i];
    cloud.x -= state.speed * cloud.speed * 0.01; // Muy lentas (paralaje)
    
    if (cloud.isMessage) {
      // Dibujar bocadillo de cómic normal (redondeado con rabito)
      ctx.save();
      
      // Medir texto
      ctx.font = `bold ${cloud.size}px Arial`;
      const textWidth = ctx.measureText(cloud.text).width;
      const padding = 12;
      const bubbleWidth = textWidth + padding * 2;
      const bubbleHeight = cloud.size + padding * 2;
      
      const x = cloud.x;
      const y = cloud.y - bubbleHeight / 2;
      
      // Bocadillo redondeado
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#ff69b4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, bubbleWidth, bubbleHeight, 15);
      ctx.fill();
      ctx.stroke();
      
      // Rabito del bocadillo (pequeño triángulo abajo)
      ctx.beginPath();
      ctx.moveTo(x + 20, y + bubbleHeight);
      ctx.lineTo(x + 15, y + bubbleHeight + 10);
      ctx.lineTo(x + 30, y + bubbleHeight);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Texto en fucsia
      ctx.fillStyle = '#ff69b4';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cloud.text, x + bubbleWidth / 2, y + bubbleHeight / 2);
      ctx.restore();
    } else {
      // Dibujar nube
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = `${cloud.size}px Arial`;
      ctx.fillText('☁️', cloud.x, cloud.y);
    }
    
    // Eliminar si salió
    if (cloud.x < -200) {
      state.clouds.splice(i, 1);
    }
  }
  
  // Estrellas parpadeantes en la parte superior
  if (Math.random() < 0.02) { // 2% cada frame
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`;
    ctx.font = '16px Arial';
    ctx.fillText('✨', Math.random() * width, 20 + Math.random() * 80);
  }
};

// Loop del juego
let lastTime = Date.now();
let animationId;

const gameLoop = () => {
  if (state.gameOver) return;
  
  const now = Date.now();
  const deltaTime = (now - lastTime) / 1000; // Convertir a SEGUNDOS (como Dino)
  lastTime = now;
  
  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  
  // Dibujar cielo decorativo PRIMERO (fondo)
  drawSky();
  
  // Actualizar velocidad progresiva MUY GRADUAL
  const gameVel = 1 + (state.distance / 1000); // Cada 1000m aumenta x1
  state.speed = state.baseSpeed * gameVel;
  
  // Actualizar distancia (en metros)
  state.distance += state.speed * deltaTime / 10;
  
  // Dar golosina cada 100 metros
  const currentMilestone = Math.floor(state.distance / 100);
  const lastMilestone = Math.floor(state.lastCandyDistance / 100);
  if (currentMilestone > lastMilestone) {
    addCandies(1);
    celebrateCandyEarned();
    updateHUD();
    toast(`📏 ${Math.floor(state.distance)}m = 🍬 ¡Golosina!`, 1500);
    state.lastCandyDistance = state.distance;
  }
  
  // Mover suelo (como en el Dino)
  state.groundX += state.speed * deltaTime;
  
  // Mover cielo verticalmente (paralaje sutil)
  state.skyY += deltaTime * 5; // Movimiento muy lento vertical
  
  // Spawn nubes decorativas
  if (now - state.lastCloudSpawn > 800) {
    spawnCloud();
    state.lastCloudSpawn = now;
  }
  
  // Spawn mensajes graciosos de Mama
  if (Math.random() < 0.005) { // Baja probabilidad por frame
    spawnMamaMessage();
  }
  
  // Actualizar jugador (pasar deltaTime)
  updatePlayer(deltaTime);
  
  // Spawn obstáculos (MUY ESPACIADOS AL INICIO)
  const spawnInterval = Math.max(2000, config.obstacleSpawnInterval - state.distance * 0.5);
  if (now - state.lastObstacleSpawn > spawnInterval) {
    spawnObstacle();
    state.lastObstacleSpawn = now;
  }
  
  // Spawn monedas (MÁS FRECUENTES)
  if (now - state.lastCoinSpawn > 1200) { // Cada 1.2 segundos
    if (Math.random() < 0.6) { // 60% de probabilidad
      spawnCoin();
    }
    state.lastCoinSpawn = now;
  }
  
  // Actualizar y dibujar obstáculos
  updateObstacles(deltaTime);
  
  // Actualizar y dibujar monedas
  updateCoins(deltaTime);
  
  // Dibujar suelo
  drawGround();
  
  // Dibujar jugador
  drawPlayer();
  
  // Progresión de nivel por distancia (cada 300m)
  const newLevel = Math.max(1, Math.floor(state.distance / 300) + 1);
  if (newLevel > state.level) {
    state.level = newLevel;
    // subir levemente la velocidad base
    state.baseSpeed += 10;
    state.speed = state.baseSpeed;
    // premio
    addCandies(1);
    celebrateCandyEarned();
    if (typeof window !== 'undefined' && typeof window.showLevelUpAnimation === 'function') {
      window.showLevelUpAnimation(state.level);
    }
  }

  // Dibujar HUD en canvas
  // Actualizar HUD (solo header, no canvas)
  updateGameHUD();
  
  animationId = requestAnimationFrame(gameLoop);
};

// Actualizar jugador (salto) - FÍSICA EXACTA DEL DINO
const updatePlayer = (deltaTime) => {
  // Aplicar gravedad (resta porque va hacia abajo)
  state.velocityY -= state.gravedad * deltaTime;
  
  // Actualizar posición
  state.player.y -= state.velocityY * deltaTime; // Restar porque Y crece hacia abajo
  
  // Tocar suelo
  if (state.player.y >= config.groundY - config.playerSize) {
    state.player.y = config.groundY - config.playerSize;
    state.velocityY = 0;
    state.isJumping = false;
    state.doubleJumpAvailable = false; // Resetear doble salto
  }
};

// Saltar
const jump = () => {
  // VERIFICACIÓN ROBUSTA
  if (!state || !state.player) {
    // Silencioso - no mostrar warning antes de empezar el juego
    return;
  }
  
  if (state.gameOver || !state.running) {
    // No saltar si el juego no está corriendo
    return;
  }
  
  // Salto en el suelo
  if (state.player.y >= config.groundY - config.playerSize) {
    state.isJumping = true;
    state.doubleJumpAvailable = true; // Activar doble salto
    state.velocityY = state.impulso;
    
    const audio = new Audio('assets/audio/salto.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio no disponible'));
    vibrate(10);
  }
  // DOBLE SALTO en el aire
  else if (state.doubleJumpAvailable && state.isJumping) {
    state.velocityY = state.impulso * 0.8; // Segundo salto un poco más débil
    state.doubleJumpAvailable = false; // Solo un doble salto
    
    const audio = new Audio('assets/audio/salto.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio no disponible'));
    vibrate(10);
  }
};

// Spawn obstáculo
const spawnObstacle = () => {
  const width = canvas.width / dpr;
  
  // SIEMPRE usar imagen de Mama
  const mamaImg = mamaSprites[Math.floor(Math.random() * mamaSprites.length)];
  const height = config.obstacleHeightMin + Math.random() * (config.obstacleHeightMax - config.obstacleHeightMin);
  
  // Verificar si la imagen está cargada
  const hasImage = mamaImg && mamaImg.complete && mamaImg.naturalWidth > 0;
  
  console.log('🏃 Spawning Mama:', hasImage ? '✅ Imagen OK' : '⚠️ Usando emoji');
  
  state.obstacles.push({
    x: width + 10,
    y: config.groundY - height + 20, // Bajar Mama 20px para que esté más en el suelo
    width: config.obstacleWidth,
    height: height,
    image: hasImage ? mamaImg : null,
    isImage: hasImage
  });
};

// Actualizar obstáculos
const updateObstacles = (deltaTime) => {
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obs = state.obstacles[i];
    obs.x -= state.speed * deltaTime; // Desplazamiento = velocidad × tiempo (px/s × s = px)
    
    // Dibujar
    if (obs.isImage && obs.image && obs.image.complete && obs.image.naturalWidth > 0) {
      // Dibujar imagen de mamá
      ctx.drawImage(obs.image, obs.x, obs.y, obs.width, obs.height);
    } else {
      // Fallback: emoji de mamá
      ctx.save();
      ctx.font = `${obs.height}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('👩', obs.x + obs.width / 2, obs.y + obs.height);
      ctx.restore();
    }
    
    // Colisión
    if (checkCollision(state.player, obs)) {
      endGame();
    }
    
    // Eliminar si salió de pantalla
    if (obs.x + obs.width < 0) {
      state.obstacles.splice(i, 1);
    }
  }
};

// Spawn moneda
const spawnCoin = () => {
  // Alturas variadas pero TODAS alcanzables
  const random = Math.random();
  let y;
  
  if (random < 0.5) {
    // 50% bajas (salto simple)
    y = config.groundY - config.playerSize - 40 - Math.random() * 60;
  } else if (random < 0.85) {
    // 35% medias (salto simple alto o doble)
    y = config.groundY - config.playerSize - 100 - Math.random() * 80;
  } else {
    // 15% altas (doble salto)
    y = config.groundY - config.playerSize - 180 - Math.random() * 60;
  }
  
  state.coins.push({
    x: canvas.width / dpr,
    y: y,
    size: config.coinSize,
    collected: false
  });
};

// Actualizar monedas
const updateCoins = (deltaTime) => {
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const coin = state.coins[i];
    if (coin.collected) continue;
    
    coin.x -= state.speed * deltaTime;
    
    // Dibujar estrella (golosina) - MÁS SÓLIDA
    ctx.save();
    
    // Sombra para que se vea más sólida
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFD700';
    
    // Estrella con borde
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.font = `bold ${coin.size * 1.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dibujar con stroke para más solidez
    ctx.strokeText('⭐', coin.x, coin.y);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('⭐', coin.x, coin.y);
    
    ctx.restore();
    
    // Colisión con jugador
    const dx = state.player.x + state.player.size / 2 - coin.x;
    const dy = state.player.y + state.player.size / 2 - coin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < (state.player.size / 2 + coin.size / 2)) {
      coin.collected = true;
      state.starsCollected++; // Contar estrella
      
      console.log(`⭐ Estrella ${state.starsCollected} recogida`);
      
      // Sonido de estrella
      const audio = new Audio('assets/audio/estrella.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio no disponible'));
      
      // Dar golosina cada 10 estrellas
      if (state.starsCollected % 10 === 0) {
        console.log(`🍬 ¡Golosina por 10 estrellas! Total: ${state.starsCollected}`);
        addCandies(1);
        celebrateCandyEarned();
        updateHUD();
        toast(`⭐×10 = 🍬 ¡Golosina!`, 1500);
      }
    }
    
    // Eliminar si salió de pantalla
    if (coin.x + coin.size < 0) {
      state.coins.splice(i, 1);
    }
  }
};

// Verificar colisión
const checkCollision = (player, obstacle) => {
  // Margen GENEROSO para hacer el juego más permisivo
  const marginX = 18; // Margen horizontal (puedes rozar bastante)
  const marginY = 15; // Margen vertical (perdón arriba/abajo)
  
  return (
    player.x + marginX < obstacle.x + obstacle.width &&
    player.x + player.size - marginX > obstacle.x &&
    player.y + marginY < obstacle.y + obstacle.height &&
    player.y + player.size - marginY > obstacle.y
  );
};

// Dibujar suelo con efecto de movimiento
const drawGround = () => {
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const groundY = height - 100; // Altura del suelo
  
  ctx.save();
  
  // Dibujar puntitos de tierra en diferentes alturas
  ctx.fillStyle = '#8B4513';
  
  // Fila superior de puntos
  for (let i = 0; i < 15; i++) {
    const x = (state.groundX * 0.8 + i * 60) % width;
    const y = groundY - 50 + Math.sin(state.groundX * 0.01 + i) * 2;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + Math.sin(state.groundX * 0.02 + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Fila media de puntos
  for (let i = 0; i < 12; i++) {
    const x = (state.groundX * 0.6 + i * 80) % width;
    const y = groundY - 30 + Math.sin(state.groundX * 0.015 + i) * 3;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.sin(state.groundX * 0.025 + i) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Fila inferior de puntos (más grandes)
  for (let i = 0; i < 10; i++) {
    const x = (state.groundX * 0.4 + i * 100) % width;
    const y = groundY - 10 + Math.sin(state.groundX * 0.008 + i) * 4;
    ctx.beginPath();
    ctx.arc(x, y, 2.5 + Math.sin(state.groundX * 0.03 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Puntos más pequeños dispersos
  for (let i = 0; i < 20; i++) {
    const x = (state.groundX * 1.2 + i * 40) % width;
    const y = groundY - 60 + Math.random() * 40;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
};

// Dibujar jugador
const drawPlayer = () => {
  ctx.save();
  
  // Alternar frame de animación cada 100ms
  const now = Date.now();
  if (now - state.lastFrameTime > 100) {
    state.runFrame = (state.runFrame + 1) % 2;
    state.lastFrameTime = now;
  }
  
  // Dibujar sprite de correr
  const sprite = runSprites[state.runFrame];
  if (sprite.complete && sprite.naturalWidth > 0) {
    // Si la imagen cargó correctamente - dibujar MÁS GRANDE
    const size = state.player.size * 1.5; // 50% más grande
    ctx.drawImage(
      sprite,
      state.player.x - (size - state.player.size) / 2,
      state.player.y - (size - state.player.size) / 2,
      size,
      size
    );
  } else {
    // Fallback: emoji animado
    const emoji = state.runFrame === 0 ? '🏃' : '🏃‍♂️';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, state.player.x + state.player.size / 2, state.player.y + state.player.size / 2);
  }
  
  ctx.restore();
};

// Dibujar HUD en canvas (QUITADO - ya está en el header)
const drawCanvasHUD = () => {
  // No dibujar nada - el HUD está en el header
};

// Fin del juego
const endGame = () => {
  console.log('💥 GAME OVER - endGame llamado');
  state.gameOver = true;
  cancelAnimationFrame(animationId);
  
  // Sonido de perder
  const audio = new Audio('assets/audio/perder.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio no disponible'));
  
  vibrate([200, 100, 200]);
  
  const finalDistance = Math.floor(state.distance);
  const bestDistance = getBestParque();
  const isNewRecord = finalDistance > bestDistance;
  
  console.log('📊 Distancia:', finalDistance, 'Récord:', bestDistance);
  
  if (isNewRecord) {
    setBestParque(finalDistance);
    saveScoreToServer('parque', finalDistance, { candies: getCandies() });
  }
  
  // Guardar mejor nivel
  const bestLevel = localStorage.getItem('aray_best_level_skate') || 1;
  if (state.level > bestLevel) {
    localStorage.setItem('aray_best_level_skate', state.level);
  }
  
  const overlay = document.getElementById('game-overlay');
  console.log('🔍 Overlay encontrado:', overlay);
  
  if (!overlay) {
    console.error('❌ No se encontró el overlay');
    return;
  }
  
  const content = overlay.querySelector('.game-overlay-content');
  console.log('🔍 Content encontrado:', content);
  
  content.innerHTML = `
    <h2 style="margin: 0 0 0.8rem 0; font-size: 1.4rem;">💥 Chocaste</h2>
    <div class="game-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin: 0.8rem 0;">
      <div class="stat-card" style="background: linear-gradient(135deg, #ff6b9d, #c44569); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">DISTANCIA</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${finalDistance}<span style="color: #ffd700;">m</span></div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(finalDistance, bestDistance)}m</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #4ecdc4, #44a08d); padding: 0.6rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);">
        <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.3rem;">NIVEL</div>
        <div style="font-size: 1.6rem; font-weight: bold; color: white;">${state.level}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">Mejor: ${Math.max(state.level, parseInt(localStorage.getItem('aray_best_level_skate')) || 1)}</div>
      </div>
    </div>
    <div style="display: flex; justify-content: center; margin-top: 0.8rem;">
      <button class="btn btn-primary" id="btn-restart" style="padding: 0.6rem 1.2rem; font-size: 1rem;">Reintentar</button>
    </div>
  `;
  
  // Asegurar que el overlay se muestre
  console.log('👁️ Mostrando overlay...');
  overlay.classList.remove('hidden');
  overlay.classList.add('active');
  overlay.style.visibility = 'visible'; // FORZAR visibilidad
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'all';
  console.log('✅ Overlay mostrado:', overlay.className);
  
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.classList.add('hidden');
    setTimeout(() => {
      initGame();
    }, 100);
  });
  
  // Botón Pueblo eliminado - solo queda Reintentar
};

// Control táctil / teclado
const setupControls = () => {
  // Touch/Click
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
  }, { passive: false });
  
  canvas.addEventListener('click', jump);
  
  // Teclado (espacio/flecha arriba)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  });
};

// Actualizar HUD
const updateGameHUD = () => {
  const distEl = document.getElementById('hud-distance');
  const candiesEl = document.getElementById('hud-candies');
  
  if (distEl) distEl.textContent = `Nivel ${state.level}`;
  if (candiesEl) candiesEl.textContent = getCandies();
  // hud-speed eliminado del HTML
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

// Detectar cambio de orientación
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    resizeCanvas();
    if (!state.gameOver && state.running) {
      toast('🔄 Orientación cambiada', 1500);
    }
  }, 300);
});

// Configuración FINAL de posición vertical de Aray
window.groundYOffset = 250; // Valor óptimo tras ajustes

// Mensajes graciosos de Mama que aparecen por el cielo
const MAMA_MESSAGES = [
  '¡A COMER! 🍽️',
  '¡LOS DEBERES! 📚',
  '¡ABRÍGATE! 🧥',
  '¡VEN AQUÍ! 👋',
  '¡RECOGE TU CUARTO! 🧹',
  '¡APAGA ESO! 📱',
  '¡NO CORRAS! 🚫',
  '¡TEN CUIDADO! ⚠️'
];

let lastMessageTime = 0;

const spawnMamaMessage = () => {
  const now = Date.now();
  if (now - lastMessageTime < 8000) return; // Cada 8 segundos máximo
  
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  
  state.clouds.push({
    x: width + 50,
    y: 80 + Math.random() * 120, // Zona superior-media
    size: 20,
    speed: 0.4,
    isMessage: true,
    text: MAMA_MESSAGES[Math.floor(Math.random() * MAMA_MESSAGES.length)]
  });
  
  lastMessageTime = now;
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Cargado - Skate');
  
  initCommonUI();
  
  console.log('🎨 Canvas inicializando...');
  initCanvas();
  
  console.log('🎮 Controles configurando...');
  setupControls();
  
  // Mostrar stats iniciales
  const bestDist = getBestParque();
  const bestLevel = localStorage.getItem('aray_best_level_skate') || 1;
  
  console.log('📊 Stats:', { bestDist, bestLevel });
  
  // Solo actualizar elementos que existen
  const bestDistanceEl = document.getElementById('best-distance');
  const bestLevelEl = document.getElementById('best-level');
  
  if (bestDistanceEl) {
    bestDistanceEl.textContent = bestDist;
  }
  if (bestLevelEl) {
    bestLevelEl.textContent = bestLevel;
  }
  
  // Botón start
  const btnStart = document.getElementById('btn-start');
  
  if (!btnStart) {
    console.error('❌ No se encontró el botón btn-start');
    return;
  }
  
  console.log('✅ Botón START encontrado');
  
  btnStart.addEventListener('click', (e) => {
    console.log('🎯 CLICK EN START!');
    e.preventDefault();
    e.stopPropagation();
    
    const overlay = document.getElementById('game-overlay');
    if (overlay) {
      console.log('🚫 Ocultando overlay...');
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      overlay.classList.remove('active');
      overlay.classList.add('hidden');
    }
    
    playSound('click');
    
    console.log('🚀 Llamando a initGame AHORA...');
    setTimeout(() => {
      console.log('⏰ InitGame ejecutándose...');
      initGame();
    }, 100);
  }, { capture: true }); // Capture para tener prioridad
  
  console.log('✅ Parque cargado completamente');
});

