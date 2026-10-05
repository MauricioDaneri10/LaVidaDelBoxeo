import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { ReactNode } from "react";
import { registrarGuia } from "./onboarding";
import { contenidoMensaje,contenidoLibro,contenidoPrensaResultado } from "./messageContent";
import { COMUNITARIOS, CURSOS, EQUIPOS, MEDIOS, PERSONAL_INFO, PROPIEDADES, TITULOS,OFERTAS_CONTENIDO,CONSEJOS_INICIALES } from "./data";
import {identidadEventoFiable} from "./eventContent";
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
import { migrarGuardado,ErrorGuardado } from "./saveValidation";
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

function conToast(s: EstadoJuego, mensaje: string | Pick<Toast,"texto"|"presentacion">, tono: Toast["tono"] = "info"): EstadoJuego {
  const contenido=typeof mensaje==="string"?{texto:mensaje}:mensaje;
  return { ...s, toasts: [...s.toasts.slice(-3), { id: toastId++, ...contenido, tono }] };
}

function linea(arr: LineaLibro[], concepto: string | LineaLibro, monto: number, claseContable?: LineaLibro["claseContable"]): LineaLibro[] {
  return [...arr, { ...(typeof concepto==="string"?{concepto}:concepto), monto, ...(claseContable ? { claseContable } : {}) }];
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
  if (peleasVencidas(s).length) return conToast(s, contenidoMensaje("toast.pendingFights"), "alerta");
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
    if (entreno.lineas.length > 0) st = conToast(st, contenidoMensaje("toast.training"), "info");
  }

  // boca a boca del barrio (sin costo, solo oportunidad)
  const alumnos = alumnosActivos(st).length;
  const probBoca = 0.12 + st.fama / 500 + (st.personal.some(p => p.tipo === "asistente") ? 0.06 : 0) + (st.equipamiento.includes("carteles") ? 0.04 : 0);
  if (st.semana > 1 && st.plantel.length < limitePlantel(st) && alumnos < capacidadAlumnos(st) && chance(probBoca)) {
    const nuevo = genPugilista({ rol: "alumno", joven: chance(0.4) });
    st.plantel = incorporarAlumno(st, nuevo);
    st = conToast(st, contenidoMensaje("toast.wordOfMouth",{name:nuevo.nombre.split(" ")[0]}), "ok");
  }

  // la sucursal con entrenador local descubre talento
  if (sucursales(st) > 0 && st.personal.some(p => p.tipo === "entrenadorLocal") && st.plantel.length < limitePlantel(st) && chance(0.12)) {
    const talento = genPugilista({ rol: "alumno", joven: true });
    talento.atrib.talento = clamp(talento.atrib.talento + azar(5, 15) + (st.personal.some(p => p.tipo === "ojeador") ? 4 : 0), 0, 97);
    st.plantel = incorporarAlumno(st, talento);
    st = conToast(st, contenidoMensaje("toast.branchTalent",{name:talento.nombre}), "oro");
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
      st = conToast(st, contenidoMensaje("toast.representativeBooked",{name:libre.nombre.split(" ")[0],rival:elegida.rival.nombre.split(" ")[0]}), "info");
    }
  }
  const conEnergia = st.plantel.filter(p => puedeGuantear(p, st));
  if (conEnergia.length >= 2) {
    const lugares = [{id:"toast.sparGym" as const,parametros:{}},{id:"toast.sparClub" as const,parametros:{club:elegir(["Club La Loma", "Club Ferro"])}},{id:"toast.sparNeighborhood" as const,parametros:{}}];
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
    if (guanteos > 0) st = conToast(st, contenidoMensaje(lugar.id,lugar.id==="toast.sparClub"?{club:lugar.parametros.club!,count:guanteos}:{count:guanteos}), "ok");
    const listos = st.plantel.filter(p => p.rol === "alumno" && !p.enEspera && p.guanteosRealizados >= 10);
    if (listos.length > 0 && st.cursos.includes("dt")) {
      st = conToast(st, contenidoMensaje("toast.readyLicense",{name:listos[0].nombre.split(" ")[0]}), "oro");
    }
  } else if (st.plantel.some(p => !p.enEspera && !p.lesion && p.combo !== "descanso" && p.energia >= 20)) {
    st = conToast(st, contenidoMensaje("toast.sparUnavailable"), "info");
  }

  // Recaudación de la velada propia (se cobra el sábado)
  if (st.veladaProgramada) {
    const validas = peleasVencidas(st).filter(pelea => puedeEjecutarPelea(st, pelea));
    if (validas.length === 0) return conToast({ ...st, veladaProgramada: false }, contenidoMensaje("toast.emptyShow"), "info");
    const modificadores = calcularModificadores(st);
    let recaudado = 300 + st.fama * 18 + (st.equipamiento.includes("ringReglamentario") ? 200 : 0);
    recaudado *= modificadores.multiplicadorVelada;
    recaudado = Math.round(recaudado + azar(0, 120));
    const costos = 250 + st.pendientes.length * 80;
    const neto = recaudado - costos;
    st.dinero += neto;
    st.stats.veladas += 1;
    st.libroIngresos = linea(st.libroIngresos, contenidoLibro("ledger.show",neto), neto);
    st.fama = clamp(st.fama + (neto > 0 ? 2 : 1), 0, 100);
    st.veladaProgramada = false;
    st = conToast(st, contenidoMensaje("toast.showNet",{amount:neto}), neto > 0 ? "oro" : "info");
    st.prensa = [{ id: uid(), semana: st.semana, ...contenidoMensaje("press.show",{medium:elegir(MEDIOS),club:st.nombreGimnasio}) }, ...st.prensa].slice(0, 10);
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
    ingresos = linea(ingresos, c.nombre===info.nombre
      ? contenidoLibro("ledger.activityDividends",recaudado,{activity:c.tipo})
      : contenidoLibro("ledger.dividends",recaudado,{name:c.nombre}), recaudado);
    if (c.tipo === "festival") st.fama = clamp(st.fama + 3, 0, 100);
    if (c.tipo === "bingo" && chance(0.5) && st.plantel.length < limitePlantel(st) && alumnos < capacidadAlumnos(st)) {
      const nuevo = genPugilista({ rol: "alumno", joven: true });
      st.plantel = incorporarAlumno(st, nuevo);
      ingresos = linea(ingresos, contenidoLibro("ledger.bingoStudent",0,{name:nuevo.nombre.split(" ")[0]}), 0);
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
    st = conToast(st, contenidoMensaje("toast.overdraftCost",{amount:costoFinanciero}), "alerta");
  }

  if (st.prestamo && st.prestamo.saldo > 0) {
    const cuota = Math.min(st.prestamo.cuota, st.prestamo.saldo);
    st.prestamo = { ...st.prestamo, saldo: st.prestamo.saldo - cuota, semanasRestantes: Math.max(0, st.prestamo.semanasRestantes - 1) };
    if (st.prestamo.saldo <= 0) {
      st.prestamo = null;
      st = conToast(st, contenidoMensaje("toast.loanPaid"), "ok");
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
    const nota = contenidoPrensaResultado(ultimo,elegir(MEDIOS));
    st.prensa = [{ id: uid(), semana: st.semana, ...nota }, ...st.prensa].slice(0, 10);
  }

  // consejos de Don Anselmo: evaluar hitos
  let nuevoConsejo = false;
  st.consejos = st.consejos.map(c => {
    if (!c.cumplido && objetivoConsejoCumplido(c.id, st)) { nuevoConsejo = true; return { ...c, cumplido: true }; }
    return c;
  });
  if (nuevoConsejo) st = conToast(st, contenidoMensaje("toast.adviceReady"), "oro");

  return st;
}

// ==================== REDUCTOR ====================
function reductorBase(s: EstadoJuego, a: Accion): EstadoJuego {
  if (s.combateActivo && (((a.type === "CAMBIAR_COMBO" || a.type === "ALTERNAR_ELITE") && a.id === s.combateActivo.A.p.id)
    || (a.type === "CONTRATAR" && a.tipo === "directorTecnico"))) {
    return conToast(s, contenidoMensaje("toast.activePreparation"), "info");
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
      st = conToast(st, contenidoMensaje("toast.welcome",{name:a.gimnasio}), "oro");
      return st;
    }
    case "CONTINUAR":
      return { ...s, creado: true };
    case "IMPORTAR": {
      try {
        const migrado = migrarGuardado(a.estado);
        const cargado = sanitizarEstado(migrado.estado);
        return conToast({ ...cargado, creado: true }, contenidoMensaje("toast.imported"), "ok");
      } catch (error) {
        return conToast(s,error instanceof ErrorGuardado&&error.presentacion?contenidoMensaje("toast.importKnown",{reason:JSON.stringify(error.presentacion)}):contenidoMensaje("toast.importTechnical",{details:error instanceof Error?error.message:"formato inválido"}), "alerta");
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
        if (peleasVencidas(st).length) return conToast(st, contenidoMensaje("toast.pendingFights"), "alerta");
        st = avanzarDia(st);
      }
      return st;
    }
    case "CERRAR_DOMINGO":
      if (s.dia !== 7) return s;
      if (peleasVencidas(s).length) return conToast(s, contenidoMensaje("toast.nextWeek"), "alerta");
      return cerrarDomingo(s);

    case "CAMBIAR_COMBO":
      return { ...s, plantel: s.plantel.map(p => p.id === a.id ? { ...p, combo: a.combo } : p) };

    case "LICENCIAR": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "alumno") return s;
      if (!s.cursos.includes("dt")) return conToast(s, contenidoMensaje("toast.coachLicense"), "alerta");
      if (p.enEspera) return conToast(s, contenidoMensaje("toast.waiting"), "alerta");
      if (p.guanteosRealizados < 10) return conToast(s, contenidoMensaje("toast.missingSpars",{count:p.guanteosRealizados}), "alerta");
      if (p.licenciaFederativa) return conToast(s, contenidoMensaje("toast.alreadyLicensed"), "info");
      if (s.dinero < 200) return conToast(s, contenidoMensaje("toast.licensePrice"), "alerta");
      if (s.plantel.filter(x => x.rol === "boxeador" && x.circuito === "amateur").length >= capacidadAmateurs(s)) return conToast(s, contenidoMensaje("toast.amateurFull"), "alerta");
      const nuevo: Pugilista = { ...p, rol: "boxeador", licenciaFederativa: true, enEspera: false, bonusDebut: true, energia: clamp(p.energia, 30, 100) };
      return conToast(normalizarListaEspera({ ...s, dinero: s.dinero - 200, plantel: s.plantel.map(x => x.id === a.id ? nuevo : x) }),
        contenidoMensaje("toast.licensed",{name:p.nombre.split(" ")[0]}), "oro");
    }

    case "PROMOVER_PRO": {
      const p = s.plantel.find(boxeador => boxeador.id === a.id);
      if (!p) return s;
      const validacion = puedeProfesionalizar(p, s);
      if (!validacion.ok) {
        const mensajes = {
          rol: contenidoMensaje("toast.proRole"),
          circuito: contenidoMensaje("toast.alreadyPro"),
          trayectoria: contenidoMensaje("toast.proExperience"),
          cartelera: contenidoMensaje("toast.proPending"),
          cupo: contenidoMensaje("toast.proFull"),
        } satisfies Record<NonNullable<typeof validacion.motivo>, ReturnType<typeof contenidoMensaje>>;
        return conToast(s, mensajes[validacion.motivo!], "alerta");
      }
      return conToast({ ...s, plantel: s.plantel.map(boxeador => boxeador.id === p.id ? { ...boxeador, circuito: "pro" as const } : boxeador) },
        contenidoMensaje("toast.professional",{name:p.nombre.split(" ")[0]}), "oro");
    }

    case "ALTERNAR_ELITE": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "boxeador") return s;
      if (!s.equipamiento.includes("zonaElite")) return conToast(s, contenidoMensaje("toast.eliteRequired"), "alerta");
      const elites = s.plantel.filter(x => x.elite).length;
      if (!p.elite && elites >= 3) return conToast(s, contenidoMensaje("toast.eliteFull"), "alerta");
      return { ...s, plantel: s.plantel.map(x => x.id === a.id ? { ...x, elite: !x.elite } : x) };
    }

    case "BUSCAR_RIVAL": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p || p.rol !== "boxeador") return s;
      const validacion = puedePactarPelea(p, s);
      if (!validacion.ok) {
        const mensajes = {
          rol: ()=>contenidoMensaje("toast.matchRole"),
          licencia: ()=>contenidoMensaje("toast.matchLicence"),
          pendiente: ()=>contenidoMensaje("toast.matchPending"),
          cooldown: ()=>contenidoMensaje("toast.cooldown",{count:validacion.disponibleSemana!}),
          energia: ()=>contenidoMensaje("toast.matchEnergy"),
          lesion: ()=>contenidoMensaje("toast.matchInjury"),
        } satisfies Record<NonNullable<typeof validacion.motivo>, ()=>ReturnType<typeof contenidoMensaje>>;
        return conToast(s, mensajes[validacion.motivo!](), "alerta");
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
      if (!ofertaValidaPara(peleador, of, s)) return conToast(s, contenidoMensaje("toast.oldOffer"), "alerta");
      const validacion = puedePactarPelea(peleador, s);
      if (!validacion.ok) {
        const mensaje = validacion.motivo === "cooldown"
          ? contenidoMensaje("toast.cooldown",{count:validacion.disponibleSemana!})
          : validacion.motivo === "pendiente" ? contenidoMensaje("toast.matchPending")
          : validacion.motivo === "lesion" ? contenidoMensaje("toast.matchInjury")
          : contenidoMensaje("toast.matchEnergyBefore");
        return conToast(s, mensaje, "alerta");
      }
      const pelea: Pelea = { id: uid(), miId: s.ofertasPara, rival: of.rival, bolsa: of.bolsa, esTitulo: of.esTitulo, velada: s.veladaProgramada, semanaProgramada: s.semana, diaProgramado: 6 };
      const known=OFERTAS_CONTENIDO[of.nivel];
      const title=of.esTitulo?TITULOS[of.esTitulo as 1|2|3|4]:undefined;
      const message=of.esTitulo===0&&known&&of.etiqueta===known.etiqueta&&of.detalle===known.detalle
        ?contenidoMensaje("toast.bookOrdinary",{offer:of.nivel,amount:of.bolsa})
        :title&&of.etiqueta===`Pelea de Título · ${title.nombre}`&&of.detalle===`${title.cinturon} en juego. Requisitos: ${title.req}.`
        ?contenidoMensaje("toast.bookTitle",{title:of.esTitulo,amount:of.bolsa})
        :`Cartelera confirmada: ${of.etiqueta}, bolsa de ${fmt(of.bolsa)}.`;
      return conToast({ ...s, pendientes: [...s.pendientes, pelea], ofertas: [], ofertasPara: null },
        message, "ok");
    }
    case "CANCELAR_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      if (!pelea) return s;
      return conToast({ ...s,
        ...(s.contratosTitularesHistoricos ? { contratosTitularesHistoricos: s.contratosTitularesHistoricos.filter(id => id !== a.peleaId) } : {}),
        combateActivo: s.combateActivo?.pelea.id === a.peleaId ? null : s.combateActivo, pendientes: s.pendientes.filter(p => p.id !== a.peleaId) },
        contenidoMensaje("toast.fightCancelled"), "info");
    }

    case "CHECKPOINT_COMBATE":
      return validarCheckpointCombate(s, a.estado) ? { ...s, combateActivo: a.estado } : s;

    case "RESOLVER_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      if (!pelea) return s;
      if (!validarResultadoCombate(s, pelea, a.resultado)) return conToast(s, contenidoMensaje("toast.invalidResult"), "alerta");
      const r: ResultadoPelea = s.equipamiento.includes("batas") && a.resultado.gane
        ? { ...a.resultado, fama: Math.round(a.resultado.fama * 1.25) }
        : a.resultado;
      let st: EstadoJuego = { ...s };
      st.stats = { ...st.stats };
      st.pendientes = st.pendientes.filter(p => p.id !== a.peleaId);
      if (st.contratosTitularesHistoricos) st.contratosTitularesHistoricos = st.contratosTitularesHistoricos.filter(id => id !== a.peleaId);
      if (st.combateActivo?.pelea.id === a.peleaId) st.combateActivo = null;
      st.dinero += r.bolsa;
      st.libroIngresos = linea(st.libroIngresos, contenidoLibro("ledger.purse",r.bolsa,{name:pelea.rival.nombre.split(" ")[0],method:r.metodo}), r.bolsa);
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
        st = conToast(st, contenidoMensaje("toast.belt",{belt:r.tituloGanado,name:String(p?.nombre.split(" ")[0])}), "oro");
        st.prensa = [{ id: uid(), semana: st.semana, ...contenidoMensaje("press.champion",{medium:elegir(MEDIOS),name:String(p?.nombre),title:r.tituloGanado}) }, ...st.prensa].slice(0, 10);
      } else {
        st = conToast(st, contenidoMensaje(r.gane?"toast.victory":r.empate?"toast.draw":"toast.defeat",r.gane?{method:r.metodo,amount:r.bolsa}:{method:r.metodo}), r.gane ? "ok" : "info");
      }
      return st;
    }

    case "COMPRAR_EQUIPO": {
      const eq = EQUIPOS[a.id];
      if (s.equipamiento.includes(a.id)) return conToast(s, contenidoMensaje("toast.installed"), "info");
      if (s.dinero < eq.costo) return conToast(s, contenidoMensaje("toast.gearFunds",{amount:eq.costo-s.dinero,gear:a.id}), "alerta");
      if (a.id === "zonaElite" && !s.cursos.includes("altoRendimiento")) return conToast(s, contenidoMensaje("toast.performanceRequired"), "alerta");
      const famaExtra = a.id === "carteles" ? 1 : a.id === "marquesina" ? 2 : a.id === "vitrina" ? 1 : 0;
      return conToast(normalizarListaEspera({ ...s, dinero: s.dinero - eq.costo, fama: clamp(s.fama + famaExtra, 0, 100), equipamiento: [...s.equipamiento, a.id] }),
        contenidoMensaje("toast.gearInstalled",{gear:a.id,effect:a.id}), "ok");
    }

    case "CREAR_MARCA": {
      if (s.marcaRopa) return s;
      if (!s.equipamiento.includes("estudioMarca")) return conToast(s, contenidoMensaje("toast.brandStudio"), "alerta");
      if (!a.nombre.trim()) return s;
      return conToast({ ...s, marcaRopa: a.nombre.trim() },
        contenidoMensaje("toast.brandBorn",{name:a.nombre.trim()}), "oro");
    }

    case "COMPRAR_CURSO": {
      const c = CURSOS[a.id];
      if (s.cursos.includes(a.id)) return s;
      if (c.req && !s.cursos.includes(c.req)) return conToast(s, contenidoMensaje("toast.courseRequired",{course:c.req}), "alerta");
      if (s.dinero < c.costo) return conToast(s, contenidoMensaje("toast.coursePrice",{amount:c.costo}), "alerta");
      return conToast({ ...s, dinero: s.dinero - c.costo, cursos: [...s.cursos, a.id] },
        contenidoMensaje("toast.courseBought",{course:a.id}), "oro");
    }

    case "COMPRAR_PROPIEDAD": {
      const p = PROPIEDADES[a.id];
      if (s.propiedades.includes(a.id)) return conToast(s, contenidoMensaje("toast.ownedProperty"), "info");
      if (a.id === "sucursal" && !s.propiedades.includes("terreno")) return conToast(s, contenidoMensaje("toast.landRequired"), "alerta");
      if (a.id === "arena" && !s.cursos.includes("tv")) return conToast(s, contenidoMensaje("toast.arenaRequired"), "alerta");
      if (a.id !== "sucursal" && a.id !== "local" && !s.cursos.includes("clubes") && (a.id === "terreno")) return conToast(s, contenidoMensaje("toast.clubsRequired"), "alerta");
      if (s.dinero < p.costo) return conToast(s, contenidoMensaje("toast.funds",{amount:p.costo}), "alerta");
      const propiedades = a.id === "sucursal" ? [...s.propiedades.filter(x => x !== "terreno"), a.id] : [...s.propiedades, a.id];
      let famaExtra = 0;
      if (a.id === "apartamento") famaExtra = 2;
      if (a.id === "mansion") famaExtra = 8;
      return conToast({ ...s, dinero: s.dinero - p.costo, propiedades, fama: clamp(s.fama + famaExtra, 0, 100) },
        contenidoMensaje("toast.propertyBought",{property:a.id}), "oro");
    }

    case "CONTRATAR": {
      const info = PERSONAL_INFO[a.tipo];
      const disponibilidad = puedeContratarPersonal(s, a.tipo);
      if (!disponibilidad.ok) return conToast(s, {texto:disponibilidad.mensaje!,presentacion:disponibilidad.presentacion}, "alerta");
      const personalPrevisto = [...s.personal, { id: "prevision-nomina", tipo: a.tipo, nombre: "Previsión" }];
      const proyeccionTrasContratar = proyeccionSemanalRecurrente({ ...s, personal: personalPrevisto });
      if (proyeccionTrasContratar.total < 0 && !a.confirmado) {
        return conToast(s, contenidoMensaje("toast.payrollDeficit",{amount:Math.abs(proyeccionTrasContratar.total)}), "alerta");
      }
      const nombres = ["Héctor Paz", "Miriam Sol", "Justo Lerma", "Carla Benítez", "Tito Aguirre", "Nadia Ríos", "Oscar Vidal", "Pamela Cruz"];
      const nuevo = { id: uid(), tipo: a.tipo as PersonalId, nombre: elegir(nombres) };
      const plantel = a.tipo === "directorTecnico"
        ? s.plantel.map(p => p.enEspera ? p : { ...p, combo: enfoqueRecomendado(p, s) })
        : s.plantel;
      return conToast({ ...s, personal: [...s.personal, nuevo], plantel },
        contenidoMensaje("toast.employeeJoined",{name:nuevo.nombre,employee:a.tipo,amount:info.sueldo}), "ok");
    }
    case "DESPEDIR": {
      const m = s.personal.find(p => p.id === a.id);
      if (!m) return s;
      return conToast(normalizarListaEspera({ ...s, personal: s.personal.filter(p => p.id !== a.id) }),
        contenidoMensaje("toast.fired",{name:m.nombre}), "info");
    }
    case "CARGAR_PARTIDA": {
      const partida = listarPartidas().find(p => p.id === a.id);
      if (!partida) return s;
      const migrado = migrarGuardado(partida.estado);
      const cargado = sanitizarEstado(migrado.estado);
      return conToast({ ...cargado, creado: true }, contenidoMensaje("toast.loaded",{name:partida.nombre}), "ok");
    }
    case "RENOMBRAR_PARTIDA":
      return { ...s, nombrePartida: a.nombre.trim().slice(0, 32) || "Mi carrera" };
    case "RETIRAR_ATLETA": {
      const p = s.plantel.find(x => x.id === a.id);
      if (!p) return s;
      const peleaPendiente = s.pendientes.some(x => x.miId === p.id);
      if (peleaPendiente) return conToast(s, contenidoMensaje("toast.transferPending"), "alerta");
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
          ? contenidoMensaje("toast.exitWaiting",{name:nombre,waiting:promovido.nombre.split(" ")[0]})
          : esLeyenda ? contenidoMensaje("toast.exitHall",{name:nombre}) : contenidoMensaje("toast.exit",{name:nombre}), "info");
    }

    case "ALTERNAR_VELADA": {
      if (!s.cursos.includes("veladas")) return conToast(s, contenidoMensaje("toast.showRequired"), "alerta");
      if (!s.veladaProgramada && s.dia >= 6) return conToast(s, contenidoMensaje("toast.weekendShow"), "info");
      return conToast({ ...s, veladaProgramada: !s.veladaProgramada },
        s.veladaProgramada ? contenidoMensaje("toast.showCancelled") : contenidoMensaje("toast.showTentative"), "info");
    }

    case "PROGRAMAR_SOCIAL": {
      const info = COMUNITARIOS[a.actividad];
      if (s.dia >= 6) return conToast(s, contenidoMensaje("toast.activityDays"), "info");
      if (s.comunitarios.length > 0) return conToast(s, contenidoMensaje("toast.activityBooked"), "info");
      if (s.dinero < info.inversion) return conToast(s, contenidoMensaje("toast.activityFunds",{activity:a.actividad,amount:info.inversion}), "alerta");
      const atraeRecreativo = a.actividad === "claseAbierta" && s.recreativos < 12;
      return conToast({
        ...s,
        dinero: s.dinero - info.inversion,
        recreativos: atraeRecreativo ? s.recreativos + 1 : s.recreativos,
        comunitarios: [{ tipo: a.actividad, nombre: info.nombre }],
      }, contenidoMensaje(atraeRecreativo?"toast.activityRecreation":a.actividad==="claseAbierta"?"toast.activityFull":"toast.activityScheduled",{activity:a.actividad,amount:info.inversion}), "ok");
    }

    case "PEDIR_PRESTAMO": {
      if (s.prestamo && s.prestamo.saldo > 0) return conToast(s, contenidoMensaje("toast.loanActive"), "info");
      if (s.dinero >= 300) return conToast(s, contenidoMensaje("toast.loanThreshold"), "info");
      return conToast({ ...s, dinero: s.dinero + 500, prestamo: { saldo: 600, cuota: 60, semanasRestantes: 10 } }, contenidoMensaje("toast.loanApproved"), "oro");
    }

    case "CERRAR_CLUB": {
      if (s.dinero > -1_500) return conToast(s, contenidoMensaje("toast.closureThreshold"), "info");
      if (!a.confirmado) return conToast(s, contenidoMensaje("toast.closureConfirm"), "alerta");
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
      return conToast(estadoReconstruido, contenidoMensaje("toast.closed"), "oro");
    }

    case "EVENTO": {
      const ev = s.eventos.find(e => e.id === a.id);
      if (!ev) return s;
      if (ev.venceEn <= 0) return conToast(s, contenidoMensaje("toast.eventExpired"), "info");
      const op = ev.opciones[a.opcion];
      if (!op) return s;
      let st: EstadoJuego = { ...s, eventos: s.eventos.filter(e => e.id !== a.id) };
      const acc = op.accion;
      if (acc.tipo === "programarComunitario" && acc.comunitario && acc.monto) {
        if (st.dinero < acc.monto) return conToast(s, contenidoMensaje("toast.organizeFunds",{amount:acc.monto}), "alerta");
        if (st.comunitarios.length > 0) return conToast(s, contenidoMensaje("toast.activityBooked"), "info");
        st.dinero -= acc.monto;
        st.comunitarios = [...st.comunitarios, { tipo: acc.comunitario, nombre: acc.nombre ?? acc.comunitario }];
        st = conToast(st, contenidoMensaje("toast.eventBooked",{name:String(acc.nombre)}), "ok");
      } else if (acc.tipo === "aceptarPatrocinio" && acc.nombre && acc.monto && acc.semanas) {
        st.patrocinio = { nombre: acc.nombre, semanal: acc.monto, semanas: acc.semanas };
        st = conToast(st, contenidoMensaje("toast.sponsorSigned",{name:acc.nombre,amount:acc.monto}), "oro");
      } else if (acc.tipo === "nuevoAlumno") {
        if (st.plantel.length >= limitePlantel(st)) return conToast(s, contenidoMensaje("toast.rosterEventFull"), "alerta");
        const nuevo = genPugilista({ rol: "alumno", joven: true });
        st = { ...st, plantel: incorporarAlumno(st, nuevo) };
        st = conToast(st, contenidoMensaje("toast.newStudent",{name:nuevo.nombre}), "ok");
      } else if (acc.tipo === "exhibicion") {
        const boxeador = st.plantel.find(p => p.rol === "boxeador" && p.energia >= 30 && p.id !== st.combateActivo?.A.p.id);
        if (!boxeador) return conToast(s, contenidoMensaje("toast.noExhibitionBoxer"), "alerta");
        const pago = azar(80, 160);
        st.dinero += pago;
        st.fama = clamp(st.fama + 2, 0, 100);
        st.libroIngresos = linea(st.libroIngresos, contenidoLibro("ledger.exhibition",pago), pago);
        st.plantel = st.plantel.map(p => p.id === boxeador.id ? { ...p, energia: clamp(p.energia - 10, 0, 100) } : p);
        st = conToast(st, contenidoMensaje("toast.exhibition",{name:boxeador.nombre.split(" ")[0],amount:pago}), "ok");
      } else if (acc.tipo === "dinero" && acc.monto) {
        st.dinero += acc.monto;
        st = conToast(st, contenidoMensaje("toast.money",{amount:acc.monto}), "ok");
      } else if (acc.tipo === "fama" && acc.fama) {
        st.fama = clamp(st.fama + acc.fama, 0, 100);
        st = conToast(st, contenidoMensaje("toast.fame",{count:acc.fama}), "ok");
      } else if (acc.tipo === "mantenimiento" && acc.costo) {
        if (st.dinero < acc.costo) return conToast(s, contenidoMensaje("toast.repairFunds",{amount:acc.costo}), "alerta");
        st.dinero -= acc.costo;
        st.libroGastos = linea(st.libroGastos, contenidoLibro("ledger.repair",acc.costo), acc.costo);
        st = conToast(st, contenidoMensaje("toast.maintenancePaid"), "ok");
      } else if (acc.tipo === "entrevista" && acc.fama) {
        st.fama = clamp(st.fama + acc.fama, 0, 100);
        if (acc.monto != null) st.seguidores = Math.max(0, st.seguidores + acc.monto);
        const fame=`${acc.fama>0?"+":"−"}${Math.abs(acc.fama)}`;
        st = conToast(st, contenidoMensaje(acc.monto==null?"toast.interviewFame":"toast.interviewFollowers",acc.monto==null?{fame}:{fame,followers:`${acc.monto>0?"+":acc.monto<0?"−":""}${Math.abs(acc.monto)}`}), acc.fama > 0 ? "oro" : "alerta");
      } else if (acc.tipo === "recaudacion" && acc.costo && acc.monto) {
        if (st.dinero < acc.costo) return conToast(s, contenidoMensaje("toast.collectionFunds",{amount:acc.costo}), "alerta");
        st.dinero += acc.monto - acc.costo;
        st.libroIngresos = linea(st.libroIngresos, contenidoLibro("ledger.collection",acc.monto-acc.costo), acc.monto - acc.costo);
        st = conToast(st, contenidoMensaje("toast.collectionNet",{amount:acc.monto-acc.costo}), "ok");
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
      }, contenidoMensaje(c.dinero ? "toast.adviceMoney" : "toast.adviceFame",c.dinero ? {count:c.fama,amount:c.dinero} : {count:c.fama}), "oro");
    }

    case "SCOUT": {
      if (s.ultimaSemanaScout === s.semana) return conToast(s, contenidoMensaje("toast.scoutUsed"), "info");
      if (s.plantel.length >= limitePlantel(s)) return conToast(s, contenidoMensaje("toast.scoutFull"), "alerta");
      const t = genPugilista({ rol: "alumno", joven: true });
      t.atrib.talento = clamp(t.atrib.talento + azar(4, 12), 0, 97);
      const next = { ...s, ultimaSemanaScout: s.semana, plantel: incorporarAlumno(s, t) };
      const espera = alumnosEnEspera(next).some(p => p.id === t.id);
      return conToast(next,
        contenidoMensaje(espera?"toast.scoutWaiting":"toast.scoutStudent",{name:t.nombre,talent:Math.round(t.atrib.talento),rating:valoracion(t.atrib)}), espera ? "info" : "oro");
    }
    case "TOAST":
      return conToast(s, a.presentacion?{texto:a.texto,presentacion:a.presentacion}:a.texto, a.tono ?? "info");
    case "QUITAR_TOAST":
      return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) };

    case "LEGADO": {
      if (s.fama < 85 && !s.cinturones.some(c => c.nivel === 4)) return conToast(s, contenidoMensaje("toast.legacyRequired"), "alerta");
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
      st = conToast(st, contenidoMensaje("toast.legacyStarted",{name:st.nombreJugador}), "oro");
      return st;
    }
  }
}

