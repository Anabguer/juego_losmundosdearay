# 🌟 Los Mundos de Aray

Prototipo de juego web con mapa-pueblo y 3 minijuegos, optimizado para hosting compartido Hostalia.

## 🎮 Minijuegos

- **🏫 Cole**: Memory infinito con dificultad progresiva
- **🏀 Pabellón**: Basket con control "mantener para cargar"
- **🌳 Parque**: Runner lateral infinito con saltos

## 🏗️ Estructura del Proyecto

```
pueblito/
├── index.php              # Mapa-pueblo (landing principal)
├── cole.html              # Minijuego Cole (memory)
├── parque.html            # Minijuego Parque (runner)
├── pabellon.html          # Minijuego Pabellón (basket)
├── .htaccess              # Configuración Apache (cache, compresión)
│
├── assets/
│   ├── styles.css         # Estilos globales con paleta magenta-cian-azul
│   ├── img/               # Imágenes de los lugares (placeholders SVG inline)
│   └── audio/             # (Opcional) Efectos de sonido
│
├── js/
│   ├── storage.js         # Gestión de localStorage (monedas, récords)
│   ├── ui.js              # Utilidades UI (toast, modales, HUD, sonidos)
│   ├── map.js             # Lógica del mapa (navegación, desbloqueos)
│   ├── cole.js            # Lógica del memory infinito
│   ├── pabellon.js        # Lógica del basket
│   └── parque.js          # Lógica del runner
│
├── php/
│   ├── health.php         # Health check (verifica que PHP funciona)
│   └── save_score.php     # Guarda récords en JSON (opcional)
│
└── data/                  # (Se crea automáticamente) Almacén de scores.json
```

## 🚀 Despliegue en Hostalia

### Paso 1: Subir archivos por FTP

1. Conecta a tu hosting Hostalia por FTP (FileZilla, WinSCP, etc.)
2. Crea la carpeta `/public_html/pueblito/` (o el nombre que prefieras)
3. Sube TODO el contenido de este proyecto manteniendo la estructura

### Paso 2: Configurar permisos

```bash
# Si tienes acceso SSH (opcional):
chmod 755 pueblito/php/
chmod 755 pueblito/data/
```

Si no tienes SSH, desde el panel de Hostalia o FTP:
- Carpeta `php/`: permisos 755
- Carpeta `data/`: permisos 755 (se creará automáticamente al guardar récords)

### Paso 3: Verificar funcionamiento

1. **Abre en navegador**: `https://tu-dominio.com/pueblito/`
2. **Verifica PHP**: `https://tu-dominio.com/pueblito/php/health.php`
   - Debe mostrar: `{"ok":true,"php":"8.x.x",...}`
3. **Prueba los juegos**: Navega por el mapa y juega cada minijuego

### Paso 4: Solución de problemas

#### ❌ Error 500 / .htaccess no funciona

Si ves error 500, puede ser que tu hosting no soporte alguna directiva. Puedes comentar líneas en `.htaccess`:

```apache
# Comentar estas líneas si dan error:
# <IfModule mod_deflate.c>
#   ...
# </IfModule>
```

#### ⚠️ No se guardan récords en servidor

Si `save_score.php` no puede escribir (falta permisos), **no pasa nada**: el juego usa `localStorage` y funciona perfectamente sin guardar en servidor. Los récords se mantienen en el navegador del jugador.

Para habilitar guardado en servidor:
```bash
mkdir data
chmod 775 data
```

#### 🖼️ Imágenes no se ven

Las imágenes de los lugares usan placeholders SVG inline (no requieren archivos). Si quieres imágenes reales:

1. Sube tus fotos a `assets/img/`:
   - `casa.jpg`
   - `yayos.jpg`
   - `cole.jpg`
   - `parque.jpg`
   - `pabellon.jpg`
   - `informatica.jpg`
   - `plaza.jpg`
   - `biblioteca.jpg`
   - `piscina.jpg`

2. Las imágenes se cargarán automáticamente (tienen fallback a SVG)

## 💾 Datos y Estado

### localStorage (navegador)

