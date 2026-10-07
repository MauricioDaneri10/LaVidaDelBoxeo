import { beforeAll, describe, expect, it, vi } from "vitest";
import { catalogs, es, placeholders, pseudoTemplate, translate, registrarCatalogo } from "./catalog";
import { COMBOS } from "../game/data";
import type { ComboId } from "../game/types";

beforeAll(async () => {
  const { readFileSync } = await vi.importActual<{ readFileSync: (url: URL, encoding: string) => string }>("node:fs");
  for (const locale of ["en", "pt-BR"] as const) registrarCatalogo(locale, JSON.parse(readFileSync(new URL(`../../public/i18n/${locale}.json`, import.meta.url), "utf8")));
});

describe("R4 — catálogo tipado (no certifica cobertura global)", () => {
  it("enfoques españoles coinciden exactamente con las promesas existentes, sin modificar sus stats", () => {
    for (const id of Object.keys(COMBOS) as ComboId[]) {
      expect(translate("es", `combo.${id}`)).toBe(COMBOS[id].nombre);
      expect(translate("es", `combo.${id}.desc`)).toBe(COMBOS[id].desc);
    }
  });
  it.each(["es", "en", "pt-BR"] as const)("%s incluye seis enfoques y los once atributos sin usar IDs como copia visible", locale => {
    for (const id of Object.keys(COMBOS) as ComboId[]) {
      expect(translate(locale, `combo.${id}`)).not.toBe(id);
      const description=translate(locale, `combo.${id}.desc`);
      expect(description.split(" · ").every(effect=>effect.startsWith("+ "))).toBe(true);
    }
    expect(Object.keys(es).filter(key=>key.startsWith("stat.")).sort()).toEqual(["ataque","defensa","eficacia","energia","fuerza","guanteos","inteligencia","mentalidad","potencia","resistencia","talento","tecnica","velocidad"].map(key=>`stat.${key}`).sort());
  });
  it.each(["es", "en", "pt-BR"] as const)("%s conserva todas las claves y parámetros del módulo", locale => {
    expect(Object.keys(catalogs[locale]!).sort()).toEqual(Object.keys(es).sort());
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(catalogs[locale]![key].trim()).not.toBe("");
      expect(placeholders(catalogs[locale]![key])).toEqual(placeholders(es[key]));
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
