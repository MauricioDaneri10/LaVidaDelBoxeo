import { describe, expect, it, vi } from "vitest";
import * as engine from "./engine";
import { EQUIPOS, PERSONAL_INFO } from "./data";
import { usarSemilla } from "./random";
import { reductor } from "./state";
import type { EstadoJuego, GearId, PersonalId } from "./types";

const base = (): EstadoJuego => ({ ...engine.crearEstadoBase({ sinPoblacion: true }), semana: 6, cursos: ["clubes", "franquicias"], dinero: 10000 });
const empleado = (tipo: PersonalId, id: string = tipo) => ({ id, tipo, nombre: `Empleado ${id}` });

describe("R3 A08: efectos aprobados de equipamiento", () => {
  it.each([
    ["cuerdaVelocidad", { velocidad: 1.1 }],
    ["plataformaReaccion", { defensa: 1.1, eficacia: 1.1 }],
    ["barraProteinas", { fuerza: 1.2 }],
  ] as const)("%s modifica únicamente sus atributos", (id, cambios) => {
    const e = base();
    const esperado = { ...engine.calcularModificadores(e).gananciaAtributo, ...cambios };
    expect(engine.calcularModificadores({ ...e, equipamiento: [id] }).gananciaAtributo).toEqual(esperado);
  });

  it("apila cuerda y plataforma multiplicativamente con peras", () => {
    const m = engine.calcularModificadores({ ...base(), equipamiento: ["perasDoble", "cuerdaVelocidad", "plataformaReaccion"] });
    expect(m.gananciaAtributo.velocidad).toBe(1.25 * 1.1);
    expect(m.gananciaAtributo.eficacia).toBe(1.25 * 1.1);
    expect(m.gananciaAtributo.defensa).toBe(1.1);
  });

  it.each(["cuerdaVelocidad", "plataformaReaccion", "barraProteinas"] as GearId[])("%s produce el delta real sin redondeo ni techo", id => {
    const p = engine.genPugilista();
    p.atrib = { fuerza: 30, velocidad: 30, potencia: 30, resistencia: 30, ataque: 30, defensa: 30, tecnica: 30, eficacia: 30, inteligencia: 30, mentalidad: 30, talento: 90 };
    p.combo = id === "plataformaReaccion" ? "estilista" : "acondicionamiento";
    p.rasgo = "";
    const e = { ...base(), plantel: [p] };
    const entrenar = (equipamiento: GearId[]) => {
      const restaurar = usarSemilla(1001);
      try { return engine.aplicarEntrenamientoSemanal({ ...e, equipamiento }).plantel[0]; }
      finally { restaurar(); }
    };
    const antes = entrenar([]), despues = entrenar([id]);
    const objetivos = id === "cuerdaVelocidad" ? ["velocidad"] as const : id === "plataformaReaccion" ? ["defensa", "eficacia"] as const : ["fuerza"] as const;
    for (const k of objetivos) expect(despues.atrib[k] - p.atrib[k]).toBeCloseTo((antes.atrib[k] - p.atrib[k]) * (id === "barraProteinas" ? 1.2 : 1.1), 12);
    expect(despues.energia).toBe(antes.energia);
  });

  it("proteínas añade recuperación semanal 30→34 y acumula con salud existente", () => {
    expect(engine.calcularModificadores(base()).recuperacionEnergia).toBe(30);
    expect(engine.calcularModificadores({ ...base(), equipamiento: ["barraProteinas"] }).recuperacionEnergia).toBe(34);
    expect(engine.calcularModificadores({ ...base(), equipamiento: ["barraProteinas", "botiquin", "vendasGel"] }).recuperacionEnergia).toBe(44);
    expect(EQUIPOS.barraProteinas.efecto).toContain("recuperación semanal");
    expect([EQUIPOS.cuerdaVelocidad.costo, EQUIPOS.plataformaReaccion.costo, EQUIPOS.barraProteinas.costo]).toEqual([700, 1200, 3200]);
  });

  it.each([0, 50, 99])("compra desde energía %i no acredita energía inmediata y duplicado no cobra", energia => {
    const p = { ...engine.genPugilista(), energia };
    const e = { ...base(), plantel: [p] };
    const comprado = reductor(e, { type: "COMPRAR_EQUIPO", id: "barraProteinas" });
    expect(comprado.dinero).toBe(e.dinero - 3200);
    expect(comprado.plantel[0].energia).toBe(energia);
    const duplicado = reductor(comprado, { type: "COMPRAR_EQUIPO", id: "barraProteinas" });
    expect(duplicado.dinero).toBe(comprado.dinero);
    expect(duplicado.equipamiento).toEqual(["barraProteinas"]);
    expect(engine.calcularModificadores(JSON.parse(JSON.stringify(comprado))).recuperacionEnergia).toBe(34);
  });

  it.each([0, 50, 99])("cierre semanal desde energía %i aplica proteínas una vez y respeta techo tras reload", energia => {
    const p = { ...engine.genPugilista(), energia, combo: "noqueador" as const, rasgo: "" };
    const e = { ...base(), dia: 7, ultimaSemanaEntrenada: 6, plantel: [p] };
    const cerrar = (equipamiento: GearId[]) => {
      const restaurar = usarSemilla(1001);
      try { return reductor({ ...e, equipamiento }, { type: "CERRAR_DOMINGO" }); }
      finally { restaurar(); }
    };
    const normal = cerrar([]), proteinas = cerrar(["barraProteinas"]);
    expect(normal.plantel[0].energia).toBe(Math.min(100, energia + 30));
    expect(proteinas.plantel[0].energia).toBe(Math.min(100, energia + 34));
    const recargado = engine.sanitizarEstado(JSON.parse(JSON.stringify(proteinas)));
    expect(recargado.plantel[0].energia).toBe(proteinas.plantel[0].energia);
    const repetido = reductor(recargado, { type: "CERRAR_DOMINGO" });
    expect(repetido.plantel[0].energia).toBe(proteinas.plantel[0].energia);
  });
});

