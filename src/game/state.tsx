import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { ReactNode } from "react";
import { registrarGuia } from "./onboarding";
import { COMUNITARIOS, CURSOS, EQUIPOS, MEDIOS, PERSONAL_INFO, PROPIEDADES, TITULOS } from "./data";
import {
  aplicarEntrenamientoSemanal, alumnosActivos, alumnosEnEspera, azar, calcularModificadores, capacidadAlumnos, capacidadAmateurs, capacidadProfesionales, capacidadPlantel, chance, clamp, consejoEsquina, crearEstadoBase,
  elegir, fmt, generarEventos, ofertasValidasPara, ofertaValidaPara, genPugilista, nivelGimnasio, sanitizarEstado,
  normalizarListaEspera, puedePactarPelea, puedeProfesionalizar, puedeContratarPersonal, proyeccionSemanalRecurrente, sucursales, uid, valoracion,
  crecerAtributo, enfoqueRecomendado, fechaDelJuego, peleasVencidas, puedeGuantear, puedeEjecutarPelea, validarResultadoCombate, validarCheckpointCombate,
} from "./engine";
import type { Accion, EstadoJuego, EventoJuego, LineaLibro, Pelea, PersonalId, Pugilista, ResultadoPelea, Toast } from "./types";
import { repositorioPartidas, type EstadoGuardado } from "./saveRepository";
export { CLAVE_GUARDADO } from "./saveRepository";
export { migrarGuardado } from "./saveValidation";
import { migrarGuardado } from "./saveValidation";
import { consolidarConsejos, objetivoConsejo } from "./consejos";
import type { Consejo } from "./types";
import { weeklyEconomy, socialActivityIncome, costoFinancieroCaja } from "./economy";
import { objetivoConsejoCumplido } from "./consejos";
export { objetivoConsejoCumplido } from "./consejos";

let toastId = 1;
export const listarPartidas = () => repositorioPartidas.listar();
export const borrarPartida = (id: string) => repositorioPartidas.borrar(id);
export const guardarEnRanura = (estado: EstadoJuego, nombre?: string) => repositorioPartidas.guardar(estado, nombre);
export const guardarPartida = (estado: EstadoJuego) => repositorioPartidas.guardar(estado);
function cargarInicial(): EstadoJuego {
  const estado = repositorioPartidas.cargar();
  toastId = Math.max(0, ...estado.toasts.map(t => t.id)) + 1;
  return estado;
}

function conToast(s: EstadoJuego, texto: string, tono: Toast["tono"] = "info"): EstadoJuego {
  return { ...s, toasts: [...s.toasts.slice(-3), { id: toastId++, texto, tono }] };
}

function linea(arr: LineaLibro[], concepto: string, monto: number, claseContable?: LineaLibro["claseContable"]): LineaLibro[] {
  return [...arr, { concepto, monto, ...(claseContable ? { claseContable } : {}) }];
}

// La capacidad del gimnasio cuenta a todo el plantel: alumnos, espera y boxeadores.
function limitePlantel(st: EstadoJuego): number {
  return capacidadPlantel(st);
}

// ==================== FLUJOS SEMANALES ====================

const envejecerEventos = (eventos: EventoJuego[]) => eventos.map(e => ({ ...e, venceEn: e.venceEn - 1 })).filter(e => e.venceEn > 0);

/** The date itself is the durable stage marker; entering Saturday runs it once. */
function avanzarDia(s: EstadoJuego): EstadoJuego {
  if (s.dia >= 7) return s;
  if (peleasVencidas(s).length) return conToast(s, "Hay peleas pendientes: resolvelas o cancelalas antes de avanzar.", "alerta");
  const dia = s.dia + 1;
  const fecha = fechaDelJuego(s.semana, dia);
  let st: EstadoJuego = { ...s, dia, mes: fecha.getMonth() + 1, anio: fecha.getFullYear(), eventos: envejecerEventos(s.eventos) };
  if (fecha.getFullYear() > fechaDelJuego(s.semana, s.dia).getFullYear()) st.plantel = st.plantel.map(p => ({ ...p, edad: p.edad + 1 }));
  if (dia <= 5) st = diaDeGestion(st);
  if (dia === 6) st = diaSabado(st);
  if (dia === 7) st = domingoBalance(st);
  return st;
}

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
    st.plantel = incorporarAlumno(st, nuevo);
    st = conToast(st, `Boca a boca: ${nuevo.nombre.split(" ")[0]} se suma a las clases.`, "ok");
  }

  // la sucursal con entrenador local descubre talento
  if (sucursales(st) > 0 && st.personal.some(p => p.tipo === "entrenadorLocal") && st.plantel.length < limitePlantel(st) && chance(0.12)) {
    const talento = genPugilista({ rol: "alumno", joven: true });
    talento.atrib.talento = clamp(talento.atrib.talento + azar(5, 15) + (st.personal.some(p => p.tipo === "ojeador") ? 4 : 0), 0, 97);
    st.plantel = incorporarAlumno(st, talento);
    st = conToast(st, `La sucursal descubrió a ${talento.nombre}, un talento del barrio.`, "oro");
  }

  // Los eventos nuevos conservan su plazo completo durante el primer día visible.
  if (st.dia === 2) {
    const nuevos = generarEventos(st);
    // No descartamos asuntos todavía vigentes para hacer lugar a novedades:
    // se conserva el inbox activo y solo se agregan eventos en espacios libres.
    const cuposDisponibles = Math.max(0, 4 - st.eventos.length);
    if (cuposDisponibles > 0 && nuevos.length > 0) {
      st = { ...st, eventos: [...st.eventos, ...nuevos.slice(0, cuposDisponibles)] };
    }
  }

  return st;
}

