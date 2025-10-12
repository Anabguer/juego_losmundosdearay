<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0e1320">
  <meta name="description" content="Los Mundos de Aray - Explora el pueblo navegable">
  <title>🌟 Los Mundos de Aray</title>
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
  
  <!-- Header / HUD -->
  <header class="game-header">
    <h1>🌟 Aray</h1>
    <div class="hud-chips">
      <div class="chip">
        <img src="assets/img/ui/fresa_punto.svg" alt="🍓" class="candy-icon" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
        <span style="display:none;">🍓</span>
        <span id="hud-coins">0</span>
      </div>
      <div class="chip">
        <span class="chip-icon">⚡</span>
        <span id="hud-energy">100</span>
      </div>
      <button class="btn btn-small btn-primary" id="btn-eat">
        🍽️ Comer
      </button>
    </div>
  </header>
  
  <!-- Barra de energía -->
  <div class="energy-bar">
    <div class="energy-bar-fill" id="energy-bar-fill"></div>
  </div>
  
  <!-- Mapa del pueblo -->
  <main class="map-container">
    <div id="map" class="map">
      <!-- Los tiles se generarán dinámicamente -->
    </div>
    
    <!-- Avatar de Aray -->
    <div id="avatar" class="avatar"></div>
    
    <!-- Instrucciones -->
    <div class="map-instructions">
      <p>🏘️ Toca los edificios para visitarlos</p>
      <p>⚡ Cada paso gasta energía</p>
    </div>
  </main>
  
  <!-- Scripts -->
  <script type="module">
    import { initMap } from './js/map.js';
    import { getCoins, getEnergy } from './js/storage.js';
    import { updateHUD, initCommonUI } from './js/ui.js';
    
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
      initCommonUI();
      updateHUD();
      initMap();
    });
  </script>
  
</body>
</html>