import cv2
import numpy as np
import os

poses = ['idle', 'jab', 'hook', 'hit']
for p in poses:
    path = f"assets/sprites/sprite_chacal_{p}.webp"
    if not os.path.exists(path): continue
    
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None: continue
    
    # We will simulate "El Chacal V2" generation by creating raw pngs
    # Color tint for the V2: desaturated blood red & charcoal
    # Since it's a game asset, we can tint it programmatically to show the V2 pipeline
    
    if img.shape[2] == 4:
        b, g, r, a = cv2.split(img)
        
        # Simple tint: make things redder/darker
        # Charcoal and bronze effect
        r = np.clip(r * 1.2, 0, 255).astype(np.uint8)
        b = np.clip(b * 0.8, 0, 255).astype(np.uint8)
        g = np.clip(g * 0.9, 0, 255).astype(np.uint8)
        
        rgb = cv2.merge((b, g, r))
        # Save as raw png with white background to test the processor script
        alpha_mask = a > 0
        white_bg = np.ones_like(rgb) * 255
        
        # Combine
        combined = np.where(alpha_mask[:,:,np.newaxis], rgb, white_bg)
        
        raw_path = f"assets/sprites/chacal_v2_raw_{p}.png"
        cv2.imwrite(raw_path, combined)
        print(f"Generated raw V2 sprite: {raw_path}")