/** Centraliza alta, distintivo temporal y enfoque inmediato del entrenador automático. */
function incorporarAlumno(estado: EstadoJuego, pugilista: Pugilista): Pugilista[] {
  const nuevo: Pugilista = { ...pugilista, semanaIngreso: estado.semana };
  if (estado.personal.some(p => p.tipo === "directorTecnico")) {
    nuevo.combo = enfoqueRecomendado(nuevo, estado);
  }
  return normalizarListaEspera({ ...estado, plantel: [...estado.plantel, nuevo] }).plantel;
}

function diaSabado(s: EstadoJuego): EstadoJuego {
  let st: EstadoJuego = { ...s };
  st.stats = { ...st.stats };

  // Guanteos (sparring): alumnos, amateurs y profesionales pueden hacerlos.
  // Schedule official bouts first, so a newly booked boxer cannot also spar.
  if (st.personal.some(p => p.tipo === "representante") && st.cursos.includes("dt")) {
    const libre = st.plantel.find(p => puedePactarPelea(p, st).ok);
    if (libre) {
      const ofertas = ofertasValidasPara(libre, st);
      const elegida = valoracion(libre.atrib) >= 55 ? ofertas[2] : ofertas[1];
      st.pendientes = [...st.pendientes, { id: uid(), miId: libre.id, rival: elegida.rival, bolsa: elegida.bolsa, esTitulo: elegida.esTitulo, velada: st.veladaProgramada, semanaProgramada: st.semana, diaProgramado: 6 }];
      st = conToast(st, `Tu Representante agendó a ${libre.nombre.split(" ")[0]} vs ${elegida.rival.nombre.split(" ")[0]}.`, "info");
    }
  }
  const conEnergia = st.plantel.filter(p => puedeGuantear(p, st));
  if (conEnergia.length >= 2) {
    const lugares = ["en el gimnasio", "con el " + elegir(["Club La Loma", "Club Ferro"]), "en una exhibición de barrio"];
    const lugar = elegir(lugares);
    let guanteos = 0;
    st.plantel = st.plantel.map(p => {
      if (!conEnergia.some(disponible => disponible.id === p.id)) return p;
      guanteos += 1;
      const n = { ...p, atrib: { ...p.atrib } };
      n.fogueo = Math.min(p.fogueoMeta, p.fogueo + 1); // Compatibility only; never license authority.
      n.guanteosRealizados = p.guanteosRealizados + 1;
      n.energia = clamp(p.energia - 6, 0, 100);
      n.atrib.tecnica = crecerAtributo(n.atrib.tecnica, 0.4, Math.min(99, p.atrib.talento + 3));
      n.atrib.defensa = crecerAtributo(n.atrib.defensa, 0.3, Math.min(99, p.atrib.talento + 3));
      if (!p.lesion && chance(p.rol === "alumno" ? 0.015 : 0.025)) {
        n.lesion = { tipo: elegir(["golpe", "muscular", "mano", "corte"] as const), semanas: 1, gravedad: "leve", tratamiento: 80 };
      }
      return n;
    });
    if (guanteos > 0) st = conToast(st, `Guanteo (sparring) del sábado ${lugar}: ${guanteos} sesiones.`, "ok");
    const listos = st.plantel.filter(p => p.rol === "alumno" && !p.enEspera && p.guanteosRealizados >= 10);
    if (listos.length > 0 && st.cursos.includes("dt")) {
      st = conToast(st, `${listos[0].nombre.split(" ")[0]} ya puede tramitar su Licencia Federativa.`, "oro");
    }
  } else if (st.plantel.some(p => !p.enEspera && !p.lesion && p.combo !== "descanso" && p.energia >= 20)) {
    st = conToast(st, "El guanteo del sábado necesita al menos dos pugilistas disponibles con energía. Revisá el plantel y la recuperación.", "info");
  }

  // Recaudación de la velada propia (se cobra el sábado)
  if (st.veladaProgramada) {
    const validas = peleasVencidas(st).filter(pelea => puedeEjecutarPelea(st, pelea));
    if (validas.length === 0) return conToast({ ...st, veladaProgramada: false }, "Velada cancelada: no hay combates válidos. No se cobraron entradas ni gastos de organización.", "info");
    const modificadores = calcularModificadores(st);
    let recaudado = 300 + st.fama * 18 + (st.equipamiento.includes("ringReglamentario") ? 200 : 0);
    recaudado *= modificadores.multiplicadorVelada;
    recaudado = Math.round(recaudado + azar(0, 120));
    const costos = 250 + st.pendientes.length * 80;
    const neto = recaudado - costos;
    st.dinero += neto;
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
  const ingresosYaLiquidados = sumaLibro(st.libroIngresos);
  const gastosYaLiquidados = sumaLibro(st.libroGastos);
  const determinista = weeklyEconomy(st, { nivel: nivelGimnasio(st), multiplicadorMarca: calcularModificadores(st).multiplicadorMarca });
  // Incluye primero los movimientos concretos ocurridos durante la semana;
  // debajo se agregan cuotas, nómina, alquiler y liquidaciones del domingo.
  let ingresos: LineaLibro[] = [...st.libroIngresos, ...determinista.ingresos];
  const gastos: LineaLibro[] = [...st.libroGastos, ...determinista.gastos];

  // ---- INGRESOS ----
  const alumnos = alumnosActivos(st).length;
  const derrotas = Math.max(0, st.stats.peleas - st.stats.victorias);
  const objetivoRecreativos = clamp(Math.floor(st.fama / 8) + (st.personal.some(p => p.tipo === "asistente") ? 2 : 0) - Math.floor(derrotas / 3), 0, 12);
  st.recreativos = clamp(st.recreativos + (objetivoRecreativos > st.recreativos ? 1 : objetivoRecreativos < st.recreativos ? -1 : 0), 0, 12);

  st.comunitarios.forEach(c => {
    const info = COMUNITARIOS[c.tipo];
    let recaudado = azar(info.min, info.max);
    recaudado = socialActivityIncome(recaudado, calcularModificadores(st).multiplicadorEventos);
    ingresos = linea(ingresos, `Dividendos: ${c.nombre}`, recaudado);
    if (c.tipo === "festival") st.fama = clamp(st.fama + 3, 0, 100);
    if (c.tipo === "bingo" && chance(0.5) && st.plantel.length < limitePlantel(st) && alumnos < capacidadAlumnos(st)) {
      const nuevo = genPugilista({ rol: "alumno", joven: true });
      st.plantel = incorporarAlumno(st, nuevo);
      ingresos = linea(ingresos, `El bingo trajo a ${nuevo.nombre.split(" ")[0]} al gimnasio`, 0);
    }
  });
  st.comunitarios = [];
  const seguidoresObjetivo = Math.max(0, Math.round(200 + st.fama * 60 + st.stats.victorias * 40 - derrotas * 20));
  // La comunidad crece o se enfría gradualmente; no debe saltar a su objetivo
  // teórico de un domingo al siguiente. Las activaciones puntuales (p. ej. prensa)
  // se conservan y el saldo converge sin dar saltos masivos.
  st.seguidores += clamp(seguidoresObjetivo - st.seguidores, -60, 90);

  const totalIngresos = ingresos.reduce((a, l) => a + l.monto, 0);
  const ingresosOperativos = ingresos
    .filter(l => l.claseContable !== "financiacion")
    .reduce((total, l) => total + l.monto, 0);
  const ingresosOperativosYaLiquidados = st.libroIngresos
    .filter(l => l.claseContable !== "financiacion")
    .reduce((total, l) => total + l.monto, 0);

  // ---- GASTOS ----
  // El cargo es proporcional en deudas pequeñas, pero tiene un techo para
  // evitar que el interés compuesto vuelva matemáticamente irrecuperable la partida.
  if (st.dinero < 0) {
    const costoFinanciero = costoFinancieroCaja(st.dinero);
    st = conToast(st, `La caja está en negativo: se suma un costo financiero de ${fmt(costoFinanciero)}.`, "alerta");
  }

  if (st.prestamo && st.prestamo.saldo > 0) {
    const cuota = Math.min(st.prestamo.cuota, st.prestamo.saldo);
    st.prestamo = { ...st.prestamo, saldo: st.prestamo.saldo - cuota, semanasRestantes: Math.max(0, st.prestamo.semanasRestantes - 1) };
    if (st.prestamo.saldo <= 0) {
      st.prestamo = null;
      st = conToast(st, "Préstamo cancelado: la caja vuelve a ser completamente tuya.", "ok");
    }
  }

  const totalGastos = gastos.reduce((a, l) => a + l.monto, 0);
  const total = totalIngresos - totalGastos;
  // Los movimientos intrasemanales ya modificaron la caja al ocurrir; aquí
  // solo se aplica la diferencia nueva, aunque el resumen muestre la semana
  // completa desde el lunes.
  const liquidacionNueva = (totalIngresos - ingresosYaLiquidados) - (totalGastos - gastosYaLiquidados);
  st.dinero += liquidacionNueva;
  st.stats.dineroGanado += Math.max(0, ingresosOperativos - ingresosOperativosYaLiquidados);
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
  const fecha = fechaDelJuego(st.semana, st.dia);
  st.mes = fecha.getMonth() + 1; st.anio = fecha.getFullYear();
  const pasoAnio = st.anio - fechaDelJuego(s.semana, s.dia).getFullYear();
  if (pasoAnio > 0) st.plantel = st.plantel.map(p => ({ ...p, edad: p.edad + pasoAnio }));
  st.eventos = envejecerEventos(s.eventos);

  // El resumen conserva la semana liquidada; el libro activo arranca vacío
  // para la semana nueva y nunca arrastra movimientos ya contabilizados.
  st.libroIngresos = [];
  st.libroGastos = [];
  st.semanaLibro = st.semana;

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
  let nuevoConsejo = false;
  st.consejos = st.consejos.map(c => {
    if (!c.cumplido && objetivoConsejoCumplido(c.id, st)) { nuevoConsejo = true; return { ...c, cumplido: true }; }
    return c;
  });
  if (nuevoConsejo) st = conToast(st, "Don Anselmo tiene un consejo listo para cobrar.", "oro");

  return st;
}

// ==================== REDUCTOR ====================
function reductorBase(s: EstadoJuego, a: Accion): EstadoJuego {
  if (s.combateActivo && (((a.type === "CAMBIAR_COMBO" || a.type === "ALTERNAR_ELITE") && a.id === s.combateActivo.A.p.id)
    || (a.type === "CONTRATAR" && a.tipo === "directorTecnico"))) {
    return conToast(s, "Terminá o cancelá el combate en curso antes de cambiar su preparación.", "info");
  }
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
    case "IMPORTAR": {
      try {
        const migrado = migrarGuardado(a.estado);
        const cargado = sanitizarEstado(migrado.estado);
        return conToast({ ...cargado, creado: true }, "Partida importada correctamente.", "ok");
      } catch (error) {
        return conToast(s, `No se importó la partida: ${error instanceof Error ? error.message : "formato inválido"}`, "alerta");
      }
    }
    case "REINICIAR":
      return crearEstadoBase();

    case "AVANZAR_DIA": {
      return avanzarDia(s);
    }
    case "SEMANA_RAPIDA": {
      if (s.dia >= 7) return s;
      let st = s;
      while (st.dia < 7) {
        if (peleasVencidas(st).length) return conToast(st, "Hay peleas pendientes: resolvelas o cancelalas antes de avanzar.", "alerta");
        st = avanzarDia(st);
      }
      return st;
    }
    case "CERRAR_DOMINGO":
      if (s.dia !== 7) return s;
      if (peleasVencidas(s).length) return conToast(s, "Resolvé o cancelá las peleas pendientes antes de abrir otra semana.", "alerta");
      return cerrarDomingo(s);

    case "CAMBIAR_COMBO":
      return { ...s, plantel: s.plantel.map(p => p.id === a.id ? { ...p, combo: a.combo } : p) };

    case "LICENCIAR": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "alumno") return s;
      if (!s.cursos.includes("dt")) return conToast(s, "Primero necesitás la Licencia de Entrenador del club.", "alerta");
      if (p.enEspera) return conToast(s, "Está en lista de espera: primero liberá una plaza del gimnasio.", "alerta");
      if (p.guanteosRealizados < 10) return conToast(s, `Le faltan guanteos reales (${p.guanteosRealizados}/10).`, "alerta");
      if (p.licenciaFederativa) return conToast(s, "Este boxeador ya tiene su licencia.", "info");
      if (s.dinero < 200) return conToast(s, "La Licencia Federativa cuesta $200.", "alerta");
      if (s.plantel.filter(x => x.rol === "boxeador" && x.circuito === "amateur").length >= capacidadAmateurs(s)) return conToast(s, "El cupo amateur está completo (10). Transferí o promoví a un boxeador antes de emitir otra licencia.", "alerta");
      const nuevo: Pugilista = { ...p, rol: "boxeador", licenciaFederativa: true, enEspera: false, bonusDebut: true, energia: clamp(p.energia, 30, 100) };
      return conToast(normalizarListaEspera({ ...s, dinero: s.dinero - 200, plantel: s.plantel.map(x => x.id === a.id ? nuevo : x) }),
        `${p.nombre.split(" ")[0]} ya tiene su Licencia Amateur y es boxeador federado. ¡Bono de Madurez activo en su debut!`, "oro");
    }

    case "PROMOVER_PRO": {
      const p = s.plantel.find(boxeador => boxeador.id === a.id);
      if (!p) return s;
      const validacion = puedeProfesionalizar(p, s);
      if (!validacion.ok) {
        const mensajes = {
          rol: "Solo un boxeador federado puede pasar al profesionalismo.",
          circuito: "Este boxeador ya es profesional.",
          trayectoria: "Necesita completar 50 peleas amateurs antes de decidir el pase.",
          cartelera: "Resolvé o bajá su pelea agendada antes de cambiarlo de circuito.",
          cupo: "El cupo profesional está completo (10). Liberá una plaza antes de aceptar el pase.",
        } satisfies Record<NonNullable<typeof validacion.motivo>, string>;
        return conToast(s, mensajes[validacion.motivo!], "alerta");
      }
      return conToast({ ...s, plantel: s.plantel.map(boxeador => boxeador.id === p.id ? { ...boxeador, circuito: "pro" as const } : boxeador) },
        `${p.nombre.split(" ")[0]} acepta el pase profesional. Su récord e historial amateur se conservan.`, "oro");
    }

    case "ALTERNAR_ELITE": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "boxeador") return s;
      if (!s.equipamiento.includes("zonaElite")) return conToast(s, "Primero construí la Zona Élite.", "alerta");
      const elites = s.plantel.filter(x => x.elite).length;
      if (!p.elite && elites >= 3) return conToast(s, "La Zona Élite tiene 3 cupos como máximo.", "alerta");
      return { ...s, plantel: s.plantel.map(x => x.id === a.id ? { ...x, elite: !x.elite } : x) };
    }

    case "BUSCAR_RIVAL": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "boxeador") return s;
      const validacion = puedePactarPelea(p, s);
      if (!validacion.ok) {
        const mensajes = {
          rol: "Solo un boxeador federado puede pactar peleas.",
          licencia: "Primero tramitá la licencia del boxeador.",
          pendiente: "Ya tiene pelea agendada para el sábado.",
          cooldown: `Debe recuperarse de su última pelea. Disponible desde la semana ${validacion.disponibleSemana}.`,
          energia: "Este boxeador necesita recuperar al menos 70% de energía.",
          lesion: "No puede pactar mientras tenga una lesión activa.",
        } satisfies Record<NonNullable<typeof validacion.motivo>, string>;
        return conToast(s, mensajes[validacion.motivo!], "alerta");
      }
      const ofertas = ofertasValidasPara(p, s);
      return { ...s, ofertas, ofertasPara: p.id };
    }
    case "ELEGIR_OFERTA": {
      if (s.dia >= 6) return s;
      const of = s.ofertas.find(o => o.id === a.ofertaId);
      if (!of || !s.ofertasPara) return s;
      const peleador = s.plantel.find(p => p.id === s.ofertasPara);
      if (!peleador) return s;
      if (!ofertaValidaPara(peleador, of, s)) return conToast(s, "Esta oferta antigua no es válida. Volvé a buscar rival para generar ofertas nuevas sin costo; tu cartelera confirmada se conserva.", "alerta");
      const validacion = puedePactarPelea(peleador, s);
      if (!validacion.ok) {
        const mensaje = validacion.motivo === "cooldown"
          ? `Debe recuperarse de su última pelea. Disponible desde la semana ${validacion.disponibleSemana}.`
          : validacion.motivo === "pendiente" ? "Ya tiene pelea agendada para el sábado."
          : validacion.motivo === "lesion" ? "No puede pactar mientras tenga una lesión activa."
          : "Este boxeador necesita recuperar al menos 70% de energía antes de pactar una pelea.";
        return conToast(s, mensaje, "alerta");
      }
      const pelea: Pelea = { id: uid(), miId: s.ofertasPara, rival: of.rival, bolsa: of.bolsa, esTitulo: of.esTitulo, velada: s.veladaProgramada, semanaProgramada: s.semana, diaProgramado: 6 };
      return conToast({ ...s, pendientes: [...s.pendientes, pelea], ofertas: [], ofertasPara: null },
        `Cartelera confirmada: ${of.etiqueta}, bolsa de ${fmt(of.bolsa)}.`, "ok");
    }
    case "CANCELAR_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      if (!pelea) return s;
      return conToast({ ...s,
        ...(s.contratosTitularesHistoricos ? { contratosTitularesHistoricos: s.contratosTitularesHistoricos.filter(id => id !== a.peleaId) } : {}),
        combateActivo: s.combateActivo?.pelea.id === a.peleaId ? null : s.combateActivo, pendientes: s.pendientes.filter(p => p.id !== a.peleaId) },
        "La pelea se bajó de la cartelera. La federación lo entiende.", "info");
    }

    case "CHECKPOINT_COMBATE":
      return validarCheckpointCombate(s, a.estado) ? { ...s, combateActivo: a.estado } : s;

    case "RESOLVER_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      if (!pelea) return s;
      if (!validarResultadoCombate(s, pelea, a.resultado)) return conToast(s, "No se aplicó el resultado: revisá identidad, fecha y disponibilidad del combate.", "alerta");
      const r: ResultadoPelea = s.equipamiento.includes("batas") && a.resultado.gane
        ? { ...a.resultado, fama: Math.round(a.resultado.fama * 1.25) }
        : a.resultado;
      let st: EstadoJuego = { ...s };
      st.stats = { ...st.stats };
      st.pendientes = st.pendientes.filter(p => p.id !== a.peleaId);
      if (st.contratosTitularesHistoricos) st.contratosTitularesHistoricos = st.contratosTitularesHistoricos.filter(id => id !== a.peleaId);
      if (st.combateActivo?.pelea.id === a.peleaId) st.combateActivo = null;
      st.dinero += r.bolsa;
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
      const famaExtra = a.id === "carteles" ? 1 : a.id === "marquesina" ? 2 : a.id === "vitrina" ? 1 : 0;
      return conToast(normalizarListaEspera({ ...s, dinero: s.dinero - eq.costo, fama: clamp(s.fama + famaExtra, 0, 100), equipamiento: [...s.equipamiento, a.id] }),
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
      const disponibilidad = puedeContratarPersonal(s, a.tipo);
      if (!disponibilidad.ok) return conToast(s, disponibilidad.mensaje ?? "Este puesto no está disponible.", "alerta");
      const personalPrevisto = [...s.personal, { id: "prevision-nomina", tipo: a.tipo, nombre: "Previsión" }];
      const proyeccionTrasContratar = proyeccionSemanalRecurrente({ ...s, personal: personalPrevisto });
      if (proyeccionTrasContratar.total < 0 && !a.confirmado) {
        return conToast(s, `La nómina dejaría un déficit recurrente de ${fmt(Math.abs(proyeccionTrasContratar.total))}/semana. Revisá la previsión y confirmá la contratación si querés asumirlo.`, "alerta");
      }
      const nombres = ["Héctor Paz", "Miriam Sol", "Justo Lerma", "Carla Benítez", "Tito Aguirre", "Nadia Ríos", "Oscar Vidal", "Pamela Cruz"];
      const nuevo = { id: uid(), tipo: a.tipo as PersonalId, nombre: elegir(nombres) };
      const plantel = a.tipo === "directorTecnico"
        ? s.plantel.map(p => p.enEspera ? p : { ...p, combo: enfoqueRecomendado(p, s) })
        : s.plantel;
      return conToast({ ...s, personal: [...s.personal, nuevo], plantel },
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
      if (!partida) return s;
      const migrado = migrarGuardado(partida.estado);
      const cargado = sanitizarEstado(migrado.estado);
      return conToast({ ...cargado, creado: true }, `Partida cargada: ${partida.nombre}.`, "ok");
    }
    case "RENOMBRAR_PARTIDA":
      return { ...s, nombrePartida: a.nombre.trim().slice(0, 32) || "Mi carrera" };
    case "RETIRAR_ATLETA": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p) return s;
      const peleaPendiente = s.pendientes.some(x => x.miId === p.id);
      if (peleaPendiente) return conToast(s, "No se puede transferir ni retirar a un boxeador con una pelea pendiente. Cancelá la cartelera primero.", "alerta");
      const nombre = p.nombre.split(" ")[0];
      const antes = alumnosEnEspera(s).map(x => x.id);
      const esLeyenda = p.rol === "boxeador" && (p.titulo >= 3 || p.record.v >= 15 || p.record.ko >= 10);
      const siguiente = normalizarListaEspera({
        ...s,
        plantel: s.plantel.filter(x => x.id !== a.id),
        archivoCarreras: p.rol === "boxeador" ? [
          { id: p.id, pugilista: structuredClone(p), club: s.nombreGimnasio, semanaSalida: s.semana, motivo: "Baja competitiva", historial: structuredClone(s.historial.filter(r => r.miId === p.id)) },
          ...s.archivoCarreras,
        ] : s.archivoCarreras,
        salonFama: esLeyenda ? [{ id: p.id, nombre: p.nombre, club: s.nombreGimnasio, record: { ...p.record }, titulos: p.titulo, semanaRetiro: s.semana, motivo: p.titulo >= 3 ? "Campeón de alto nivel" : "Récord histórico" }, ...s.salonFama].slice(0, 50) : s.salonFama,
      });
      const promovido = alumnosActivos(siguiente).find(x => antes.includes(x.id));
      return conToast(siguiente,
        promovido
          ? `${nombre} deja el club. Se liberó una plaza: ${promovido.nombre.split(" ")[0]} sale de la lista de espera.`
          : esLeyenda ? `${nombre} se retira y entra al Salón de la Fama del club.` : `${nombre} deja el club y la plaza queda disponible.`, "info");
    }

    case "ALTERNAR_VELADA": {
      if (!s.cursos.includes("veladas")) return conToast(s, "Requiere el curso de Organización de Veladas.", "alerta");
      if (!s.veladaProgramada && s.dia >= 6) return conToast(s, "Ya es fin de semana: agendala el lunes.", "info");
      return conToast({ ...s, veladaProgramada: !s.veladaProgramada },
        s.veladaProgramada ? "Velada cancelada. El público lo entenderá." : "Velada tentativa para el sábado: requiere al menos un combate válido; si no lo hay, se cancela sin cargo.", "info");
    }

    case "PROGRAMAR_SOCIAL": {
      const info = COMUNITARIOS[a.actividad];
      if (s.dia >= 6) return conToast(s, "Las actividades se agendan de lunes a viernes para el próximo domingo.", "info");
      if (s.comunitarios.length > 0) return conToast(s, "Ya hay una actividad social agendada para esta semana.", "info");
      if (s.dinero < info.inversion) return conToast(s, `Necesitás ${fmt(info.inversion)} para organizar ${info.nombre}.`, "alerta");
      const atraeRecreativo = a.actividad === "claseAbierta" && s.recreativos < 12;
      return conToast({
        ...s,
        dinero: s.dinero - info.inversion,
        recreativos: atraeRecreativo ? s.recreativos + 1 : s.recreativos,
        comunitarios: [{ tipo: a.actividad, nombre: info.nombre }],
      }, `${info.nombre} agendado para el domingo. Se invirtieron ${fmt(info.inversion)}${atraeRecreativo ? "; se suma 1 alumno recreativo esta semana" : a.actividad === "claseAbierta" ? "; el cupo recreativo ya está completo" : ""}.`, "ok");
    }

    case "PEDIR_PRESTAMO": {
      if (s.prestamo && s.prestamo.saldo > 0) return conToast(s, "Ya tenés un préstamo activo. Primero terminá de pagarlo.", "info");
      if (s.dinero >= 300) return conToast(s, "El préstamo de emergencia solo está disponible cuando la caja baja de $300.", "info");
      return conToast({ ...s, dinero: s.dinero + 500, prestamo: { saldo: 600, cuota: 60, semanasRestantes: 10 } }, "Préstamo de emergencia aprobado: recibís $500 y devolvés $600 en 10 cuotas.", "oro");
    }

    case "CERRAR_CLUB": {
      if (s.dinero > -1_500) return conToast(s, "El cierre por insolvencia solo está disponible con una deuda de $1.500 o más.", "info");
      if (!a.confirmado) return conToast(s, "Revisá la confirmación: cerrar el club elimina sus activos y su plantel.", "alerta");
      const base = crearEstadoBase();
      const nuevoNombre = `${s.nombreGimnasio || "Puños de Oro"} II`;
      const estadoReconstruido: EstadoJuego = {
        ...base,
        creado: true,
        nombreJugador: s.nombreJugador,
        nombreGimnasio: nuevoNombre,
        nombrePartida: `${nuevoNombre} · Reconstrucción`,
        partidaId: s.partidaId || uid(),
        // No transferir ventajas de legado a una reconstrucción por insolvencia.
        legados: base.legados,
        stats: {
          ...base.stats,
          peleas: s.stats.peleas,
          victorias: s.stats.victorias,
          kos: s.stats.kos,
          veladas: s.stats.veladas,
          titulos: s.stats.titulos,
        },
        salonFama: [...s.salonFama],
        archivoCarreras: structuredClone(s.archivoCarreras),
      };
      return conToast(estadoReconstruido, "El club cerró por insolvencia. Récord e hitos históricos conservados; la reconstrucción comienza sin deuda ni activos anteriores.", "oro");
    }

    case "EVENTO": {
      const ev = s.eventos.find(e => e.id === a.id);
      if (!ev) return s;
      if (ev.venceEn <= 0) return conToast(s, "Este evento ya venció.", "info");
      const op = ev.opciones[a.opcion];
      if (!op) return s;
      let st: EstadoJuego = { ...s, eventos: s.eventos.filter(e => e.id !== a.id) };
      const acc = op.accion;
      if (acc.tipo === "programarComunitario" && acc.comunitario && acc.monto) {
        if (st.dinero < acc.monto) return conToast(s, `Necesitás ${fmt(acc.monto)} para organizarlo.`, "alerta");
        if (st.comunitarios.length > 0) return conToast(s, "Ya hay una actividad social agendada para esta semana.", "info");
        st.dinero -= acc.monto;
        st.comunitarios = [...st.comunitarios, { tipo: acc.comunitario, nombre: acc.nombre ?? acc.comunitario }];
        st = conToast(st, `${acc.nombre} anotado para el domingo.`, "ok");
      } else if (acc.tipo === "aceptarPatrocinio" && acc.nombre && acc.monto && acc.semanas) {
        st.patrocinio = { nombre: acc.nombre, semanal: acc.monto, semanas: acc.semanas };
        st = conToast(st, `Contrato firmado con ${acc.nombre}: ${fmt(acc.monto)}/semana.`, "oro");
      } else if (acc.tipo === "nuevoAlumno") {
        if (st.plantel.length >= limitePlantel(st)) return conToast(s, "El plantel está completo: liberá un cupo o ampliá el gimnasio para recibirlo.", "alerta");
        const nuevo = genPugilista({ rol: "alumno", joven: true });
        st = { ...st, plantel: incorporarAlumno(st, nuevo) };
        st = conToast(st, `${nuevo.nombre} entra al plantel de alumnos.`, "ok");
      } else if (acc.tipo === "exhibicion") {
        const boxeador = st.plantel.find(p => p.rol === "boxeador" && p.energia >= 30 && p.id !== st.combateActivo?.A.p.id);
        if (!boxeador) return conToast(s, "No hay un boxeador disponible para la exhibición.", "alerta");
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
      } else if (acc.tipo === "mantenimiento" && acc.costo) {
        if (st.dinero < acc.costo) return conToast(s, `Necesitás ${fmt(acc.costo)} para reparar el gimnasio.`, "alerta");
        st.dinero -= acc.costo;
        st.libroGastos = linea(st.libroGastos, "Reparación del gimnasio", acc.costo);
        st = conToast(st, "Mantenimiento preventivo pagado.", "ok");
      } else if (acc.tipo === "entrevista" && acc.fama) {
        st.fama = clamp(st.fama + acc.fama, 0, 100);
        if (acc.monto != null) st.seguidores = Math.max(0, st.seguidores + acc.monto);
        const impactoFama = `${acc.fama > 0 ? "+" : "−"}${Math.abs(acc.fama)} fama`;
        const impactoSeguidores = acc.monto == null ? "" : ` y ${acc.monto > 0 ? "+" : acc.monto < 0 ? "−" : ""}${Math.abs(acc.monto)} seguidores`;
        st = conToast(st, `La entrevista tuvo este impacto: ${impactoFama}${impactoSeguidores}.`, acc.fama > 0 ? "oro" : "alerta");
      } else if (acc.tipo === "recaudacion" && acc.costo && acc.monto) {
        if (st.dinero < acc.costo) return conToast(s, `Necesitás ${fmt(acc.costo)} para organizar la colecta.`, "alerta");
        st.dinero += acc.monto - acc.costo;
        st.libroIngresos = linea(st.libroIngresos, "Colecta solidaria del barrio", acc.monto - acc.costo);
        st = conToast(st, `La colecta dejó ${fmt(acc.monto - acc.costo)} netos.`, "ok");
      }
      return st;
    }

    case "RECLAMAR_CONSEJO": {
      const c = s.consejos.find(x => x.id === a.id);
      const objetivo = c && objetivoConsejo(c.id);
      if (!c || !objetivo || !c.cumplido || c.reclamado || c.archivado) return s;
      const derechos = s.consejos.filter(x => objetivoConsejo(x.id) === objetivo);
      if (derechos.some(x => x.reclamado) || derechos.find(x => !x.archivado)?.id !== c.id) return s;
      return conToast({
        ...s,
        consejos: consolidarConsejos(s.consejos.map(x => x.id === a.id ? { ...x, reclamado: true } : x)) as Consejo[],
        fama: clamp(s.fama + c.fama, 0, 100),
        dinero: s.dinero + (c.dinero ?? 0),
      }, `Don Anselmo asiente: +${c.fama} de fama${c.dinero ? ` y ${fmt(c.dinero)}` : ""}. Hito único cobrado.`, "oro");
    }

    case "SCOUT": {
      if (s.ultimaSemanaScout === s.semana) return conToast(s, "El buscador de talentos ya se usó esta semana. Podés volver a buscar el próximo lunes.", "info");
      if (s.plantel.length >= limitePlantel(s)) return conToast(s, "El plantel está completo. Liberá un cupo o mejorá el gimnasio para recibir más alumnos.", "alerta");
      const t = genPugilista({ rol: "alumno", joven: true });
      t.atrib.talento = clamp(t.atrib.talento + azar(4, 12), 0, 97);
      const next = { ...s, ultimaSemanaScout: s.semana, plantel: incorporarAlumno(s, t) };
      const espera = alumnosEnEspera(next).some(p => p.id === t.id);
      return conToast(next,
        `${espera ? "Talento encontrado: " : "Nuevo alumno: "}${t.nombre} (talento ${Math.round(t.atrib.talento)}, valoración ${valoracion(t.atrib)}) ${espera ? "quedó en lista de espera." : "se sumó a tus clases."}`, espera ? "info" : "oro");
    }
    case "TOAST":
      return conToast(s, a.texto, a.tono ?? "info");
    case "QUITAR_TOAST":
      return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) };

    case "LEGADO": {
      if (s.fama < 85 && !s.cinturones.some(c => c.nivel === 4)) return conToast(s, "El legado requiere un título mundial o 85 de fama.", "alerta");
      const mejor = [...s.plantel].sort((x, y) => valoracion(y.atrib) - valoracion(x.atrib))[0];
      const base = crearEstadoBase();
      let st: EstadoJuego = {
        ...base, creado: true,
        nombreJugador: mejor ? mejor.nombre : "El Heredero",
        nombreGimnasio: s.nombreGimnasio + " II",
        partidaId: uid(),
        legados: s.legados + 1,
        dinero: base.dinero + (s.legados + 1) * 500 + (mejor ? Math.round(valoracion(mejor.atrib) * 30) : 0),
        fama: clamp(base.fama + (s.legados + 1) * 10, 0, 100),
      };
      st = conToast(st, `Legado iniciado: ahora sos ${st.nombreJugador}, con prestigio, contactos y capital heredado.`, "oro");
      return st;
    }
  }
}

