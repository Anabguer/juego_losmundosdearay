# Playbook para Cursor — **Modo Descubrimiento → Validación → Implementación**
Android nativo + WebView + Firebase (Google Sign‑In opcional, Nick opcional, Ranking opcional) - **ESTRUCTURA MULTI-APP**

> **Regla de oro:** NO avances a la siguiente fase sin el ✅ de Neni.  
> Todo cambio debe ir precedido por *"PROPUESTA" → "APROBACIÓN" → "EJECUCIÓN"*.  
> **CRÍTICO:** NUNCA asumas qué datos guarda el juego. SIEMPRE pregunta a Neni.

---

## 🔶 FASE 0 — Higiene del proyecto (Gate G0)
**Objetivo:** Garantizar base limpia; nada de Capacitor mezclado.

- [ ] Eliminar restos de Capacitor: `android/`, `ios/`, `capacitor.config.*`, `/plugins`, etc.  
- [ ] **PREGUNTAR APP_ID:** ¿Cuál es el identificador único de esta app? (ej: "aray", "memoflip", "puzzle", etc.)
- [ ] Crear **proyecto Android nativo** (o `android-nativo/`) con:
  - `app/src/main/assets/` → juego HTML/JS/CSS completo.
  - `google-services.json` en `app/` (lo dará Neni tras huellas).
  - Activities: `MainActivity`, `LoginActivity` (si hay Google), `NickSetupActivity` (si hay nick), `RankingActivity` (si hay ranking), `GameBridge`.
  - Gradle compatible **JDK 17**.  
- [ ] Subir `versionCode`.  
**Entrega:** captura de estructura y `build.gradle` del módulo.  
**Gate G0:** esperar ✅ de Neni.

---

## 🔎 FASE 1 — Descubrimiento de datos (Gate G1)
**Objetivo:** detectar QUÉ datos guarda el juego hoy y QUÉ se deben persistir online.

1) **Auditoría del juego (solo lectura):**
   - Buscar en el código **todas** las escrituras/lecturas a `localStorage`, `sessionStorage`, IndexedDB, cookies, o variables globales que representen progreso/estadística (ej.: `bestLevel`, `coins/candies`, `score`, `unlocks`, `settings`, etc.).
   - Para cada minijuego: identificar **gameId**, métrica principal y si **solo aumenta** (p.ej. `bestLevel`) o puede subir/bajar.

2) **Volcado en TABLA (pegar a Neni):**
   | gameId | Dónde se guarda ahora (archivo/línea) | Clave local | Tipo | Regla de negocio | Persistir online | Observaciones |
   |---|---|---|---|---|---|---|
   | `snake` | `js/snake.js:120` | `bestLevel` | number | solo aumenta | ✅/❌ | ... |

3) **Opcionales del proyecto (preguntar a Neni):**
   - **Google Sign‑In**: ✅/❌
   - **Nick único visible**: ✅/❌
   - **Ranking global**: ✅/❌ (si ✅, ¿por qué métrica? ej: puntos, monedas, nivel, etc.)
   - **O ranking por juego**: ✅/❌ (si ✅, especificar métrica y top X)
   - **Soporte offline** (Firestore cache): ✅ recomendado
   - **Anonimato (sin email visible)**: por defecto ✅ (solo nick)
   - **¿Qué tipo de datos guarda este juego?** (puntos, monedas, niveles, desbloqueos, etc.)
   - **¿Cómo se llama la métrica principal?** (scoreTotal, coinsTotal, levelTotal, etc.)

**Entrega:** archivo `DATASPEC.md` con la tabla completa + preguntas marcadas.  
**Gate G1:** esperar ✅ de Neni sobre **qué** persistir y **qué features** activar.

---

## 🧱 FASE 2 — Diseño de modelo y contratos (Gate G2)
**Objetivo:** definir colecciones/documents y contrato nativo⇄web.

