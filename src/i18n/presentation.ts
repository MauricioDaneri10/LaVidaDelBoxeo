import { CATEGORIAS, COMUNITARIOS, CURSOS, EQUIPOS, LOGOS_DISPONIBLES, OFERTAS_CONTENIDO, PERSONAL_INFO, PROPIEDADES, RASGOS, TITULOS, DIVISIONES } from "../game/data";
import type { CategoriaMercado, CursoId, GearId, PersonalId, PropiedadId, TipoComunitario } from "../game/types";
import { translate, type CatalogLocale, type MessageKey } from "./catalog";
import { estadoRecord, puedeContratarPersonal } from "../game/engine";
import type { EstadoJuego, OfertaRival, Pugilista, ResultadoPelea } from "../game/types";
import { presentarContenido } from "./content";
import { metadataResultadoFiable } from "../game/messageContent";

export function presentarOferta(offer: OfertaRival, locale: CatalogLocale) {
  const original=OFERTAS_CONTENIDO[offer.nivel];
  if(offer.esTitulo===0 && original && offer.etiqueta===original.etiqueta && offer.detalle===original.detalle)
    return {etiqueta:translate(locale,`offer.${offer.nivel}.label`),detalle:translate(locale,`offer.${offer.nivel}.detail`),historico:false};
  if(offer.esTitulo>0) {
    const level=offer.esTitulo as 1|2|3|4;
    const title=TITULOS[level];
    if(offer.etiqueta===`Pelea de Título · ${title.nombre}` && offer.detalle===`${title.cinturon} en juego. Requisitos: ${title.req}.`) {
      const localized=presentarTitulo(level,locale);
      return {etiqueta:translate(locale,"offer.titleLabel",{title:localized.nombre}),detalle:translate(locale,"offer.titleDetails",{belt:localized.cinturon,requirements:localized.req}),historico:false};
    }
  }
  return {etiqueta:offer.etiqueta,detalle:offer.detalle,historico:true};
}

/** Presentation of the existing reducer guard, including departed champions. */
export function legadoDisponible(state: EstadoJuego) {
  return state.fama >= 85 || state.cinturones.some(c => c.nivel === 4);
}
export function presentarTitulo(level: 1 | 2 | 3 | 4, locale: CatalogLocale) {
  return { ...TITULOS[level], nombre: translate(locale, `title.${level}.name`), cinturon: translate(locale, `title.${level}.belt`), req: translate(locale, `title.${level}.requirement`) };
}
const traitIds=["mandibula","hijo","tren","gacela","reloj","espejo","volcan","maraton","diamante","sereno"] as const;
export function presentarRasgo(id: string | undefined, locale: CatalogLocale) {
  const known=traitIds.find(key=>key===id);
  const original=RASGOS.find(r=>r.id===id);
  return known && original ? {...original,nombre:translate(locale,`trait.${known}.name`),desc:translate(locale,`trait.${known}.desc`)} : original;
}
export function presentarDivision(value: string, locale: CatalogLocale) {
  const index=DIVISIONES.indexOf(value);
  // Exact canonical identity only; unknown historical values remain literal.
  return index<0 ? value : translate(locale, `division.${index as 0|1|2|3|4|5|6|7}`);
}
export function presentarEstadoRecord(boxer: Pugilista, locale: CatalogLocale) {
  const record=estadoRecord(boxer);
  const keys: Record<string, MessageKey>={"En formación":"record.training","Récord negativo · carrera en riesgo":"record.negative","Estrella de nocaut":"record.knockout","Récord positivo":"record.positive","Récord equilibrado":"record.balanced"};
  const key=keys[record.etiqueta];
  return {...record,etiqueta:key ? translate(locale,key) : record.etiqueta};
}
/** Only for a result freshly emitted from a known fight checkpoint, never raw history. */
const methodKeys: Record<ResultadoPelea["metodo"], MessageKey>={"Nocaut":"method.ko","Nocaut Técnico":"method.tko","Empate":"method.draw","Decisión Unánime":"method.unanimous","Decisión Mayoritaria":"method.majority","Decisión Dividida":"method.split"};
export function presentarResultadoActual(result: ResultadoPelea, round: number, ko: boolean, locale: CatalogLocale) {
  const method=translate(locale,methodKeys[result.metodo]);
  return { method, summary: ko ? translate(locale,"fight.summaryKO",{method,round}) : translate(locale,"fight.summaryCards",{method,scores:result.tarjetas.map(card=>`${card.a}-${card.b}`).join(", ")}) };
}

