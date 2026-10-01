"""
Procesador de Sprites para 'La Vida Del Boxeo'
Este script toma spritesheets (o frames individuales), remueve el fondo (rembg/opencv), 
los ancla al piso (para evitar flotación o vibración), y exporta en WEBP optimizado.
Genera además un manifiesto JSON y un reporte de progreso en Markdown.
"""

import os
import sys
import hashlib
import json
import datetime
import cv2
import numpy as np
import argparse

# Intentar importar rembg (para quitar fondo con IA)
try:
    import rembg
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("[WARNING] rembg no está instalado. Se utilizará el método de fallback con OpenCV.")

# Intentar importar PIL (necesario para rembg)
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("[WARNING] Pillow (PIL) no está instalado. Asegúrese de instalarlo si usa rembg.")

# ==========================================
# CONSTANTES CONFIGURABLES
# ==========================================
CANVAS_SIZE = (512, 512)
Y_ANCHOR_OFFSET = 20
WEBP_QUALITY = 90
MAX_FILE_KB = 100

def slice_spritesheet(input_path, rows=4, cols=4):
    """
    Carga un spritesheet y lo divide en fotogramas.
    
    Args:
        input_path (str): Ruta de la imagen.
        rows (int): Filas en el spritesheet.
        cols (int): Columnas en el spritesheet.
        
    Returns:
        list: Lista de tuplas (frame_image, row_index, col_index)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"No se encontró el archivo: {input_path}")
        
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"No se pudo cargar la imagen: {input_path}")
        
    height, width = img.shape[:2]
    cell_w = width // cols
    cell_h = height // rows
    
    frames = []
    for r in range(rows):
        for c in range(cols):
            y_start, y_end = r * cell_h, (r + 1) * cell_h
            x_start, x_end = c * cell_w, (c + 1) * cell_w
            
            frame = img[y_start:y_end, x_start:x_end].copy()
            frames.append((frame, r, c))
            print(f"[SLICE] Extracted frame (row {r}, col {c}) — {cell_w}x{cell_h}px")
            
    return frames

def remove_background(frame):
    """
    Elimina el fondo del fotograma usando rembg si está disponible, 
    o un método básico de OpenCV de lo contrario.
    
    Args:
        frame (np.ndarray): Fotograma en formato BGR o BGRA.
        
    Returns:
        np.ndarray: Fotograma en formato BGRA con fondo transparente.
    """
    if REMBG_AVAILABLE and PIL_AVAILABLE:
        # Convertir OpenCV a PIL
        if len(frame.shape) == 3 and frame.shape[2] == 4:
            img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGRA2RGBA))
        else:
            img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
        result_pil = rembg.remove(img_pil)
        result_cv = cv2.cvtColor(np.array(result_pil), cv2.COLOR_RGBA2BGRA)
        print("[REMBG] Background removed — method: rembg")
        return result_cv
    else:
        # Fallback usando OpenCV
        if len(frame.shape) == 3 and frame.shape[2] == 4:
            bgr = frame[:, :, :3]
        else:
            bgr = frame
            
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        
        b, g, r = cv2.split(bgr)
        result = cv2.merge([b, g, r, mask])
        print("[REMBG] Background removed — method: opencv_fallback")
        return result

def align_to_ground(frame, canvas_size=(512,512), y_offset=20):
    """
    Extrae el sprite, lo recorta y lo pega en un nuevo lienzo de forma que
    el pie del luchador siempre esté a la misma distancia del fondo.
    
    Args:
        frame (np.ndarray): Fotograma BGRA.
        canvas_size (tuple): Tamaño del lienzo (ancho, alto).
        y_offset (int): Píxeles desde el borde inferior hasta el pie.
        
    Returns:
        tuple: (lienzo (np.ndarray), metadatos de alineación (dict))
    """
    canvas_w, canvas_h = canvas_size
    
    # Extraer alpha y encontrar el bounding box del contenido no transparente
    alpha = frame[:, :, 3]
    points = cv2.findNonZero(alpha)
    
    if points is None:
        # Si la imagen es totalmente transparente
        return np.zeros((canvas_h, canvas_w, 4), dtype=np.uint8), {}
        
    x, y, w, h = cv2.boundingRect(points)
    cropped = frame[y:y+h, x:x+w]
    
    # Calcular factor de escala para dejar márgenes (10px a los lados, y_offset abajo, 10px arriba)
    max_w = canvas_w - 20
    max_h = canvas_h - y_offset - 10
    
    scale_w = max_w / float(w)
    scale_h = max_h / float(h)
    scale = min(1.0, min(scale_w, scale_h))
    
    if scale < 1.0:
        new_w, new_h = int(w * scale), int(h * scale)
        cropped = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        new_w, new_h = w, h
        
    # Crear un canvas vacío
    canvas = np.zeros((canvas_h, canvas_w, 4), dtype=np.uint8)
    
    # Calcular posiciones
    paste_x = (canvas_w - new_w) // 2
    paste_y = canvas_h - new_h - y_offset
    
    # Pegar sprite en el lienzo
    canvas[paste_y:paste_y+new_h, paste_x:paste_x+new_w] = cropped
    
    meta = {
        'bbox': [x, y, w, h],
        'scale': scale,
        'paste_x': paste_x,
        'paste_y': paste_y,
        'foot_y': canvas_h - y_offset
    }
    
    print(f"[ALIGN] Anchored at Y={paste_y}, foot_line={canvas_h - y_offset}px, scale={scale:.3f}")
    return canvas, meta

def export_webp(frame, output_path, quality=90, max_kb=100):
    """
    Exporta el fotograma a formato WebP ajustando la calidad si excede el tamaño máximo.
    
    Args:
        frame (np.ndarray): Fotograma a exportar.
        output_path (str): Ruta de salida.
        quality (int): Calidad inicial.
        max_kb (int): Tamaño máximo en kilobytes.
        
    Returns:
        dict: Información sobre la exportación.
    """
    current_quality = quality
    min_quality = 50
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    while current_quality >= min_quality:
        cv2.imwrite(output_path, frame, [cv2.IMWRITE_WEBP_QUALITY, current_quality])
        size_bytes = os.path.getsize(output_path)
        size_kb = size_bytes / 1024.0
        
        if size_kb <= max_kb or current_quality == min_quality:
            break
            
        current_quality -= 5
        
    # Calcular hash SHA-256
    sha256_hash = hashlib.sha256()
    with open(output_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
            
    hash_hex = sha256_hash.hexdigest()
    passed = size_kb <= max_kb
    h, w = frame.shape[:2]
    
    info = {
        'path': str(output_path),
        'size_kb': round(size_kb, 2),
        'quality_used': current_quality,
        'sha256': hash_hex,
        'dimensions': (w, h),
        'passed': passed
    }
    
    print(f"[EXPORT] {os.path.basename(output_path)} — {size_kb:.1f} KB (Q{current_quality}) SHA256: {hash_hex[:16]}...")
    return info

def process_character(name, input_path, output_dir, poses=['idle', 'jab', 'hook', 'hit'], mode='spritesheet'):
    """
    Procesa un personaje a través del pipeline.
    Los archivos se guardan directamente en output_dir (no en subdirectorios)
    para ser compatibles con el motor Canvas que espera: sprite_{name}_{pose}_{idx}.webp
    """
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    
    if mode == 'spritesheet':
        if not os.path.isfile(input_path):
            print(f"[ERROR] Modo spritesheet: Archivo no encontrado {input_path}")
            return {'error': 'Input file not found', 'frames': []}
            
        print(f"=== Procesando {name} (Modo: Spritesheet) ===")
        cols = 4 
        rows = len(poses)
        frames = slice_spritesheet(input_path, rows=rows, cols=cols)
        
        for frame, r, c in frames:
            pose_name = poses[r] if r < len(poses) else f"pose_{r}"
            out_filename = f"sprite_{name}_{pose_name}_{c}.webp"
            out_path = os.path.join(output_dir, out_filename)
            
            processed = remove_background(frame)
            aligned, align_meta = align_to_ground(processed, CANVAS_SIZE, Y_ANCHOR_OFFSET)
            export_info = export_webp(aligned, out_path, WEBP_QUALITY, MAX_FILE_KB)
            
            results.append({
                'filename': out_filename,
                'pose': pose_name,
                'frame_idx': c,
                'align_meta': align_meta,
                'export_info': export_info
            })
            
    elif mode == 'individual':
        if not os.path.isdir(input_path):
            print(f"[ERROR] Modo individual: Directorio no encontrado {input_path}")
            return {'error': 'Input directory not found', 'frames': []}
            
        print(f"=== Procesando {name} (Modo: Individual) ===")
        files = [f for f in os.listdir(input_path) if os.path.isfile(os.path.join(input_path, f))]
        
        frame_idx = 0
        for filename in sorted(files):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) and name in filename.lower():
                in_path = os.path.join(input_path, filename)
                
                pose_name = "unknown"
                for p in poses:
                    if p in filename.lower():
                        pose_name = p
                        break
                
                out_filename = f"sprite_{name}_{pose_name}_{frame_idx}.webp"
                out_path = os.path.join(output_dir, out_filename)
                
                frame = cv2.imread(in_path, cv2.IMREAD_UNCHANGED)
                if frame is None:
                    continue
                    
                processed = remove_background(frame)
                aligned, align_meta = align_to_ground(processed, CANVAS_SIZE, Y_ANCHOR_OFFSET)
                export_info = export_webp(aligned, out_path, WEBP_QUALITY, MAX_FILE_KB)
                
                results.append({
                    'filename': out_filename,
                    'pose': pose_name,
                    'frame_idx': frame_idx,
                    'align_meta': align_meta,
                    'export_info': export_info,
                    'source': filename
                })
                frame_idx += 1
                
    return {'frames': results}

def generate_manifest(results_dict, output_path):
    """Genera y guarda un manifiesto JSON."""
    total_frames = 0
    passed = 0
    failed = 0
    
    for char, data in results_dict.items():
        if 'frames' in data:
            total_frames += len(data['frames'])
            for frame_data in data['frames']:
                if frame_data.get('export_info', {}).get('passed', False):
                    passed += 1
                else:
                    failed += 1
                    
    manifest = {
        'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
        'pipeline_version': '2.0.0',
        'validation_summary': {
            'total_frames': total_frames,
            'passed_count': passed,
            'failed_count': failed
        },
        'characters': results_dict
    }
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        
    print(f"Manifiesto guardado en {output_path}")

def generate_log_report(results_dict, log_path):
    """Genera un archivo Markdown con un reporte detallado."""
    os.makedirs(os.path.dirname(os.path.abspath(log_path)), exist_ok=True)
    
    with open(log_path, 'w', encoding='utf-8') as f:
        f.write("# Reporte de Procesamiento de Sprites\n\n")
        f.write(f"**Fecha:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Versión del Pipeline:** 2.0.0\n\n")
        
        for char, data in results_dict.items():
            f.write(f"## Personaje: {char.capitalize()}\n\n")
            if 'frames' not in data or not data['frames']:
                f.write("No hay fotogramas procesados.\n\n")
                continue
                
            f.write("| Archivo | Pose | Tamaño (KB) | Calidad | Validado | SHA-256 | Alineación (Y) |\n")
            f.write("|---------|------|-------------|---------|----------|---------|----------------|\n")
            
            for frame in data['frames']:
                info = frame.get('export_info', {})
                meta = frame.get('align_meta', {})
                
                filename = frame.get('filename', 'N/A')
                pose = frame.get('pose', 'N/A')
                size = info.get('size_kb', 0)
                qual = info.get('quality_used', 'N/A')
                passed = "✅" if info.get('passed', False) else "❌"
                sha = info.get('sha256', '')[:8] + "..."
                foot_y = meta.get('foot_y', 'N/A')
                
                f.write(f"| {filename} | {pose} | {size} | Q{qual} | {passed} | `{sha}` | {foot_y} |\n")
            f.write("\n")
            
    print(f"Reporte log guardado en {log_path}")

def main():
    """Bloque principal de ejecución."""
    parser = argparse.ArgumentParser(description="Procesador de Sprites - Pipeline MLOps")
    parser.add_argument('--input-tito', type=str, help='Ruta de entrada para Tito')
    parser.add_argument('--input-chacal', type=str, help='Ruta de entrada para Chacal')
    parser.add_argument('--output-dir', type=str, default='assets/sprites/', help='Directorio base de salida')
    parser.add_argument('--mode', type=str, choices=['spritesheet', 'individual'], default='spritesheet', help='Modo de procesamiento')
    
    args = parser.parse_args()
    
    base_output = os.path.abspath(args.output_dir)
    manifest_path = os.path.join(base_output, 'manifest.json')
    log_path = os.path.abspath('.ai-memory/LOGS_PROGRESO.md')
    
    poses = ['idle', 'jab', 'hook', 'hit']
    results = {}
    
    if args.input_tito:
        tito_path = os.path.abspath(args.input_tito)
        results['tito'] = process_character('tito', tito_path, base_output, poses, mode=args.mode)
    
    if args.input_chacal:
        chacal_path = os.path.abspath(args.input_chacal)
        results['chacal'] = process_character('chacal', chacal_path, base_output, poses, mode=args.mode)
        
    if not results:
        print("[INFO] No se proporcionaron rutas de entrada. Use --input-tito o --input-chacal.")
        return
        
    generate_manifest(results, manifest_path)
    generate_log_report(results, log_path)
    
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        total = manifest['validation_summary']['total_frames']
        passed = manifest['validation_summary']['passed_count']
        failed = manifest['validation_summary']['failed_count']
        
        print("\n=== RESUMEN FINAL ===")
        print(f"Total fotogramas procesados: {total}")
        print(f"Aprobados (<{MAX_FILE_KB}KB): {passed}")
        print(f"Fallidos: {failed}")
        print("=====================")

if __name__ == '__main__':
    main()
