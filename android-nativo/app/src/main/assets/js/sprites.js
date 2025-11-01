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