export function presentarResultadoHistorico(result:ResultadoPelea,locale:CatalogLocale) {
  const meta=result.presentacion;
  const reliable=metadataResultadoFiable(result);
  const lectura=presentarContenido(result.resumen,reliable?meta:undefined,locale);
  return {method:lectura.historico?result.metodo:translate(locale,methodKeys[result.metodo]),summary:lectura.texto,historico:lectura.historico};
}

const logoKeys = {
  guante: ["logo.guante", "logo.guante.motto"], leon: ["logo.leon", "logo.leon.motto"],
  aguila: ["logo.aguila", "logo.aguila.motto"], corona: ["logo.corona", "logo.corona.motto"],
  rayo: ["logo.rayo", "logo.rayo.motto"], lobo: ["logo.lobo", "logo.lobo.motto"],
} as const;
const dayKeys = ["day.1", "day.2", "day.3", "day.4", "day.5", "day.6", "day.7"] as const;
const monthKeys = ["month.0", "month.1", "month.2", "month.3", "month.4", "month.5", "month.6", "month.7", "month.8", "month.9", "month.10", "month.11"] as const;

export function presentarEmblema(logo: typeof LOGOS_DISPONIBLES[number], locale: CatalogLocale) {
  const keys = logoKeys[logo.id as keyof typeof logoKeys];
  return keys ? { nombre: translate(locale, keys[0]), lema: translate(locale, keys[1]) } : logo;
}
export function nombreDia(day: number, locale: CatalogLocale) { return translate(locale, dayKeys[day]); }
export function nombreMes(month: number, locale: CatalogLocale) { return translate(locale, monthKeys[month]); }
export function presentarEquipo(id: GearId, locale: CatalogLocale) {
  return { ...EQUIPOS[id], nombre: translate(locale, `gear.${id}.name`), desc: translate(locale, `gear.${id}.desc`), efecto: translate(locale, `gear.${id}.effect`) };
}
export function presentarCurso(id: CursoId, locale: CatalogLocale) {
  return { ...CURSOS[id], nombre: translate(locale, `course.${id}.name`), desc: translate(locale, `course.${id}.desc`) };
}
export function presentarPersonal(id: PersonalId, locale: CatalogLocale) {
  return { ...PERSONAL_INFO[id], nombre: translate(locale, `employee.${id}.name`), desc: translate(locale, `employee.${id}.desc`) };
}
export function presentarPropiedad(id: PropiedadId, locale: CatalogLocale) {
  const districtKeys={"Sur (Barrio Tradicional)":"district.south","Centro Urbano":"district.centre","Norte (Lomas)":"district.north"} as const;
  const district=PROPIEDADES[id].distrito;
  const districtKey=districtKeys[district as keyof typeof districtKeys];
  return { ...PROPIEDADES[id], nombre: translate(locale, `property.${id}.name`), desc: translate(locale, `property.${id}.desc`), beneficio: translate(locale, `property.${id}.benefit`), distrito: districtKey ? translate(locale,districtKey) : district };
}
export function presentarActividad(id: TipoComunitario, locale: CatalogLocale) {
  return { ...COMUNITARIOS[id], nombre: translate(locale, `social.${id}.name`), extra: translate(locale, `social.${id}.extra`) };
}
export function presentarCategoria(id: CategoriaMercado, locale: CatalogLocale) {
  const i = ({ equipamiento: 0, indumentaria: 1, instalaciones: 2, difusion: 3 } as const)[id];
  return { ...CATEGORIAS[i], nombre: translate(locale, `category.${i}.name`), desc: translate(locale, `category.${i}.desc`) };
}
export function disponibilidadPersonal(state: EstadoJuego, id: PersonalId, locale: CatalogLocale) {
  const availability = puedeContratarPersonal(state, id);
  const req = PERSONAL_INFO[id].requisito;
  const role = presentarPersonal(id, locale).nombre;
  switch (availability.motivo) {
    case "funcionPendiente": return translate(locale, "staff.suspended");
    case "cubierto": return translate(locale, "staff.covered");
    case "sinSucursales": return translate(locale, "staff.noBranches");
    case "cupoAdministrativo": return translate(locale, "staff.adminFull");
    case "cupoEntrenador": return translate(locale, "staff.coachesFull");
    case "semana": return translate(locale, "staff.availableWeek", { role, week: req!.semana! });
    case "fama": return translate(locale, "staff.needsFame", { role, fame: req!.fama! });
    case "curso": return translate(locale, "staff.needsCourse", { course: presentarCurso(req!.curso!, locale).nombre });
    default: return availability.ok ? translate(locale, "staff.available") : availability.mensaje!;
  }
}
