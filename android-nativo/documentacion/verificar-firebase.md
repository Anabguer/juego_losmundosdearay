# 🔥 Verificación de Firebase Configuration

## SHA-1 Fingerprint (Debug)
```
6D:F1:0E:F5:A5:09:76:8B:A3:ED:84:36:44:F5:24:D4:9E:E0:0C:0D
```

## Configuración actual:
- **Package Name**: `com.intocables.losmundosdearay`
- **Web Client ID**: `439019722673-5hh2hf83mf336fcpru8m2i9i9ooh2j33.apps.googleusercontent.com`
- **Project ID**: `intocables13`

## Pasos para verificar en Firebase Console:

1. **Ir a Firebase Console**: https://console.firebase.google.com/
2. **Seleccionar proyecto**: `intocables13`
3. **Ir a Project Settings** (⚙️)
4. **Pestaña "General"**
5. **Sección "Your apps"**
6. **Seleccionar la app Android**: `com.intocables.losmundosdearay`
7. **Verificar que el SHA-1 esté configurado**:
   ```
   6D:F1:0E:F5:A5:09:76:8B:A3:ED:84:36:44:F5:24:D4:9E:E0:0C:0D
   ```

## Si el SHA-1 no está configurado:
1. **Hacer clic en "Add fingerprint"**
2. **Pegar el SHA-1**: `6D:F1:0E:F5:A5:09:76:8B:A3:ED:84:36:44:F5:24:D4:9E:E0:0C:0D`
3. **Guardar**

## Verificar OAuth 2.0:
1. **Ir a Google Cloud Console**: https://console.cloud.google.com/
2. **Seleccionar proyecto**: `intocables13`
3. **APIs & Services > Credentials**
4. **Verificar que existe un "OAuth 2.0 Client ID" para Android**
5. **Package name**: `com.intocables.losmundosdearay`
6. **SHA-1**: `6D:F1:0E:F5:A5:09:76:8B:A3:ED:84:36:44:F5:24:D4:9E:E0:0C:0D`

## Error 10 - Posibles causas:
- SHA-1 fingerprint no configurado en Firebase Console
- SHA-1 fingerprint no configurado en Google Cloud Console
- Package name incorrecto
- Web Client ID incorrecto
- App no habilitada en Google Cloud Console
