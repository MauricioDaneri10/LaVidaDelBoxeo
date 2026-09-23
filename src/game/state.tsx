import { createContext, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { COMUNITARIOS, CURSOS, EQUIPOS, MEDIOS, PERSONAL_INFO, PROPIEDADES, TITULOS } from "./data";
import {
  aplicarEntrenamientoSemanal, alumnosActivos, alumnosEnEspera, azar, calcularModificadores, capacidadAlumnos, chance, clamp, consejoEsquina, crearEstadoBase,
  elegir, fmt, generarEventos, ofertasValidasPara, genPugilista, nivelGimnasio, sanitizarEstado,
  normalizarListaEspera, sucursales, uid, valoracion,
} from "./engine";
import type { Accion, EstadoJuego, EventoJuego, LineaLibro, Pelea, PartidaGuardada, PersonalId, Pugilista, ResultadoPelea, Toast } from "./types";

const CLAVE = "vida-del-boxeo-v2";
const CLAVE_PARTIDAS = `${CLAVE}:partidas`;
export const CLAVE_GUARDADO = CLAVE;
let toastId = 1;

export function listarPartidas(): PartidaGuardada[] {
  try {
    const raw = localStorage.getItem(CLAVE_PARTIDAS);
    const partidas = raw ? JSON.parse(raw) as PartidaGuardada[] : [];
    return Array.isArray(partidas) ? partidas.filter(p => p && p.id && p.estado) : [];
  } catch { return []; }
}

function guardarLista(partidas: PartidaGuardada[]) {
  localStorage.setItem(CLAVE_PARTIDAS, JSON.stringify(partidas.slice(0, 5)));
}

export function borrarPartida(id: string) {
  try { guardarLista(listarPartidas().filter(p => p.id !== id)); } catch {}
}

export function guardarEnRanura(estado: EstadoJuego, nombre = estado.nombrePartida || estado.nombreGimnasio || "Mi carrera"): boolean {
  try {
    const ahora = new Date().toISOString();
    const id = estado.partidaId || uid();
    const estadoGuardado = { ...estado, nombrePartida: nombre.trim() || "Mi carrera", partidaId: id };
    const partida: PartidaGuardada = { id, nombre: estadoGuardado.nombrePartida, coach: estadoGuardado.nombreJugador, gimnasio: estadoGuardado.nombreGimnasio, semana: estadoGuardado.semana, dia: estadoGuardado.dia, dinero: estadoGuardado.dinero, guardadaEn: ahora, estado: estadoGuardado };
    guardarLista([partida, ...listarPartidas().filter(p => p.id !== id)]);
    localStorage.setItem(CLAVE, JSON.stringify(estadoGuardado));
    localStorage.setItem(`${CLAVE}:guardadoEn`, ahora);
    return true;
  } catch { return false; }
}

export function guardarPartida(estado: EstadoJuego): boolean {
  try {
    const anterior = localStorage.getItem(CLAVE);
    if (anterior) localStorage.setItem(`${CLAVE}:respaldo`, anterior);
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    localStorage.setItem(`${CLAVE}:guardadoEn`, new Date().toISOString());
    if (estado.creado) guardarEnRanura(estado);
    return true;
  } catch {
    return false;
  }
}

function cargarInicial(): EstadoJuego {
  const base = crearEstadoBase();
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return base;
    return sanitizarEstado(JSON.parse(raw));
  } catch {
    return base;
  }
}

function conToast(s: EstadoJuego, texto: string, tono: Toast["tono"] = "info"): EstadoJuego {
  return { ...s, toasts: [...s.toasts.slice(-3), { id: toastId++, texto, tono }] };
}

function linea(arr: LineaLibro[], concepto: string, monto: number): LineaLibro[] {
  return [...arr, { concepto, monto }];
}

// La capacidad del gimnasio cuenta a todo el plantel: alumnos, espera y boxeadores.
// El margen extra evita que el scouting sature la partida con incorporaciones infinitas.
function limitePlantel(st: EstadoJuego): number {
  return capacidadAlumnos(st) + 4;
}

// ==================== FLUJOS SEMANALES ====================

function diaDeGestion(s: EstadoJuego): EstadoJuego {
  let st: EstadoJuego = { ...s };
  if (st.ultimaSemanaEntrenada !== st.semana) {
    const entreno = aplicarEntrenamientoSemanal(st);
    st.plantel = entreno.plantel;
    st.ultimaSemanaEntrenada = st.semana;
    if (entreno.lineas.length > 0) st = conToast(st, "Semana de entrenamiento en marcha.", "info");
  }

  // boca a boca del barrio (sin costo, solo oportunidad)
  const alumnos = alumnosActivos(st).length;
  const probBoca = 0.12 + st.fama / 500 + (st.personal.some(p => p.tipo === "asistente") ? 0.06 : 0) + (st.equipamiento.includes("carteles") ? 0.04 : 0);
  if (st.semana > 1 && st.plantel.length < limitePlantel(st) && alumnos < capacidadAlumnos(st) && chance(probBoca)) {
    const nuevo = genPugilista({ rol: "alumno", joven: chance(0.4) });
    st.plantel = [...st.plantel, nuevo];
    st = conToast(st, `Boca a boca: ${nuevo.nombre.split(" ")[0]} se suma a las clases.`, "ok");
  }

  // la sucursal con entrenador local descubre talento
  if (sucursales(st) > 0 && st.personal.some(p => p.tipo === "entrenadorLocal") && st.plantel.length < limitePlantel(st) && chance(0.12)) {
    const talento = genPugilista({ rol: "alumno", joven: true });
    talento.atrib.talento = clamp(talento.atrib.talento + azar(5, 15), 0, 97);
    st.plantel = normalizarListaEspera({ ...st, plantel: [...st.plantel, talento] }).plantel;
    st = conToast(st, `La sucursal descubrió a ${talento.nombre}, un talento del barrio.`, "oro");
  }

  // eventos del teléfono
  if (st.dia === 2) {
    const nuevos = generarEventos(st);
    if (nuevos.length > 0) st = { ...st, eventos: [...st.eventos, ...nuevos].slice(-6) };
  }

  // envejecer y vencer eventos
  st.eventos = st.eventos
    .map(e => ({ ...e, venceEn: e.venceEn - 1 }))
    .filter(e => e.venceEn > 0);

  return st;
}

