import { createContext, useContext, useEffect, useReducer, type ReactNode, type Dispatch } from "react";
import { CURSOS, GEAR, PROPIEDADES, STAFF_INFO, DIAS, fmt, uid, TRAITS } from "./data";
import {
  capacidadAlumnos, capacidadFederados, construirPelea, entrenar, gastosDiarios, generarEvento,
  genBoxer, genRival, genRivalesIniciales, ingresosDiarios, nivelGimnasio, rankingDe, sucursales,
} from "./engine";
import type { Boxer, FightResult, Focus, GameState, PropertyId, StaffType, Tab, Toast } from "./types";

const SAVE_KEY = "vida-boxeo-v1";
let toastId = 1;

export type Action =
  | { type: "NEW_GAME"; nombre: string; gimnasio: string }
  | { type: "RESET" }
  | { type: "CONTINUE_GAME" }
  | { type: "SET_TAB"; tab: Tab }
  | { type: "SET_FOCUS"; id: string; focus: Focus }
  | { type: "ADVANCE_DAY" }
  | { type: "FAST_WEEK" }
  | { type: "RESOLVE_EVENT"; id: string; option: number; boxerId?: string }
  | { type: "BUY_GEAR"; id: GameState["gear"][number] }
  | { type: "BUY_COURSE"; id: GameState["courses"][number] }
  | { type: "BUY_PROPERTY"; id: string }
  | { type: "BUILD_BRANCH" }
  | { type: "SCOUT" }
  | { type: "FEDERAR"; id: string }
  | { type: "PROMOVER_PRO"; id: string }
  | { type: "TOGGLE_ELITE"; id: string }
  | { type: "SCHEDULE_FIGHT"; id: string }
  | { type: "UNSCHEDULE"; id: string }
  | { type: "TOGGLE_VELADA" }
  | { type: "HIRE"; staff: StaffType }
  | { type: "FIRE"; id: string }
  | { type: "CREATE_BRAND"; name: string }
  | { type: "FIGHT_RESULT"; result: FightResult }
  | { type: "CLOSE_SUMMARY" }
  | { type: "LEGACY" }
  | { type: "TOAST"; texto: string; tono?: Toast["tono"] }
  | { type: "DROP_TOAST"; id: number };

function toast(s: GameState, texto: string, tono: Toast["tono"] = "info"): GameState {
  const toasts = [...s.toasts, { id: toastId++, texto, tono }].slice(-4);
  return { ...s, toasts };
}
function log(s: GameState, texto: string): GameState {
  return { ...s, log: [texto, ...s.log].slice(0, 14) };
}

export function nuevoJuego(nombre: string, gimnasio: string, previo?: GameState): GameState {
  const legados = previo?.legados ?? 0;
  const mejor = previo?.roster.filter(b => b.campeon || b.rol === "boxeador").sort((a, b) => b.talento + (b.campeon ? 30 : 0) - (a.talento + (a.campeon ? 30 : 0)))[0];
  const roster: Boxer[] = [genBoxer({ rol: "alumno" }), genBoxer({ rol: "alumno" }), genBoxer({ rol: "alumno" })];
  let legadoVivo: Boxer | null = null;
  if (legados > 0 && mejor) {
    legadoVivo = { ...mejor, id: uid(), edad: 19, rol: "boxeador", circuito: "amateur", elite: false, ganadas: 0, perdidas: 0, kos: 0, campeon: false, energia: 100, semanas: 0 };
    roster.push(legadoVivo);
  }
  return {
    version: 1, creado: true,
    nombreJugador: nombre, nombreGimnasio: gimnasio,
    rivales: genRivalesIniciales(),
    dinero: 2500 + legados * 1800,
    fama: Math.min(5 + legados * 8, 32),
    dia: 1, semana: 1, mes: 1, anio: 1,
    legados,
    roster,
    staff: [], courses: ["instructor"], gear: [], propiedades: [],
    marcaRopa: null, patrocinio: null, purseMult: 1,
    veladaProgramada: false, schedule: [], fights: [],
    events: [], log: legados > 0
      ? [`Legado ${legados}: la leyenda de ${mejor?.nombre ?? "tu campeón"} inspira el barrio. Comienzas con bonificaciones.`, "Alquilaste un pequeño local. Es hora de abrir el gimnasio."]
      : ["Alquilaste un pequeño local en el barrio. Es hora de abrir el gimnasio."],
    toasts: [], resumen: null,
    ingresosSemana: 0, gastosSemana: 0, famaSemana: 0, notasSemana: [],
    stats: { peleas: 0, victorias: 0, kos: 0, veladas: 0, dineroGanado: 0 },
  };
}

