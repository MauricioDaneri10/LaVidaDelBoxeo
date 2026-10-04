import { useEffect, useState } from "react";
import { alumnosActivos, fmt, puedeHabilitar } from "../game/engine";
import { notificacion } from "../game/audio";
import { useGame } from "../game/state";
import type { EventoJuego, NotaPrensa } from "../game/types";
import { Btn, I, Modal, TextoPaginado } from "./ui";
import { EventDetail } from "./EventDetail";
import { objetivoConsejo } from "../game/consejos";
import { useMessages } from "../i18n";
import { presentarConsejo } from "../i18n/advice";

export type PestanaDock = "mensajes" | "patrocinios" | "prensa" | "consejos";

function ListaEventos({ events }: { events: EventoJuego[] }) {
  const { t } = useMessages();
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const event = events.find(e => e.id === selected) ?? events[0];
  useEffect(() => { if (open && !events.some(e => e.id === selected)) setOpen(false); }, [open, events, selected]);
  if (!event) return null;
  return <div className="space-y-2">
    <select aria-label={t("event.picker")} className="r4-select" value={event.id} onChange={e => setSelected(e.target.value)}>{events.map((e, i) => <option key={e.id} value={e.id}>{i + 1}/{events.length} · {e.titulo}</option>)}</select>
    <Btn onClick={() => { setSelected(event.id); setOpen(true); }}>{t("event.open")}</Btn>
    {open && event.id === selected && <Modal fit title={t("event.title")} onClose={() => setOpen(false)}><EventDetail key={event.id} event={event} /></Modal>}
  </div>;
}

function ListaPrensa({ notes }: { notes: NotaPrensa[] }) {
  const { t } = useMessages();
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const note = notes.find(n => n.id === selected) ?? notes[0];
  useEffect(() => { if (open && !notes.some(n => n.id === selected)) setOpen(false); }, [open, notes, selected]);
  if (!note) return <TextoPaginado capacidad={40} texto={t("press.empty")} />;
  return <div className="space-y-2">
    <select aria-label={t("press.picker")} className="r4-select" value={note.id} onChange={e => setSelected(e.target.value)}>
      {notes.map((n, i) => <option key={n.id} value={n.id}>{i + 1}/{notes.length} · {t("press.week", { week: n.semana })}</option>)}
    </select>
    <Btn onClick={() => { setSelected(note.id); setOpen(true); }}>{t("press.open")}</Btn>
    {open && note.id === selected && <Modal fit title={t("press.title")} onClose={() => setOpen(false)}>
      <TextoPaginado capacidad={40} texto={`${t("press.week", { week: note.semana })}\n${note.texto}`} />
    </Modal>}
  </div>;
}

