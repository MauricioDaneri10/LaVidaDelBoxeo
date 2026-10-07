import type { Accion, EstadoJuego, GuiaClub } from "./types";

/** Only successful assignments count, never the name of the current combo. */
export function registrarGuia(anterior: EstadoJuego, siguiente: EstadoJuego, accion: Accion): EstadoJuego {
  if (!siguiente.guiaClub || ["NUEVO_JUEGO", "IMPORTAR", "REINICIAR", "CARGAR_PARTIDA", "LEGADO", "CERRAR_CLUB"].includes(accion.type)) return siguiente;
  const guia = siguiente.guiaClub;
  const activos = siguiente.plantel.filter(p => p.rol === "alumno" && !p.enEspera);
  // Approved recovery: only the still-pending step may target current students.
  const iniciales = !guia.enfoques && !guia.alumnosIniciales.some(id => siguiente.plantel.some(p => p.id === id)) && activos.length
    ? activos.map(p => p.id) : guia.alumnosIniciales;
  const confirmados = new Set(guia.enfoquesConfirmados);
  if (accion.type === "CAMBIAR_COMBO" && siguiente.plantel !== anterior.plantel && siguiente.plantel.some(p => p.id === accion.id)) confirmados.add(accion.id);
  if (accion.type === "CONTRATAR" && accion.tipo === "directorTecnico" && siguiente.personal !== anterior.personal) siguiente.plantel.filter(p => !p.enEspera).forEach(p => confirmados.add(p.id));
  if (anterior.personal.some(p => p.tipo === "directorTecnico")) siguiente.plantel.filter(p => !p.enEspera && !anterior.plantel.some(old => old.id === p.id)).forEach(p => confirmados.add(p.id));
  const presentes = iniciales.filter(id => siguiente.plantel.some(p => p.id === id));
  const actualizada: GuiaClub = { ...guia, alumnosIniciales: iniciales, enfoquesConfirmados: Array.from(confirmados),
    enfoques: guia.enfoques || (presentes.length > 0 && presentes.every(id => confirmados.has(id))),
    equipo: guia.equipo || siguiente.equipamiento.length > 0,
    guanteos: guia.guanteos || siguiente.plantel.some(p => p.guanteosRealizados >= 10),
    licencia: guia.licencia || siguiente.plantel.some(p => p.rol === "boxeador" && p.licenciaFederativa),
  };
  return JSON.stringify(actualizada) === JSON.stringify(guia) ? siguiente : { ...siguiente, guiaClub: actualizada };
}
