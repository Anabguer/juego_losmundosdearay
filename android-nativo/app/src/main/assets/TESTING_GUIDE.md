# 🧪 GUÍA DE TESTING - Los Mundos de Aray

## 🎯 **PRUEBAS OBLIGATORIAS**

### **1. Login en Dispositivo Real**
```bash
# Ejecutar en dispositivo Android
npx cap run android
```

**Verificar:**
- [ ] Botón "🔐 Entrar" aparece en esquina superior derecha
- [ ] Al hacer clic, aparece modal de login
- [ ] Botón "Entrar con Google" funciona
- [ ] Se abre Google Sign-In nativo
- [ ] Usuario se autentica correctamente
- [ ] Aparece en Firebase Console → Authentication → Users

### **2. Creación de Usuario**
**Verificar en Firebase Console:**
- [ ] Usuario aparece en `users/{uid}` con:
  - `candiesTotal: 0`
  - `createdAt: timestamp`
  - `lastSeen: timestamp`
  - `nick: null` (inicialmente)

### **3. Sistema de Nick Único**
**En el juego:**
- [ ] Al hacer login, aparece prompt para elegir nick
- [ ] Nick se guarda en `users/{uid}.nick`
- [ ] Se crea entrada en `nicks/{lowerNick}`
- [ ] Si nick ya existe, muestra "nick en uso"

### **4. Sistema de Caramelos**
**En consola del navegador:**
```javascript
// Probar sistema de caramelos
await window.testSystem.testCandiesSystem();
```

**Verificar:**
- [ ] Caramelos se suman correctamente
- [ ] Se actualiza `users/{uid}.candiesTotal`
- [ ] Nunca baja (solo aumenta)
- [ ] Se muestra en UI del juego

### **5. Sistema de Progreso**
**En consola del navegador:**
```javascript
// Probar sistema de progreso
await window.testSystem.testProgressSystem();
```

**Verificar:**
- [ ] Niveles se guardan en `progress/{uid_gameId}`
- [ ] Solo aumenta (nunca baja)
- [ ] Se actualiza `bestLevel` correctamente

### **6. Ranking Global**
**En consola del navegador:**
```javascript
// Probar ranking
await window.testSystem.testRankingSystem();
```

**Verificar:**
- [ ] Ranking Top 20 se carga correctamente
- [ ] Ordenado por `candiesTotal` descendente
- [ ] Muestra nick y caramelos
- [ ] Usuario actual aparece en su posición

### **7. Modo Offline**
**Pasos:**
1. Activar modo avión en dispositivo
2. Jugar y sumar caramelos
3. Subir nivel en minijuego
4. Desactivar modo avión
5. Verificar sincronización

**Verificar:**
- [ ] Datos se guardan localmente sin red
- [ ] Al reconectar, se sincronizan automáticamente
- [ ] Caramelos y niveles se actualizan en Firebase

### **8. Pruebas Completas**
**En consola del navegador:**
```javascript
// Ejecutar todas las pruebas
await window.testSystem.runAllTests();

// Ver estado del usuario
window.testSystem.showUserStatus();
```

## 📱 **COMANDOS ÚTILES**

```bash
# Sincronizar cambios
npx cap sync

# Ejecutar en Android
npx cap run android

# Servidor de desarrollo
npm run dev
```

## 🔍 **VERIFICACIONES EN FIREBASE CONSOLE**

### **Authentication:**
- [ ] Usuario aparece en Users
- [ ] SHA-1 configurado correctamente

### **Firestore Database:**
- [ ] Colección `users` con documentos
- [ ] Colección `progress` con documentos
- [ ] Colección `nicks` con documentos
- [ ] Reglas de seguridad aplicadas

### **Reglas de Firestore:**
```javascript
// Copiar y pegar en Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.candiesTotal >= resource.data.candiesTotal;
    }
    
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.uid;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.uid &&
        request.resource.data.bestLevel >= resource.data.bestLevel;
    }
    
    match /nicks/{nickId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.uid;
    }
  }
}
```

## 📊 **DATOS DE CONFIGURACIÓN**

- **SHA-1 Debug:** `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`
- **Package Name:** `com.intocables.losmundosdearay`
- **Project ID:** `intocables13`
- **WEB_CLIENT_ID:** `989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com`

## 🚨 **PROBLEMAS COMUNES**

### **Login no funciona:**
- Verificar SHA-1 en Firebase Console
- Verificar WEB_CLIENT_ID en configuración
- Verificar google-services.json en android/app/

### **Caramelos no se guardan:**
- Verificar reglas de Firestore
- Verificar conexión a internet
- Verificar usuario autenticado

### **Ranking no carga:**
- Verificar reglas de Firestore
- Verificar que hay usuarios en la base de datos
- Verificar conexión a internet

## ✅ **CHECKLIST FINAL**

- [ ] Login funciona en dispositivo real
- [ ] Usuario se crea en Firebase
- [ ] Nick único funciona
- [ ] Caramelos se suman y nunca bajan
- [ ] Niveles se guardan correctamente
- [ ] Ranking Top 20 funciona
- [ ] Modo offline funciona
- [ ] Sincronización funciona
- [ ] Reglas de Firestore aplicadas
- [ ] SHA-1 configurado en Firebase

**¡Sistema 100% funcional!** 🎉


