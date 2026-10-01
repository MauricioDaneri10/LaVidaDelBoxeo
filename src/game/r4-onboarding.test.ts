import { describe, it, expect } from "vitest";
import { crearEstadoBase, genPugilista, sanitizarEstado } from "./engine";
import { reductor } from "./state";
import { migrarGuardado } from "./saveValidation";
import type { ComboId } from "./types";
import { registrarGuia } from "./onboarding";

const fixture = () => {
  const s = crearEstadoBase();
  return { ...s, creado: true, partidaId: "r4-fixture", semanaLibro: s.semana };
};
const guide = (s: unknown) => (s as { guiaClub?: { enfoques: boolean; equipo: boolean; guanteos: boolean; licencia: boolean } }).guiaClub;

describe("R4 — guía persistente sin inferir decisiones", () => {
  it("si todos los iniciales salen, vincula el paso pendiente a alumnos actuales sin inventar elecciones", () => {
    const before = fixture();
    before.guiaClub!.equipo = true;
    before.guiaClub!.guanteos = true;
    const nuevo = genPugilista({ rol: "alumno" });
    const next = registrarGuia(before, { ...before, plantel: [nuevo] }, { type: "CAMBIAR_COMBO", id: "ausente", combo: "descanso" });
    expect(next.guiaClub).toEqual({ ...before.guiaClub, alumnosIniciales: [nuevo.id] });
    const confirmado = reductor(next, { type: "CAMBIAR_COMBO", id: nuevo.id, combo: "acondicionamiento" });
    expect(confirmado.guiaClub).toEqual({ ...next.guiaClub, enfoques: true, enfoquesConfirmados: [nuevo.id] });
    expect(sanitizarEstado(confirmado)).toEqual(confirmado);
  });
  it("sin alumnos actuales no completa ni borra el paso pendiente", () => {
    const before = fixture();
    const next = registrarGuia(before, { ...before, plantel: [] }, { type: "CAMBIAR_COMBO", id: "ausente", combo: "descanso" });
    expect(next.guiaClub).toEqual(before.guiaClub);
  });
  it("si el hito está completo, la salida de iniciales no cambia su cohorte histórica", () => {
    const before = fixture();
    before.guiaClub!.enfoques = true;
    const nuevo = genPugilista({ rol: "alumno" });
    const next = registrarGuia(before, { ...before, plantel: [nuevo] }, { type: "CAMBIAR_COMBO", id: "ausente", combo: "descanso" });
    expect(next.guiaClub).toEqual(before.guiaClub);
  });
  it.each<ComboId>(["noqueador", "estilista", "presion", "tactico", "acondicionamiento", "descanso"])("elegir %s registra una decisión para cada alumno inicial", combo => {
    let s = fixture();
    for (const p of s.plantel) s = reductor(s, { type: "CAMBIAR_COMBO", id: p.id, combo });
    expect(guide(s)?.enfoques).toBe(true);
    expect(sanitizarEstado(s)).toEqual(s);
  });
  it("el enfoque default no completa la guía", () => {
    expect(guide(fixture())?.enfoques).toBe(false);
  });
  it("altas y cambios posteriores no revierten el hito inicial", () => {
    let s = fixture();
    for (const p of s.plantel) s = reductor(s, { type: "CAMBIAR_COMBO", id: p.id, combo: "acondicionamiento" });
    s = { ...s, plantel: [...s.plantel, genPugilista({ rol: "alumno" })] };
    s = reductor(s, { type: "CAMBIAR_COMBO", id: s.plantel[0].id, combo: "descanso" });
    expect(guide(s)?.enfoques).toBe(true);
  });
  it("migración sin licencia no inventa una elección Completo", () => {
    const old = { ...fixture(), schemaVersion: 7 } as Record<string, unknown>;
    delete old.guiaClub;
    const result = sanitizarEstado(old);
    expect(guide(result)?.enfoques).toBe(false);
    expect(sanitizarEstado(result)).toEqual(result);
  });
  it("migración con primera licencia fiable termina la guía sin fechas ni premios", () => {
    const s = fixture();
    const p = { ...s.plantel[0], rol: "boxeador" as const, licenciaFederativa: true, guanteosRealizados: 10 };
    const old = { ...s, schemaVersion: 7, plantel: [p] } as Record<string, unknown>;
    delete old.guiaClub;
    const before = structuredClone(old);
    const result = sanitizarEstado(old);
    expect(guide(result)).toMatchObject({ enfoques: true, equipo: true, guanteos: true, licencia: true });
    expect(result.dinero).toBe(old.dinero);
    expect(result.stats).toEqual(old.stats);
    expect(old).toEqual(before);
  });
  it("metadata antigua desconocida no se pisa", () => {
    const old = { ...fixture(), schemaVersion: 7, guiaClub: { extension: 0 } };
    const before = structuredClone(old);
    expect(() => migrarGuardado(old)).toThrow("original protegido");
    expect(old).toEqual(before);
  });
  it.each(["club-ausente", "fecha-no-finita", "historial-corrupto"])("no infiere primera licencia de un archivo dañado: %s", fallo => {
    const s = fixture();
    const archivo: Record<string, unknown> = { id: "archivo", club: "Club", semanaSalida: 1, motivo: "Transferencia", historial: [],
      pugilista: { ...s.plantel[0], rol: "boxeador", licenciaFederativa: true } };
    if (fallo === "club-ausente") delete archivo.club;
    if (fallo === "fecha-no-finita") archivo.semanaSalida = Infinity;
    if (fallo === "historial-corrupto") archivo.historial = [null];
    const old = { ...s, schemaVersion: 7, archivoCarreras: [archivo] } as Record<string, unknown>;
    delete old.guiaClub;
    const before = structuredClone(old);
    expect(guide(sanitizarEstado(old))?.licencia).toBe(false);
    expect(old).toEqual(before);
  });
  it("una licencia archivada íntegra es evidencia y no se altera al migrar", () => {
    const s = fixture();
    const archivo = { id: "archivo", club: "Club", semanaSalida: 1, motivo: "Transferencia", historial: [],
      pugilista: { ...s.plantel[0], rol: "boxeador" as const, licenciaFederativa: true } };
    const old = { ...s, schemaVersion: 7, archivoCarreras: [archivo] } as Record<string, unknown>;
    delete old.guiaClub;
    const migrated = sanitizarEstado(old);
    expect(migrated.guiaClub?.licencia).toBe(true);
    expect(migrated.archivoCarreras).toEqual([archivo]);
    expect(sanitizarEstado(migrated)).toEqual(migrated);
  });
});
