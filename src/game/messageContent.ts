import {EQUIPOS,CURSOS,PROPIEDADES,PERSONAL_INFO,COMUNITARIOS,TITULOS,OFERTAS_CONTENIDO,CONSEJOS_INICIALES} from "./data";
import {identidadEventoFiable} from "./eventContent";
import type {ResultadoPelea} from "./types";
/** Immutable source-language templates. Presentation metadata is never accounting identity. */
export const TEXTOS_CONTENIDO = {
"toast.bookOrdinary": "Cartelera confirmada: {offer}, bolsa de {amount}.",
"toast.bookTitle": "Cartelera confirmada: Pelea de Título · {title}, bolsa de {amount}.",
"ledger.reward": "Recompensa · {objective}",
"ledger.showFallback": "Velada del sábado · neto",
"ledger.movement": "Movimiento del club",
"ledger.event": "Evento · {event}",
"toast.sparGym": "Guanteo (sparring) del sábado en el gimnasio: {count} sesiones.",
"toast.sparClub": "Guanteo (sparring) del sábado con el {club}: {count} sesiones.",
"toast.sparNeighborhood": "Guanteo (sparring) del sábado en una exhibición de barrio: {count} sesiones.",
"toast.staffFunction": "Nuevas contrataciones no disponibles: falta definir una función diferenciada para este puesto. Los coordinadores existentes conservan su contrato.",
"toast.staffCovered": "Ese puesto ya está cubierto.",
"toast.staffNoBranch": "Este puesto requiere una sucursal.",
"toast.staffAdminFull": "El cupo administrativo de las sucursales está cubierto por gerentes y coordinadores existentes.",
"toast.staffCoachFull": "El cupo de entrenadores locales de las sucursales está cubierto.",
"toast.staffWeek": "{employee} se habilita a partir de la semana {week}.",
"toast.staffFame": "{employee} requiere {fame} de fama.",
"toast.staffCourse": "Necesitás el curso {course}.",
"toast.importKnown": "No se importó la partida: {reason}",
"toast.importTechnical": "No se importó la partida. Detalle técnico original: {details}",
"save.error.format": "Formato de guardado inválido.",
"save.error.envelopeFormat": "Formato incompatible: no se sobrescribió la partida.",
"save.error.future": "Versión incompatible: original protegido.",
"save.error.checksum": "Escritura incompleta: checksum incorrecto.",
"save.error.envelopeMismatch": "Envelope y partida no coinciden.",
"save.error.gameVersion": "Versión de juego incompatible.",
"save.error.schema": "Schema incompatible: original protegido.",
"save.error.guide": "Progreso de la guía dañado: original protegido; recuperá ese registro antes de guardar.",
"save.error.accounting": "Identidad contable dañada: original protegido; recuperá ese registro antes de guardar.",
"save.error.claim": "Evidencia de cobro de un hito dañada: original protegido; se necesita recuperar ese registro antes de habilitar nuevos pagos.",
"save.error.presentation": "Metadata de presentación dañada: original protegido.",
"save.error.reservedContract": "Metadata anterior con nombre reservado: Original protegido; se necesita recuperar la extensión antes de migrar.",
"save.error.reservedGuide": "Metadata anterior con nombre reservado: original protegido; recuperá la extensión antes de migrar.",
"save.error.reservedAccounting": "Identidad contable reservada en datos antiguos: original protegido.",
"save.error.reservedPresentation": "Metadata de presentación reservada en datos antiguos: original protegido.",
"save.error.checkpointDamaged": "Checkpoint de combate dañado: original protegido.",
"save.error.state": "Estado inválido.",
"save.error.checkpointIncompatible": "Checkpoint de combate incompatible: original protegido.",
"save.error.writeUnconfirmed": "El almacenamiento no confirmó la escritura.",
"save.error.journal": "Journal corrupto: se protegieron las partidas y no se escribió nada.",
"save.error.unrecognizable": "No contiene una partida reconocible.",
"save.error.recoveryConflict": "Conflicto en la copia de recuperación. Original protegido.",
"save.error.slotsIndex": "Índice de ranuras corrupto. No se reemplazó.",
"save.error.slot": "Ranura inválida.",
"save.error.slotIdentity": "Identidad de ranura incoherente.",
"save.error.slotsConflict": "Ranuras con identidad conflictiva: original protegido.",
"save.error.loadBlocked": "Carga fallida: original protegido. No se habilita el autosave de una carrera vacía.",
"save.error.denied": "Almacenamiento denegado: la sesión está solo en memoria y se perderá al cerrar.",
"save.error.noBackup": "Original dañado y sin respaldo: no se sobrescribió.",
"save.error.wrongCareer": "La recuperación no corresponde a esta carrera.",
"save.error.identity": "La carrera necesita identidad estable.",
"save.error.slotsFull": "Las cinco ranuras están ocupadas. Eliminá explícitamente una desde el inicio; no se borró ninguna.",
"save.error.nonDurable": "Almacenamiento no persistente.",
"save.error.duplicate": "{path}[{index}]: ID conflictivo; se necesita decidir qué identidad recuperar. Original protegido.",
"save.error.proRecord": "{path}: trayectoria profesional incompleta; no es posible inferir la división del récord. Original protegido.",
"save.error.fields": "Estado inválido ({count} campos): {details}. Se conservaron los datos anteriores.",
"save.failedKnown": "No se guardó la partida: {reason}",
"save.failedTechnical": "No se guardó la partida. Detalle técnico original: {details}",
"save.recovered": "Partida recuperada/migrada; el original se conservará antes de guardar.",
"save.backupRecovered": "Se recuperó el respaldo. El original dañado se conservará al guardar.",
"save.success": "Partida guardada y escritura verificada.",
  "ledger.estimated": "Dividendos estimados: {activity}",
  "press.win": "{medium} celebra: \"{summary}\" en la noche del sábado.",
  "press.loss": "{medium}: \"Noche dura para el rincón local: {summary}.\"",
  "result.ko": "{method} en el asalto {round}",
  "result.cards": "{method} ({scores})",
  "toast.proRole": "Solo un boxeador federado puede pasar al profesionalismo.",
  "toast.alreadyPro": "Este boxeador ya es profesional.",
  "toast.proExperience": "Necesita completar 50 peleas amateurs antes de decidir el pase.",
  "toast.proPending": "Resolvé o bajá su pelea agendada antes de cambiarlo de circuito.",
  "toast.proFull": "El cupo profesional está completo (10). Liberá una plaza antes de aceptar el pase.",
  "toast.matchRole": "Solo un boxeador federado puede pactar peleas.",
  "toast.matchLicence": "Primero tramitá la licencia del boxeador.",
  "toast.matchPending": "Ya tiene pelea agendada para el sábado.",
  "toast.matchEnergy": "Este boxeador necesita recuperar al menos 70% de energía.",
  "toast.matchInjury": "No puede pactar mientras tenga una lesión activa.",
  "toast.matchEnergyBefore": "Este boxeador necesita recuperar al menos 70% de energía antes de pactar una pelea.",
  "toast.saved": "Partida guardada correctamente.",
  "toast.scoutWaiting": "Talento encontrado: {name} (talento {talent}, valoración {rating}) quedó en lista de espera.",
  "toast.scoutStudent": "Nuevo alumno: {name} (talento {talent}, valoración {rating}) se sumó a tus clases.",
  "toast.interviewFame": "La entrevista tuvo este impacto: {fame} fama.",
  "toast.interviewFollowers": "La entrevista tuvo este impacto: {fame} fama y {followers} seguidores.",
  "press.show": "{medium}: \"{club} llenó su velada del sábado y la ciudad lo aplaude.\"",
  "press.champion": "{medium}: \"¡Nuevo campeón! {name} conquista el {title}.\"",
  "toast.belt": "¡{belt} para {name}! Ya cuelga en la pared del gimnasio.",
  "toast.victory": "Victoria: {method}. Bolsa de {amount}.",
  "toast.draw": "Empate: {method}. La esquina aprende y sigue.",
  "toast.defeat": "Derrota: {method}. La esquina aprende y sigue.",
  "toast.gearFunds": "Te faltan {amount} para {gear}.",
  "toast.gearInstalled": "{gear} instalado: {effect}.",
  "toast.courseRequired": "Requiere el curso previo: {course}.",
  "toast.courseBought": "Aprobaste \"{course}\". Nuevas puertas se abren.",
  "toast.propertyBought": "{property}: escritura firmada.",
  "toast.employeeJoined": "{name} se suma como {employee} ({amount}/sem).",
  "toast.activityFunds": "Necesitás {amount} para organizar {activity}.",
  "toast.activityScheduled": "{activity} agendado para el domingo. Se invirtieron {amount}.",
  "toast.activityRecreation": "{activity} agendado para el domingo. Se invirtieron {amount}; se suma 1 alumno recreativo esta semana.",
  "toast.activityFull": "{activity} agendado para el domingo. Se invirtieron {amount}; el cupo recreativo ya está completo.",
  "ledger.gear": "Compra · {gear}",
  "ledger.course": "Curso · {course}",
  "ledger.property": "Compra · {property}",
  "ledger.activity": "Inversión · {activity}",
  "ledger.licence": "Licencia Amateur · {name}",
  "ledger.disbursement": "Desembolso del préstamo",
  "ledger.show": "Entradas de la velada del sábado",
  "ledger.exhibition": "Exhibición benéfica",
  "ledger.repair": "Reparación del gimnasio",
  "ledger.collection": "Colecta solidaria del barrio",
  "ledger.dividends": "Dividendos: {name}",
  "ledger.activityDividends": "Dividendos: {activity}",
  "ledger.bingoStudent": "El bingo trajo a {name} al gimnasio",
  "ledger.purse": "Bolsa vs {name} ({method})",
  "toast.wordOfMouth": "Boca a boca: {name} se suma a las clases.",
  "toast.branchTalent": "La sucursal descubrió a {name}, un talento del barrio.",
  "toast.representativeBooked": "Tu Representante agendó a {name} vs {rival}.",
  "toast.readyLicense": "{name} ya puede tramitar su Licencia Federativa.",
  "toast.showNet": "La velada dejó {amount} netos de entradas.",
  "toast.overdraftCost": "La caja está en negativo: se suma un costo financiero de {amount}.",
  "toast.welcome": "Bienvenido a {name}. El barrio espera.",
  "toast.missingSpars": "Le faltan guanteos reales ({count}/10).",
  "toast.licensed": "{name} ya tiene su Licencia Amateur y es boxeador federado. ¡Bono de Madurez activo en su debut!",
  "toast.professional": "{name} acepta el pase profesional. Su récord e historial amateur se conservan.",
  "toast.brandBorn": "Nace la marca \"{name}\". Cada domingo se liquida la venta de indumentaria.",
  "toast.coursePrice": "El curso cuesta {amount}.",
  "toast.funds": "Necesitás {amount}.",
  "toast.payrollDeficit": "La nómina dejaría un déficit recurrente de {amount}/semana. Revisá la previsión y confirmá la contratación si querés asumirlo.",
  "toast.fired": "{name} deja el club en buenos términos.",
  "toast.loaded": "Partida cargada: {name}.",
  "toast.exitWaiting": "{name} deja el club. Se liberó una plaza: {waiting} sale de la lista de espera.",
  "toast.exitHall": "{name} se retira y entra al Salón de la Fama del club.",
  "toast.exit": "{name} deja el club y la plaza queda disponible.",
  "toast.showCancelled": "Velada cancelada. El público lo entenderá.",
  "toast.showTentative": "Velada tentativa para el sábado: requiere al menos un combate válido; si no lo hay, se cancela sin cargo.",
  "toast.organizeFunds": "Necesitás {amount} para organizarlo.",
  "toast.eventBooked": "{name} anotado para el domingo.",
  "toast.sponsorSigned": "Contrato firmado con {name}: {amount}/semana.",
  "toast.newStudent": "{name} entra al plantel de alumnos.",
  "toast.exhibition": "{name} brilló en la exhibición: {amount} y +2 de fama.",
  "toast.money": "+{amount}",
  "toast.fame": "+{count} de fama en el barrio.",
  "toast.repairFunds": "Necesitás {amount} para reparar el gimnasio.",
  "toast.collectionFunds": "Necesitás {amount} para organizar la colecta.",
  "toast.collectionNet": "La colecta dejó {amount} netos.",
  "toast.adviceMoney": "Don Anselmo asiente: +{count} de fama y {amount}. Hito único cobrado.",
  "toast.adviceFame": "Don Anselmo asiente: +{count} de fama. Hito único cobrado.",
  "toast.legacyStarted": "Legado iniciado: ahora sos {name}, con prestigio, contactos y capital heredado.",
  "toast.fightCancelled": "La pelea se bajó de la cartelera. La federación lo entiende.",
  "toast.cooldown": "Debe recuperarse de su última pelea. Disponible desde la semana {count}.",
  "toast.pendingFights": "Hay peleas pendientes: resolvelas o cancelalas antes de avanzar.",
  "toast.training": "Semana de entrenamiento en marcha.",
  "toast.sparUnavailable": "El guanteo del sábado necesita al menos dos pugilistas disponibles con energía. Revisá el plantel y la recuperación.",
  "toast.emptyShow": "Velada cancelada: no hay combates válidos. No se cobraron entradas ni gastos de organización.",
  "toast.loanPaid": "Préstamo cancelado: la caja vuelve a ser completamente tuya.",
  "toast.adviceReady": "Don Anselmo tiene un consejo listo para cobrar.",
  "toast.activePreparation": "Terminá o cancelá el combate en curso antes de cambiar su preparación.",
  "toast.imported": "Partida importada correctamente.",
  "toast.nextWeek": "Resolvé o cancelá las peleas pendientes antes de abrir otra semana.",
  "toast.coachLicense": "Primero necesitás la Licencia de Entrenador del club.",
  "toast.waiting": "Está en lista de espera: primero liberá una plaza del gimnasio.",
  "toast.alreadyLicensed": "Este boxeador ya tiene su licencia.",
  "toast.licensePrice": "La Licencia Federativa cuesta $200.",
  "toast.amateurFull": "El cupo amateur está completo (10). Transferí o promoví a un boxeador antes de emitir otra licencia.",
  "toast.eliteRequired": "Primero construí la Zona Élite.",
  "toast.eliteFull": "La Zona Élite tiene 3 cupos como máximo.",
  "toast.oldOffer": "Esta oferta antigua no es válida. Volvé a buscar rival para generar ofertas nuevas sin costo; tu cartelera confirmada se conserva.",
  "toast.invalidResult": "No se aplicó el resultado: revisá identidad, fecha y disponibilidad del combate.",
  "toast.installed": "Ya lo tenés instalado.",
  "toast.performanceRequired": "Requiere el curso de Alto Rendimiento.",
  "toast.brandStudio": "Primero montá el Estudio de Marca de Ropa.",
  "toast.ownedProperty": "Esa propiedad ya es tuya.",
  "toast.landRequired": "Primero comprá un terreno.",
  "toast.arenaRequired": "La Arena Central exige contrato de Televisión Estelar.",
  "toast.clubsRequired": "Requiere el curso de Gestión de Clubes.",
  "toast.transferPending": "No se puede transferir ni retirar a un boxeador con una pelea pendiente. Cancelá la cartelera primero.",
  "toast.showRequired": "Requiere el curso de Organización de Veladas.",
  "toast.weekendShow": "Ya es fin de semana: agendala el lunes.",
  "toast.activityDays": "Las actividades se agendan de lunes a viernes para el próximo domingo.",
  "toast.activityBooked": "Ya hay una actividad social agendada para esta semana.",
  "toast.loanActive": "Ya tenés un préstamo activo. Primero terminá de pagarlo.",
  "toast.loanThreshold": "El préstamo de emergencia solo está disponible cuando la caja baja de $300.",
  "toast.loanApproved": "Préstamo de emergencia aprobado: recibís $500 y devolvés $600 en 10 cuotas.",
  "toast.closureThreshold": "El cierre por insolvencia solo está disponible con una deuda de $1.500 o más.",
  "toast.closureConfirm": "Revisá la confirmación: cerrar el club elimina sus activos y su plantel.",
  "toast.closed": "El club cerró por insolvencia. Récord e hitos históricos conservados; la reconstrucción comienza sin deuda ni activos anteriores.",
  "toast.eventExpired": "Este evento ya venció.",
  "toast.rosterEventFull": "El plantel está completo: liberá un cupo o ampliá el gimnasio para recibirlo.",
  "toast.noExhibitionBoxer": "No hay un boxeador disponible para la exhibición.",
  "toast.maintenancePaid": "Mantenimiento preventivo pagado.",
  "toast.scoutUsed": "El buscador de talentos ya se usó esta semana. Podés volver a buscar el próximo lunes.",
  "toast.scoutFull": "El plantel está completo. Liberá un cupo o mejorá el gimnasio para recibir más alumnos.",
  "toast.legacyRequired": "El legado requiere un título mundial o 85 de fama.",
  "ledger.students": "Cuotas de alumnos ({count} × ${fee})",
  "ledger.recreation": "Cuotas recreativas ({count} × $10)",
  "ledger.competitors": "Aporte del plantel federado ({count} × $12)",
  "ledger.opening": "Subsidio de apertura del club",
  "ledger.branches": "Ingresos pasivos de sucursales ({count})",
  "ledger.unmanaged": "Sucursales sin gerente (sin ingresos)",
  "ledger.brand": "Ventas de la marca \"{name}\"",
  "ledger.sponsor": "Patrocinio de {name}",
  "ledger.rent": "Alquiler del local",
  "ledger.salaries": "Sueldos del personal ({count})",
  "ledger.overdraft": "Costo financiero por caja negativa",
  "ledger.loan": "Cuota del préstamo ({count} restantes)",
} as const;
export type ContenidoId = keyof typeof TEXTOS_CONTENIDO;
export interface PresentacionContenido { id:string; parametros:Record<string,string|number>; }

