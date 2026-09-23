import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const required = ["package.json", "package-lock.json", "index.html", "src/App.tsx", "src/game/engine.ts", "src/game/state.tsx", "src/game/types.ts", "src/game/game.test.ts"];
let errors = 0;
let warnings = 0;
console.log("=== Auditoría de La Vida del Boxeo ===");

for (const relative of required) {
  if (fs.existsSync(path.join(root, relative))) console.log(`✓ ${relative}`);
  else { console.error(`✗ Falta ${relative}`); errors++; }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const script of ["typecheck", "test", "build"]) {
  if (packageJson.scripts?.[script]) console.log(`✓ script npm ${script}`);
  else { console.error(`✗ Falta script npm ${script}`); errors++; }
}

const sourceFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(file);
  }
}
walk(path.join(root, "src"));
const source = sourceFiles.map(file => fs.readFileSync(file, "utf8")).join("\n");
if (source.includes("localStorage")) console.log("✓ Persistencia local detectada");
if (source.includes("resolverPelea") && source.includes("sanitizarEstado")) console.log("✓ Motor y sanitización detectados");
if (source.includes("as any")) { console.warn("⚠ Quedan conversiones explícitas a any en componentes de compatibilidad"); warnings++; }

console.log(`Resultado: ${errors} errores, ${warnings} advertencias`);
if (errors > 0) process.exit(1);
console.log("✓ Auditoría estructural superada");
