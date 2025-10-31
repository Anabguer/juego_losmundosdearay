# 🏗️ Estructura Unificada de Datos - Los Mundos de Aray

## 📋 **PROBLEMA IDENTIFICADO**

### **Estructura Actual (PROBLEMÁTICA):**

**localStorage (Dispersa e inconsistente):**
```javascript
// Datos dispersos sin estructura coherente
'aray_best_skate' → nivel
'aray_best_level_skate' → nivel (duplicado)
'aray_best_cole' → puntos
'aray_best_level_cole' → nivel
'aray_fresitas' → monedas
'aray_energy' → energía
'audioEnabled' → boolean
'musicEnabled' → boolean
'user_nick' → string
```

**Firebase (Estructura correcta pero incompleta):**
```javascript
// apps/{appId}/users/{uid}
{
  uid: "string",
  nick: "string",
  candiesTotal: number,
  settings: { lastGameId: "string" }
}

// apps/{appId}/users/{uid}/progress/{gameId}  
{
  bestLevel: number,
  updatedAt: timestamp
}
```

### **PROBLEMAS IDENTIFICADOS:**

1. **❌ Inconsistencia de nombres:** `aray_best_skate` vs `aray_best_level_skate`
2. **❌ Datos dispersos:** No hay estructura unificada en localStorage
3. **❌ Falta información de usuario:** localStorage no guarda uid, nick, etc.
4. **❌ Sincronización incompleta:** Solo algunos datos se sincronizan
5. **❌ Sin soporte offline completo:** No hay cola de sincronización robusta
6. **❌ Difícil mantenimiento:** Cada juego maneja sus datos de forma diferente

---

## 🎯 **SOLUCIÓN PROPUESTA**

### **Estructura Unificada para localStorage:**

```javascript
// Claves de localStorage unificadas
const STORAGE_KEYS = {
    USER_DATA: 'losmundosdearay_user_data',
    SETTINGS: 'losmundosdearay_settings', 
    RESOURCES: 'losmundosdearay_resources',
    PROGRESS: 'losmundosdearay_progress',
    SYNC: 'losmundosdearay_sync'
};

// Estructura completa
const UNIFIED_DATA_STRUCTURE = {
    // Información del usuario
    user: {
        uid: null,
        nick: null,
        email: null,
        photoURL: null,
        createdAt: null,
        lastSeen: null
    },
    
    // Configuraciones globales
    settings: {
        audioEnabled: true,
        musicEnabled: true,
        lastGameId: null,
        language: 'es'
    },
    
    // Recursos del juego
    resources: {
        candiesTotal: 0,
        energy: 100,
        coins: 0
    },
    
    // Progreso por juego
    progress: {
        skate: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        cole: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        yayos: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        parque: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        pabellon: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        informatica: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        tienda: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        rio: { bestLevel: 1, bestScore: 0, lastPlayed: null },
        edificio: { bestLevel: 1, bestScore: 0, lastPlayed: null }
    },
    
    // Metadatos de sincronización
    sync: {
        lastSync: null,
        offlineQueue: [],
        needsSync: false,
        version: 1
    }
};
```

### **Estructura Compatible para Firebase:**

```javascript
// apps/{appId}/users/{uid}
{
  uid: "string",
  nick: "string",
  email: "string", 
  photoURL: "string",
  candiesTotal: number,
  createdAt: timestamp,
  lastSeen: timestamp,
  settings: { 
    lastGameId: "string",
    audioEnabled: boolean,
    musicEnabled: boolean,
    language: "es"
  }
}

// apps/{appId}/users/{uid}/progress/{gameId}
{
  bestLevel: number,
  bestScore: number,
  lastPlayed: timestamp,
  updatedAt: timestamp
}
```

---

## 🔧 **FUNCIONES DE GESTIÓN**

### **1. Obtener Datos Unificados:**
```javascript
function getUnifiedLocalStorageData() {
    const data = { ...UNIFIED_DATA_STRUCTURE };
    
    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (userData) data.user = { ...data.user, ...JSON.parse(userData) };
        
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (settings) data.settings = { ...data.settings, ...JSON.parse(settings) };
        
        const resources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
        if (resources) data.resources = { ...data.resources, ...JSON.parse(resources) };
        
        const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        if (progress) data.progress = { ...data.progress, ...JSON.parse(progress) };
        
        const sync = localStorage.getItem(STORAGE_KEYS.SYNC);
        if (sync) data.sync = { ...data.sync, ...JSON.parse(sync) };
        
    } catch (error) {
        console.error('Error cargando datos unificados:', error);
    }
    
    return data;
}
```

### **2. Guardar Datos Unificados:**
```javascript
function saveUnifiedLocalStorageData(data) {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(data.resources));
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
        localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(data.sync));
        
        return true;
    } catch (error) {
        console.error('Error guardando datos unificados:', error);
        return false;
    }
}
```

