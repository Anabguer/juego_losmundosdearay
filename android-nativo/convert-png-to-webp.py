#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para convertir todos los archivos PNG a WebP y actualizar referencias
"""

import os
import re
import sys
from pathlib import Path
from PIL import Image

# Configurar codificación UTF-8 para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Directorio base
BASE_DIR = Path(__file__).parent
IMG_DIR = BASE_DIR / "app" / "src" / "main" / "assets" / "img"
ASSETS_DIR = BASE_DIR / "app" / "src" / "main" / "assets"

# Excluir archivos que son copias (contienen "copia" o " - copia")
EXCLUDE_PATTERNS = ["copia", " - copia", "Thumbs.db", "README", ".md"]

def should_convert(file_path):
    """Verificar si un archivo debe ser convertido"""
    # Convertir TODOS los PNG, incluso los que tienen "copia" en el nombre
    # Solo excluir archivos del sistema y documentación
    filename = file_path.name.lower()
    exclude = ["thumbs.db", "readme", ".md", ".txt"]
    for pattern in exclude:
        if pattern in filename:
            return False
    return True

def convert_png_to_webp(png_path):
    """Convertir un archivo PNG a WebP"""
    try:
        webp_path = png_path.with_suffix('.webp')
        
        # Cargar imagen PNG
        img = Image.open(png_path)
        
        # Convertir a RGB si tiene transparencia (RGBA)
        if img.mode == 'RGBA':
            # Mantener transparencia
            img.save(webp_path, 'WEBP', quality=85, method=6)
        elif img.mode in ('RGB', 'L'):
            img.save(webp_path, 'WEBP', quality=85, method=6)
        else:
            # Convertir a RGB si es otro modo
            img = img.convert('RGB')
            img.save(webp_path, 'WEBP', quality=85, method=6)
        
        # Obtener tamaños
        png_size = png_path.stat().st_size
        webp_size = webp_path.stat().st_size
        reduction = ((png_size - webp_size) / png_size) * 100
        
        print(f"✅ {png_path.name} → {webp_path.name} ({png_size//1024}KB → {webp_size//1024}KB, -{reduction:.1f}%)")
        return True
    except Exception as e:
        print(f"❌ Error convirtiendo {png_path.name}: {e}")
        return False

def find_all_png_files():
    """Encontrar todos los archivos PNG en img/"""
    png_files = []
    for root, dirs, files in os.walk(IMG_DIR):
        # NO excluir ninguna carpeta - convertir TODOS los PNG
        for file in files:
            if file.lower().endswith('.png'):
                file_path = Path(root) / file
                if should_convert(file_path):
                    png_files.append(file_path)
    return png_files

def update_references():
    """Actualizar referencias .png a .webp en todos los archivos"""
    extensions = ['.html', '.js', '.css', '.json']
    updated_files = set()
    total_replacements = 0
    
    for root, dirs, files in os.walk(ASSETS_DIR):
        # Excluir node_modules y otros directorios
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Reemplazar .png por .webp en rutas de imágenes
                    # Solo reemplazar si es parte de una ruta de imagen
                    patterns = [
                        (r'(["\'])([^"\']*?img[^"\']*?\.)png(\?[^"\']*)?(\1)', r'\1\2webp\3\4'),  # Entre comillas con posible query string
                        (r'(url\(["\']?)([^)]*?\.)png(\?[^)]*)?(["\']?\))', r'\1\2webp\3\4'),  # En url() con posible query string
                        (r'(src\s*=\s*["\'])([^"\']*?\.)png(\?[^"\']*)?(["\']?)', r'\1\2webp\3\4'),  # En src= con posible query string
                        (r'(href\s*=\s*["\'])([^"\']*?\.)png(\?[^"\']*)?(["\']?)', r'\1\2webp\3\4'),  # En href= con posible query string
                        (r'(image:)([^,}]*?\.)png(\?[^,}]*)?([,}])', r'\1\2webp\3\4'),  # En objetos JS con image:
                        (r'(\[)([^\]]*?\.)png(\?[^\]]*)?(\])', r'\1\2webp\3\4'),  # En arrays
                    ]
                    
                    for pattern, replacement in patterns:
                        new_content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
                        if new_content != content:
                            content = new_content
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        
                        replacements = len(re.findall(r'\.png', original_content, re.IGNORECASE)) - len(re.findall(r'\.webp', content, re.IGNORECASE))
                        total_replacements += replacements
                        updated_files.add(file_path.relative_to(ASSETS_DIR))
                        print(f"📝 Actualizado: {file_path.relative_to(ASSETS_DIR)} ({replacements} referencias)")
                        
                except Exception as e:
                    print(f"⚠️ Error procesando {file_path}: {e}")
    
    print(f"\n✅ Total: {len(updated_files)} archivos actualizados, {total_replacements} referencias cambiadas")
    return len(updated_files)

def main():
    print("🔄 Iniciando conversión PNG → WebP...\n")
    
    # Paso 1: Encontrar todos los PNG
    print("📋 Buscando archivos PNG...")
    png_files = find_all_png_files()
    print(f"✅ Encontrados {len(png_files)} archivos PNG para convertir\n")
    
    if not png_files:
        print("❌ No se encontraron archivos PNG para convertir")
        return
    
    # Paso 2: Convertir a WebP
    print("🔄 Convirtiendo archivos PNG a WebP...\n")
    converted = 0
    failed = 0
    
    for png_file in png_files:
        if convert_png_to_webp(png_file):
            converted += 1
        else:
            failed += 1
    
    print(f"\n✅ Conversión completada: {converted} exitosos, {failed} fallidos\n")
    
    # Paso 3: Actualizar referencias
    print("📝 Actualizando referencias en código...\n")
    update_references()
    
    print("\n🎉 ¡Conversión completada!")
    print("\n⚠️ NOTA: Los archivos PNG originales todavía existen.")
    print("   Revisa los cambios y luego elimina los archivos PNG si todo está correcto.")

if __name__ == "__main__":
    main()

