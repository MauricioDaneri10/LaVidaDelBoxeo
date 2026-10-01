import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calcularModificadores, crearEstadoBase, genPugilista, nivelGimnasio, proyeccionSemanal, proyeccionSemanalRecurrente, sanitizarEstado } from "./engine";
import { socialActivityIncome, socialActivityRange, weeklyEconomy } from "./economy";
import { conFuenteAzar, usarSemilla } from "./random";
import { reductor } from "./state";
import type { EstadoJuego, TipoComunitario } from "./types";

let restore: () => void;
beforeEach(() => { restore = usarSemilla(510024); });
afterEach(() => { restore(); });

function economy(e: EstadoJuego) {
  return weeklyEconomy(e, { nivel: nivelGimnasio(e), multiplicadorMarca: calcularModificadores(e).multiplicadorMarca });
}

describe("R3 A24: previsión garantizada", () => {
  it.each([1001, 510024, 260923])("120 semanas con seed %i: conciliación exacta, roundtrip y hitos sin repetición", seed => {
    const reset = usarSemilla(seed);
    try {
      let e: EstadoJuego = { ...crearEstadoBase({ sinPoblacion: true }), creado: true, dinero: 10000,
        propiedades: ["arena", "sucursal"], cursos: ["clubes", "franquicias"],
        equipamiento: ["barraProteinas"], personal: [{ id: "legacy-coord", tipo: "coordinadorSucursal", nombre: "Contrato histórico" }] };
      let paid = 0;
      for (let week = 1; week <= 120; week++) {
        expect(e.semana).toBe(week);
        const before = e.dinero;
        e = reductor(e, { type: "SEMANA_RAPIDA" });
        expect(e.resumen).not.toBeNull();
        const summary = e.resumen!;
        expect(summary.total).toBe(summary.ingresos.reduce((a, l) => a + l.monto, 0) - summary.gastos.reduce((a, l) => a + l.monto, 0));
        expect(e.dinero - before).toBe(summary.total);
        expect(summary.gastos.some(g => g.concepto === "Alquiler del local")).toBe(false);
        expect(summary.gastos.find(g => g.concepto.startsWith("Sueldos"))?.monto).toBe(140);
        const snapshot = JSON.parse(JSON.stringify(e));
        expect(sanitizarEstado(snapshot)).toEqual(snapshot);
        e = sanitizarEstado(snapshot);
        for (const c of e.consejos.filter(c => c.cumplido && !c.reclamado && !c.archivado)) {
          const cash = e.dinero;
          e = reductor(e, { type: "RECLAMAR_CONSEJO", id: c.id });
          paid += e.dinero - cash;
          expect(reductor(e, { type: "RECLAMAR_CONSEJO", id: c.id }).dinero).toBe(e.dinero);
        }
        expect(e.consejos).toHaveLength(10); expect(paid).toBeLessThanOrEqual(260);
        e = reductor(e, { type: "CERRAR_DOMINGO" });
      }
      expect(e.semana).toBe(121); expect(e.personal).toEqual([{ id: "legacy-coord", tipo: "coordinadorSucursal", nombre: "Contrato histórico" }]);
    } finally { reset(); }
  });
  it("Arena elimina solo el alquiler futuro, incluso sin local propio", () => {
    const e = { ...crearEstadoBase(), propiedades: ["arena" as const], dinero: 1234,
      libroGastos: [{ concepto: "Alquiler del local", monto: 150 }] };
    expect(proyeccionSemanal(e).gastos.some(l => l.concepto === "Alquiler del local")).toBe(false);
    expect(proyeccionSemanalRecurrente(e).gastos.some(l => l.concepto === "Alquiler del local")).toBe(false);
    expect(e.dinero).toBe(1234);
    expect(e.libroGastos).toEqual([{ concepto: "Alquiler del local", monto: 150 }]);
  });

  it("la media social no integra entradas ni total garantizados", () => {
    const base = { ...crearEstadoBase(), semana: 2 };
    const prevista = proyeccionSemanal({ ...base, comunitarios: [{ tipo: "bingo", nombre: "Bingo" }] });
    expect(prevista.ingresos.some(l => l.concepto.includes("Dividendos"))).toBe(false);
    expect(prevista.total).toBe(proyeccionSemanal(base).total);
    expect(prevista.estimados).toEqual([{ concepto: "Dividendos estimados: Bingo", min: 250, max: 420, mean: 335 }]);
  });
});

