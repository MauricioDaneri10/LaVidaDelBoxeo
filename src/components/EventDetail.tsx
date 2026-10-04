import { useState } from "react";
import type { EventoJuego } from "../game/types";
import { useGame } from "../game/state";
import { Btn, TextoPaginado } from "./ui";
import { useMessages } from "../i18n";

/** Reading pages never resolves an event; only the explicit confirmation does. */
export function EventDetail({ event, initialResponse = false }: { event: EventoJuego; initialResponse?: boolean }) {
  const { dispatch } = useGame();
  const { t } = useMessages();
  const [response, setResponse] = useState(initialResponse);
  const [choice, setChoice] = useState(0);
  return <div className="event-detail">
    <div className="space-y-2">
      <select className="r4-select" aria-label={t("event.section")} value={response ? "respuesta" : "texto"} onChange={e => setResponse(e.target.value === "respuesta")}>
        <option value="texto">{t("event.read")}</option><option value="respuesta">{t("event.choose")}</option>
      </select>
      {response && <><select className="r4-select" aria-label={t("event.response")} value={choice} onChange={e => setChoice(Number(e.target.value))}>
        {event.opciones.map((o, i) => <option key={i} value={i}>{o.texto}</option>)}
      </select><Btn disabled={event.venceEn <= 0 || !event.opciones[choice]} onClick={() => dispatch({ type: "EVENTO", id: event.id, opcion: choice })}>{t("event.confirm")}</Btn></>}
    </div>
    <TextoPaginado capacidad={response ? 20 : 40} texto={response ? event.opciones[choice]?.texto ?? "" : `${event.titulo}\n${event.de}\n${event.venceEn <= 0 ? t("event.expired") : t(event.venceEn === 1 ? "event.expiry.one" : "event.expiry", { days: event.venceEn })}\n${event.texto}`} />
  </div>;
}
