# 🗄️ CONFIGURAR BASE DE DATOS - LOS MUNDOS DE ARAY

## ✅ Archivos Subidos al Servidor

- ✅ **HTML actualizados** (con `<base href="/pueblito/">`)
- ✅ **PHP actualizados** (config.php, guardar_score.php, ranking.php)
- ✅ **Todos los assets** (CSS, JS, imágenes, audio)

---

## 📋 PASO 1: Ejecutar SQL en la Base de Datos

### Acceso a phpMyAdmin:
1. Ve a tu panel de Hostalia
2. Accede a phpMyAdmin
3. Selecciona la base de datos: `9606966_sistema_apps_db`

### Ejecutar el SQL:
1. Abre el archivo: `PARA_HOSTALIA/setup_database.sql`
2. Copia **TODO** el contenido
3. En phpMyAdmin → pestaña **SQL**
4. Pega el contenido
5. Click en **Continuar**

### ¿Qué hace el SQL?
- ✅ Crea tabla `tbl_aplicaciones` (aplicaciones del sistema)
- ✅ Crea tabla `tbl_juegos` (minijuegos de Pueblito)
- ✅ Crea tabla `tbl_scores` (ranking/puntuaciones)
- ✅ Inserta "Los Mundos de Aray" en aplicaciones
- ✅ Inserta los 9 minijuegos:
  - Edificio - Parkour Ninja
  - Pabellón - Space Invaders
  - Río - Salta Troncos
  - Cole - Amigos VS Demonios
  - Parque - Snake
  - Skate Park
  - Tienda - Match 3
  - Informática - Conecta Cables
  - Casa Yayos - Caza Ratas

---

## 📋 PASO 2: Verificar que funciona

### 1. Probar PHP Health Check:
```
https://colisan.com/pueblito/php/health.php
```
**Debe mostrar:**
```json
{
  "ok": true,
  "php": "8.x",
  "server": "...",
  "timestamp": "..."
}
```

### 2. Probar conexión a BD:
```
https://colisan.com/pueblito/php/ranking.php
```
**Debe mostrar:**
```json
{
  "ok": true,
  "tipo": "juegos",
  "total": 9,
  "juegos": [...]
}
```

### 3. Probar el juego:
1. Abre: https://colisan.com/pueblito/
2. Juega cualquier minijuego (ej: Edificio)
3. Al terminar, el score se guardará automáticamente
4. Verifica en: https://colisan.com/pueblito/php/ranking.php?juego=edificio

---

## 🎮 Usar el Ranking desde JavaScript

### Guardar un score:
```javascript
fetch('/pueblito/php/guardar_score.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    juego: 'edificio',          // slug del juego
    puntuacion: 1500,            // puntos conseguidos
    nivel: 5,                    // nivel alcanzado (opcional)
    tiempo: 120,                 // segundos jugados (opcional)
    jugador: 'Aray',             // nombre del jugador (opcional)
    metadata: { /* extra */ }    // datos adicionales (opcional)
  })
})
.then(r => r.json())
.then(data => {
  if (data.ok) {
    console.log('✅ Score guardado:', data.id_score);
  }
})
.catch(err => {
  console.warn('⚠️ Error guardando score, usando localStorage');
});
```

### Obtener ranking de un juego:
```javascript
fetch('/pueblito/php/ranking.php?juego=edificio&limit=10')
  .then(r => r.json())
  .then(data => {
    console.log('🏆 Top 10:', data.ranking);
    // data.ranking = [{jugador, puntuacion, nivel, tiempo, fecha}, ...]
  });
```

### Obtener ranking general:
```javascript
fetch('/pueblito/php/ranking.php?general=1&limit=50')
  .then(r => r.json())
  .then(data => {
    console.log('🏆 Top 50 general:', data.ranking);
    // data.ranking = [{juego, jugador, puntuacion, ...}, ...]
  });
```

### Obtener lista de juegos:
```javascript
fetch('/pueblito/php/ranking.php')
  .then(r => r.json())
  .then(data => {
    console.log('🎮 Juegos:', data.juegos);
    // data.juegos = [{nombre, slug, descripcion, icono, total_scores, mejor_score}, ...]
  });
```

---

## 🔐 Datos de Conexión (ya configurados en config.php)

```php
DB_HOST:     PMYSQL165.dns-servicio.com
DB_USUARIO:  sistema_apps_user
DB_CONTRA:   GestionUploadSistemaApps!
DB_NOMBRE:   9606966_sistema_apps_db
DB_CHARSET:  utf8mb4
DB_PORT:     3306
```

---

## 📂 Estructura de Archivos PHP

```
/pueblito/php/
├── config.php           ← Conexión a BD (PDO)
├── health.php           ← Test: PHP funciona
├── guardar_score.php    ← POST: Guardar puntuación
├── ranking.php          ← GET: Obtener rankings
└── save_score.php       ← (Legacy, mantener por compatibilidad)
```

---

## ✅ URLs de Verificación Final

1. **Juego principal**: https://colisan.com/pueblito/
2. **Health check**: https://colisan.com/pueblito/php/health.php
3. **Lista de juegos**: https://colisan.com/pueblito/php/ranking.php
4. **Ranking edificio**: https://colisan.com/pueblito/php/ranking.php?juego=edificio
5. **Ranking general**: https://colisan.com/pueblito/php/ranking.php?general=1

---

## 🎯 Próximos Pasos (Opcional)

1. **Crear modal de ranking** en el mapa principal
2. **Integrar llamadas PHP** en cada minijuego al finalizar
3. **Mostrar top 10** al abrir cada juego
4. **Añadir sistema de login** (opcional, para múltiples jugadores)

---

¡Todo listo! 🚀


