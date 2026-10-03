import { useState } from "react";
import { useGame } from "../game/state";
import type { Atributos } from "../game/types";
import { ATRIBUTOS_BASE } from "../game/saveValidation";
import { useMessages } from "../i18n";
import { Modal, TextoPaginado } from "./ui";

/** Read-only snapshots. No competitive commands and no Hall-of-Fame eligibility. */
export default function ArchivoCarreras({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const { t } = useMessages();
  const [index, setIndex] = useState(0);
  const [seccion, setSeccion] = useState("nombre");
  const [atributo, setAtributo] = useState("fuerza");
  const [combate, setCombate] = useState(0);
  const entry = state.archivoCarreras[Math.min(index, state.archivoCarreras.length - 1)];
  const p = entry?.pugilista;
  const extras = p && Object.fromEntries(Object.entries(p.atrib).filter(([key]) => !Object.prototype.hasOwnProperty.call(ATRIBUTOS_BASE, key)));
  const h = entry?.historial[Math.min(combate, entry.historial.length - 1)];
  return <Modal title={t("archive.title")} onClose={onClose} fit>
    {!entry || !p ? <p className="font-cond text-sand">{t("archive.empty")}</p> : <div className="archive-screen space-y-2 text-sm text-cream" data-testid="career-archive">
      <div className="space-y-2">
        <select aria-label={t("archive.boxer")} value={Math.min(index, state.archivoCarreras.length - 1)} onChange={e => { setIndex(Number(e.target.value)); setCombate(0); }} className="r4-select">{state.archivoCarreras.map((item,i)=><option key={item.id} value={i}>{item.pugilista.nombre}</option>)}</select>
        <select aria-label={t("archive.section")} value={seccion} onChange={e=>setSeccion(e.target.value)} className="r4-select">
          <option value="nombre">{t("sheet.name")}</option><option value="club">{t("archive.club")}</option><option value="licencia">{t("archive.licence")}</option><option value="record">{t("archive.record")}</option><option value="atributos">{t("sheet.attributes")}</option><option value="historial">{t("sheet.history")}</option>{extras && Object.keys(extras).length > 0 && <option value="extras">{t("archive.historical")}</option>}
        </select>
      </div>
      <div key={entry.id} className="min-w-0 space-y-2 rounded-lg border border-line bg-panel p-2">
        {seccion === "nombre" && <TextoPaginado texto={p.nombre} />}
        {seccion === "club" && <TextoPaginado texto={t("archive.clubDetails", {club:entry.club, reason:entry.motivo, week:entry.semanaSalida})} />}
        {seccion === "licencia" && <TextoPaginado texto={t("archive.licenceDetails", {licence:t(`licence.${p.circuito}`), division:p.division, age:p.edad})} />}
        {seccion === "record" && <TextoPaginado texto={t("archive.recordDetails", {record:`${p.record.v}–${p.record.d}–${p.record.e}`, ko:p.record.ko, titles:p.titulo, amateur:p.peleasAmateur, pro:p.peleasProfesionales})} />}
        {seccion === "atributos" && <>
          <select aria-label={t("archive.attribute")} value={atributo} onChange={e=>setAtributo(e.target.value)} className="r4-select">{(Object.keys(ATRIBUTOS_BASE) as (keyof Atributos)[]).map(key=><option key={key} value={key}>{t(`stat.${key}`)}</option>)}<option value="energia">{t("stat.energia")}</option><option value="guanteos">{t("stat.guanteos")}</option><option value="pro">{t("archive.pro")}</option></select>
          <p>{atributo === "energia" ? p.energia : atributo === "guanteos" ? p.guanteosRealizados : atributo === "pro" ? `${p.victoriasProfesionales}–${p.derrotasProfesionales}–${p.empatesProfesionales} · ${p.kosProfesionales} KO` : p.atrib[atributo as keyof Atributos]}</p>
        </>}
        {seccion === "historial" && (!h ? <p>{t("archive.noResults")}</p> : <>
          <select aria-label={t("archive.result")} value={Math.min(combate, entry.historial.length - 1)} onChange={e=>setCombate(Number(e.target.value))} className="r4-select">{entry.historial.map((result,i)=><option key={i} value={i}>{i+1} · {result.rivalNombre ?? result.metodo}</option>)}</select>
          <p data-text-role="secondary">{t("archive.historical")}</p><TextoPaginado key={combate} texto={h.resumen} capacidad={40} />
        </>)}
        {seccion === "extras" && <TextoPaginado texto={JSON.stringify(extras)} />}
      </div>
    </div>}
  </Modal>;
}