function pasoDia(s: GameState): GameState {
  if (s.dia > 5) return s;
  let st = { ...s };
  const ing = ingresosDiarios(st);
  const gas = gastosDiarios(st).total;
  st.dinero += ing - gas;
  st.ingresosSemana += ing;
  st.gastosSemana += gas;
  st.stats.dineroGanado += Math.max(0, ing - gas);

  const nuevos: Boxer[] = [];
  for (const b of st.roster) {
    const { b: nb, msg } = entrenar(b, st);
    nuevos.push(nb);
    if (msg) st = log(st, msg);
  }
  st.roster = nuevos;

  // talento detectado
  for (const b of st.roster) {
    if (b.rol === "alumno" && b.talento >= 68 && !b.avisadoTalento) {
      st.roster = st.roster.map(x => x.id === b.id ? { ...x, avisadoTalento: true } : x);
      st = log(st, `Ojo clínico: ${b.nombre} tiene un talento excepcional (${b.talento}). ${st.courses.includes("tecnico") ? "¡Fedéralo!" : "Con el curso de Director Técnico podrías federarlo."}`);
      st = toast(st, `Talento detectado: ${b.nombre.split(" ")[0]} (${b.talento})`, "oro");
    }
  }

  // eventos
  if (st.events.length < 3 && Math.random() < 0.18 && !(st.semana === 1 && st.dia <= 2)) {
    const ev = generarEvento(st);
    if (ev) {
      st.events = [...st.events, ev];
      st = log(st, `Llamada de ${ev.de}: ${ev.titulo}.`);
    }
  }

  st.dia += 1;
  return st;
}

function armarSabado(s: GameState): GameState {
  let st = { ...s };
  if (st.schedule.length > 0) {
    const velada = st.veladaProgramada;
    const peleas = st.schedule
      .map(id => st.roster.find(b => b.id === id))
      .filter((b): b is Boxer => !!b)
      .map(b => {
        const f = construirPelea(st, b, velada);
        return { ...f, purse: Math.round(f.purse * st.purseMult) };
      });
    if (velada) {
      const card = peleas.reduce((a, f) => a + f.miBoxeador.fuerza + f.miBoxeador.tecnica, 0) * 0.8;
      const bruto = Math.round(st.fama * 18 + card);
      const costos = 250 + peleas.length * 80;
      st.dinero += bruto - costos;
      st.ingresosSemana += bruto;
      st.gastosSemana += costos;
      st.stats.veladas += 1;
      st.stats.dineroGanado += Math.max(0, bruto - costos);
      st = log(st, `Velada propia: entradas ${fmt(bruto)}, producción ${fmt(costos)}.`);
      st.notasSemana = [`Velada organizada: ${fmt(bruto)} en entradas`, ...st.notasSemana];
    }
    st.fights = peleas;
    st = log(st, `Noche de pelea: ${peleas.length} combate(s) en la cartelera.`);
    return st;
  }
  st.roster = st.roster.map(b => ({ ...b, energia: Math.min(100, b.energia + 6) }));
  st = log(st, "Sábado tranquilo en el barrio. El equipo descansa.");
  st.dia = 7;
  st.resumen = { ingresos: st.ingresosSemana, gastos: st.gastosSemana, famaDelta: st.famaSemana, notas: st.notasSemana };
  return st;
}

