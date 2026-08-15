import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { fmt } from "../game/data";
import { useGame } from "../game/state";
import type { GameEvent } from "../game/types";
import { Btn, Chip, I } from "./ui";

function EventCard({ ev, onClose }: { ev: GameEvent; onClose: () => void }) {
  const { state, dispatch } = useGame();
  const [boxerId, setBoxerId] = useState("");
  const federados = state.roster.filter(b => b.rol === "boxeador");
  const necesita = !!ev.necesitaBoxeador;
  const listo = !necesita || !!boxerId;

  const resolver = (option: number) => {
    dispatch({ type: "RESOLVE_EVENT", id: ev.id, option, boxerId: boxerId || undefined });
    onClose();
  };

  return (
    <div className="border border-line bg-ink p-3">
      <div className="flex items-center justify-between">
        <div className="font-cond text-[11px] uppercase tracking-widest text-mut">{ev.de} · vence en {ev.dias} día(s)</div>
        <Chip tone="gold">{ev.titulo}</Chip>
      </div>
      <p className="mt-1.5 text-sm text-sand">{ev.texto}</p>
      {necesita && (
        <div className="mt-2">
          <div className="mb-1 font-cond text-[11px] uppercase tracking-wide text-mut">Elige a tu representante:</div>
          {federados.length === 0 ? (
            <p className="font-cond text-xs text-lose">No tienes boxeadores federados.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {federados.map(b => (
                <button key={b.id} onClick={() => setBoxerId(b.id)}
                  className={`flex items-center gap-1 border px-2 py-1 font-cond text-xs uppercase transition-colors ${boxerId === b.id ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel2 text-sand hover:border-line2"}`}>
                  {b.nombre.split(" ")[0]} <span className="text-mut">(en. {Math.round(b.energia)})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Btn small variant="gold" disabled={!listo} onClick={() => resolver(0)}>{ev.opciones[0].label}</Btn>
        <Btn small variant="ghost" onClick={() => resolver(1)}>{ev.opciones[1].label}</Btn>
        {ev.extra?.dinero && <span className="ml-auto self-center font-cond text-sm font-bold text-gold">{fmt(ev.extra.dinero)}{ev.type === "sponsor" ? "/sem" : ""}</span>}
      </div>
    </div>
  );
}

export default function Phone() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const n = state.events.length;
  const activo = state.events.find(e => e.id === active) ?? null;

  return (
    <>
      {/* teléfono flotante */}
      <motion.button
        onClick={() => { setOpen(o => !o); setActive(null); }}
        className={`fixed bottom-4 right-4 z-40 flex flex-col items-center gap-0.5 border-2 px-3 py-2 transition-colors ${open ? "border-gold bg-gold/15" : "border-line2 bg-panel2 hover:border-gold2"}`}
        style={{ borderRadius: 14, boxShadow: "4px 4px 0 rgba(0,0,0,0.5)" }}
        whileTap={{ scale: 0.94 }}
        title="Teléfono: eventos y oportunidades">
        <div className={n > 0 && !open ? "anim-phone" : ""}>
          <I n="phone" className={`h-6 w-6 ${n > 0 ? "text-gold" : "text-sand"}`} />
        </div>
        <span className="font-cond text-[10px] uppercase tracking-widest text-mut">Móvil</span>
        {n > 0 && (
          <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-blood font-cond text-[11px] font-bold text-cream">
            {n}
          </span>
        )}
      </motion.button>

      {/* panel de mensajes */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="panel fixed bottom-24 right-4 z-40 flex max-h-[70vh] w-[min(94vw,380px)] flex-col overflow-hidden"
            style={{ borderRadius: 16 }}>
            <div className="flex items-center justify-between border-b border-line bg-panel2/70 px-4 py-2.5">
              <div className="font-display text-xl tracking-widest text-cream">MENSAJES</div>
              <div className="flex items-center gap-2 font-cond text-xs text-mut">
                <I n="clock" className="h-3.5 w-3.5" /> {n} pendiente(s)
                <button onClick={() => setOpen(false)} className="ml-1 text-mut hover:text-blood"><I n="x" className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-2.5 overflow-y-auto p-3">
              {n === 0 && (
                <div className="py-10 text-center">
                  <I n="phone" className="mx-auto h-8 w-8 text-line2" />
                  <p className="mt-2 font-cond text-sm text-mut">Sin mensajes. La ciudad te avisará cuando surja una oportunidad.</p>
                </div>
              )}
              {state.events.map(ev => (
                activo?.id === ev.id ? (
                  <EventCard key={ev.id} ev={ev} onClose={() => setActive(null)} />
                ) : (
                  <button key={ev.id} onClick={() => setActive(ev.id)}
                    className="w-full border border-line bg-ink p-3 text-left transition-colors hover:border-gold2">
                    <div className="flex items-center justify-between">
                      <span className="font-cond text-sm font-bold text-cream">{ev.titulo}</span>
                      <span className="font-cond text-[11px] text-mut">{ev.dias}d</span>
                    </div>
                    <div className="font-cond text-xs text-mut">{ev.de} · toca para responder</div>
                  </button>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