1) **Propuesta de modelo (baseline MULTI-APP):**
   - `apps/{APP_ID}/users/{uid}`: `{ nick: string, [METRICA_PRINCIPAL]: number, createdAt, lastSeen }` *(donde [METRICA_PRINCIPAL] es lo que defina Neni)*
   - `apps/{APP_ID}/nicks/{lowerNick}`: `{ uid, nick, createdAt }` (único por app)
   - `apps/{APP_ID}/progress/{uid}_{gameId}`: `{ [METRICA_JUEGO]: number, updatedAt }` *(donde [METRICA_JUEGO] es lo que defina Neni)*
   - Si Neni elige ranking por juego: colección `apps/{APP_ID}/leaderboard_{gameId}` o query sobre `progress` (proponer).

2) **Contrato `GameBridge` (solo lo que aplique):**
   - `openRanking()` → controla login si es necesario y abre ranking.
   - `getTop20()` → solo si hay ranking; devuelve `[{uid, nick, [METRICA_PRINCIPAL]}]` *(donde [METRICA_PRINCIPAL] es lo que defina Neni)*.
   - `add[METRICA](delta)` → valida `delta>0`, suma solo hacia arriba *(donde [METRICA] es lo que defina Neni, ej: addCoins, addPoints, addLevel)*.
   - `updateBestLevel(gameId, level)` → actualiza si `level` es mayor.
   - `getUser()` → `{uid, nick, [METRICA_PRINCIPAL]}` o `null` si anónimo *(donde [METRICA_PRINCIPAL] es lo que defina Neni)*.
   - `setNick(nick)` → reserva transaccional en `apps/{APP_ID}/nicks/`.

3) **Reglas Firestore (resumen de seguridad MULTI-APP):**
   - Cada usuario **solo** escribe en su `uid` dentro de su app.
   - `[METRICA_PRINCIPAL]` y `[METRICA_JUEGO]` **no decrecen** *(donde [METRICA] es lo que defina Neni)*.
   - `nicks` único **por app** (transacción o fallo controlado).
   - Estructura: `apps/{appId}/...` para separar datos entre apps.

**Entrega:** `MODEL_AND_BRIDGE.md`.  
**Gate G2:** esperar ✅ de Neni.

---

## 🧩 FASE 3 — Implementación controlada (Gate G3)
**Objetivo:** implementar **solo** lo aprobado.

- [ ] **Definir APP_ID:** `private static final String APP_ID = "nombre_app";` en todas las clases.
- [ ] Integrar Google Sign‑In si está aprobado. **Usar `default_web_client_id` de `strings.xml`** (nunca hardcode).  
- [ ] Persistencia offline habilitada (si aplica).  
- [ ] `GameBridge` con `try/catch` + `runOnUiThread`.  
- [ ] **CRÍTICO: Verificación de login en getTop20():**
  ```java
  @JavascriptInterface
  public String getTop20() {
      // SIEMPRE verificar el estado actual del usuario
      currentUser = mAuth.getCurrentUser();
      
      if (currentUser == null) {
          // Usuario no logueado, iniciar flujo de login
          activity.runOnUiThread(() -> activity.showRanking());
          return "[]";
      }
      
      // Usuario logueado, cargar ranking
      loadRanking();
      return "[]";
  }
  ```
- [ ] **CRÍTICO: isUserLoggedIn() siempre actualizado:**
  ```java
  public boolean isUserLoggedIn() {
      currentUser = mAuth.getCurrentUser(); // Siempre verificar estado actual
      return currentUser != null;
  }
  ```
- [ ] **ELEGIR ESTRUCTURA (IMPORTANTE):**
  - **Opción A - Estructura simple (recomendada para empezar):**
    ```java
    db.collection("users").document(uid)
    db.collection("progress").document(progressId)
    db.collection("nicks").document(lowerNick)
    ```
  - **Opción B - Estructura multi-app (para múltiples juegos):**
    ```java
    db.collection("apps").document(APP_ID).collection("users").document(uid)
    db.collection("apps").document(APP_ID).collection("progress").document(progressId)
    db.collection("apps").document(APP_ID).collection("nicks").document(lowerNick)
    ```