/** References are stored as IDs; unrelated player names are always literal. */
export function parametroContenido(key:string,value:string|number):string {
  if(key==="offer") {
    if(typeof value!=="string"||!Object.prototype.hasOwnProperty.call(OFERTAS_CONTENIDO,value))throw new Error("Unknown offer reference");
    return OFERTAS_CONTENIDO[value as keyof typeof OFERTAS_CONTENIDO].etiqueta;
  }
  if(key==="objective") {
    const consejo=CONSEJOS_INICIALES.find(c=>c.id===value);
    if(!consejo)throw new Error("Unknown advice reference");
    return consejo.texto;
  }
  if(key==="event") {
    const event=JSON.parse(String(value));
    if(!identidadEventoFiable(event))throw new Error("Unknown event reference");
    return event.titulo;
  }
  if(key==="reason") {
    if(typeof value!=="string")throw new Error("Unknown save error reference");
    const meta=JSON.parse(value) as PresentacionContenido;
    if(!Object.prototype.hasOwnProperty.call(TEXTOS_CONTENIDO,meta.id)||!meta.id.startsWith("save.error."))throw new Error("Unknown save error reference");
    return textoContenido(meta.id as ContenidoId,meta.parametros);
  }
  if(key==="summary") {
    if(typeof value!=="string")throw new Error("Unknown result reference");
    const meta=JSON.parse(value) as PresentacionContenido;
    if(meta.id!=="result.ko"&&meta.id!=="result.cards")throw new Error("Unknown result reference");
    return textoContenido(meta.id,meta.parametros);
  }
  if(key==="title"||key==="belt") {
    if(typeof value!=="number"||!Number.isInteger(value)||value<1||value>4)throw new Error("Unknown title reference");
    return key==="title"?TITULOS[value as 1|2|3|4].nombre:TITULOS[value as 1|2|3|4].cinturon;
  }
  const sources:Record<string,Record<string,{nombre:string;efecto?:string}>>={gear:EQUIPOS,effect:EQUIPOS,course:CURSOS,property:PROPIEDADES,employee:PERSONAL_INFO,activity:COMUNITARIOS};
  const source=sources[key];
  if(source) {
    if(typeof value!=="string"||!Object.prototype.hasOwnProperty.call(source,value))throw new Error("Unknown content reference");
    return key==="effect"?source[value].efecto!:source[value].nombre;
  }
  return key==="amount"&&typeof value==="number"?"$"+Math.round(value).toLocaleString("es-AR"):String(value);
}

