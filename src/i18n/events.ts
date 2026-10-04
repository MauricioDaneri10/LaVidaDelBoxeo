import type { EventoJuego } from "../game/types";
import { translate, type CatalogLocale, type MessageKey } from "./catalog";
import { CONTENIDO_COMISION, contenidoProspecto, contenidoExhibicion, contenidoPatrocinio } from "../game/eventContent";
import { fmt } from "../game/engine";
import { formatearNumero } from "./index";

function sameOptions(a:EventoJuego["opciones"],b:EventoJuego["opciones"]) {
  return a.length===b.length && a.every((o,i)=>o.texto===b[i].texto &&
    Object.keys(o.accion).sort().join("|")===Object.keys(b[i].accion).sort().join("|") &&
    Object.entries(o.accion).every(([key,value])=>value===(b[i].accion as unknown as Record<string,unknown>)[key]));
}
/** Exact identity, prose AND actions. No load migration, text-based decisions or RNG. */
export function presentarEvento(event: EventoJuego, locale: CatalogLocale) {
  let id: "reparacion"|"entrevista"|"colecta"|"prospecto"|"desafio"|"patrocinio"|undefined;
  let template:Omit<EventoJuego,"id"|"venceEn">|undefined;
  for(const key of ["reparacion","entrevista","colecta"] as const) {
    const content=CONTENIDO_COMISION[key];
    if(event.tipo===content.tipoEvento) {
      id=key;template={tipo:content.tipoEvento,de:"Comisión del Club",titulo:content.titulo,texto:content.texto,opciones:content.opciones.map(o=>({...o,accion:{...o.accion}}))};
    }
  }
  if(event.tipo==="prospecto") {id="prospecto";template=contenidoProspecto(event.de);}
  if(event.tipo==="desafio") {id="desafio";template=contenidoExhibicion();}
  const action=event.opciones[0]?.accion;
  if(event.tipo==="patrocinio" && action?.tipo==="aceptarPatrocinio" && typeof action.nombre==="string" &&
     Number.isFinite(action.monto) && Number.isInteger(action.semanas)) {
    id="patrocinio";template=contenidoPatrocinio(action.nombre,action.monto!,action.semanas!,fmt(action.monto!));
  }
  if(!id||!template||event.de!==template.de||event.titulo!==template.titulo||event.texto!==template.texto||!sameOptions(event.opciones,template.opciones))
    return {...event,historico:true};
  const t=(key:MessageKey)=>translate(locale,key);
  const text=id==="patrocinio" ? translate(locale,"event.patrocinio.text",{name:action!.nombre!,weekly:locale==="es"?fmt(action!.monto!):`$${formatearNumero(action!.monto!,locale)}`,weeks:action!.semanas!}) : t(`event.${id}.text`);
  return {...event,historico:false,titulo:t(`event.${id}.title`),texto:text,
    de:id==="desafio" ? t("event.source.regional") : ["reparacion","entrevista","colecta"].includes(id) ? t("event.source.club") : event.de,
    opciones:event.opciones.map((o,i)=>({...o,texto:t(`event.${id}.${i}` as MessageKey)}))};
}
