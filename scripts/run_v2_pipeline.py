"""
Orquestador del Pipeline V2 Completo — OT-FASE2-001
Ejecuta en orden:
  1. Generación de sprite sheets 4x4 (generate_v2_spritesheet.py)
  2. Procesamiento MLOps (sprite_processor.py) — Slicing, Rembg, Alignment, Export
  3. Copia de frames finales al directorio del motor Canvas
  4. Registro en .ai-memory/LOGS_PROGRESO.md
"""

import os
import sys
import shutil
import subprocess
import datetime

WORKSPACE = r"E:\Juego La Vida Del Boxeo\workspace"
VENV_PYTHON = r"E:\IA_Grafica_LVDB\venv\Scripts\python.exe"
SPRITES_DIR = os.path.join(WORKSPACE, "assets", "sprites")
SCRIPTS_DIR = os.path.join(WORKSPACE, "scripts")

def run_script(script_name, args=None, cwd=None):
    """Ejecuta un script Python con el venv de IA Gráfica."""
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    cmd = [VENV_PYTHON, script_path]
    if args:
        cmd.extend(args)
    
    print(f"\n{'='*60}")
    print(f"[EXEC] {script_name} {' '.join(args or [])}")
    print(f"{'='*60}")
    
    result = subprocess.run(
        cmd,
        cwd=cwd or WORKSPACE,
        capture_output=False,
        text=True
    )
    
    if result.returncode != 0:
        print(f"[ERROR] {script_name} terminó con código {result.returncode}")
        return False
    return True

def copy_processed_to_final():
    """
    Copia los frames procesados desde subdirectorios (tito/, chacal/) 
    al directorio raíz de sprites para el motor Canvas.
    """
    print(f"\n{'='*60}")
    print("[DEPLOY] Copiando frames procesados al directorio del motor Canvas")
    print(f"{'='*60}")
    
    copied = 0
    for char_dir in ['tito', 'chacal']:
        source_dir = os.path.join(SPRITES_DIR, char_dir)
        if not os.path.exists(source_dir):
            print(f"  [SKIP] {source_dir} no existe")
            continue
        
        for filename in os.listdir(source_dir):
            if filename.endswith('.webp'):
                src = os.path.join(source_dir, filename)
                dst = os.path.join(SPRITES_DIR, filename)
                shutil.copy2(src, dst)
                size_kb = os.path.getsize(dst) / 1024
                print(f"  [COPY] {filename} -> sprites/ ({size_kb:.1f} KB)")
                copied += 1
    
    print(f"  [OK] {copied} frames desplegados")
    return copied

def main():
    global VENV_PYTHON
    print("=" * 60)
    print("  OT-FASE2-001 — PIPELINE V2 COMPLETO")
    print(f"  Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 60)
    
    # Verificar venv
    if not os.path.exists(VENV_PYTHON):
        print(f"[ERROR] Python del venv no encontrado: {VENV_PYTHON}")
        print("[INFO] Intentando con python del sistema...")
        VENV_PYTHON = sys.executable
    
    # PASO 1: Generar sprite sheets
    print("\n[FASE 1/4] Generación de Sprite Sheets 4x4")
    gen_ok = run_script("generate_v2_spritesheet.py")
    if not gen_ok:
        print("[ABORT] La generación falló. Pipeline detenido.")
        sys.exit(1)
    
    # PASO 2: Procesar con pipeline MLOps
    tito_raw = os.path.join(SPRITES_DIR, "tito_spritesheet_raw.png")
    chacal_raw = os.path.join(SPRITES_DIR, "chacal_spritesheet_raw.png")
    
    print("\n[FASE 2/4] Procesamiento MLOps (Slice → Rembg → Align → Export)")
    proc_args = [
        "--input-tito", tito_raw,
        "--input-chacal", chacal_raw,
        "--output-dir", SPRITES_DIR,
        "--mode", "spritesheet"
    ]
    proc_ok = run_script("sprite_processor.py", proc_args)
    if not proc_ok:
        print("[WARN] El procesador reportó errores.")
    
    # PASO 3: Copiar al directorio del motor
    print("\n[FASE 3/4] Despliegue al directorio del motor Canvas")
    copy_processed_to_final()
    
    # PASO 4: Log final
    print("\n[FASE 4/4] Registro completado")
    print(f"  Manifiesto: {SPRITES_DIR}/manifest.json")
    print(f"  Log: {WORKSPACE}/.ai-memory/LOGS_PROGRESO.md")
    
    print("\n" + "=" * 60)
    print("  PIPELINE V2 FINALIZADO EXITOSAMENTE")
    print("=" * 60)


if __name__ == '__main__':
    main()
