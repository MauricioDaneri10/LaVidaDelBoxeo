// ============================================================
// Motor del juego: generación, entrenamiento, Selección de Rival,
// títulos y simulación de combate con jueces y Registro Oficial.
// ============================================================

import { APELLIDOS, COMBOS, COMUNITARIOS, CONSEJOS_INICIALES, CURSOS, DIVISIONES, GIMNASIOS_RIVALES, NOMBRES_H, NOMBRES_M, PANTALONES, PELOS, PIELES, PERSONAL_INFO, RASGOS, SPONSORS, TITULOS } from "./data";
import type {
  Atributos, ClaveAtributo, ComboId, CompuBox, EstadoJuego, EventoJuego, GearId, Genero, Circuito,
  OfertaRival, Pelea, PersonalId, Pugilista, ResultadoPelea, TarjetaJuez, LineaLibro,
} from "./types";
import { conFuenteAzar, numeroAleatorio } from "./random";
import { ATRIBUTOS_BASE, SCHEMA_ACTUAL, validarEstado } from "./saveValidation";
import { socialActivityRange, weeklyEconomy } from "./economy";
import type { EstimatedIncome, WeeklyEconomy } from "./economy";

// ==================== UTILIDADES ====================
export const uid = () => numeroAleatorio().toString(36).slice(2, 10) + numeroAleatorio().toString(36).slice(2, 6);
export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const azar = (min: number, max: number) => Math.floor(numeroAleatorio() * (max - min + 1)) + min;
export const elegir = <T,>(arr: T[]): T => arr[Math.floor(numeroAleatorio() * arr.length)];
export const chance = (p: number) => numeroAleatorio() < p;

/** Week one begins on Monday 5 January 2026, aligned to the game's Monday–Sunday cycle. */
export function fechaDelJuego(semana: number, dia: number): Date {
  const semanaSegura = Math.max(1, Math.floor(semana));
  const diaSeguro = Math.min(7, Math.max(1, Math.floor(dia)));
  return new Date(2026, 0, 5 + (semanaSegura - 1) * 7 + diaSeguro - 1);
}

export interface ModificadoresClub {
  recuperacionEnergia: number;
  energiaEntrenamiento: number;
  capacidadAlumnos: number;
  gananciaAtributo: Record<ClaveAtributo, number>;
  multiplicadorVelada: number;
  multiplicadorEventos: number;
  multiplicadorMarca: number;
}

/** Fuente única de verdad para los efectos que atraviesan varios sistemas. */
export function calcularModificadores(e: EstadoJuego): ModificadoresClub {
  const gananciaAtributo = Object.fromEntries((Object.keys(e.plantel[0]?.atrib ?? {
    fuerza: 0, velocidad: 0, potencia: 0, resistencia: 0, ataque: 0, defensa: 0,
    tecnica: 0, eficacia: 0, inteligencia: 0, mentalidad: 0, talento: 0,
  }) as ClaveAtributo[]).map(k => [k, 1])) as Record<ClaveAtributo, number>;
  const multiplicar = (claves: ClaveAtributo[], valor: number) => claves.forEach(k => { gananciaAtributo[k] *= valor; });
  if (e.equipamiento.includes("sacosCuero")) multiplicar(["fuerza", "potencia"], 1.25);
  if (e.equipamiento.includes("perasDoble")) multiplicar(["velocidad", "eficacia"], 1.25);
  if (e.equipamiento.includes("cuerdaVelocidad")) multiplicar(["velocidad"], 1.1);
  if (e.equipamiento.includes("plataformaReaccion")) multiplicar(["defensa", "eficacia"], 1.1);
  if (e.equipamiento.includes("manoplasPro")) multiplicar(["ataque", "tecnica"], 1.25);
  if (e.equipamiento.includes("ringReglamentario")) multiplicar(["tecnica", "defensa"], 1.25);
  if (e.equipamiento.includes("soga")) multiplicar(["resistencia"], 1.15);
  if (e.equipamiento.includes("barraProteinas")) multiplicar(["fuerza"], 1.2);
  if (e.equipamiento.includes("sonido")) Object.keys(gananciaAtributo).forEach(k => { gananciaAtributo[k as ClaveAtributo] *= 1.1; });
  if (e.cursos.includes("altoRendimiento")) Object.keys(gananciaAtributo).forEach(k => { gananciaAtributo[k as ClaveAtributo] *= 1.2; });
  if (e.personal.some(p => p.tipo === "preparador")) multiplicar(["fuerza", "velocidad", "potencia", "resistencia"], 1.2);
  let recuperacionEnergia = 30;
  if (e.equipamiento.includes("barraProteinas")) recuperacionEnergia += 4;
  if (e.equipamiento.includes("vendasGel")) recuperacionEnergia += 4;
  if (e.equipamiento.includes("pisoGoma")) recuperacionEnergia += 2;
  if (e.equipamiento.includes("botiquin")) recuperacionEnergia += 6;
  if (e.equipamiento.includes("vestuarios")) recuperacionEnergia += 2;
  if (e.equipamiento.includes("sauna")) recuperacionEnergia += 10;
  if (e.cursos.includes("nutricion")) recuperacionEnergia += 6;
  return {
    recuperacionEnergia,
    energiaEntrenamiento: e.cursos.includes("nutricion") ? 6 : 0,
    capacidadAlumnos: (e.equipamiento.includes("vestuarios") ? 4 : 0) + (e.personal.some(p => p.tipo === "asistente") ? 4 : 0) + (e.propiedades.includes("sucursal") ? 10 : 0),
    gananciaAtributo,
    multiplicadorVelada: (e.cursos.includes("prensa") ? 1.25 : 1) * (e.cursos.includes("tv") ? 1.4 : 1) * (e.propiedades.includes("arena") ? 1.5 : 1) * (e.personal.some(p => p.tipo === "difusion") ? 1.15 : 1),
    multiplicadorEventos: e.personal.some(p => p.tipo === "difusion") ? 1.15 : 1,
    multiplicadorMarca: (e.personal.some(p => p.tipo === "difusion") ? 1.8 : 1) * (e.cursos.includes("imperio") ? 1.5 : 1),
  };
}

// ==================== VALORACIÓN GENERAL (fórmula oficial) ====================
export function valoracion(a: Atributos): number {
  return Math.round(
    a.fuerza * 0.10 + a.velocidad * 0.10 + a.potencia * 0.11 + a.resistencia * 0.09 +
    a.ataque * 0.12 + a.defensa * 0.11 + a.tecnica * 0.11 + a.eficacia * 0.12 +
    a.inteligencia * 0.05 + a.mentalidad * 0.05 + a.talento * 0.04
  );
}

// ==================== GENERACIÓN DE PUGILISTAS ====================
export function nombreAleatorio(genero: "M" | "F"): string {
  return `${elegir(genero === "M" ? NOMBRES_H : NOMBRES_M)} ${elegir(APELLIDOS)}`;
}

