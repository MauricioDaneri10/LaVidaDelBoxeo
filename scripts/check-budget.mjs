import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const directorio = new URL("../dist/assets/", import.meta.url);
const ruta = fileURLToPath(directorio);
const MAX_JS = 560 * 1024;
const MAX_CSS = 90 * 1024;
const archivos = readdirSync(ruta);
const sumar = nombres => nombres.reduce((total, nombre) => total + statSync(join(ruta, nombre)).size, 0);
const jsBytes = sumar(archivos.filter(nombre => nombre.endsWith(".js")));
const cssBytes = sumar(archivos.filter(nombre => nombre.endsWith(".css")));

console.log(`Bundle JS: ${(jsBytes / 1024).toFixed(1)} KiB / ${(MAX_JS / 1024).toFixed(0)} KiB`);
console.log(`Bundle CSS: ${(cssBytes / 1024).toFixed(1)} KiB / ${(MAX_CSS / 1024).toFixed(0)} KiB`);
if (jsBytes > MAX_JS || cssBytes > MAX_CSS) {
  console.error("Presupuesto de bundle excedido.");
  process.exit(1);
}
