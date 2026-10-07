import { beforeAll, describe, expect, it, vi } from "vitest";
import { CONSEJOS_INICIALES } from "../game/data";
import { presentarConsejo } from "./advice";
import { registrarCatalogo } from "./catalog";

beforeAll(async () => {
  const { readFileSync } = await vi.importActual<{ readFileSync: (url: URL, encoding: string) => string }>("node:fs");
  for (const locale of ["en", "pt-BR"] as const) registrarCatalogo(locale, JSON.parse(readFileSync(new URL(`../../public/i18n/${locale}.json`, import.meta.url), "utf8")));
});

describe("R4 — identidad fiable de consejos, sin reescribir historia", () => {
  it.each([
    ["es", CONSEJOS_INICIALES[0].texto],
    ["en", "Prepare your first student: complete sparring, obtain the coach licence and register the boxer to compete."],
    ["pt-BR", "Prepare seu primeiro aluno: complete os treinos de sparring, obtenha a licença de treinador e habilite o pugilista para competir."],
  ] as const)("%s traduce el objetivo conocido sin cambiar el derecho ni el cobro", (locale, texto) => {
    const source = Object.freeze({ ...CONSEJOS_INICIALES[0], cumplido: false, reclamado: false, extension: 0 });
    const original = JSON.stringify(source);
    expect(presentarConsejo(source, locale)).toEqual({ texto, historico: false });
    expect(JSON.stringify(source)).toBe(original);
  });
  it("una descripción desconocida con ID conocido conserva cada byte y se identifica como histórica", () => {
    const texto = "Historia original 🥊 con {parámetro} y energía 0.";
    expect(presentarConsejo({ id: "c1", texto, fama: 0, cumplido: false, reclamado: false }, "en")).toEqual({ texto, historico: true });
  });
  it("no infiere identidad por coincidencia de texto con ID desconocido", () => {
    const source = { ...CONSEJOS_INICIALES[0], id: "historia-desconocida", cumplido: true, reclamado: false };
    expect(presentarConsejo(source, "pt-BR")).toEqual({ texto: source.texto, historico: true });
  });
  it("un duplicado antiguo reconocido conserva su ID, archivo y ausencia de cobro", () => {
    const source = Object.freeze({ ...CONSEJOS_INICIALES[7], id: "c11", cumplido: false, reclamado: false, archivado: true, motivoArchivo: "Dato histórico intacto" });
    expect(presentarConsejo(source, "en")).toEqual({ texto: "Enroll three recreational students to support the club's finances.", historico: false });
    expect(source).toEqual({ ...CONSEJOS_INICIALES[7], id: "c11", cumplido: false, reclamado: false, archivado: true, motivoArchivo: "Dato histórico intacto" });
  });
});