function diaSabado(s: EstadoJuego): EstadoJuego {
  let st: EstadoJuego = { ...s };
  st.stats = { ...st.stats };

  // Guanteos (sparring): alumnos, amateurs y profesionales pueden hacerlos.
  const conEnergia = st.plantel.filter(p => !p.enEspera && p.energia >= 20);
  if (conEnergia.length > 0 && st.plantel.length >= 2) {
    const lugares = ["en el gimnasio", "con el " + elegir(["Club La Loma", "Club Ferro"]), "en una exhibición de barrio"];
    const lugar = elegir(lugares);
    let guanteos = 0;
    st.plantel = st.plantel.map(p => {
      if (p.enEspera || p.energia < 20) return p;
      const avance = p.rol === "alumno" ? (p.fogueo < p.fogueoMeta ? azar(1, 2) : 0) : azar(1, 2);
      guanteos += avance;
      const n = { ...p, atrib: { ...p.atrib } };
      n.fogueo = Math.min(p.fogueoMeta, p.fogueo + avance);
      n.guanteosRealizados = (p.guanteosRealizados ?? p.fogueo) + 1;
      n.energia = clamp(p.energia - 6, 0, 100);
      n.atrib.tecnica = clamp(n.atrib.tecnica + 0.4, 0, Math.min(99, p.atrib.talento + 3));
      n.atrib.defensa = clamp(n.atrib.defensa + 0.3, 0, Math.min(99, p.atrib.talento + 3));
      if (!p.lesion && chance(p.rol === "alumno" ? 0.015 : 0.025)) {
        n.lesion = { tipo: elegir(["golpe", "muscular", "mano", "corte"] as const), semanas: 1, gravedad: "leve", tratamiento: 80 };
      }
      return n;
    });
    if (guanteos > 0) st = conToast(st, `Guanteo (sparring) del sábado ${lugar}: ${guanteos} sesiones.`, "ok");
    const listos = st.plantel.filter(p => p.rol === "alumno" && !p.enEspera && p.fogueo >= p.fogueoMeta);
    if (listos.length > 0 && st.cursos.includes("dt")) {
      st = conToast(st, `${listos[0].nombre.split(" ")[0]} ya puede tramitar su Licencia Federativa.`, "oro");
    }
  }

  // El Representante agenda solo la cartelera del sábado
  if (st.personal.some(p => p.tipo === "representante") && st.cursos.includes("dt")) {
    const libres = st.plantel.filter(p =>
      p.rol === "boxeador" && p.energia >= 70 && !p.lesion && (!p.proximaPeleaSemana || p.proximaPeleaSemana <= st.semana) && !st.pendientes.some(x => x.miId === p.id)
    );
    libres.slice(0, 1).forEach(p => {
      const ofertas = ofertasValidasPara(p, st);
      const fuerte = valoracion(p.atrib) >= 55;
      // La automatización respeta las mismas reglas que la elección manual:
      // un representante no puede prometer un título internacional sin TV.
      const elegida = fuerte ? ofertas[2] : ofertas[1];
      st.pendientes = [...st.pendientes, { id: uid(), miId: p.id, rival: elegida.rival, bolsa: elegida.bolsa, esTitulo: elegida.esTitulo, velada: st.veladaProgramada, semanaProgramada: st.semana, diaProgramado: 6 }];
      st = conToast(st, `Tu Representante agendó a ${p.nombre.split(" ")[0]} vs ${elegida.rival.nombre.split(" ")[0]}.`, "info");
    });
  }

  // Recaudación de la velada propia (se cobra el sábado)
  if (st.veladaProgramada) {
    const modificadores = calcularModificadores(st);
    let recaudado = 300 + st.fama * 18 + (st.equipamiento.includes("ringReglamentario") ? 200 : 0);
    recaudado *= modificadores.multiplicadorVelada;
    recaudado = Math.round(recaudado + azar(0, 120));
    const costos = 250 + st.pendientes.length * 80;
    const neto = recaudado - costos;
    st.dinero += neto;
    st.stats.dineroGanado += Math.max(0, neto);
    st.stats.resultadoNeto += neto;
    st.stats.veladas += 1;
    st.libroIngresos = linea(st.libroIngresos, "Entradas de la velada del sábado", neto);
    st.fama = clamp(st.fama + (neto > 0 ? 2 : 1), 0, 100);
    st.veladaProgramada = false;
    st = conToast(st, `La velada dejó ${fmt(neto)} netos de entradas.`, neto > 0 ? "oro" : "info");
    st.prensa = [{ id: uid(), semana: st.semana, texto: `${elegir(MEDIOS)}: "${st.nombreGimnasio} llenó su velada del sábado y la ciudad lo aplaude."` }, ...st.prensa].slice(0, 10);
  }

  return st;
}

