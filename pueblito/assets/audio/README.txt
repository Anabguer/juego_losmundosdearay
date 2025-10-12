🔊 EFECTOS DE SONIDO (OPCIONAL)
================================

Esta carpeta está reservada para efectos de sonido opcionales.

⚠️ IMPORTANTE: El juego ya incluye sonidos generados por código
   (usando Web Audio API), así que NO ES NECESARIO añadir archivos aquí.


SI QUIERES USAR AUDIO PERSONALIZADO:
-------------------------------------

Puedes añadir archivos MP3/OGG/WAV para:

- click.mp3    → Sonido de botones/taps
- coin.mp3     → Recoger moneda
- success.mp3  → Nivel completado / canasta
- fail.mp3     → Error / game over
- swish.mp3    → Lanzamiento de balón


FORMATO RECOMENDADO:
--------------------

- Formato: MP3 (mayor compatibilidad) u OGG (mejor calidad/peso)
- Duración: < 2 segundos
- Peso: < 50KB por archivo
- Sample rate: 44.1kHz o 48kHz


IMPLEMENTACIÓN:
---------------

Si añades archivos aquí, deberás modificar el archivo js/ui.js
en la función playSound() para cargar los archivos en lugar de
generar el sonido con oscillators.

Ejemplo de código modificado:

```javascript
const sounds = {
  click: new Audio('assets/audio/click.mp3'),
  coin: new Audio('assets/audio/coin.mp3'),
  // ... etc
};

export const playSound = (type) => {
  if (sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play().catch(e => console.warn(e));
  }
};
```


ESTADO ACTUAL:
--------------

✅ El juego funciona con sonidos sintéticos (Web Audio API)
❌ No requiere archivos de audio externos
💡 Esta carpeta es para futuras mejoras opcionales



