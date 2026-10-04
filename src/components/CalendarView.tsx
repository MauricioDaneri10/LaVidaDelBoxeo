import { useEffect, useState } from "react";
import { fechaDelJuego, fmt, peleasVencidas } from "../game/engine";
import { useGame } from "../game/state";
import { Btn, TextoPaginado } from "./ui";
import { EventDetail } from "./EventDetail";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { formatearFecha, useMessages } from "../i18n";

export default function CalendarioView() {
  const { state, dispatch } = useGame();
  const { t, locale } = useMessages();
  const dias = ([1, 2, 3, 4, 5, 6, 7] as const).map(d => t(`day.${d}`));
  const [vista, setVista] = useState("semana");
  const [dia, setDia] = useState(state.dia);
  const [indice, setIndice] = useState(0);
  const [confirmarBajaId, setConfirmarBajaId] = useState<string | null>(null);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const compacto = useResponsiveCapacity("(max-width: 700px), (max-height: 450px)");
  const fecha = fechaDelJuego(state.semana, state.dia);
  // Presentation only: IDs, contract dates and option indices remain domain-owned.
  const agenda = [
    ...state.pendientes.map(p => ({
      id: `pelea:${p.id}`, dia: p.diaProgramado ?? 6, semana: p.semanaProgramada ?? state.semana,
      texto: t("calendar.bout", { name: p.rival.nombre, purse: fmt(p.bolsa), kind: t(p.esTitulo ? "calendar.titleBout" : "calendar.officialBout") }),
      pelea: p.id, evento: null,
    })),
    ...(state.veladaProgramada ? [{ id: "velada", dia: 6, semana: state.semana, texto: t("calendar.show"), pelea: null, evento: null }] : []),
    ...state.comunitarios.map((c, i) => ({ id: `social:${i}`, dia: 7, semana: state.semana, texto: `${c.nombre}\n${t("calendar.social")}`, pelea: null, evento: null })),
    ...state.eventos.map(e => ({ id: `evento:${e.id}`, dia: state.dia, semana: state.semana, texto: `${e.titulo}\n${e.de}\n${t(e.venceEn === 1 ? "event.expiry.one" : "event.expiry", { days: e.venceEn })}\n${e.texto}`, pelea: null, evento: e })),
  ];
  const seleccionado = agenda[Math.min(indice, Math.max(0, agenda.length - 1))];
  useEffect(() => {
    if (vista === "decision" && !agenda.some(a => a.id === decisionId)) setVista("agenda");
  }, [vista, decisionId, agenda]);
  const proximoPaso = t(peleasVencidas(state).length ? "calendar.resolve" : state.dia === 7 ? "calendar.balance" : state.dia === 6
    ? "calendar.spar"
    : state.eventos.some(e => e.venceEn <= 1) ? "calendar.urgent"
    : state.comunitarios.length ? "calendar.socialSunday" : "calendar.prepare");
  const resumen = t("calendar.overview", { date: formatearFecha(fecha, locale), week: state.semana, events: state.eventos.length, bouts: state.pendientes.length, social: t(state.comunitarios.length ? "calendar.booked" : "calendar.free"), next: t("calendar.next", { step: proximoPaso }) });
  const textoDetalle = vista === "resumen" ? resumen : seleccionado
    ? `${seleccionado.evento ? t("calendar.notice") : t("calendar.date", { day: dias[seleccionado.dia - 1], date: fechaDelJuego(seleccionado.semana, seleccionado.dia).getDate(), week: seleccionado.semana })}\n${seleccionado.texto}`
    : t("calendar.empty");

  return <div className="calendar-screen game-screen flex h-full min-h-0 flex-col gap-2">
    <select aria-label={t("calendar.view")} value={vista} className="r4-select shrink-0" onChange={e => { setVista(e.target.value); if (e.target.value === "decision") setDecisionId(seleccionado?.id ?? null); }}>
      <option value="semana">{t("calendar.week", { week: state.semana })}</option>
      <option value="agenda">{t("calendar.agenda", { count: agenda.length })}</option>
      <option value="resumen">{t("calendar.summary")}</option>
      {seleccionado && <option value="decision">{t("calendar.manage")}</option>}
    </select>
    {vista === "semana" && compacto && <select className="calendar-picker r4-select shrink-0" aria-label={t("calendar.day")} value={dia} onChange={e => setDia(Number(e.target.value))}>
      {dias.map((d, i) => <option key={d} value={i + 1}>{d} {fechaDelJuego(state.semana, i + 1).getDate()}</option>)}
    </select>}
    {vista === "agenda" && seleccionado && <select aria-label={t("calendar.activity")} className="calendar-picker r4-select shrink-0" value={seleccionado.id} onChange={e => {
      setIndice(agenda.findIndex(a => a.id === e.target.value)); setConfirmarBajaId(null);
    }}>{agenda.map((a, i) => <option key={a.id} value={a.id}>{i + 1}/{agenda.length} · {a.texto.split("\n")[0]}</option>)}</select>}

    <section className="calendar-content panel min-h-0 flex-1 p-2">
      {(vista === "resumen" || vista === "agenda") && <TextoPaginado key={vista === "agenda" ? seleccionado?.id : vista} texto={textoDetalle} capacidad={40} />}
      {vista === "semana" && <div className={compacto ? "" : "grid gap-2"} style={compacto ? undefined : { gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))" }}>
          {dias.map((d, i) => (!compacto || dia === i + 1) && <div key={d} className="rounded-lg border border-line p-2">
            <p className={state.dia === i + 1 ? "text-gold" : "text-cream"}>{d} {fechaDelJuego(state.semana, i + 1).getDate()}</p>
            <p className="text-sand">{t(state.pendientes.some(p => (p.diaProgramado ?? 6) === i + 1 && (p.semanaProgramada ?? state.semana) === state.semana) ? "calendar.fights" : i < 5 ? "calendar.preparation" : i === 5 ? "calendar.sparring" : "calendar.balanceDay")}</p>
            <p className="text-neonc">{t("calendar.activityCount", { count: agenda.filter(a => !a.evento && a.dia === i + 1 && a.semana === state.semana).length })}</p>
          </div>)}
      </div>}
      {vista === "decision" && seleccionado && <div className="space-y-2">
        {seleccionado.pelea ? confirmarBajaId === seleccionado.pelea
          ? <><p>{t("calendar.cancelQuestion")}</p><div className="flex gap-2"><Btn variant="blood" onClick={() => { dispatch({ type: "CANCELAR_PELEA", peleaId: seleccionado.pelea! }); setConfirmarBajaId(null); setVista("agenda"); }}>{t("calendar.cancelConfirm")}</Btn><Btn variant="ghost" onClick={() => setConfirmarBajaId(null)}>{t("calendar.keep")}</Btn></div></>
          : <Btn onClick={() => setConfirmarBajaId(seleccionado.pelea)}>{t("calendar.cancel")}</Btn>
          : seleccionado.evento ? <EventDetail key={seleccionado.id} initialResponse event={seleccionado.evento} /> : <p>{t("calendar.settlement")}</p>}
      </div>}
    </section>
  </div>;
}
