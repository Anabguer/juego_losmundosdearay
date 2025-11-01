/* ========================================
   🎨 SPRITES - Configuración de personajes
   ======================================== */

/**
 * Rutas de todos los sprites de personajes
 * Organizado por personaje y tipo de sprite
 */

export const SPRITES = {
  // 🧒 Aray (niño protagonista)
  aray: {
    base: 'img/personaje/aray_base.webp',
    run: [
      'img/personaje/aray_run1.webp',
      'img/personaje/aray_run2.webp'
    ],
    head: {
      neutral: 'img/personaje/aray_head_neutral.webp?v=2',
      happy: 'img/personaje/aray_head_happy2.webp?v=3',
      angry: 'img/personaje/aray_head_angry.webp?v=2',
      sleep: 'img/personaje/aray_head_sleep.webp?v=2',
    }
  },
  
  // 👩 Mamá
  mama: {
    base: 'assets/img/personaje_mama/mama_base.webp',
    comida: 'assets/img/personaje_mama/mama_comida.webp',
    abrigo: 'assets/img/personaje_mama/mama_abrigo.webp',
    tareas: 'assets/img/personaje_mama/mama_tareas.webp',
    bocata: 'assets/img/personaje_mama/mama_bocata.webp',
    enfadada: 'assets/img/personaje_mama/mama_enfadada.webp',
  }
};

/**
 * Obtener sprite de Aray según estado
 * @param {string} state - Estado: 'idle', 'run', 'happy', 'angry', 'sleep'
 * @returns {string} Ruta del sprite
 */
export const getAraySprite = (state = 'idle') => {
  switch(state) {
    case 'run':
      return SPRITES.aray.run; // Array para animación
    case 'happy':
      return SPRITES.aray.head.happy;
    case 'angry':
      return SPRITES.aray.head.angry;
    case 'sleep':
      return SPRITES.aray.head.sleep;
    case 'neutral':
      return SPRITES.aray.head.neutral;
    default:
      return SPRITES.aray.base;
  }
};

/**
 * Obtener sprite de Mamá según actividad
 * @param {string} activity - Actividad: 'idle', 'comida', 'abrigo', 'tareas', 'bocata', 'enfadada'
 * @returns {string} Ruta del sprite
 */
export const getMamaSprite = (activity = 'idle') => {
  switch(activity) {
    case 'comida':
      return SPRITES.mama.comida;
    case 'abrigo':
      return SPRITES.mama.abrigo;
    case 'tareas':
      return SPRITES.mama.tareas;
    case 'bocata':
      return SPRITES.mama.bocata;
    case 'enfadada':
      return SPRITES.mama.enfadada;
    default:
      return SPRITES.mama.base;
  }
};

/**
 * Precargar sprites (útil para evitar parpadeos)
 * @returns {Promise} Promesa que se resuelve cuando todos los sprites están cargados
 */
export const preloadSprites = () => {
  const imagesToLoad = [];
  
  // Aray
  imagesToLoad.push(SPRITES.aray.base);
  imagesToLoad.push(...SPRITES.aray.run);
  imagesToLoad.push(...Object.values(SPRITES.aray.head));
  
  // Mamá
  imagesToLoad.push(...Object.values(SPRITES.mama));
  
  const promises = imagesToLoad.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => {
        console.warn(`No se pudo cargar sprite: ${src}`);
        resolve(src); // Resolver igualmente para no bloquear
      };
      img.src = src;
    });
  });
  
  return Promise.all(promises);
};

/**
 * Animar sprites de correr (alterna entre run1 y run2)
 * @param {HTMLImageElement} imgElement - Elemento <img> a animar
 * @param {number} fps - Frames por segundo (default: 8)
 * @returns {number} intervalId para poder detener la animación con clearInterval
 */
export const animateRun = (imgElement, fps = 8) => {
  let currentFrame = 0;
  const frames = SPRITES.aray.run;
  
  const intervalId = setInterval(() => {
    currentFrame = (currentFrame + 1) % frames.length;
    imgElement.src = frames[currentFrame];
  }, 1000 / fps);
  
  return intervalId;
};

/**
 * Crear elemento <img> con sprite
 * @param {string} personaje - 'aray' o 'mama'
 * @param {string} state - Estado o actividad
 * @param {object} options - Opciones: { className, width, height, id }
 * @returns {HTMLImageElement}
 */
export const createSpriteElement = (personaje, state = 'idle', options = {}) => {
  const img = document.createElement('img');
  
  if (personaje === 'aray') {
    const sprite = getAraySprite(state);
    img.src = Array.isArray(sprite) ? sprite[0] : sprite;
  } else if (personaje === 'mama') {
    img.src = getMamaSprite(state);
  }
  
  if (options.className) img.className = options.className;
  if (options.width) img.style.width = options.width;
  if (options.height) img.style.height = options.height;
  if (options.id) img.id = options.id;
  
  img.alt = `${personaje} - ${state}`;
  
  return img;
};



