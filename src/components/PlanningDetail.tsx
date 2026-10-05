import { useState } from "react";
import { formatearDineroJuego as fmt, useMessages } from "../i18n";
import { type proyeccionSemanal } from "../game/engine";
import type { Pestana } from "../App";
import { Btn, TextoPaginado } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { presentarContenido } from "../i18n/content";

/** Guide and projection are views, not commands or settlement stages. */
export function PlanningDetail({steps,projection,onOpen}: {
  steps:Array<{texto:string;hecho:boolean;tab:Pestana}>;
  projection:ReturnType<typeof proyeccionSemanal>;
  onOpen:(tab:Pestana)=>void;
}) {
  const {t,locale}=useMessages();
  const [section,setSection]=useState("guia");
  const [index,setIndex]=useState(0);
  const horizontal=useResponsiveCapacity("(max-height:450px)");
  const compact=useResponsiveCapacity("(max-width:700px), (max-height:650px)");
  const step=steps[index];
  const text=section==="guia" ? `${index+1}/4 · ${step.texto}\n${t(step.hecho?"plan.done":"plan.pending")}`
    : section==="prevision" ? t("forecast.summary",{income:fmt(projection.ingresos.reduce((sum,line)=>sum+line.monto,0)),expenses:fmt(projection.gastos.reduce((sum,line)=>sum+line.monto,0)),net:fmt(projection.total)})+"\n"+t("forecast.guard")
    : projection.estimados.map(l=>t("forecast.range",{label:presentarContenido(l.concepto,l.presentacion,locale).texto,min:fmt(l.min),max:fmt(l.max),mean:fmt(l.mean)})).join("\n")+"\n"+t("forecast.notGuaranteed");
  return <div className="bounded-detail">
    <div className="space-y-2">
      <select className="r4-select" aria-label={t("plan.section")} value={section} onChange={e=>setSection(e.target.value)}>
        <option value="guia">{t("guide.title")}</option><option value="prevision">{t("forecast.title")}</option><option value="actividades">{t("profile.activities")}</option>
      </select>
      {section==="guia" && <>
        <select className="r4-select" aria-label={t("plan.step")} value={index} onChange={e=>setIndex(Number(e.target.value))}>
          {steps.map((s,i)=><option value={i} key={s.tab+":"+i}>{i+1}/4 · {s.hecho?"✓ · ":""}{s.texto}</option>)}
        </select>
        <Btn variant="gold" disabled={step.hecho} onClick={()=>onOpen(step.tab)}>{t("plan.openTab")}</Btn>
      </>}
    </div>
    <TextoPaginado key={section+":"+index} texto={text} capacidad={horizontal?20:compact?40:180}/>
  </div>;
}
