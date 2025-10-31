# 🗑️ Script de Limpieza de Firebase - Los Mundos de Aray

## ⚠️ **ADVERTENCIA IMPORTANTE**
**ESTE SCRIPT ELIMINARÁ TODOS LOS DATOS DE FIREBASE. ÚSALO SOLO SI ESTÁS SEGURO DE QUERER EMPEZAR DESDE CERO.**

## 📋 **ESTRUCTURAS ACTUALES A LIMPIAR**

### **1. Estructura Multi-App (Principal):**
```
apps/aray/users/{uid}
├── uid: string
├── nick: string
├── candiesTotal: number
├── soundEnabled: boolean
├── musicEnabled: boolean
├── lastSeen: timestamp
└── createdAt: timestamp

apps/aray/users/{uid}/progress/{gameId}
├── bestLevel: number
└── updatedAt: timestamp
```

### **2. Estructura Legacy (Secundaria):**
```
users/{uid}
├── uid: string
├── nick: string
├── candiesTotal: number
└── otros campos...
```

---

## 🔧 **OPCIONES DE LIMPIEZA**

### **OPCIÓN 1: Limpieza Completa (RECOMENDADA)**
Elimina todas las estructuras y empieza desde cero con la nueva estructura unificada.

### **OPCIÓN 2: Limpieza Selectiva**
Elimina solo ciertas colecciones manteniendo otras.

### **OPCIÓN 3: Migración Gradual**
Migra datos existentes a la nueva estructura antes de limpiar.

---

## 🚀 **IMPLEMENTACIÓN**

### **Script de Limpieza Completa:**

```javascript
// Script para ejecutar en Firebase Console o como función Cloud
// ⚠️ ADVERTENCIA: ESTO ELIMINARÁ TODOS LOS DATOS

const admin = require('firebase-admin');

async function limpiarFirebaseCompleto() {
  console.log('🗑️ Iniciando limpieza completa de Firebase...');
  
  try {
    const db = admin.firestore();
    
    // 1. Limpiar estructura Multi-App
    console.log('📱 Limpiando estructura Multi-App...');
    const appsRef = db.collection('apps').doc('aray');
    
    // Eliminar todos los usuarios de la app
    const usersSnapshot = await appsRef.collection('users').get();
    const batch1 = db.batch();
    
    usersSnapshot.docs.forEach(doc => {
      batch1.delete(doc.ref);
    });
    
    await batch1.commit();
    console.log(`✅ Eliminados ${usersSnapshot.size} usuarios de Multi-App`);
    
    // 2. Limpiar estructura Legacy
    console.log('🔄 Limpiando estructura Legacy...');
    const usersSnapshot2 = await db.collection('users').get();
    const batch2 = db.batch();
    
    usersSnapshot2.docs.forEach(doc => {
      batch2.delete(doc.ref);
    });
    
    await batch2.commit();
    console.log(`✅ Eliminados ${usersSnapshot2.size} usuarios Legacy`);
    
    // 3. Limpiar otras colecciones relacionadas
    console.log('🧹 Limpiando otras colecciones...');
    
    // Eliminar colección 'nicks' si existe
    try {
      const nicksSnapshot = await db.collection('nicks').get();
      const batch3 = db.batch();
      nicksSnapshot.docs.forEach(doc => {
        batch3.delete(doc.ref);
      });
      await batch3.commit();
      console.log(`✅ Eliminados ${nicksSnapshot.size} nicks`);
    } catch (error) {
      console.log('ℹ️ Colección nicks no existe o ya está vacía');
    }
    
    // Eliminar colección 'progress' si existe
    try {
      const progressSnapshot = await db.collection('progress').get();
      const batch4 = db.batch();
      progressSnapshot.docs.forEach(doc => {
        batch4.delete(doc.ref);
      });
      await batch4.commit();
      console.log(`✅ Eliminados ${progressSnapshot.size} documentos de progreso`);
    } catch (error) {
      console.log('ℹ️ Colección progress no existe o ya está vacía');
    }
    
    console.log('🎉 Limpieza completa finalizada');
    console.log('✅ Firebase está listo para la nueva estructura unificada');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  }
}

// Ejecutar limpieza
limpiarFirebaseCompleto()
  .then(() => {
    console.log('✅ Limpieza completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  });
```

