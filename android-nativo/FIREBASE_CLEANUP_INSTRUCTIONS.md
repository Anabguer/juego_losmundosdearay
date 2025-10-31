# 🔥 Firebase Cleanup Script - Configuración

## 📋 **INSTRUCCIONES DE USO**

### **1. Preparación:**
```bash
# Instalar dependencias
npm install firebase-admin

# Obtener credenciales de servicio de Firebase
# Ve a Firebase Console > Project Settings > Service Accounts
# Genera una nueva clave privada y guárdala como 'service-account-key.json'
```

### **2. Configurar el Script:**
```javascript
// En firebase-cleanup.js, línea 4:
const serviceAccount = require('./service-account-key.json');
```

### **3. Ejecutar Comandos:**

#### **Verificar datos existentes:**
```bash
node firebase-cleanup.js verificar
```

#### **Crear backup:**
```bash
node firebase-cleanup.js backup
```

#### **Limpiar completamente:**
```bash
node firebase-cleanup.js limpiar
```

#### **Backup y limpiar (RECOMENDADO):**
```bash
node firebase-cleanup.js backup-y-limpiar
```

---

## ⚠️ **ADVERTENCIAS IMPORTANTES**

### **ANTES DE EJECUTAR:**
1. **Asegúrate de tener las credenciales correctas**
2. **Verifica que estás conectado al proyecto correcto**
3. **Considera hacer backup primero**
4. **Esta operación es IRREVERSIBLE**

### **DESPUÉS DE LIMPIAR:**
1. **Los usuarios empezarán desde cero**
2. **Los rankings se reiniciarán**
3. **Los progresos se perderán**
4. **La nueva estructura se creará automáticamente**

---

## 🎯 **FLUJO RECOMENDADO**

```bash
# 1. Verificar qué datos tienes
node firebase-cleanup.js verificar

# 2. Crear backup (opcional pero recomendado)
node firebase-cleanup.js backup

# 3. Limpiar completamente
node firebase-cleanup.js limpiar

# O hacer todo de una vez:
node firebase-cleanup.js backup-y-limpiar
```

---

## 📊 **ESTRUCTURAS QUE SE ELIMINARÁN**

### **Multi-App Structure:**
- `apps/aray/users/{uid}` - Todos los usuarios
- `apps/aray/users/{uid}/progress/{gameId}` - Todos los progresos

### **Legacy Structure:**
- `users/{uid}` - Todos los usuarios legacy
- `nicks/{nick}` - Todos los nicks
- `progress/{progressId}` - Todos los progresos legacy

---

## ✅ **DESPUÉS DE LA LIMPIEZA**

1. **La aplicación funcionará normalmente**
2. **Los usuarios crearán automáticamente la nueva estructura**
3. **Los datos se sincronizarán con la estructura unificada**
4. **No habrá conflictos entre estructuras**

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Error de credenciales:**
```
Error: Failed to determine project ID
```
**Solución:** Verifica que el archivo `service-account-key.json` esté en la ubicación correcta.

### **Error de permisos:**
```
Error: Missing or insufficient permissions
```
**Solución:** Asegúrate de que la cuenta de servicio tenga permisos de administrador.

### **Error de conexión:**
```
Error: Could not load the default credentials
```
**Solución:** Verifica que las credenciales sean válidas y el proyecto exista.

---

**🎉 Una vez completada la limpieza, tu aplicación estará lista para usar la nueva estructura unificada implementada.**