describe("R3 A24: reglas compartidas sin recalibración", () => {
  it("conserva cuotas, espera, aportes, apertura, marca, sponsor y bonus multiplicativo de sucursales", () => {
    const alumno = genPugilista({ rol: "alumno" });
    const e: EstadoJuego = { ...crearEstadoBase(), semana: 1, fama: 17, dinero: -143,
      plantel: [alumno, { ...alumno, id: "a2" }, { ...alumno, id: "espera", enEspera: true }, genPugilista({ rol: "boxeador" })],
      recreativos: 3, propiedades: ["sucursal", "sucursal"], cursos: ["imperio"],
      marcaRopa: "Marca", equipamiento: ["estudioMarca"],
      personal: [{ id: "g", tipo: "gerente", nombre: "G" }, { id: "c", tipo: "coordinadorSucursal", nombre: "C" },
        { id: "l1", tipo: "entrenadorLocal", nombre: "L1" }, { id: "l2", tipo: "entrenadorLocal", nombre: "L2" },
        { id: "d", tipo: "difusion", nombre: "D" }],
      patrocinio: { nombre: "Sponsor", semanal: 75, semanas: 2 },
      prestamo: { saldo: 45, cuota: 60, semanasRestantes: 1 } };
    const before = structuredClone(e);
    const calculated = weeklyEconomy(e, { nivel: 4, multiplicadorMarca: 2.7 });
    expect(calculated.ingresos.map(l => l.monto)).toEqual([48, 30, 12, 240, 3558, 383, 75]);
    expect(calculated.gastos.map(l => l.monto)).toEqual([150, 510, 10, 45]);
    expect(calculated.total).toBe(3631);
    expect(e).toEqual(before);
  });

  it.each([1, 2, 3, 4])("nivel %i conserva la cuota original", nivel => {
    const e = { ...crearEstadoBase(), plantel: [genPugilista({ rol: "alumno" })] };
    expect(weeklyEconomy(e, { nivel, multiplicadorMarca: 1 }).ingresos[0].monto).toBe(18 + 2 * (nivel - 1));
  });

  it.each([[0, 0], [-1, 10], [-143, 10], [-334, 11], [-1667, 50], [-100000, 50]])("caja %i conserva el costo financiero %i", (dinero, cargo) => {
    const result = economy({ ...crearEstadoBase(), dinero });
    expect(result.gastos.find(l => l.concepto === "Costo financiero por caja negativa")?.monto ?? 0).toBe(cargo);
  });

  it.each([[0, 60, 0], [45, 60, 45], [600, 60, 60]])("saldo préstamo %i y cuota %i proyectan %i sin amortizar", (saldo, cuota, pago) => {
    const e = { ...crearEstadoBase(), prestamo: { saldo, cuota, semanasRestantes: 10 } };
    expect(economy(e).gastos.find(l => l.concepto.startsWith("Cuota del préstamo"))?.monto ?? 0).toBe(pago);
    expect(e.prestamo).toEqual({ saldo, cuota, semanasRestantes: 10 });
  });

  it("no atribuye ingresos a una sucursal sin administración ni a una marca sin estudio", () => {
    const result = economy({ ...crearEstadoBase(), propiedades: ["sucursal"], marcaRopa: "Marca" });
    expect(result.ingresos.find(l => l.concepto.startsWith("Sucursales sin gerente"))?.monto).toBe(0);
    expect(result.ingresos.some(l => l.concepto.startsWith("Ventas"))).toBe(false);
  });

  it("el flujo recurrente excluye apertura/sponsor/sociales y conserva las demás reglas", () => {
    const e: EstadoJuego = { ...crearEstadoBase(), semana: 1, comunitarios: [{ tipo: "festival", nombre: "Festival" }],
      patrocinio: { nombre: "Sponsor", semanal: 75, semanas: 2 } };
    const result = proyeccionSemanalRecurrente(e);
    expect(result).toEqual({ ...economy({ ...e, semana: 2, patrocinio: null }), estimados: [] });
  });

  it("previsión determinista coincide exactamente con domingo sin actividades", () => {
    const e: EstadoJuego = { ...crearEstadoBase(), creado: true, semana: 2, semanaLibro: 2, dia: 6, dinero: -143, plantel: [],
      pendientes: [], recreativos: 3, personal: [{ id: "g", tipo: "gerente", nombre: "G" }],
      propiedades: ["sucursal"], patrocinio: { nombre: "Sponsor", semanal: 75, semanas: 2 },
      prestamo: { saldo: 600, cuota: 60, semanasRestantes: 10 }, libroIngresos: [], libroGastos: [] };
    const forecast = economy(e);
    const settled = reductor(e, { type: "AVANZAR_DIA" });
    expect(settled.resumen).toEqual(forecast);
    expect(settled.dinero - e.dinero).toBe(forecast.total);
  });

  it("los cálculos no consumen RNG ni reproducen movimientos ya liquidados", () => {
    const e = { ...crearEstadoBase(), comunitarios: [{ tipo: "bingo" as const, nombre: "Bingo" }],
      libroIngresos: [{ concepto: "Desembolso del préstamo", monto: 500 }],
      libroGastos: [{ concepto: "Inversión", monto: 200 }] };
    const before = structuredClone(e);
    conFuenteAzar(() => { throw new Error("RNG consumido"); }, () => {
      expect(proyeccionSemanal(e).ingresos.some(l => l.concepto === "Desembolso del préstamo")).toBe(false);
      expect(economy(e).gastos.some(l => l.concepto === "Inversión")).toBe(false);
    });
    expect(e).toEqual(before);
  });

  it.each<[TipoComunitario, number, number, number]>([
    ["bingo", 250, 420, 335], ["naipes", 130, 220, 175],
    ["festival", 580, 850, 715], ["claseAbierta", 80, 140, 110],
  ])("%s preserva rango y media originales con/sin difusión", (tipo, min, max, mean) => {
    expect(socialActivityRange(tipo, 1)).toEqual({ min, max, mean });
    expect(socialActivityRange(tipo, 1.15)).toEqual({ min: Math.round(min * 1.15), max: Math.round(max * 1.15), mean: Math.round(mean * 1.15) });
    for (let draw = min; draw <= max; draw++) {
      expect(socialActivityIncome(draw, 1.15)).toBe(Math.round(draw * 1.15));
    }
  });
});
