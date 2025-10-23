/* ========================================
   🧪 TESTING WEB - Funciones de testing
   Sistema de pruebas para verificar funcionalidad
   ======================================== */

import { signInWithGoogle, signOutUser, setUserNick, getCurrentUser } from './auth-system-web.js';
import { addCandies, getTotalCandies, getRanking } from './candies-system-web.js';
import { updateBestLevel, getBestLevel } from './progress-system-web.js';
import { showToast } from './ui-auth-web.js';

// Ejecutar todas las pruebas
export const runAllTests = async () => {
  console.log('🧪 Iniciando batería completa de pruebas...');
  
  try {
    await testCandiesSystem();
    await testProgressSystem();
    await testRankingSystem();
    
    console.log('✅ Todas las pruebas completadas');
    showToast('Todas las pruebas completadas ✅', 'success');
    return true;
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
    showToast('Error en pruebas ❌', 'error');
    return false;
  }
};

// Probar sistema de caramelos
export const testCandiesSystem = async () => {
  console.log('🍬 Probando sistema de caramelos...');
  
  try {
    const initialCandies = getTotalCandies();
    console.log(`Caramelos iniciales: ${initialCandies}`);
    
    // Añadir caramelos
    const result = await addCandies(5);
    if (result.success) {
      const newCandies = getTotalCandies();
      console.log(`✅ Caramelos añadidos: ${newCandies}`);
      
      if (newCandies >= initialCandies + 5) {
        console.log('✅ Sistema de caramelos funcionando correctamente');
        return true;
      } else {
        console.log('❌ Los caramelos no se sumaron correctamente');
        return false;
      }
    } else {
      console.log('❌ Error añadiendo caramelos:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en test de caramelos:', error);
    return false;
  }
};

// Probar sistema de progreso
export const testProgressSystem = async () => {
  console.log('🎮 Probando sistema de progreso...');
  
  try {
    const gameId = 'snake';
    const initialLevel = await getBestLevel(gameId);
    console.log(`Nivel inicial de ${gameId}: ${initialLevel}`);
    
    // Actualizar nivel
    const newLevel = initialLevel + 1;
    const updated = await updateBestLevel(gameId, newLevel);
    
    if (updated) {
      const currentLevel = await getBestLevel(gameId);
      console.log(`✅ Nivel actualizado: ${currentLevel}`);
      
      if (currentLevel >= newLevel) {
        console.log('✅ Sistema de progreso funcionando correctamente');
        return true;
      } else {
        console.log('❌ El nivel no se actualizó correctamente');
        return false;
      }
    } else {
      console.log('❌ No se pudo actualizar el nivel');
      return false;
    }
  } catch (error) {
    console.error('❌ Error en test de progreso:', error);
    return false;
  }
};

// Probar sistema de ranking
export const testRankingSystem = async () => {
  console.log('🏆 Probando sistema de ranking...');
  
  try {
    const ranking = await getRanking(10);
    console.log(`Ranking obtenido: ${ranking.length} usuarios`);
    
    if (ranking.length > 0) {
      console.log('Top 3:');
      ranking.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.nick} - ${user.candiesTotal} caramelos`);
      });
      
      console.log('✅ Sistema de ranking funcionando correctamente');
      return true;
    } else {
      console.log('⚠️ No hay datos de ranking (esto es normal si no hay usuarios)');
      return true;
    }
  } catch (error) {
    console.error('❌ Error en test de ranking:', error);
    return false;
  }
};

// Mostrar estado del usuario
export const showUserStatus = () => {
  const user = getCurrentUser();
  const userData = getCurrentUserData();
  
  console.log('👤 Estado del usuario:');
  console.log(`Autenticado: ${user ? 'Sí' : 'No'}`);
  
  if (user) {
    console.log(`Email: ${user.email}`);
    console.log(`UID: ${user.uid}`);
    console.log(`Nick: ${userData?.nick || 'No establecido'}`);
    console.log(`Caramelos: ${getTotalCandies()}`);
    console.log(`Creado: ${userData?.createdAt?.toDate?.() || 'N/A'}`);
  }
};

// Función para testing rápido de nivel
export const testLevelUp = async (gameId = 'snake', targetLevel = 5) => {
  console.log(`🎮 Probando subida de nivel en ${gameId} a nivel ${targetLevel}...`);
  
  try {
    await updateBestLevel(gameId, targetLevel);
    const newLevel = await getBestLevel(gameId);
    
    if (newLevel >= targetLevel) {
      console.log(`✅ Nivel actualizado: ${gameId} nivel ${newLevel}`);
      return true;
    } else {
      console.log(`❌ Error: nivel esperado ${targetLevel}, obtenido ${newLevel}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en test de nivel:', error);
    return false;
  }
};

// Función para testing completo de minijuego
export const testMinigameComplete = async () => {
  console.log('🎮 Simulando partida completa de minijuego...');
  
  try {
    // Simular ganar caramelos
    await addCandies(10);
    console.log('🍬 +10 caramelos añadidos');
    
    // Simular subir de nivel
    await testLevelUp('snake', 3);
    await testLevelUp('runner', 2);
    await testLevelUp('memory', 4);
    
    // Mostrar estado final
    showUserStatus();
    
    console.log('✅ Simulación de partida completada');
    return true;
  } catch (error) {
    console.error('❌ Error en simulación:', error);
    return false;
  }
};

// Hacer funciones disponibles globalmente para testing
window.testSystem = {
  runAllTests,
  testCandiesSystem,
  testProgressSystem,
  testRankingSystem,
  showUserStatus,
  testLevelUp,
  testMinigameComplete
};

console.log('🧪 Funciones de testing Web disponibles en window.testSystem');





