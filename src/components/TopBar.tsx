import { DIAS, LOGOS_DISPONIBLES, MESES } from "../game/data";
import { useState } from "react";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { fechaDelJuego, fmt, peleasVencidas } from "../game/engine";
import { useGame } from "../game/state";
import { Btn, I, Modal } from "./ui";

interface TopBarProps {
  onAjustes?: () => void;
  pulsoAvanzar?: boolean;
}

export default function TopBar({ onAjustes, pulsoAvanzar = false }: TopBarProps) {
  const { state, dispatch } = useGame();
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 650px)");
  const [estadoAbierto, setEstadoAbierto] = useState(false);
  const finDeSemana = state.dia >= 6;
  const fechaActual = fechaDelJuego(state.semana, state.dia);
  const carteleraPendiente = peleasVencidas(state).length > 0;

  const avanzar = () => dispatch({ type: "AVANZAR_DIA" });
  const semanaRapida = () => dispatch({ type: "SEMANA_RAPIDA" });

  // Selección de emblema del club (respetando catálogo local y fallback canónico)
  const logoActual = LOGOS_DISPONIBLES.find(l => l.id === state.logoGimnasio) || LOGOS_DISPONIBLES[0];
  const mejoras = [
    state.equipamiento.includes("soga") && "Soga · +15% resistencia",
    state.equipamiento.includes("ringReglamentario") && "Ring · +25% técnica/defensa",
    state.equipamiento.includes("botiquin") && "Botiquín · +6 energía semanal",
    state.patrocinio && `${state.patrocinio.nombre} · patrocinio activo`,
  ].filter(Boolean) as string[];

  if (compacto) return (
    <header className="shrink-0 border-b border-line bg-ink/90 p-2">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={() => setEstadoAbierto(true)} aria-label="Ver estado del club" className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1 text-left">
          <span className="block truncate font-display text-sm text-gold">{state.nombreGimnasio || "La Vida del Boxeo"}</span>
          <span className="block font-cond text-sm text-cream">{DIAS[state.dia - 1].slice(0, 3)} {fechaActual.getDate()} · {fmt(state.dinero)}</span>
        </button>
        <button onClick={onAjustes} title="Configuración y partidas" aria-label="Configuración y partidas" className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-line text-gold"><I n="gear" /></button>
        <Btn small variant="gold" onClick={() => state.dia === 7 ? dispatch({ type: "CERRAR_DOMINGO" }) : avanzar()} disabled={carteleraPendiente}>
          {state.dia === 7 ? "Nueva semana" : carteleraPendiente ? "Cartelera pendiente" : "Avanzar día"}
        </Btn>
      </div>
      {estadoAbierto && <Modal title="Estado del club" icon="ring" onClose={() => setEstadoAbierto(false)}>
        <div className="space-y-3 text-sm text-cream">
          <p className="break-words">{state.nombreGimnasio} · Coach {state.nombreJugador}</p>
          <p>{DIAS[state.dia - 1]} {fechaActual.getDate()} · Semana {state.semana} · {MESES[fechaActual.getMonth()]} {fechaActual.getFullYear()}</p>
          <p>Cuenta del club: {fmt(state.dinero)} · Fama: {Math.round(state.fama)} · Seguidores: {state.seguidores.toLocaleString("es-AR")}</p>
          <p>{logoActual.nombre} · {logoActual.lema}</p>
          {mejoras.map(m => <p key={m}>{m}</p>)}
          <p>Legados: {state.legados}</p>
          {state.dia < 6 && <Btn small variant="ghost" onClick={() => { semanaRapida(); setEstadoAbierto(false); }}>Semana rápida</Btn>}
        </div>
      </Modal>}
    </header>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/90 shadow-[0_12px_32px_rgba(0,0,0,.28)] backdrop-blur-xl select-none">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        {/* Marca e Identidad del Club con Emblema */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-blood bg-blood/15 text-blood text-xl shadow-md"
               title={`${logoActual.nombre} — ${logoActual.lema}`}>
            <span>{logoActual.emoji || "🥊"}</span>
          </div>
          <div className="leading-none">
            <div className="font-display text-xl tracking-[0.14em] text-gold flex items-center gap-2">
              <span>{state.nombreGimnasio || "LA VIDA DEL BOXEO"}</span>
            </div>
            <div className="font-cond text-[11px] uppercase tracking-[0.22em] text-mut mt-0.5">
              Coach {state.nombreJugador || "Principal"} · {logoActual.nombre}
            </div>
          </div>
        </div>

        {/* Calendario y Fecha Oficial */}
        <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-1.5 shadow-sm">
          <I n="calendar" className="h-4 w-4 text-gold" />
          <div className="leading-tight">
            <div className={`font-display text-lg tracking-wide ${finDeSemana ? "text-blood" : "text-cream"}`}>
              {DIAS[state.dia - 1]} {fechaActual.getDate()} · {state.dia === 6 ? "Noche de peleas" : state.dia === 7 ? "Balance semanal" : "Preparación"}
            </div>
            <div className="font-cond text-[11px] uppercase tracking-widest text-mut">
              Semana {state.semana} · {MESES[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </div>
          </div>
        </div>

        {/* Tesorería y Fondos del Club */}
        <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-1.5 shadow-sm">
          <I n="coin" className="h-4 w-4 text-gold" />
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide text-gold">{fmt(state.dinero)}</div>
            <div className="font-cond text-[10px] uppercase tracking-widest text-mut">Cuenta del club</div>
          </div>
        </div>

        {/* Nivel de Prestigio & Fama */}
        <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-1.5 shadow-sm">
          <I n="star" className="h-4 w-4 text-blood" />
          <div className="w-24 leading-tight">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl tracking-wide text-cream">{Math.round(state.fama)}</span>
              <span className="font-cond text-[10px] uppercase text-mut">Fama</span>
            </div>
            <div className="stat-bar"><i style={{ width: `${state.fama}%`, background: "var(--color-blood)" }} /></div>
            <div className="mt-0.5 font-cond text-[9px] uppercase tracking-wide text-mut">Seguidores {state.seguidores.toLocaleString("es-AR")}</div>
          </div>
        </div>

        {/* Patrocinio Activo */}
        {state.patrocinio && (
          <div className="hidden items-center gap-1.5 border border-gold2/50 bg-gold/10 px-2.5 py-1 font-cond text-xs uppercase tracking-wide text-gold lg:flex shadow-sm">
            <I n="case" className="h-3.5 w-3.5" /> {state.patrocinio.nombre} · {state.patrocinio.semanas} sem
          </div>
        )}

        {/* Legados Acumulados */}
        {state.legados > 0 && (
          <div className="hidden items-center gap-1.5 border border-neonc/50 bg-neonc/10 px-2.5 py-1 font-cond text-xs uppercase tracking-wide text-neonc md:flex shadow-sm">
            <I n="medal" className="h-3.5 w-3.5" /> Legado ×{state.legados}
          </div>
        )}

        {/* Acciones de Flujo de Tiempo */}
        <div className="ml-auto flex items-center gap-2">
          {onAjustes && (
            <button onClick={onAjustes} title="Configuración y partidas"
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel2 text-sand transition-colors hover:border-gold2 hover:text-gold cursor-pointer">
              <I n="gear" className="h-4.5 w-4.5" />
            </button>
          )}

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
              disabled={carteleraPendiente}>
              {state.dia === 6
                ? (carteleraPendiente ? "Resolvé la cartelera primero" : <><I n="play" className="h-4 w-4" /> Ir al Balance del Domingo</>)
                : <><I n="play" className="h-4 w-4" /> Avanzar día</>}
            </Btn>
          )}
        </div>
      </div>
      {mejoras.length > 0 && (
        <div className="topbar-improvements mx-auto flex max-w-[1560px] flex-wrap items-center gap-2 border-t border-line/70 bg-gradient-to-r from-transparent via-gold/5 to-transparent px-4 py-1.5">
          <span className="font-cond text-[11px] font-bold uppercase tracking-wider text-mut">Mejoras activas</span>
          {mejoras.map(m => <span key={m} className="rounded-full border border-gold2/50 bg-gold/10 px-2.5 py-0.5 font-cond text-xs text-gold">{m}</span>)}
        </div>
      )}
      <div className="mx-auto grid max-w-[1560px] grid-cols-7 gap-1 border-t border-line/60 bg-ink/40 px-4 py-1.5">
        {DIAS.map((dia, i) => {
          const numero = i + 1;
          const pelea = state.pendientes.some(p => (p.semanaProgramada ?? state.semana) === state.semana && (p.diaProgramado ?? 6) === numero);
          const etiqueta = numero <= 5 ? "Entreno" : numero === 6 ? (pelea ? "Pelea" : "Guanteo") : "Balance";
          return (
            <div key={dia} className={`min-w-0 rounded-md border px-1.5 py-0.5 text-center ${state.dia === numero ? "border-gold bg-gold/15 text-gold" : "border-line/60 text-mut"}`}>
              <div className="font-display text-[10px] uppercase tracking-wide">{dia.slice(0, 3)} {fechaDelJuego(state.semana, numero).getDate()}</div>
              <div className={`truncate font-cond text-[9px] ${pelea ? "text-blood" : ""}`}>{numero <= 5 ? "Preparación" : etiqueta}</div>
            </div>
          );
        })}
      </div>
    </header>
  );
}

export { TopBar };
