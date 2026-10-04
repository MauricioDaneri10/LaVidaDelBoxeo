import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aplicarEntrenamientoSemanal, cerrarAsalto, consejoEsquina, crearEstadoBase, crearEstadoPelea, fechaDelJuego, genPugilista, puedeHabilitar, resolverPelea, sanitizarEstado, simularIntercambio, simularPeleaEntera, puedeGuantear, enfoqueRecomendado, crecerAtributo, emitirCheckpointCombate } from "./engine";
import { reductor } from "./state";
import { usarSemilla } from "./random";
import * as random from "./random";
import { migrarGuardado, SCHEMA_ACTUAL } from "./saveValidation";
import type { EstadoJuego, Pelea } from "./types";
import { RepositorioPartidas, CLAVE_GUARDADO } from "./saveRepository";

let restore: () => void;
beforeEach(() => { restore = usarSemilla(220001); });
afterEach(() => { restore(); vi.restoreAllMocks(); });
function fixture() {
  const p = genPugilista({ rol: "boxeador", genero: "M" });
  const rival = genPugilista({ rol: "boxeador", genero: "M" });
  rival.division = p.division;
  const pelea: Pelea = { id: "r2-bout", miId: p.id, rival, bolsa: 600, esTitulo: 0, velada: false, semanaProgramada: 1, diaProgramado: 6 };
  const s: EstadoJuego = { ...crearEstadoBase(), creado: true, partidaId: "fixture-r2", plantel: [p], pendientes: [pelea], cursos: ["dt"] };
  return { s, p, rival, pelea };
}
describe("R2: reproducciones originales / invariantes", () => {
  it("A17: cada golpe conserva su estado propio, no el futuro del asalto", () => {
    const { p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    simularIntercambio(e);
    expect(e.acciones.length).toBeGreaterThan(0);
    for (const acc of e.acciones) expect(acc).toHaveProperty("estadoVisual");
  });
  it("A03: el comando normal no llega al domingo con pelea pendiente", () => {
    const { s } = fixture();
    const next = reductor({ ...s, dia: 6 }, { type: "AVANZAR_DIA" });
    expect(next.dia).toBe(6); expect(next.resumen).toBeNull();
  });
  it("A03: semana rápida se detiene al entrar al sábado", () => {
    const { s } = fixture();
    expect(reductor({ ...s, dia: 5 }, { type: "SEMANA_RAPIDA" }).dia).toBe(6);
  });
  it("A04: un sábado ya procesado no vuelve a sumar guanteos tras recargar", () => {
    const { s, p, rival } = fixture();
    const saturday = { ...s, dia: 6, pendientes: [], plantel: [p, rival] };
    const next = reductor(sanitizarEstado(JSON.parse(JSON.stringify(saturday))), { type: "SEMANA_RAPIDA" });
    expect(next.plantel.map(x => x.guanteosRealizados)).toEqual([0, 0]);
  });
  it("A05: puntos heredados no habilitan licencia sin diez sesiones", () => {
    const { s, p } = fixture();
    const learner = { ...p, rol: "alumno" as const, licenciaFederativa: false, fogueo: 10, guanteosRealizados: 7 };
    expect(puedeHabilitar(learner, s)).toBe(false);
    expect(reductor({ ...s, plantel: [learner], pendientes: [] }, { type: "LICENCIAR", id: p.id }).plantel[0].rol).toBe("alumno");
  });
  it("A06: lesión impide el guanteo automático", () => {
    const { s, p, rival } = fixture();
    const lesionado = { ...p, lesion: { tipo: "mano" as const, semanas: 2, gravedad: "media" as const, tratamiento: 220 } };
    const next = reductor({ ...s, dia: 5, pendientes: [], plantel: [lesionado, rival] }, { type: "AVANZAR_DIA" });
    expect(next.plantel[0].guanteosRealizados).toBe(0); expect(next.plantel[0].energia).toBe(p.energia);
  });
  it("A07: DT utiliza la pelea individual, no la primera del array", () => {
    const { s, p, rival, pelea } = fixture();
    const otro = { ...p, id: "otro" };
    const r1 = { ...rival, atrib: { ...rival.atrib, defensa: 40, velocidad: 40 } };
    const r2 = { ...rival, atrib: { ...rival.atrib, defensa: 90, velocidad: 90, potencia: 90 } };
    const next = aplicarEntrenamientoSemanal({ ...s, plantel: [p, otro], personal: [{ id: "dt", tipo: "directorTecnico", nombre: "DT" }], pendientes: [{ ...pelea, rival: r1 }, { ...pelea, id: "segunda", miId: otro.id, rival: r2 }] });
    expect(next.plantel[1].combo).toBe(consejoEsquina(otro, r2));
  });
  it("A09: entrenamiento conserva atributos heredados por encima del techo", () => {
    const { s, p } = fixture();
    const b = { ...p, combo: "noqueador" as const, atrib: { ...p.atrib, potencia: 60, talento: 35 } };
    expect(aplicarEntrenamientoSemanal({ ...s, plantel: [b] }).plantel[0].atrib.potencia).toBeGreaterThanOrEqual(60);
  });
  it("A14: resolver anticipadamente no altera ningún dato competitivo", () => {
    const { s, p, pelea } = fixture();
    const r = resolverPelea(crearEstadoPelea(pelea, p, []));
    const next = reductor(s, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: r });
    expect(next.dinero).toBe(s.dinero); expect(next.historial).toEqual([]); expect(next.pendientes).toEqual(s.pendientes);
  });
  it("A14: LEGADO sin requisitos no sustituye carrera", () => {
    const { s } = fixture();
    const next = reductor(s, { type: "LEGADO" });
    expect(next.partidaId).toBe(s.partidaId); expect(next.plantel).toEqual(s.plantel); expect(next.legados).toBe(s.legados);
  });
  it("A15: sufrir una caída no aumenta mérito del lado caído", () => {
    const { p, pelea } = fixture();
    const e = crearEstadoPelea(pelea, p, []);
    e.A.dmgDado = 5; e.B.dmgDado = 10; e.A.kdAsalto = 1;
    cerrarAsalto(e);
    expect(e.tarjetas.every(t => t.b === 10 && t.a === 8)).toBe(true);
  });
  it.each([
    [[{ a: 30, b: 27 }, { a: 30, b: 27 }, { a: 27, b: 30 }], "Decisión Dividida"],
    [[{ a: 27, b: 30 }, { a: 27, b: 30 }, { a: 27, b: 30 }], "Decisión Unánime"],
    [[{ a: 30, b: 27 }, { a: 30, b: 27 }, { a: 30, b: 30 }], "Decisión Mayoritaria"],
  ] as const)("A16: método por consenso %j", (cards, method) => {
    const { p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    e.tarjetas = cards.map(t => ({ ...t })); expect(resolverPelea(e).metodo).toBe(method);
  });
  it("A22: fecha almacenada y envejecimiento no adelantan el año a semana 49", () => {
    const { s, p } = fixture(); let next: EstadoJuego = { ...s, pendientes: [] };
    for (let i = 0; i < 48; i++) next = reductor({ ...next, dia: 7 }, { type: "CERRAR_DOMINGO" });
    expect(next.anio).toBe(fechaDelJuego(next.semana, next.dia).getFullYear());
    expect(next.plantel[0].edad).toBe(p.edad);
  });
  it("A22: aviso de un día el viernes expira el sábado", () => {
    const { s } = fixture();
    const next = reductor({ ...s, pendientes: [], dia: 5, eventos: [{ id: "ttl", tipo: "entrevista", de: "Radio", titulo: "Prueba", texto: "Prueba", venceEn: 1, opciones: [] }] }, { type: "AVANZAR_DIA" });
    expect(next.eventos).toEqual([]);
  });
});

const roundtrip = (s: EstadoJuego) => sanitizarEstado(JSON.parse(JSON.stringify(s)));
const competitivo = (s: EstadoJuego) => ({ dinero: s.dinero, plantel: s.plantel, pendientes: s.pendientes, historial: s.historial, stats: s.stats, cinturones: s.cinturones, fama: s.fama, libroIngresos: s.libroIngresos, libroGastos: s.libroGastos });

describe("R2: aceptación cruzada", () => {
  it("A14/A17: una exhibición no cambia la energía de una sesión en curso", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77;
    const st = reductor({ ...s, dia: 6, eventos: [{ id: "exhibicion", tipo: "desafio", de: "Barrio", titulo: "Exhibición", texto: "Exhibición", venceEn: 1, opciones: [{ texto: "Aceptar", accion: { tipo: "exhibicion" } }] }] }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    const next = reductor(st, { type: "EVENTO", id: "exhibicion", opcion: 0 });
    expect(next.plantel).toEqual(st.plantel); expect(next.dinero).toBe(st.dinero); expect(roundtrip(next).combateActivo).toEqual(e);
  });
  it("A16/R1: decisión mayoritaria sobrevive al guardado exactamente", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    e.tarjetas = [{ a: 30, b: 27 }, { a: 30, b: 27 }, { a: 30, b: 30 }];
    const next = { ...s, historial: [resolverPelea(e)] };
    expect(next.historial[0].metodo).toBe("Decisión Mayoritaria"); expect(roundtrip(next)).toEqual(next);
  });
  it("A17/R1: cero energía y semilla cero permanecen en el checkpoint", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    e.semillaAzar = 0; e.A.energia = 0; e.B.energia = 0;
    const next = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    expect(roundtrip(next).combateActivo).toEqual(e);
  });
  it("A14/A17: un resultado rerolleado no reemplaza la sesión pendiente", () => {
    const { s, p, pelea } = fixture(); const actual = crearEstadoPelea(pelea, p, []); actual.semillaAzar = 77; simularIntercambio(actual);
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(actual) });
    const fake = crearEstadoPelea(pelea, p, []); fake.semillaAzar = 991;
    const result = simularPeleaEntera(fake, "equilibrado");
    expect(competitivo(reductor(st, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result }))).toEqual(competitivo(st));
  });
  it("A17: cambiar el enfoque del púgil en combate no invalida el checkpoint", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77;
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    const changed = reductor(st, { type: "CAMBIAR_COMBO", id: p.id, combo: "descanso" });
    expect(changed.plantel).toEqual(st.plantel); expect(roundtrip(changed).combateActivo).toEqual(st.combateActivo);
  });
  it("A17/R1: escritura fallida y checkpoint corrupto conservan la sesión recuperable", () => {
    const bytes = new Map<string, string>(); let fallo = false;
    const repo = new RepositorioPartidas({ durable: true, getItem: k => bytes.get(k) ?? null,
      setItem: (k, v) => { if (fallo) throw new Error("Cuota llena"); bytes.set(k, v); }, removeItem: k => { bytes.delete(k); } });
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77; simularIntercambio(e);
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    expect(repo.guardar(st)).toBe(true); expect(repo.cargar()).toEqual(st);
    const before = new Map(bytes); fallo = true;
    expect(repo.guardar({ ...st, nombrePartida: "Otro nombre" })).toBe(false); expect(bytes).toEqual(before);
    fallo = false;
    const corrupt = JSON.stringify({ ...st, combateActivo: { ...e, A: { ...e.A, hp: "roto" } } });
    bytes.set(CLAVE_GUARDADO, corrupt); bytes.set(`${CLAVE_GUARDADO}:respaldo`, JSON.stringify(st));
    expect(repo.cargar().combateActivo).toEqual(st.combateActivo); expect(bytes.get(CLAVE_GUARDADO)).toBe(corrupt);
  });
  it("A03: una pelea futura no bloquea una fecha anterior", () => {
    const { s, pelea } = fixture(); const input = { ...s, dia: 6, pendientes: [{ ...pelea, semanaProgramada: 2 }] };
    expect(reductor(input, { type: "AVANZAR_DIA" }).dia).toBe(7);
  });
  it("A17: semilla dirigida produce caída recuperable exactamente en intercambio 3", () => {
    const { p, pelea } = fixture();
    for (const k of Object.keys(p.atrib) as Array<keyof typeof p.atrib>) {
      p.atrib[k] = 70; pelea.rival.atrib[k] = 1;
    }
    p.rasgo = ""; pelea.rival.rasgo = "";
    const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 72;
    Object.assign(e.A, { poderDmg: 18.2, precision: 1 }); Object.assign(e.B, { hp: 100, hpMax: 100, evasion: 0, precision: 0 });
    const a = simularIntercambio(e), b = simularIntercambio(e), c = simularIntercambio(e);
    expect([a.caida, a.ko, b.caida, b.ko]).toEqual([null, null, null, null]);
    expect(c).toEqual({ caida: "b", ko: null }); expect(e.intercambiosAsalto).toBe(3);
  });
  it.each(["finalPrematuro", "asaltoSaltado", "identidadCruzada"] as const)("PR R2: checkpoint semánticamente inválido %s protege original y backup", caso => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77;
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    const otro = { ...p, id: "otro-pugil" };
    const broken = structuredClone({ ...st, plantel: [...st.plantel, otro] });
    if (caso === "finalPrematuro") broken.combateActivo!.finalizada = true;
    if (caso === "asaltoSaltado") broken.combateActivo!.asalto = 3;
    if (caso === "identidadCruzada") broken.combateActivo!.A.p = otro;
    expect(() => sanitizarEstado(broken)).toThrow(/Checkpoint/);
    const original = JSON.stringify(broken), backup = JSON.stringify(st);
    const bytes = new Map([[CLAVE_GUARDADO, original], [`${CLAVE_GUARDADO}:respaldo`, backup]]);
    const repo = new RepositorioPartidas({ durable: true, getItem: k => bytes.get(k) ?? null,
      setItem: (k, v) => { bytes.set(k, v); }, removeItem: k => { bytes.delete(k); } });
    expect(repo.cargar()).toEqual(st);
    expect(bytes.get(CLAVE_GUARDADO)).toBe(original); expect(bytes.get(`${CLAVE_GUARDADO}:respaldo`)).toBe(backup);
  });
  it.each(["finalRapido", "finalUI", "koAntesDelResumen"] as const)("PR R2: fase terminal válida %s conserva roundtrip exacto", caso => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77;
    if (caso === "koAntesDelResumen") { e.ko = "b"; e.B.hp = 0; e.B.caidas = 1; e.intercambiosAsalto = 1; }
    else {
      e.A.precision = 0; e.B.precision = 0;
      simularPeleaEntera(e, "equilibrado");
      expect(e.ko).toBeNull(); expect(e.asaltosCerrados).toBe(e.totalAsaltos);
      if (caso === "finalUI") e.asalto = e.totalAsaltos + 1;
    }
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    expect(st.combateActivo).toEqual(e); expect(roundtrip(st)).toEqual(st);
  });
  it("A17/R1: corrupción del checkpoint no se repara reseteando salud", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77;
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    expect(() => sanitizarEstado({ ...st, combateActivo: { ...st.combateActivo, A: { ...e.A, hp: NaN } } })).toThrow(/Checkpoint/);
    expect(() => sanitizarEstado({ ...st, combateActivo: { ...st.combateActivo, pelea: { ...pelea, id: "huerfana" } } })).toThrow(/Checkpoint/);
    expect(roundtrip(st)).toEqual(st);
  });
  it("A17/A14: final guardado se reabre con mismo resultado y paga una sola vez", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []); e.semillaAzar = 77;
    const r = simularPeleaEntera(e, "equilibrado");
    const st = roundtrip(reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) }));
    const restored = resolverPelea(st.combateActivo!); expect(restored).toEqual(r);
    const resolved = reductor(st, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: restored });
    expect(resolved.combateActivo).toBeNull(); expect(resolved.stats.peleas).toBe(1);
    expect(reductor(roundtrip(resolved), { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: restored }).dinero).toBe(resolved.dinero);
  });
  it("A15: igualdad exacta sin sesgo no favorece al lado A", () => {
    vi.spyOn(random, "numeroAleatorio").mockReturnValue(.5);
    const { p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    cerrarAsalto(e); expect(e.tarjetas).toEqual([{ a: 10, b: 10 }, { a: 10, b: 10 }, { a: 10, b: 10 }]);
  });
  it("A17: checkpoint persiste salud, asalto y azar; continuar no rerollea", () => {
    const { s, p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    e.semillaAzar = 7722; simularIntercambio(e);
    const st = reductor({ ...s, dia: 6 }, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });
    const loaded = roundtrip(st);
    expect(loaded.combateActivo).toEqual(st.combateActivo); expect(loaded.combateActivo).not.toBeNull();
    const uninterrupted = simularPeleaEntera(structuredClone(e), "equilibrado");
    expect(simularPeleaEntera(loaded.combateActivo!, "equilibrado")).toEqual(uninterrupted);
  });
  it.each([1, 5, 6])("A03: desde día %s no se salta una cartelera múltiple", dia => {
    const { s, p, rival, pelea } = fixture(); const otro = { ...p, id: "segundo" };
    let next = reductor({ ...s, dia, plantel: [p, otro], pendientes: [pelea, { ...pelea, id: "dos", miId: otro.id, rival }] }, { type: "SEMANA_RAPIDA" });
    expect(next.dia).toBe(6); expect(next.resumen).toBeNull();
    next = roundtrip(next);
    next = reductor(next, { type: "CANCELAR_PELEA", peleaId: pelea.id });
    expect(reductor(next, { type: "AVANZAR_DIA" }).dia).toBe(6);
    const before = next.plantel.map(x => x.guanteosRealizados);
    next = reductor(next, { type: "CANCELAR_PELEA", peleaId: "dos" });
    next = reductor(next, { type: "SEMANA_RAPIDA" });
    expect(next.dia).toBe(7); expect(next.plantel.map(x => x.guanteosRealizados)).toEqual(before);
    expect(reductor(next, { type: "AVANZAR_DIA" })).toEqual(next);
  });
  it("A03/A06: cartelera automática detiene semana rápida antes de balance/guanteo", () => {
    const { s, p, rival } = fixture();
    const next = reductor({ ...s, pendientes: [], plantel: [p, rival], personal: [{ id: "rep", nombre: "Representante", tipo: "representante" }] }, { type: "SEMANA_RAPIDA" });
    expect(next.dia).toBe(6); expect(next.pendientes).toHaveLength(1); expect(next.resumen).toBeNull();
    const booked = next.plantel.find(x => x.id === next.pendientes[0].miId)!;
    expect(booked.guanteosRealizados).toBe(0);
    expect(reductor(roundtrip(next), { type: "CERRAR_DOMINGO" }).semana).toBe(s.semana);
  });
  it("A04: normal y rápida cobran velada y guanteos una sola vez", () => {
    const { s, p, rival, pelea } = fixture();
    // R3 requires an actual valid bout for a show. Two other boxers still spar.
    const competidor = { ...p, id: "r2-show-own" };
    const pactada = { ...pelea, miId: competidor.id, velada: true };
    const input = { ...s, dia: 5, pendientes: [pactada], veladaProgramada: true, plantel: [p, rival, competidor] };
    let next = reductor(input, { type: "AVANZAR_DIA" });
    expect(next.stats.veladas).toBe(1); expect(next.plantel[0].guanteosRealizados).toBe(1);
    next = roundtrip(next);
    const result = simularPeleaEntera(crearEstadoPelea(pactada, next.plantel[2], []), "equilibrado");
    next = reductor(next, { type: "RESOLVER_PELEA", peleaId: pactada.id, resultado: result });
    expect(next.pendientes).toHaveLength(0);
    next = reductor(roundtrip(next), { type: "SEMANA_RAPIDA" });
    expect(next.stats.veladas).toBe(1); expect(next.plantel[0].guanteosRealizados).toBe(1);
    expect(next.resumen!.ingresos.filter(x => x.concepto === "Entradas de la velada del sábado")).toHaveLength(1);
  });
  it.each([0, 9, 10, 11])("A05: licencia exclusivamente por %s sesiones reales", sesiones => {
    const { s, p } = fixture();
    const alumno = { ...p, rol: "alumno" as const, licenciaFederativa: false, fogueo: 99, fogueoMeta: 1, guanteosRealizados: sesiones };
    const input = { ...s, pendientes: [], plantel: [alumno] };
    expect(puedeHabilitar(alumno, input)).toBe(sesiones >= 10);
    const next = reductor(input, { type: "LICENCIAR", id: alumno.id });
    expect(next.plantel[0].rol).toBe(sesiones >= 10 ? "boxeador" : "alumno");
    expect(roundtrip(next).plantel[0].guanteosRealizados).toBe(sesiones);
  });
  it.each(["alumno", "amateur", "pro"] as const)("A05: %s sigue guanteando más allá de diez", etapa => {
    const { s, p, rival } = fixture();
    const b = { ...p, guanteosRealizados: 10, rol: etapa === "alumno" ? "alumno" as const : "boxeador" as const, circuito: etapa === "pro" ? "pro" as const : "amateur" as const };
    const next = reductor({ ...s, dia: 5, pendientes: [], plantel: [b, rival] }, { type: "AVANZAR_DIA" });
    expect(next.plantel[0].guanteosRealizados).toBe(11);
    expect(roundtrip(next).plantel[0]).toEqual(next.plantel[0]);
  });
  it.each(["lesion", "descanso", "espera", "energia", "medico", "cartelera", "sinCompanero"] as const)("A06: %s bloquea selector y ejecución", motivo => {
    const { s, p, rival } = fixture();
    const b = { ...p, energia: motivo === "energia" ? 19 : 100, combo: motivo === "descanso" ? "descanso" as const : p.combo, enEspera: motivo === "espera", proximaPeleaSemana: motivo === "medico" ? 2 : null,
      lesion: motivo === "lesion" ? { tipo: "mano" as const, semanas: 1, gravedad: "leve" as const, tratamiento: 80 } : null };
    const input = { ...s, dia: 5, plantel: motivo === "sinCompanero" ? [b] : [b, rival], pendientes: motivo === "cartelera" ? s.pendientes : [] };
    expect(puedeGuantear(b, { ...input, dia: 6 })).toBe(false);
    const next = reductor(input, { type: "AVANZAR_DIA" });
    expect(next.plantel[0].guanteosRealizados).toBe(0); expect(next.plantel[0].energia).toBe(b.energia);
  });
  it("A06: recuperarse permite volver a guantear", () => {
    const { s, p, rival } = fixture();
    let next = reductor({ ...s, dia: 7, pendientes: [], plantel: [{ ...p, energia: 0, lesion: { tipo: "mano", semanas: 1, gravedad: "leve", tratamiento: 80 } }, rival] }, { type: "CERRAR_DOMINGO" });
    expect(next.plantel[0].lesion).toBeNull();
    expect(puedeGuantear(next.plantel[0], next)).toBe(true);
    next = reductor(next, { type: "SEMANA_RAPIDA" }); expect(next.plantel[0].guanteosRealizados).toBe(1);
  });
  it.each([35, 69, 70])("A07: ficha y DT comparten prioridad con energía %s", energia => {
    const { s, p } = fixture(); const b = { ...p, energia };
    const input = { ...s, plantel: [b], personal: [{ id: "dt", nombre: "DT", tipo: "directorTecnico" as const }] };
    expect(enfoqueRecomendado(b, input) === "descanso").toBe(energia < 70);
    expect(aplicarEntrenamientoSemanal(input).plantel[0].combo).toBe(enfoqueRecomendado(b, input));
  });
  it("A07: orden invertido de peleas, contratación y nueva alta", () => {
    const { s, p, rival, pelea } = fixture(); const otro = { ...p, id: "otro" };
    const input = { ...s, plantel: [p, otro], pendientes: [{ ...pelea, rival: { ...rival, atrib: { ...rival.atrib, defensa: 40, velocidad: 40 } } }, { ...pelea, id: "otro-combate", miId: otro.id, rival: { ...rival, atrib: { ...rival.atrib, defensa: 90, velocidad: 90, potencia: 90 } } }] };
    const hired = reductor(input, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
    const reversed = reductor({ ...input, pendientes: [...input.pendientes].reverse() }, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
    expect(hired.plantel.map(x => x.combo)).toEqual(reversed.plantel.map(x => x.combo));
    expect(hired.plantel[1].combo).toBe("tactico");
    const next = reductor(hired, { type: "SCOUT" }); const nuevo = next.plantel[next.plantel.length - 1];
    expect(nuevo.guanteosRealizados).toBe(0); expect(nuevo.combo).toBe(enfoqueRecomendado(nuevo, next));
    const recovered = { ...p, energia: 70, lesion: null };
    expect(enfoqueRecomendado({ ...p, lesion: { tipo: "mano", semanas: 1, gravedad: "leve", tratamiento: 80 } }, s)).toBe("descanso");
    expect(enfoqueRecomendado(recovered, { ...s, pendientes: [] })).not.toBe("descanso");
  });
  it.each([37, 38, 60])("A09: atributos %s debajo/en/sobre techo, entrenamiento y sparring", actual => {
    const { s, p, rival } = fixture(); const b = { ...p, combo: "noqueador" as const, atrib: { ...p.atrib, potencia: actual, tecnica: actual, defensa: actual, mentalidad: actual, inteligencia: actual, talento: 35 } };
    expect(crecerAtributo(actual, 1, 38)).toBe(actual < 38 ? 38 : actual);
    const trained = aplicarEntrenamientoSemanal({ ...s, plantel: [b] }).plantel[0];
    expect(trained.atrib.potencia).toBeGreaterThanOrEqual(actual);
    const rested = aplicarEntrenamientoSemanal({ ...s, plantel: [{ ...b, combo: "descanso" }] }).plantel[0];
    expect(rested.atrib.mentalidad).toBeGreaterThanOrEqual(actual); expect(rested.atrib.inteligencia).toBeGreaterThanOrEqual(actual);
    const sparred = reductor({ ...s, dia: 5, pendientes: [], plantel: [b, rival] }, { type: "AVANZAR_DIA" }).plantel[0];
    expect(sparred.atrib.tecnica).toBeGreaterThanOrEqual(actual); expect(sparred.atrib.defensa).toBeGreaterThanOrEqual(actual);
  });
  it.each(["anticipado", "otroPugil", "rival", "bolsa", "fama", "titulo", "lesion", "circuito", "copiado", "incompleto"] as const)("A14: %s no muta datos competitivos", caso => {
    const { s, p, pelea } = fixture(); let input = { ...s, dia: 6 };
    let result = caso === "incompleto" ? resolverPelea(crearEstadoPelea(pelea, p, [])) : simularPeleaEntera(crearEstadoPelea(pelea, p, []), "equilibrado");
    if (caso === "anticipado") input.dia = 5;
    if (caso === "otroPugil") result.miId = "otro";
    if (caso === "rival") result.rivalNombre = "Otro rival";
    if (caso === "bolsa") result.bolsa = 1_000_000;
    if (caso === "fama") result.fama = 100;
    if (caso === "titulo") result.tituloGanado = 4;
    if (caso === "lesion") input.plantel = [{ ...p, lesion: { tipo: "mano", semanas: 1, gravedad: "leve", tratamiento: 80 } }];
    if (caso === "circuito") input.plantel = [{ ...p, circuito: "pro" }];
    if (caso === "copiado") result = JSON.parse(JSON.stringify(result));
    const next = reductor(input, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result });
    expect(competitivo(next)).toEqual(competitivo(input));
  });
  it("A14: combate legítimo paga una vez y permanece exacto tras recarga", () => {
    const { s, p, pelea } = fixture(); const input = { ...s, dia: 6 };
    const result = simularPeleaEntera(crearEstadoPelea(pelea, p, []), "equilibrado");
    const next = reductor(input, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result });
    expect(next.stats.peleas).toBe(1); expect(next.dinero).toBe(s.dinero + result.bolsa);
    expect(next.historial[0].fama).toBe(result.fama); expect(roundtrip(next)).toEqual(next);
    const duplicate = reductor(roundtrip(next), { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result });
    expect(duplicate).toEqual(next);
  });
  it("A14: título/circuito incompatibles en una sesión emitida se rechazan", () => {
    const { s, p, pelea } = fixture(); const incompatible = { ...pelea, esTitulo: 4 as const };
    const input = { ...s, dia: 6, pendientes: [incompatible] };
    const r = simularPeleaEntera(crearEstadoPelea(incompatible, p, []), "equilibrado");
    expect(competitivo(reductor(input, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: r }))).toEqual(competitivo(input));
  });
  it.each([[100, 1, 0, 0], [1, 100, 0, 0], [5, 10, 1, 0], [10, 5, 0, 1], [5, 10, 2, 0], [10, 5, 0, 2], [10, 10, 1, 1], [10, 10, 0, 0]])("A15: simetría A/B con daño y caídas %j", (da, db, ka, kb) => {
    vi.spyOn(random, "numeroAleatorio").mockReturnValue(.5);
    const { p, pelea } = fixture(); const a = crearEstadoPelea(pelea, p, []), b = crearEstadoPelea(pelea, p, []);
    Object.assign(a.A, { dmgDado: da, kdAsalto: ka }); Object.assign(a.B, { dmgDado: db, kdAsalto: kb });
    Object.assign(b.A, { dmgDado: db, kdAsalto: kb }); Object.assign(b.B, { dmgDado: da, kdAsalto: ka });
    cerrarAsalto(a); cerrarAsalto(b);
    expect(a.tarjetas.map(t => ({ a: t.b, b: t.a }))).toEqual(b.tarjetas);
    if (ka > 0) expect(a.tarjetas.every(t => t.a <= 8)).toBe(true);
    if (kb > 0) expect(a.tarjetas.every(t => t.b <= 8)).toBe(true);
  });
  it.each([[3, 0, "Decisión Unánime"], [2, 1, "Decisión Dividida"], [2, 0, "Decisión Mayoritaria"], [1, 1, "Empate"]] as const)("A16: consenso %s/%s conserva nombre al invertir lados", (va, vb, metodo) => {
    const { p, pelea } = fixture();
    const e = crearEstadoPelea(pelea, p, []);
    e.tarjetas = Array.from({ length: 3 }, (_, i) => i < va ? { a: 30, b: 27 } : i < va + vb ? { a: 27, b: 30 } : { a: 30, b: 30 });
    expect(resolverPelea(e).metodo).toBe(metodo);
    e.tarjetas = e.tarjetas.map(t => ({ a: t.b, b: t.a })); expect(resolverPelea(e).metodo).toBe(metodo);
  });
  it.each([0, 1, 2])("A17: caída recuperable en intercambio %s no deja asalto muerto", intercambio => {
    vi.spyOn(random, "numeroAleatorio").mockReturnValue(.12);
    const { p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    Object.assign(e.A, { poderDmg: 18.2, precision: 1, energia: 100 });
    e.B.evasion = 0; e.B.hp = 85; e.B.hpMax = 100;
    for (let i = 0; i < intercambio; i++) { e.B.hp = 100; simularIntercambio(e); }
    e.B.hp = 40;
    const r = simularIntercambio(e); expect(r.caida).toBe("b"); expect(r.ko).toBeNull();
    const result = simularPeleaEntera(e, "equilibrado");
    expect(e.finalizada).toBe(true); expect(result.miId).toBe(p.id); expect(result.caidasB).toBeGreaterThan(0);
  });
  it.each(["KO", "TKO", "sinEnergia", "normal"] as const)("A17: %s alcanza cierre válido", caso => {
    vi.spyOn(random, "numeroAleatorio").mockReturnValue(.12);
    const { p, pelea } = fixture(); const e = crearEstadoPelea(pelea, p, []);
    if (caso === "KO") { e.B.hp = 1; e.A.precision = 1; e.B.evasion = 0; }
    if (caso === "TKO") { e.B.caidas = 2; e.B.hp = 40; e.B.hpMax = 150; e.A.poderDmg = 10; e.A.precision = 1; e.B.evasion = 0; }
    if (caso === "sinEnergia") { e.A.energia = 0; e.B.energia = 0; }
    const r = simularPeleaEntera(e, "equilibrado");
    expect(e.finalizada).toBe(true); expect(e.ko !== null || e.asaltosCerrados === e.totalAsaltos).toBe(true);
    if (caso === "KO") expect(r.metodo).toBe("Nocaut");
    if (caso === "TKO") expect(r.metodo).toBe("Nocaut Técnico");
  });
  it.each([4, 8, 9, 12, 48, 52, 53, 109])("A22: normal/rápida/recarga coinciden en semana %s", semana => {
    const { s } = fixture(); const input = { ...s, semana, dia: 5, pendientes: [] };
    const reset = usarSemilla(12345); let normal = reductor(input, { type: "AVANZAR_DIA" }); normal = reductor(normal, { type: "AVANZAR_DIA" }); reset();
    const reset2 = usarSemilla(12345); const fast = reductor(input, { type: "SEMANA_RAPIDA" }); reset2();
    expect(normal).toMatchObject({ mes: fechaDelJuego(semana, 7).getMonth() + 1, anio: fechaDelJuego(semana, 7).getFullYear() });
    expect(normal.plantel.map(p => p.edad)).toEqual(fast.plantel.map(p => p.edad));
    expect(roundtrip(fast)).toEqual(fast);
    const monday = reductor(fast, { type: "CERRAR_DOMINGO" });
    expect(monday.mes).toBe(fechaDelJuego(semana + 1, 1).getMonth() + 1);
    expect(monday.anio).toBe(fechaDelJuego(semana + 1, 1).getFullYear());
  });
  it("A22: un evento ya vencido no se ejecuta por comando directo", () => {
    const { s } = fixture();
    const input = { ...s, eventos: [{ id: "vencido", tipo: "entrevista" as const, de: "Radio", titulo: "Vencido", texto: "Vencido", venceEn: 0, opciones: [{ texto: "Sí", accion: { tipo: "dinero" as const, monto: 500 } }] }] };
    expect(reductor(input, { type: "EVENTO", id: "vencido", opcion: 0 }).dinero).toBe(input.dinero);
  });
  it("R1/A16: schema 5 migra explícitamente para proteger la nueva categoría de decisión", () => {
    const { s } = fixture(); const old = { ...s, schemaVersion: 5 };
    delete old.guiaClub;
    const migrated = migrarGuardado(old);
    expect(migrated.migrado).toBe(true); expect(migrated.estado).toEqual({ ...old, combateActivo: null, schemaVersion: 9, contratosTitularesHistoricos: [], guiaClub: { alumnosIniciales: [], enfoquesConfirmados: [], enfoques: true, equipo: true, guanteos: true, licencia: true } });
    expect(SCHEMA_ACTUAL).toBe(9); expect(migrarGuardado(migrated.estado).migrado).toBe(false);
  });
});
