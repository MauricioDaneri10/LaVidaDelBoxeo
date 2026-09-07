import { DIAS, MESES } from "../game/data";
import { fmt } from "../game/engine";
import { useGame } from "../game/state";
import { Btn, I } from "./ui";

export default function TopBar({ onAjustes, pulsoAvanzar }: { onAjustes: () => void; pulsoAvanzar: boolean }) {
  const { state, dispatch } = useGame();
  const finDeSemana = state.dia >= 6;

  const avanzar = () => dispatch({ type: "AVANZAR_DIA" });
  const semanaRapida = () => dispatch({ type: "SEMANA_RAPIDA" });

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        {/* marca */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center border-2 border-blood bg-blood/15 text-blood">
            <I n="glove" className="h-5 w-5" />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl tracking-[0.14em] text-gold">LA VIDA DEL BOXEO</div>
            <div className="font-cond text-[11px] uppercase tracking-[0.22em] text-mut">{state.nombreGimnasio} · Coach {state.nombreJugador}</div>
          </div>
        </div>

        {/* fecha */}
        <div className="flex items-center gap-2 border border-line bg-panel px-3 py-1.5">
          <I n="calendar" className="h-4 w-4 text-gold" />
          <div className="leading-tight">
            <div className={`font-display text-lg tracking-wide ${finDeSemana ? "text-blood" : "text-cream"}`}>
              {DIAS[state.dia - 1]} {state.dia === 6 ? "· Noche de Peleas" : state.dia === 7 ? "· Balance Semanal" : ""}
            </div>
            <div className="font-cond text-[11px] uppercase tracking-widest text-mut">
              Semana {state.semana} · {MESES[state.mes - 1]} {state.anio}
            </div>
          </div>
        </div>

        {/* dinero */}
        <div className="flex items-center gap-2 border border-line bg-panel px-3 py-1.5">
          <I n="coin" className="h-4 w-4 text-gold" />
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide text-gold">{fmt(state.dinero)}</div>
            <div className="font-cond text-[10px] uppercase tracking-widest text-mut">Cuenta del club</div>
          </div>
        </div>

        {/* fama */}
        <div className="flex items-center gap-2 border border-line bg-panel px-3 py-1.5">
          <I n="star" className="h-4 w-4 text-blood" />
          <div className="w-24 leading-tight">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl tracking-wide text-cream">{Math.round(state.fama)}</span>
              <span className="font-cond text-[10px] uppercase text-mut">Fama</span>
            </div>
            <div className="stat-bar"><i style={{ width: `${state.fama}%`, background: "var(--color-blood)" }} /></div>
          </div>
        </div>

        {state.patrocinio && (
          <div className="hidden items-center gap-1.5 border border-gold2/50 bg-gold/10 px-2.5 py-1 font-cond text-xs uppercase tracking-wide text-gold lg:flex">
            <I n="case" className="h-3.5 w-3.5" /> {state.patrocinio.nombre} · {state.patrocinio.semanas} sem
          </div>
        )}
        {state.legados > 0 && (
          <div className="hidden items-center gap-1.5 border border-neonc/50 bg-neonc/10 px-2.5 py-1 font-cond text-xs uppercase tracking-wide text-neonc md:flex">
            <I n="medal" className="h-3.5 w-3.5" /> Legado ×{state.legados}
          </div>
        )}

        {/* acciones de tiempo */}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onAjustes} title="Configuración y partidas"
            className="grid h-9 w-9 place-items-center border border-line bg-panel2 text-sand transition-colors hover:border-gold2 hover:text-gold">
            <I n="gear" className="h-4.5 w-4.5" />
          </button>
          {state.dia < 6 && (
            <Btn variant="ghost" small onClick={semanaRapida} className="hidden sm:inline-flex" disabled={state.dia === 7}>
              <I n="ff" className="h-4 w-4" /> Semana rápida
            </Btn>
          )}
          {state.dia === 7 ? (
            <Btn variant="gold" onClick={() => dispatch({ type: "CERRAR_DOMINGO" })} pulso>
              <I n="check" className="h-4 w-4" /> Empezar nueva semana
            </Btn>
          ) : (
            <Btn variant={state.dia === 6 ? "blood" : "gold"} onClick={avanzar} pulso={pulsoAvanzar || state.dia === 6}
              disabled={state.dia === 6 && state.pendientes.length > 0}>
              {state.dia === 6
                ? (state.pendientes.length > 0 ? "Resolvé la cartelera primero" : <><I n="play" className="h-4 w-4" /> Ir al Balance del Domingo</>)
                : <><I n="play" className="h-4 w-4" /> Cerrar el día</>}
            </Btn>
          )}
        </div>
      </div>
    </header>
  );
}
