import { useState } from "react";
import { useGame } from "../game/state";
import { ofertaValidaPara, valoracion } from "../game/engine";
import { formatearDineroJuego as fmt, useMessages } from "../i18n";
import { presentarDivision, presentarOferta, presentarTitulo } from "../i18n/presentation";
import { Btn, TextoPaginado } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";

/** Reading and selecting a view never regenerates, signs or modifies offers. */
export function OfferDetail() {
  const {state,dispatch}=useGame();
  const {t,locale}=useMessages();
  const [selected,setSelected]=useState(0);
  const [view,setView]=useState("rival");
  const horizontal=useResponsiveCapacity("(max-height: 450px)");
  const compact=useResponsiveCapacity("(max-width: 700px), (max-height: 650px)");
  const offer=state.ofertas[Math.min(selected,state.ofertas.length-1)];
  const boxer=state.plantel.find(p=>p.id===state.ofertasPara);
  if(!offer || !boxer)return null;
  const copy=presentarOferta(offer,locale);
  const valid=ofertaValidaPara(boxer,offer,state);
  const text=view==="rival" ? t("offer.record",{name:offer.rival.nombre,division:presentarDivision(offer.rival.division,locale),circuit:t(offer.rival.circuito==="pro"?"city.pro":"city.amateur"),wins:offer.rival.record.v,losses:offer.rival.record.d,draws:offer.rival.record.e??0,kos:offer.rival.record.ko,rating:valoracion(offer.rival.atrib),energy:Math.round(offer.rival.energia)})
    : view==="condiciones" ? t("offer.purse",{purse:fmt(offer.bolsa),boxer:boxer.nombre,title:offer.esTitulo ? presentarTitulo(offer.esTitulo,locale).cinturon : ""})+(!valid ? `\n${t("offer.invalid")}` : "")
    : `${copy.historico ? t("record.historical")+"\n" : ""}${copy.etiqueta}\n${copy.detalle}`;
  return <div className="bounded-detail">
    <div className="space-y-2">
      <select className="r4-select" aria-label={t("offer.picker")} value={Math.min(selected,state.ofertas.length-1)} onChange={e=>setSelected(Number(e.target.value))}>{state.ofertas.map((item,index)=><option value={index} key={item.id}>{index+1} · {item.rival.nombre}</option>)}</select>
      <select className="r4-select" aria-label={t("offer.section")} value={view} onChange={e=>setView(e.target.value)}><option value="rival">{t("offer.opponent")}</option><option value="condiciones">{t("offer.conditions")}</option><option value="oferta">{t("offer.content")}</option></select>
      <div className="grid grid-cols-2 gap-2">
        <Btn small disabled={!valid} onClick={()=>dispatch({type:"ELEGIR_OFERTA",ofertaId:offer.id})}>{t("offer.sign")}</Btn>
        <Btn small variant="ghost" onClick={()=>dispatch({type:"BUSCAR_RIVAL",id:boxer.id})}>{t("offer.regenerate")}</Btn>
      </div>
    </div>
    <TextoPaginado key={`${offer.id}:${view}`} texto={text} capacidad={horizontal?20:compact?40:180}/>
  </div>;
}
