# 🔥 CONFIGURACIÓN FIREBASE - Los Mundos de Aray

## ✅ **ESTADO ACTUAL**

### **Completado:**
- ✅ Capacitor instalado y configurado
- ✅ Firebase configurado con proyecto `intocables13`
- ✅ Google Auth plugin instalado
- ✅ Sistema de autenticación implementado
- ✅ Sistema de caramelos y ranking implementado
- ✅ Tracking de niveles por minijuego
- ✅ Soporte offline con cola de sincronización
- ✅ UI de login y ranking implementada
- ✅ SHA-1 debug generado: `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`

### **Completado:**
- ✅ WEB_CLIENT_ID configurado: `989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com`
- ✅ google-services.json copiado a android/app/
- ✅ Reglas de Firestore creadas
- ✅ Persistencia offline habilitada
- ✅ Funciones de testing implementadas

### **Pendiente:**
- ❌ Probar en dispositivo Android
- ❌ Configurar reglas en Firebase Console

---

## 🔧 **PASOS PENDIENTES**

### **1. Configurar Firebase Console**

1. **Ir a Firebase Console:** https://console.firebase.google.com/project/intocables13

2. **Añadir SHA-1 a Authentication:**
   - Authentication → Sign-in method → Google
   - Añadir SHA-1: `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`

3. **Client ID web ya configurado:**
   - ✅ `989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com`
   - ✅ Ya actualizado en `capacitor.config.json` y `auth-system.js`

4. **Configurar Firestore:**
   - Firestore Database → Crear base de datos
   - Configurar reglas (ver abajo)

### **2. Reglas de Firestore**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios - solo pueden editar su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Progreso - solo pueden editar su propio progreso
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.uid;
    }
    
    // Nicks - solo lectura para verificar disponibilidad
    match /nicks/{nickId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.uid;
    }
  }
}
```

### **3. Configuración Completada**

✅ **WEB_CLIENT_ID ya configurado:**
- `capacitor.config.json`: `989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com`
- `js/auth-system.js`: `989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com`

---

## 📱 **ESTRUCTURA DE DATOS**

### **Colecciones Firestore:**

#### **users/{uid}**
```javascript
{
  uid: "string",
  email: "string", 
  displayName: "string",
  photoURL: "string",
  nick: "string", // único
  candiesTotal: number, // solo aumenta
  createdAt: timestamp,
  lastSeen: timestamp,
  settings: {
    lastGameId: "string"
  }
}
```

#### **progress/{uid_gameId}**
```javascript
{
  uid: "string",
  gameId: "string", // snake, runner, memory, etc.
  bestLevel: number, // solo aumenta
  updatedAt: timestamp
}
```

#### **nicks/{lowerNick}**
```javascript
{
  uid: "string",
  nick: "string",
  createdAt: timestamp
}
```

---

## 🎮 **MINIJUEGOS Y MÉTRICAS**

| GameId | Nombre | Métrica | Descripción |
|--------|--------|---------|-------------|
| `snake` | Parque - Snake | bestPoints | Puntos totales |
| `runner` | Skate Park | bestDistance | Distancia recorrida |
| `memory` | Cole - Amigos VS Demonios | bestPoints | Puntos totales |
| `spaceinvaders` | Pabellón - Space Invaders | bestLevel | Nivel alcanzado |
| `frogger` | Río - Salta Troncos | bestLevel | Nivel alcanzado |
| `parkour` | Edificio - Parkour Ninja | bestLevel | Nivel alcanzado |
| `match3` | Tienda - Match 3 | bestLevel | Nivel alcanzado |
| `whackamole` | Yayos - Caza Ratas | bestPoints | Puntos totales |
| `cables` | Informática - Conecta Cables | bestPoints | Puntos totales |

---

## 🚀 **COMANDOS ÚTILES**

```bash
# Sincronizar cambios con Android
npx cap sync

# Ejecutar en Android
npx cap run android

# Servidor de desarrollo
npm run dev
```

---

## 🔍 **TESTING**

### **Funciones de Testing Disponibles:**

Abre la consola del navegador y ejecuta:

```javascript
// Ejecutar todas las pruebas
await window.testSystem.runAllTests();

// Probar sistema de caramelos
await window.testSystem.testCandiesSystem();

// Probar sistema de progreso
await window.testSystem.testProgressSystem();

// Probar ranking
await window.testSystem.testRankingSystem();

// Ver estado del usuario
window.testSystem.showUserStatus();
```

### **QA Checklist:**
- [ ] Login Google funciona
- [ ] Usuario se crea en Firestore
- [ ] Nick único funciona
- [ ] Caramelos se suman correctamente
- [ ] Ranking se actualiza
- [ ] Niveles se guardan por minijuego
- [ ] Modo offline funciona
- [ ] Sincronización al reconectar
- [ ] Mismo usuario en diferentes dispositivos

---

## 📞 **SOPORTE**

Si hay problemas:
1. Revisar consola del navegador
2. Revisar Firebase Console logs
3. Verificar SHA-1 en Firebase Console
4. Verificar reglas de Firestore
5. Verificar client ID web

**SHA-1 Debug:** `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`
**Package Name:** `com.intocables.losmundosdearay`
**Project ID:** `intocables13`
