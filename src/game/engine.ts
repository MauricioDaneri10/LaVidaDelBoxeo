import { APELLIDOS, DIVISIONES_F, DIVISIONES_M, EVENT_TEXTS, NOMBRES_F, NOMBRES_M, PELOS, SHORTS, SKINS, TRAITS, uid, fmt } from "./data";
import type { Boxer, Circuito, FightSetup, Focus, GameEvent, GameState, Instruccion } from "./types";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function overall(b: Boxer): number {
  return Math.round(
    b.fuerza * 0.11 + b.velocidad * 0.11 + b.potencia * 0.11 + b.resistencia * 0.1 +
    b.ataque * 0.13 + b.defensa * 0.12 + b.tecnica * 0.12 +
    b.inteligencia * 0.07 + b.mentalidad * 0.06 + b.talento * 0.07
  );
}

export function potencial(b: Boxer): number {
  return Math.round(42 + b.talento * 0.58);
}

function statAround(base: number): number {
  return clamp(Math.round(base + rand(-9, 9)), 8, 99);
}

export function genBoxer(opts: { rol: "alumno" | "boxeador"; nivel?: number; joven?: boolean; talentoMin?: number }): Boxer {
  const genero = Math.random() < 0.5 ? "M" : "F";
  const nivel = opts.nivel ?? (opts.rol === "alumno" ? randInt(22, 44) : randInt(40, 62));
  const talento = opts.talentoMin ? randInt(opts.talentoMin, 96) : randInt(25, 92);
  const nombre = `${pick(genero === "M" ? NOMBRES_M : NOMBRES_F)} ${pick(APELLIDOS)}`;
  const divs = genero === "M" ? DIVISIONES_M : DIVISIONES_F;
  const traitRoll = Math.random();
  const trait = opts.talentoMin ? "diamante" : traitRoll < 0.4 ? pick(Object.keys(TRAITS)) : null;
  const b: Boxer = {
    id: uid(), nombre, genero,
    edad: opts.joven ? randInt(17, 21) : randInt(17, 30),
    division: pick(divs),
    rol: opts.rol,
    circuito: "amateur",
    elite: false,
    focus: "tecnica",
    energia: randInt(70, 100),
    ganadas: 0, perdidas: 0, kos: 0, campeon: false,
    trait,
    skin: pick(SKINS), short: pick(SHORTS), pelo: pick(PELOS),
    semanas: 0,
    fuerza: statAround(nivel), velocidad: statAround(nivel), potencia: statAround(nivel), resistencia: statAround(nivel),
    ataque: statAround(nivel), defensa: statAround(nivel), tecnica: statAround(nivel),
    inteligencia: statAround(nivel), mentalidad: statAround(nivel), talento,
  };
  if (trait && TRAITS[trait]) {
    const mods = TRAITS[trait].mod as Record<string, number>;
    for (const k of Object.keys(mods)) (b as unknown as Record<string, number>)[k] = clamp(b[k as keyof Boxer] as number + mods[k], 5, 99);
  }
  return b;
}

export function genRival(circuito: Circuito, forceDivision?: string): Boxer {
  const b = genBoxer({ rol: "boxeador", nivel: circuito === "amateur" ? randInt(46, 66) : randInt(62, 88) });
  b.circuito = circuito;
  b.energia = 100;
  if (forceDivision) b.division = forceDivision;
  if (circuito === "pro" && Math.random() < 0.2) { b.ganadas = randInt(4, 18); b.kos = Math.floor(b.ganadas * 0.4); }
  else b.ganadas = randInt(0, 6);
  return b;
}

export function genRivalesIniciales(): Boxer[] {
  const out: Boxer[] = [];
  for (const c of ["amateur", "pro"] as Circuito[]) {
    for (const d of DIVISIONES_M) { out.push(genRival(c, d)); if (Math.random() < 0.6) out.push(genRival(c, d)); }
    for (const d of DIVISIONES_F) { out.push(genRival(c, d)); if (Math.random() < 0.6) out.push(genRival(c, d)); }
  }
  return out;
}

export function scoreDe(b: Boxer): number {
  return overall(b) + b.ganadas * 2 - b.perdidas * 1.5 + (b.campeon ? 18 : 0);
}

