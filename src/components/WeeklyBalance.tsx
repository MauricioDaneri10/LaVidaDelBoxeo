import { useState } from "react";
import { formatearDineroJuego as fmt, useMessages } from "../i18n";
import { presentarContenido } from "../i18n/content";
import { useGame } from "../game/state";
import { Btn, Modal, TextoPaginado } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";

/** Presentation never settles or repairs a ledger. Continue is the existing command. */
export function WeeklyBalance() {
  const {state,dispatch}=useGame();
  const {t,locale}=useMessages();
  const [section,setSection]=useState("resumen");
  const [index,setIndex]=useState(0);
  const horizontal=useResponsiveCapacity("(max-height: 450px)");
  const compact=useResponsiveCapacity("(max-width: 700px), (max-height: 650px)");
  const balance=state.resumen;
  if(!balance)return null;
  const records=section==="ingresos" ? balance.ingresos : balance.gastos;
  const record=records[Math.min(index,Math.max(0,records.length-1))];
  const copy=record?presentarContenido(record.concepto,record.presentacion,locale):null;
  const total=(lines:typeof records)=>lines.reduce((sum,line)=>sum+line.monto,0);
  const body=section==="resumen" ? t("balance.reconciled",{income:fmt(total(balance.ingresos)),expenses:fmt(total(balance.gastos)),net:fmt(balance.total),cash:fmt(state.dinero)})
    : section==="informacion" ? t("balance.disclosure",{cash:fmt(state.dinero)})
    : record && copy ? t("balance.entry",{source:copy.historico?t("balance.original"):"",description:copy.texto,amount:`${section==="gastos" ? "−" : "+"}${fmt(record.monto)}`})
    : t(section==="gastos" ? "balance.noExpenses" : "balance.emptyIncome");
  return <Modal wide fit title={t("balance.title",{week:state.semana})} icon="calendar"><div className="event-detail">
    <div className="space-y-2">
      <select className="r4-select" aria-label={t("balance.section")} value={section} onChange={e=>{setSection(e.target.value);setIndex(0);}}>
        <option value="resumen">{t("balance.summary")}</option><option value="ingresos">{t("balance.income")}</option><option value="gastos">{t("balance.expenses")}</option><option value="informacion">{t("balance.information")}</option>
      </select>
      {(section==="ingresos"||section==="gastos") && record && <select className="r4-select" aria-label={t("balance.line")} value={Math.min(index,records.length-1)} onChange={e=>setIndex(Number(e.target.value))}>
        {records.map((line,i)=><option key={i} value={i}>{i+1}/{records.length} · {fmt(line.monto)}</option>)}
      </select>}
      <Btn variant="gold" onClick={()=>dispatch({type:"CERRAR_DOMINGO"})}>{t("action.continue")}</Btn>
    </div>
    <TextoPaginado key={`${section}:${index}`} capacidad={horizontal ? 20 : compact ? 40 : 180} texto={body}/>
  </div></Modal>;
}
