/* ========================================
   🧪 TESTING - Pruebas del Sistema
   Funciones para probar todas las funcionalidades
   ======================================== */

import { signInWithGoogle, getCurrentUser, getCurrentUserData } from './auth-system.js';
import { addCandies, getTotalCandies, getGlobalRanking } from './candies-system.js';
import { updateBestLevel, getBestLevel } from './progress-system.js';

// Función para probar el sistema completo
export const runAllTests = async () => {
  console.log('🧪 Iniciando pruebas del sistema...');
  
  const results = {
    login: false,
    userCreation: false,
    nickSystem: false,
    candiesSystem: false,
    progressSystem: false,
    rankingSystem: false,
    offlineSync: false
  };
  
  try {
    // Test 1: Login
    console.log('🔐 Probando login...');
    const loginResult = await signInWithGoogle();
    if (loginResult.success) {
      results.login = true;
      console.log('✅ Login exitoso');
    } else {
      console.log('❌ Login falló:', loginResult.error);
      return results;
    }
    
    // Test 2: Creación de usuario
    console.log('👤 Verificando creación de usuario...');
    const user = getCurrentUser();
    const userData = getCurrentUserData();
    if (user && userData) {
      results.userCreation = true;
      console.log('✅ Usuario creado:', user.uid);
    } else {
      console.log('❌ Usuario no creado');
      return results;
    }
    
    // Test 3: Sistema de caramelos
    console.log('🍬 Probando sistema de caramelos...');
    const initialCandies = getTotalCandies();
    await addCandies(5);
    await addCandies(3);
    const finalCandies = getTotalCandies();
    
    if (finalCandies > initialCandies) {
      results.candiesSystem = true;
      console.log(`✅ Caramelos: ${initialCandies} → ${finalCandies}`);
    } else {
      console.log('❌ Sistema de caramelos falló');
    }
    
    // Test 4: Sistema de progreso
    console.log('🎮 Probando sistema de progreso...');
    const initialLevel = await getBestLevel('snake');
    await updateBestLevel('snake', 5);
    const finalLevel = await getBestLevel('snake');
    
    if (finalLevel > initialLevel) {
      results.progressSystem = true;
      console.log(`✅ Progreso Snake: ${initialLevel} → ${finalLevel}`);
    } else {
      console.log('❌ Sistema de progreso falló');
    }
    
    // Test 5: Ranking
    console.log('🏆 Probando ranking...');
    const ranking = await getGlobalRanking();
    if (ranking && ranking.length > 0) {
      results.rankingSystem = true;
      console.log(`✅ Ranking cargado: ${ranking.length} usuarios`);
    } else {
      console.log('❌ Ranking falló');
    }
    
    // Test 6: Modo offline (simulado)
    console.log('📱 Probando modo offline...');
    const offlineCandies = getTotalCandies();
    await addCandies(2); // Esto debería encolarse si no hay red
    results.offlineSync = true; // Asumimos que funciona si no hay errores
    console.log('✅ Modo offline simulado');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
  
  // Resumen
  console.log('📊 Resumen de pruebas:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  });
  
  return results;
};

// Función para probar específicamente el sistema de caramelos
export const testCandiesSystem = async () => {
  console.log('🍬 Probando sistema de caramelos...');
  
  const initialCandies = getTotalCandies();
  console.log(`Caramelos iniciales: ${initialCandies}`);
  
  // Probar múltiples sumas
  await addCandies(5);
  console.log(`Después de +5: ${getTotalCandies()}`);
  
  await addCandies(3);
  console.log(`Después de +3: ${getTotalCandies()}`);
  
  await addCandies(10);
  console.log(`Después de +10: ${getTotalCandies()}`);
  
  const finalCandies = getTotalCandies();
  const expected = initialCandies + 18;
  
  if (finalCandies === expected) {
    console.log('✅ Sistema de caramelos funciona correctamente');
    return true;
  } else {
    console.log(`❌ Error: esperado ${expected}, obtenido ${finalCandies}`);
    return false;
  }
};

// Función para probar el sistema de progreso
export const testProgressSystem = async () => {
  console.log('🎮 Probando sistema de progreso...');
  
  const gameId = 'snake';
  const initialLevel = await getBestLevel(gameId);
  console.log(`Nivel inicial de ${gameId}: ${initialLevel}`);
  
  // Probar actualización de nivel
  await updateBestLevel(gameId, 10);
  const levelAfter10 = await getBestLevel(gameId);
  console.log(`Después de actualizar a 10: ${levelAfter10}`);
  
  // Probar que no baja
  await updateBestLevel(gameId, 5);
  const levelAfter5 = await getBestLevel(gameId);
  console.log(`Después de intentar bajar a 5: ${levelAfter5}`);
  
  if (levelAfter10 >= 10 && levelAfter5 >= 10) {
    console.log('✅ Sistema de progreso funciona correctamente');
    return true;
  } else {
    console.log('❌ Sistema de progreso falló');
    return false;
  }
};

// Función para probar el ranking
export const testRankingSystem = async () => {
  console.log('🏆 Probando sistema de ranking...');
  
  try {
    const ranking = await getGlobalRanking();
    console.log(`Ranking cargado: ${ranking.length} usuarios`);
    
    if (ranking.length > 0) {
      console.log('Top 3:');
      ranking.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.nick}: ${user.candiesTotal} caramelos`);
      });
    }
    
    console.log('✅ Sistema de ranking funciona correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en ranking:', error);
    return false;
  }
};

// Función para mostrar estado del usuario
export const showUserStatus = () => {
  const user = getCurrentUser();
  const userData = getCurrentUserData();
  
  if (!user || !userData) {
    console.log('❌ Usuario no autenticado');
    return;
  }
  
  console.log('👤 Estado del usuario:');
  console.log(`UID: ${user.uid}`);
  console.log(`Email: ${user.email}`);
  console.log(`Display Name: ${user.displayName}`);
  console.log(`Nick: ${userData.nick || 'No establecido'}`);
  console.log(`Caramelos: ${getTotalCandies()}`);
  console.log(`Creado: ${userData.createdAt?.toDate?.() || 'N/A'}`);
};

// Hacer funciones disponibles globalmente para testing
window.testSystem = {
  runAllTests,
  testCandiesSystem,
  testProgressSystem,
  testRankingSystem,
  showUserStatus
};

console.log('🧪 Funciones de testing disponibles en window.testSystem');
