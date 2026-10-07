import { afterEach, describe, expect, it, vi } from "vitest";
import { cargarIdioma, formatearFecha, formatearMoneda, formatearNumero, guardarIdioma, IDIOMAS_HABILITADOS } from "./index";

afterEach(() => vi.unstubAllGlobals());
function storage(value: string | null) {
  const write = vi.fn();
  vi.stubGlobal("localStorage", { getItem: () => value, setItem: write });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  return write;
}
describe("R4 — formatos y habilitación sin alterar dominio", () => {
  it("un recurso no cargado no activa ni borra una preferencia antigua", () => {
    const write = storage("pt-BR");
    expect(IDIOMAS_HABILITADOS).toEqual(["es","en","pt-BR"]);
    expect(cargarIdioma()).toBe("es");
    expect(guardarIdioma("pt-BR")).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
  it("fallo de almacenamiento no informa preferencia guardada", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("full"); } });
    expect(cargarIdioma()).toBe("es");
    expect(guardarIdioma("es")).toBe(false);
  });
  it("la preferencia solo escribe su clave, nunca una partida", () => {
    const write = storage(null);
    expect(guardarIdioma("es")).toBe(true);
    expect(write.mock.calls).toEqual([["vida-del-boxeo:idioma", "es"]]);
  });
  it.each(["es", "en", "pt-BR"] as const)("%s conserva ceros, signos y moneda sin conversión", locale => {
    const intl = { es: "es-AR", en: "en-US", "pt-BR": "pt-BR" }[locale];
    for (const value of [0, -143, 12345]) {
      expect(formatearNumero(value, locale)).toBe(new Intl.NumberFormat(intl).format(value));
      expect(formatearMoneda(value, locale)).toBe(new Intl.NumberFormat(intl, { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value));
    }
    const date = new Date(2026, 9, 1);
    const epoch = date.getTime();
    expect(formatearFecha(date, locale)).toBe(new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric" }).format(date));
    expect(date.getTime()).toBe(epoch);
  });
});