---

## 🛠️ **ALTERNATIVAS MÁS SEGURAS**

### **Opción A: Script de Verificación Primero**
```javascript
// Script para verificar qué datos existen antes de eliminar
async function verificarDatosFirebase() {
  const db = admin.firestore();
  
  console.log('🔍 Verificando datos existentes en Firebase...');
  
  // Verificar Multi-App
  const appsSnapshot = await db.collection('apps').doc('aray').collection('users').get();
  console.log(`📱 Usuarios en Multi-App: ${appsSnapshot.size}`);
  
  appsSnapshot.docs.forEach(doc => {
    console.log(`  - ${doc.id}: ${doc.data().nick || 'Sin nick'} (${doc.data().candiesTotal || 0} candies)`);
  });
  
  // Verificar Legacy
  const usersSnapshot = await db.collection('users').get();
  console.log(`🔄 Usuarios en Legacy: ${usersSnapshot.size}`);
  
  usersSnapshot.docs.forEach(doc => {
    console.log(`  - ${doc.id}: ${doc.data().nick || 'Sin nick'} (${doc.data().candiesTotal || 0} candies)`);
  });
  
  return {
    multiApp: appsSnapshot.size,
    legacy: usersSnapshot.size
  };
}
```

### **Opción B: Migración con Backup**
```javascript
// Script para hacer backup antes de limpiar
async function backupYLimpiar() {
  console.log('💾 Creando backup antes de limpiar...');
  
  const db = admin.firestore();
  const backup = {
    timestamp: new Date().toISOString(),
    multiApp: [],
    legacy: []
  };
  
  // Backup Multi-App
  const appsSnapshot = await db.collection('apps').doc('aray').collection('users').get();
  appsSnapshot.docs.forEach(doc => {
    backup.multiApp.push({
      id: doc.id,
      data: doc.data()
    });
  });
  
  // Backup Legacy
  const usersSnapshot = await db.collection('users').get();
  usersSnapshot.docs.forEach(doc => {
    backup.legacy.push({
      id: doc.id,
      data: doc.data()
    });
  });
  
  // Guardar backup en archivo
  const fs = require('fs');
  fs.writeFileSync(`firebase-backup-${Date.now()}.json`, JSON.stringify(backup, null, 2));
  
  console.log(`💾 Backup guardado: firebase-backup-${Date.now()}.json`);
  console.log(`📊 Backup contiene: ${backup.multiApp.length} usuarios Multi-App, ${backup.legacy.length} usuarios Legacy`);
  
  // Ahora proceder con la limpieza
  await limpiarFirebaseCompleto();
}
```

---

## 🎯 **RECOMENDACIÓN**

### **Para tu caso específico:**

1. **PRIMERO:** Ejecuta el script de verificación para ver qué datos tienes
2. **SEGUNDO:** Si quieres hacer backup, ejecuta el script de backup
3. **TERCERO:** Ejecuta la limpieza completa
4. **CUARTO:** La nueva estructura se creará automáticamente cuando los usuarios se logueen

### **Comando Recomendado:**
```bash
# 1. Verificar datos existentes
node verificar-firebase.js

# 2. Hacer backup (opcional)
node backup-firebase.js

# 3. Limpiar completamente
node limpiar-firebase.js
```

---

## ✅ **DESPUÉS DE LA LIMPIEZA**

Una vez limpiado Firebase:

1. **La nueva estructura se creará automáticamente** cuando los usuarios se logueen
2. **Los datos se sincronizarán** usando la nueva estructura unificada
3. **No habrá conflictos** entre estructuras antiguas y nuevas
4. **La aplicación funcionará** con la estructura unificada implementada

---

## ⚠️ **CONSIDERACIONES FINALES**

- **Esta operación es IRREVERSIBLE**
- **Todos los usuarios empezarán desde cero**
- **Los rankings se reiniciarán**
- **Los progresos de juegos se perderán**
- **Solo los datos de localStorage se preservarán** (gracias a la migración automática)

**¿Estás seguro de que quieres proceder con la limpieza completa?**
