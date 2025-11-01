# Alta rápida – Login con Google (Firebase)

**Package (applicationId):** `com.intocables.losmundosdearay`

## Huellas detectadas
- **SHA-1 debug:** `6D:F1:0E:F5:A5:09:76:8B:A3:ED:84:36:44:F5:24:D4:9E:E0:0C:0D` (TEMPORALES)
- **SHA-256 debug:** `FE:15:85:7F:7D:B3:01:D8:88:FC:7B:42:66:E5:16:FB:BE:28:22:57:CD:3F:8E:E3:B9:5E:85:B5:18:C0:0D:3A` (TEMPORALES)

## Paso 1 – Firebase
1) Firebase Console → Configuración del proyecto → Tus apps → Android → registrar `com.intocables.losmundosdearay`.
2) Añadir la huella disponible:
   - Usar **SHA-1 debug** (temporal): `6D:F1:0E:F5:A5:09:76:8B:A3:ED:84:36:44:F5:24:D4:9E:E0:0C:0D`
3) Descargar `google-services.json` y colocarlo en `app/google-services.json`.

## Paso 2 – Google Cloud
- La credencial OAuth Android aparece en el proyecto vinculado a Firebase.
- Verificar en Cloud → APIs & Services → Credentials.

## Paso 3 – Play App Signing (cuando subas el primer AAB)
- Copiar el **SHA-1 de App signing key** desde Play Console → Integridad de la app.
- Añadirlo también en Firebase (Huellas SHA) y **descargar de nuevo** `google-services.json`.

## Notas
- Si hoy usamos DEBUG, crear luego el keystore de release y reemplazar la huella en Firebase.
- Errores típicos: json equivocado, applicationId distinto, falta plugin google-services.