### **3. Migración de Datos Legacy:**
```javascript
function migrateLegacyData() {
    const unifiedData = getUnifiedLocalStorageData();
    let migrated = false;
    
    const LEGACY_KEYS = [
        'aray_best_skate', 'aray_best_level_skate',
        'aray_best_cole', 'aray_best_level_cole', 
        'aray_best_yayos', 'aray_best_level_yayos',
        'aray_fresitas', 'aray_energy',
        'audioEnabled', 'musicEnabled', 'user_nick'
    ];
    
    LEGACY_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            switch (key) {
                case 'aray_best_skate':
                case 'aray_best_level_skate':
                    unifiedData.progress.skate.bestLevel = Math.max(unifiedData.progress.skate.bestLevel, parseInt(value) || 1);
                    break;
                case 'aray_best_cole':
                case 'aray_best_level_cole':
                    unifiedData.progress.cole.bestLevel = Math.max(unifiedData.progress.cole.bestLevel, parseInt(value) || 1);
                    break;
                case 'aray_fresitas':
                    unifiedData.resources.coins = parseInt(value) || 0;
                    break;
                case 'aray_energy':
                    unifiedData.resources.energy = parseInt(value) || 100;
                    break;
                case 'audioEnabled':
                    unifiedData.settings.audioEnabled = value === 'true';
                    break;
                case 'musicEnabled':
                    unifiedData.settings.musicEnabled = value === 'true';
                    break;
                case 'user_nick':
                    unifiedData.user.nick = value;
                    break;
            }
            migrated = true;
        }
    });
    
    if (migrated) {
        unifiedData.sync.version = 1;
        unifiedData.sync.lastSync = new Date().toISOString();
        saveUnifiedLocalStorageData(unifiedData);
        
        // Limpiar datos legacy después de migración exitosa
        LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    }
    
    return unifiedData;
}
```

---

## 🚀 **IMPLEMENTACIÓN PASO A PASO**

### **FASE 1: Migración (URGENTE)**
1. **Ejecutar migración:** Usar el botón "🔄 Migrar Datos Legacy" en `diagnostico.html`
2. **Verificar migración:** Comprobar que todos los datos se migraron correctamente
3. **Limpiar datos legacy:** Eliminar las claves antiguas después de verificar

### **FASE 2: Actualizar Juegos**
1. **Modificar `storage.js`:** Implementar las nuevas funciones de gestión
2. **Actualizar cada juego:** Cambiar de claves legacy a estructura unificada
3. **Implementar sincronización:** Usar la nueva estructura para Firebase

### **FASE 3: Sincronización Bidireccional**
1. **Online → Offline:** Descargar datos de Firebase al localStorage
2. **Offline → Online:** Subir cambios pendientes cuando hay conexión
3. **Resolución de conflictos:** Implementar lógica para datos conflictivos

---

## 📊 **BENEFICIOS DE LA NUEVA ESTRUCTURA**

### **✅ Ventajas:**
1. **Consistencia:** Misma estructura en localStorage y Firebase
2. **Mantenibilidad:** Fácil agregar nuevos juegos o campos
3. **Sincronización completa:** Todos los datos se sincronizan
4. **Soporte offline robusto:** Cola de sincronización integrada
5. **Escalabilidad:** Estructura preparada para futuras funcionalidades
6. **Debugging:** Fácil identificar problemas de sincronización

### **🎯 Casos de Uso:**
- **Usuario offline:** Juega y guarda progreso localmente
- **Usuario online:** Sincroniza automáticamente con Firebase
- **Cambio de dispositivo:** Datos disponibles inmediatamente
- **Múltiples juegos:** Progreso unificado y consistente

---

## 🔍 **HERRAMIENTAS DE DIAGNÓSTICO**

### **Página de Diagnóstico Actualizada:**
- **Visualización dual:** Muestra datos legacy y unificados
- **Migración automática:** Botón para migrar datos existentes
- **Análisis de problemas:** Identifica inconsistencias
- **Recomendaciones:** Sugiere acciones correctivas

### **Logs en Tiempo Real:**
- **Seguimiento de operaciones:** Cada acción se registra
- **Identificación de errores:** Problemas claramente marcados
- **Estado de sincronización:** Última sincronización visible

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Migración Segura:**
1. **Backup:** Hacer copia de seguridad antes de migrar
2. **Verificación:** Comprobar que todos los datos se migraron
3. **Rollback:** Plan de reversión si algo falla

### **Compatibilidad:**
1. **Versiones anteriores:** Mantener compatibilidad durante transición
2. **GameBridge:** Asegurar que funciona con nueva estructura
3. **Firebase:** Actualizar reglas si es necesario

### **Rendimiento:**
1. **Carga inicial:** Optimizar carga de datos estructurados
2. **Sincronización:** Implementar sincronización incremental
3. **Almacenamiento:** Monitorear uso de localStorage

---

## 📝 **PRÓXIMOS PASOS**

1. **✅ COMPLETADO:** Análisis de estructura actual
2. **✅ COMPLETADO:** Diseño de estructura unificada  
3. **✅ COMPLETADO:** Herramientas de diagnóstico
4. **🔄 EN PROGRESO:** Implementación de sincronización bidireccional
5. **⏳ PENDIENTE:** Actualización de todos los juegos
6. **⏳ PENDIENTE:** Pruebas de integración
7. **⏳ PENDIENTE:** Documentación de API

---

**🎯 OBJETIVO:** Tener una estructura de datos unificada que funcione perfectamente tanto online como offline, con sincronización automática y soporte robusto para múltiples juegos.