- [ ] `NickSetupActivity` con **transacción** (ajustar según estructura elegida):
  ```java
  // Para estructura simple:
  db.runTransaction(t -> {
    DocumentReference nickRef = db.collection("nicks").document(lowerNick);
    if (t.get(nickRef).exists()) throw new IllegalStateException("NICK_TAKEN");
    t.set(nickRef, Map.of("uid", uid, "nick", nick, "createdAt", FieldValue.serverTimestamp()));
    t.set(db.collection("users").document(uid),
          Map.of("nick", nick, "[METRICA_PRINCIPAL]", FieldValue.increment(0), // Donde [METRICA_PRINCIPAL] es lo que defina Neni
                 "lastSeen", FieldValue.serverTimestamp()),
          SetOptions.merge());
    return null;
  });
  ```
- [ ] `RankingActivity`: **NO** `toObjects(Map.class)`; iterar docs o POJO.
- [ ] Cargar assets desde `app/src/main/assets/` (o `www/`) y ruta correcta (`file:///android_asset/...` o `WebViewAssetLoader`).

**Entrega:** APK `versionCode`+1 y notas de cambios.  
**Gate G3:** Neni prueba y ✅/♻️.

---

## 🧪 FASE 4 — Testing guiado (Gate G4)
**Checklist de pruebas (Neni):**
- [ ] Ranking → **login** Google correcto (aparezco en Authentication).
- [ ] **Nick**: si existe, muestra error sin crash.
- [ ] **Top‑20**: carga sin petar y con nulos controlados.
- [ ] **Suma de [METRICA]**: nunca negativo; refleja en ranking (si existe) *(donde [METRICA] es lo que defina Neni)*.
- [ ] **bestLevel**: solo sube.
- [ ] **Offline**: jugar sin Internet y sincroniza al volver.
- [ ] **Multi-app**: datos separados por APP_ID (no se mezclan entre apps).

**Entrega:** APK final / AAB + `./gradlew signingReport` (SHA‑1/SHA‑256).  
**Gate G4:** ✅ de Neni → OK.

---

## 📦 Entregables estándar por fase
- **G0:** estructura + Gradle + APP_ID definido.  
- **G1:** `DATASPEC.md` (tabla de datos).  
- **G2:** `MODEL_AND_BRIDGE.md` (modelo + contrato).  
- **G3:** APK con notas.  
- **G4:** APK/AAB final + huellas.

---

## 🧰 Fragmentos de código que suelen romperse (usar tal cual)
- **GoogleSignInOptions**: usar `getString(R.string.default_web_client_id)`.
- **Ranking (iterar) MULTI-APP**:
  ```java
  db.collection("apps").document(APP_ID).collection("users")
    .orderBy("[METRICA_PRINCIPAL]", Query.Direction.DESCENDING).limit(20).get() // Donde [METRICA_PRINCIPAL] es lo que defina Neni
    .addOnSuccessListener(snap -> {
      List<RankingItem> items = new ArrayList<>();
      for (QueryDocumentSnapshot d : snap) {
        String nick = d.getString("nick");
        Long metric = d.getLong("[METRICA_PRINCIPAL]"); // Donde [METRICA_PRINCIPAL] es lo que defina Neni
        items.add(new RankingItem(d.getId(), nick != null ? nick : "Jugador", metric != null ? metric : 0L));
      }
      adapter.submitList(items);
    })
    .addOnFailureListener(this::showError);
  ```
- **Nick único (transacción) MULTI-APP**: ver bloque en Fase 3.
- **Cargar assets**: confirmar ruta real y existencia de `index.html`.

---

## 🔥 Reglas Firestore (usar tal cual)

