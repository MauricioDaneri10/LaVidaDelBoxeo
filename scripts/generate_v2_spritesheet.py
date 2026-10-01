"""
Generador de Sprite Sheets V2 para 'La Vida Del Boxeo'
Motor: SD-Turbo via diffusers (E:\\IA_Grafica_LVDB\\venv)
Pipeline: Genera 4x4 grillas (16 frames) por personaje

Cada fila = 1 pose (4 frames de micro-animación)
  Fila 0: Idle (guardia, respiración leve)
  Fila 1: Jab (recto de izquierda)
  Fila 2: Hook (gancho de derecha)
  Fila 3: Hit (impacto recibido)

Cada columna = 1 frame de la secuencia de animación

Salida: Archivo PNG 2048x2048 (4x4 celdas de 512x512)
"""

import os
import sys

# Forzar codificación UTF-8 en Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import torch
import numpy as np
from PIL import Image

try:
    from diffusers import AutoPipelineForText2Image
    print("[INIT] diffusers disponible.")
except ImportError:
    print("[ERROR] diffusers no instalado. Ejecuta: pip install diffusers transformers accelerate")
    sys.exit(1)

try:
    from rembg import remove as remove_bg
    HAS_REMBG = True
    print("[INIT] rembg disponible para canal alfa.")
except ImportError:
    HAS_REMBG = False
    print("[WARN] rembg no disponible.")


# =============================================================
# CONFIGURACIÓN DE PROMPTS — IDENTIDAD VISUAL FIJA
# =============================================================

NEGATIVE_PROMPT = (
    "(photorealistic:1.3), (3d render:1.2), ugly, deformed eyes, extra fingers, "
    "mutated hands, four arms, 4 arms, multiple arms, extra limbs, bad anatomy, "
    "deformed body, deformed arms, missing fingers, fused fingers, "
    "lowres, pixel art, photograph, realistic, blurry, "
    "background_elements, text, logo, watermark, duplicate, two people, messy background"
)

STYLE_BASE = (
    "clean 2D cel-shaded vector cartoon character art, bold black outlines, "
    "vibrant flat colors, mobile tycoon game style, high definition, "
    "isolated on solid plain white background, single character, "
    "exactly two arms, normal human anatomy, full body visible head to feet"
)

# --- TITO V2: Identidad Visual ---
TITO_IDENTITY = (
    "Young athletic Latino boxer named Tito with short dark spiky hair, "
    "confident determined expression, adhesive bandage on cheek, "
    "wearing bright RED boxing gloves, RED boxing shorts with white waistband "
    "and white trim, RED boxing boots with white laces, muscular lean build"
)

TITO_POSES = {
    'idle': [
        f"{TITO_IDENTITY}, standing in boxing guard stance facing left 3/4 view, "
        f"gloves up protecting face, weight balanced on both feet, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, standing in boxing guard stance facing left 3/4 view, "
        f"gloves slightly lowered from guard, subtle exhale pose, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, standing in boxing guard stance facing left 3/4 view, "
        f"gloves up tight guard, slight lean forward ready position, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, standing in boxing guard stance facing left 3/4 view, "
        f"gloves at chin level, relaxed breathing moment, {STYLE_BASE}",
    ],
    'jab': [
        f"{TITO_IDENTITY}, beginning to throw left jab punch, left arm cocking back, "
        f"body coiling, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, mid-throw left jab, left arm extending forward halfway, "
        f"body rotating, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, fully extended left jab punch, left arm straight out, "
        f"right glove guarding chin, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, retracting from left jab punch, left arm pulling back, "
        f"returning to guard position, facing left, {STYLE_BASE}",
    ],
    'hook': [
        f"{TITO_IDENTITY}, winding up for right hook punch, right arm pulled back, "
        f"hip rotating, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, throwing right hook punch mid-swing, right arm arcing, "
        f"powerful hip rotation, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, right hook punch at full extension, right arm in wide arc, "
        f"maximum power delivery, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, follow-through after right hook punch, right arm continuing arc, "
        f"recovering balance, facing left, {STYLE_BASE}",
    ],
    'hit': [
        f"{TITO_IDENTITY}, initial impact reaction getting punched, head starting to snap back, "
        f"eyes wincing, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, recoiling from being hit, head snapped back, body leaning away, "
        f"pained grimace, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, maximum recoil from punch impact, upper body bent backward, "
        f"arms dropping from guard, pain expression, facing left, {STYLE_BASE}",
        
        f"{TITO_IDENTITY}, recovering from hit, starting to regain composure, "
        f"bringing gloves back up, still wincing, facing left, {STYLE_BASE}",
    ],
}

