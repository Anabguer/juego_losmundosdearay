#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para eliminar archivos PNG originales después de la conversión a WebP
"""

import os
import sys
from pathlib import Path

# Configurar codificación UTF-8 para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

BASE_DIR = Path(__file__).parent
IMG_DIR = BASE_DIR / "app" / "src" / "main" / "assets" / "img"

# Archivos a NO eliminar (por si acaso)
KEEP_FILES = ["reloj.png"]  # Este falló la conversión

def delete_png_files():
    """Eliminar todos los archivos PNG excepto los que están en KEEP_FILES"""
    deleted_count = 0
    kept_count = 0
    errors = []
    
    print("🗑️ Buscando archivos PNG para eliminar...\n")
    
    for root, dirs, files in os.walk(IMG_DIR):
        for file in files:
            if file.lower().endswith('.png'):
                file_path = Path(root) / file
                
                # Verificar si debemos mantenerlo
                if file in KEEP_FILES:
                    print(f"⏭️  Manteniendo: {file_path.relative_to(BASE_DIR)}")
                    kept_count += 1
                    continue
                
                # Verificar si existe el WebP correspondiente
                webp_path = file_path.with_suffix('.webp')
                if webp_path.exists():
                    try:
                        file_path.unlink()
                        deleted_count += 1
                        print(f"✅ Eliminado: {file_path.relative_to(BASE_DIR)}")
                    except Exception as e:
                        errors.append((file_path, str(e)))
                        print(f"❌ Error eliminando {file_path.relative_to(BASE_DIR)}: {e}")
                else:
                    print(f"⚠️  Sin WebP correspondiente, manteniendo: {file_path.relative_to(BASE_DIR)}")
                    kept_count += 1
    
    print(f"\n📊 Resumen:")
    print(f"   ✅ Eliminados: {deleted_count}")
    print(f"   ⏭️  Mantenidos: {kept_count}")
    if errors:
        print(f"   ❌ Errores: {len(errors)}")
    
    return deleted_count

if __name__ == "__main__":
    # Eliminar automáticamente sin confirmación
    delete_png_files()
    print("\n🎉 ¡Proceso completado!")

