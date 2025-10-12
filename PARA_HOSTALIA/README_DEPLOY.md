# 🚀 DEPLOY PUEBLITO → HOSTALIA

## ✅ Checklist Pre-Deploy

### Archivos Preparados
- ✅ **10 archivos HTML** con `<base href="/sistema_apps_upload/pueblito/">`
  - index.html
  - cole.html
  - edificio.html
  - informatica.html
  - pabellon.html
  - parque.html
  - rio.html
  - skate.html
  - tienda.html
  - yayos.html

- ✅ **Assets completos**
  - 13 archivos de audio (MP3)
  - 88 imágenes (PNG/SVG/JPG)
  - 1 CSS (styles.css)

- ✅ **JavaScript**
  - 13 módulos ES6 (.js)

- ✅ **PHP (opcional)**
  - health.php
  - save_score.php

- ✅ **.htaccess** configurado
  - Compresión gzip
  - Cache headers
  - Bloqueo de archivos sensibles

- ✅ **deploy_pueblito.bat** listo

---

## 🔧 Cómo Hacer el Deploy

### 1. Ejecutar el BAT
```cmd
cd PARA_HOSTALIA
deploy_pueblito.bat
```

### 2. Esperar confirmación
El script mostrará:
- ✅ Deploy OK
- 🌐 URL: https://colisan.com/sistema_apps_upload/pueblito/

### 3. Verificar en el navegador

#### URLs a probar:
1. **Home**: https://colisan.com/sistema_apps_upload/pueblito/
2. **CSS**: https://colisan.com/sistema_apps_upload/pueblito/assets/styles.css
3. **JS**: https://colisan.com/sistema_apps_upload/pueblito/js/map.js
4. **Imagen**: https://colisan.com/sistema_apps_upload/pueblito/assets/img/logo.png
5. **Audio**: https://colisan.com/sistema_apps_upload/pueblito/assets/audio/ganar.mp3

#### Todas deben retornar **HTTP 200 OK**

---

## 🔍 Verificaciones en DevTools

### Network Tab
✅ **DEBE haber:**
- Peticiones a `/sistema_apps_upload/pueblito/assets/...`
- Peticiones a `/sistema_apps_upload/pueblito/js/...`
- Todas con código **200**

❌ **NO debe haber:**
- Peticiones a `/pueblito/pueblito/...` (duplicado)
- Peticiones a `/assets/...` (sin base path)
- Errores **404**
- Errores **CORS**

### Console Tab
✅ Sin errores de rutas
✅ Sin errores de módulos ES6
✅ El juego carga correctamente

---

## 🎮 Funcionalidades a Probar

1. **Mapa principal** carga correctamente
2. **Logo de Aray** visible en el header
3. **Audios** se reproducen al hacer acciones
4. **Navegación** entre juegos funciona
5. **localStorage** guarda progreso
6. **Todos los minijuegos** cargan sus assets

---

## 📊 Estructura Final en Hostalia

```
/sistema_apps_upload/
└─ pueblito/
   ├─ index.html              ← Entrada principal
   ├─ .htaccess               ← Configuración Apache
   ├─ assets/
   │  ├─ styles.css
   │  ├─ audio/              (13 MP3)
   │  └─ img/                (88 imágenes)
   ├─ js/                    (13 módulos)
   ├─ php/                   (2 archivos opcionales)
   └─ data/                  (vacío)
```

---

## 🐛 Troubleshooting

### Si no carga el CSS/JS:
1. Verificar que el `<base href>` esté presente en el HTML
2. Comprobar permisos de archivos (755 para carpetas, 644 para archivos)
3. Revisar logs de Apache en Hostalia

### Si da error 404:
1. Verificar que la ruta remota es `/sistema_apps_upload/pueblito/`
2. No debe haber carpeta duplicada `/sistema_apps_upload/sistema_apps_upload/`

### Si da error CORS:
- No debería pasar (mismo origen)
- Si ocurre, verificar `.htaccess` en el servidor

### Si PHP no funciona:
- El juego funciona sin PHP (usa localStorage)
- Verificar que el servidor tiene PHP habilitado
- Comprobar permisos de escritura en `/data/`

---

## 📝 Notas Importantes

1. **NO subir manualmente** archivos por FTP. Usar siempre el BAT.
2. **NO crear** carpeta `sistema_apps_upload` local extra (ya existe en servidor).
3. **El juego funciona offline** gracias a localStorage.
4. **Las rutas son todas relativas** gracias a `<base href>`.
5. **Los ?v=X en JS** son para romper cache del navegador.

---

## 🎉 ¡Listo!

Una vez ejecutado el deploy y verificadas las URLs, el juego estará 100% funcional en:

**https://colisan.com/sistema_apps_upload/pueblito/**

Disfruta jugando! 🌟


