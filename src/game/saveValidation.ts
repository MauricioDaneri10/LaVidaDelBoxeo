import { COMBOS, COMUNITARIOS, CURSOS, DIVISIONES, EQUIPOS, PERSONAL_INFO, PROPIEDADES } from "./data";
import type { Atributos } from "./types";

export const ATRIBUTOS_BASE: Atributos = {
  fuerza: 40, velocidad: 40, potencia: 40, resistencia: 40,
  ataque: 40, defensa: 40, tecnica: 40, eficacia: 40,
  inteligencia: 40, mentalidad: 40, talento: 50,
};
import type { EstadoJuego } from "./types";
import { consolidarConsejos, evidenciaCobroDanada } from "./consejos";

export const SCHEMA_ACTUAL = 7;
export class ErrorGuardado extends Error {
  constructor(message: string, public readonly codigo: "corruption" | "incompatible" | "ambiguous" = "corruption") { super(message); }
}
type Obj = Record<string, unknown>;
export const objeto = (x: unknown): x is Obj => !!x && typeof x === "object" && !Array.isArray(x);
export function hashTexto(texto: string): string {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}

/** Migrations never invent a split of an aggregated professional/amateur record. */
export function migrarGuardado(raw: unknown): { estado: unknown; migrado: boolean } {
  if (!objeto(raw)) throw new ErrorGuardado("Formato de guardado inválido.");
  let s = raw;
  if ("formatVersion" in raw) {
    if (raw.formatVersion !== 1 || !objeto(raw.state)) throw new ErrorGuardado("Formato incompatible: no se sobrescribió la partida.", "incompatible");
    if ((typeof raw.state.schemaVersion === "number" && raw.state.schemaVersion > SCHEMA_ACTUAL) || (raw.state.version !== undefined && raw.state.version !== 1 && raw.state.version !== 2)) throw new ErrorGuardado("Versión incompatible: original protegido.", "incompatible");
    if (raw.checksum !== undefined && raw.checksum !== hashTexto(JSON.stringify(raw.state))) throw new ErrorGuardado("Escritura incompleta: checksum incorrecto.");
    if (raw.schemaVersion !== raw.state.schemaVersion || raw.gameVersion !== raw.state.version || raw.saveId !== raw.state.partidaId) throw new ErrorGuardado("Envelope y partida no coinciden.", "incompatible");
    s = raw.state;
  }
  if (s.version !== undefined && s.version !== 1 && s.version !== 2) throw new ErrorGuardado("Versión de juego incompatible.", "incompatible");
  const versionAntigua = s.version === 1;
  const inicial = s.schemaVersion === undefined ? 1 : s.schemaVersion;
  if (typeof inicial !== "number" || !Number.isInteger(inicial) || inicial < 1 || inicial > SCHEMA_ACTUAL) throw new ErrorGuardado("Schema incompatible: original protegido.", "incompatible");
  if (evidenciaCobroDanada(s.consejos)) throw new ErrorGuardado("Evidencia de cobro de un hito dañada: original protegido; se necesita recuperar ese registro antes de habilitar nuevos pagos.", "ambiguous");
  // Stable legacy identity: repeated migration of the same bytes is identical.
  const migraciones: Record<number, (x: Obj) => Obj> = {
    1: x => ({ ...x, seguidores: x.seguidores ?? 0, recreativos: x.recreativos ?? 0, nombrePartida: x.nombrePartida ?? x.nombreGimnasio ?? "Mi carrera", schemaVersion: 2 }),
    2: x => ({ ...x, partidaId: typeof x.partidaId === "string" && x.partidaId ? x.partidaId : `migrada-${hashTexto(JSON.stringify(x))}`, ultimaSemanaScout: x.ultimaSemanaScout ?? 0, ultimaSemanaEntrenada: x.ultimaSemanaEntrenada ?? 0, schemaVersion: 3 }),
    3: x => ({ ...x, libroIngresos: [], libroGastos: [], semanaLibro: 0, schemaVersion: 4 }),
    4: x => ({ ...x, archivoCarreras: x.archivoCarreras ?? [], schemaVersion: 5 }),
    // The new decision label must be rejected by older readers, not silently discarded.
    5: x => ({ ...x, combateActivo: x.combateActivo ?? null, schemaVersion: 6 }),
    6: x => ({ ...x, consejos: consolidarConsejos(x.consejos, true),
      contratosTitularesHistoricos: Array.isArray(x.pendientes) ? x.pendientes.filter(p => objeto(p) && typeof p.id === "string" && typeof p.esTitulo === "number" && p.esTitulo > 0).map(p => p.id) : [],
      schemaVersion: 7 }),
  };
  for (let v = inicial; v < SCHEMA_ACTUAL; v++) s = migraciones[v](s);
  if (versionAntigua) s = { ...s, version: 2 };
  return { estado: s, migrado: inicial !== SCHEMA_ACTUAL || versionAntigua };
}

