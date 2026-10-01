import { useState } from "react";
import { DIAS, MESES } from "../game/data";
import { fechaDelJuego, fmt } from "../game/engine";
import { useGame } from "../game/state";
import { I } from "./ui";

export default function CalendarioView() {
  const { state, dispatch } = useGame();
  const [confirmarBajaId, setConfirmarBajaId] = useState<string | null>(null);
  const fecha = fechaDelJuego(state.semana, state.dia);
  const agenda = [
    ...state.pendientes.map(p => ({ dia: p.diaProgramado ?? 6, titulo: `Pelea: ${p.rival.nombre}`, detalle: `Bolsa ${fmt(p.bolsa)}`, tono: "text-blood" })),
    ...(state.veladaProgramada ? [{ dia: 6, titulo: "Velada del club", detalle: "Entradas y recaudación", tono: "text-gold" }] : []),
    ...state.comunitarios.map(c => ({ dia: 7, titulo: c.nombre, detalle: "Recaudación del domingo", tono: "text-neonc" })),
  ];
  const proximoPaso = state.dia === 7
    ? "Revisar balance"
    : state.dia === 6
      ? state.pendientes.length > 0 ? "Resolver cartelera" : "Guanteos del sábado"
      : state.eventos.some(evento => evento.venceEn <= 1) ? "Resolver aviso urgente"
        : state.comunitarios.length > 0 ? "Actividad social el domingo" : "Preparar equipo";
  const hayAgenda = state.pendientes.length > 0 || state.veladaProgramada || state.comunitarios.length > 0;

  return (
    <div className="calendar-screen game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      <div className="panel flex shrink-0 items-center justify-between gap-3 p-3">
        <div><h2 className="font-display text-2xl tracking-wide text-gold">Calendario del club</h2><p className="font-cond text-xs text-sand">Semana {state.semana} · {MESES[fecha.getMonth()]} {fecha.getFullYear()}</p></div>
        <div className="rounded-xl border border-gold2/40 bg-gold/10 px-3 py-2 text-right font-cond text-xs text-gold"><I n="calendar" className="mr-1 inline h-4 w-4" />{DIAS[state.dia - 1]} {fecha.getDate()}</div>
      </div>
      <div className="calendar-grid grid min-h-0 flex-1 grid-cols-7 gap-1.5" aria-label={`Semana ${state.semana}, del lunes al domingo`}>
        {DIAS.map((dia, i) => {
          const items = agenda.filter(x => x.dia === i + 1);
          return <div key={dia} className={`calendar-day-cell min-w-0 overflow-hidden rounded-xl border p-2 ${state.dia === i + 1 ? "border-gold2 bg-gold/10" : "border-line bg-panel2/70"}`}>
            <div className="font-display text-xs uppercase text-cream">{dia.slice(0, 3)}</div>
            <div className="mb-2 font-mono-data text-[10px] text-mut">{fechaDelJuego(state.semana, i + 1).getDate()}</div>
            {i < 5 && <div className="font-cond text-[10px] text-mut">Preparación</div>}
            {i === 5 && items.length === 0 && <div className="font-cond text-[10px] text-mut">Guanteo</div>}
            {i === 6 && items.length === 0 && <div className="font-cond text-[10px] text-mut">Balance</div>}
            {items.map(item => <div key={item.titulo} className={`mt-1 min-w-0 truncate rounded border border-line bg-ink/40 px-1 py-0.5 font-cond text-[10px] ${item.tono}`} title={`${item.titulo} · ${item.detalle}`}>{item.titulo}</div>)}
          </div>;
        })}
      </div>
      <div className="calendar-summary panel grid shrink-0 grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Eventos activos <b className="block text-gold">{state.eventos.length}</b></div>
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Peleas agendadas <b className="block text-blood">{state.pendientes.length}</b></div>
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Actividad social <b className="block text-neonc">{state.comunitarios.length ? "Agendada" : "Libre"}</b></div>
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Próximo paso <b className="block text-cream">{proximoPaso}</b></div>
      </div>
      <section className="calendar-agenda panel flex min-h-0 flex-1 flex-col p-3" aria-label="Agenda y avisos activos">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <h3 className="font-display text-sm uppercase tracking-wide text-gold">Agenda y avisos activos</h3>
          <span className="font-mono-data text-[10px] text-mut">Las decisiones se sincronizan con el Panel del Club</span>
        </div>
        {!hayAgenda && state.eventos.length === 0 ? (
          <p className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-mut">No hay actividades ni avisos pendientes. Las propuestas nuevas aparecen aquí cuando llegan.</p>
        ) : (
          <div className="calendar-agenda-list grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {state.pendientes.map(pelea => {
              const dia = pelea.diaProgramado ?? 6;
              const fechaPelea = fechaDelJuego(pelea.semanaProgramada ?? state.semana, dia);
              const confirmando = confirmarBajaId === pelea.id;
              return <article key={pelea.id} className="rounded-lg border border-blood/50 bg-panel2 p-2">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <b className="truncate font-display text-xs text-cream" title={`Pelea: ${pelea.rival.nombre}`}>Pelea: {pelea.rival.nombre}</b>
                  <span className="shrink-0 rounded border border-blood/40 px-1.5 py-0.5 font-mono-data text-[10px] text-blood">{DIAS[dia - 1]} {fechaPelea.getDate()}</span>
                </div>
                <p className="mt-1 font-cond text-xs text-sand">Bolsa acordada: {fmt(pelea.bolsa)} · {pelea.esTitulo ? "Combate titular" : "Combate oficial"}</p>
                {confirmando ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={`Confirmar baja de pelea con ${pelea.rival.nombre}`}>
                    <span className="font-cond text-xs text-sand">¿Bajar esta pelea?</span>
                    <button className="btn-poster border border-blood/60 bg-blood/15 px-2 py-1 font-cond text-xs text-cream" onClick={() => { dispatch({ type: "CANCELAR_PELEA", peleaId: pelea.id }); setConfirmarBajaId(null); }}>Sí, bajar pelea</button>
                    <button className="btn-poster border border-line px-2 py-1 font-cond text-xs text-sand" onClick={() => setConfirmarBajaId(null)}>Conservar</button>
                  </div>
                ) : <button className="mt-2 btn-poster border border-line px-2 py-1 font-cond text-xs text-sand" onClick={() => setConfirmarBajaId(pelea.id)}>Bajar pelea</button>}
              </article>;
            })}
            {state.veladaProgramada && <article className="rounded-lg border border-gold2/50 bg-panel2 p-2">
              <b className="font-display text-xs text-gold">Velada del club</b>
              <p className="mt-1 font-cond text-xs text-sand">Sábado {fechaDelJuego(state.semana, 6).getDate()} · Entradas y recaudación del evento.</p>
            </article>}
            {state.comunitarios.map((actividad, i) => <article key={`${actividad.tipo}-${i}`} className="rounded-lg border border-neonc/40 bg-panel2 p-2">
              <b className="font-display text-xs text-neonc">{actividad.nombre}</b>
              <p className="mt-1 font-cond text-xs text-sand">Domingo {fechaDelJuego(state.semana, 7).getDate()} · Actividad social y liquidación semanal.</p>
            </article>)}
            {state.eventos.map(evento => {
              const plazo = evento.venceEn === 1 ? "1 día" : `${evento.venceEn} días`;
              return <article key={evento.id} className="min-w-0 rounded-lg border border-line bg-panel2 p-2">
                <div className="flex items-start justify-between gap-2">
                  <b className="min-w-0 truncate font-display text-xs text-cream" title={evento.titulo}>{evento.titulo}</b>
                  <span className="shrink-0 rounded border border-gold2/40 px-1.5 py-0.5 font-mono-data text-[10px] text-gold" title={`Vence en ${plazo}`} aria-label={`Vence en ${plazo}`}>{evento.venceEn} d</span>
                </div>
                <p className="mt-1 truncate font-cond text-[10px] text-mut" title={evento.de}>{evento.de}</p>
                <p className="mt-1 line-clamp-2 font-cond text-xs leading-snug text-sand">{evento.texto}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {evento.opciones.map((opcion, indice) => <button key={`${evento.id}-${indice}`} onClick={() => dispatch({ type: "EVENTO", id: evento.id, opcion: indice })}
                    className={`btn-poster max-w-full whitespace-normal px-2 py-1 text-xs leading-tight ${indice === 0 ? "border border-[#ffe0a0]/50 bg-gold text-ink" : "border border-line text-sand"}`}>
                    {opcion.texto}
                  </button>)}
                </div>
              </article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