/** Exact parameters only; braces/$ in a name are literal, never recursively expanded. */
export function textoContenido(id:ContenidoId,parametros:PresentacionContenido["parametros"]={}):string {
  const template=TEXTOS_CONTENIDO[id];
  const slots=[...new Set(template.match(/\{\w+\}/g)??[])].map(s=>s.slice(1,-1)).sort();
  if(Object.keys(parametros).sort().join("|")!==slots.join("|") || Object.values(parametros).some(v=>typeof v!=="string" && (typeof v!=="number"||!Number.isFinite(v))))
    throw new Error("Invalid content parameters");
  return template.replace(/\{(\w+)\}/g,(_,key:string)=>parametroContenido(key,parametros[key]));
}
export function contenidoLibro(id:ContenidoId,monto:number,parametros:PresentacionContenido["parametros"]={}) {
  return {concepto:textoContenido(id,parametros),monto,presentacion:{id,parametros:{...parametros}}};
}
export function contenidoMensaje(id:ContenidoId,parametros:PresentacionContenido["parametros"]={}) {
  return {texto:textoContenido(id,parametros),presentacion:{id,parametros:{...parametros}}};
}

/** Legacy/unknown result summaries remain literal; no parsing a round from prose. */
export function metadataResultadoFiable(result:ResultadoPelea) {
  const meta=result.presentacion;
  if(!meta||meta.parametros.method!==result.metodo)return false;
  try {
    const coherent=meta.id==="result.cards"?meta.parametros.scores===result.tarjetas.map(card=>`${card.a}-${card.b}`).join(", "):
      meta.id==="result.ko"&&typeof meta.parametros.round==="number"&&Number.isInteger(meta.parametros.round)&&meta.parametros.round>=1&&meta.parametros.round<=12;
    return coherent&&textoContenido(meta.id as ContenidoId,meta.parametros)===result.resumen;
  } catch {return false;}
}
export function contenidoPrensaResultado(result:ResultadoPelea,medium:string) {
  const texto=result.gane?`${medium} celebra: "${result.resumen}" en la noche del sábado.`:`${medium}: "Noche dura para el rincón local: ${result.resumen}."`;
  try {
    const meta=result.presentacion;
    if(meta&&metadataResultadoFiable(result))
      return contenidoMensaje(result.gane?"press.win":"press.loss",{medium,summary:JSON.stringify(meta)});
  } catch { /* Unknown valid history is never repaired or rewritten. */ }
  return {texto};
}
