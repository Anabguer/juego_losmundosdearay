const admin = require('firebase-admin');

// Configurar Firebase Admin (necesitas las credenciales de servicio)
const serviceAccount = require('./path/to/your/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ========================================
// 🔍 SCRIPT DE VERIFICACIÓN
// ========================================
async function verificarDatosFirebase() {
  console.log('🔍 Verificando datos existentes en Firebase...');
  console.log('=' .repeat(50));
  
  try {
    // Verificar estructura Multi-App
    console.log('📱 Verificando estructura Multi-App (apps/aray/users)...');
    const appsSnapshot = await db.collection('apps').doc('aray').collection('users').get();
    console.log(`   Usuarios encontrados: ${appsSnapshot.size}`);
    
    if (appsSnapshot.size > 0) {
      console.log('   Detalles de usuarios:');
      appsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.nick || 'Sin nick'} (${data.candiesTotal || 0} candies)`);
      });
    }
    
    // Verificar estructura Legacy
    console.log('\n🔄 Verificando estructura Legacy (users)...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Usuarios encontrados: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size > 0) {
      console.log('   Detalles de usuarios:');
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.nick || 'Sin nick'} (${data.candiesTotal || 0} candies)`);
      });
    }
    
    // Verificar otras colecciones
    console.log('\n🧹 Verificando otras colecciones...');
    
    try {
      const nicksSnapshot = await db.collection('nicks').get();
      console.log(`   Nicks encontrados: ${nicksSnapshot.size}`);
    } catch (error) {
      console.log('   Nicks: No existe o vacía');
    }
    
    try {
      const progressSnapshot = await db.collection('progress').get();
      console.log(`   Progresos encontrados: ${progressSnapshot.size}`);
    } catch (error) {
      console.log('   Progresos: No existe o vacía');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 RESUMEN:`);
    console.log(`   Multi-App: ${appsSnapshot.size} usuarios`);
    console.log(`   Legacy: ${usersSnapshot.size} usuarios`);
    console.log(`   Total: ${appsSnapshot.size + usersSnapshot.size} usuarios`);
    
    return {
      multiApp: appsSnapshot.size,
      legacy: usersSnapshot.size,
      total: appsSnapshot.size + usersSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    throw error;
  }
}

// ========================================
// 💾 SCRIPT DE BACKUP
// ========================================
async function crearBackup() {
  console.log('💾 Creando backup de datos existentes...');
  
  const fs = require('fs');
  const path = require('path');
  
  const backup = {
    timestamp: new Date().toISOString(),
    multiApp: [],
    legacy: [],
    nicks: [],
    progress: []
  };
  
  try {
    // Backup Multi-App
    console.log('📱 Respaldando estructura Multi-App...');
    const appsSnapshot = await db.collection('apps').doc('aray').collection('users').get();
    appsSnapshot.docs.forEach(doc => {
      backup.multiApp.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    // Backup Legacy
    console.log('🔄 Respaldando estructura Legacy...');
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.docs.forEach(doc => {
      backup.legacy.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    // Backup otras colecciones
    try {
      const nicksSnapshot = await db.collection('nicks').get();
      nicksSnapshot.docs.forEach(doc => {
        backup.nicks.push({
          id: doc.id,
          data: doc.data()
        });
      });
    } catch (error) {
      console.log('ℹ️ Colección nicks no existe');
    }
    
    try {
      const progressSnapshot = await db.collection('progress').get();
      progressSnapshot.docs.forEach(doc => {
        backup.progress.push({
          id: doc.id,
          data: doc.data()
        });
      });
    } catch (error) {
      console.log('ℹ️ Colección progress no existe');
    }
    
    // Guardar backup
    const filename = `firebase-backup-${Date.now()}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup creado: ${filename}`);
    console.log(`📊 Backup contiene:`);
    console.log(`   - ${backup.multiApp.length} usuarios Multi-App`);
    console.log(`   - ${backup.legacy.length} usuarios Legacy`);
    console.log(`   - ${backup.nicks.length} nicks`);
    console.log(`   - ${backup.progress.length} progresos`);
    
    return filepath;
    
  } catch (error) {
    console.error('❌ Error creando backup:', error);
    throw error;
  }
}

// ========================================
// 🗑️ SCRIPT DE LIMPIEZA COMPLETA
// ========================================
async function limpiarFirebaseCompleto() {
  console.log('🗑️ Iniciando limpieza completa de Firebase...');
  console.log('⚠️  ADVERTENCIA: Esta operación es IRREVERSIBLE');
  console.log('=' .repeat(50));
  
  try {
    // 1. Limpiar estructura Multi-App
    console.log('📱 Limpiando estructura Multi-App...');
    const appsSnapshot = await db.collection('apps').doc('aray').collection('users').get();
    
    if (appsSnapshot.size > 0) {
      const batch1 = db.batch();
      appsSnapshot.docs.forEach(doc => {
        batch1.delete(doc.ref);
      });
      await batch1.commit();
      console.log(`✅ Eliminados ${appsSnapshot.size} usuarios de Multi-App`);
    } else {
      console.log('ℹ️ No hay usuarios en Multi-App para eliminar');
    }
    
    // 2. Limpiar estructura Legacy
    console.log('🔄 Limpiando estructura Legacy...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.size > 0) {
      const batch2 = db.batch();
      usersSnapshot.docs.forEach(doc => {
        batch2.delete(doc.ref);
      });
      await batch2.commit();
      console.log(`✅ Eliminados ${usersSnapshot.size} usuarios Legacy`);
    } else {
      console.log('ℹ️ No hay usuarios Legacy para eliminar');
    }
    
    // 3. Limpiar otras colecciones
    console.log('🧹 Limpiando otras colecciones...');
    
    try {
      const nicksSnapshot = await db.collection('nicks').get();
      if (nicksSnapshot.size > 0) {
        const batch3 = db.batch();
        nicksSnapshot.docs.forEach(doc => {
          batch3.delete(doc.ref);
        });
        await batch3.commit();
        console.log(`✅ Eliminados ${nicksSnapshot.size} nicks`);
      } else {
        console.log('ℹ️ No hay nicks para eliminar');
      }
    } catch (error) {
      console.log('ℹ️ Colección nicks no existe o ya está vacía');
    }
    
    try {
      const progressSnapshot = await db.collection('progress').get();
      if (progressSnapshot.size > 0) {
        const batch4 = db.batch();
        progressSnapshot.docs.forEach(doc => {
          batch4.delete(doc.ref);
        });
        await batch4.commit();
        console.log(`✅ Eliminados ${progressSnapshot.size} documentos de progreso`);
      } else {
        console.log('ℹ️ No hay progresos para eliminar');
      }
    } catch (error) {
      console.log('ℹ️ Colección progress no existe o ya está vacía');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Limpieza completa finalizada');
    console.log('✅ Firebase está listo para la nueva estructura unificada');
    console.log('🚀 Los usuarios crearán automáticamente la nueva estructura al loguearse');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  }
}

// ========================================
// 🎯 FUNCIÓN PRINCIPAL
// ========================================
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔥 Firebase Cleanup Script - Los Mundos de Aray');
  console.log('=' .repeat(50));
  
  try {
    switch (command) {
      case 'verificar':
        await verificarDatosFirebase();
        break;
        
      case 'backup':
        await crearBackup();
        break;
        
      case 'limpiar':
        console.log('⚠️  ¿Estás seguro de que quieres limpiar TODOS los datos?');
        console.log('⚠️  Esta operación es IRREVERSIBLE');
        console.log('⚠️  Presiona Ctrl+C para cancelar, o espera 5 segundos...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        await limpiarFirebaseCompleto();
        break;
        
      case 'backup-y-limpiar':
        await crearBackup();
        console.log('\n⏳ Esperando 3 segundos antes de limpiar...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await limpiarFirebaseCompleto();
        break;
        
      default:
        console.log('📋 Comandos disponibles:');
        console.log('  node firebase-cleanup.js verificar          - Verificar datos existentes');
        console.log('  node firebase-cleanup.js backup             - Crear backup de datos');
        console.log('  node firebase-cleanup.js limpiar            - Limpiar todos los datos');
        console.log('  node firebase-cleanup.js backup-y-limpiar   - Backup y limpiar');
        console.log('');
        console.log('⚠️  RECOMENDACIÓN:');
        console.log('  1. Primero ejecuta: node firebase-cleanup.js verificar');
        console.log('  2. Luego ejecuta: node firebase-cleanup.js backup-y-limpiar');
        break;
    }
    
    console.log('\n✅ Operación completada exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error en operación:', error);
    process.exit(1);
  }
}

// Ejecutar función principal
main();