function domingoBalance(s: EstadoJuego): EstadoJuego {
  let st: EstadoJuego = { ...s };
  st.stats = { ...st.stats };
  const nivel = nivelGimnasio(st);
  let ingresos: LineaLibro[] = [];
  let gastos: LineaLibro[] = [];

  // ---- INGRESOS ----
  const alumnos = alumnosActivos(st).length;
  const boxeadores = st.plantel.filter(p => p.rol === "boxeador").length;
  const cuotaUnit = 18 + 2 * (nivel - 1);
  ingresos = linea(ingresos, `Cuotas de alumnos (${alumnos} × ${fmt(cuotaUnit)})`, alumnos * cuotaUnit);
  if (boxeadores > 0) ingresos = linea(ingresos, `Aporte del plantel federado (${boxeadores} × $12)`, boxeadores * 12);

  if (st.semana === 1) ingresos = linea(ingresos, "Subsidio de apertura del club", 240);

  const nSuc = sucursales(st);
  const gerentes = st.personal.filter(p => p.tipo === "gerente").length;
  const entrenadoresLocales = st.personal.filter(p => p.tipo === "entrenadorLocal").length;
  if (nSuc > 0) {
    const activas = Math.min(nSuc, gerentes);
    if (activas > 0) {
      let porSucursal = 650 + 8 * st.fama;
      porSucursal += Math.min(activas, entrenadoresLocales) * 200;
      if (st.cursos.includes("imperio")) porSucursal *= 1.5;
      ingresos = linea(ingresos, `Ingresos pasivos de sucursales (${activas})`, Math.round(porSucursal * activas));
    } else {
      ingresos = linea(ingresos, "Sucursales sin gerente (sin ingresos)", 0);
    }
  }

  if (st.marcaRopa && st.equipamiento.includes("estudioMarca")) {
    let ventas = Math.round(st.fama * 6 + 40);
    ventas = Math.round(ventas * calcularModificadores(st).multiplicadorMarca);
    ingresos = linea(ingresos, `Ventas de la marca "${st.marcaRopa}"`, ventas);
  }

  if (st.patrocinio) {
    ingresos = linea(ingresos, `Patrocinio de ${st.patrocinio.nombre}`, st.patrocinio.semanal);
  }

  const famaEquipamiento = (st.equipamiento.includes("carteles") ? 1 : 0)
    + (st.equipamiento.includes("marquesina") ? 2 : 0)
    + (st.equipamiento.includes("vitrina") ? 1 : 0);
  if (famaEquipamiento > 0) st.fama = clamp(st.fama + famaEquipamiento, 0, 100);

  st.comunitarios.forEach(c => {
    const info = COMUNITARIOS[c.tipo];
    let recaudado = azar(info.min, info.max);
    recaudado = Math.round(recaudado * calcularModificadores(st).multiplicadorEventos);
    ingresos = linea(ingresos, `Dividendos: ${c.nombre}`, recaudado);
    if (c.tipo === "festival") st.fama = clamp(st.fama + 3, 0, 100);
    if (c.tipo === "bingo" && chance(0.5) && st.plantel.length < limitePlantel(st) && alumnos < capacidadAlumnos(st)) {
      const nuevo = genPugilista({ rol: "alumno", joven: true });
    st.plantel = normalizarListaEspera({ ...st, plantel: [...st.plantel, nuevo] }).plantel;
      ingresos = linea(ingresos, `El bingo trajo a ${nuevo.nombre.split(" ")[0]} al gimnasio`, 0);
    }
  });
  st.comunitarios = [];

  const totalIngresos = ingresos.reduce((a, l) => a + l.monto, 0);

  // ---- GASTOS ----
  if (!st.propiedades.includes("local")) {
    gastos = linea(gastos, "Alquiler del local", 150);
  }
  const sueldos = st.personal.reduce((a, p) => a + PERSONAL_INFO[p.tipo].sueldo, 0);
  if (sueldos > 0) {
    gastos = linea(gastos, `Sueldos del personal (${st.personal.length})`, sueldos);
  }
  const totalGastos = gastos.reduce((a, l) => a + l.monto, 0);

  // La deuda es posible, pero visible y con un costo creciente. Nunca se
  // corrige silenciosamente ni se convierte en dinero infinito.
  if (st.dinero < 0) {
    const costoFinanciero = Math.max(10, Math.ceil(Math.abs(st.dinero) * 0.03));
    gastos = linea(gastos, "Costo financiero por caja negativa", costoFinanciero);
    st = conToast(st, `La caja está en negativo: se suma un costo financiero de ${fmt(costoFinanciero)}.`, "alerta");
  }

  const total = totalIngresos - gastos.reduce((a, l) => a + l.monto, 0);
  st.dinero += total;
  st.stats.dineroGanado += Math.max(0, total);
  st.stats.resultadoNeto += total;
  // El libro visible conserva el último cierre para que el jugador pueda
  // entender de dónde salió el resultado, incluso después de cerrar el modal.
  st.libroIngresos = ingresos;
  st.libroGastos = gastos;

  // patrocinio: descontar semanas
  if (st.patrocinio) {
    const semanas = st.patrocinio.semanas - 1;
    st.patrocinio = semanas <= 0 ? null : { ...st.patrocinio, semanas };
  }

  st.resumen = { ingresos, gastos, total };
  return st;
}