function sumaLibro(lineas: LineaLibro[]): number {
  return lineas.reduce((total, linea) => total + linea.monto, 0);
}

function conceptoMovimiento(s: EstadoJuego, a: Accion): string {
  switch (a.type) {
    case "LICENCIAR": return `Licencia Amateur · ${s.plantel.find(p => p.id === a.id)?.nombre ?? "Boxeador"}`;
    case "COMPRAR_EQUIPO": return `Compra · ${EQUIPOS[a.id]?.nombre ?? "Equipamiento"}`;
    case "COMPRAR_CURSO": return `Curso · ${CURSOS[a.id]?.nombre ?? "Formación"}`;
    case "COMPRAR_PROPIEDAD": return `Compra · ${PROPIEDADES[a.id]?.nombre ?? "Propiedad"}`;
    case "PROGRAMAR_SOCIAL": return `Inversión · ${COMUNITARIOS[a.actividad]?.nombre ?? "Actividad social"}`;
    case "PEDIR_PRESTAMO": return "Desembolso del préstamo";
    case "RESOLVER_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      return `Bolsa de pelea · ${pelea?.rival.nombre ?? "Rival"}`;
    }
    case "RECLAMAR_CONSEJO": return `Recompensa · ${s.consejos.find(c => c.id === a.id)?.texto ?? "Don Anselmo"}`;
    case "EVENTO": return `Evento · ${s.eventos.find(e => e.id === a.id)?.titulo ?? "Club"}`;
    case "AVANZAR_DIA": return s.dia === 5 ? "Velada del sábado · neto" : "Movimiento del club";
    default: return "Movimiento del club";
  }
}