export function genPugilista(opts: { rol?: "alumno" | "boxeador"; joven?: boolean; vgBase?: number; genero?: Genero } = {}): Pugilista {
  const genero = opts.genero ?? (chance(0.5) ? "M" as const : "F" as const);
  const talento = clamp(azar(35, 68) + (chance(0.28) ? azar(14, 30) : 0), 30, 97);
  const techo = talento + 3;
  const base = () => clamp(Math.round(azar(24, 50) + talento * 0.22), 20, techo);
  const atrib: Atributos = {
    fuerza: base(), velocidad: base(), potencia: base(), resistencia: base(),
    ataque: base(), defensa: base(), tecnica: base(), eficacia: base(),
    inteligencia: base(), mentalidad: base(), talento,
  };
  if (opts.vgBase) {
    const factor = opts.vgBase / Math.max(20, valoracion(atrib));
    (Object.keys(atrib) as ClaveAtributo[]).forEach(k => {
      if (k !== "talento") atrib[k] = clamp(Math.round(atrib[k] * factor), 18, 96);
    });
  }
  const rol = opts.rol ?? "alumno";
  return {
    id: uid(),
    nombre: nombreAleatorio(genero),
    genero,
    edad: opts.joven ? azar(16, 20) : azar(16, 31),
    piel: elegir(PIELES), pantalon: elegir(PANTALONES), pelo: elegir(PELOS),
    atrib,
    rol,
    circuito: "amateur",
    division: elegir(DIVISIONES),
    record: { v: 0, d: 0, e: 0, ko: 0 },
    peleasAmateur: 0,
    peleasProfesionales: 0,
    victoriasProfesionales: 0,
    derrotasProfesionales: 0,
    empatesProfesionales: 0,
    kosProfesionales: 0,
    titulo: 0,
    licenciaFederativa: rol === "boxeador",
    energia: 100,
    combo: rol === "alumno" ? "acondicionamiento" : elegir(["noqueador", "estilista", "presion", "tactico"] as ComboId[]),
    fogueo: azar(0, 3),
    fogueoMeta: 10,
    guanteosRealizados: 0,
    lesion: null,
    proximaPeleaSemana: null,
    ultimaPeleaSemana: null,
    rasgo: chance(0.65) ? elegir(RASGOS).id : "",
    elite: false,
    bonusDebut: false,
  };
}

export function genRivalPorVG(vgObjetivo: number, division: string, energia: number, genero?: Genero, circuito?: Circuito): Pugilista {
  const p = genPugilista({ rol: "boxeador", vgBase: vgObjetivo, genero });
  p.division = division;
  p.energia = energia;
  p.circuito = circuito ?? (vgObjetivo >= 60 ? "pro" : "amateur");
  p.record = { v: Math.max(0, Math.round(vgObjetivo / 9) + azar(-1, 2)), d: azar(0, 3), e: 0, ko: azar(0, 3) };
  p.peleasProfesionales = p.record.v + p.record.d;
  p.victoriasProfesionales = p.record.v;
  p.derrotasProfesionales = p.record.d;
  p.kosProfesionales = p.record.ko;
  return p;
}

export function rasgoInfo(id: string) {
  return RASGOS.find(r => r.id === id) ?? null;
}

// ==================== ESTRUCTURA DEL CLUB ====================
export function sucursales(e: EstadoJuego): number {
  return e.propiedades.filter(p => p === "sucursal").length;
}

export type BloqueoPersonal = "funcionPendiente" | "cubierto" | "sinSucursales" | "cupoAdministrativo" | "cupoEntrenador" | "semana" | "fama" | "curso";

/** Disponibilidad de nuevas altas; no altera contratos ni sustituye la confirmación financiera. */
export function puedeContratarPersonal(e: EstadoJuego, tipo: PersonalId): { ok: boolean; motivo?: BloqueoPersonal; mensaje?: string } {
  if (tipo === "coordinadorSucursal") return {
    ok: false, motivo: "funcionPendiente",
    mensaje: "Nuevas contrataciones no disponibles: falta definir una función diferenciada para este puesto. Los coordinadores existentes conservan su contrato.",
  };
  const info = PERSONAL_INFO[tipo];
  if (!info.multiple && e.personal.some(p => p.tipo === tipo)) return { ok: false, motivo: "cubierto", mensaje: "Ese puesto ya está cubierto." };
  if (tipo === "gerente" || tipo === "entrenadorLocal") {
    const capacidad = sucursales(e);
    if (capacidad === 0) return { ok: false, motivo: "sinSucursales", mensaje: "Este puesto requiere una sucursal." };
    const administrativos = e.personal.filter(p => p.tipo === "gerente" || p.tipo === "coordinadorSucursal").length;
    const entrenadores = e.personal.filter(p => p.tipo === "entrenadorLocal").length;
    if (tipo === "gerente" && administrativos >= capacidad) return { ok: false, motivo: "cupoAdministrativo", mensaje: "El cupo administrativo de las sucursales está cubierto por gerentes y coordinadores existentes." };
    if (tipo === "entrenadorLocal" && entrenadores >= capacidad) return { ok: false, motivo: "cupoEntrenador", mensaje: "El cupo de entrenadores locales de las sucursales está cubierto." };
  }
  const req = info.requisito;
  if (req?.semana && e.semana < req.semana) return { ok: false, motivo: "semana", mensaje: `${info.nombre} se habilita a partir de la semana ${req.semana}.` };
  if (req?.fama && e.fama < req.fama) return { ok: false, motivo: "fama", mensaje: `${info.nombre} requiere ${req.fama} de fama.` };
  if (req?.curso && !e.cursos.includes(req.curso)) return { ok: false, motivo: "curso", mensaje: `Necesitás el curso ${CURSOS[req.curso].nombre}.` };
  return { ok: true };
}
export function capacidadAlumnos(e: EstadoJuego): number {
  return 10 + calcularModificadores(e).capacidadAlumnos;
}
export function capacidadAmateurs(_e: EstadoJuego): number { return 10; }
export function capacidadProfesionales(_e: EstadoJuego): number { return 10; }
export function capacidadPlantel(e: EstadoJuego): number {
  return capacidadAlumnos(e) + capacidadAmateurs(e) + capacidadProfesionales(e);
}
export function alumnosActivos(e: EstadoJuego): Pugilista[] {
  return e.plantel.filter(p => p.rol === "alumno" && !p.enEspera);
}
export function alumnosEnEspera(e: EstadoJuego): Pugilista[] {
  return e.plantel.filter(p => p.rol === "alumno" && p.enEspera);
}
export function puedeHabilitar(p: Pugilista, e: EstadoJuego): boolean {
  return p.rol === "alumno" && !p.licenciaFederativa && !p.enEspera && p.guanteosRealizados >= 10 && e.cursos.includes("dt");
}

/** A fight without an old explicit date belongs to this week's Saturday. */
export function peleasVencidas(e: EstadoJuego): Pelea[] {
  return e.pendientes.filter(p => (p.semanaProgramada ?? e.semana) * 7 + (p.diaProgramado ?? 6) <= e.semana * 7 + e.dia);
}