export function rankingDe(state: GameState, b: Boxer): number {
  const pool = state.rivales.filter(r => r.circuito === b.circuito && r.division === b.division && r.genero === b.genero);
  const mejores = [...pool, b].sort((x, y) => scoreDe(y) - scoreDe(x));
  return mejores.findIndex(x => x.id === b.id) + 1;
}

export function tablaRanking(state: GameState, circuito: Circuito, division: string, genero: "M" | "F") {
  const pool = state.rivales.filter(r => r.circuito === circuito && r.division === division && r.genero === genero)
    .sort((a, b) => scoreDe(b) - scoreDe(a)).slice(0, 10);
  return pool;
}

export function pursePara(circuito: Circuito, rank: number, titulo: boolean, velada: boolean): number {
  let p = circuito === "amateur" ? 120 + Math.max(0, 11 - rank) * 25 : 500 + Math.max(0, 11 - rank) * 160;
  if (titulo) p *= 2.5;
  if (velada) p *= 1.2;
  return Math.round(p);
}

export function construirPelea(state: GameState, b: Boxer, velada: boolean): FightSetup {
  const rank = rankingDe(state, b);
  const pool = state.rivales
    .filter(r => r.circuito === b.circuito && r.division === b.division && r.genero === b.genero)
    .sort((x, y) => scoreDe(y) - scoreDe(x));
  const titulo = rank <= 2 && pool.length > 0 && b.ganadas >= 3;
  let rival: Boxer;
  if (titulo) {
    rival = { ...pool[0], campeon: true };
  } else {
    const arriba = pool.filter(r => scoreDe(r) >= scoreDe(b));
    rival = arriba.length ? pick(arriba.slice(0, Math.min(3, arriba.length))) : pool[pool.length - 1] ?? genRival(b.circuito, b.division);
  }
  rival.genero = b.genero; rival.division = b.division;
  return {
    id: uid(), miBoxeador: b, rival, circuito: b.circuito,
    titulo, purse: pursePara(b.circuito, rank, titulo, velada), esVelada: velada,
  };
}

// ---------- entrenamiento ----------
export function entrenar(b: Boxer, state: GameState): { b: Boxer; msg: string | null } {
  const nb = { ...b };
  if (b.rol === "alumno" && b.focus === "descanso") return { b: nb, msg: null };
  const gear = state.gear;
  let mult = 1;
  if (gear.includes("guantesPro")) mult *= 1.1;
  if (state.staff.some(s => s.type === "asistente")) mult *= 1.25;
  if (b.elite) mult *= 1.6;
  if (b.edad < 23) mult *= 1.2;
  if (b.edad > 32) mult *= 0.5;
  const talentoMult = 0.55 + (b.talento / 100) * 0.9;
  const focusMap: Record<Focus, { stats: (keyof Boxer)[]; gearBonus: boolean }> = {
    fuerza: { stats: ["fuerza", "potencia"], gearBonus: gear.includes("saco") },
    tecnica: { stats: ["tecnica", "ataque", "defensa"], gearBonus: gear.includes("ring") },
    condicion: { stats: ["resistencia", "velocidad"], gearBonus: gear.includes("peras") },
    descanso: { stats: [], gearBonus: false },
  };
  const f = focusMap[b.focus];
  if (f.gearBonus) mult *= 1.15;
  if (b.focus === "condicion" && state.staff.some(s => s.type === "preparador")) mult *= 1.5;
  let ganancia = 0;
  for (const st of f.stats) {
    const cur = nb[st] as number;
    const pot = potencial(nb);
    const room = Math.max(0, pot - cur);
    const g = 0.34 * talentoMult * mult * (room / 60) * rand(0.7, 1.3);
    (nb as unknown as Record<string, number>)[st] = clamp(cur + g, 5, 99);
    ganancia += g;
  }
  nb.energia = clamp(nb.energia + (b.focus === "descanso" ? 9 : -3) + (state.staff.some(s => s.type === "preparador") ? 2 : 0), 5, 100);
  nb.semanas += 1;
  const msg = ganancia > 1.4 && b.focus !== "descanso" ? `${b.nombre.split(" ")[0]} tuvo una gran semana de ${b.focus} (+${ganancia.toFixed(1)})` : null;
  return { b: nb, msg };
}

