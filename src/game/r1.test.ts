import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearEstadoBase, sanitizarEstado } from "./engine";
import { guardarPartida, guardarEnRanura, listarPartidas, migrarGuardado, reductor, CLAVE_GUARDADO } from "./state";
import { persistencia } from "./storage";
import { RepositorioPartidas } from "./saveRepository";
import { hashTexto, SCHEMA_ACTUAL, validarEstado } from "./saveValidation";
import { numeroAleatorio, usarSemilla } from "./random";

const K = CLAVE_GUARDADO;
function fixture() {
  const s = crearEstadoBase();
  return { ...s, creado: true, nombreJugador: "QA aislado", nombreGimnasio: "Fixture", partidaId: "r1-fixture", nombrePartida: "Fixture" };
}
function roundtrip(s: ReturnType<typeof fixture>) {
  return sanitizarEstado(migrarGuardado(JSON.parse(JSON.stringify(s))).estado);
}
describe("R1 — aceptación de partidas/carrera (sin almacenamiento del usuario)", () => {
  const memory = new Map<string, string>();
  beforeEach(() => {
    Object.defineProperty(persistencia, "durable", { value: true, configurable: true });
    memory.clear();
    vi.spyOn(persistencia, "getItem").mockImplementation(k => memory.get(k) ?? null);
    vi.spyOn(persistencia, "setItem").mockImplementation((k, v) => { memory.set(k, v); });
    vi.spyOn(persistencia, "removeItem").mockImplementation(k => { memory.delete(k); });
  });
  afterEach(() => { vi.restoreAllMocks(); Object.defineProperty(persistencia, "durable", { value: false, configurable: true }); });

  it("A01: pase profesional y debut conservan todos los contadores", () => {
    let s = fixture();
    const p = { ...s.plantel[0], rol: "boxeador" as const, licenciaFederativa: true, peleasAmateur: 50, record: { v: 32, d: 18, e: 0, ko: 12 } };
    s = reductor({ ...s, plantel: [p] }, { type: "PROMOVER_PRO", id: p.id });
    expect(s.plantel[0].circuito).toBe("pro");
    expect(roundtrip(s).plantel[0]).toEqual(s.plantel[0]);
    s.plantel[0] = { ...s.plantel[0], peleasProfesionales: 1, victoriasProfesionales: 1, record: { v: 33, d: 18, e: 0, ko: 12 } };
    expect(roundtrip(s).plantel[0]).toEqual(s.plantel[0]);
  });
  it.each([0, 1, 100])("A02: energía %s y seguidores cero sobreviven exactamente", energia => {
    const s = fixture();
    s.seguidores = 0; s.plantel[0].energia = energia;
    expect(roundtrip(s).seguidores).toBe(0);
    expect(roundtrip(s).plantel[0].energia).toBe(energia);
  });
  it("A13: roundtrip conserva todo estado válido, orden, arrays vacíos y resumen", () => {
    const s = fixture();
    s.rivales = []; s.nombrePartida = "";
    s.plantel.reverse();
    s.resumen = { ingresos: [{ concepto: "Cuotas", monto: 0 }], gastos: [], total: 0 };
    s.toasts = [{ id: 123, texto: "Prueba", tono: "info" }];
    expect(roundtrip(s)).toEqual(s);
  });
  it("A12: baja competitiva no legendaria archiva ficha completa", () => {
    const s = fixture();
    s.plantel[0] = { ...s.plantel[0], rol: "boxeador", licenciaFederativa: true };
    const p = structuredClone(s.plantel[0]);
    const baja = reductor(s, { type: "RETIRAR_ATLETA", id: p.id });
    expect(baja.salonFama).toHaveLength(0);
    const archivo = (roundtrip(baja) as unknown as { archivoCarreras: { pugilista: unknown }[] }).archivoCarreras;
    expect(archivo?.[0]?.pugilista).toEqual(p);
  });
  it("A13: null y tipos inválidos localizados no destruyen al compañero sano", () => {
    const s = fixture();
    const damaged = { ...s, plantel: [null, s.plantel[1]], eventos: [null], consejos: [null, s.consejos[0]], libroIngresos: [null, { concepto: "Sano", monto: 12 }, { concepto: "Mal", monto: Infinity }], stats: { ...s.stats, victorias: "no" }, personal: [null], cursos: [null, "dt", "desconocido"] };
    const cargado = sanitizarEstado(damaged);
    expect(cargado.plantel).toEqual([s.plantel[1]]);
    expect(cargado.consejos).toEqual([s.consejos[0]]);
    expect(cargado.eventos).toEqual([]);
    expect(cargado.libroIngresos).toEqual([{ concepto: "Sano", monto: 12 }]);
    expect(cargado.stats.victorias).toBe(0);
    expect(cargado.cursos).toEqual(["dt"]);
  });
  it("A13: IDs duplicados y peleas huérfanas se excluyen sin renombrar al sano", () => {
    const s = fixture(); const p = s.plantel[0];
    const pelea = { id: "pelea", miId: p.id, rival: s.rivales[0], bolsa: 0, esTitulo: 0, velada: false };
    const cargado = sanitizarEstado({ ...s, plantel: [p, p], pendientes: [pelea, pelea, { ...pelea, id: "huerfana", miId: "ausente" }] });
    expect(cargado.plantel).toEqual([p]);
    expect(cargado.pendientes).toEqual([pelea]);
  });
  it("A13: rechaza schemas futuros y envelopes desconocidos explícitamente", () => {
    expect(() => migrarGuardado({ ...fixture(), schemaVersion: 999 })).toThrow();
    expect(() => migrarGuardado({ formatVersion: 999, state: fixture() })).toThrow();
  });
  it("A13: migración antigua determinista e idempotente", () => {
    const viejo = { ...fixture(), schemaVersion: 1, partidaId: "" };
    const a = migrarGuardado(viejo); const b = migrarGuardado(viejo);
    expect(a.estado).toEqual(b.estado);
    expect(migrarGuardado(a.estado)).toEqual({ estado: a.estado, migrado: false });
  });
  it("A28: no sobrescribe primaria ni respaldo de un schema futuro", () => {
    const raw = JSON.stringify({ ...fixture(), schemaVersion: 999 });
    memory.set(K, raw); memory.set(`${K}:respaldo`, "respaldo anterior");
    expect(guardarPartida(fixture())).toBe(false);
    expect(memory.get(K)).toBe(raw);
    expect(memory.get(`${K}:respaldo`)).toBe("respaldo anterior");
  });
  it("A28: sexta ranura no elimina silenciosamente otra carrera", () => {
    for (let i = 0; i < 5; i++) expect(guardarEnRanura({ ...fixture(), partidaId: `slot-${i}` })).toBe(true);
    const antes = memory.get(`${K}:partidas`);
    expect(guardarEnRanura({ ...fixture(), partidaId: "sexta" })).toBe(false);
    expect(memory.get(`${K}:partidas`)).toBe(antes);
    expect(listarPartidas()).toHaveLength(5);
  });
  it("A28: fallo de escritura primaria no deja ranuras parcialmente actualizadas", () => {
    expect(guardarPartida(fixture())).toBe(true);
    const antes = memory.get(`${K}:partidas`);
    vi.mocked(persistencia.setItem).mockImplementation((k, v) => {
      if (k === K) throw new Error("QuotaExceededError");
      memory.set(k, v);
    });
    expect(guardarPartida({ ...fixture(), dinero: 1234 })).toBe(false);
    expect(memory.get(`${K}:partidas`)).toBe(antes);
  });
});

