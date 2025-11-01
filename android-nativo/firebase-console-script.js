// Script simplificado para verificar estructura de Firebase
// Este script se ejecuta en la consola web de Firebase

console.log('🔍 Verificando estructura de Firebase...');
console.log('=' .repeat(50));

// Función para verificar colecciones
async function verificarEstructura() {
  try {
    // Verificar estructura Multi-App
    console.log('📱 Verificando estructura Multi-App (apps/aray/users)...');
    const appsSnapshot = await firebase.firestore()
      .collection('apps')
      .doc('aray')
      .collection('users')
      .get();
    
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
    const usersSnapshot = await firebase.firestore()
      .collection('users')
      .get();
    
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
      const nicksSnapshot = await firebase.firestore()
        .collection('nicks')
        .get();
      console.log(`   Nicks encontrados: ${nicksSnapshot.size}`);
    } catch (error) {
      console.log('   Nicks: No existe o vacía');
    }
    
    try {
      const progressSnapshot = await firebase.firestore()
        .collection('progress')
        .get();
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

// Función para limpiar Firebase
async function limpiarFirebase() {
  console.log('🗑️ Iniciando limpieza completa de Firebase...');
  console.log('⚠️  ADVERTENCIA: Esta operación es IRREVERSIBLE');
  console.log('=' .repeat(50));
  
  try {
    // 1. Limpiar estructura Multi-App
    console.log('📱 Limpiando estructura Multi-App...');
    const appsSnapshot = await firebase.firestore()
      .collection('apps')
      .doc('aray')
      .collection('users')
      .get();
    
    if (appsSnapshot.size > 0) {
      const batch1 = firebase.firestore().batch();
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
    const usersSnapshot = await firebase.firestore()
      .collection('users')
      .get();
    
    if (usersSnapshot.size > 0) {
      const batch2 = firebase.firestore().batch();
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
      const nicksSnapshot = await firebase.firestore()
        .collection('nicks')
        .get();
      if (nicksSnapshot.size > 0) {
        const batch3 = firebase.firestore().batch();
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
      const progressSnapshot = await firebase.firestore()
        .collection('progress')
        .get();
      if (progressSnapshot.size > 0) {
        const batch4 = firebase.firestore().batch();
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

// Ejecutar verificación
console.log('📋 Para ejecutar:');
console.log('1. Verificar: verificarEstructura()');
console.log('2. Limpiar: limpiarFirebase()');
console.log('');
console.log('⚠️  RECOMENDACIÓN: Ejecuta primero verificarEstructura() para ver qué datos tienes');

// Auto-ejecutar verificación
verificarEstructura().then(result => {
  console.log('\n✅ Verificación completada');
  console.log('💡 Si quieres limpiar Firebase, ejecuta: limpiarFirebase()');
});