describe("R3 A11: selector compartido de contratación", () => {
  it.each(["gerente", "entrenadorLocal", "coordinadorSucursal"] as PersonalId[])("cero sucursales rechaza %s", tipo => {
    expect(engine.puedeContratarPersonal(base(), tipo).ok).toBe(false);
  });

  it.each([["gerente", "entrenadorLocal"], ["entrenadorLocal", "gerente"]] as const)("permite orden %s→%s con cupos independientes", (primero, segundo) => {
    const e = { ...base(), propiedades: ["sucursal"] as EstadoJuego["propiedades"] };
    expect(engine.puedeContratarPersonal(e, primero).ok).toBe(true);
    e.personal.push(empleado(primero));
    expect(engine.puedeContratarPersonal(e, segundo).ok).toBe(true);
    e.personal.push(empleado(segundo));
    expect(engine.puedeContratarPersonal(e, primero).ok).toBe(false);
    expect(engine.puedeContratarPersonal(e, segundo).ok).toBe(false);
    e.personal = e.personal.filter(p => p.tipo !== primero);
    expect(engine.puedeContratarPersonal(e, primero).ok).toBe(true);
  });

  it.each([0, 1, 3])("suspende coordinadores incondicionalmente con %i sucursales", cantidad => {
    const e = { ...base(), propiedades: Array(cantidad).fill("sucursal"), semana: 1, cursos: [] } as EstadoJuego;
    expect(engine.puedeContratarPersonal(e, "coordinadorSucursal")).toMatchObject({ ok: false, motivo: "funcionPendiente" });
    expect(engine.puedeContratarPersonal(e, "coordinadorSucursal").mensaje).toContain("función diferenciada");
  });

  it.each([0, 1, 3])("conserva %i coordinadores legacy y su salario, compartiendo cupo administrativo", cantidad => {
    const e = { ...base(), propiedades: ["sucursal"] as EstadoJuego["propiedades"], personal: Array.from({ length: cantidad }, (_, i) => empleado("coordinadorSucursal", `legacy-${i}`)) };
    const antes = structuredClone(e);
    expect(engine.puedeContratarPersonal(e, "gerente").ok).toBe(cantidad === 0);
    expect(engine.puedeContratarPersonal(e, "entrenadorLocal").ok).toBe(true);
    expect(engine.puedeContratarPersonal(e, "coordinadorSucursal").ok).toBe(false);
    expect(e).toEqual(antes);
    expect(PERSONAL_INFO.coordinadorSucursal.sueldo).toBe(140);
    expect(PERSONAL_INFO.coordinadorSucursal.desc).not.toContain("sede adicional");
    expect(PERSONAL_INFO.coordinadorSucursal.desc).toContain("contrato");
  });

  it("conserva requisitos de semana, fama, curso y puesto único", () => {
    const e = { ...base(), propiedades: ["sucursal"] as EstadoJuego["propiedades"] };
    expect(engine.puedeContratarPersonal({ ...e, semana: 3 }, "gerente").motivo).toBe("semana");
    expect(engine.puedeContratarPersonal({ ...e, cursos: [] }, "gerente").motivo).toBe("curso");
    expect(engine.puedeContratarPersonal({ ...e, fama: 0 }, "difusion").motivo).toBe("fama");
    expect(engine.puedeContratarPersonal({ ...e, personal: [empleado("asistente")] }, "asistente").motivo).toBe("cubierto");
  });

  it("UI consume el selector común en contratación y confirmación", async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (url: URL, encoding: string) => string }>("node:fs");
    const fuente = readFileSync(new URL("../components/panels.tsx", import.meta.url), "utf8");
    const panel = fuente.slice(fuente.indexOf("export function PanelPersonal"));
    expect(panel).toContain("puedeContratarPersonal(state, t)");
    expect(panel).toContain("disponibilidad.mensaje");
    expect(panel).not.toContain("Math.max(nSuc, 1)");
    expect(panel).not.toContain("limiteSucursal");
    expect(panel).toContain("contratacionPendiente === t && disponibilidad.ok");
  });
});
