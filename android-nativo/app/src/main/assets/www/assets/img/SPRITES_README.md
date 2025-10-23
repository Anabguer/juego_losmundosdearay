# 🎨 Sistema de Sprites

## 📁 Estructura organizada

```
/assets/img/
├─ /personaje/          # Sprites de Aray (niño protagonista)
│   ├─ aray_base.png           ✅ Pose base/idle
│   ├─ aray_run1.png           ✅ Frame 1 de correr
│   ├─ aray_run2.png           ✅ Frame 2 de correr
│   ├─ aray_head_neutral.png   ✅ Expresión neutral
│   ├─ aray_head_happy.png     ✅ Expresión feliz
│   ├─ aray_head_angry.png     ✅ Expresión enfadado
│   └─ aray_head_sleep.png     ✅ Expresión dormido
│
└─ /personaje_mama/     # Sprites de la madre
    ├─ mama_base.png           ✅ Pose base
    ├─ mama_comida.png         ✅ Preparando comida
    ├─ mama_abrigo.png         ✅ Con abrigo
    ├─ mama_tareas.png         ✅ Haciendo tareas
    ├─ mama_bocata.png         ✅ Con bocadillo
    └─ mama_enfadada.png       ✅ Expresión enfadada
```

## 🔧 Uso en JavaScript

### Importar el módulo

```javascript
import { SPRITES, getAraySprite, getMamaSprite, preloadSprites } from './js/sprites.js';
```

### Obtener rutas de sprites

```javascript
// Aray - Sprite base
const arayBase = SPRITES.aray.base;
// → 'assets/img/personaje/aray_base.png'

// Aray - Animación de correr (array)
const arayRun = SPRITES.aray.run;
// → ['assets/img/personaje/aray_run1.png', 'assets/img/personaje/aray_run2.png']

// Aray - Cabezas/expresiones
const arayHappy = SPRITES.aray.head.happy;
// → 'assets/img/personaje/aray_head_happy.png'

// Mamá - Diferentes actividades
const mamaComida = SPRITES.mama.comida;
// → 'assets/img/personaje_mama/mama_comida.png'
```

### Helpers de sprites

```javascript
// Obtener sprite de Aray según estado
const sprite = getAraySprite('happy');  // → ruta del sprite feliz
const sprite = getAraySprite('angry');  // → ruta del sprite enfadado
const sprite = getAraySprite('run');    // → array con frames de correr

// Obtener sprite de Mamá según actividad
const sprite = getMamaSprite('comida');    // → mama preparando comida
const sprite = getMamaSprite('enfadada');  // → mama enfadada
```

### Precargar sprites

```javascript
// Precargar todos los sprites al inicio
preloadSprites().then(() => {
  console.log('✅ Todos los sprites cargados');
  // Iniciar juego...
});
```

### Animar correr

```javascript
const imgElement = document.querySelector('#personaje-img');

// Iniciar animación (8 fps por defecto)
const animationId = animateRun(imgElement);

// Detener animación
clearInterval(animationId);
```

### Crear elemento sprite

```javascript
// Crear sprite de Aray corriendo
const arayImg = createSpriteElement('aray', 'run', {
  className: 'personaje-sprite',
  width: '100px',
  height: '100px',
  id: 'aray-player'
});

document.body.appendChild(arayImg);

// Crear sprite de Mamá cocinando
const mamaImg = createSpriteElement('mama', 'comida', {
  className: 'personaje-mama'
});

document.querySelector('#casa').appendChild(mamaImg);
```

## 🎯 Estados disponibles

### Aray
- `'idle'` o `'base'` → Pose neutral de pie
- `'run'` → Corriendo (2 frames de animación)
- `'happy'` → Feliz 😊
- `'angry'` → Enfadado 😠
- `'sleep'` → Durmiendo 😴
- `'neutral'` → Expresión neutral

### Mamá
- `'idle'` o `'base'` → Pose base
- `'comida'` → Preparando comida 🍳
- `'abrigo'` → Con abrigo 🧥
- `'tareas'` → Haciendo tareas 🧹
- `'bocata'` → Con bocadillo 🥪
- `'enfadada'` → Enfadada 😡

## 📌 Ejemplo completo

```javascript
import { 
  SPRITES, 
  getAraySprite, 
  preloadSprites,
  animateRun 
} from './js/sprites.js';

// Al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  
  // 1. Precargar sprites
  await preloadSprites();
  
  // 2. Mostrar Aray en el mapa
  const aray = document.createElement('img');
  aray.src = SPRITES.aray.base;
  aray.id = 'player';
  document.querySelector('#map-container').appendChild(aray);
  
  // 3. Cuando Aray se mueve
  function onPlayerMove() {
    animateRun(aray, 10); // 10 fps
  }
  
  // 4. Cuando Aray está quieto
  function onPlayerStop() {
    aray.src = SPRITES.aray.base;
  }
  
  // 5. Cambiar expresión según estado
  function updateMood(mood) {
    if (mood === 'happy') {
      aray.src = getAraySprite('happy');
    } else if (mood === 'angry') {
      aray.src = getAraySprite('angry');
    }
  }
});
```

## ✅ Verificación

Puedes verificar que los sprites cargan correctamente abriendo en el navegador:

- http://localhost:8000/assets/img/personaje/aray_base.png
- http://localhost:8000/assets/img/personaje_mama/mama_base.png

Si no se ven, verifica:
1. Que el servidor esté corriendo
2. Que las rutas sean relativas (sin `/` al inicio si es necesario)
3. Limpia la caché del navegador o añade `?v=1.0` al final

## 🎨 Próximos pasos

- [ ] Integrar sprites en el mapa principal
- [ ] Animar movimiento de Aray entre lugares
- [ ] Mostrar mamá en Casa con diferentes actividades
- [ ] Cambiar expresiones según estadísticas (hambre, energía, etc.)
- [ ] Añadir más sprites (papá, abuelos, otros personajes)



