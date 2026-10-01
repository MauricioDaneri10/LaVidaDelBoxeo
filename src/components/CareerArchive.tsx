import { useState } from "react";
import { useGame } from "../game/state";
import { Btn, Modal } from "./ui";

/** Read-only snapshots. No competitive commands and no Hall-of-Fame eligibility. */
export default function ArchivoCarreras({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const [index, setIndex] = useState(0);
  const [detalle, setDetalle] = useState(false);
  const entry = state.archivoCarreras[Math.min(index, state.archivoCarreras.length - 1)];
  const p = entry?.pugilista;
  return <Modal title="Archivo de carreras" onClose={onClose} fit>
    {!entry || !p ? <p className="font-cond text-sand">Todavía no hay bajas competitivas archivadas.</p> : <div className="space-y-2 font-cond text-sm text-cream" data-testid="career-archive">
      <h3 className="font-display text-xl text-gold">{p.nombre}</h3>
      <p>{entry.club} · {entry.motivo} · Semana {entry.semanaSalida}</p>
      <p>{p.circuito === "pro" ? "Licencia Profesional" : "Licencia Amateur"} · {p.division} · {p.edad} años</p>
      <p>Récord {p.record.v}–{p.record.d}–{p.record.e} · {p.record.ko} KO · Títulos: {p.titulo}</p>
      <p>Amateur: {p.peleasAmateur} peleas · Profesional: {p.peleasProfesionales} peleas</p>
      <Btn small variant="ghost" onClick={() => setDetalle(v => !v)}>{detalle ? "Ver historial" : "Ver ficha"}</Btn>
      {detalle ? <div className="grid grid-cols-2 gap-1">
        {Object.entries(p.atrib).map(([key, value]) => <div key={key} className="rounded border border-line px-2 py-1 capitalize">{key}: {value}</div>)}
        <div>Energía: {p.energia}</div><div>Guanteos: {p.guanteosRealizados}</div>
        <div className="col-span-2">Profesional: {p.victoriasProfesionales}–{p.derrotasProfesionales}–{p.empatesProfesionales} · {p.kosProfesionales} KO</div>
      </div> : <p>{entry.historial.length ? `${entry.historial.length} resultados conservados. Último: ${entry.historial[0].resumen}` : "Sin resultados individuales conservados. El récord completo figura arriba."}</p>}
      <div className="flex justify-center gap-2">
        <Btn small variant="ghost" disabled={index === 0} onClick={() => { setIndex(v => v - 1); setDetalle(false); }}>Anterior</Btn>
        <span>{index + 1}/{state.archivoCarreras.length}</span>
        <Btn small variant="ghost" disabled={index + 1 >= state.archivoCarreras.length} onClick={() => { setIndex(v => v + 1); setDetalle(false); }}>Siguiente</Btn>
      </div>
    </div>}
  </Modal>;
}
