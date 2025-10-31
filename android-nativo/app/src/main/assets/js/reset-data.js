// Script para resetear datos incorrectos
// =====================================

console.log('🧹 Iniciando reset de datos...');

// Función para limpiar datos incorrectos
function resetIncorrectData() {
  console.log('🗑️ Limpiando datos incorrectos...');
  
  // Limpiar localStorage
  const keysToRemove = [
    'aray_best_parque',
    'aray_best_skate', 
    'aray_best_cole',
    'aray_best_pabellon',
    'aray_best_yayos',
    'aray_best_edificio',
    'aray_best_tienda',
    'aray_best_informatica',
    'aray_best_rio',
    'aray_best_level_parque',
    'aray_best_level_skate',
    'aray_best_level_cole',
    'aray_best_level_pabellon',
    'aray_best_level_yayos',
    'aray_best_level_edificio',
    'aray_best_level_tienda',
    'aray_best_level_informatica',
    'aray_best_level_rio',
    'offline_progress_queue',
    // Nuevas claves unificadas
    'losmundosdearay_user_data',
    'losmundosdearay_settings',
    'losmundosdearay_resources',
    'losmundosdearay_progress',
    'losmundosdearay_sync',
    'aray_fresitas',
    'aray_energy',
    'audioEnabled',
    'musicEnabled',
    'user_nick'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Eliminado: ${key}`);
  });
  
  console.log('✅ Datos locales limpiados');
}

// Función para resetear datos en Firebase (si está disponible)
async function resetFirebaseData() {
  if (!window.GameBridge) {
    console.log('❌ GameBridge no disponible - no se puede resetear Firebase');
    return;
  }
  
  console.log('🔥 Reseteando datos en Firebase...');
  
  // Resetear progreso de todos los juegos
  const games = ['parque', 'skate', 'cole', 'pabellon', 'yayos', 'edificio', 'tienda', 'informatica', 'rio'];
  
  for (const game of games) {
    try {
      // Establecer nivel 0 para resetear
      window.GameBridge.updateBestLevel(game, 0);
      console.log(`🔥 Resetado ${game} a nivel 0`);
    } catch (error) {
      console.warn(`⚠️ Error reseteando ${game}:`, error);
    }
  }
  
  console.log('✅ Datos de Firebase resetados');
}

// Función principal de reset
async function fullReset() {
  console.log('🚨 INICIANDO RESET COMPLETO...');
  
  if (confirm('¿Estás seguro de que quieres resetear TODOS los datos? Esto no se puede deshacer.')) {
    // Resetear datos locales
    resetIncorrectData();
    
    // Resetear datos de Firebase
    await resetFirebaseData();
    
    console.log('🎉 RESET COMPLETO FINALIZADO');
    alert('✅ Datos resetados correctamente. Recarga la página.');
  } else {
    console.log('❌ Reset cancelado por el usuario');
  }
}

// Exponer funciones globalmente
window.resetIncorrectData = resetIncorrectData;
window.resetFirebaseData = resetFirebaseData;
window.fullReset = fullReset;

// Auto-ejecutar limpieza local (sin confirmación)
resetIncorrectData();

console.log('🧹 Script de reset cargado. Usa window.fullReset() para reset completo.');