# --- EL CHACAL V2: Identidad Visual (paleta carbón/bronce, guantes #991B1B) ---
CHACAL_IDENTITY = (
    "Tough aggressive heavyweight boxer named El Chacal with short dark buzzcut hair, "
    "menacing scowl expression, scar across left eyebrow, thick neck, "
    "wearing dark desaturated blood-red boxing gloves color hex 991B1B, "
    "dark CHARCOAL colored boxing shorts with bronze trim, "
    "dark BROWN boxing boots, massively muscular intimidating build, "
    "predominantly charcoal and bronze color palette"
)

CHACAL_POSES = {
    'idle': [
        f"{CHACAL_IDENTITY}, standing in aggressive boxing stance facing left 3/4 view, "
        f"gloves up menacing guard, wide powerful stance, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, standing in aggressive boxing stance facing left 3/4 view, "
        f"gloves slightly apart intimidating, weight shifting forward, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, standing in aggressive boxing stance facing left 3/4 view, "
        f"one glove forward threatening, dominant posture, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, standing in aggressive boxing stance facing left 3/4 view, "
        f"tight defensive guard, muscles tensed ready to strike, {STYLE_BASE}",
    ],
    'jab': [
        f"{CHACAL_IDENTITY}, beginning powerful left jab, arm winding up, "
        f"aggressive forward lean, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, throwing devastating left jab mid-extension, "
        f"body driving forward aggressively, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, fully extended powerful left jab, arm straight, "
        f"maximum reach lunging forward, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, retracting from left jab, pulling arm back, "
        f"resetting to aggressive stance, facing left, {STYLE_BASE}",
    ],
    'hook': [
        f"{CHACAL_IDENTITY}, winding up devastating right hook, arm pulled back, "
        f"massive hip torque loading, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, throwing brutal right hook mid-swing, "
        f"full body rotation behind punch, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, right hook at maximum power delivery point, "
        f"arm in crushing wide arc, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, follow-through after devastating right hook, "
        f"momentum carrying through, facing left, {STYLE_BASE}",
    ],
    'hit': [
        f"{CHACAL_IDENTITY}, initial impact reaction getting punched, head jerking, "
        f"surprised angry expression, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, recoiling from being hit hard, head snapped sideways, "
        f"furious pained expression, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, maximum recoil from heavy punch, body staggering, "
        f"enraged pain grimace, facing left, {STYLE_BASE}",
        
        f"{CHACAL_IDENTITY}, recovering from hit with fury, starting to come back forward, "
        f"gloves coming back up angry, facing left, {STYLE_BASE}",
    ],
}