### **OPCIÓN A - Estructura Simple (recomendada para empezar):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Estructura: users/{uid}
    match /users/{uid} {
      allow read: if true; // Ranking público
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Estructura: progress/{uid}_{gameId}
    match /progress/{docId} {
      allow read: if true; // Progreso público para ranking
      allow write: if request.auth != null;
    }

    // Estructura: nicks/{lowerNick}
    match /nicks/{lowerNick} {
      allow read: if true; // Verificar disponibilidad de nick
      allow create: if request.auth != null &&
                    !exists(/databases/$(database)/documents/nicks/$(lowerNick));
      allow update: if request.auth != null;
      allow delete: if false; // No permitir eliminar nicks
    }
  }
}
```

### **OPCIÓN B - Estructura Multi-App (para múltiples juegos):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Estructura: apps/{appId}/users/{uid}
    match /apps/{appId}/users/{uid} {
      allow read: if true; // Ranking público
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Estructura: apps/{appId}/progress/{uid}_{gameId}
    match /apps/{appId}/progress/{docId} {
      allow read: if true; // Progreso público para ranking
      allow write: if request.auth != null;
    }

    // Estructura: apps/{appId}/nicks/{lowerNick}
    match /apps/{appId}/nicks/{lowerNick} {
      allow read: if true; // Verificar disponibilidad de nick
      allow create: if request.auth != null &&
                    !exists(/databases/$(database)/documents/apps/$(appId)/nicks/$(lowerNick));
      allow update: if request.auth != null;
      allow delete: if false; // No permitir eliminar nicks
    }
  }
}
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: Ranking se muestra vacío sin pedir login**
**Síntomas:** Al tocar Ranking, se abre directamente sin verificar si hay usuario logueado.
**Causa:** `getTop20()` no verifica correctamente el estado del usuario.
**Solución:** Usar el código CRÍTICO de la Fase 3 para `getTop20()` e `isUserLoggedIn()`.

### **Problema 2: "Error en el ranking" o ranking vacío**
**Síntomas:** Ranking aparece pero sin datos, o mensaje de error.
**Causas posibles:**
- Reglas de Firestore no permiten leer datos
- Estructura de colecciones incorrecta
- Usuario no logueado pero ranking se muestra
**Solución:** 
1. Verificar reglas de Firestore (usar las del documento)
2. Verificar que las colecciones se crean automáticamente
3. Asegurar que `getTop20()` verifica login

### **Problema 3: "Iniciando sesión..." se queda colgado**
**Síntomas:** Login de Google se inicia pero no completa.
**Causas posibles:**
- `google-services.json` incorrecto o desactualizado
- SHA-1/SHA-256 no añadidos a Firebase
- Web Client ID incorrecto
**Solución:**
1. Verificar `google-services.json` en `app/`
2. Ejecutar `./gradlew signingReport` y añadir SHA a Firebase
3. Verificar `default_web_client_id` en `strings.xml`

### **Problema 4: Colecciones no se crean automáticamente**
**Síntomas:** Error al crear usuario o nick, colecciones no existen.
**Causa:** Reglas de Firestore muy restrictivas.
**Solución:** Usar las reglas del documento que permiten creación automática.

### **Problema 5: Datos no se sincronizan entre apps**
**Síntomas:** Si usas estructura multi-app, datos se mezclan entre juegos.
**Causa:** Mismo APP_ID o estructura incorrecta.
**Solución:** Cada app debe tener APP_ID único y usar estructura `apps/{APP_ID}/...`

## 🧯 Protocolo de bloqueo
- Si falla algo, **parar**, subir logs de `AndroidRuntime/FATAL EXCEPTION` y abrir mini‑PR con el fix **acotado**.  
- Nada de cambios masivos sin Gate ✅ de Neni.
- **SIEMPRE probar login/logout antes de continuar** a la siguiente fase.

---

## 🎯 **CAMBIOS PRINCIPALES EN ESTA VERSIÓN:**
1. **APP_ID obligatorio** en Fase 0
2. **Dos opciones de estructura:** Simple (recomendada) y Multi-app
3. **Código CRÍTICO** para verificación de login en `getTop20()` e `isUserLoggedIn()`
4. **Reglas de seguridad** para ambas estructuras
5. **Sección de problemas comunes** con soluciones específicas
6. **Protocolo de testing** mejorado con verificación de login/logout
7. **Separación de datos** entre diferentes apps (si se usa estructura multi-app)
8. **GUÍA COMPLETAMENTE GENÉRICA** - No asume qué datos guarda cada juego

---

## 🚨 **RECORDATORIO CRÍTICO:**
**NUNCA implementes nada sin preguntar a Neni:**
- ¿Qué tipo de datos guarda este juego? (puntos, monedas, niveles, etc.)
- ¿Cómo se llama la métrica principal? (scoreTotal, coinsTotal, levelTotal, etc.)
- ¿Qué tipo de ranking quiere? (global, por juego, etc.)
- ¿Qué funcionalidades específicas necesita? (login, nick, ranking, etc.)

**Esta guía es un template genérico. Cada juego es único y requiere personalización.**
