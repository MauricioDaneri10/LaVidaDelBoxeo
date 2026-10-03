/** Read-only AST inventory. Candidates require human review; not a coverage certificate. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import ts from "typescript";
const root = path.resolve("src");
const attributes = new Set(["title", "aria-label", "aria-description", "placeholder", "alt"]);
const fields = new Set(["nombre", "titulo", "texto", "desc", "descripcion", "detalle", "etiqueta", "resumen", "concepto", "aporte", "lema", "label", "mensaje", "boton"]);
const candidates = [];
const fingerprints = {};
function scan(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { if (entry.name !== "i18n") scan(file); continue; }
    if (!/\.tsx?$/.test(file) || /(?:\.test|playtest_)/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const relative = path.relative(process.cwd(), file).replaceAll("\\", "/");
    fingerprints[relative] = crypto.createHash("sha256").update(source).digest("hex");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function add(node, kind, text) {
      text = text.replace(/\s+/g, " ").trim();
      if (!text || !/[a-záéíóúñçãâêô]/i.test(text)) return;
      candidates.push({ file: relative, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, kind, text });
    }
    function visit(node) {
      if (ts.isJsxText(node)) add(node, "jsx", node.text);
      if (ts.isJsxAttribute(node) && attributes.has(node.name.getText(ast)) && node.initializer) add(node, "attribute", ts.isStringLiteral(node.initializer) ? node.initializer.text : node.initializer.getText(ast));
      if (ts.isPropertyAssignment(node) && fields.has(node.name.getText(ast).replaceAll('"', ""))) add(node, "content", node.initializer.getText(ast));
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && ts.isConditionalExpression(node.parent)) add(node, "conditional", node.text);
      if (ts.isThrowStatement(node) || (ts.isCallExpression(node) && /(?:confirm|alert|ErrorGuardado)$/.test(node.expression.getText(ast)))) add(node, "message", node.getText(ast));
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
}
scan(root);
const counts = {};
for (const candidate of candidates) counts[candidate.file] = (counts[candidate.file] ?? 0) + 1;
console.log(JSON.stringify({ status: "INVENTORY_NOT_COVERAGE", total: candidates.length, counts, fingerprints, candidates }, null, 2));