// ---------- eventos ----------
export function generarEvento(state: GameState): GameEvent | null {
  const posibles: string[] = [];
  const tieneFederado = state.roster.some(b => b.rol === "boxeador");
  if (state.courses.includes("tecnico") && tieneFederado) posibles.push("sparring", "exhibicion");
  posibles.push("entrevista");
  if (state.fama >= 25 && !state.patrocinio) posibles.push("sponsor");
  if (capacidadAlumnos(state) > state.roster.filter(b => b.rol === "alumno").length) posibles.push("prospecto", "prospecto");
  if (state.courses.includes("tecnico") && state.fama >= 15) posibles.push("beca");
  if (state.courses.includes("tecnico") && tieneFederado) posibles.push("torneo");
  const type = pick(posibles) as GameEvent["type"];
  const t = EVENT_TEXTS[type];
  let extra: GameEvent["extra"] = {};
  let texto = t.textos[0];
  if (type === "sparring") { extra = { dinero: randInt(100, 220) }; texto = texto.replace("{d}", fmt(extra.dinero!)); }
  if (type === "exhibicion") { extra = { dinero: randInt(280, 650) }; texto = texto.replace("{d}", fmt(extra.dinero!)); }
  if (type === "sponsor") { extra = { dinero: Math.round(60 + state.fama * 3.5) }; texto = texto.replace("{d}", fmt(extra.dinero!)); }
  if (type === "beca") { extra = { dinero: 500 }; texto = texto.replace("{d}", fmt(500)); }
  if (type === "entrevista") { extra = { fama: state.fama >= 40 ? 7 : 4 }; }
  if (type === "torneo") { extra = { purseX: 2 }; }
  return {
    id: uid(), type, titulo: t.titulo, de: t.de, texto, dias: 5,
    opciones: type === "prospecto"
      ? [{ label: "Recibirlo", hint: "Se une como alumno" }, { label: "Otro día", hint: "No hay cupo o tiempo" }]
      : [{ label: "Aceptar", hint: "Aprovecha la oportunidad" }, { label: "Rechazar", hint: "Sin compromiso" }],
    necesitaBoxeador: type === "sparring" || type === "exhibicion",
    extra,
  };
}

// ---------- capacidades ----------
export function capacidadAlumnos(state: GameState): number {
  let c = 6;
  if (state.gear.includes("vestuarios")) c += 4;
  c += sucursales(state).length * 3;
  return c;
}
export function capacidadFederados(state: GameState): number {
  return state.gear.includes("ring") ? 6 : 5;
}
export function sucursales(state: GameState): string[] {
  const s: string[] = [];
  if (state.propiedades.includes("local2")) s.push("local2");
  if (state.propiedades.includes("sucursalNorte" as never)) s.push("sucursalNorte");
  return s;
}
export function tieneVivienda(state: GameState): boolean {
  return state.propiedades.includes("apartamento") || state.propiedades.includes("mansion");
}
export function gastosDiarios(state: GameState): { total: number; detalle: string } {
  const alq = 30 + sucursales(state).length * 20;
  const personal = state.propiedades.includes("apartamento") ? 0 : state.propiedades.includes("mansion") ? 6 : 8;
  const sueldos = state.staff.reduce((a, s) => a + (s.type === "gerente" ? 23 : s.type === "marketing" ? 30 : s.type === "preparador" ? 17 : 15), 0);
  return { total: alq + personal + sueldos, detalle: `Alquiler ${fmt(alq)} · Vida ${fmt(personal)} · Sueldos ${fmt(sueldos)}` };
}
export function ingresosDiarios(state: GameState): number {
  const cuotas = state.roster.reduce((a, b) => a + (b.rol === "alumno" ? 8 : 10), 0);
  const suc = sucursales(state).length > 0 && state.staff.some(s => s.type === "gerente") ? sucursales(state).length * 55 : 0;
  return cuotas + suc;
}
export function nivelGimnasio(state: GameState): 1 | 2 | 3 {
  const mejoras = state.gear.filter(g => ["ring", "neon", "saco", "peras"].includes(g)).length;
  if (state.propiedades.includes("sucursalNorte" as never) || state.propiedades.includes("local2")) {
    if (mejoras >= 3) return 3;
  }
  return mejoras >= 3 ? 3 : mejoras >= 1 ? 2 : 1;
}

