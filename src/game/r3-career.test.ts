import { describe, expect, it } from "vitest";
import { crearEstadoBase, crearEstadoPelea, emitirCheckpointCombate, genPugilista, sanitizarEstado, simularIntercambio, simularPeleaEntera, puedeEjecutarPelea } from "./engine";
import { reductor } from "./state";
import { migrarGuardado, hashTexto } from "./saveValidation";
import { RepositorioPartidas, CLAVE_GUARDADO } from "./saveRepository";
import { conFuenteAzar } from "./random";
import { objetivoConsejoCumplido } from "./consejos";

const fixture = () => ({ ...crearEstadoBase({ sinPoblacion: true }), creado: true, partidaId: "r3-synthetic", nombreJugador: "QA", nombreGimnasio: "QA", semana: 5 });
const counsel = (id: string, reclamado = false) => ({ id, texto: "Histórico", fama: 1, dinero: 60, cumplido: true, reclamado });

describe("R3 — hitos, compatibilidad y veladas", () => {
  it("revisión: evidencia pagada con identidad dañada no puede descartarse", () => {
    const old = { ...fixture(), schemaVersion: 6, consejos: [{ ...counsel("c11", true), id: 11 }, counsel("c8")] };
    expect(() => sanitizarEstado(old)).toThrow("Evidencia de cobro");
  });
  it("revisión: metadata desconocida no se sobrescribe en migración", () => {
    const old = { ...fixture(), schemaVersion: 6, contratosTitularesHistoricos: { datoExterno: 0 } };
    const before = structuredClone(old);
    expect(() => sanitizarEstado(old)).toThrow("Original protegido");
    expect(old).toEqual(before);
    const bytes = new Map([[CLAVE_GUARDADO, JSON.stringify(old)]]);
    const repo = new RepositorioPartidas({ durable: true, getItem: k => bytes.get(k) ?? null, setItem: (k, v) => { bytes.set(k, v); }, removeItem: k => { bytes.delete(k); } });
    const loaded = repo.cargar(); expect(repo.guardar(loaded)).toBe(false);
    expect(bytes).toEqual(new Map([[CLAVE_GUARDADO, JSON.stringify(old)]]));
  });
  it("revisión: un contrato cancelado no deja una excepción para otro con el mismo ID", () => {
    const p = genPugilista({ rol: "boxeador" }); p.circuito = "pro";
    const pelea = { id: "legacy-title", miId: p.id, rival: { ...p, id: "champ", titulo: 4 as const }, esTitulo: 4 as const, bolsa: 93000, velada: false, semanaProgramada: 5, diaProgramado: 6 };
    const current = sanitizarEstado({ ...fixture(), schemaVersion: 6, dia: 6, plantel: [p], pendientes: [pelea] });
    expect(puedeEjecutarPelea(current, current.pendientes[0])).toBe(true);
    const cancelled = reductor(current, { type: "CANCELAR_PELEA", peleaId: pelea.id });
    const reused = { ...pelea, bolsa: 150000 };
    expect(puedeEjecutarPelea({ ...cancelled, pendientes: [reused] }, reused)).toBe(false);
    expect(cancelled.dinero).toBe(current.dinero);
    expect(sanitizarEstado(cancelled).contratosTitularesHistoricos).toEqual([]);
  });
  it("revisión: contrato histórico no elude identidad, salud, fecha ni recibos R2", () => {
    const p = genPugilista({ rol: "boxeador" }); p.circuito = "pro";
    const pelea = { id: "legacy-title", miId: p.id, rival: { ...p, id: "champ", titulo: 4 as const }, esTitulo: 4 as const, bolsa: 93000, velada: false, semanaProgramada: 5, diaProgramado: 6 };
    const current = sanitizarEstado({ ...fixture(), schemaVersion: 6, dia: 6, plantel: [p], pendientes: [pelea] });
    for (const own of [{ ...p, energia: 0 }, { ...p, licenciaFederativa: false }, { ...p, circuito: "amateur" as const }, { ...p, genero: p.genero === "M" ? "F" as const : "M" as const }]) {
      expect(puedeEjecutarPelea({ ...current, plantel: [own] }, pelea)).toBe(false);
    }
    expect(puedeEjecutarPelea({ ...current, dia: 5 }, pelea)).toBe(false);
    expect(puedeEjecutarPelea({ ...current, semana: 6 }, pelea)).toBe(false);
    const result = simularPeleaEntera(crearEstadoPelea(pelea, current.plantel[0], []), "equilibrado");
    const forged = { ...result, bolsa: result.bolsa + 1 };
    expect(reductor(current, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: forged }).dinero).toBe(current.dinero);
  });
  it("revisión: un ID externo sano y sus datos JSON permanecen intactos", () => {
    const unknown = { ...counsel("externo", true), externo: { cero: 0, lista: [false, "dato"] } };
    const old = { ...fixture(), schemaVersion: 6, consejos: [unknown, counsel("c8")] };
    const migrated = sanitizarEstado(old);
    expect(migrated.consejos.find(c => c.id === "externo")).toEqual(unknown);
    expect(sanitizarEstado(migrated)).toEqual(migrated);
    expect(reductor(migrated, { type: "RECLAMAR_CONSEJO", id: "externo" }).dinero).toBe(migrated.dinero);
  });
  it.each([2, 3, 4])("A21: umbrales exactos y únicos con valor %i", n => {
    const s = fixture(); s.recreativos = n; s.seguidores = n + 1497; s.stats.victorias = n;
    expect(objetivoConsejoCumplido("c8", s)).toBe(n >= 3);
    expect(objetivoConsejoCumplido("c9", s)).toBe(n >= 3);
    expect(objetivoConsejoCumplido("c10", s)).toBe(n >= 3);
    s.consejos = s.consejos.map(c => ({ ...c, cumplido: true }));
    for (const id of ["c8", "c9", "c10"]) {
      const paid = reductor(s, { type: "RECLAMAR_CONSEJO", id });
      expect(objetivoConsejoCumplido(id, paid)).toBe(false);
      expect(reductor(paid, { type: "RECLAMAR_CONSEJO", id }).dinero).toBe(paid.dinero);
    }
  });
  it("A21: crea exactamente diez objetivos, sin sucesores después de pagar", () => {
    const s = fixture(); expect(s.consejos.map(c => c.id)).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 1}`));
    const ready = { ...s, consejos: s.consejos.map(c => ({ ...c, cumplido: true })) };
    const paid = reductor(ready, { type: "RECLAMAR_CONSEJO", id: "c10" });
    expect(paid.consejos).toHaveLength(10); expect(paid.dinero - ready.dinero).toBe(120);
    expect(reductor(paid, { type: "RECLAMAR_CONSEJO", id: "c10" }).dinero).toBe(paid.dinero);
  });
  it("A21: schema6 consolida derechos, archiva duplicados sin inventar pagos ni borrar extensiones", () => {
    const old = { ...fixture(), schemaVersion: 6, consejos: [counsel("c11"), { ...counsel("c8"), extension: { sano: 0 } }, counsel("c14"), counsel("desconocido")] };
    const before = structuredClone(old); const migrated = sanitizarEstado(old);
    expect(old).toEqual(before); expect(migrated.dinero).toBe(old.dinero);
    expect(migrated.consejos.filter(c => !c.reclamado && !(c as { archivado?: boolean }).archivado && /^c(8|11|14)$/.test(c.id)).map(c => c.id)).toEqual(["c11"]);
    for (const id of ["c8", "c14"]) expect(migrated.consejos.find(c => c.id === id)).toMatchObject({ reclamado: false, archivado: true });
    expect(migrated.consejos.find(c => c.id === "c8")).toHaveProperty("extension", { sano: 0 });
    expect(migrated.consejos.find(c => c.id === "desconocido")).toEqual(old.consejos[3]);
    expect(migrarGuardado(migrated)).toEqual({ estado: migrated, migrado: false });
    const paid = reductor(migrated, { type: "RECLAMAR_CONSEJO", id: "c11" });
    expect(paid.dinero).toBe(old.dinero + 60);
    expect(reductor(paid, { type: "RECLAMAR_CONSEJO", id: "c8" }).dinero).toBe(paid.dinero);
  });
  it("A21: un objetivo ya pagado archiva todos los derechos duplicados y preserva pagos históricos", () => {
    const old = { ...fixture(), schemaVersion: 6, consejos: [counsel("c11"), counsel("c14", true), counsel("c8")] };
    const migrated = sanitizarEstado(old);
    expect(migrated.consejos.find(c => c.id === "c14")).toMatchObject({ reclamado: true });
    for (const id of ["c11", "c8"]) {
      expect(migrated.consejos.find(c => c.id === id)).toMatchObject({ reclamado: false, archivado: true });
      expect(reductor(migrated, { type: "RECLAMAR_CONSEJO", id }).dinero).toBe(old.dinero);
    }
  });
  it("A21/R1: IDs idénticos se diagnostican y conflictivos protegen original", () => {
    const s = { ...fixture(), schemaVersion: 6, consejos: [counsel("c8"), counsel("c8")] };
    expect(sanitizarEstado(s).consejos.filter(c => c.id === "c8")).toHaveLength(1);
    expect(() => sanitizarEstado({ ...s, consejos: [counsel("c8"), { ...counsel("c8"), texto: "Otro" }] })).toThrow("ID conflictivo");
  });
  it.each([6, 7])("A21/R1: schema %i no pierde evidencia de cobro en un registro corrupto", schemaVersion => {
    const raw = { ...fixture(), schemaVersion, consejos: [{ ...counsel("c11", true), texto: 17 }, counsel("c8")] };
    const original = structuredClone(raw);
    expect(() => sanitizarEstado(raw)).toThrow("Evidencia de cobro");
    expect(raw).toEqual(original);
    const bytes = new Map([[CLAVE_GUARDADO, JSON.stringify(raw)]]);
    const repo = new RepositorioPartidas({ durable: true, getItem: k => bytes.get(k) ?? null, setItem: (k, v) => { bytes.set(k, v); }, removeItem: k => { bytes.delete(k); } });
    const candidate = repo.cargar();
    expect(repo.guardar(candidate)).toBe(false);
    expect(bytes).toEqual(new Map([[CLAVE_GUARDADO, JSON.stringify(raw)]]));
  });
  it("A21/R1: un valor reparable no provoca un segundo ID durante migración", () => {
    const old = { ...fixture(), schemaVersion: 6, consejos: [{ ...counsel("c8"), fama: -1 }, counsel("c11")] };
    const migrated = sanitizarEstado(old);
    expect(migrated.consejos.filter(c => c.id === "c8")).toEqual([{ ...counsel("c8"), fama: 0 }]);
    expect(migrated.consejos.find(c => c.id === "c11")).toMatchObject({ archivado: true, reclamado: false });
  });
  it("A10: carga preserva oferta antigua sin RNG; rechazo y regeneración explícita gratuitos", () => {
    const p = genPugilista({ rol: "boxeador" }); p.circuito = "pro"; p.peleasProfesionales = 25;
    const rival = { ...p, id: "champ", titulo: 4 as const };
    const oferta = { id: "legacy-offer", rival, nivel: "desafio" as const, bolsa: 93000, esTitulo: 0 as const, etiqueta: "Experiencia", detalle: "Legacy" };
    const s = { ...fixture(), schemaVersion: 6, plantel: [p], ofertasPara: p.id, ofertas: [oferta] };
    const loaded = conFuenteAzar(() => { throw new Error("Carga consumió RNG"); }, () => sanitizarEstado(s));
    expect(loaded.ofertas).toEqual(s.ofertas); expect(loaded.pendientes).toEqual([]);
    const rejected = conFuenteAzar(() => { throw new Error("Rechazo consumió RNG"); }, () => reductor(loaded, { type: "ELEGIR_OFERTA", ofertaId: oferta.id }));
    expect(rejected.dinero).toBe(s.dinero); expect(rejected.ofertas).toEqual(s.ofertas); expect(rejected.pendientes).toEqual([]);
    expect(rejected.toasts[rejected.toasts.length - 1]?.texto).toContain("sin costo");
    const fresh = reductor(rejected, { type: "BUSCAR_RIVAL", id: p.id });
    expect(fresh.dinero).toBe(s.dinero); expect(fresh.ofertas).toHaveLength(3);
    expect(fresh.ofertas.every(o => o.esTitulo === 0 && o.rival.titulo === 0)).toBe(true);
    expect(sanitizarEstado(fresh).ofertas).toEqual(fresh.ofertas);
  });
  it("A10/R2: contrato antiguo pactado/iniciado conserva checkpoint, bolsa y pago único", () => {
    const p = genPugilista({ rol: "boxeador" }); p.circuito = "pro";
    const rival = { ...p, id: "champ", titulo: 4 as const };
    const pelea = { id: "legacy-bout", miId: p.id, rival, esTitulo: 0 as const, bolsa: 93000, velada: false, semanaProgramada: 5, diaProgramado: 6 };
    let s = { ...fixture(), dia: 6, schemaVersion: 6, plantel: [p], pendientes: [pelea] };
    const session = crearEstadoPelea(pelea, p, []); session.semillaAzar = 77; simularIntercambio(session);
    const checkpoint = emitirCheckpointCombate(session);
    s = { ...s, combateActivo: checkpoint };
    const current = sanitizarEstado(s);
    expect(current.pendientes).toEqual(s.pendientes); expect(current.combateActivo).toEqual(checkpoint); expect(current.dinero).toBe(s.dinero);
    const resumed = structuredClone(current.combateActivo!);
    const uninterrupted = simularPeleaEntera(structuredClone(checkpoint), "equilibrado");
    const result = simularPeleaEntera(resumed, "equilibrado");
    expect(result).toEqual(uninterrupted);
    expect(current.combateActivo).toEqual(checkpoint);
    const finished = reductor(current, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(resumed) });
    expect(finished.combateActivo).toEqual(resumed);
    const paid = reductor(finished, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result });
    expect(paid.pendientes).toEqual([]); expect(paid.dinero - s.dinero).toBe(result.bolsa);
    expect(result.bolsa).toBe(result.gane ? 93000 : 27900);
    expect(reductor(paid, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result }).dinero).toBe(paid.dinero);
  });
  it("A10/R2: conserva un contrato titular antiguo sin TV; los nuevos siguen bloqueados", () => {
    const p = genPugilista({ rol: "boxeador" }); p.circuito = "pro";
    const rival = { ...p, id: "champ", titulo: 4 as const };
    const pelea = { id: "legacy-title", miId: p.id, rival, esTitulo: 4 as const, bolsa: 93000, velada: false, semanaProgramada: 5, diaProgramado: 6 };
    const s = { ...fixture(), dia: 6, schemaVersion: 6, plantel: [p], pendientes: [pelea] };
    const session = crearEstadoPelea(pelea, p, []); session.semillaAzar = 77; simularIntercambio(session);
    const checkpoint = emitirCheckpointCombate(session);
    const current = sanitizarEstado({ ...s, combateActivo: checkpoint });
    expect(current.pendientes).toEqual(s.pendientes); expect(current.combateActivo).toEqual(checkpoint);
    expect(puedeEjecutarPelea(current, pelea)).toBe(true);
    expect(puedeEjecutarPelea({ ...current, pendientes: [{ ...pelea, id: "new-title" }] }, { ...pelea, id: "new-title" })).toBe(false);
    const resumed = structuredClone(current.combateActivo!);
    const result = simularPeleaEntera(resumed, "equilibrado");
    const finished = reductor(current, { type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(resumed) });
    expect(finished.combateActivo).toEqual(resumed);
    const paid = reductor(finished, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result });
    expect(paid.pendientes).toEqual([]); expect(paid.dinero - current.dinero).toBe(result.bolsa);
    expect(paid.contratosTitularesHistoricos).toEqual([]);
    expect(reductor(sanitizarEstado(paid), { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado: result }).dinero).toBe(paid.dinero);
    expect(sanitizarEstado(current)).toEqual(current);
  });
  it("A21: protege bytes originales y respaldo al migrar; schema futuro bloquea escritura", () => {
    const bytes = new Map<string, string>();
    const repo = new RepositorioPartidas({ durable: true, getItem: k => bytes.get(k) ?? null, setItem: (k, v) => { bytes.set(k, v); }, removeItem: k => { bytes.delete(k); } });
    const old = { ...fixture(), schemaVersion: 6, consejos: [counsel("c8"), counsel("c11")] };
    const raw = JSON.stringify(old); bytes.set(CLAVE_GUARDADO, raw);
    const current = repo.cargar(); expect(repo.guardar(current)).toBe(true);
    expect(bytes.get(`${CLAVE_GUARDADO}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(repo.cargar()).toEqual(current);
    bytes.set(CLAVE_GUARDADO, JSON.stringify({ ...old, schemaVersion: 999 }));
    const before = new Map(bytes); repo.cargar(); expect(repo.guardar(current)).toBe(false); expect(bytes).toEqual(before);
  });
  it.each(["empty", "future", "injured", "orphan"])("A24: cancela tentativa %s sin ingresos, gastos, fama, prensa, contador ni RNG", kind => {
    const p = genPugilista({ rol: "boxeador" }); p.combo = "descanso";
    const rival = { ...p, id: "rival" };
    const s = { ...fixture(), dia: 5, plantel: kind === "empty" ? [] : [{ ...p, lesion: kind === "injured" ? { tipo: "golpe" as const, semanas: 1, gravedad: "leve" as const, tratamiento: 80 } : null }], veladaProgramada: true,
      pendientes: kind === "empty" ? [] : [{ id: "old-bout", miId: kind === "orphan" ? "absent" : p.id, rival, bolsa: 600, esTitulo: 0 as const, velada: true, semanaProgramada: kind === "future" ? 6 : 5, diaProgramado: 6 }] };
    let calls = 0; const after = conFuenteAzar(() => { calls++; return .8; }, () => reductor(s, { type: "AVANZAR_DIA" }));
    expect(after.veladaProgramada).toBe(false); expect(after.dinero).toBe(s.dinero); expect(after.stats.veladas).toBe(0);
    expect(after.fama).toBe(s.fama); expect(after.prensa).toEqual(s.prensa); expect(after.libroIngresos).toEqual([]); expect(after.libroGastos).toEqual([]); expect(calls).toBe(0);
  });
});