function nuevaSemana(s: GameState): GameState {
  let st = { ...s };
  // ingresos semanales
  if (st.patrocinio) {
    st.dinero += st.patrocinio.semanal;
    st.ingresosSemana += st.patrocinio.semanal;
    st.stats.dineroGanado += st.patrocinio.semanal;
    const nombreSponsor = st.patrocinio.nombre;
    const pago = st.patrocinio.semanal;
    const semanas = st.patrocinio.semanas - 1;
    st.patrocinio = semanas <= 0 ? null : { ...st.patrocinio, semanas };
    st = log(st, `Patrocinio de ${nombreSponsor}: +${fmt(pago)} esta semana.`);
    if (!st.patrocinio) st = log(st, "El contrato de patrocinio llegó a su fin en buenos términos.");
  }
  if (st.marcaRopa) {
    const venta = Math.round(st.fama * 2.5 * (st.staff.some(x => x.type === "marketing") ? 1.8 : 1));
    st.dinero += venta;
    st.ingresosSemana += venta;
    st.stats.dineroGanado += venta;
    st = log(st, `Ventas de ${st.marcaRopa}: ${fmt(venta)} en indumentaria.`);
  }
  let famaExtra = 0;
  if (st.gear.includes("neon")) famaExtra += 2;
  if (st.staff.some(x => x.type === "marketing")) famaExtra += 3;
  if (famaExtra > 0) {
    st.fama = Math.min(100, st.fama + famaExtra);
    st.famaSemana += famaExtra;
  }
  // envejecer eventos
  const vivos = st.events.map(e => ({ ...e, dias: e.dias - 1 }));
  const caidos = vivos.filter(e => e.dias <= 0);
  if (caidos.length) st = log(st, `${caidos.length} oferta(s) expiraron sin respuesta.`);
  st.events = vivos.filter(e => e.dias > 0);

  // boca a boca: la fama trae alumnos nuevos cada semana
  const nAlumnos = st.roster.filter(b => b.rol === "alumno").length;
  if (nAlumnos < capacidadAlumnos(st) && Math.random() < 0.45 + st.fama / 120) {
    const nuevo = genBoxer({ rol: "alumno", joven: Math.random() < 0.4 });
    st.roster = [...st.roster, nuevo];
    st = log(st, `Boca a boca: ${nuevo.nombre} se suma a las clases del barrio.`);
    st = toast(st, `Nuevo alumno: ${nuevo.nombre.split(" ")[0]}`, "info");
  }

  // energía y edad
  st.roster = st.roster.map(b => ({ ...b, energia: Math.min(100, b.energia + 14) }));
  st.schedule = [];
  st.veladaProgramada = false;
  st.purseMult = 1;
  st.dia = 1;
  st.semana += 1;
  if ((st.semana - 1) % 4 === 0 && st.semana > 1) {
    st.mes += 1;
    if (st.mes > 12) { st.mes = 1; st.anio += 1; }
    st = log(st, "Comienza un nuevo mes en la ciudad.");
  }
  if (st.semana % 52 === 0) {
    st.roster = st.roster.map(b => ({ ...b, edad: b.edad + 1 }));
    st = log(st, "Pasa un año: todos suman una vela al pastel.");
  }
  st.ingresosSemana = 0; st.gastosSemana = 0; st.famaSemana = 0; st.notasSemana = [];
  st.resumen = null;
  return st;
}

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "NEW_GAME": {
      const prev = s.creado ? s : undefined;
      return toast(nuevoJuego(a.nombre, a.gimnasio, prev), "¡Bienvenido al barrio, coach!", "oro");
    }
    case "RESET":
      return { ...s, creado: false };
    case "CONTINUE_GAME":
      return { ...s, creado: true };
    case "SET_TAB":
      return s;
    case "TOAST":
      return toast(s, a.texto, a.tono ?? "info");
    case "DROP_TOAST":
      return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) };
    case "SET_FOCUS":
      return { ...s, roster: s.roster.map(b => b.id === a.id ? { ...b, focus: a.focus } : b) };

    case "ADVANCE_DAY": {
      if (s.dia <= 5) return pasoDia(s);
      if (s.dia === 6) return armarSabado(s);
      return s;
    }
    case "FAST_WEEK": {
      let st = s;
      while (st.dia <= 5) st = pasoDia(st);
      if (st.dia === 6) st = armarSabado(st);
      return st;
    }

    case "RESOLVE_EVENT": {
      const ev = s.events.find(e => e.id === a.id);
      if (!ev) return s;
      let st = { ...s, events: s.events.filter(e => e.id !== a.id) };
      const acepto = a.option === 0;
      if (!acepto) return log(st, `Rechazaste: ${ev.titulo}.`);
      switch (ev.type) {
        case "sparring": {
          const b = st.roster.find(x => x.id === a.boxerId);
          if (!b) return st;
          st.roster = st.roster.map(x => x.id === b.id
            ? { ...x, tecnica: Math.min(99, x.tecnica + 0.9), defensa: Math.min(99, x.defensa + 0.9), ataque: Math.min(99, x.ataque + 0.5), energia: Math.max(5, x.energia - 8) }
            : x);
          st.dinero += ev.extra?.dinero ?? 0;
          st.stats.dineroGanado += ev.extra?.dinero ?? 0;
          st = log(st, `Sparring cruzado: ${b.nombre.split(" ")[0]} ganó experiencia y ${fmt(ev.extra?.dinero ?? 0)}.`);
          break;
        }
        case "exhibicion": {
          const b = st.roster.find(x => x.id === a.boxerId);
          if (!b) return st;
          st.roster = st.roster.map(x => x.id === b.id ? { ...x, energia: Math.max(5, x.energia - 15) } : x);
          st.dinero += ev.extra?.dinero ?? 0;
          st.fama = Math.min(100, st.fama + 2); st.famaSemana += 2;
          st.stats.dineroGanado += ev.extra?.dinero ?? 0;
          st = log(st, `${b.nombre} brilló en la exhibición: ${fmt(ev.extra?.dinero ?? 0)} y +2 de fama.`);
          break;
        }
        case "entrevista": {
          const f = ev.extra?.fama ?? 4;
          st.fama = Math.min(100, st.fama + f); st.famaSemana += f;
          st = log(st, `La entrevista se volvió viral en el barrio: +${f} de fama.`);
          break;
        }
        case "sponsor": {
          st.patrocinio = { nombre: ev.de, semanal: ev.extra?.dinero ?? 80, semanas: 8 };
          st = log(st, `Contrato firmado con ${ev.de}: ${fmt(ev.extra?.dinero ?? 80)}/semana por 8 semanas.`);
          break;
        }
        case "prospecto": {
          if (capacidadAlumnos(st) <= st.roster.filter(b => b.rol === "alumno").length) return log(st, "Sin cupo para el prospecto.");
          const p = genBoxer({ rol: "alumno", joven: true, talentoMin: 62 });
          st.roster = [...st.roster, p];
          st = log(st, `${p.nombre} (${p.edad} años, talento ${p.talento}) se suma como alumno.`);
          st = toast(st, `Nuevo prospecto: ${p.nombre}`, "oro");
          break;
        }
        case "beca": {
          st.dinero += 500; st.stats.dineroGanado += 500;
          st = log(st, "Beca federativa recibida: $500 para el programa amateur.");
          break;
        }
        case "torneo": {
          st.purseMult = 2;
          st = log(st, "Torneo aceptado: la próxima bolsa federada pagará el doble.");
          break;
        }
      }
      return toast(st, `Oportunidad aprovechada: ${ev.titulo}`, "ok");
    }

    case "BUY_GEAR": {
      const g = GEAR[a.id];
      if (!g || s.gear.includes(a.id) || s.dinero < g.costo) return s;
      let st = { ...s, dinero: s.dinero - g.costo, gear: [...s.gear, a.id] };
      st = log(st, `Compraste ${g.nombre} (${fmt(g.costo)}).`);
      return toast(st, `${g.nombre} instalado`, "ok");
    }
    case "BUY_COURSE": {
      const c = CURSOS[a.id];
      if (!c || s.courses.includes(a.id)) return s;
      if (c.req && !s.courses.includes(c.req)) return s;
      if (s.dinero < c.costo) return s;
      let st = { ...s, dinero: s.dinero - c.costo, courses: [...s.courses, a.id] };
      st = log(st, `Te graduaste: ${c.nombre}. Nuevas puertas se abren.`);
      return toast(st, `Curso completado: ${c.nombre}`, "oro");
    }
    case "BUY_PROPERTY": {
      const p = PROPIEDADES[a.id];
      if (!p || s.propiedades.includes(a.id as never)) return s;
      if (s.dinero < p.precio) return s;
      let st = { ...s, dinero: s.dinero - p.precio, propiedades: [...s.propiedades, a.id as never] };
      if (a.id === "apartamento") st.fama = Math.min(100, st.fama + 3);
      if (a.id === "mansion") st.fama = Math.min(100, st.fama + 15);
      st = log(st, `Adquiriste: ${p.nombre} (${fmt(p.precio)}).`);
      return toast(st, `${p.nombre} es tuyo`, "oro");
    }
    case "BUILD_BRANCH": {
      if (!s.propiedades.includes("terreno") || s.propiedades.includes("sucursalNorte")) return s;
      if (s.dinero < 10000) return s;
      const propsNorte: PropertyId[] = [...s.propiedades.filter(p => p !== "terreno"), "sucursalNorte"];
      let st: GameState = { ...s, dinero: s.dinero - 10000, propiedades: propsNorte };
      st = log(st, "Construiste la Sucursal Norte. Contrata un gerente para activarla.");
      return toast(st, "Sucursal Norte construida", "oro");
    }
    case "SCOUT": {
      if (s.dinero < 150) return s;
      if (capacidadAlumnos(s) <= s.roster.filter(b => b.rol === "alumno").length) return toast(s, "Sin cupo para más alumnos", "info");
      const p = genBoxer({ rol: "alumno", joven: true, talentoMin: 55 });
      let st = { ...s, dinero: s.dinero - 150, roster: [...s.roster, p] };
      st = log(st, `Scouting exitoso: ${p.nombre} (talento ${p.talento}) llega del gimnasio rival.`);
      return toast(st, `Reclutaste a ${p.nombre.split(" ")[0]} (talento ${p.talento})`, "oro");
    }
    case "FEDERAR": {
      const b = s.roster.find(x => x.id === a.id);
      if (!b || b.rol !== "alumno" || s.dinero < 200) return s;
      if (s.roster.filter(x => x.rol === "boxeador").length >= capacidadFederados(s)) return toast(s, "Cupo de boxeadores lleno", "info");
      let st = { ...s, dinero: s.dinero - 200, roster: s.roster.map(x => x.id === a.id ? { ...x, rol: "boxeador" as const, energia: Math.max(x.energia, 60) } : x) };
      st = log(st, `${b.nombre} ya es boxeador federado en ${b.division}.`);
      return toast(st, `${b.nombre.split(" ")[0]} federado`, "oro");
    }
    case "PROMOVER_PRO": {
      const b = s.roster.find(x => x.id === a.id);
      if (!b || b.circuito !== "amateur" || (!b.campeon && b.ganadas < 5)) return s;
      let st = { ...s, roster: s.roster.map(x => x.id === a.id ? { ...x, circuito: "pro" as const, campeon: false, energia: 100 } : x) };
      st = log(st, `${b.nombre} da el salto al profesionalismo. ${b.ganadas}-${b.perdidas} en amateur.`);
      return toast(st, `${b.nombre.split(" ")[0]} es profesional`, "oro");
    }
    case "TOGGLE_ELITE": {
      const b = s.roster.find(x => x.id === a.id);
      if (!b || b.rol !== "boxeador") return s;
      const zona = s.gear.includes("zonaElite");
      if (!zona) return s;
      const elites = s.roster.filter(x => x.elite).length;
      if (!b.elite && elites >= 3) return toast(s, "Zona de Élite completa (3)", "info");
      let st = { ...s, roster: s.roster.map(x => x.id === a.id ? { ...x, elite: !x.elite } : x) };
      st = log(st, b.elite ? `${b.nombre} vuelve al grupo general.` : `${b.nombre} asciende a la Zona de Alto Rendimiento.`);
      return toast(st, b.elite ? "Bajó de la zona élite" : "Ascenso a Zona de Élite", "ok");
    }
    case "SCHEDULE_FIGHT": {
      const b = s.roster.find(x => x.id === a.id);
      if (!b || b.rol !== "boxeador" || s.schedule.includes(b.id) || s.schedule.length >= 3 || s.fama < 0) return s;
      if (b.energia < 40) return toast(s, `${b.nombre.split(" ")[0]} está agotado (energía < 40)`, "info");
      let st = { ...s, schedule: [...s.schedule, b.id] };
      return log(st, `Pelea pactada para el sábado: ${b.nombre} (${b.circuito}, ${b.division}).`);
    }
    case "UNSCHEDULE":
      return { ...s, schedule: s.schedule.filter(x => x !== a.id) };
    case "TOGGLE_VELADA": {
      if (!s.veladaProgramada && s.schedule.length === 0) return toast(s, "Programa al menos una pelea primero", "info");
      let st = { ...s, veladaProgramada: !s.veladaProgramada };
      return log(st, st.veladaProgramada ? "Velada anunciada: la ciudad habla de tu cartelera." : "Velada cancelada. Mejor otra vez.");
    }

    case "HIRE": {
      const info = STAFF_INFO[a.staff];
      if (a.staff === "gerente" && s.staff.filter(x => x.type === "gerente").length >= sucursales(s).length) return toast(s, "Necesitas una sucursal primero", "info");
      if (s.staff.some(x => x.type === a.staff && a.staff !== "gerente")) return toast(s, "Ya tienes ese puesto cubierto", "info");
      const nombres = ["Héctor Paz", "Miriam Sol", "Justo Lerma", "Carla Benítez", "Tito Aguirre", "Nadia Ríos"];
      let st: GameState = { ...s, staff: [...s.staff, { id: uid(), type: a.staff, nombre: nombres[Math.floor(Math.random() * nombres.length)] }] };
      st = log(st, `Contrataste a ${info.nombre} (${fmt(info.sueldo)}/mes).`);
      return toast(st, `${info.nombre} se une al equipo`, "ok");
    }
    case "FIRE": {
      const m = s.staff.find(x => x.id === a.id);
      if (!m) return s;
      let st = { ...s, staff: s.staff.filter(x => x.id !== a.id) };
      return log(st, `${m.nombre} deja el equipo en buenos términos.`);
    }
    case "CREATE_BRAND": {
      if (s.marcaRopa || s.dinero < 2000 || !a.name.trim()) return s;
      let st: GameState = { ...s, dinero: s.dinero - 2000, marcaRopa: a.name.trim() };
      st = log(st, `Nace tu marca: ${st.marcaRopa}. La ropa vuela según tu fama.`);
      return toast(st, `Marca "${st.marcaRopa}" lanzada`, "oro");
    }

    case "FIGHT_RESULT": {
      const fight = s.fights.find(f => f.id === a.result.fightId);
      if (!fight) return s;
      const r = a.result;
      let st = { ...s };
      const b = st.roster.find(x => x.id === fight.miBoxeador.id);
      if (b) {
        const nb: Boxer = {
          ...b,
          ganadas: b.ganadas + (r.gane ? 1 : 0),
          perdidas: b.perdidas + (r.gane ? 0 : 1),
          kos: b.kos + (r.gane && r.metodo === "KO" ? 1 : 0),
          campeon: r.titulo && r.gane ? true : b.campeon,
          energia: Math.max(5, b.energia - (r.gane ? 20 : 30)),
        };
        st.roster = st.roster.map(x => x.id === b.id ? nb : x);
        const pago = r.gane ? r.purse : Math.round(r.purse * 0.35);
        st.dinero += pago;
        st.ingresosSemana += pago;
        st.stats.dineroGanado += pago;
        st.stats.peleas += 1;
        if (r.gane) {
          st.stats.victorias += 1;
          if (r.metodo === "KO") st.stats.kos += 1;
        }
        const famaG = r.gane ? (r.metodo === "KO" ? 3 : 2) + (r.titulo ? 8 : 0) : 1;
        st.fama = Math.min(100, st.fama + famaG);
        st.famaSemana += famaG;
        // el rival vencido baja o se retira; entra sangre nueva
        st.rivales = st.rivales.filter(x => x.id !== fight.rival.id);
        st.rivales.push(genRival(fight.circuito, fight.rival.division));
        st = log(st, r.gane
          ? `${b.nombre} ${r.metodo === "KO" ? "NOQUEA" : "vence por decisión"} a ${fight.rival.nombre} en ${r.rounds} round(s). Bolsa: ${fmt(pago)}.`
          : `${b.nombre} cae ante ${fight.rival.nombre} por ${r.metodo.toLowerCase()}. El público valora la entrega (+1 fama).`);
        if (r.titulo && r.gane) {
          st = log(st, `¡¡${b.nombre} es CAMPEÓN ${b.circuito === "pro" ? "MUNDIAL" : "AMATEUR"} de ${b.division}!!`);
          st = toast(st, `¡Campeón de ${b.division}!`, "oro");
        } else {
          st = toast(st, r.gane ? `Victoria: ${b.nombre.split(" ")[0]} (${r.metodo})` : `Derrota: ${b.nombre.split(" ")[0]}`, r.gane ? "ok" : "info");
        }
        st.notasSemana = [`${b.nombre.split(" ")[0]} ${r.gane ? "gana" : "pierde"} vs ${fight.rival.nombre.split(" ")[0]} (${r.metodo})`, ...st.notasSemana];
      }
      st.fights = st.fights.filter(f => f.id !== r.fightId);
      if (st.fights.length === 0 && st.dia === 6) {
        st.dia = 7;
        st.resumen = { ingresos: st.ingresosSemana, gastos: st.gastosSemana, famaDelta: st.famaSemana, notas: st.notasSemana };
      }
      return st;
    }

    case "CLOSE_SUMMARY":
      return nuevaSemana(s);

    case "LEGACY": {
      if (s.fama < 60 || !s.roster.some(b => b.campeon)) return s;
      let st = nuevoJuego(s.nombreJugador, s.nombreGimnasio, s);
      st = toast(st, `Legado iniciado: llevas ${st.legados} generación(es) de grandeza.`, "oro");
      return st;
    }

    default:
      return s;
  }
}

function cargarInicial(): GameState {
  const vacio: GameState = {
    ...nuevoJuego("", ""), creado: false, toasts: [], log: [],
  };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.version === 1 && parsed.creado) return { ...vacio, ...parsed, toasts: [], fights: [] };
    }
  } catch { /* sin guardado */ }
  return vacio;
}

const GameCtx = createContext<{ state: GameState; dispatch: Dispatch<Action>; nivel: 1 | 2 | 3 } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, cargarInicial);
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, toasts: [] })); } catch { /* lleno */ }
  }, [state]);
  const nivel = nivelGimnasio(state);
  return <GameCtx.Provider value={{ state, dispatch, nivel }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame fuera de GameProvider");
  return ctx;
}
export { TRAITS as TRAITS_REF };