def generate_spritesheet(pipe, device, char_name, poses_dict, output_path, steps=4):
    """
    Genera un sprite sheet 4x4 (2048x2048) para un personaje.
    Cada fila = 1 pose, cada columna = 1 frame de animación.
    """
    pose_order = ['idle', 'jab', 'hook', 'hit']
    cell_size = 512
    sheet_size = cell_size * 4  # 2048
    
    # Canvas del sprite sheet completo
    spritesheet = Image.new('RGBA', (sheet_size, sheet_size), (255, 255, 255, 255))
    
    total = 16
    current = 0
    
    for row, pose_name in enumerate(pose_order):
        prompts = poses_dict[pose_name]
        for col, prompt in enumerate(prompts):
            current += 1
            print(f"\n[GEN {current}/{total}] {char_name} — {pose_name} frame {col}")
            print(f"  Prompt: {prompt[:80]}...")
            
            # Generar con SD-Turbo
            result = pipe(
                prompt=prompt,
                negative_prompt=NEGATIVE_PROMPT,
                num_inference_steps=steps,
                guidance_scale=1.0,
                width=cell_size,
                height=cell_size
            ).images[0]
            
            # Rembg: quitar fondo
            if HAS_REMBG:
                try:
                    result = remove_bg(result)
                    print(f"  [REMBG] Fondo removido OK")
                except Exception as e:
                    print(f"  [WARN] rembg error: {e}")
            
            # Pegar en la grilla
            x_pos = col * cell_size
            y_pos = row * cell_size
            
            # Asegurar RGBA
            if result.mode != 'RGBA':
                result = result.convert('RGBA')
            
            spritesheet.paste(result, (x_pos, y_pos), result)
            print(f"  [OK] Pegado en grilla ({row},{col}) pos=({x_pos},{y_pos})")
    
    # Guardar el spritesheet raw
    spritesheet.save(output_path, 'PNG')
    file_size = os.path.getsize(output_path) / 1024
    print(f"\n[SHEET] {char_name} spritesheet guardado: {output_path} ({file_size:.0f} KB)")
    return output_path


def main():
    print("=" * 75)
    print("  PIPELINE V2: GENERADOR DE SPRITE SHEETS 4x4")
    print("  La Vida Del Boxeo — OT-FASE2-001")
    print("=" * 75)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"[DEVICE] {device.upper()} | Precision: {dtype}")
    
    model_id = "stabilityai/sd-turbo"
    print(f"[MODEL] Cargando: {model_id}...")
    
    try:
        pipe = AutoPipelineForText2Image.from_pretrained(
            model_id, torch_dtype=dtype,
            variant="fp16" if device == "cuda" else None
        )
    except Exception as e:
        print(f"[FALLBACK] {e}")
        pipe = AutoPipelineForText2Image.from_pretrained(model_id, torch_dtype=torch.float32)
    
    pipe.to(device)
    if device == "cuda":
        pipe.enable_attention_slicing()
    
    output_dir = r"E:\Juego La Vida Del Boxeo\workspace\assets\sprites"
    os.makedirs(output_dir, exist_ok=True)
    
    # Incrementar steps para mayor calidad si hay GPU
    inference_steps = 4 if device == "cuda" else 4
    
    # === TITO V2 ===
    tito_raw = os.path.join(output_dir, "tito_spritesheet_raw.png")
    print("\n" + "=" * 75)
    print("  GENERANDO: TITO_V2 (4x4 Sprite Sheet)")
    print("=" * 75)
    generate_spritesheet(pipe, device, "TITO", TITO_POSES, tito_raw, steps=inference_steps)
    
    # === EL CHACAL V2 ===
    chacal_raw = os.path.join(output_dir, "chacal_spritesheet_raw.png")
    print("\n" + "=" * 75)
    print("  GENERANDO: EL_CHACAL_V2 (4x4 Sprite Sheet)")
    print("=" * 75)
    generate_spritesheet(pipe, device, "CHACAL", CHACAL_POSES, chacal_raw, steps=inference_steps)
    
    print("\n" + "=" * 75)
    print("  GENERACIÓN COMPLETA. Ejecutar sprite_processor.py para post-proceso.")
    print(f"  python scripts/sprite_processor.py \\")
    print(f"    --input-tito {tito_raw} \\")
    print(f"    --input-chacal {chacal_raw} \\")
    print(f"    --mode spritesheet")
    print("=" * 75)


if __name__ == '__main__':
    main()