function disponibleIndividualGuanteo(p: Pugilista, e: EstadoJuego): boolean {
  return !p.enEspera && !p.lesion && p.combo !== "descanso" && p.energia >= 20
    && (!p.proximaPeleaSemana || p.proximaPeleaSemana <= e.semana)
    && !peleasVencidas(e).some(pelea => pelea.miId === p.id);
}
export function puedeGuantear(p: Pugilista, e: EstadoJuego): boolean {
  return disponibleIndividualGuanteo(p, e)
    && e.plantel.some(companero => companero.id !== p.id && disponibleIndividualGuanteo(companero, e));
}

export function enfoqueRecomendado(p: Pugilista, e: EstadoJuego): ComboId {
  return consejoEsquina(p, e.pendientes.find(pelea => pelea.miId === p.id)?.rival ?? null);
}

/** Legacy values above the growth ceiling are preserved, never silently lowered. */
export function crecerAtributo(actual: number, delta: number, techo: number): number {
  return Math.max(actual, Math.min(techo, actual + Math.max(0, delta)));
}
export type MotivoProfesionalizacion = "rol" | "circuito" | "trayectoria" | "cartelera" | "cupo";
export function puedeProfesionalizar(p: Pugilista, e: EstadoJuego): { ok: boolean; motivo?: MotivoProfesionalizacion } {
  if (p.rol !== "boxeador") return { ok: false, motivo: "rol" };
  if (p.circuito !== "amateur") return { ok: false, motivo: "circuito" };
  if (p.peleasAmateur < 50) return { ok: false, motivo: "trayectoria" };
  if (e.pendientes.some(pelea => pelea.miId === p.id)) return { ok: false, motivo: "cartelera" };
  if (e.plantel.filter(boxeador => boxeador.rol === "boxeador" && boxeador.circuito === "pro").length >= capacidadProfesionales(e)) return { ok: false, motivo: "cupo" };
  return { ok: true };
}
export function totalPeleas(p: Pugilista): number {
  return Math.max(0, p.record.v + p.record.d + (p.record.e ?? 0));
}
export function rankingMundial(e: EstadoJuego): Array<{ pugilista: Pugilista; club: string; puntos: number }> {
  const propios = e.plantel.filter(p => p.rol === "boxeador").map(p => ({ pugilista: p, club: e.nombreGimnasio || "Tu gimnasio" }));
  const visitantes = e.rivales.filter(p => p.rol === "boxeador").map(p => ({ pugilista: p, club: p.club || "Club rival" }));
  return [...propios, ...visitantes]
    .map(x => ({ ...x, puntos: Math.max(1, valoracion(x.pugilista.atrib) * 4 + x.pugilista.record.v * 7 + x.pugilista.record.ko * 4 - x.pugilista.record.d * 3 + x.pugilista.titulo * 80 + (x.pugilista.circuito === "pro" ? 30 : 0)) }))
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 30);
}
export function estadoRecord(p: Pugilista): { etiqueta: string; tono: "oro" | "ok" | "alerta" | "info"; multiplicadorBolsa: number } {
  const total = totalPeleas(p);
  if (total < 3) return { etiqueta: "En formación", tono: "info", multiplicadorBolsa: 0.8 };
  const porcentaje = p.record.v / Math.max(1, total);
  if (p.record.d > p.record.v) return { etiqueta: "Récord negativo · carrera en riesgo", tono: "alerta", multiplicadorBolsa: 0.58 };
  if (p.record.v >= 15 && p.record.ko >= 8 && porcentaje >= 0.7) return { etiqueta: "Estrella de nocaut", tono: "oro", multiplicadorBolsa: 1.45 };
  if (porcentaje >= 0.6) return { etiqueta: "Récord positivo", tono: "ok", multiplicadorBolsa: 1.15 };
  return { etiqueta: "Récord equilibrado", tono: "info", multiplicadorBolsa: 0.9 };
}

/** Guaranteed Sunday amounts; random social returns are presented separately. */
export function proyeccionSemanal(e: EstadoJuego): WeeklyEconomy & { estimados: EstimatedIncome[] } {
  const mods = calcularModificadores(e);
  const garantizados = weeklyEconomy(e, { nivel: nivelGimnasio(e), multiplicadorMarca: mods.multiplicadorMarca });
  const estimados = e.comunitarios.map(c => ({
    concepto: `Dividendos estimados: ${c.nombre}`,
    ...socialActivityRange(c.tipo, mods.multiplicadorEventos),
  }));
  return { ...garantizados, estimados };
}

/** Flujo recurrente sostenible: excluye ayudas, eventos sociales y patrocinios temporales. */
export function proyeccionSemanalRecurrente(e: EstadoJuego): ReturnType<typeof proyeccionSemanal> {
  return proyeccionSemanal({ ...e, semana: Math.max(2, e.semana), comunitarios: [], patrocinio: null });
}
export function normalizarListaEspera(e: EstadoJuego): EstadoJuego {
  const activos = e.plantel.filter(p => p.rol !== "alumno" || !p.enEspera);
  const alumnos = e.plantel.filter(p => p.rol === "alumno").sort((a, b) => Number(a.enEspera) - Number(b.enEspera));
  let usados = 0;
  const plantel = alumnos.map(p => {
    if (p.rol !== "alumno") return p;
    const enEspera = usados >= capacidadAlumnos(e);
    if (!enEspera) usados++;
    return { ...p, enEspera };
  });
  return { ...e, plantel: [...plantel.filter(p => p.rol === "alumno"), ...activos.filter(p => p.rol !== "alumno")] };
}
export function nivelGimnasio(e: EstadoJuego): number {
  let n = 1;
  if (e.fama >= 25 || e.equipamiento.length >= 4) n = 2;
  if (e.fama >= 50 || e.equipamiento.length >= 8) n = 3;
  if (e.fama >= 75 || e.cinturones.length > 0) n = 4;
  return n;
}
export function cuposElite(e: EstadoJuego): number {
  return e.equipamiento.includes("zonaElite") ? 3 : 0;
}

// ==================== ENTRENAMIENTO SEMANAL ====================
export interface ResultadoEntrenamiento { plantel: Pugilista[]; lineas: string[]; }