type Rule = (value: unknown, path: string, issues: string[]) => unknown;
const BAD = Symbol("invalid");
const invalid = (path: string, issues: string[]) => { issues.push(path); return BAD; };
const str: Rule = (v, p, i) => typeof v === "string" ? v : invalid(p, i);
const id: Rule = (v, p, i) => typeof v === "string" && v.length > 0 ? v : invalid(p, i);
const bool: Rule = (v, p, i) => typeof v === "boolean" ? v : invalid(p, i);
const num = (min = -Infinity, max = Infinity, integer = false): Rule => (v, p, i) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return invalid(p, i);
  const result = Math.max(min, Math.min(max, integer ? Math.floor(v) : v));
  if (result !== v) i.push(p);
  return result;
};
const count = num(0, Infinity, true);
const oneOf = (values: readonly unknown[]): Rule => (v, p, i) => values.includes(v) ? v : invalid(p, i);
const optional = (rule: Rule): Rule => (v, p, i) => v === undefined ? undefined : rule(v, p, i);
const nullable = (rule: Rule): Rule => (v, p, i) => v === null ? null : rule(v, p, i);

// Keep extension data when JSON-safe; reject nonfinite/invalid types recursively.
const json: Rule = (v, p, i) => {
  if (v === null || typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : invalid(p, i);
  if (Array.isArray(v)) return v.flatMap((x, n) => { const y = json(x, `${p}[${n}]`, i); return y === BAD ? [] : [y]; });
  if (objeto(v)) return Object.fromEntries(Object.entries(v).flatMap(([k, x]) => { const y = json(x, `${p}.${k}`, i); return y === BAD ? [] : [[k, y]]; }));
  return invalid(p, i);
};
function fields(rules: Record<string, Rule>, defaults: Obj = {}, required: string[] = []): Rule {
  return (v, path, issues) => {
    if (!objeto(v)) return invalid(path, issues);
    if (required.some(k => !(k in v) || rules[k](v[k], `${path}.${k}`, []) === BAD)) return invalid(path, issues);
    const result: Obj = {};
    for (const [k, x] of Object.entries(v)) if (!(k in rules)) {
      const y = json(x, `${path}.${k}`, issues); if (y !== BAD) result[k] = y;
    }
    for (const [k, rule] of Object.entries(rules)) {
      const y = rule(v[k], `${path}.${k}`, issues);
      if (y === BAD) {
        if (k in defaults) result[k] = structuredClone(defaults[k]);
        else if (required.includes(k)) return BAD;
      } else if (y !== undefined || k in v) result[k] = y;
    }
    return result;
  };
}
function list(rule: Rule, uniqueKey?: string): Rule {
  return (v, p, i) => {
    if (!Array.isArray(v)) return invalid(p, i);
    const seen = new Map<unknown, unknown>();
    return v.flatMap((x, n) => {
      const y = rule(x, `${p}[${n}]`, i);
      if (y === BAD) return [];
      const key = uniqueKey && objeto(y) ? y[uniqueKey] : y;
      if (uniqueKey && seen.has(key)) {
        if (JSON.stringify(seen.get(key)) !== JSON.stringify(y)) throw new ErrorGuardado(`${p}[${n}]: ID conflictivo; se necesita decidir qué identidad recuperar. Original protegido.`, "ambiguous");
        i.push(`${p}[${n}]: ID duplicado idéntico`); return [];
      }
      seen.set(key, y); return [y];
    });
  };
}
const record = fields({ v: count, d: count, e: count, ko: count }, { v: 0, d: 0, e: 0, ko: 0 });
const lesion = fields({ tipo: oneOf(["golpe", "muscular", "mano", "corte"]), semanas: count, gravedad: oneOf(["leve", "media", "grave"]), tratamiento: count }, {}, ["tipo", "semanas", "gravedad", "tratamiento"]);
const boxerDefaults = {
  genero: "M", edad: 18, piel: "#f0c8a0", pantalon: "#23262d", pelo: "#20180f", atrib: ATRIBUTOS_BASE,
  rol: "alumno", circuito: "amateur", division: "Mosca", record: { v: 0, d: 0, e: 0, ko: 0 },
  peleasAmateur: 0, peleasProfesionales: 0, victoriasProfesionales: 0, derrotasProfesionales: 0, empatesProfesionales: 0, kosProfesionales: 0,
  titulo: 0, licenciaFederativa: false, energia: 100, combo: "acondicionamiento", fogueo: 0, fogueoMeta: 10, guanteosRealizados: 0,
  lesion: null, proximaPeleaSemana: null, ultimaPeleaSemana: null, rasgo: "", elite: false, bonusDebut: false,
};
const boxerFields = fields({
  id, nombre: id, genero: oneOf(["F", "M"]), edad: num(12, 80), piel: str, pantalon: str, pelo: str,
  atrib: fields(Object.fromEntries(Object.keys(ATRIBUTOS_BASE).map(k => [k, num(0, 99)])), { ...ATRIBUTOS_BASE }),
  rol: oneOf(["alumno", "boxeador"]), circuito: oneOf(["amateur", "pro"]), division: oneOf(DIVISIONES), record,
  peleasAmateur: count, peleasProfesionales: count, victoriasProfesionales: count, derrotasProfesionales: count, empatesProfesionales: count, kosProfesionales: count,
  club: optional(str), titulo: num(0, 4, true), licenciaFederativa: bool, energia: num(0, 100), combo: oneOf(Object.keys(COMBOS)),
  fogueo: count, fogueoMeta: count, guanteosRealizados: count, lesion: nullable(lesion),
  proximaPeleaSemana: nullable(num(1, Infinity, true)), ultimaPeleaSemana: nullable(num(1, Infinity, true)),
  rasgo: str, elite: bool, bonusDebut: bool, enEspera: optional(bool), semanaIngreso: optional(num(1, Infinity, true)),
}, boxerDefaults, ["id", "nombre"]);
const boxer: Rule = (v, p, i) => {
  if (!objeto(v)) return invalid(p, i);
  const counters = ["peleasAmateur", "peleasProfesionales", "victoriasProfesionales", "derrotasProfesionales", "empatesProfesionales", "kosProfesionales"];
  if (v.circuito === "pro" && counters.some(k => v[k] === undefined)) throw new ErrorGuardado(`${p}: trayectoria profesional incompleta; no es posible inferir la división del récord. Original protegido.`, "ambiguous");
  const migrated = { ...v };
  if (v.circuito !== "pro" && migrated.peleasAmateur === undefined && objeto(v.record)) {
    const { v: wins, d, e } = v.record;
    if ([wins, d, e].every(x => typeof x === "number" && Number.isFinite(x))) migrated.peleasAmateur = Number(wins) + Number(d) + Number(e);
  }
  const result = boxerFields(migrated, p, i);
  if (objeto(result) && objeto(result.record) && Number(result.record.ko) > Number(result.record.v)) {
    result.record.ko = result.record.v; i.push(`${p}.record.ko`);
  }
  return result;
};
const title = num(0, 4, true);
const bout = fields({ id, miId: id, rival: boxer, bolsa: num(0), esTitulo: title, velada: bool, semanaProgramada: optional(num(1, Infinity, true)), diaProgramado: optional(num(1, 7, true)) }, {}, ["id", "miId", "rival", "bolsa", "esTitulo", "velada"]);
const punches = fields({ lanzados: count, conectados: count }, {}, ["lanzados", "conectados"]);
const compubox = fields({ jab: punches, poder: punches }, {}, ["jab", "poder"]);
const fighterRules = {
  p: boxer, hp: num(0), hpMax: num(1), energia: num(0, 100), caidas: count, registro: compubox,
  plan: oneOf(["equilibrado", "presionar", "distancia", "nocaut", "recuperar"]), dmgDado: num(0), conectadosAsalto: count,
  kdAsalto: count, aturdido: count, jabDmg: num(0), poderDmg: num(0), precision: num(0, 1), evasion: num(0, 1), costeEnergia: num(0), resisteDanio: num(0),
};
const fighter = fields(fighterRules, {}, Object.keys(fighterRules));
const combatRules = {
  pelea: bout, A: fighter, B: fighter, asalto: num(1, 13, true), totalAsaltos: num(1, 12, true),
  tarjetas: list(fields({ a: num(0), b: num(0) }, {}, ["a", "b"])),
  acciones: list(fields({ atacante: oneOf(["a", "b"]), tipo: oneOf(["jab", "poder"]), conecto: bool, dano: num(0), critico: bool,
    estadoVisual: optional(fields({ A: fighter, B: fighter }, {}, ["A", "B"])) }, {}, ["atacante", "tipo", "conecto", "dano", "critico"])),
  ko: nullable(oneOf(["a", "b"])), finalizada: bool, intercambiosAsalto: num(0, 3, true), asaltosCerrados: count,
  semillaAzar: num(0, 4294967295, true),
};
const combat = fields(combatRules, {}, Object.keys(combatRules));
const activeCombat: Rule = (v, p, i) => {
  if (v === null) return null;
  const local: string[] = [];
  const checked = combat(v, p, local);
  if (checked === BAD || local.length) throw new ErrorGuardado("Checkpoint de combate dañado: original protegido.");
  return checked;
};
const result = fields({ miId: optional(id), rivalNombre: optional(str), gane: bool, empate: bool, metodo: oneOf(["Nocaut", "Nocaut Técnico", "Decisión Unánime", "Decisión Dividida", "Decisión Mayoritaria", "Empate"]), tarjetas: list(fields({ a: num(0), b: num(0) }, {}, ["a", "b"])), caidasA: count, caidasB: count, registroA: compubox, registroB: compubox, bolsa: num(0), fama: num(), tituloGanado: title, resumen: str }, {}, ["gane", "empate", "metodo", "tarjetas", "caidasA", "caidasB", "registroA", "registroB", "bolsa", "fama", "tituloGanado", "resumen"]);
const ledger = list(fields({ concepto: str, monto: num(0) }, {}, ["concepto", "monto"]));
const action = fields({ tipo: oneOf(["dinero", "fama", "nuevoAlumno", "programarComunitario", "aceptarPatrocinio", "exhibicion", "mantenimiento", "entrevista", "recaudacion", "nada"]), monto: optional(num()), costo: optional(num(0)), fama: optional(num()), nombre: optional(str), semanas: optional(count), comunitario: optional(oneOf(Object.keys(COMUNITARIOS))) }, {}, ["tipo"]);

/** No random generation, population padding, sorting or gameplay normalisation on load. */
export function validarEstado(raw: unknown, base: EstadoJuego): { estado: EstadoJuego; diagnosticos: string[] } {
  const migrated = migrarGuardado(raw).estado;
  if (!objeto(migrated)) throw new ErrorGuardado("Estado inválido.");
  const issues: string[] = [];
  if (objeto(raw) && "formatVersion" in raw && (typeof raw.savedAt !== "string" || !Number.isFinite(Date.parse(raw.savedAt)))) issues.push("envelope.savedAt");
  const rules: Record<string, Rule> = {
    version: oneOf([2]), schemaVersion: oneOf([SCHEMA_ACTUAL]), creado: bool, nombreJugador: str, nombreGimnasio: str,
    combateActivo: activeCombat,
    contratosTitularesHistoricos: optional(list(id)),
    dinero: num(), fama: num(0, 100), seguidores: count, recreativos: count, dia: num(1, 7, true), semana: num(1, Infinity, true), ultimaSemanaScout: count,
    mes: num(1, 12, true), anio: num(1, Infinity, true), plantel: list(boxer, "id"), rivales: list(boxer, "id"),
    ofertas: list(fields({ id, rival: boxer, nivel: oneOf(["accesible", "parejo", "desafio"]), bolsa: num(0), etiqueta: str, detalle: str, esTitulo: title }, {}, ["id", "rival", "nivel", "bolsa", "etiqueta", "detalle", "esTitulo"]), "id"),
    ofertasPara: nullable(id), pendientes: list(bout, "id"), historial: list(result), equipamiento: list(oneOf(Object.keys(EQUIPOS)), "value"),
    marcaRopa: str, cursos: list(oneOf(Object.keys(CURSOS)), "value"),
    personal: list(fields({ id, tipo: oneOf(Object.keys(PERSONAL_INFO)), nombre: str }, {}, ["id", "tipo", "nombre"]), "id"), propiedades: list(oneOf(Object.keys(PROPIEDADES))),
    patrocinio: nullable(fields({ nombre: str, semanal: num(0), semanas: count }, {}, ["nombre", "semanal", "semanas"])),
    prestamo: nullable(fields({ saldo: num(0), cuota: num(0), semanasRestantes: count }, {}, ["saldo", "cuota", "semanasRestantes"])),
    eventos: list(fields({ id, tipo: oneOf(["desafio", "patrocinio", "comunitario", "prospecto", "federacion", "mantenimiento", "entrevista", "recaudacion"]), de: str, titulo: str, texto: str, venceEn: count, opciones: list(fields({ texto: str, accion: action }, {}, ["texto", "accion"])) }, {}, ["id", "tipo", "de", "titulo", "texto", "venceEn", "opciones"]), "id"),
    comunitarios: list(fields({ tipo: oneOf(Object.keys(COMUNITARIOS)), nombre: str }, {}, ["tipo", "nombre"])),
    consejos: list(fields({ id, texto: str, fama: num(0), dinero: optional(num(0)), cumplido: bool, reclamado: bool, archivado: optional(bool), motivoArchivo: optional(str) }, {}, ["id", "texto", "fama", "cumplido", "reclamado"]), "id"),
    prensa: list(fields({ id, semana: num(1, Infinity, true), texto: str }, {}, ["id", "semana", "texto"]), "id"),
    cinturones: list(fields({ id, dueno: id, nivel: num(1, 4, true), semana: num(1, Infinity, true) }, {}, ["id", "dueno", "nivel", "semana"]), "id"),
    salonFama: list(fields({ id, nombre: str, club: str, record, titulos: count, semanaRetiro: num(1, Infinity, true), motivo: str }, {}, ["id", "nombre", "club", "record", "titulos", "semanaRetiro", "motivo"]), "id"),
    archivoCarreras: list(fields({ id, pugilista: boxer, club: str, semanaSalida: num(1, Infinity, true), motivo: str, historial: list(result) }, {}, ["id", "pugilista", "club", "semanaSalida", "motivo", "historial"]), "id"),
    veladaProgramada: bool, libroIngresos: ledger, libroGastos: ledger, semanaLibro: count,
    resumen: nullable(fields({ ingresos: ledger, gastos: ledger, total: num() }, {}, ["ingresos", "gastos", "total"])), legados: count,
    stats: fields({ peleas: count, victorias: count, kos: count, veladas: count, dineroGanado: num(), resultadoNeto: num(), titulos: count }, base.stats),
    toasts: list(fields({ id: count, texto: str, tono: oneOf(["ok", "info", "oro", "alerta"]) }, {}, ["id", "texto", "tono"]), "id"),
    logoGimnasio: str, ultimaSemanaEntrenada: count, nombrePartida: str, partidaId: str,
  };
  // Missing collections are empty, not randomly generated replacements for lost data.
  const defaults = { ...base, plantel: [], rivales: [], consejos: [] };
  const checked = fields(rules, defaults)(migrated, "estado", issues) as EstadoJuego;
  const ids = new Set(checked.plantel.map(p => p.id));
  const pending = new Set<string>();
  checked.pendientes = checked.pendientes.filter(p => {
    if (!ids.has(p.miId) || pending.has(p.miId)) { issues.push(`pendientes.${p.id}: huérfana o duplicada por boxeador`); return false; }
    pending.add(p.miId); return true;
  });
  if (checked.ofertasPara !== null && !ids.has(checked.ofertasPara)) { checked.ofertasPara = null; issues.push("ofertasPara: boxeador ausente"); }
  const c = checked.combateActivo;
  if (c) {
    const b = checked.pendientes.find(p => p.id === c.pelea.id);
    const own = checked.plantel.find(p => p.id === c.A.p.id);
    // Normal completion has two legitimate cursor forms: UI advances to N+1;
    // fast simulation clamps back to N. Neither may replay a closed round.
    const cerradoNormal = c.asaltosCerrados === c.totalAsaltos && c.intercambiosAsalto === 0
      && (c.asalto === c.totalAsaltos || c.asalto === c.totalAsaltos + 1);
    const asaltoEnCurso = c.asalto <= c.totalAsaltos && c.asaltosCerrados === c.asalto - 1;
    if (!b || !own || c.pelea.miId !== c.A.p.id || (!cerradoNormal && !asaltoEnCurso)
      || (c.finalizada && !c.ko && !cerradoNormal)
      || JSON.stringify(b) !== JSON.stringify(c.pelea) || JSON.stringify(own) !== JSON.stringify(c.A.p)
      || JSON.stringify(b.rival) !== JSON.stringify(c.B.p) || c.tarjetas.length !== 3 || c.asalto > c.totalAsaltos + 1
      || c.asaltosCerrados > c.totalAsaltos || c.A.hp > c.A.hpMax || c.B.hp > c.B.hpMax) {
      throw new ErrorGuardado("Checkpoint de combate incompatible: original protegido.");
    }
  }
  return { estado: checked, diagnosticos: issues };
}
