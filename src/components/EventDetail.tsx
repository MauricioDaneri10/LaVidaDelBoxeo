import { useState } from "react";
import type { EventoJuego } from "../game/types";
import { useGame } from "../game/state";
import { Btn, TextoPaginado } from "./ui";
import { useMessages } from "../i18n";
import { presentarEvento } from "../i18n/events";

/** Reading pages never resolves an event; only the explicit confirmation does. */
export function EventDetail({ event, initialResponse = false,responseOnly=false }: { event: EventoJuego; initialResponse?: boolean;responseOnly?:boolean }) {
  const { dispatch } = useGame();
  const { t, locale } = useMessages();
  const copy = presentarEvento(event, locale);
  const [response, setResponse] = useState(initialResponse);
  const [choice, setChoice] = useState(0);
  return <div className="event-detail">
    <div className="space-y-2">
      {!responseOnly&&<select className="r4-select" aria-label={t("event.section")} value={response ? "respuesta" : "texto"} onChange={e => setResponse(e.target.value === "respuesta")}>
        <option value="texto">{t("event.read")}</option><option value="respuesta">{t("event.choose")}</option>
      </select>}
      {response && <><select className="r4-select" aria-label={t("event.response")} value={choice} onChange={e => setChoice(Number(e.target.value))}>
        {copy.opciones.map((o, i) => <option key={i} value={i}>{o.texto}</option>)}
      </select><Btn disabled={event.venceEn <= 0 || !event.opciones[choice]} onClick={() => dispatch({ type: "EVENTO", id: event.id, opcion: choice })}>{t("event.confirm")}</Btn></>}
    </div>
    <TextoPaginado capacidad={response ? 20 : 40} texto={response ? `${copy.historico ? t("record.historical") + "\n" : ""}${copy.opciones[choice]?.texto ?? ""}` : `${copy.historico ? t("record.historical") + "\n" : ""}${copy.titulo}\n${copy.de}\n${event.venceEn <= 0 ? t("event.expired") : t(event.venceEn === 1 ? "event.expiry.one" : "event.expiry", { days: event.venceEn })}\n${copy.texto}`} />
  </div>;
}