export function aplicarEntrenamientoSemanal(e: EstadoJuego): ResultadoEntrenamiento {
  const modificadores = calcularModificadores(e);
  const tieneDT = e.personal.some(p => p.tipo === "directorTecnico");
  const lineas: string[] = [];
  const plantel = e.plantel.map(b => {
    if (b.enEspera) return b;
    const comboId: ComboId = tieneDT
      ? enfoqueRecomendado(b, e)
      : b.combo;
    const combo = COMBOS[comboId];
    const n = { ...b, atrib: { ...b.atrib }, combo: comboId };
    const base = 1.05 * (0.65 + b.atrib.talento / 110);
    let energia = b.energia + combo.energia;
    if (comboId === "descanso") {
      n.atrib.mentalidad = crecerAtributo(n.atrib.mentalidad, base * 0.45, Math.min(99, b.atrib.talento + 3));
      n.atrib.inteligencia = crecerAtributo(n.atrib.inteligencia, base * 0.4, Math.min(99, b.atrib.talento + 3));
      n.energia = clamp(energia, 0, 100);
      return n;
    }
    const ganancia = (k: ClaveAtributo): number => {
      let g = base * combo.bonus;
      if (b.elite && e.equipamiento.includes("zonaElite")) g *= 1.7;
      g *= modificadores.gananciaAtributo[k];
      if (b.rasgo === "hijo" && (k === "mentalidad" || k === "inteligencia")) g *= 1.4;
      if (b.rasgo === "espejo" && k === "eficacia") g *= 1.3;
      if (b.rasgo === "tren" && k === "potencia") g *= 1.3;
      if (b.rasgo === "gacela" && k === "velocidad") g *= 1.3;
      return g * azar(80, 120) / 100;
    };
    const techo = Math.min(99, b.atrib.talento + 3);
    const subidas: string[] = [];
    combo.stats.forEach(k => {
      const g = ganancia(k);
      n.atrib[k] = crecerAtributo(n.atrib[k], g, k === "talento" ? 99 : techo);
      if (n.atrib[k] - b.atrib[k] >= 0.9) subidas.push(k.slice(0, 3).toUpperCase());
    });
    energia += modificadores.energiaEntrenamiento;
    n.energia = clamp(energia, 0, 100);
    if (subidas.length > 0 && chance(0.5)) {
      lineas.push(`${b.nombre.split(" ")[0]} (${combo.corto}) subió: ${subidas.join(", ")}.`);
    }
    return n;
  });
  if (tieneDT) lineas.unshift("El Director Técnico ajustó el descanso y el enfoque de cada atleta.");
  return { plantel, lineas };
}

/** Consejo de la Esquina: combo ideal según debilidades propias y del rival */
export function consejoEsquina(b: Pugilista, rival: Pugilista | null): ComboId {
  if (b.lesion || b.energia < 70) return "descanso";
  if (rival) {
    const r = rival.atrib;
    if (r.defensa < 50 && r.velocidad < 55) return "noqueador";
    if (r.potencia > 65 || r.ataque > 65) return "tactico";
    if (r.resistencia < 50) return "presion";
    if (r.eficacia < 50) return "estilista";
  }
  const a = b.atrib;
  const debiles: [number, ComboId][] = [
    [a.potencia, "noqueador"], [a.eficacia, "estilista"], [a.resistencia, "presion"], [a.defensa, "tactico"],
  ];
  debiles.sort((x, y) => x[0] - y[0]);
  return debiles[0][1];
}

// ==================== TÍTULOS Y SELECCIÓN DE RIVAL ====================
export function tituloAspirable(p: Pugilista): 0 | 1 | 2 | 3 | 4 {
  const pro = p.circuito === "pro";
  // Progresión única y explícita: nacional desde 10 peleas, regional
  // desde 25 y títulos internacionales solo con trayectoria consolidada.
  if (p.titulo < 4 && p.peleasProfesionales >= 25 && p.victoriasProfesionales >= 20 && p.kosProfesionales >= 10 && pro) return 4;
  if (p.titulo < 3 && p.peleasProfesionales >= 25 && p.victoriasProfesionales >= 15 && p.kosProfesionales >= 6 && pro) return 3;
  if (p.titulo < 2 && p.peleasProfesionales >= 25 && p.victoriasProfesionales >= 12 && p.kosProfesionales >= 4 && pro) return 2;
  if (p.titulo < 1 && p.peleasProfesionales >= 10 && p.victoriasProfesionales >= 6 && p.kosProfesionales >= 3 && pro) return 1;
  return 0;
}

export type BloqueoPelea = "rol" | "licencia" | "pendiente" | "cooldown" | "energia" | "lesion";

/** Fuente única para cualquier acción que intente pactar una pelea. */
export function puedePactarPelea(p: Pugilista, e: EstadoJuego): { ok: boolean; motivo?: BloqueoPelea; disponibleSemana?: number } {
  if (p.rol !== "boxeador") return { ok: false, motivo: "rol" };
  if (!p.licenciaFederativa) return { ok: false, motivo: "licencia" };
  if (e.pendientes.some(x => x.miId === p.id)) return { ok: false, motivo: "pendiente" };
  if (p.proximaPeleaSemana && p.proximaPeleaSemana > e.semana) return { ok: false, motivo: "cooldown", disponibleSemana: p.proximaPeleaSemana };
  if (p.energia < 70) return { ok: false, motivo: "energia" };
  if (p.lesion) return { ok: false, motivo: "lesion" };
  return { ok: true };
}

export function generarOfertas(p: Pugilista, permiteTitulosInternacionales = true): OfertaRival[] {
  const vg = valoracion(p.atrib);
  const multiplicador = estadoRecord(p).multiplicadorBolsa;
  const bolsa = (base: number) => Math.round(base * multiplicador);
  const ofertas: OfertaRival[] = [
    {
      id: uid(), nivel: "accesible", bolsa: bolsa(250), esTitulo: 0,
      rival: genRivalPorVG(clamp(vg - 5, 22, 95), p.division, azar(40, 70), p.genero, p.circuito),
      etiqueta: "Rival Accesible", detalle: "Nivel menor (−5), con experiencia cercana a la tuya.",
    },
    {
      id: uid(), nivel: "parejo", bolsa: bolsa(600), esTitulo: 0,
      rival: genRivalPorVG(clamp(vg + azar(-2, 2), 22, 96), p.division, azar(45, 75), p.genero, p.circuito),
      etiqueta: "Rival Parejo", detalle: "Nivel idéntico (±2). Combate equilibrado para subir en el ranking.",
    },
    {
      id: uid(), nivel: "desafio", bolsa: bolsa(1800), esTitulo: 0,
      rival: genRivalPorVG(clamp(vg + azar(6, 10), 25, 97), p.division, azar(50, 80), p.genero, p.circuito),
      etiqueta: "Rival Desafío", detalle: "Nivel superior (+6 a +10). Riesgo alto, salto gigante en el ranking.",
    },
  ];
  // Comparar trayectorias dentro del circuito actual. El récord general es
  // histórico y conserva las peleas amateur al pasar a profesional; usarlo
  // aquí emparejaría a un debutante pro con rivales de décadas de carrera.
  const experiencia = Math.max(0, p.circuito === "pro" ? p.peleasProfesionales : p.peleasAmateur);
  const ajustarExperiencia = (rival: Pugilista) => {
    const peleas = clamp(experiencia + azar(-3, 3), 0, experiencia + 3);
    const victorias = Math.floor(peleas * (0.45 + azar(0, 20) / 100));
    const derrotas = peleas - victorias;
    rival.record = { v: victorias, d: derrotas, e: 0, ko: Math.min(victorias, azar(0, Math.max(0, victorias))) };
    if (rival.circuito === "amateur") rival.peleasAmateur = peleas;
    else { rival.peleasProfesionales = peleas; rival.victoriasProfesionales = victorias; rival.derrotasProfesionales = derrotas; rival.kosProfesionales = rival.record.ko; }
    return rival;
  };
  ofertas.forEach(oferta => { oferta.rival = ajustarExperiencia(oferta.rival); });
  const tit = tituloAspirable(p);
  if (tit > 0 && (tit < 3 || permiteTitulosInternacionales)) {
    const info = TITULOS[tit as 1 | 2 | 3 | 4];
    const bolsa = tit === 4 ? azar(60, 150) * 1000 : info.bolsa;
    const campeon = ajustarExperiencia(genRivalPorVG(clamp(vg + azar(6, 9), 30, 97), p.division, azar(65, 85), p.genero, "pro"));
    campeon.circuito = "pro";
    campeon.titulo = tit;
    ofertas[2] = {
      id: uid(), nivel: "desafio", bolsa, esTitulo: tit,
      rival: campeon,
      etiqueta: `Pelea de Título · ${info.nombre}`,
      detalle: `${info.cinturon} en juego. Requisitos: ${info.req}.`,
    };
  }
  return ofertas;
}