El juego guarda en el navegador del usuario:
- `aray_coins`: Monedas acumuladas
- `aray_energy`: Energía (0-100)
- `aray_best_cole`: Mejor nivel en Cole
- `aray_best_parque`: Mejor distancia en Parque
- `aray_best_pabellon`: Mejor nivel en Pabellón

### Servidor (opcional)

Si tienes permisos de escritura, los récords también se guardan en:
- `data/scores.json`: Historial de puntuaciones (últimas 1000)

## 🎨 Personalización

### Cambiar colores

Edita `assets/styles.css`:

```css
:root {
  --magenta: #ff4fd8;
  --malva: #b86cff;
  --cian: #27e9ff;
  --azul: #2a56ff;
  --ink: #0e1320;
}
```

### Añadir nuevos lugares

Edita `js/map.js` y añade en el array `PLACES`:

```javascript
{
  id: 'nuevo_lugar',
  name: 'Nuevo Lugar',
  icon: '🏰',
  description: 'Descripción del lugar...',
  image: 'assets/img/nuevo_lugar.jpg',
  unlocked: () => getCoins() >= 200, // Condición de desbloqueo
  hasGame: false
}
```

### Ajustar dificultad

Cada minijuego tiene configuración al inicio del archivo JS:

- **Cole** (`js/cole.js`): `LEVEL_GRIDS`, `getTimeForLevel()`
- **Pabellón** (`js/pabellon.js`): `getLevelConfig()`
- **Parque** (`js/parque.js`): `config` object

## 🔧 Requisitos Técnicos

### Servidor
- PHP 7.0+ (para health.php y save_score.php)
- Apache con mod_rewrite (opcional, para .htaccess)
- No requiere base de datos
- No requiere Node.js ni build

### Navegador
- Chrome/Edge/Firefox/Safari modernos (últimas 2 versiones)
- JavaScript ES6+ (módulos ES)
- localStorage habilitado
- Canvas 2D

### Compatibilidad móvil
- Touch events
- 100dvh para altura de viewport
- Responsive design mobile-first
- Sin zoom (user-scalable=no)

## 📱 Optimizaciones

### Rendimiento
- Canvas con `devicePixelRatio` para pantallas HiDPI
- `requestAnimationFrame` para animaciones
- Sin librerías externas (0 KB de dependencias)
- Imágenes placeholder en SVG inline

### Caché
- `.htaccess` configura caché de 7 días para CSS/JS
- 30 días para imágenes
- Compresión gzip/deflate activada

### SEO y PWA (Futuro)
Para convertir en PWA, añadir:
- `manifest.json`
- Service Worker para offline
- Meta tags Open Graph

## 🐛 Debug

### Console del navegador

Abre DevTools (F12) y escribe:

```javascript
// Ver monedas actuales
import('./js/storage.js').then(m => console.log('Monedas:', m.getCoins()))

// Ver récords
import('./js/storage.js').then(m => {
  console.log('Cole:', m.getBestCole())
  console.log('Parque:', m.getBestParque())
  console.log('Pabellón:', m.getBestPabellon())
})

// Resetear todo (cuidado!)
import('./js/storage.js').then(m => m.resetAll())

// Añadir monedas
import('./js/storage.js').then(m => m.addCoins(100))
```

## 📄 Licencia

Este proyecto es un prototipo personal. Puedes modificarlo y adaptarlo según tus necesidades.

## 🎯 Próximos pasos

- [ ] Añadir más minijuegos en Informática, Plaza, Biblioteca, Piscina
- [ ] Sistema de logros/trofeos
- [ ] Música de fondo (opcional, con botón mute)
- [ ] Ranking global con backend real
- [ ] Modo multijugador local
- [ ] Animaciones de transición entre lugares
- [ ] Sistema de misiones/objetivos

## 💬 Soporte

Para problemas con Hostalia específicamente:
1. Revisa el panel de control de Hostalia → Logs de error
2. Verifica que PHP esté habilitado
3. Comprueba permisos de carpetas (755/775)
4. Si .htaccess da problemas, renómbralo temporalmente

**¡Disfruta jugando en Los Mundos de Aray!** 🌟



