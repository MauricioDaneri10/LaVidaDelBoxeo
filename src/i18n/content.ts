import { TEXTOS_CONTENIDO,textoContenido,type ContenidoId,type PresentacionContenido } from "../game/messageContent";
import { translate,type MessageKey,type Arguments,type CatalogLocale } from "./catalog";
import {identidadEventoFiable} from "../game/eventContent";

/** Only generated identity + exact canonical prose/parameters proves a template. */
export function presentarContenido(original:string,metadata:PresentacionContenido|undefined,locale:CatalogLocale):{texto:string;historico:boolean} {
  if(!metadata||!Object.prototype.hasOwnProperty.call(TEXTOS_CONTENIDO,metadata.id))return {texto:original,historico:true};
  try {
    if(textoContenido(metadata.id as ContenidoId,metadata.parametros)!==original)return {texto:original,historico:true};
  } catch {return {texto:original,historico:true};}
  const key=`content.${metadata.id}` as MessageKey;
  const parametros={...metadata.parametros};
  if(typeof parametros.amount==="number")parametros.amount="$"+Math.round(parametros.amount).toLocaleString(locale==="es"?"es-AR":locale==="en"?"en-US":"pt-BR");
  const references:Record<string,string>={gear:"gear",effect:"gear",course:"course",property:"property",employee:"employee",activity:"social"};
  for(const slot of Object.keys(parametros)) {
    if(slot==="summary"||slot==="reason") {
      const meta=JSON.parse(String(parametros[slot])) as PresentacionContenido;
      const nested=presentarContenido(textoContenido(meta.id as ContenidoId,meta.parametros),meta,locale);
      if(nested.historico)return {texto:original,historico:true};
      parametros[slot]=nested.texto;
    }
    if(slot==="title"||slot==="belt")parametros[slot]=translate(locale,`title.${parametros[slot]}.${slot==="title"?"name":"belt"}` as MessageKey);
    if(slot==="offer")parametros[slot]=translate(locale,`offer.${parametros[slot]}.label` as MessageKey);
    if(slot==="objective")parametros[slot]=translate(locale,`advice.objective.${parametros[slot]}` as MessageKey);
    if(slot==="event")parametros[slot]=translate(locale,`event.${identidadEventoFiable(JSON.parse(String(parametros[slot])))}.title` as MessageKey);
    if(references[slot])parametros[slot]=translate(locale,`${references[slot]}.${parametros[slot]}.${slot==="effect"?"effect":"name"}` as MessageKey);
    if(slot==="method") {
      const methods:Record<string,MessageKey>={"Nocaut":"method.ko","Nocaut Técnico":"method.tko","Empate":"method.draw","Decisión Unánime":"method.unanimous","Decisión Mayoritaria":"method.majority","Decisión Dividida":"method.split"};
      if(!Object.prototype.hasOwnProperty.call(methods,parametros[slot]))return {texto:original,historico:true};
      parametros[slot]=translate(locale,methods[parametros[slot]]);
    }
  }
  return {texto:translate(locale,key,...[parametros] as unknown as Arguments<typeof key>),historico:false};
}