function ConsejosPanel({ onSeleccionarBoxeador }: { onSeleccionarBoxeador?: (id: string) => void }) {
  const { state, dispatch } = useGame();
  const { locale, t } = useMessages();
  const [section, setSection] = useState("hitos");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState(false);
  const history = section === "historial";
  const records = state.consejos.filter(c => !!(c.reclamado || c.archivado) === history);
  const consejo = records.find(c => c.id === selected) ?? records[0];
  const lectura = consejo ? presentarConsejo(consejo, locale) : undefined;
  const ready = alumnosActivos(state).find(b => puedeHabilitar(b, state));
  useEffect(() => { if (open && (section === "hitos" || history) && !records.some(c => c.id === selected)) setOpen(false); }, [open, section, history, records, selected]);
  const status = consejo && t(consejo.reclamado ? "advice.paid" : consejo.archivado ? "advice.archived" : !objetivoConsejo(consejo.id) ? "advice.unknown" : consejo.cumplido ? "advice.ready" : "advice.pending");
  const rewardText = consejo ? `${t("advice.reward", { fame: consejo.fama })}${consejo.dinero ? ` · ${fmt(consejo.dinero)}` : ""}\n${status}${consejo.archivado && consejo.motivoArchivo ? `\n${consejo.motivoArchivo}` : ""}` : "";
  const financial = `${t(state.dinero < 300 ? "advice.warning" : "advice.finance")}\n${state.prestamo ? t("advice.loanActive", { count: state.prestamo.semanasRestantes, amount: fmt(state.prestamo.cuota) }) : state.dinero < 300 ? t("advice.loanOffer") : ""}`;
  const isRecord = section === "hitos" || history;
  return <div className="event-detail">
    <select className="r4-select" aria-label={t("advice.section")} value={section} onChange={e => { setSection(e.target.value); setOpen(false); }}>
      <option value="hitos">{t("advice.pending")} · {state.consejos.filter(c => !c.reclamado && !c.archivado).length}</option>
      <option value="historial">{t("advice.history")}</option><option value="orientacion">{t("advice.orientation")}</option>
      {ready && <option value="licencia">{t("advice.licenseReady")}</option>}
      <option value="finanzas">{t("advice.finance")}{state.dinero < 300 ? " · !" : ""}</option>
    </select>
    {isRecord ? consejo ? <>
      <select className="r4-select" aria-label={t("advice.picker")} value={consejo.id} onChange={e => setSelected(e.target.value)}>
        {records.map((c, i) => <option key={c.id} value={c.id}>{i + 1}/{records.length} · {t(c.reclamado ? "advice.paid" : c.archivado ? "advice.archived" : !objetivoConsejo(c.id) ? "advice.unknown" : c.cumplido ? "advice.ready" : "advice.pending")}</option>)}
      </select>
      <Btn onClick={() => { setSelected(consejo.id); setReward(false); setOpen(true); }}>{t("advice.open")}</Btn>
    </> : <TextoPaginado capacidad={40} texto={t("advice.empty")} /> : <>
      <Btn onClick={() => setOpen(true)}>{t("advice.read")}</Btn>
      {section === "finanzas" && state.dinero < 300 && !state.prestamo && <Btn onClick={() => dispatch({ type: "PEDIR_PRESTAMO" })}>{t("advice.borrow")}</Btn>}
      {section === "licencia" && ready && <Btn onClick={() => onSeleccionarBoxeador?.(ready.id)}>{t("advice.boxer")}</Btn>}
    </>}
    {open && (!isRecord || consejo?.id === selected) && <Modal fit title={t(isRecord ? "advice.detail" : "advice.name")} onClose={() => setOpen(false)}>
      <div className="event-detail">
        <div className="space-y-2">
          {isRecord && <select className="r4-select" aria-label={t("advice.detailSection")} value={reward ? "recompensa" : "texto"} onChange={e => setReward(e.target.value === "recompensa")}>
            <option value="texto">{t(lectura?.historico ? "record.historical" : "advice.objective")}</option><option value="recompensa">{t("advice.rewardStatus")}</option>
          </select>}
          {isRecord && reward && consejo && !consejo.reclamado && !consejo.archivado && consejo.cumplido && objetivoConsejo(consejo.id) && <Btn onClick={() => { notificacion(); dispatch({ type: "RECLAMAR_CONSEJO", id: consejo.id }); }}>{t("advice.claim")}</Btn>}
        </div>
        <TextoPaginado capacidad={40} texto={isRecord ? reward ? rewardText : lectura?.texto ?? "" : section === "finanzas" ? financial : section === "licencia" && ready ? t("advice.licenseInfo", { name: ready.nombre }) : t("advice.intro")} />
      </div>
    </Modal>}
  </div>;
}

interface DockLateralProps {
  pestana?: PestanaDock;
  setPestana?: (p: PestanaDock) => void;
  lado?: "escritorio" | "movil";
  onNavegarPestana?: (p: "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal") => void;
  onSeleccionarBoxeador?: (id: string) => void;
  abierto?: boolean;
  onCerrar?: () => void;
  accesoEnNavegacion?: boolean;
}

