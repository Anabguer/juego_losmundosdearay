# 📱 INSTRUCCIONES PARA ANDROID STUDIO

## 🔧 **CONFIGURACIÓN INICIAL**

### **1. Verificar Java 17:**
- File → Settings → Build, Execution, Deployment → Build Tools → Gradle
- **Gradle JDK = 17** (Temurin)
- Apply → OK

### **2. Abrir Proyecto:**
- File → Open
- Seleccionar carpeta: `pueblito/android/`
- Wait for Gradle sync to complete

## 🚀 **EJECUTAR APP**

### **Opción 1: Desde Android Studio**
1. **Limpiar proyecto:**
   - Build → Clean Project
   - Wait for completion

2. **Reconstruir:**
   - Build → Rebuild Project
   - Wait for completion

3. **Ejecutar:**
   - Conectar dispositivo Android por USB
   - Habilitar "Depuración USB"
   - Click ▶️ Run 'app'

### **Opción 2: Desde Terminal**
```bash
cd pueblito
npx cap sync android
npx cap run android
```

## 📋 **VERIFICACIONES REQUERIDAS**

### **1. Firebase Console Setup:**
- Ir a: https://console.firebase.google.com/project/intocables13
- Authentication → Sign-in method → Google
- Añadir SHA-1: `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`

### **2. Firestore Rules:**
- Firestore → Rules
- Copiar y pegar reglas de `firestore.rules`

### **3. Probar en App:**
- [ ] Abrir app en Android
- [ ] Pulsar "🔐 Entrar" (esquina superior derecha)
- [ ] Pulsar "Entrar con Google"
- [ ] Completar login
- [ ] Elegir nick único
- [ ] Verificar en Firebase Console

## 📸 **CAPTURAS REQUERIDAS**

### **1. Firebase Authentication:**
- Screenshot: Firebase Console → Authentication → Users
- Mostrar tu email autenticado

### **2. Firestore Users:**
- Screenshot: Firestore → users/{tu_uid}
- Mostrar: candiesTotal=0, nick, createdAt

### **3. Firestore Progress:**
- Screenshot: Firestore → progress/{tu_uid_snake}
- Mostrar: bestLevel > 0

### **4. Ranking en App:**
- Screenshot: App → Modal Ranking
- Mostrar tu usuario con caramelos

## 🧪 **TESTING EN CONSOLA**

Una vez en la app, abrir Chrome DevTools y ejecutar:

```javascript
// Probar sistema completo
await window.testSystem.runAllTests();

// Probar caramelos
await window.testSystem.testCandiesSystem();

// Probar progreso
await window.testSystem.testProgressSystem();

// Ver estado del usuario
window.testSystem.showUserStatus();
```

## 🚨 **SI HAY PROBLEMAS**

### **Build falla:**
- Verificar Gradle JDK = 17
- Build → Clean Project
- Build → Rebuild Project

### **Login no funciona:**
- Verificar SHA-1 en Firebase Console
- Verificar google-services.json en android/app/
- Verificar conexión a internet

### **Datos no se guardan:**
- Verificar reglas de Firestore
- Verificar usuario autenticado
- Verificar conexión a internet

## ✅ **CHECKLIST FINAL**

- [ ] Java 17 configurado en Android Studio
- [ ] Proyecto se abre sin errores
- [ ] Build exitoso
- [ ] App se ejecuta en Android
- [ ] Login Google funciona
- [ ] Usuario se crea en Firebase
- [ ] Nick único funciona
- [ ] Caramelos se suman
- [ ] Niveles se guardan
- [ ] Ranking funciona
- [ ] Capturas enviadas

**¡Sistema listo para producción!** 🎉