export function ofertasValidasPara(p: Pugilista, e: EstadoJuego): OfertaRival[] {
  return generarOfertas(p, e.cursos.includes("tv"));
}

/** Revalida solo ofertas no pactadas; no migra ni modifica contratos históricos.
 * Es puro: el reducer puede rechazar una oferta legacy sin generar rivales ni azar.
 */
export function ofertaValidaPara(p: Pugilista, oferta: OfertaRival, e: Pick<EstadoJuego, "cursos">): boolean {
  if (oferta.rival.circuito !== p.circuito || oferta.rival.genero !== p.genero || oferta.rival.division !== p.division) return false;
  if (oferta.rival.titulo !== oferta.esTitulo) return false;
  if (oferta.esTitulo === 0) {
    const base = { accesible: 250, parejo: 600, desafio: 1800 }[oferta.nivel];
    return oferta.bolsa === Math.round(base * estadoRecord(p).multiplicadorBolsa);
  }
  if (oferta.nivel !== "desafio" || tituloAspirable(p) !== oferta.esTitulo) return false;
  if (oferta.esTitulo >= 3 && !e.cursos.includes("tv")) return false;
  return oferta.esTitulo === 4
    ? Number.isInteger(oferta.bolsa / 1000) && oferta.bolsa >= 60000 && oferta.bolsa <= 150000
    : oferta.bolsa === TITULOS[oferta.esTitulo].bolsa;
}

/** Eligibility at execution time, shared with R2 result validation; no receipt or payout. */
export function puedeEjecutarPelea(s: EstadoJuego, pelea: Pelea): boolean {
  const p = s.plantel.find(p => p.id === pelea.miId);
  if (!p || (pelea.semanaProgramada ?? s.semana) !== s.semana || (pelea.diaProgramado ?? 6) !== s.dia) return false;
  if (!puedePactarPelea(p, { ...s, pendientes: s.pendientes.filter(x => x.id !== pelea.id) }).ok) return false;
  if (pelea.rival.circuito !== p.circuito || pelea.rival.genero !== p.genero || pelea.rival.division !== p.division) return false;
  return pelea.esTitulo === 0 || (p.circuito === "pro" && (s.contratosTitularesHistoricos?.includes(pelea.id)
    || tituloAspirable(p) === pelea.esTitulo && (pelea.esTitulo < 3 || s.cursos.includes("tv"))));
}

// ==================== MOTOR DE COMBATE ====================
export type PlanId = "equilibrado" | "presionar" | "distancia" | "nocaut" | "recuperar";

export const PLANES: Record<PlanId, { nombre: string; desc: string; icono: string }> = {
  equilibrado: { nombre: "Boxeo Completo", desc: "Ritmo parejo entre jab y golpes de poder.", icono: "glove" },
  presionar: { nombre: "Presionar sin Piedad", desc: "+ritmo de ataque, −cuidado defensivo.", icono: "fire" },
  distancia: { nombre: "Cuidar la Distancia", desc: "+esquiva y jab, menos golpes de poder.", icono: "target" },
  nocaut: { nombre: "Buscar el Nocaut", desc: "Golpes de poder seguidos: más daño, menos precisión.", icono: "bolt" },
  recuperar: { nombre: "Recuperar el Aire", desc: "Soltar manos lo justo y recuperar salud y energía.", icono: "heart" },
};

export interface Luchador {
  p: Pugilista;
  hp: number; hpMax: number; energia: number;
  caidas: number;
  registro: CompuBox;
  plan: PlanId;
  dmgDado: number; conectadosAsalto: number; kdAsalto: number;
  aturdido: number;
  jabDmg: number; poderDmg: number; precision: number; evasion: number; costeEnergia: number;
  resisteDanio: number;
}

export interface AccionRing {
  atacante: "a" | "b";
  tipo: "jab" | "poder";
  conecto: boolean;
  dano: number;
  critico: boolean;
  estadoVisual?: { A: Luchador; B: Luchador };
}

export interface EstadoPelea {
  pelea: Pelea;
  A: Luchador; B: Luchador;
  asalto: number; totalAsaltos: number;
  tarjetas: TarjetaJuez[];
  acciones: AccionRing[];
  ko: "a" | "b" | null;
  finalizada: boolean;
  intercambiosAsalto: number;
  asaltosCerrados: number;
  semillaAzar?: number;
}

function azarCombate<T>(e: EstadoPelea, ejecutar: () => T): T {
  if (e.semillaAzar === undefined) return ejecutar();
  return conFuenteAzar(() => {
    e.semillaAzar = ((e.semillaAzar ?? 0) + 0x6D2B79F5) >>> 0;
    let t = e.semillaAzar;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }, ejecutar);
}

const checkpointsEmitidos = new WeakMap<EstadoPelea, string>();
export function emitirCheckpointCombate(e: EstadoPelea): EstadoPelea {
  const copia = structuredClone(e);
  checkpointsEmitidos.set(copia, JSON.stringify(copia));
  return copia;
}
export function validarCheckpointCombate(s: EstadoJuego, e: EstadoPelea): boolean {
  const pelea = s.pendientes.find(p => p.id === e.pelea.id);
  const mio = s.plantel.find(p => p.id === e.A.p.id);
  if (!pelea || !mio || checkpointsEmitidos.get(e) !== JSON.stringify(e) || e.semillaAzar === undefined) return false;
  if (JSON.stringify(pelea) !== JSON.stringify(e.pelea) || JSON.stringify(mio) !== JSON.stringify(e.A.p)) return false;
  if (JSON.stringify(pelea.rival) !== JSON.stringify(e.B.p) || e.totalAsaltos !== asaltosDePelea(pelea)) return false;
  if (!puedePactarPelea(mio, { ...s, pendientes: s.pendientes.filter(p => p.id !== pelea.id) }).ok) return false;
  if ((pelea.semanaProgramada ?? s.semana) !== s.semana || (pelea.diaProgramado ?? 6) !== s.dia) return false;
  const anterior = s.combateActivo;
  return !anterior || (anterior.pelea.id === pelea.id && e.asalto * 4 + e.intercambiosAsalto >= anterior.asalto * 4 + anterior.intercambiosAsalto);
}

