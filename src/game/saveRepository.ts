import { crearEstadoBase } from "./engine";
import { ErrorGuardado, hashTexto, migrarGuardado, objeto, validarEstado } from "./saveValidation";
import { persistencia, type PersistenciaJuego } from "./storage";
import type { EstadoJuego, PartidaGuardada, SaveEnvelope } from "./types";

export const CLAVE_GUARDADO = "vida-del-boxeo-v2";
const K = CLAVE_GUARDADO;
const SLOTS = `${K}:partidas`;
const BACKUP = `${K}:respaldo`;
const TIME = `${K}:guardadoEn`;
const JOURNAL = `${K}:transaccion`;
const KEYS = [K, SLOTS, BACKUP, TIME];
const incompatible = (error: unknown) => error instanceof ErrorGuardado && error.codigo !== "corruption";
export interface EstadoGuardado { ok: boolean; mensaje: string; diagnosticos: string[] }
type Snapshot = Record<string, string | null>;
interface Transaction { formatVersion: 1; before: Snapshot; after: Snapshot; checksum: string }

/** One adapter per session/test. No access to real browser storage in fixtures. */
export class RepositorioPartidas {
  estado: EstadoGuardado = { ok: true, mensaje: "", diagnosticos: [] };
  private bloqueado = false;
  constructor(private storage: PersistenciaJuego) {}
  private fail(error: unknown): false {
    this.estado = { ok: false, mensaje: `No se guardó la partida: ${error instanceof Error ? error.message : "almacenamiento no disponible"}`, diagnosticos: this.estado.diagnosticos };
    return false;
  }
  private checked(key: string, value: string | null) {
    if (value === null) this.storage.removeItem(key); else this.storage.setItem(key, value);
    if (this.storage.getItem(key) !== value) throw new ErrorGuardado("El almacenamiento no confirmó la escritura.");
  }
  private snapshot(): Snapshot { return Object.fromEntries(KEYS.map(k => [k, this.read(k)])); }
  private transaction(): Transaction | null {
    const raw = this.storage.getItem(JOURNAL);
    if (raw === null) return null;
    const t: unknown = JSON.parse(raw);
    if (!objeto(t) || t.formatVersion !== 1 || !objeto(t.before) || !objeto(t.after) || KEYS.some(k => !(k in (t.before as Snapshot)) || !(k in (t.after as Snapshot)) || ![null, "string"].includes((t.before as Snapshot)[k] === null ? null : typeof (t.before as Snapshot)[k]) || ![null, "string"].includes((t.after as Snapshot)[k] === null ? null : typeof (t.after as Snapshot)[k])) || t.checksum !== hashTexto(JSON.stringify({ before: t.before, after: t.after }))) throw new ErrorGuardado("Journal corrupto: se protegieron las partidas y no se escribió nada.");
    return t as unknown as Transaction;
  }
  private read(key: string): string | null {
    const transaction = this.transaction();
    return transaction ? transaction.before[key] : this.storage.getItem(key);
  }
  private decode(raw: string) {
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrarGuardado(parsed);
    if (!objeto(migrated.estado) || !Array.isArray(migrated.estado.plantel) && !("plantel" in migrated.estado) || !("dinero" in migrated.estado)) throw new ErrorGuardado("No contiene una partida reconocible.");
    const validated = validarEstado(parsed, crearEstadoBase({ sinPoblacion: true }));
    return { ...validated, migrado: migrated.migrado };
  }
  private protect(raw: string) {
    const key = `${K}:recuperacion:${hashTexto(raw)}`;
    const previous = this.storage.getItem(key);
    if (previous !== null && previous !== raw) throw new ErrorGuardado("Conflicto en la copia de recuperación. Original protegido.");
    if (previous === null) this.checked(key, raw);
  }
  private recoverTransaction() {
    const t = this.transaction();
    if (!t) return;
    // Preserve both sides before rollback, including progress in an uncommitted write.
    this.protect(JSON.stringify(t));
    for (const key of KEYS) this.checked(key, t.before[key]);
    this.checked(JOURNAL, null);
  }
  private commit(after: Snapshot) {
    this.recoverTransaction();
    const before = this.snapshot();
    const t: Transaction = { formatVersion: 1, before, after, checksum: hashTexto(JSON.stringify({ before, after })) };
    this.checked(JOURNAL, JSON.stringify(t));
    try {
      for (const key of KEYS) if (before[key] !== after[key]) this.checked(key, after[key]);
      this.checked(JOURNAL, null); // Only this completes the multi-key transaction.
    } catch (error) {
      // Best effort immediate rollback. If denied/full, journal retains both snapshots.
      try { this.recoverTransaction(); } catch { /* read() uses the pre-commit snapshot */ }
      throw error;
    }
  }
  cargar(): EstadoJuego {
    this.bloqueado = false;
    try {
      const raw = this.read(K);
      if (raw === null) return crearEstadoBase();
      try {
        const decoded = this.decode(raw);
        this.estado = { ok: true, mensaje: decoded.migrado || decoded.diagnosticos.length ? "Partida recuperada/migrada; el original se conservará antes de guardar." : "", diagnosticos: decoded.diagnosticos };
        return decoded.estado;
      } catch (error) {
        // Incompatibility/ambiguous migration must never fall back and overwrite it.
        if (incompatible(error)) throw error;
        const backup = this.read(BACKUP);
        if (backup === null) throw error;
        const decoded = this.decode(backup);
        this.estado = { ok: false, mensaje: "Se recuperó el respaldo. El original dañado se conservará al guardar.", diagnosticos: decoded.diagnosticos };
        return decoded.estado;
      }
    } catch (error) {
      this.bloqueado = true;
      this.fail(error);
      return crearEstadoBase(); // UI-only; blocked writer cannot replace recoverable bytes.
    }
  }
  listar(): PartidaGuardada[] {
    try { return this.slots(false); } catch (error) { this.fail(error); return []; }
  }
  private slots(strict: boolean): PartidaGuardada[] {
    const raw = this.read(SLOTS);
    if (raw === null) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new ErrorGuardado("Índice de ranuras corrupto. No se reemplazó.");
    const ids = new Map<string, PartidaGuardada>();
    let repair = false;
    const slots = arr.flatMap(x => {
      try {
        if (!objeto(x) || typeof x.id !== "string" || !x.id || typeof x.nombre !== "string" || typeof x.guardadaEn !== "string" || !Number.isFinite(Date.parse(x.guardadaEn))) throw new ErrorGuardado("Ranura inválida.");
        const decoded = this.decode(JSON.stringify(x.estado));
        if (decoded.estado.partidaId !== x.id) throw new ErrorGuardado("Identidad de ranura incoherente.");
        if (decoded.migrado || decoded.diagnosticos.length) repair = true;
        const meta = { ...x, estado: decoded.estado } as unknown as PartidaGuardada;
        for (const [key, fallback] of Object.entries({ coach: decoded.estado.nombreJugador, gimnasio: decoded.estado.nombreGimnasio, semana: decoded.estado.semana, dia: decoded.estado.dia, dinero: decoded.estado.dinero })) {
          const value = x[key];
          const valid = typeof fallback === "string" ? typeof value === "string" : typeof value === "number" && Number.isFinite(value) && (key === "dinero" || Number.isInteger(value) && value >= 1 && (key !== "dia" || value <= 7));
          if (!valid) { (meta as unknown as Record<string, unknown>)[key] = fallback; repair = true; }
        }
        const previous = ids.get(x.id);
        if (previous) {
          if (JSON.stringify(previous.estado) !== JSON.stringify(meta.estado)) throw new ErrorGuardado("Ranuras con identidad conflictiva: original protegido.", "ambiguous");
          repair = true; return [];
        }
        ids.set(x.id, meta);
        return [meta];
      } catch (error) {
        if (strict && incompatible(error)) throw error;
        repair = true;
        this.fail(error); return [];
      }
    });
    if (strict && repair) this.protect(raw);
    return slots;
  }
  guardar(estado: EstadoJuego, nombre?: string): boolean {
    try {
      if (this.bloqueado) throw new ErrorGuardado("Carga fallida: original protegido. No se habilita el autosave de una carrera vacía.");
      if (this.storage.durable === false) throw new ErrorGuardado("Almacenamiento denegado: la sesión está solo en memoria y se perderá al cerrar.");
      const decoded = validarEstado(estado, crearEstadoBase({ sinPoblacion: true }));
      if (decoded.diagnosticos.length) {
        this.estado = { ...this.estado, diagnosticos: decoded.diagnosticos };
        throw new ErrorGuardado(`Estado inválido (${decoded.diagnosticos.length} campos): ${decoded.diagnosticos.slice(0, 3).join(", ").slice(0, 200)}. Se conservaron los datos anteriores.`);
      }
      // JSON.stringify silently converts NaN/Infinity; validation must run BEFORE serialization.
      const base = this.snapshot();
      const previous = this.read(K);
      const backup = this.read(BACKUP);
      let validPrevious = false;
      let protectPrevious = false;
      if (previous !== null) {
        try { const d = this.decode(previous); validPrevious = !d.diagnosticos.length; protectPrevious = d.migrado || !validPrevious; }
        catch (error) {
          if (incompatible(error)) throw error;
          if (backup === null) throw new ErrorGuardado("Original dañado y sin respaldo: no se sobrescribió.");
          const recovered = this.decode(backup);
          if (recovered.estado.partidaId !== estado.partidaId) throw new ErrorGuardado("La recuperación no corresponde a esta carrera.");
          protectPrevious = true;
        }
      }
      if (backup !== null) {
        try { this.decode(backup); }
        catch (error) {
          if (incompatible(error)) throw error;
          this.protect(backup);
        }
      }
      const slots = this.slots(true);
      const id = decoded.estado.partidaId;
      if (estado.creado && !id) throw new ErrorGuardado("La carrera necesita identidad estable.");
      if (estado.creado && slots.length >= 5 && !slots.some(x => x.id === id)) throw new ErrorGuardado("Las cinco ranuras están ocupadas. Eliminá explícitamente una desde el inicio; no se borró ninguna.");
      const savedAt = new Date().toISOString();
      const saved = nombre === undefined ? decoded.estado : { ...decoded.estado, nombrePartida: nombre.trim() || "Mi carrera" };
      const envelope: SaveEnvelope = { formatVersion: 1, gameVersion: saved.version, schemaVersion: saved.schemaVersion, saveId: saved.partidaId, savedAt, checksum: hashTexto(JSON.stringify(saved)), state: saved };
      const payload = JSON.stringify(envelope);
      // Originals are immutable recovery copies. Failure to protect prevents the commit.
      if (previous !== null && protectPrevious) this.protect(previous);
      const partida: PartidaGuardada = { id, nombre: saved.nombrePartida, coach: saved.nombreJugador, gimnasio: saved.nombreGimnasio, semana: saved.semana, dia: saved.dia, dinero: saved.dinero, guardadaEn: savedAt, estado: saved };
      const after = { ...base, [K]: payload, [TIME]: savedAt, [BACKUP]: validPrevious ? previous : backup, [SLOTS]: estado.creado ? JSON.stringify([partida, ...slots.filter(x => x.id !== id)]) : this.read(SLOTS) };
      this.commit(after);
      this.estado = { ok: true, mensaje: "Partida guardada y escritura verificada.", diagnosticos: [] };
      return true;
    } catch (error) { return this.fail(error); }
  }
  borrar(id: string): boolean {
    try {
      if (this.storage.durable === false) throw new ErrorGuardado("Almacenamiento no persistente.");
      const slots = this.slots(true);
      const before = this.snapshot();
      if (before[SLOTS] !== null) this.protect(before[SLOTS]);
      this.commit({ ...before, [SLOTS]: JSON.stringify(slots.filter(x => x.id !== id)) });
      return true;
    } catch (error) { return this.fail(error); }
  }
}
export const repositorioPartidas = new RepositorioPartidas(persistencia);
