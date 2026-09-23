import { DIAS, MESES } from "../game/data";
import { fmt } from "../game/engine";
import { useGame } from "../game/state";
import { Btn, I } from "./ui";

export default function CalendarioView() {
  const { state } = useGame();
  // La fecha visible se deriva de un único reloj: semana 1 empieza el
  // 1/1/2026. Así no puede divergir del encabezado si una partida vieja
  // conserva un contador de mes anterior.
  const fecha = new Date(2026, 0, 1 + ((state.semana - 1) * 7) + (state.dia - 1));
  const agenda = [
    ...state.pendientes.map(p => ({ dia: p.diaProgramado ?? 6, titulo: `Pelea: ${p.rival.nombre}`, detalle: `Bolsa ${fmt(p.bolsa)}`, tono: "text-blood" })),
    ...(state.veladaProgramada ? [{ dia: 6, titulo: "Velada del club", detalle: "Entradas y recaudación", tono: "text-gold" }] : []),
    ...state.comunitarios.map(c => ({ dia: 7, titulo: c.nombre, detalle: "Recaudación del domingo", tono: "text-neonc" })),
  ];
  return (
    <div className="game-screen h-full overflow-hidden space-y-3">
      <div className="panel flex items-center justify-between gap-3 p-3">
        <div><h2 className="font-display text-2xl tracking-wide text-gold">Calendario del club</h2><p className="font-cond text-xs text-sand">Semana {state.semana} · {MESES[fecha.getMonth()]} {fecha.getFullYear()}</p></div>
        <div className="rounded-xl border border-gold2/40 bg-gold/10 px-3 py-2 text-right font-cond text-xs text-gold"><I n="calendar" className="mr-1 inline h-4 w-4" />{DIAS[state.dia - 1]} {fecha.getDate()}</div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DIAS.map((dia, i) => {
          const items = agenda.filter(x => x.dia === i + 1);
          return <div key={dia} className={`min-h-[130px] rounded-xl border p-2 ${state.dia === i + 1 ? "border-gold2 bg-gold/10" : "border-line bg-panel2/70"}`}>
            <div className="font-display text-xs uppercase text-cream">{dia.slice(0, 3)}</div>
            <div className="mb-2 font-mono-data text-[10px] text-mut">{new Date(2026, fecha.getMonth(), fecha.getDate() - state.dia + i + 1).getDate()}</div>
            {i < 5 && <div className="font-cond text-[10px] text-mut">Preparación</div>}
            {i === 5 && agenda.length === 0 && <div className="font-cond text-[10px] text-mut">Guanteo</div>}
            {i === 6 && <div className="font-cond text-[10px] text-mut">Balance</div>}
            {items.map(item => <div key={item.titulo} className={`mt-1 rounded-lg border border-line bg-ink/40 p-1.5 font-cond text-[10px] ${item.tono}`}><b className="block truncate">{item.titulo}</b><span className="text-sand">{item.detalle}</span></div>)}
          </div>;
        })}
      </div>
      <div className="panel grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Eventos activos <b className="block text-gold">{state.eventos.length}</b></div>
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Peleas agendadas <b className="block text-blood">{state.pendientes.length}</b></div>
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Actividad social <b className="block text-neonc">{state.comunitarios.length ? "Agendada" : "Libre"}</b></div>
        <div className="rounded-lg border border-line bg-panel2 p-2 font-cond text-xs text-sand">Próximo paso <b className="block text-cream">{state.dia === 6 ? "Resolver cartelera" : "Preparar equipo"}</b></div>
      </div>
      <Btn small variant="dark" disabled><I n="info" className="h-3.5 w-3.5" /> Las fechas se actualizan al avanzar el día.</Btn>
    </div>
  );
}