/** Only engine-issued completed results have a receipt; caller payloads are not authority. */
const resultadosEmitidos = new WeakMap<ResultadoPelea, { resultado: string; pelea: string; pugil: string; sesion: string }>();
export function validarResultadoCombate(s: EstadoJuego, pelea: Pelea, r: ResultadoPelea): boolean {
  const p = s.plantel.find(x => x.id === pelea.miId);
  const receipt = resultadosEmitidos.get(r);
  if (!p || !receipt || receipt.resultado !== JSON.stringify(r) || receipt.pelea !== JSON.stringify(pelea) || receipt.pugil !== JSON.stringify(p)) return false;
  if (s.combateActivo && receipt.sesion !== JSON.stringify(s.combateActivo)) return false;
  if (r.miId !== p.id || r.rivalNombre !== pelea.rival.nombre) return false;
  return puedeEjecutarPelea(s, pelea);
}

export function asaltosDePelea(pelea: Pelea): number {
  if (pelea.esTitulo === 4) return 10;
  if (pelea.esTitulo > 0) return 8;
  return pelea.rival.circuito === "pro" ? 6 : 3;
}

export function prepararLuchador(p: Pugilista, equipo: GearId[], plan: PlanId): Luchador {
  const a = p.atrib;
  const debut = p.bonusDebut ? 1.1 : 1;
  const hpMax = Math.round(100 + a.resistencia * 0.35 + a.fuerza * 0.15);
  return {
    p, hp: hpMax, hpMax, energia: clamp(p.energia, 25, 100),
    caidas: 0,
    registro: { jab: { lanzados: 0, conectados: 0 }, poder: { lanzados: 0, conectados: 0 } },
    plan,
    dmgDado: 0, conectadosAsalto: 0, kdAsalto: 0, aturdido: 0,
    jabDmg: 1.5 + a.velocidad * 0.045 + a.tecnica * 0.04 + a.eficacia * 0.045,
    poderDmg: 2.8 + a.potencia * 0.11 + a.fuerza * 0.06 + a.ataque * 0.05,
    precision: 0.40 + a.eficacia * 0.0035 + a.tecnica * 0.0015 + a.velocidad * 0.001,
    evasion: a.defensa * 0.0032 * debut + a.velocidad * 0.0018
      + (equipo.includes("botas") ? 0.05 : 0) + (equipo.includes("bucal") ? 0.05 : 0),
    costeEnergia: p.rasgo === "reloj" ? 1.65 : 2.2,
    resisteDanio: (p.rasgo === "mandibula" ? 0.85 : 1) * (equipo.includes("cabezal") ? 0.95 : 1),
  };
}

function planAtaque(plan: PlanId) {
  switch (plan) {
    case "presionar": return { probPoder: 0.45, modAcierto: 1.05, modEnergia: 1.15 };
    case "distancia": return { probPoder: 0.16, modAcierto: 1.12, modEnergia: 0.9 };
    case "nocaut": return { probPoder: 0.58, modAcierto: 0.85, modEnergia: 1.25 };
    case "recuperar": return { probPoder: 0.08, modAcierto: 0.9, modEnergia: 0.7 };
    default: return { probPoder: 0.32, modAcierto: 1, modEnergia: 1 };
  }
}
function planDefensa(plan: PlanId) {
  switch (plan) {
    case "presionar": return 0.82;
    case "distancia": return 1.22;
    case "nocaut": return 0.78;
    case "recuperar": return 1.1;
    default: return 1;
  }
}

function atacar(atacante: Luchador, defensor: Luchador, lado: "a" | "b", acciones: AccionRing[]): "ko" | "caida" | null {
  if (atacante.aturdido > 0) { atacante.aturdido--; return null; }
  const cfg = planAtaque(atacante.plan);
  if (atacante.plan === "recuperar" && chance(0.6)) {
    atacante.hp = Math.min(atacante.hpMax, atacante.hp + 5);
    atacante.energia = clamp(atacante.energia + 6, 0, 100);
    return null;
  }
  if (atacante.energia < 6) return null;
  const tipo: "jab" | "poder" = chance(cfg.probPoder) ? "poder" : "jab";
  atacante.registro[tipo].lanzados++;
  const energiaFactor = 0.55 + 0.45 * (atacante.energia / 100);
  const acierto = atacante.precision * cfg.modAcierto * energiaFactor;
  const esquiva = defensor.evasion * planDefensa(defensor.plan) * (1 - atacante.p.atrib.inteligencia * 0.001);
  const conecta = chance(clamp(acierto * (1 - esquiva), 0.08, 0.94));
  if (!conecta) {
    acciones.push({ atacante: lado, tipo, conecto: false, dano: 0, critico: false });
    atacante.energia = clamp(atacante.energia - atacante.costeEnergia * cfg.modEnergia * (tipo === "poder" ? 1.5 : 1), 0, 100);
    return null;
  }
  let dano = tipo === "jab" ? atacante.jabDmg : atacante.poderDmg;
  dano *= azar(85, 118) / 100;
  const probCrit = 0.10 + atacante.p.atrib.potencia * 0.0012 * (atacante.p.rasgo === "volcan" ? 2 : 1);
  const critico = tipo === "poder" && chance(probCrit);
  if (critico) dano *= 1.8;
  if (defensor.aturdido > 0) dano *= 1.25;
  dano *= defensor.resisteDanio;
  defensor.hp = Math.max(0, defensor.hp - dano);
  atacante.dmgDado += dano;
  atacante.conectadosAsalto++;
  atacante.registro[tipo].conectados++;
  atacante.energia = clamp(atacante.energia - atacante.costeEnergia * cfg.modEnergia * (tipo === "poder" ? 1.5 : 1), 0, 100);
  if (atacante.p.rasgo === "maraton") atacante.energia = clamp(atacante.energia + 0.8, 0, 100);
  acciones.push({ atacante: lado, tipo, conecto: true, dano, critico });
  if (defensor.hp <= 0) return "ko";
  if (critico && defensor.hp < defensor.hpMax * 0.32 && chance(0.5)) {
    defensor.caidas++;
    defensor.kdAsalto++;
    defensor.aturdido = 2;
    defensor.hp = Math.max(defensor.hp, 14);
    return "caida";
  }
  return null;
}

