import type { EventoJuego } from "./types";
function sameOptions(a:EventoJuego["opciones"],b:EventoJuego["opciones"]) {
  return a.length===b.length && a.every((o,i)=>o.texto===b[i].texto &&
    Object.keys(o.accion).sort().join("|")===Object.keys(b[i].accion).sort().join("|") &&
    Object.entries(o.accion).every(([key,value])=>value===(b[i].accion as unknown as Record<string,unknown>)[key]));
}
/** Reliable presentation identity only; never a command, RNG source or migration. */
export function identidadEventoFiable(event:EventoJuego) {
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
    id="patrocinio";template=contenidoPatrocinio(action.nombre,action.monto!,action.semanas!,"$"+Math.round(action.monto!).toLocaleString("es-AR"));
  }
  if(!id||!template||event.de!==template.de||event.titulo!==template.titulo||event.texto!==template.texto||!sameOptions(event.opciones,template.opciones))
    return null;
  return id;
}


/** Original content only. No RNG, payment or game decisions. */
export const CONTENIDO_COMISION = {
      reparacion: { titulo: "Revisión del saco de entrenamiento", texto: "La comisión detectó desgaste y propone una reparación preventiva. Podés asumir el costo ahora o posponerlo; esperar no cambia el entrenamiento.", tipoEvento: "mantenimiento" as const, opciones: [{ texto: "Reparar por $120", accion: { tipo: "mantenimiento" as const, costo: 120 } }, { texto: "Posponer el gasto", accion: { tipo: "nada" as const } }] },
      entrevista: { titulo: "Entrevista en Radio Guante", texto: "La prensa quiere conocer tu proyecto. Elegí cómo responder: una declaración puede mejorar o perjudicar la imagen del club.", tipoEvento: "entrevista" as const, opciones: [{ texto: "Hablar del proyecto · +2 fama, +80 seguidores", accion: { tipo: "entrevista" as const, fama: 2, monto: 80 } }, { texto: "Provocar al rival · −2 fama, −40 seguidores", accion: { tipo: "entrevista" as const, fama: -2, monto: -40 } }, { texto: "Declinar la entrevista", accion: { tipo: "nada" as const } }] },
      colecta: { titulo: "Colecta solidaria del barrio", texto: "La comisión propone una colecta puntual para sostener el gimnasio. No es un bingo ni una actividad social: vence en pocos días.", tipoEvento: "recaudacion" as const, opciones: [{ texto: "Aportar $80 y organizarla", accion: { tipo: "recaudacion" as const, costo: 80, monto: 180 } }, { texto: "No organizarla", accion: { tipo: "nada" as const } }] },
    } as const;

export function contenidoProspecto(de: string): Omit<EventoJuego,"id"|"venceEn"> {
  return {tipo:"prospecto",de,titulo:"Un talento pide probarse",
    texto:"Un pibe del barrio dejó su club rival y quiere entrenar con vos. Nadie cobra por mirar talento.",
    opciones:[{texto:"Abrirle la puerta",accion:{tipo:"nuevoAlumno"}},{texto:"Cupo completo, no",accion:{tipo:"nada"}}]};
}
export function contenidoExhibicion(): Omit<EventoJuego,"id"|"venceEn"> {
  return {tipo:"desafio",de:"Federación Regional",titulo:"Exhibición benéfica",
    texto:"La federación invita a uno de tus boxeadores a una exhibición: paga poco, pero suma fama y roce.",
    opciones:[{texto:"Mandar al ring",accion:{tipo:"exhibicion"}},{texto:"Declinar con respeto",accion:{tipo:"nada"}}]};
}
export const PATROCINIO_TEXTO="{name} ofrece {weekly} por semana durante {weeks} semanas a cambio de lucir su logo en el ring.";
export function contenidoPatrocinio(nombre:string,monto:number,semanas:number,formatted:string): Omit<EventoJuego,"id"|"venceEn"> {
  const params:Record<string,string>={name:nombre,weekly:formatted,weeks:String(semanas)};
  return {tipo:"patrocinio",de:nombre,titulo:"Propuesta de patrocinio",
    texto:PATROCINIO_TEXTO.replace(/\{(name|weekly|weeks)\}/g,(_,key:string)=>params[key]),
    opciones:[{texto:"Firmar contrato",accion:{tipo:"aceptarPatrocinio",nombre,monto,semanas}},{texto:"Rechazar la oferta",accion:{tipo:"nada"}}]};
}
