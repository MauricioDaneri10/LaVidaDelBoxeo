import { describe, expect, it } from "vitest";
import { catalogs, es, placeholders, pseudoTemplate, translate } from "./catalog";

describe("R4 — catálogo tipado (no certifica cobertura global)", () => {
  it.each(["es", "en", "pt-BR"] as const)("%s conserva todas las claves y parámetros del módulo", locale => {
    expect(Object.keys(catalogs[locale]).sort()).toEqual(Object.keys(es).sort());
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(catalogs[locale][key].trim()).not.toBe("");
      expect(placeholders(catalogs[locale][key])).toEqual(placeholders(es[key]));
    }
  });
  it("interpolación conserva literalmente nombres/datos desconocidos y ceros", () => {
    expect(translate("en", "page.position", { page: 0, total: "{histórico} <nombre>" })).toBe("Page 0 of {histórico} <nombre>");
  });
  it("un parámetro faltante no produce un éxito aparente", () => {
    // @ts-expect-error Deliberately exercise invalid runtime input.
    expect(() => translate("en", "page.position", { page: 1 })).toThrow("Invalid translation parameters");
  });
  it("una clave ausente no se sustituye silenciosamente", () => {
    // @ts-expect-error Simulate an untyped caller/invalid persisted metadata.
    expect(() => translate("en", "clave-no-existente")).toThrow("Missing translation");
  });
  it("pseudo+40% expande copia estática sin cambiar slots", () => {
    for (const value of Object.values(es)) {
      const pseudo = pseudoTemplate(value);
      expect(placeholders(pseudo)).toEqual(placeholders(value));
      const clean = (text: string) => text.replace(/\{[^}]+\}/g, "");
      expect(clean(pseudo).length).toBeGreaterThanOrEqual(Math.ceil(clean(value).length * 1.4));
    }
  });
});