export function simularIntercambio(e: EstadoPelea): { caida: "a" | "b" | null; ko: "a" | "b" | null } {
  return azarCombate(e, () => simularIntercambioInterno(e));
}
function simularIntercambioInterno(e: EstadoPelea): { caida: "a" | "b" | null; ko: "a" | "b" | null } {
  if (e.finalizada || e.ko || e.intercambiosAsalto >= 3) return { caida: null, ko: e.ko };
  e.intercambiosAsalto++;
  const acciones: AccionRing[] = [];
  let caida: "a" | "b" | null = null;
  let ko: "a" | "b" | null = null;
  const r1 = atacar(e.A, e.B, "a", acciones);
  if (acciones.length) acciones[acciones.length - 1].estadoVisual = { A: structuredClone(e.A), B: structuredClone(e.B) };
  if (r1 === "ko") ko = "b";
  else if (r1 === "caida") caida = "b";
  if (!ko) {
    const cantidadAnterior = acciones.length;
    const r2 = atacar(e.B, e.A, "b", acciones);
    if (acciones.length > cantidadAnterior) acciones[acciones.length - 1].estadoVisual = { A: structuredClone(e.A), B: structuredClone(e.B) };
    if (r2 === "ko") ko = "a";
    else if (r2 === "caida") caida = "a";
  }
  e.acciones = acciones;
  if (e.A.caidas >= 3 && !ko) { ko = "a"; }
  if (e.B.caidas >= 3 && !ko) { ko = "b"; }
  e.ko = ko;
  return { caida, ko };
}

export function cerrarAsalto(e: EstadoPelea) {
  return azarCombate(e, () => cerrarAsaltoInterno(e));
}
function cerrarAsaltoInterno(e: EstadoPelea) {
  if (e.asaltosCerrados >= e.asalto) return;
  for (let j = 0; j < 3; j++) {
    const sesgo = azar(-10, 10) / 10;
    const puntA = e.A.dmgDado + e.A.conectadosAsalto * 0.35 - e.A.kdAsalto * 9 + sesgo;
    const puntB = e.B.dmgDado + e.B.conectadosAsalto * 0.35 - e.B.kdAsalto * 9 - sesgo;
    const ganaA = puntA > puntB;
    const igual = puntA === puntB;
    let sa = igual || ganaA ? 10 : 9, sb = igual || !ganaA ? 10 : 9;
    if (e.A.kdAsalto >= 1) sa = e.A.kdAsalto >= 2 ? 7 : 8;
    if (e.B.kdAsalto >= 1) sb = e.B.kdAsalto >= 2 ? 7 : 8;
    e.tarjetas[j] = { a: e.tarjetas[j].a + sa, b: e.tarjetas[j].b + sb };
  }
  e.A.dmgDado = 0; e.B.dmgDado = 0;
  e.A.conectadosAsalto = 0; e.B.conectadosAsalto = 0;
  e.A.kdAsalto = 0; e.B.kdAsalto = 0;
  const regen = (l: Luchador) => { l.energia = clamp(l.energia + (l.p.rasgo === "maraton" ? 18 : 12), 0, 100); };
  regen(e.A); regen(e.B);
  e.asaltosCerrados = e.asalto;
  e.intercambiosAsalto = 0;
}

