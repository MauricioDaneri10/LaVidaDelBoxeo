import { describe, expect, it } from "vitest";
import { paginasTexto } from "./textPages";

describe("R4 — detalle paginado de texto literal", () => {
  it.each(["", "0", "Nombre conocido", "Texto histórico desconocido\n con  espacios\tintactos ".repeat(50), "🥊á漢字".repeat(150), "X".repeat(1000)])("reconstruye exactamente el original %j", texto => {
    const pages = paginasTexto(texto);
    expect(pages.join("")).toBe(texto);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.every(page => Array.from(page).length <= 90)).toBe(true);
    expect(pages.every(page => !/[\uD800-\uDBFF]$|^[\uDC00-\uDFFF]/u.test(page))).toBe(true);
  });
  it("no admite capacidades inválidas que escondan contenido o no progresen", () => {
    for (const capacity of [0, -1, 1.5, Infinity, NaN]) expect(() => paginasTexto("Texto", capacity)).toThrow("Invalid text-page capacity");
  });
  it.each(["a\u0301", "👩‍👩‍👦", "🇦🇷", "👍🏽"])("no separa el grafema %s entre páginas", grapheme => {
    const original=grapheme.repeat(13);
    for (const capacity of [1, 4, 9]) {
      const pages=paginasTexto(original,capacity);
      expect(pages.join("")).toBe(original);
      expect(pages).toEqual(Array.from({length: Math.ceil(13/capacity)},(_,index)=>grapheme.repeat(Math.min(capacity,13-index*capacity))));
    }
  });
});