function cerrarDomingo(s: EstadoJuego): EstadoJuego {
  let st: EstadoJuego = { ...s, resumen: null, dia: 1 };
  st.semana += 1;
  if (st.semana % 4 === 1 && st.semana > 1) {
    st.mes += 1;
    if (st.mes > 12) { st.mes = 1; st.anio += 1; }
    st.plantel = st.plantel.map(p => ({ ...p, edad: p.edad + (st.semana % 48 === 1 ? 1 : 0) }));
  }

  // recuperación de energía dominical
  const recup = calcularModificadores(st).recuperacionEnergia;
  st.plantel = st.plantel.map(p => {
    const lesion = p.lesion ? (p.lesion.semanas <= 1 ? null : { ...p.lesion, semanas: p.lesion.semanas - 1 }) : null;
    return { ...p, energia: clamp(p.energia + recup, 0, 100), lesion };
  });

  // prensa semanal
  const ultimo = st.historial[0];
  if (ultimo) {
    const nota = ultimo.gane
      ? `${elegir(MEDIOS)} celebra: "${ultimo.resumen}" en la noche del sábado.`
      : `${elegir(MEDIOS)}: "Noche dura para el rincón local: ${ultimo.resumen}."`;
    st.prensa = [{ id: uid(), semana: st.semana, texto: nota }, ...st.prensa].slice(0, 10);
  }

  // consejos de Don Anselmo: evaluar hitos
  const hitos: Record<string, boolean> = {
    c1: st.plantel.some(p => p.rol === "boxeador"),
    c2: st.stats.victorias > 0,
    c3: st.equipamiento.length > 0,
    c4: st.stats.veladas > 0,
    c5: st.fama >= 40,
    c6: st.cinturones.length > 0,
    c7: st.personal.length > 0,
  };
  let nuevoConsejo = false;
  st.consejos = st.consejos.map(c => {
    if (!c.cumplido && hitos[c.id]) { nuevoConsejo = true; return { ...c, cumplido: true }; }
    return c;
  });
  if (nuevoConsejo) st = conToast(st, "Don Anselmo tiene un consejo listo para cobrar.", "oro");

  // salto al profesionalismo
  st.plantel = st.plantel.map(p => {
    if (p.rol === "boxeador" && p.circuito === "amateur" && p.peleasAmateur >= 50) {
      st = conToast(st, `${p.nombre.split(" ")[0]} completó 50 peleas amateurs y puede dar el salto al circuito profesional.`, "oro");
      return { ...p, circuito: "pro" as const };
    }
    return p;
  });

  return st;
}

