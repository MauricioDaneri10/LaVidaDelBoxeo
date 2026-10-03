import { describe, expect, it } from "vitest";
import { crearEstadoBase } from "./engine";
import { RepositorioPartidas, CLAVE_GUARDADO as K } from "./saveRepository";
import { reductor } from "./state";
import { hashTexto, SCHEMA_ACTUAL } from "./saveValidation";

function isolated(seed = new Map<string, string>()) {
  const bytes = new Map(seed);
  let fault: (key: string) => boolean = () => false;
  const adapter = { durable: true, getItem: (k: string) => bytes.get(k) ?? null,
    setItem: (k: string, v: string) => { if (fault(k)) throw new Error("QuotaExceededError"); bytes.set(k, v); },
    removeItem: (k: string) => { if (fault(k)) throw new Error("SecurityError"); bytes.delete(k); } };
  return { bytes, adapter, repo: new RepositorioPartidas(adapter), fail: (f: typeof fault) => { fault = f; } };
}
function fixture() {
  let s = { ...crearEstadoBase(), creado: true, partidaId: "r4-persistence-synthetic" };
  for (const p of s.plantel) s = reductor(s, { type: "CAMBIAR_COMBO", id: p.id, combo: "acondicionamiento" });
  return s;
}

describe("R4 — guía, originales y almacenamiento operacional", () => {
  it("roundtrip exacto de decisiones Completo, hitos, ceros y extensiones desconocidas", () => {
    const s = { ...fixture(), seguidores: 0, dinero: 0, extensionR4: { intacto: 0 } };
    s.plantel[0].energia = 0;
    Object.assign(s.guiaClub!, { equipo: true, guanteos: true, extensionGuia: { literal: "No traducir" } });
    const { repo, adapter } = isolated();
    expect(repo.guardar(s)).toBe(true);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(s);
    expect(repo.listar()[0].estado).toEqual(s);
  });
  it("migración7→8 explícita e idempotente conserva original y backup al guardar", () => {
    const old = { ...fixture(), schemaVersion: 7, extensionLegacy: { desconocido: false } } as Record<string, unknown>;
    delete old.guiaClub;
    const raw = JSON.stringify(old);
    const backup = JSON.stringify(fixture());
    const { bytes, repo, adapter } = isolated(new Map([[K, raw], [`${K}:respaldo`, backup]]));
    const loaded = repo.cargar();
    expect(loaded.schemaVersion).toBe(SCHEMA_ACTUAL);
    expect(loaded.guiaClub!.enfoques).toBe(false);
    expect(bytes.get(K)).toBe(raw);
    expect(bytes.get(`${K}:respaldo`)).toBe(backup);
    expect(repo.guardar(loaded)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(loaded);
    expect(new RepositorioPartidas(adapter).guardar(loaded)).toBe(true);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(loaded);
  });
  it.each(["enfoques", "equipo", "guanteos", "licencia"])("un hito dañado (%s) no borra otros hitos válidos mediante autosave", field => {
    const old = fixture();
    Object.assign(old.guiaClub!, { equipo: true, guanteos: true, licencia: true, [field]: "dato corrupto" });
    const seed = new Map([[K, JSON.stringify(old)], [`${K}:respaldo`, JSON.stringify(fixture())]]);
    const { repo, bytes } = isolated(seed);
    const loaded = repo.cargar();
    expect(repo.estado.ok).toBe(false);
    expect(repo.guardar(loaded)).toBe(false);
    expect(bytes).toEqual(seed);
  });
  it("colisión legacy no reemplaza original ni backup con una guía inventada", () => {
    const old = { ...fixture(), schemaVersion: 7, guiaClub: { datosExternos: "intactos" } };
    const seed = new Map([[K, JSON.stringify(old)], [`${K}:respaldo`, JSON.stringify(fixture())]]);
    const { repo, bytes } = isolated(seed);
    expect(repo.guardar(repo.cargar())).toBe(false);
    expect(bytes).toEqual(seed);
  });
  it("schema futuro no migra ni habilita autosave sobre original o backup", () => {
    const seed = new Map([[K, JSON.stringify({ ...fixture(), schemaVersion: SCHEMA_ACTUAL + 1 })], [`${K}:respaldo`, JSON.stringify(fixture())]]);
    const { repo, bytes } = isolated(seed);
    expect(repo.guardar(repo.cargar())).toBe(false);
    expect(bytes).toEqual(seed);
  });
  it("fallo al proteger original7 impide escribir migración o ranuras", () => {
    const old = { ...fixture(), schemaVersion: 7 } as Record<string, unknown>;
    delete old.guiaClub;
    const seed = new Map([[K, JSON.stringify(old)]]);
    const { repo, bytes, fail } = isolated(seed);
    const loaded = repo.cargar();
    fail(k => k.includes(":recuperacion:"));
    expect(repo.guardar(loaded)).toBe(false);
    expect(repo.estado.ok).toBe(false);
    expect(bytes).toEqual(seed);
  });
  it("un fallo de autosave no reemplaza el progreso confirmado anteriormente", () => {
    const { repo, adapter, fail } = isolated();
    const saved = fixture();
    expect(repo.guardar(saved)).toBe(true);
    fail(k => k === K);
    expect(repo.guardar({ ...saved, guiaClub: { ...saved.guiaClub!, equipo: true } })).toBe(false);
    fail(() => false);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(saved);
  });
});
