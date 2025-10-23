# 🚀 INICIO RÁPIDO

## ✅ Probar localmente (sin servidor)

Muchos navegadores modernos permiten abrir archivos HTML con módulos ES directamente:

### Opción 1: Servidor local con PHP (recomendado)

```bash
cd pueblito
php -S localhost:8000
```

Luego abre: http://localhost:8000

### Opción 2: Servidor HTTP simple con Python

```bash
cd pueblito
python -m http.server 8000
```

Luego abre: http://localhost:8000

### Opción 3: Extensión Live Server (VS Code)

1. Instala "Live Server" en VS Code
2. Click derecho en `index.php` → "Open with Live Server"

### Opción 4: XAMPP / WAMP (Windows)

1. Copia la carpeta `pueblito` a `htdocs` o `www`
2. Abre: http://localhost/pueblito

---

## 🌐 Subir a Hostalia

### 1. Conectar por FTP

- **Host**: ftp.tu-dominio.com
- **Usuario**: tu_usuario
- **Contraseña**: tu_contraseña
- **Puerto**: 21

### 2. Subir archivos

Arrastra toda la carpeta `pueblito` a `/public_html/`

### 3. Probar

Abre: https://tu-dominio.com/pueblito/

---

## 🎮 Cómo jugar

1. **Mapa**: Navega por el pueblo haciendo click en "Jugar"
2. **Cole** 🏫: Memory infinito - encuentra las parejas
3. **Pabellón** 🏀: Mantén pulsado para cargar, suelta para lanzar
4. **Parque** 🌳: Toca la pantalla para saltar obstáculos

---

## 🐛 Solución rápida de problemas

### ❌ "CORS error" / "Failed to load module"

→ Necesitas un servidor web (PHP, Python, etc.). No funciona abriendo el archivo directamente.

### ❌ Error 500 en Hostalia

→ Renombra `.htaccess` a `.htaccess.bak` temporalmente

### ⚠️ Las imágenes no se ven

→ Normal. Usa placeholders SVG automáticos. Para añadir imágenes reales, sube JPG a `assets/img/`

### 💾 No se guardan los récords

→ Se guardan en localStorage del navegador. Si borras caché, se pierden. Para persistencia en servidor, verifica permisos de escritura en `data/`

---

## 📊 Ver datos guardados

Abre la consola del navegador (F12) y escribe:

```javascript
// Ver monedas
localStorage.getItem('aray_coins')

// Ver récord Cole
localStorage.getItem('aray_best_cole')

// Borrar todo (¡cuidado!)
localStorage.clear()
```

---

## 📱 Probar en móvil

1. Asegúrate que tu ordenador y móvil están en la misma WiFi
2. Averigua tu IP local: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
3. En el móvil abre: `http://TU_IP:8000`

Ejemplo: `http://192.168.1.100:8000`

---

## 🎨 Personalizar colores

Edita `assets/styles.css` líneas 7-11:

```css
--magenta: #ff4fd8;
--malva: #b86cff;
--cian: #27e9ff;
--azul: #2a56ff;
--ink: #0e1320;
```

---

## ✨ ¡Listo para jugar!

El proyecto está **100% funcional** sin necesidad de configuración adicional.

Solo súbelo y disfruta 🎉



