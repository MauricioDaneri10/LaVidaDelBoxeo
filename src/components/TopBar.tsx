import { LOGOS_DISPONIBLES } from "../game/data";
import { useState, type ReactNode } from "react";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { fechaDelJuego, peleasVencidas } from "../game/engine";
import { useGame } from "../game/state";
import { Btn, I, Modal, TextoPaginado } from "./ui";
import { formatearDineroJuego as fmt, useMessages, formatearNumero } from "../i18n";
import { presentarEmblema, nombreDia, nombreMes } from "../i18n/presentation";

interface TopBarProps {
  errorGuardado?: ReactNode;
  onAjustes?: () => void;
  pulsoAvanzar?: boolean;
}

export default function TopBar({ onAjustes, pulsoAvanzar = false,errorGuardado }: TopBarProps) {
  const { t, locale } = useMessages();
  const { state, dispatch } = useGame();
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 950px)");
  const [estadoAbierto, setEstadoAbierto] = useState(false);
  const finDeSemana = state.dia >= 6;
  const fechaActual = fechaDelJuego(state.semana, state.dia);
  const carteleraPendiente = peleasVencidas(state).length > 0;

  const avanzar = () => dispatch({ type: "AVANZAR_DIA" });
  const semanaRapida = () => dispatch({ type: "SEMANA_RAPIDA" });

  // Selección de emblema del club (respetando catálogo local y fallback canónico)
  const logoActual = LOGOS_DISPONIBLES.find(l => l.id === state.logoGimnasio) || LOGOS_DISPONIBLES[0];
  const emblema = presentarEmblema(logoActual, locale);
  const dias = Array.from({ length: 7 }, (_, i) => nombreDia(i, locale));
  const mes = nombreMes(fechaActual.getMonth(), locale);
  const mejoras = [
    state.equipamiento.includes("soga") && t("top.rope"),
    state.equipamiento.includes("ringReglamentario") && t("top.ring"),
    state.equipamiento.includes("botiquin") && t("top.medical"),
    state.patrocinio && t("top.activeSponsor", { name: state.patrocinio.nombre }),
  ].filter(Boolean) as string[];

  if (compacto) return (
    <header className="shrink-0 border-b border-line bg-ink/90 p-2">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={() => setEstadoAbierto(true)} aria-label={t("top.open")} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line px-2 py-1 text-left">
          <span className="block font-cond text-sm text-cream">{`${dias[state.dia - 1].slice(0, 3)} ${fechaActual.getDate()} · ${fmt(state.dinero)}`}</span>
        </button>
        <button onClick={onAjustes} title={t("top.settings")} aria-label={t("top.settings")} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-line text-gold"><I n="gear" /></button>
        {errorGuardado}
        <Btn small variant="gold" onClick={() => state.dia === 7 ? dispatch({ type: "CERRAR_DOMINGO" }) : avanzar()} disabled={carteleraPendiente}>
          {t(state.dia === 7 ? "top.newWeek" : carteleraPendiente ? "top.pending" : "top.advance")}
        </Btn>
      </div>
      {estadoAbierto && <Modal title={t("top.status")} icon="ring" onClose={() => setEstadoAbierto(false)}>
        <div className="space-y-3 text-sm text-cream">
          <TextoPaginado capacidad={40} texto={[
            t("top.identity", { club: state.nombreGimnasio, coach: state.nombreJugador }),
            t("top.date", { day: dias[state.dia - 1], date: fechaActual.getDate(), week: state.semana, month: mes, year: fechaActual.getFullYear() }),
            t("top.account", { money: fmt(state.dinero), fame: Math.round(state.fama), followers: formatearNumero(state.seguidores, locale) }),
            `${emblema.nombre} · ${emblema.lema}`, ...mejoras, t("top.legacies", { count: state.legados }),
          ].join("\n\n")} />
          {state.dia < 6 && <Btn small variant="ghost" onClick={() => { semanaRapida(); setEstadoAbierto(false); }}>{t("top.fast")}</Btn>}
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
               title={`${emblema.nombre} — ${emblema.lema}`}>
            <span>{logoActual.emoji || "🥊"}</span>
          </div>
          <div className="leading-none">
            <div className="font-display text-xl tracking-[0.14em] text-gold flex items-center gap-2">
              <span>{state.nombreGimnasio || "LA VIDA DEL BOXEO"}</span>
            </div>
            <div className="font-cond text-[11px] uppercase tracking-[0.22em] text-mut mt-0.5">
              {t("top.identity", { club: emblema.nombre, coach: state.nombreJugador || t("top.principal") })}
            </div>
          </div>
        </div>

        {/* Calendario y Fecha Oficial */}
        <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-1.5 shadow-sm">
          <I n="calendar" className="h-4 w-4 text-gold" />
          <div className="leading-tight">
            <div className={`font-display text-lg tracking-wide ${finDeSemana ? "text-blood" : "text-cream"}`}>
              {dias[state.dia - 1]} {fechaActual.getDate()} · {t(state.dia === 6 ? "top.fightNight" : state.dia === 7 ? "top.weeklyBalance" : "top.preparation")}
            </div>
            <div className="font-cond text-[11px] uppercase tracking-widest text-mut">
              {t("top.week", { week: state.semana, month: mes, year: fechaActual.getFullYear() })}
            </div>
          </div>
        </div>

        {/* Tesorería y Fondos del Club */}
        <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-1.5 shadow-sm">
          <I n="coin" className="h-4 w-4 text-gold" />
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide text-gold">{fmt(state.dinero)}</div>
            <div className="font-cond text-xs uppercase tracking-widest text-mut">{t("top.funds")}</div>
          </div>
        </div>

        {/* Nivel de Prestigio & Fama */}
        <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-1.5 shadow-sm">
          <I n="star" className="h-4 w-4 text-blood" />
          <div className="w-24 leading-tight">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl tracking-wide text-cream">{Math.round(state.fama)}</span>
              <span className="font-cond text-xs uppercase text-mut">{t("top.fame")}</span>
            </div>
            <div className="stat-bar"><i style={{ width: `${state.fama}%`, background: "var(--color-blood)" }} /></div>
            <div className="mt-0.5 font-cond text-xs uppercase tracking-wide text-mut">{t("top.followers", { count: formatearNumero(state.seguidores, locale) })}</div>
          </div>
        </div>

        {/* Patrocinio Activo */}
        {state.patrocinio && (
          <div className="hidden items-center gap-1.5 border border-gold2/50 bg-gold/10 px-2.5 py-1 font-cond text-xs uppercase tracking-wide text-gold lg:flex shadow-sm">
            <I n="case" className="h-3.5 w-3.5" /> {t("top.sponsor", { name: state.patrocinio.nombre, weeks: state.patrocinio.semanas })}
          </div>
        )}

        {/* Legados Acumulados */}
        {state.legados > 0 && (
          <div className="hidden items-center gap-1.5 border border-neonc/50 bg-neonc/10 px-2.5 py-1 font-cond text-xs uppercase tracking-wide text-neonc md:flex shadow-sm">
            <I n="medal" className="h-3.5 w-3.5" /> {t("top.legacy", { count: state.legados })}
          </div>
        )}

        {/* Acciones de Flujo de Tiempo */}
        <div className="ml-auto flex items-center gap-2">
          {errorGuardado}
          {onAjustes && (
            <button onClick={onAjustes} title={t("top.settings")} aria-label={t("top.settings")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel2 text-sand transition-colors hover:border-gold2 hover:text-gold cursor-pointer">
              <I n="gear" className="h-4.5 w-4.5" />
            </button>
          )}

          {state.dia < 6 && (
            <Btn variant="ghost" small onClick={semanaRapida} className="hidden sm:inline-flex" disabled={state.dia === 7}>
              <I n="ff" className="h-4 w-4" /> {t("top.fast")}
            </Btn>
          )}

          {state.dia === 7 ? (
            <Btn variant="gold" onClick={() => dispatch({ type: "CERRAR_DOMINGO" })} pulso>
              <I n="check" className="h-4 w-4" /> {t("top.beginWeek")}
            </Btn>
          ) : (
            <Btn variant={state.dia === 6 ? "blood" : "gold"} onClick={avanzar} pulso={pulsoAvanzar || state.dia === 6}
              disabled={carteleraPendiente}>
              {state.dia === 6
                ? (carteleraPendiente ? t("top.resolve") : <><I n="play" className="h-4 w-4" /> {t("top.sunday")}</>)
                : <><I n="play" className="h-4 w-4" /> {t("top.advance")}</>}
            </Btn>
          )}
        </div>
      </div>
      {mejoras.length > 0 && (
        <div className="topbar-improvements mx-auto flex max-w-[1560px] flex-wrap items-center gap-2 border-t border-line/70 bg-gradient-to-r from-transparent via-gold/5 to-transparent px-4 py-1.5">
          <span className="font-cond text-xs font-bold uppercase tracking-wider text-mut">{t("top.improvements")}</span>
          {mejoras.map(m => <span key={m} className="rounded-full border border-gold2/50 bg-gold/10 px-2.5 py-0.5 font-cond text-xs text-gold">{m}</span>)}
        </div>
      )}
      <div className="mx-auto grid max-w-[1560px] grid-cols-7 gap-1 border-t border-line/60 bg-ink/40 px-4 py-1.5">
        {dias.map((dia, i) => {
          const numero = i + 1;
          const pelea = state.pendientes.some(p => (p.semanaProgramada ?? state.semana) === state.semana && (p.diaProgramado ?? 6) === numero);
          const etiqueta = t(numero <= 5 ? "top.preparation" : numero === 6 ? (pelea ? "top.fight" : "top.sparring") : "top.balance");
          return (
            <div key={dia} className={`min-w-0 rounded-md border px-1.5 py-0.5 text-center ${state.dia === numero ? "border-gold bg-gold/15 text-gold" : "border-line/60 text-mut"}`}>
              <div className="font-display text-xs uppercase tracking-wide">{dia.slice(0, 3)} {fechaDelJuego(state.semana, numero).getDate()}</div>
              <div className={`font-cond text-xs ${pelea ? "text-blood" : ""}`}>{etiqueta}</div>
            </div>
          );
        })}
      </div>
    </header>
  );
}

export { TopBar };
