import type { EventoJuego } from "../game/types";
import { translate, type CatalogLocale, type MessageKey } from "./catalog";
import { identidadEventoFiable } from "../game/eventContent";
import { formatearDineroJuego } from "./index";

export function presentarEvento(event:EventoJuego,locale:CatalogLocale) {
  const id=identidadEventoFiable(event);
  if(!id)return {...event,historico:true};
  const action=event.opciones[0]?.accion;
  const t=(key:MessageKey)=>translate(locale,key);
  const text=id==="patrocinio" ? translate(locale,"event.patrocinio.text",{name:action!.nombre!,weekly:formatearDineroJuego(action!.monto!,locale),weeks:action!.semanas!}) : t(`event.${id}.text`);
  return {...event,historico:false,titulo:t(`event.${id}.title`),texto:text,
    de:id==="desafio" ? t("event.source.regional") : ["reparacion","entrevista","colecta"].includes(id) ? t("event.source.club") : event.de,
    opciones:event.opciones.map((o,i)=>({...o,texto:t(`event.${id}.${i}` as MessageKey)}))};
}