// ---------- motor de pelea (intercambios) ----------
export interface LiveFighter { b: Boxer; hp: number; en: number; score: number; }

const INSTR_MOD: Record<Instruccion, { dmg: number; hit: number; cost: number; recv: number; enBonus: number }> = {
  presionar: { dmg: 1.15, hit: 0.06, cost: 1.5, recv: 1.08, enBonus: 0 },
  distancia: { dmg: 0.9, hit: -0.02, cost: 1.0, recv: 0.85, enBonus: 0 },
  nocaut: { dmg: 1.38, hit: -0.04, cost: 1.85, recv: 1.18, enBonus: 0 },
  recuperar: { dmg: 0.55, hit: -0.08, cost: 0.4, recv: 0.95, enBonus: 10 },
};

export function roundsPara(f: FightSetup): number {
  return f.titulo ? 8 : f.circuito === "amateur" ? 3 : 6;
}

export function intercambio(a: LiveFighter, b: LiveFighter, ia: Instruccion, ib: Instruccion, localiaA: boolean) {
  const modsA = INSTR_MOD[ia];
  const init = Math.random() + (a.b.velocidad - b.b.velocidad) / 300;
  const atkIsA = init >= 0.5;
  const atk = atkIsA ? a : b;
  const def = atkIsA ? b : a;
  const mAtk = atkIsA ? modsA : INSTR_MOD[ib];
  const mDef = atkIsA ? INSTR_MOD[ib] : modsA;
  const cansado = atk.en <= 5;
  let hitChance = 0.58 + (atk.b.ataque + atk.b.tecnica) / 520 - (def.b.defensa + def.b.inteligencia) / 560 + mAtk.hit;
  if (atkIsA && localiaA) hitChance += 0.05;
  if (def.b.trait === "zurdo") hitChance -= 0.04;
  if (cansado) hitChance -= 0.12;
  hitChance = clamp(hitChance, 0.22, 0.93);
  const hit = Math.random() < hitChance;
  const gasto = 3.1 * mAtk.cost;
  atk.en = clamp(atk.en - gasto, 0, 100);
  if (!hit) {
    return { atacante: atkIsA ? "a" as const : "b" as const, hit: false, crit: false, dmg: 0, ko: false };
  }
  const fatiga = 0.55 + 0.45 * (atk.en / 100);
  let critChance = 0.05 + atk.b.potencia / 900 + atk.b.talento / 1500;
  if (atk.b.trait === "noqueador") critChance += 0.05;
  const crit = Math.random() < critChance;
  let dmg = (atk.b.fuerza * 0.45 + atk.b.potencia * 0.55) * 0.135 * mAtk.dmg * fatiga;
  if (cansado) dmg *= 0.55;
  if (crit) dmg *= 1.9;
  if (ia === "nocaut" && atkIsA && atk.en > 20) dmg *= 1.1;
  dmg *= mDef.recv;
  if (def.b.trait === "mandibula") dmg *= 0.8;
  dmg = Math.round(dmg * 10) / 10;
  def.hp = clamp(def.hp - dmg, 0, 100);
  atk.score += dmg;
  return { atacante: atkIsA ? "a" as const : "b" as const, hit: true, crit, dmg, ko: def.hp <= 0 };
}

export function recuperarRound(f: LiveFighter, instr: Instruccion) {
  const bonus = INSTR_MOD[instr].enBonus;
  const corazon = f.b.trait === "corazon" ? 8 : 0;
  f.en = clamp(f.en + 13 + f.b.resistencia * 0.13 + bonus + corazon, 0, 100);
  f.hp = clamp(f.hp + 1.2 + f.b.resistencia * 0.045, 0, 100);
}

export function instruccionIA(f: LiveFighter, rival: LiveFighter): Instruccion {
  if (rival.hp < 30 && f.en > 30) return "nocaut";
  if (f.en < 28) return "recuperar";
  if (f.hp < 32 && f.score > rival.score) return "distancia";
  return Math.random() < 0.6 ? "presionar" : "distancia";
}