// ==================== REDUCTOR ====================
function reductor(s: EstadoJuego, a: Accion): EstadoJuego {
  switch (a.type) {
    case "NUEVO_JUEGO": {
      const base = crearEstadoBase();
      let st: EstadoJuego = {
        ...base, creado: true,
        nombreJugador: a.nombre, nombreGimnasio: a.gimnasio,
        legados: s.legados,
        dinero: base.dinero + s.legados * 400,
        fama: base.fama + s.legados * 8,
        logoGimnasio: a.logoGimnasio ?? base.logoGimnasio,
        nombrePartida: `${a.gimnasio} · Semana 1`,
        partidaId: uid(),
      };
      st = conToast(st, `Bienvenido a ${a.gimnasio}. El barrio espera.`, "oro");
      return st;
    }
    case "CONTINUAR":
      return { ...s, creado: true };
    case "IMPORTAR":
      return conToast({ ...a.estado, creado: true }, "Partida importada correctamente.", "ok");
    case "REINICIAR":
      return crearEstadoBase();

    case "AVANZAR_DIA": {
      if (s.dia >= 7) return s;
      const dia = s.dia + 1;
      let st: EstadoJuego = { ...s, dia };
      if (dia <= 5) st = diaDeGestion(st);
      if (dia === 6) st = diaSabado(st);
      if (dia === 7) st = domingoBalance(st);
      return st;
    }
    case "SEMANA_RAPIDA": {
      if (s.dia >= 6) return s;
      if (s.dia === 6 && s.pendientes.length > 0) {
        return conToast(s, "Hay peleas en la cartelera del sábado: resolvelas antes de avanzar.", "alerta");
      }
      let st: EstadoJuego = { ...s };
      while (st.dia < 5) {
        const dia = st.dia + 1;
        st = { ...st, dia };
        st = diaDeGestion(st);
      }
      st = { ...st, dia: 6 };
      st = diaSabado(st);
      st = { ...st, dia: 7 };
      st = domingoBalance(st);
      return st;
    }
    case "CERRAR_DOMINGO":
      if (s.dia !== 7) return s;
      return cerrarDomingo(s);

    case "CAMBIAR_COMBO":
      return { ...s, plantel: s.plantel.map(p => p.id === a.id ? { ...p, combo: a.combo } : p) };

    case "LICENCIAR": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "alumno") return s;
      if (!s.cursos.includes("dt")) return conToast(s, "Primero necesitás la Licencia de Entrenador del club.", "alerta");
      if (p.enEspera) return conToast(s, "Está en lista de espera: primero liberá una plaza del gimnasio.", "alerta");
      if (p.fogueo < p.fogueoMeta) return conToast(s, `Le faltan prácticas de combate (${p.fogueo}/${p.fogueoMeta}).`, "alerta");
      if (p.licenciaFederativa) return conToast(s, "Este atleta ya tiene su licencia individual.", "info");
      if (s.dinero < 200) return conToast(s, "La Licencia Federativa cuesta $200.", "alerta");
      const nuevo: Pugilista = { ...p, rol: "boxeador", licenciaFederativa: true, enEspera: false, bonusDebut: true, energia: clamp(p.energia, 30, 100) };
      return conToast(normalizarListaEspera({ ...s, dinero: s.dinero - 200, plantel: s.plantel.map(x => x.id === a.id ? nuevo : x) }),
        `${p.nombre.split(" ")[0]} ya tiene su licencia individual y es boxeador federado. ¡Bono de Madurez activo en su debut!`, "oro");
    }

    case "ALTERNAR_ELITE": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "boxeador") return s;
      if (!s.equipamiento.includes("zonaElite")) return conToast(s, "Primero construí la Zona Élite VIP.", "alerta");
      const elites = s.plantel.filter(x => x.elite).length;
      if (!p.elite && elites >= 3) return conToast(s, "La Zona Élite tiene 3 cupos como máximo.", "alerta");
      return { ...s, plantel: s.plantel.map(x => x.id === a.id ? { ...x, elite: !x.elite } : x) };
    }

    case "BUSCAR_RIVAL": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "boxeador") return s;
      if (s.pendientes.some(x => x.miId === p.id)) return conToast(s, "Ya tiene pelea agendada para el sábado.", "info");
      const ofertas = ofertasValidasPara(p, s);
      return { ...s, ofertas, ofertasPara: p.id };
    }
    case "ELEGIR_OFERTA": {
      if (s.dia >= 6) return s;
      const of = s.ofertas.find(o => o.id === a.ofertaId);
      if (!of || !s.ofertasPara) return s;
      const peleador = s.plantel.find(p => p.id === s.ofertasPara);
      if (peleador && (peleador.energia < 70 || peleador.lesion)) return conToast(s, "Este boxeador necesita recuperar al menos 70% de energía antes de pactar una pelea.", "alerta");
      const pelea: Pelea = { id: uid(), miId: s.ofertasPara, rival: of.rival, bolsa: of.bolsa, esTitulo: of.esTitulo, velada: s.veladaProgramada, semanaProgramada: s.semana, diaProgramado: 6 };
      return conToast({ ...s, pendientes: [...s.pendientes, pelea], ofertas: [], ofertasPara: null },
        `Cartelera confirmada: ${of.etiqueta}, bolsa de ${fmt(of.bolsa)}.`, "ok");
    }
    case "CANCELAR_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      if (!pelea) return s;
      return conToast({ ...s, pendientes: s.pendientes.filter(p => p.id !== a.peleaId) },
        "La pelea se bajó de la cartelera. La federación lo entiende.", "info");
    }

    case "RESOLVER_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      if (!pelea) return s;
      const r: ResultadoPelea = s.equipamiento.includes("batas") && a.resultado.gane
        ? { ...a.resultado, fama: Math.round(a.resultado.fama * 1.25) }
        : a.resultado;
      let st: EstadoJuego = { ...s };
      st.stats = { ...st.stats };
      st.pendientes = st.pendientes.filter(p => p.id !== a.peleaId);
      st.dinero += r.bolsa;
      st.stats.dineroGanado += r.bolsa;
      st.stats.resultadoNeto += r.bolsa;
      st.libroIngresos = linea(st.libroIngresos, `Bolsa vs ${pelea.rival.nombre.split(" ")[0]} (${r.metodo})`, r.bolsa);
      st.stats.peleas += 1;
      if (r.gane) { st.stats.victorias += 1; if (r.metodo === "Nocaut" || r.metodo === "Nocaut Técnico") st.stats.kos += 1; }
      st.fama = clamp(st.fama + r.fama, 0, 100);
      st.historial = [r, ...st.historial].slice(0, 12);
      st.plantel = st.plantel.map(p => {
        if (p.id !== pelea.miId) return p;
        const n: Pugilista = {
          ...p,
          record: {
            v: p.record.v + (r.gane ? 1 : 0),
            d: p.record.d + (!r.gane && !r.empate ? 1 : 0),
            e: (p.record.e ?? 0) + (r.empate ? 1 : 0),
            ko: p.record.ko + (r.gane && (r.metodo === "Nocaut" || r.metodo === "Nocaut Técnico") ? 1 : 0),
          },
          peleasAmateur: p.peleasAmateur + (p.circuito === "amateur" ? 1 : 0),
          peleasProfesionales: p.peleasProfesionales + (p.circuito === "pro" ? 1 : 0),
          victoriasProfesionales: p.victoriasProfesionales + (p.circuito === "pro" && r.gane ? 1 : 0),
          derrotasProfesionales: p.derrotasProfesionales + (p.circuito === "pro" && !r.gane && !r.empate ? 1 : 0),
          empatesProfesionales: p.empatesProfesionales + (p.circuito === "pro" && r.empate ? 1 : 0),
          kosProfesionales: p.kosProfesionales + (p.circuito === "pro" && r.gane && (r.metodo === "Nocaut" || r.metodo === "Nocaut Técnico") ? 1 : 0),
          energia: clamp(p.energia - 18, 0, 100),
          bonusDebut: false,
          ultimaPeleaSemana: st.semana,
          proximaPeleaSemana: st.semana + (p.circuito === "pro" ? 3 : 2),
          lesion: p.lesion || (chance(r.gane ? 0.16 : 0.24) ? { tipo: elegir(["golpe", "muscular", "mano", "corte"] as const), semanas: r.gane ? 1 : 2, gravedad: r.gane ? "leve" : "media", tratamiento: r.gane ? 120 : 220 } : null),
          titulo: r.tituloGanado > p.titulo ? r.tituloGanado : p.titulo,
        };
        return n;
      });
      if (r.tituloGanado > 0) {
        const p = st.plantel.find(x => x.id === pelea.miId);
        const info = TITULOS[r.tituloGanado as 1 | 2 | 3 | 4];
        st.cinturones = [...st.cinturones, { id: uid(), dueno: p?.nombre ?? "Tu campeón", nivel: r.tituloGanado as 1 | 2 | 3 | 4, semana: st.semana }];
        st.stats.titulos += 1;
        st.fama = clamp(st.fama + 6 + r.tituloGanado * 2, 0, 100);
        st = conToast(st, `¡${info.cinturon} para ${p?.nombre.split(" ")[0]}! Ya cuelga en la pared del gimnasio.`, "oro");
        st.prensa = [{ id: uid(), semana: st.semana, texto: `${elegir(MEDIOS)}: "¡Nuevo campeón! ${p?.nombre} conquista el ${info.nombre}."` }, ...st.prensa].slice(0, 10);
      } else {
        st = conToast(st, r.gane ? `Victoria: ${r.metodo}. Bolsa de ${fmt(r.bolsa)}.` : r.empate ? `Empate: ${r.metodo}. La esquina aprende y sigue.` : `Derrota: ${r.metodo}. La esquina aprende y sigue.`, r.gane ? "ok" : "info");
      }
      return st;
    }

    case "COMPRAR_EQUIPO": {
      const eq = EQUIPOS[a.id];
      if (s.equipamiento.includes(a.id)) return conToast(s, "Ya lo tenés instalado.", "info");
      if (s.dinero < eq.costo) return conToast(s, `Te faltan ${fmt(eq.costo - s.dinero)} para ${eq.nombre}.`, "alerta");
      if (a.id === "zonaElite" && !s.cursos.includes("altoRendimiento")) return conToast(s, "Requiere el curso de Alto Rendimiento.", "alerta");
      return conToast(normalizarListaEspera({ ...s, dinero: s.dinero - eq.costo, equipamiento: [...s.equipamiento, a.id] }),
        `${eq.nombre} instalado: ${eq.efecto}.`, "ok");
    }

    case "CREAR_MARCA": {
      if (s.marcaRopa) return s;
      if (!s.equipamiento.includes("estudioMarca")) return conToast(s, "Primero montá el Estudio de Marca de Ropa.", "alerta");
      if (!a.nombre.trim()) return s;
      return conToast({ ...s, marcaRopa: a.nombre.trim() },
        `Nace la marca "${a.nombre.trim()}". Cada domingo se liquida la venta de indumentaria.`, "oro");
    }

    case "COMPRAR_CURSO": {
      const c = CURSOS[a.id];
      if (s.cursos.includes(a.id)) return s;
      if (c.req && !s.cursos.includes(c.req)) return conToast(s, `Requiere el curso previo: ${CURSOS[c.req].nombre}.`, "alerta");
      if (s.dinero < c.costo) return conToast(s, `El curso cuesta ${fmt(c.costo)}.`, "alerta");
      return conToast({ ...s, dinero: s.dinero - c.costo, cursos: [...s.cursos, a.id] },
        `Aprobaste "${c.nombre}". Nuevas puertas se abren.`, "oro");
    }

    case "COMPRAR_PROPIEDAD": {
      const p = PROPIEDADES[a.id];
      if (s.propiedades.includes(a.id)) return conToast(s, "Esa propiedad ya es tuya.", "info");
      if (a.id === "sucursal" && !s.propiedades.includes("terreno")) return conToast(s, "Primero comprá un terreno.", "alerta");
      if (a.id === "arena" && !s.cursos.includes("tv")) return conToast(s, "La Arena Central exige contrato de Televisión Estelar.", "alerta");
      if (a.id !== "sucursal" && a.id !== "local" && !s.cursos.includes("clubes") && (a.id === "terreno")) return conToast(s, "Requiere el curso de Gestión de Clubes.", "alerta");
      if (s.dinero < p.costo) return conToast(s, `Necesitás ${fmt(p.costo)}.`, "alerta");
      const propiedades = a.id === "sucursal" ? [...s.propiedades.filter(x => x !== "terreno"), a.id] : [...s.propiedades, a.id];
      let famaExtra = 0;
      if (a.id === "apartamento") famaExtra = 2;
      if (a.id === "mansion") famaExtra = 8;
      return conToast({ ...s, dinero: s.dinero - p.costo, propiedades, fama: clamp(s.fama + famaExtra, 0, 100) },
        `${p.nombre}: escritura firmada.`, "oro");
    }

    case "CONTRATAR": {
      const info = PERSONAL_INFO[a.tipo];
      if (!info.multiple && s.personal.some(p => p.tipo === a.tipo)) return conToast(s, "Ese puesto ya está cubierto.", "info");
      if ((a.tipo === "gerente" || a.tipo === "entrenadorLocal") && s.personal.filter(p => p.tipo === a.tipo).length >= sucursales(s))
        return conToast(s, "Necesitás una sucursal más para ese puesto.", "alerta");
      const requisito: Partial<Record<PersonalId, { semana?: number; fama?: number; curso?: keyof typeof CURSOS }>> = {
        representante: { semana: 2, curso: "veladas" },
        preparador: { semana: 2 },
        asistente: { semana: 2 },
        difusion: { semana: 3, fama: 8 },
        gerente: { semana: 4, curso: "franquicias" },
        entrenadorLocal: { semana: 4, curso: "franquicias" },
      };
      const req = requisito[a.tipo];
      if (req?.semana && s.semana < req.semana) return conToast(s, `${info.nombre} se habilita a partir de la semana ${req.semana}.`, "info");
      if (req?.fama && s.fama < req.fama) return conToast(s, `${info.nombre} requiere ${req.fama} de fama.`, "info");
      if (req?.curso && !s.cursos.includes(req.curso)) return conToast(s, `Necesitás el curso ${CURSOS[req.curso].nombre}.`, "info");
      const nombres = ["Héctor Paz", "Miriam Sol", "Justo Lerma", "Carla Benítez", "Tito Aguirre", "Nadia Ríos", "Oscar Vidal", "Pamela Cruz"];
      const nuevo = { id: uid(), tipo: a.tipo as PersonalId, nombre: elegir(nombres) };
      return conToast({ ...s, personal: [...s.personal, nuevo] },
        `${nuevo.nombre} se suma como ${info.nombre} (${fmt(info.sueldo)}/sem).`, "ok");
    }
    case "DESPEDIR": {
      const m = s.personal.find(p => p.id === a.id);
      if (!m) return s;
      return conToast(normalizarListaEspera({ ...s, personal: s.personal.filter(p => p.id !== a.id) }),
        `${m.nombre} deja el club en buenos términos.`, "info");
    }
    case "CARGAR_PARTIDA": {
      const partida = listarPartidas().find(p => p.id === a.id);
      return partida ? conToast({ ...sanitizarEstado(partida.estado), creado: true }, `Partida cargada: ${partida.nombre}.`, "ok") : s;
    }
    case "RETIRAR_ATLETA": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p) return s;
      const nombre = p.nombre.split(" ")[0];
      const antes = alumnosEnEspera(s).map(x => x.id);
      const esLeyenda = p.rol === "boxeador" && (p.titulo >= 3 || p.record.v >= 15 || p.record.ko >= 10);
      const siguiente = normalizarListaEspera({
        ...s,
        plantel: s.plantel.filter(x => x.id !== a.id),
        salonFama: esLeyenda ? [{ id: p.id, nombre: p.nombre, club: s.nombreGimnasio, record: { ...p.record }, titulos: p.titulo, semanaRetiro: s.semana, motivo: p.titulo >= 3 ? "Campeón de alto nivel" : "Récord histórico" }, ...s.salonFama].slice(0, 50) : s.salonFama,
      });
      const promovido = alumnosActivos(siguiente).find(x => !antes.includes(x.id));
      return conToast(siguiente,
        promovido
          ? `${nombre} deja el club. Se liberó una plaza: ${promovido.nombre.split(" ")[0]} sale de la lista de espera.`
          : esLeyenda ? `${nombre} se retira y entra al Salón de la Fama del club.` : `${nombre} deja el club y la plaza queda disponible.`, "info");
    }

    case "ALTERNAR_VELADA": {
      if (!s.cursos.includes("veladas")) return conToast(s, "Requiere el curso de Organización de Veladas.", "alerta");
      if (!s.veladaProgramada && s.dia >= 6) return conToast(s, "Ya es fin de semana: agendala el lunes.", "info");
      return conToast({ ...s, veladaProgramada: !s.veladaProgramada },
        s.veladaProgramada ? "Velada cancelada. El público lo entenderá." : "Velada programada para el sábado: las entradas se cobran ese día.", "info");
    }

    case "PROGRAMAR_SOCIAL": {
      const info = COMUNITARIOS[a.actividad];
      if (s.dia >= 6) return conToast(s, "Las actividades se agendan de lunes a viernes para el próximo domingo.", "info");
      if (s.comunitarios.length > 0) return conToast(s, "Ya hay una actividad social agendada para esta semana.", "info");
      if (s.dinero < info.inversion) return conToast(s, `Necesitás ${fmt(info.inversion)} para organizar ${info.nombre}.`, "alerta");
      return conToast({ ...s, dinero: s.dinero - info.inversion, comunitarios: [{ tipo: a.actividad, nombre: info.nombre }] }, `${info.nombre} agendado para el domingo. Se invertieron ${fmt(info.inversion)}.`, "ok");
    }

    case "EVENTO": {
      const ev = s.eventos.find(e => e.id === a.id);
      if (!ev) return s;
      const op = ev.opciones[a.opcion];
      if (!op) return s;
      let st: EstadoJuego = { ...s, eventos: s.eventos.filter(e => e.id !== a.id) };
      const acc = op.accion;
      if (acc.tipo === "programarComunitario" && acc.comunitario && acc.monto) {
        if (st.dinero < acc.monto) return conToast(s, `Necesitás ${fmt(acc.monto)} para organizarlo.`, "alerta");
        st.dinero -= acc.monto;
        st.comunitarios = [...st.comunitarios, { tipo: acc.comunitario, nombre: acc.nombre ?? acc.comunitario }];
        st = conToast(st, `${acc.nombre} anotado para el domingo.`, "ok");
      } else if (acc.tipo === "aceptarPatrocinio" && acc.nombre && acc.monto && acc.semanas) {
        st.patrocinio = { nombre: acc.nombre, semanal: acc.monto, semanas: acc.semanas };
        st = conToast(st, `Contrato firmado con ${acc.nombre}: ${fmt(acc.monto)}/semana.`, "oro");
      } else if (acc.tipo === "nuevoAlumno") {
        if (st.plantel.length >= limitePlantel(st)) return conToast(s, "El plantel está completo: liberá un cupo o ampliá el gimnasio para recibirlo.", "alerta");
        const nuevo = genPugilista({ rol: "alumno", joven: true });
        st = normalizarListaEspera({ ...st, plantel: [...st.plantel, nuevo] });
        st = conToast(st, `${nuevo.nombre} entra al plantel de alumnos.`, "ok");
      } else if (acc.tipo === "exhibicion") {
        const boxeador = st.plantel.find(p => p.rol === "boxeador" && p.energia >= 30);
        if (!boxeador) return conToast(s, "Ningún boxeador tiene energía para una exhibición.", "alerta");
        const pago = azar(80, 160);
        st.dinero += pago;
        st.fama = clamp(st.fama + 2, 0, 100);
        st.libroIngresos = linea(st.libroIngresos, "Exhibición benéfica", pago);
        st.plantel = st.plantel.map(p => p.id === boxeador.id ? { ...p, energia: clamp(p.energia - 10, 0, 100) } : p);
        st = conToast(st, `${boxeador.nombre.split(" ")[0]} brilló en la exhibición: ${fmt(pago)} y +2 de fama.`, "ok");
      } else if (acc.tipo === "dinero" && acc.monto) {
        st.dinero += acc.monto;
        st = conToast(st, `+${fmt(acc.monto)}`, "ok");
      } else if (acc.tipo === "fama" && acc.fama) {
        st.fama = clamp(st.fama + acc.fama, 0, 100);
        st = conToast(st, `+${acc.fama} de fama en el barrio.`, "ok");
      }
      return st;
    }

    case "RECLAMAR_CONSEJO": {
      const c = s.consejos.find(x => x.id === a.id);
      if (!c || !c.cumplido || c.reclamado) return s;
      return conToast({
        ...s,
        consejos: s.consejos.map(x => x.id === a.id ? { ...x, reclamado: true } : x),
        fama: clamp(s.fama + c.fama, 0, 100),
      }, `Don Anselmo asiente: +${c.fama} de fama.`, "oro");
    }

    case "SCOUT": {
      if (s.ultimaSemanaScout === s.semana) return conToast(s, "El buscador de talentos ya se usó esta semana. Podés volver a buscar el próximo lunes.", "info");
      if (s.plantel.length >= limitePlantel(s)) return conToast(s, "El plantel está completo. Liberá un cupo o mejorá el gimnasio para recibir más alumnos.", "alerta");
      const t = genPugilista({ rol: "alumno", joven: true });
      t.atrib.talento = clamp(t.atrib.talento + azar(4, 12), 0, 97);
      const next = normalizarListaEspera({ ...s, ultimaSemanaScout: s.semana, plantel: [...s.plantel, t] });
      const espera = alumnosEnEspera(next).some(p => p.id === t.id);
      return conToast(next,
        `${espera ? "Talento encontrado: " : "Nuevo alumno: "}${t.nombre} (talento ${Math.round(t.atrib.talento)}, valoración ${valoracion(t.atrib)}) ${espera ? "quedó en lista de espera." : "se sumó a tus clases."}`, espera ? "info" : "oro");
    }
    case "TOAST":
      return conToast(s, a.texto, a.tono ?? "info");
    case "QUITAR_TOAST":
      return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) };

    case "LEGADO": {
      const mejor = [...s.plantel].sort((x, y) => valoracion(y.atrib) - valoracion(x.atrib))[0];
      const base = crearEstadoBase();
      let st: EstadoJuego = {
        ...base, creado: true,
        nombreJugador: mejor ? mejor.nombre : "El Heredero",
        nombreGimnasio: s.nombreGimnasio + " II",
        legados: s.legados + 1,
        dinero: base.dinero + (s.legados + 1) * 500 + (mejor ? Math.round(valoracion(mejor.atrib) * 30) : 0),
        fama: clamp(base.fama + (s.legados + 1) * 10, 0, 100),
      };
      st = conToast(st, `Legado iniciado: ahora sos ${st.nombreJugador}, con prestigio, contactos y capital heredado.`, "oro");
      return st;
    }
  }
}

// Exportado para que el motor de reglas pueda probarse sin montar React.
export { reductor };

// ==================== CONTEXTO ====================
interface Ctx { state: EstadoJuego; dispatch: React.Dispatch<Accion>; nivel: number; }
const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reductor, undefined, cargarInicial);
  useEffect(() => {
    guardarPartida(state);
  }, [state]);
  return <GameCtx.Provider value={{ state, dispatch, nivel: nivelGimnasio(state) }}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame debe usarse dentro de GameProvider");
  return ctx;
}

export function consejoPara(p: Pugilista, rival: Pugilista | null) {
  return consejoEsquina(p, rival);
}
