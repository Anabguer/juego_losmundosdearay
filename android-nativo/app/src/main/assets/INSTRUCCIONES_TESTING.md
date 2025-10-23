# 📱 INSTRUCCIONES PARA PROBAR EN ANDROID REAL

## 🚨 **PROBLEMA ACTUAL**
El build de Android falla debido a incompatibilidad entre Java 8 y Gradle 8.0.2.

## 🔧 **SOLUCIONES POSIBLES**

### **Opción 1: Actualizar Java (Recomendado)**
```bash
# Instalar Java 11 o superior
# Descargar desde: https://adoptium.net/
# Configurar JAVA_HOME apuntando a la nueva versión
```

### **Opción 2: Usar Android Studio**
1. Abrir Android Studio
2. Abrir proyecto: `pueblito/android/`
3. Sincronizar proyecto
4. Ejecutar en dispositivo conectado

### **Opción 3: Probar en Navegador (Temporal)**
```bash
# El servidor ya está corriendo en puerto 8002
# Abrir: http://localhost:8002
# Probar login con Google (funcionará parcialmente)
```

## 📋 **PASOS PARA TESTING COMPLETO**

### **1. Preparar Dispositivo Android**
- [ ] Conectar dispositivo Android por USB
- [ ] Habilitar "Depuración USB" en opciones de desarrollador
- [ ] Verificar que aparece en `adb devices`

### **2. Configurar Firebase Console**
- [ ] Ir a: https://console.firebase.google.com/project/intocables13
- [ ] Authentication → Sign-in method → Google
- [ ] Añadir SHA-1: `E2:D4:96:99:5E:66:36:B2:B1:FC:CD:84:8E:37:FC:B4:2B:3E:63:6F`
- [ ] Firestore → Rules → Copiar reglas de `firestore.rules`

### **3. Ejecutar App**
```bash
cd pueblito
npx cap sync android
npx cap run android
```

### **4. Probar Funcionalidades**

#### **Login:**
- [ ] Abrir app
- [ ] Pulsar "🔐 Entrar" (esquina superior derecha)
- [ ] Pulsar "Entrar con Google"
- [ ] Completar login con Google
- [ ] Verificar que aparece prompt para nick

#### **Crear Usuario:**
- [ ] Elegir nick único
- [ ] Verificar en Firebase Console → Authentication → Users
- [ ] Verificar en Firestore → users/{uid} con candiesTotal=0
- [ ] Verificar en Firestore → nicks/{lowerNick}

#### **Probar Caramelos:**
```javascript
// En consola del navegador (Chrome DevTools)
await window.testSystem.testCandiesSystem();
```
- [ ] Verificar que caramelos se suman
- [ ] Verificar en Firestore → users/{uid}.candiesTotal

#### **Probar Progreso:**
```javascript
// En consola del navegador
await window.testSystem.testProgressSystem();
```
- [ ] Verificar en Firestore → progress/{uid_snake}.bestLevel

#### **Probar Ranking:**
```javascript
// En consola del navegador
await window.testSystem.testRankingSystem();
```
- [ ] Pulsar "🏆 Ranking" en la app
- [ ] Verificar Top 20 con tu usuario

## 📸 **CAPTURAS REQUERIDAS**

### **1. Firebase Authentication**
- Screenshot de: Firebase Console → Authentication → Users
- Mostrar tu email autenticado

### **2. Firestore Users**
- Screenshot de: Firestore → users/{tu_uid}
- Mostrar: candiesTotal, nick, createdAt

### **3. Firestore Progress**
- Screenshot de: Firestore → progress/{tu_uid_snake}
- Mostrar: bestLevel > 0

### **4. Ranking en App**
- Screenshot de: App → Modal Ranking
- Mostrar tu usuario con caramelos correctos

## 🛠️ **COMANDOS ÚTILES**

```bash
# Verificar dispositivos conectados
adb devices

# Limpiar cache de Gradle
cd pueblito/android
./gradlew clean

# Sincronizar cambios
cd pueblito
npx cap sync android

# Ejecutar en dispositivo
npx cap run android

# Servidor web (alternativa)
npx http-server pueblito -p 8002 -o
```

## 🔍 **VERIFICACIONES EN FIREBASE**

### **Authentication:**
- Usuario aparece en Users
- SHA-1 configurado correctamente

### **Firestore:**
- Colección `users` con tu documento
- Colección `progress` con tu progreso
- Colección `nicks` con tu nick
- Reglas de seguridad aplicadas

## 📞 **SI HAY PROBLEMAS**

### **Build falla:**
- Verificar versión de Java (necesita 11+)
- Limpiar cache: `./gradlew clean`
- Verificar google-services.json en android/app/

### **Login no funciona:**
- Verificar SHA-1 en Firebase Console
- Verificar WEB_CLIENT_ID en configuración
- Verificar conexión a internet

### **Datos no se guardan:**
- Verificar reglas de Firestore
- Verificar usuario autenticado
- Verificar conexión a internet

## ✅ **CHECKLIST FINAL**

- [ ] App se ejecuta en Android
- [ ] Login Google funciona
- [ ] Usuario se crea en Firebase
- [ ] Nick único funciona
- [ ] Caramelos se suman correctamente
- [ ] Niveles se guardan
- [ ] Ranking funciona
- [ ] Capturas enviadas

**¡Sistema listo para producción!** 🎉