export default function DockLateral({
  pestana = "mensajes",
  setPestana = () => {},
  lado = "escritorio",
  onNavegarPestana,
  abierto,
  onCerrar,
  accesoEnNavegacion = false,
  onSeleccionarBoxeador,
}: DockLateralProps) {
  const { state } = useGame();
  const { t } = useMessages();
  const mensajes = state.eventos.filter(e => e.tipo !== "patrocinio");
  const patrocinios = state.eventos.filter(e => e.tipo === "patrocinio");
  const consejosPendientes = state.consejos.filter(c => !c.reclamado && !c.archivado);
  const consejosListos = consejosPendientes.filter(c => c.cumplido && objetivoConsejo(c.id));
  const esEscritorio = lado === "escritorio";
  const [movilAbierto, setMovilAbierto] = useState(false);
  const [contratoAbierto, setContratoAbierto] = useState(false);

  // Inteligencia Contextual: Detección proactiva del estado del plantel
  const alumnoListoParaFederar = alumnosActivos(state).find(b => puedeHabilitar(b, state));
  const hayPendientes = mensajes.length > 0 || patrocinios.length > 0 || consejosListos.length > 0 || !!alumnoListoParaFederar;

  const tabs: { id: PestanaDock; nombre: string; icono: string; badge: number }[] = [
    { id: "mensajes", nombre: t("panel.messages"), icono: "phone", badge: mensajes.length },
    { id: "patrocinios", nombre: t("panel.sponsors"), icono: "case", badge: patrocinios.length },
    { id: "prensa", nombre: t("panel.press"), icono: "mic", badge: 0 },
    { id: "consejos", nombre: t("advice.name"), icono: "cap", badge: consejosListos.length + (alumnoListoParaFederar ? 1 : 0) },
  ];
  const selectorCanal = (margen: string) => <div className={`${margen} shrink-0`}><select aria-label={t("panel.channel")} value={pestana} onChange={e => setPestana(e.target.value as PestanaDock)} className="r4-select">
    {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.nombre}{tab.badge ? ` · ${t("panel.pendingCount", { count: tab.badge })}` : ""}</option>)}
  </select></div>;

  const contenido = (
    <div className="h-full min-h-0 space-y-2 overflow-y-auto scroll-fino p-2.5 select-none">
      {/* PESTAÑA: MENSAJES Y DESAFÍOS */}
      {pestana === "mensajes" && (
        <>
          {mensajes.length === 0 && (
            <TextoPaginado capacidad={40} texto={t("panel.noMessages")} />
          )}
          <ListaEventos events={mensajes} />
        </>
      )}

      {/* PESTAÑA: SPONSORS Y PATROCINIOS */}
      {pestana === "patrocinios" && (
        <>
          {state.patrocinio && (
            <><Btn onClick={() => setContratoAbierto(true)}>{t("sponsor.open")}</Btn>
              {contratoAbierto && <Modal fit title={t("sponsor.title")} onClose={() => setContratoAbierto(false)}>
                <TextoPaginado capacidad={40} texto={`${state.patrocinio.nombre}\n${t("sponsor.terms", { amount: fmt(state.patrocinio.semanal), weeks: state.patrocinio.semanas })}`} />
              </Modal>}
            </>
          )}
          <ListaEventos events={patrocinios} />
          {!state.patrocinio && patrocinios.length === 0 && (
            <TextoPaginado capacidad={40} texto={t("panel.noSponsors")} />
          )}
        </>
      )}

      {/* PESTAÑA: PRENSA Y NOTICIAS */}
      {pestana === "prensa" && (
        <>
          <div className="flex items-center gap-2 px-1 pb-1">
            <I n="mic" className="h-4 w-4 text-blood" />
            <span className="font-display text-lg tracking-wide text-cream">{t("press.title")}</span>
          </div>
          <ListaPrensa notes={state.prensa} />
        </>
      )}

      {pestana === "consejos" && <ConsejosPanel onSeleccionarBoxeador={onSeleccionarBoxeador} />}
    </div>
  );

  if (esEscritorio) {
    return (
      <aside className="club-panel anim-dock flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl select-none"
        style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2 border-b border-line bg-panel2/70 px-3 py-2">
            <span className={`grid h-7 w-7 place-items-center border ${hayPendientes ? "border-gold text-gold" : "border-line2 text-sand"}`} title={t(hayPendientes ? "panel.pending" : "panel.clear")}>
              <I n="phone" className="h-4 w-4" />
            </span>
            <span className="font-display text-lg tracking-wide text-cream">{t("panel.title")}</span>
          {hayPendientes && <span className="ml-auto h-2 w-2 rounded-full bg-blood" title={t("panel.pending")} />}
        </div>
        {selectorCanal("m-2")}
        {contenido}
      </aside>
    );
  }

  // Versión compacta para pantallas móviles
  return (
    <div className="rounded-t-2xl border-t border-line bg-panel/95 select-none shadow-[0_-12px_28px_rgba(0,0,0,.25)]">
      {!accesoEnNavegacion && <Btn small variant="ghost" className="w-full" onClick={() => setMovilAbierto(true)}><I n="phone" />{t("panel.title")}{hayPendientes ? ` · ${t("panel.pending")}` : ""}</Btn>}
      {(abierto || movilAbierto) && <Modal fit title={t("panel.title")} icon="phone" onClose={() => { setMovilAbierto(false); onCerrar?.(); }}>
          {selectorCanal("mb-2 w-full")}
          {contenido}
      </Modal>}
    </div>
  );
}

export { DockLateral, DockLateral as Phone };