function sumaLibro(lineas: LineaLibro[]): number {
  return lineas.reduce((total, linea) => total + linea.monto, 0);
}

function conceptoMovimiento(s: EstadoJuego, a: Accion): string | LineaLibro {
  switch (a.type) {
    case "LICENCIAR": return contenidoLibro("ledger.licence",0,{name:s.plantel.find(p=>p.id===a.id)?.nombre??"Boxeador"});
    case "COMPRAR_EQUIPO": return contenidoLibro("ledger.gear",0,{gear:a.id});
    case "COMPRAR_CURSO": return contenidoLibro("ledger.course",0,{course:a.id});
    case "COMPRAR_PROPIEDAD": return contenidoLibro("ledger.property",0,{property:a.id});
    case "PROGRAMAR_SOCIAL": return contenidoLibro("ledger.activity",0,{activity:a.actividad});
    case "PEDIR_PRESTAMO": return contenidoLibro("ledger.disbursement",0);
    case "RESOLVER_PELEA": {
      const pelea = s.pendientes.find(p => p.id === a.peleaId);
      return `Bolsa de pelea · ${pelea?.rival.nombre ?? "Rival"}`;
    }
    case "RECLAMAR_CONSEJO": {
      const c=s.consejos.find(c=>c.id===a.id),objective=objetivoConsejo(a.id);
      return c&&CONSEJOS_INICIALES.some(template=>template.id===objective&&template.texto===c.texto)
        ?contenidoLibro("ledger.reward",0,{objective:objective!}):`Recompensa · ${c?.texto??"Don Anselmo"}`;
    }
    case "EVENTO": {
      const event=s.eventos.find(e=>e.id===a.id);
      return event&&identidadEventoFiable(event)?contenidoLibro("ledger.event",0,{event:JSON.stringify(event)}):`Evento · ${event?.titulo??"Club"}`;
    }
    case "AVANZAR_DIA": return contenidoLibro(s.dia===5?"ledger.showFallback":"ledger.movement",0);
    default: return contenidoLibro("ledger.movement",0);
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