function isolated() {
  const bytes = new Map<string, string>();
  let fault: (k: string, v: string | null) => "throw" | "truncate" | undefined = () => undefined;
  const adapter = {
    durable: true,
    getItem: (k: string) => bytes.get(k) ?? null,
    setItem: (k: string, v: string) => {
      const fail = fault(k, v);
      if (fail === "throw") throw new DOMException("Almacenamiento lleno/denegado", "QuotaExceededError");
      bytes.set(k, fail === "truncate" ? v.slice(0, 20) : v);
    },
    removeItem: (k: string) => {
      if (fault(k, null)) throw new DOMException("Denegado", "SecurityError");
      bytes.delete(k);
    },
  };
  return { bytes, adapter, repo: new RepositorioPartidas(adapter), fault: (f: typeof fault) => { fault = f; } };
}
describe("R1 — recuperación operacional y aceptación ampliada", () => {
  it("A13: todos los sistemas persistidos preservan ceros, falsos y datos extensibles", () => {
    const s = fixture(); const { repo } = isolated(); const p = s.plantel[0];
    const result = { miId: p.id, rivalNombre: "Rival", gane: false, empate: true, metodo: "Empate" as const, tarjetas: [{ a: 30, b: 30 }], caidasA: 0, caidasB: 0, registroA: { jab: { lanzados: 0, conectados: 0 }, poder: { lanzados: 0, conectados: 0 } }, registroB: { jab: { lanzados: 0, conectados: 0 }, poder: { lanzados: 0, conectados: 0 } }, bolsa: 0, fama: 0, tituloGanado: 0 as const, resumen: "Empate QA" };
    s.dinero = 0; s.fama = 0; s.seguidores = 0;
    s.historial = [result]; s.resumen = { ingresos: [{ concepto: "Cero", monto: 0 }], gastos: [], total: 0 };
    s.libroIngresos = [{ concepto: "Movimiento", monto: 12.5 }];
    s.patrocinio = { nombre: "QA", semanal: 0, semanas: 0 }; s.prestamo = { saldo: 0, cuota: 0, semanasRestantes: 0 };
    s.personal = [{ id: "dt", tipo: "directorTecnico", nombre: "QA" }];
    s.cursos = ["dt"]; s.propiedades = ["sucursal", "sucursal"]; s.equipamiento = ["soga"];
    s.eventos = [{ id: "e", tipo: "entrevista", de: "QA", titulo: "QA", texto: "QA", venceEn: 0, opciones: [{ texto: "QA", accion: { tipo: "entrevista", fama: -1, monto: 0 } }] }];
    s.comunitarios = [{ tipo: "bingo", nombre: "QA" }]; s.prensa = [{ id: "nota", semana: 1, texto: "QA" }];
    s.cinturones = [{ id: "c", dueno: p.id, nivel: 1, semana: 1 }];
    s.salonFama = [{ id: "historico", nombre: "QA", club: "QA", record: { v: 0, d: 0, e: 0, ko: 0 }, titulos: 0, semanaRetiro: 1, motivo: "QA" }];
    const atributos = { ...p.atrib };
    for (const key of Object.keys(atributos) as (keyof typeof atributos)[]) atributos[key] = 0;
    s.plantel[0] = { ...p, energia: 0, lesion: { tipo: "mano", semanas: 0, gravedad: "leve", tratamiento: 0 }, atrib: atributos };
    const extended = { ...s, extensionJson: { texto: "ñ 👊", cero: 0, falso: false, lista: [], nulo: null } };
    expect(repo.guardar(extended)).toBe(true); expect(repo.cargar()).toEqual(extended);
  });
  it("A13/A28: 120 semanas con guardar/cargar entre acciones no modifican datos", () => {
    const { repo } = isolated(); let s = fixture();
    const restore = usarSemilla(1001);
    try {
      for (let week = 0; week < 120; week++) {
        for (let day = 0; day < 6; day++) {
          s = reductor(s, { type: "AVANZAR_DIA" });
          expect(repo.guardar(s)).toBe(true); expect(repo.cargar()).toEqual(s);
        }
        s = reductor(s, { type: "CERRAR_DOMINGO" });
        expect(repo.guardar(s)).toBe(true); expect(repo.cargar()).toEqual(s);
      }
    } finally { restore(); }
  });
  it("A13: una versión de juego antigua conocida migra explícitamente", () => {
    const s = fixture();
    const legacy = { ...s, version: 1, schemaVersion: 1 };
    const migrated = migrarGuardado(legacy);
    expect((migrated.estado as typeof s).version).toBe(2);
    expect((migrated.estado as typeof s).plantel).toEqual(s.plantel);
    expect(migrated.migrado).toBe(true);
  });
  it("A13/A28: guardar y validar no consumen azar del motor", () => {
    const s = fixture(); const { repo } = isolated();
    let restore = usarSemilla(71); const expected = numeroAleatorio(); restore();
    restore = usarSemilla(71);
    try { expect(repo.guardar(s)).toBe(true); expect(numeroAleatorio()).toBe(expected); }
    finally { restore(); }
  });
  it("A02: energía cero no se convierte en recuperación durante un roundtrip real", () => {
    const { repo } = isolated(); const s = fixture(); s.seguidores = 0; s.plantel[0].energia = 0;
    expect(repo.guardar(s)).toBe(true);
    expect(repo.cargar()).toEqual(s);
  });
  it("A01: persistencia real después del pase, y después del debut, es exacta", () => {
    const { repo } = isolated(); const s = fixture();
    const p = { ...s.plantel[0], rol: "boxeador" as const, licenciaFederativa: true, peleasAmateur: 50, record: { v: 32, d: 18, e: 0, ko: 12 } };
    const pro = reductor({ ...s, plantel: [p] }, { type: "PROMOVER_PRO", id: p.id });
    expect(repo.guardar(pro)).toBe(true); expect(repo.cargar()).toEqual(pro);
    const debut = { ...pro, plantel: [{ ...pro.plantel[0], peleasProfesionales: 1, derrotasProfesionales: 1, record: { v: 32, d: 19, e: 0, ko: 12 } }] };
    expect(repo.guardar(debut)).toBe(true); expect(repo.cargar()).toEqual(debut);
  });
  it.each(["alumno", "boxeador"] as const)("A12: baja de %s preserva la política existente y los datos sanos", rol => {
    const { repo } = isolated(); const s = fixture();
    s.plantel[0] = { ...s.plantel[0], rol, licenciaFederativa: rol === "boxeador" };
    const p = structuredClone(s.plantel[0]);
    const baja = reductor(s, { type: "RETIRAR_ATLETA", id: p.id });
    expect(baja.archivoCarreras).toHaveLength(rol === "boxeador" ? 1 : 0);
    expect(repo.guardar(baja)).toBe(true); expect(repo.cargar()).toEqual(baja);
    if (rol === "boxeador") expect(baja.archivoCarreras[0].pugilista).toEqual(p);
  });
  it("A12: campeón se conserva en archivo y Salón; pendiente no permite la baja", () => {
    const s = fixture(); const p = { ...s.plantel[0], rol: "boxeador" as const, licenciaFederativa: true, titulo: 4 as const };
    const active = { ...s, plantel: [p] };
    const pending = { ...active, pendientes: [{ id: "p", miId: p.id, rival: s.rivales[0], bolsa: 0, esTitulo: 0 as const, velada: false }] };
    const blocked = reductor(pending, { type: "RETIRAR_ATLETA", id: p.id });
    expect(blocked.archivoCarreras).toEqual([]); expect(blocked.plantel).toEqual([p]);
    const baja = reductor(active, { type: "RETIRAR_ATLETA", id: p.id });
    expect(baja.archivoCarreras[0].pugilista).toEqual(p); expect(baja.salonFama[0].id).toBe(p.id);
    baja.archivoCarreras[0].pugilista.record.v = 123;
    expect(p.record.v).not.toBe(123); // snapshot cannot alias live state
  });
  it("A13: corrupción localizada se diagnostica y conserva bytes originales antes de guardar", () => {
    const { repo, bytes } = isolated(); const s = fixture();
    const raw = JSON.stringify({ ...s, plantel: [s.plantel[0], null, s.plantel[1]], eventos: [null], personal: { roto: true } });
    bytes.set(K, raw);
    const recovered = repo.cargar();
    expect(recovered.plantel).toEqual([s.plantel[0], s.plantel[1]]);
    expect(repo.estado.diagnosticos.length).toBeGreaterThan(0);
    expect(bytes.get(K)).toBe(raw); // load itself never writes
    expect(repo.guardar(recovered)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(repo.cargar()).toEqual(recovered);
  });
  it.each([NaN, Infinity, -Infinity, null, "0", true])("A13: números inválidos %s se diagnostican, no se coaccionan", v => {
    const s = fixture();
    const validation = validarEstado({ ...s, dinero: v, seguidores: v, plantel: [{ ...s.plantel[0], energia: v, lesion: { tipo: "inventado", semanas: Infinity } }] }, crearEstadoBase());
    expect(validation.diagnosticos).toContain("estado.dinero");
    expect(validation.diagnosticos).toContain("estado.seguidores");
    expect(validation.diagnosticos).toContain("estado.plantel[0].energia");
    expect(Number.isFinite(validation.estado.dinero)).toBe(true);
    expect(validation.estado.plantel[0].lesion).toBeNull();
    expect(validation.estado.plantel[0].id).toBe(s.plantel[0].id);
  });
  it("A13: no serializa valores no finitos como null ni reporta guardado exitoso", () => {
    const { repo, bytes } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    const before = new Map(bytes);
    expect(repo.guardar({ ...s, dinero: Infinity })).toBe(false);
    expect(bytes).toEqual(before);
  });
  it.each([1, 2, 3, 4])("A13: schema antiguo %s migra una vez y su roundtrip posterior es exacto", version => {
    const { repo, bytes } = isolated(); const s = fixture();
    const old = { ...s, schemaVersion: version }; delete (old as Partial<typeof old>).archivoCarreras;
    const raw = JSON.stringify(old); bytes.set(K, raw);
    const current = repo.cargar();
    expect(current.schemaVersion).toBe(SCHEMA_ACTUAL);
    expect(current.plantel).toEqual(s.plantel); expect(current.dinero).toBe(s.dinero);
    expect(repo.guardar(current)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(repo.cargar()).toEqual(current);
    expect(migrarGuardado(current)).toEqual({ estado: current, migrado: false });
  });
  it.each(["schema", "format", "game", "ambiguous"])("A13/A28: %s incompatible no se sobrescribe ni usa backup para sustituirlo", type => {
    const { repo, bytes } = isolated(); const s = fixture();
    const raw = type === "format" ? JSON.stringify({ formatVersion: 99, state: s }) : type === "game" ? JSON.stringify({ ...s, version: 99 }) : type === "ambiguous" ? JSON.stringify({ ...s, schemaVersion: 1, plantel: [{ ...s.plantel[0], circuito: "pro", peleasAmateur: undefined }] }) : JSON.stringify({ ...s, schemaVersion: 999 });
    bytes.set(K, raw); bytes.set(`${K}:respaldo`, JSON.stringify(s));
    repo.cargar(); const before = new Map(bytes);
    expect(repo.estado.ok).toBe(false); expect(repo.guardar(s)).toBe(false);
    expect(bytes).toEqual(before);
  });
  it("A28: backup corrupto no impide cargar primaria sana y se protege al sustituirlo", () => {
    const { repo, bytes } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    bytes.set(`${K}:respaldo`, "{corrupto");
    expect(repo.cargar()).toEqual(s);
    expect(repo.guardar({ ...s, dinero: 1 })).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto("{corrupto")}`)).toBe("{corrupto");
    expect(JSON.parse(bytes.get(`${K}:respaldo`)!).state).toEqual(s);
  });
  it("A28: primaria corrupta y backup sano se recuperan sin perder ninguno", () => {
    const { repo, bytes } = isolated(); const s = fixture();
    bytes.set(K, "{incompleto"); bytes.set(`${K}:respaldo`, JSON.stringify(s));
    expect(repo.cargar()).toEqual(s); expect(repo.guardar(s)).toBe(true);
    expect(bytes.get(`${K}:respaldo`)).toBe(JSON.stringify(s));
    expect(bytes.get(`${K}:recuperacion:${hashTexto("{incompleto")}`)).toBe("{incompleto");
  });
  it("A28: primaria y backup corruptos no se sustituyen por el estado inicial", () => {
    const { repo, bytes } = isolated(); bytes.set(K, "roto"); bytes.set(`${K}:respaldo`, "también roto");
    const before = new Map(bytes); const initial = repo.cargar();
    expect(repo.guardar(initial)).toBe(false); expect(bytes).toEqual(before);
  });
  it.each([K, `${K}:partidas`, `${K}:guardadoEn`, `${K}:respaldo`, `${K}:transaccion`])("A28: fallo real en %s conserva la última versión comprometida", key => {
    const { repo, bytes, fault, adapter } = isolated(); const s = fixture();
    expect(repo.guardar(s)).toBe(true);
    fault(k => k === key ? "throw" : undefined);
    expect(repo.guardar({ ...s, dinero: 100 })).toBe(false);
    expect(repo.estado.ok).toBe(false);
    fault(() => undefined);
    const next = new RepositorioPartidas(adapter);
    expect(next.cargar()).toEqual(s);
    expect(next.listar()[0].estado).toEqual(s);
    expect(next.guardar({ ...s, dinero: 101 })).toBe(true);
    expect(next.cargar().dinero).toBe(101);
    expect(bytes.has(`${K}:transaccion`)).toBe(false);
  });
  it("A28: denegación persistente después de escritura parcial mantiene journal y permite recuperación al reiniciar", () => {
    const { repo, bytes, fault, adapter } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    let denied = false;
    fault(k => { if (k === `${K}:partidas`) denied = true; return denied ? "throw" : undefined; });
    expect(repo.guardar({ ...s, dinero: 222 })).toBe(false);
    expect(bytes.has(`${K}:transaccion`)).toBe(true);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(s);
    fault(() => undefined);
    const recovered = new RepositorioPartidas(adapter);
    expect(recovered.guardar(s)).toBe(true); expect(recovered.cargar()).toEqual(s);
  });
  it("A28: escritura truncada detectada por readback; no informa éxito", () => {
    const { repo, fault, adapter } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    fault(k => k === K ? "truncate" : undefined);
    expect(repo.guardar({ ...s, dinero: 12 })).toBe(false);
    fault(() => undefined);
    expect(new RepositorioPartidas(adapter).cargar()).toEqual(s);
  });
  it("A28: checksum detecta corrupción de JSON válido y recupera backup", () => {
    const { repo, bytes } = isolated(); const s = fixture();
    expect(repo.guardar(s)).toBe(true); expect(repo.guardar({ ...s, dinero: 45 })).toBe(true);
    const envelope = JSON.parse(bytes.get(K)!); envelope.state.dinero = 777;
    bytes.set(K, JSON.stringify(envelope));
    expect(repo.cargar()).toEqual(s);
  });
  it("A28: memoria fallback no se anuncia como almacenamiento persistente", () => {
    const { adapter, bytes } = isolated(); const repo = new RepositorioPartidas({ ...adapter, durable: false });
    expect(repo.guardar(fixture())).toBe(false); expect(repo.estado.mensaje).toContain("solo en memoria"); expect(bytes.size).toBe(0);
  });
  it("A28: falla al proteger original impide migración/escritura, no pierde bytes", () => {
    const { repo, bytes, fault } = isolated(); const legacy = { ...fixture(), schemaVersion: 4 };
    const raw = JSON.stringify(legacy); bytes.set(K, raw);
    const migrated = repo.cargar(); const before = new Map(bytes);
    fault(k => k.includes(":recuperacion:") ? "throw" : undefined);
    expect(repo.guardar(migrated)).toBe(false); expect(bytes).toEqual(before);
  });
  it("A28: ranura futura bloquea autosave sin truncar ninguna otra", () => {
    const { repo, bytes } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    const slots = JSON.parse(bytes.get(`${K}:partidas`)!);
    slots.push({ ...slots[0], id: "futuro", estado: { ...s, partidaId: "futuro", schemaVersion: 999 } });
    bytes.set(`${K}:partidas`, JSON.stringify(slots)); const before = new Map(bytes);
    expect(repo.guardar(s)).toBe(false); expect(bytes).toEqual(before);
  });
  it("A28: actualizar ranura existente con cinco ocupadas sí funciona", () => {
    const { repo } = isolated(); const s = fixture();
    for (let i = 0; i < 5; i++) expect(repo.guardar({ ...s, partidaId: `s-${i}` })).toBe(true);
    expect(repo.guardar({ ...s, partidaId: "s-0", dinero: 0 })).toBe(true);
    expect(repo.listar()).toHaveLength(5); expect(repo.listar()[0].estado.dinero).toBe(0);
  });
  it("A28: índice de ranuras parcialmente corrupto conserva sanas y copia íntegra", () => {
    const { repo, bytes } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    const raw = JSON.stringify([null, ...JSON.parse(bytes.get(`${K}:partidas`)!), { basura: 1 }]);
    bytes.set(`${K}:partidas`, raw);
    expect(repo.listar()).toHaveLength(1); expect(repo.guardar(s)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
    expect(repo.listar()[0].estado).toEqual(s);
  });
  it("A13: repair localizada es idempotente, incluyendo números y arrays malformados", () => {
    const s = fixture();
    const repaired = sanitizarEstado({ ...s, eventos: {}, plantel: [null, { ...s.plantel[0], energia: Infinity }], stats: { ...s.stats, peleas: NaN }, seguidores: "0" });
    expect(sanitizarEstado(repaired)).toEqual(repaired);
    expect(repaired.plantel[0].id).toBe(s.plantel[0].id);
  });
  it("A13: IDs conflictivos no arbitran silenciosamente entre dos historiales", () => {
    const { repo, bytes } = isolated(); const s = fixture(); const p = s.plantel[0];
    const raw = JSON.stringify({ ...s, plantel: [p, { ...p, nombre: "Otra identidad", record: { v: 9, d: 0, e: 0, ko: 0 } }] });
    bytes.set(K, raw); const before = new Map(bytes);
    repo.cargar(); expect(repo.estado.ok).toBe(false);
    expect(repo.guardar(s)).toBe(false); expect(bytes).toEqual(before);
  });
  it("A13: metadata inválida se diagnostica sin perder el estado sano del envelope", () => {
    const { repo, bytes } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    const envelope = JSON.parse(bytes.get(K)!); envelope.savedAt = null;
    const raw = JSON.stringify(envelope); bytes.set(K, raw);
    expect(repo.cargar()).toEqual(s);
    expect(repo.estado.diagnosticos).toContain("envelope.savedAt");
    expect(repo.guardar(s)).toBe(true);
    expect(bytes.get(`${K}:recuperacion:${hashTexto(raw)}`)).toBe(raw);
  });
  it("A28: journal corrupto bloquea escritura, sin descartar primaria/backup/ranuras", () => {
    const { repo, bytes } = isolated(); const s = fixture(); expect(repo.guardar(s)).toBe(true);
    bytes.set(`${K}:transaccion`, "{roto"); const before = new Map(bytes);
    repo.cargar(); expect(repo.guardar(s)).toBe(false); expect(bytes).toEqual(before);
  });
  it("A28: carrera de legado recibe una identidad guardable, sin perder la ranura anterior", () => {
    const { repo } = isolated(); const s = { ...fixture(), fama: 85 }; expect(repo.guardar(s)).toBe(true);
    const next = reductor(s, { type: "LEGADO" });
    expect(next.partidaId).not.toBe(s.partidaId);
    expect(repo.guardar(next)).toBe(true);
    expect(repo.listar().map(x => x.id)).toContain(s.partidaId);
    expect(repo.cargar()).toEqual(next);
  });
  it("A13/A28: cargar una ranura actual no descarta un libro válido por comparación de semana", () => {
    const s = fixture(); s.semanaLibro = 0; s.libroIngresos = [{ concepto: "Válido", monto: 17 }];
    vi.spyOn(persistencia, "getItem").mockImplementation(k => k === `${K}:partidas` ? JSON.stringify([{ id: s.partidaId, nombre: s.nombrePartida, guardadaEn: "2026-10-01", estado: s }]) : null);
    try {
      const loaded = reductor(fixture(), { type: "CARGAR_PARTIDA", id: s.partidaId });
      expect(loaded.libroIngresos).toEqual(s.libroIngresos); expect(loaded.semanaLibro).toBe(0);
    } finally { vi.restoreAllMocks(); }
  });
});
