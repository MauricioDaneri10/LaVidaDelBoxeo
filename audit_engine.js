import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_ASSET_SIZE = 100 * 1024; // 100 KB
const ASSET_DIRS = [
    path.join(__dirname, 'assets', 'sprites'),
    path.join(__dirname, 'assets', 'ui')
];

let errors = 0;
let warnings = 0;

console.log("================================================================");
console.log("=== DAEMON DE AUDITORÍA: JUEGO LA VIDA DEL BOXEO ===");
console.log("================================================================\n");

// 1. Check Asset Limits and Formats
console.log("[1] AUDITANDO ASSETS GRÁFICOS...");
ASSET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                const ext = path.extname(file).toLowerCase();
                if (ext !== '.webp' && ext !== '.png') {
                    console.error(`[ERROR] Formato no permitido en asset: ${file} (solo .webp o .png)`);
                    errors++;
                }
                if (stats.size > MAX_ASSET_SIZE) {
                    console.error(`[ERROR] Asset excede 100KB: ${file} (${(stats.size/1024).toFixed(2)} KB)`);
                    errors++;
                }
            }
        });
    } else {
        console.warn(`[WARNING] Directorio no encontrado: ${dir}`);
        warnings++;
    }
});
if (errors === 0) console.log("✓ Assets optimizados y dentro de estándares (<100KB, webp/png).");

// 2. Check strict directory structure
console.log("\n[2] VERIFICANDO ÁRBOL MODULAR INQUEBRANTABLE...");
const requiredDirs = ['assets/sprites', 'assets/ui', 'js', 'css'];
requiredDirs.forEach(dir => {
    if (!fs.existsSync(path.join(__dirname, dir))) {
        console.error(`[ERROR] Directorio requerido faltante: /${dir}/`);
        errors++;
    }
});
if (errors === 0 && warnings === 0) console.log("✓ Estructura de directorios alineada con el manifiesto.");

// 3. Simple syntax checks (Optional)
console.log("\n[3] REVISIÓN DE CÓDIGO BÁSICA...");
const mainJs = path.join(__dirname, 'js', 'app.js');
const combatJs = path.join(__dirname, 'js', 'combat.js');
const mainCss = path.join(__dirname, 'css', 'main.css');

let hasEngine = false;
[mainJs, combatJs].forEach(file => {
    if (fs.existsSync(file)) {
        if (fs.readFileSync(file, 'utf8').includes('requestAnimationFrame')) hasEngine = true;
    }
});

if (hasEngine) {
    console.log("✓ Motor Canvas 60fps (requestAnimationFrame) detectado.");
} else {
    console.warn("[WARNING] No se detectó requestAnimationFrame en el motor.");
    warnings++;
}

if (fs.existsSync(mainCss)) {
    const cssContent = fs.readFileSync(mainCss, 'utf8');
    if (cssContent.includes('backdrop-filter: blur') || cssContent.includes('var(--glass-blur)')) {
         console.log("✓ Glassmorphism detectado (backdrop-filter).");
    }
    if (cssContent.includes('max-width: 460px')) {
         console.log("✓ Modales blindados detectados (max-width: 460px).");
    } else {
         console.warn("[WARNING] Faltan los límites de modal (max-width: 460px).");
         warnings++;
    }
}

console.log("\n================================================================");
console.log(`RESULTADO: ${errors} Errores críticos | ${warnings} Advertencias`);
if (errors > 0) {
    console.error("❌ LA AUDITORÍA HA FALLADO. SE REQUIERE CORRECCIÓN INMEDIATA.");
    process.exit(1);
} else {
    console.log("✅ AUDITORÍA SUPERADA. CÓDIGO LISTO PARA PRODUCCIÓN.");
    process.exit(0);
}