export function crearEstadoPelea(pelea: Pelea, mio: Pugilista, equipo: GearId[]): EstadoPelea {
  const planRival: PlanId = pelea.rival.atrib.potencia > 65 ? (chance(0.6) ? "nocaut" : "presionar")
    : pelea.rival.atrib.defensa > 60 ? "distancia" : "equilibrado";
  return {
    pelea,
    A: prepararLuchador(mio, equipo, "equilibrado"),
    B: prepararLuchador(pelea.rival, [], planRival),
    asalto: 1,
    totalAsaltos: asaltosDePelea(pelea),
    tarjetas: [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
    acciones: [],
    ko: null,
    finalizada: false,
    intercambiosAsalto: 0,
    asaltosCerrados: 0,
  };
}

export function planSugerido(e: EstadoPelea): PlanId {
  const mio = e.A.p.atrib, rival = e.B.p.atrib;
  if (rival.potencia > 68 && mio.defensa < 55) return "distancia";
  if (mio.potencia > 62 && rival.defensa < 55) return "nocaut";
  if (rival.resistencia < 50) return "presionar";
  return "equilibrado";
}

export function resolverPelea(e: EstadoPelea): ResultadoPelea {
  e.finalizada = true;
  let jA = 0, jB = 0;
  e.tarjetas.forEach(t => { if (t.a > t.b) jA++; else if (t.b > t.a) jB++; });
  const empate = !e.ko && jA === jB;
  const gane = e.ko ? e.ko === "b" : (() => {
    if (jA !== jB) return jA > jB;
    return false;
  })();
  const metodo: ResultadoPelea["metodo"] = e.ko
    ? (e.A.caidas >= 3 || e.B.caidas >= 3 ? "Nocaut Técnico" : "Nocaut")
    : empate ? "Empate" : Math.max(jA, jB) === 3 ? "Decisión Unánime"
    : Math.min(jA, jB) === 0 ? "Decisión Mayoritaria" : "Decisión Dividida";
  const vgMio = valoracion(e.A.p.atrib), vgRival = valoracion(e.B.p.atrib);
  let fama = gane ? clamp(2 + Math.round((vgRival - vgMio + 10) / 6) + e.pelea.esTitulo * 2, 2, 12) : empate ? 1 : 1;
  if (gane && e.A.p.rasgo === "volcan") fama += 1;
  const tarjetas = e.tarjetas.map(t => ({ a: t.a, b: t.b }));
  const resumen = e.ko
    ? `${metodo} en el asalto ${e.asalto}`
    : `${metodo} (${tarjetas.map(t => `${t.a}-${t.b}`).join(", ")})`;
  const resultado: ResultadoPelea = {
    miId: e.A.p.id,
    rivalNombre: e.B.p.nombre,
    gane, empate, metodo, tarjetas,
    caidasA: e.A.caidas, caidasB: e.B.caidas,
    registroA: e.A.registro, registroB: e.B.registro,
    bolsa: gane ? e.pelea.bolsa : Math.round(e.pelea.bolsa * 0.3),
    fama,
    tituloGanado: gane && e.pelea.esTitulo > 0 ? e.pelea.esTitulo : 0,
    resumen,
  };
  if (e.ko || e.asaltosCerrados >= e.totalAsaltos) resultadosEmitidos.set(resultado, {
    resultado: JSON.stringify(resultado), pelea: JSON.stringify(e.pelea), pugil: JSON.stringify(e.A.p), sesion: JSON.stringify(e),
  });
  return resultado;
}

/** Simula de inmediato todo lo que falta de la pelea. */
export function simularPeleaEntera(e: EstadoPelea, planJugador: PlanId): ResultadoPelea {
  while (!e.finalizada && !e.ko && e.asalto <= e.totalAsaltos) {
    e.A.plan = planJugador;
    while (e.intercambiosAsalto < 3) {
      const r = simularIntercambio(e);
      if (r.ko) { e.ko = r.ko; break; }
    }
    if (!e.ko) { cerrarAsalto(e); e.asalto++; }
  }
  if (e.asalto > e.totalAsaltos) e.asalto = e.totalAsaltos;
  return resolverPelea(e);
}

// ==================== EVENTOS DE LA SEMANA ====================
export function generarEventos(e: EstadoJuego): EventoJuego[] {
  const eventos: EventoJuego[] = [];
  if (chance(0.55)) {
    const tipo = elegir(["reparacion", "entrevista", "colecta"] as const);
    const info = {
      reparacion: { titulo: "Revisión del saco de entrenamiento", texto: "La comisión detectó desgaste y propone una reparación preventiva. Podés asumir el costo ahora o posponerlo; esperar no cambia el entrenamiento.", tipoEvento: "mantenimiento" as const, opciones: [{ texto: "Reparar por $120", accion: { tipo: "mantenimiento" as const, costo: 120 } }, { texto: "Posponer el gasto", accion: { tipo: "nada" as const } }] },
      entrevista: { titulo: "Entrevista en Radio Guante", texto: "La prensa quiere conocer tu proyecto. Elegí cómo responder: una declaración puede mejorar o perjudicar la imagen del club.", tipoEvento: "entrevista" as const, opciones: [{ texto: "Hablar del proyecto · +2 fama, +80 seguidores", accion: { tipo: "entrevista" as const, fama: 2, monto: 80 } }, { texto: "Provocar al rival · −2 fama, −40 seguidores", accion: { tipo: "entrevista" as const, fama: -2, monto: -40 } }, { texto: "Declinar la entrevista", accion: { tipo: "nada" as const } }] },
      colecta: { titulo: "Colecta solidaria del barrio", texto: "La comisión propone una colecta puntual para sostener el gimnasio. No es un bingo ni una actividad social: vence en pocos días.", tipoEvento: "recaudacion" as const, opciones: [{ texto: "Aportar $80 y organizarla", accion: { tipo: "recaudacion" as const, costo: 80, monto: 180 } }, { texto: "No organizarla", accion: { tipo: "nada" as const } }] },
    }[tipo];
    eventos.push({
      id: uid(), tipo: info.tipoEvento, de: "Comisión del Club", titulo: info.titulo,
      texto: info.texto,
      venceEn: 4,
      opciones: info.opciones,
    });
  }
  if (e.fama >= 10 && !e.patrocinio && chance(0.4)) {
    const nombre = elegir(SPONSORS);
    const semanal = Math.round(60 + e.fama * 3.2 + e.legados * 20);
    const semanas = azar(4, 8);
    eventos.push({
      id: uid(), tipo: "patrocinio", de: nombre, titulo: "Propuesta de patrocinio",
      texto: `${nombre} ofrece ${fmt(semanal)} por semana durante ${semanas} semanas a cambio de lucir su logo en el ring.`,
      venceEn: 3,
      opciones: [
        { texto: "Firmar contrato", accion: { tipo: "aceptarPatrocinio", nombre, monto: semanal, semanas } },
        { texto: "Rechazar la oferta", accion: { tipo: "nada" } },
      ],
    });
  }
  if (chance(0.3)) {
    eventos.push({
      id: uid(), tipo: "prospecto", de: elegir(GIMNASIOS_RIVALES), titulo: "Un talento pide probarse",
      texto: "Un pibe del barrio dejó su club rival y quiere entrenar con vos. Nadie cobra por mirar talento.",
      venceEn: 4,
      opciones: [
        { texto: "Abrirle la puerta", accion: { tipo: "nuevoAlumno" } },
        { texto: "Cupo completo, no", accion: { tipo: "nada" } },
      ],
    });
  }
  if (e.plantel.some(b => b.rol === "boxeador") && chance(0.28)) {
    eventos.push({
      id: uid(), tipo: "desafio", de: "Federación Regional", titulo: "Exhibición benéfica",
      texto: "La federación invita a uno de tus boxeadores a una exhibición: paga poco, pero suma fama y roce.",
      venceEn: 3,
      opciones: [
        { texto: "Mandar al ring", accion: { tipo: "exhibicion" } },
        { texto: "Declinar con respeto", accion: { tipo: "nada" } },
      ],
    });
  }
  return eventos;
}

// ==================== ESTADO BASE Y PERSISTENCIA ====================
export function crearEstadoBase(opciones: { sinPoblacion?: boolean } = {}): EstadoJuego {
  const alumnos = opciones.sinPoblacion ? [] : [genPugilista({ rol: "alumno", joven: true }), genPugilista({ rol: "alumno", joven: true }), genPugilista({ rol: "alumno" })];
  alumnos.forEach(a => { a.fogueo = azar(0, 2); });
  return {
    version: 2,
    schemaVersion: SCHEMA_ACTUAL,
    guiaClub: { alumnosIniciales: alumnos.map(p => p.id), enfoquesConfirmados: [], enfoques: false, equipo: false, guanteos: false, licencia: false },
    creado: false,
    nombreJugador: "", nombreGimnasio: "",
    dinero: 900, fama: 4, seguidores: 480, recreativos: 0,
    dia: 1, semana: 1, mes: 1, anio: 2026,
    ultimaSemanaScout: 0,
    plantel: alumnos,
    rivales: opciones.sinPoblacion ? [] : GIMNASIOS_RIVALES.flatMap((club, i) => [0, 1].map(j => {
      const rival = genRivalPorVG(56 + i * 4 + j * 3, DIVISIONES[(i + j) % DIVISIONES.length], 70 + j * 5, undefined, "pro");
      rival.club = club;
      rival.peleasProfesionales = 12 + i * 3 + j * 4;
      rival.record.v = Math.max(rival.record.v, 7 + i * 2 + j);
      rival.record.ko = Math.min(rival.record.v, Math.max(rival.record.ko, 2 + i + j));
      rival.victoriasProfesionales = rival.record.v;
      rival.derrotasProfesionales = rival.record.d;
      rival.kosProfesionales = rival.record.ko;
      return rival;
    })),
    ofertas: [], ofertasPara: null,
    pendientes: [],
    combateActivo: null,
    historial: [],
    equipamiento: [],
    marcaRopa: "",
    cursos: [],
    personal: [],
    propiedades: [],
    patrocinio: null,
    prestamo: null,
    eventos: [],
    comunitarios: [],
    consejos: CONSEJOS_INICIALES.map(c => ({ ...c, cumplido: false, reclamado: false })),
    prensa: [],
    cinturones: [],
    salonFama: [],
    archivoCarreras: [],
    veladaProgramada: false,
    libroIngresos: [],
    libroGastos: [],
    semanaLibro: 1,
    resumen: null,
    legados: 0,
    stats: { peleas: 0, victorias: 0, kos: 0, veladas: 0, dineroGanado: 0, resultadoNeto: 0, titulos: 0 },
    toasts: [],
    logoGimnasio: "guante",
    ultimaSemanaEntrenada: 0,
    nombrePartida: "Mi primera carrera",
    partidaId: "",
  };
}

/** Compatibility facade. Load validation never executes gameplay rules. */
export function sanitizarEstado(raw: unknown): EstadoJuego {
  return validarEstado(raw, crearEstadoBase({ sinPoblacion: true })).estado;
}
