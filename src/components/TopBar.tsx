import { motion } from "framer-motion";
import { DIAS, MESES, fmt } from "../game/data";
import { useGame } from "../game/state";
import { I } from "./ui";

export default function TopBar() {
  const { state, dispatch, nivel } = useGame();
  const esFinde = state.dia >= 6;
  const hayPeleas = state.fights.length > 0;
  const esperandoResumen = state.dia === 7 && !!state.resumen;

  const avanzar = () => {
    if (esperandoResumen || hayPeleas) return;
    dispatch({ type: "ADVANCE_DAY" });
  };
  const rapida = () => {
    if (esFinde || esperandoResumen || hayPeleas) return;
    dispatch({ type: "FAST_WEEK" });
  };

  const btnLabel = state.dia <= 5 ? "Cerrar el día" : state.dia === 6 ? "Ir al fin de semana" : "Nueva semana";

  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-ink2/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        {/* marca */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center border-2 border-blood bg-blood/15 text-blood hard-shadow-sm">
            <I n="glove" className="h-6 w-6" />
          </div>
          <div className="min-w-0 leading-none">
            <div className="font-display text-lg tracking-wider text-cream">
              LA VIDA <span className="text-blood">DEL</span> <span className="text-gold">BOXEO</span>
            </div>
            <div className="truncate font-cond text-[12px] uppercase tracking-widest text-mut">
              {state.nombreGimnasio} · Nivel {nivel}
              {state.legados > 0 && <span className="text-gold"> · Legado {state.legados}</span>}
            </div>
          </div>
        </div>

        {/* fecha */}
        <div className="flex items-center gap-2.5 border-l border-line pl-4">
          <I n="calendar" className="h-5 w-5 text-mut" />
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide" style={{ color: esFinde ? "var(--color-blood)" : "var(--color-cream)" }}>
              {DIAS[state.dia - 1]}
            </div>
            <div className="font-cond text-[12px] uppercase tracking-wider text-sand">
              Semana {state.semana} · {MESES[state.mes - 1]} · Año {state.anio}
            </div>
          </div>
          <div className="ml-1 hidden gap-1 sm:flex">
            {DIAS.map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-full transition-all"
                style={{ background: i + 1 === state.dia ? (i >= 5 ? "var(--color-blood)" : "var(--color-gold)") : i + 1 < state.dia ? "var(--color-line2)" : "var(--color-line)", transform: i + 1 === state.dia ? "scale(1.35)" : undefined }} />
            ))}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* dinero */}
          <div className="flex items-center gap-2">
            <I n="coin" className="h-5 w-5 text-gold" />
            <motion.span key={Math.round(state.dinero)} initial={{ y: -6, opacity: 0.3 }} animate={{ y: 0, opacity: 1 }}
              className="font-cond text-xl font-bold text-gold">{fmt(state.dinero)}</motion.span>
          </div>
          {/* fama */}
          <div className="hidden items-center gap-2 md:flex" title="Popularidad / Prestigio">
            <I n="star" className="h-5 w-5 text-blood" />
            <div className="w-24">
              <div className="flex justify-between font-cond text-[11px] uppercase tracking-wider text-sand">
                <span>Fama</span><span className="text-cream">{Math.round(state.fama)}</span>
              </div>
              <div className="stat-bar"><i style={{ width: `${state.fama}%`, background: "var(--color-blood)" }} /></div>
            </div>
          </div>

          {/* acciones de tiempo */}
          <div className="flex items-center gap-2">
            <button onClick={rapida} disabled={esFinde || esperandoResumen || hayPeleas}
              title="Avanzar rápido hasta el sábado"
              className="btn-poster border border-line2 bg-panel2 px-3 py-2 text-sm text-sand disabled:opacity-40">
              <span><I n="ff" className="h-4 w-4" /> Semana rápida</span>
            </button>
            <button onClick={avanzar} disabled={esperandoResumen || hayPeleas}
              className="btn-poster bg-blood px-5 py-2 text-lg text-cream border border-[#ff6b5e]/40">
              <span>
                <I n={state.dia === 6 ? "glove" : "play"} className="h-4 w-4" />
                {btnLabel}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ticker de noticias */}
      <div className="border-t border-line/70 bg-panel/80">
        <div className="mx-auto max-w-7xl px-4 py-1">
          <motion.div key={state.log[0] ?? "inicio"} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="anim-ticker flex items-center gap-2 font-cond text-[13px] text-sand">
            <I n="fire" className="h-3.5 w-3.5 shrink-0 text-gold" />
            <span className="truncate">{state.log[0] ?? "El gimnasio abre sus puertas..."}</span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
