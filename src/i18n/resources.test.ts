import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogs, cargarCatalogo, es, registrarCatalogo } from "./catalog";

afterEach(() => { catalogs.en = undefined; vi.unstubAllGlobals(); });

describe("R4 — recursos de traducción, sin habilitar idiomas parciales", () => {
  it("validación exacta no sustituye un catálogo sano por claves faltantes", () => {
    const healthy = registrarCatalogo("en", { ...es });
    const bad: Record<string, string> = { ...es };
    delete bad["action.cancel"];
    expect(() => registrarCatalogo("en", bad)).toThrow("Invalid translation catalog keys");
    expect(catalogs.en).toBe(healthy);
  });
  it("placeholders corruptos o claves desconocidas no se aceptan", () => {
    expect(() => registrarCatalogo("en", { ...es, "page.position": "Page {page}" })).toThrow("Invalid translation catalog");
    expect(() => registrarCatalogo("en", { ...es, desconocida: "Texto" })).toThrow("Invalid translation catalog keys");
    expect(catalogs.en).toBeUndefined();
  });
  it("un404 no informa éxito ni instala un catálogo parcial", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(cargarCatalogo("en", "https://example.invalid/LaVidaDelBoxeo/")).rejects.toThrow("Translation resource unavailable: 404");
    expect(catalogs.en).toBeUndefined();
  });
  it("red denegada o JSON malformado no modifica catálogo disponible", async () => {
    const original = catalogs.es;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(cargarCatalogo("en", "https://example.invalid/game/")).rejects.toThrow("offline");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.reject(new Error("invalid JSON")) }));
    await expect(cargarCatalogo("en", "https://example.invalid/game/")).rejects.toThrow("invalid JSON");
    expect(catalogs.es).toBe(original);
    expect(catalogs.en).toBeUndefined();
  });
  it("respeta la ruta base de Pages y almacena solo un catálogo validado", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...es }) });
    vi.stubGlobal("fetch", fetcher);
    const catalog = await cargarCatalogo("en", "https://example.invalid/LaVidaDelBoxeo/");
    expect(String(fetcher.mock.calls[0][0])).toBe("https://example.invalid/LaVidaDelBoxeo/i18n/en.json");
    expect(catalog).toEqual(es);
    expect(Object.isFrozen(catalog)).toBe(true);
  });
  it("español funciona sin red y no cambia la partida ni una preferencia", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));
    const write = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    vi.stubGlobal("localStorage", { setItem: write });
    expect(await cargarCatalogo("es")).toBe(es);
    expect(fetcher).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
  it("rechaza locales desconocidos antes de leer red, DOM o instalar recursos", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(() => registrarCatalogo("unknown" as "en", es)).toThrow("Unsupported translation locale");
    await expect(cargarCatalogo("unknown" as "en")).rejects.toThrow("Unsupported translation locale");
    expect(fetcher).not.toHaveBeenCalled();
    expect(Object.keys(catalogs).sort()).toEqual(["en", "es", "pt-BR"]);
  });
});
