# 📱 INSTRUCCIONES PARA PRUEBAS FINALES

## 🚀 **GENERAR APK**

### **Opción 1: Script Automático**
```bash
# Ejecutar el script
generate-apk.bat
```

### **Opción 2: Manual**
```bash
cd pueblito
npx cap sync android
npx cap open android
```

### **En Android Studio:**
1. **Verificar configuración:**
   - File → Settings → Build, Execution, Deployment → Build Tools → Gradle
   - **Gradle JDK = 17** (Temurin)

2. **Limpiar y construir:**
   - Build → Clean Project
   - Build → Rebuild Project

3. **Generar APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK estará en: `android\app\build\outputs\apk\debug\app-debug.apk`

4. **Instalar en dispositivo:**
   - Copiar APK al móvil
   - Instalar desde archivos

## 🔥 **CONFIGURAR FIREBASE CONSOLE**

### **1. Authentication:**
- Ir a: https://console.firebase.google.com/project/intocables13
- Authentication → Sign-in method → Google
- Añadir SHA-1: `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`

### **2. Firestore Rules:**
- Firestore → Rules
- Copiar y pegar reglas de `firestore.rules`

## 🧪 **PRUEBAS EN LA APP**

### **1. Login:**
- [ ] Abrir app
- [ ] Pulsar "🔐 Entrar" (esquina superior derecha)
- [ ] Pulsar "Entrar con Google"
- [ ] Completar login con Google
- [ ] Verificar que aparece modal de nick

### **2. Configurar Nick:**
- [ ] Elegir nick único (ej: "TestUser123")
- [ ] Pulsar "💾 Guardar Nick"
- [ ] Si nick existe, probar con otro
- [ ] Verificar que se guarda correctamente

### **3. Probar Caramelos:**
```javascript
// En consola del navegador (Chrome DevTools)
await window.testSystem.testCandiesSystem();
```
- [ ] Verificar que caramelos se suman
- [ ] Verificar en Firestore → users/{uid}.candiesTotal

### **4. Probar Niveles:**
```javascript
// En consola del navegador
await window.testSystem.testLevelUp('snake', 3);
await window.testSystem.testMinigameComplete();
```
- [ ] Verificar en Firestore → progress/{uid_snake}.bestLevel

### **5. Probar Ranking:**
- [ ] Pulsar "🏆 Ranking" en la app
- [ ] Verificar Top 20 con tu usuario
- [ ] Verificar que muestra nick y caramelos correctos

### **6. Probar Sin Autenticación:**
- [ ] Cerrar sesión
- [ ] Pulsar "🏆 Ranking"
- [ ] Verificar que aparece modal de login

## 📸 **CAPTURAS REQUERIDAS**

### **1. Firebase Authentication:**
- Screenshot: Firebase Console → Authentication → Users
- Mostrar tu email autenticado

### **2. Firestore Users:**
- Screenshot: Firestore → users/{tu_uid}
- Mostrar: candiesTotal, nick, createdAt

### **3. Firestore Progress:**
- Screenshot: Firestore → progress/{tu_uid_snake}
- Mostrar: bestLevel > 0

### **4. Ranking en App:**
- Screenshot: App → Modal Ranking
- Mostrar tu usuario con nick y caramelos

## 🎮 **FUNCIONES DE TESTING DISPONIBLES**

```javascript
// Ejecutar todas las pruebas
await window.testSystem.runAllTests();

// Probar sistema de caramelos
await window.testSystem.testCandiesSystem();

// Probar sistema de progreso
await window.testSystem.testProgressSystem();

// Probar ranking
await window.testSystem.testRankingSystem();

// Probar subida de nivel específica
await window.testSystem.testLevelUp('snake', 5);

// Simular partida completa
await window.testSystem.testMinigameComplete();

// Ver estado del usuario
window.testSystem.showUserStatus();
```

## 🚨 **SI HAY PROBLEMAS**

### **DEVELOPER_ERROR (10):**
- Verificar SHA-1 en Firebase Console
- Verificar package name: `com.intocables.losmundosdearay`
- Verificar google-services.json en android/app/

### **Login no funciona:**
- Verificar conexión a internet
- Verificar WEB_CLIENT_ID en configuración
- Verificar que Google Play Services esté actualizado

### **Datos no se guardan:**
- Verificar reglas de Firestore
- Verificar usuario autenticado
- Verificar conexión a internet

### **APK no se instala:**
- Habilitar "Instalar desde fuentes desconocidas"
- Verificar que el APK no esté corrupto
- Intentar reinstalar

## ✅ **CHECKLIST FINAL**

- [ ] APK generado e instalado
- [ ] Firebase Console configurado
- [ ] Login Google funciona
- [ ] Nick único funciona
- [ ] Caramelos se suman correctamente
- [ ] Niveles se guardan
- [ ] Ranking funciona
- [ ] Modal de login aparece sin autenticación
- [ ] Capturas enviadas

## 📊 **DATOS DE CONFIGURACIÓN**

- **SHA-1 Debug:** `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`
- **Package Name:** `com.intocables.losmundosdearay`
- **Project ID:** `intocables13`
- **WEB_CLIENT_ID:** `989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com`

**¡Sistema listo para producción!** 🎉