/**
 * Frontera única para registrar deltas monetarios de las acciones. Las
 * transiciones de liquidación producen su desglose dentro de domingoBalance;
 * carga/creación de partida no son operaciones económicas.
 */
function reductor(s: EstadoJuego, a: Accion): EstadoJuego {
  const base = s.semanaLibro === s.semana ? s : {
    ...s, semanaLibro: s.semana, libroIngresos: [], libroGastos: [],
  };
  const siguiente = registrarGuia(base, reductorBase(base, a), a);
  if (["NUEVO_JUEGO", "CONTINUAR", "IMPORTAR", "REINICIAR", "CARGAR_PARTIDA", "LEGADO"].includes(a.type)) return siguiente;
  if (siguiente.semana !== base.semana) {
    return { ...siguiente, semanaLibro: siguiente.semana, libroIngresos: [], libroGastos: [] };
  }
  if (siguiente.resumen && siguiente.resumen !== base.resumen) return siguiente;

  const cambioCaja = siguiente.dinero - base.dinero;
  const cambioLibro = (sumaLibro(siguiente.libroIngresos) - sumaLibro(base.libroIngresos))
    - (sumaLibro(siguiente.libroGastos) - sumaLibro(base.libroGastos));
  const faltante = cambioCaja - cambioLibro;
  if (!Number.isFinite(faltante) || Math.abs(faltante) < 0.001) return siguiente;

  const concepto = conceptoMovimiento(base, a);
  const monto = Math.abs(faltante);
  return faltante > 0
    ? { ...siguiente, semanaLibro: base.semana, libroIngresos: linea(siguiente.libroIngresos, concepto, monto, a.type === "PEDIR_PRESTAMO" ? "financiacion" : undefined) }
    : { ...siguiente, semanaLibro: base.semana, libroGastos: linea(siguiente.libroGastos, concepto, monto) };
}

// Exportado para que el motor de reglas pueda probarse sin montar React.
export { reductor };

// ==================== CONTEXTO ====================
interface Ctx { state: EstadoJuego; dispatch: React.Dispatch<Accion>; nivel: number; guardado: EstadoGuardado; reintentarGuardado: () => void; }
const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reductor, undefined, cargarInicial);
  const [guardado, setGuardado] = useState(() => repositorioPartidas.estado);
  const reintentarGuardado = () => { guardarPartida(state); setGuardado(repositorioPartidas.estado); };
  useEffect(() => {
    guardarPartida(state);
    setGuardado(repositorioPartidas.estado);
  }, [state]);
  return <GameCtx.Provider value={{ state, dispatch, nivel: nivelGimnasio(state), guardado, reintentarGuardado }}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame debe usarse dentro de GameProvider");
  return ctx;
}

export function consejoPara(p: Pugilista, rival: Pugilista | null) {
  return consejoEsquina(p, rival);
}
