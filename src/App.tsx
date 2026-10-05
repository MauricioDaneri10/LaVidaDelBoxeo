import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import BoxerSheet from "./components/BoxerSheet";
import CityMap from "./components/CityMap";
import CalendarioView from "./components/CalendarView";
import FightScreen from "./components/FightScreen";
import GymView from "./components/GymView";
import Intro from "./components/Intro";
import DockLateral, { type PestanaDock } from "./components/Phone";
import { ModalAjustes, PanelMercado, PanelPerfil, PanelPersonal, PanelPlantel } from "./components/panels";
import TopBar from "./components/TopBar";
import { Btn, ContenedorToast, I, Modal, TextoPaginado } from "./components/ui";
import { iniciarAudio, monedas } from "./game/audio";
import { OfferDetail } from "./components/OfferDetail";
import { WeeklyBalance } from "./components/WeeklyBalance";
import { PlanningDetail } from "./components/PlanningDetail";
import { puedeHabilitar, proyeccionSemanal, peleasVencidas } from "./game/engine";
import { cargarAtajos, guardarAtajos, teclaCoincide, type Atajos } from "./game/shortcuts";
import { GameProvider, useGame } from "./game/state";
import type { ResultadoPelea } from "./game/types";
import { dialogOpen } from "./ui/dialogs";
import { formatearDineroJuego as fmt, useMessages } from "./i18n";
import { presentarContenido } from "./i18n/content";
import { useResponsiveCapacity } from "./components/useResponsiveCapacity";

export type Pestana = "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal" | "calendario";

function PantallaPrincipal({errorGuardado}:{errorGuardado?:React.ReactNode}) {
  const { state, dispatch } = useGame();
  const { t,locale } = useMessages();
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 950px)");
  const [planificacionAbierta, setPlanificacionAbierta] = useState(false);
  const [panelClubAbierto, setPanelClubAbierto] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("gimnasio");
  const [pestanaDock, setPestanaDock] = useState<PestanaDock>("mensajes");
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState(false);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [carteleraAbierta, setCarteleraAbierta] = useState(false);
  const [atajos, setAtajos] = useState<Atajos>(() => cargarAtajos());
  const diaAnterior = useRef(state.dia);
  const [transicionDia, setTransicionDia] = useState(false);

  useEffect(() => {
    if (diaAnterior.current === state.dia) return;
    diaAnterior.current = state.dia;
    setTransicionDia(true);
    const timer = window.setTimeout(() => setTransicionDia(false), 1800);
    return () => window.clearTimeout(timer);
  }, [state.dia]);

  useEffect(() => { guardarAtajos(atajos); }, [atajos]);

  // Inicialización defensiva de Web Audio tras el primer gesto de usuario
  useEffect(() => {
    const activarAudio = () => {
      try {
        iniciarAudio();
      } catch (err) {
        console.warn("AudioContext no disponible:", err);
      }
    };
    window.addEventListener("pointerdown", activarAudio, { once: true });
    window.addEventListener("keydown", activarAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", activarAudio);
      window.removeEventListener("keydown", activarAudio);
    };
  }, []);

  const peleaActual = peleasVencidas(state).find(p => p.id === state.combateActivo?.pelea.id) ?? peleasVencidas(state)[0];
  const enCartelera = carteleraAbierta && state.dia === 6 && peleaActual;

  useEffect(() => {
    const manejarAtajo = (event: KeyboardEvent) => {
      if (dialogOpen()) return;
      const objetivo = event.target as HTMLElement | null;
      if (objetivo && ["INPUT", "TEXTAREA", "SELECT"].includes(objetivo.tagName)) return;
      if (teclaCoincide(event.key, atajos.cerrar)) {
        setFichaId(null);
        setAjustes(false);
        setCarteleraAbierta(false);
        return;
      }
      if (fichaId || ajustes || carteleraAbierta) return;
      const tecla = event.key.toLowerCase();
      const pantallas: Pestana[] = ["gimnasio", "ciudad", "plantel", "mercado", "perfil", "personal", "calendario"];
      const teclasPantalla: Array<keyof Atajos> = ["gimnasio", "ciudad", "plantel", "mercado", "perfil", "personal", "calendario"];
      const destino = pantallas.findIndex((_, i) => teclaCoincide(tecla, atajos[teclasPantalla[i]]));
      if (destino >= 0 && destino < pantallas.length) {
        setPestana(pantallas[destino]);
      } else if (teclaCoincide(tecla, atajos.avanzar) || teclaCoincide(event.key, atajos.avanzar)) {
        event.preventDefault();
        if (!peleasVencidas(state).length) dispatch({ type: "AVANZAR_DIA" });
      } else if (teclaCoincide(tecla, atajos.semanaRapida) && state.dia < 7) {
        dispatch({ type: "SEMANA_RAPIDA" });
      }
    };
    window.addEventListener("keydown", manejarAtajo);
    return () => window.removeEventListener("keydown", manejarAtajo);
  }, [ajustes, atajos, carteleraAbierta, fichaId, state.dia, state.semana, state.pendientes]);

  const alTerminarPelea = (r: ResultadoPelea) => {
    if (peleaActual) {
      if (r.gane) {
        try {
          monedas();
        } catch {}
      }
      dispatch({ type: "RESOLVER_PELEA", peleaId: peleaActual.id, resultado: r });
      setCarteleraAbierta(false);
    }
  };

  const buscarRival = (id: string) => {
    dispatch({ type: "BUSCAR_RIVAL", id });
    setSelectorAbierto(true);
  };

  const primerAlumnoListo = state.plantel.find(p => puedeHabilitar(p, state));
  const proyeccion = proyeccionSemanal(state);
  const ingresosEstimados = proyeccion.ingresos.reduce((total, l) => total + l.monto, 0);
  const adicionalesEstimados = proyeccion.estimados.reduce((total, l) => total + l.mean, 0);
  const gastosEstimados = proyeccion.gastos.reduce((total, l) => total + l.monto, 0);
  const balanceEstimado = proyeccion.total;
  const progresoGuia = state.guiaClub;
  const tieneEnfoqueInicial = progresoGuia?.enfoques ?? false;
  const guiaInicial = [
    { texto: t("guide.focus"), hecho: tieneEnfoqueInicial, tab: "plantel" as Pestana },
    { texto: t("guide.gear"), hecho: progresoGuia?.equipo ?? false, tab: "mercado" as Pestana },
    { texto: t("guide.spar"), hecho: progresoGuia?.guanteos ?? false, tab: "plantel" as Pestana },
    { texto: t("guide.licence"), hecho: progresoGuia?.licencia ?? false, tab: "plantel" as Pestana },
  ];
  const siguientePaso = !tieneEnfoqueInicial
    ? { texto: t("guide.chooseFocus"), boton: t("guide.openRoster"), tab: "plantel" as Pestana }
    : !progresoGuia?.equipo
      ? { texto: t("guide.equip"), boton: t("guide.openMarket"), tab: "mercado" as Pestana }
      : !progresoGuia?.guanteos
        ? { texto: t("guide.completeSpar"), boton: t("guide.openRoster"), tab: "plantel" as Pestana }
        : !state.cursos.includes("dt")
          ? { texto: t("guide.coachLicence"), boton: t("guide.openProfile"), tab: "perfil" as Pestana }
          : progresoGuia?.licencia
            ? { texto: t("guide.calendar"), boton: t("guide.openCalendar"), tab: "calendario" as Pestana }
            : primerAlumnoListo
              ? { texto: t("guide.ready",{name:primerAlumnoListo.nombre}), boton: t("guide.openRoster"), tab: "plantel" as Pestana }
              : null;

  const pestanas: { id: Pestana; nombre: string; icono: string; pulso: boolean }[] = [
    { id: "gimnasio", nombre: t("nav.gym"), icono: "ring", pulso: false },
    { id: "ciudad", nombre: t("nav.city"), icono: "map", pulso: false },
    {
      id: "plantel",
      nombre: t("nav.roster"),
      icono: "glove",
      pulso:
        state.dia <= 5 &&
        state.plantel.some(
          p => puedeHabilitar(p, state)
        ),
    },
    { id: "mercado", nombre: t("nav.market"), icono: "cart", pulso: false },
    { id: "perfil", nombre: t("nav.profile"), icono: "cap", pulso: false },
    { id: "personal", nombre: t("nav.staff"), icono: "users", pulso: false },
    { id: "calendario", nombre: t("nav.calendar"), icono: "calendar", pulso: state.pendientes.length > 0 },
  ];

  return (
    <div className="fondo-app flex h-dvh min-h-0 flex-col overflow-hidden select-none">
      {/* BARRA SUPERIOR DE ESTADO Y CABECERA */}
      <TopBar
        errorGuardado={errorGuardado}
        onAjustes={() => setAjustes(true)}
        pulsoAvanzar={state.dia === 6 && state.pendientes.length > 0}
      />

      <AnimatePresence>
        {transicionDia && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-xl border border-gold2/70 bg-panel2/95 px-5 py-2 text-center shadow-2xl backdrop-blur-md"
          >
            <div className="font-display text-sm uppercase tracking-wide text-gold">{t("transition.updated")}</div>
            <div className="font-cond text-xs text-sand">
              {t(state.dia === 6 ? "transition.saturday" : state.dia === 7 ? "transition.sunday" : "transition.preparation")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex min-h-0 w-full flex-1 gap-4 overflow-hidden px-4 py-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* NAVEGACIÓN PRINCIPAL ENTRE LAS 6 PESTAÑAS */}
          <nav className="app-nav relative z-30 mb-3 flex shrink-0 flex-wrap gap-1.5 border border-gold2/20 bg-ink/82 p-1.5 shadow-[0_12px_28px_rgba(0,0,0,.22)] backdrop-blur-xl rounded-2xl">
            {compacto ? (
              <select aria-label={t("nav.choose")} value={pestana} onChange={event => {
                event.currentTarget.focus();
                const value = event.target.value;
                if (value === "contexto-plan") setPlanificacionAbierta(true);
                else if (value === "contexto-club") setPanelClubAbierto(true);
                else if (value === "contexto-ofertas") setSelectorAbierto(true);
                else if (value === "contexto-cartelera") setCarteleraAbierta(true);
                else setPestana(value as Pestana);
              }} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-panel2 px-3 text-sm text-cream">
                {pestanas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                <optgroup label={t("club.management")}>
                  <option value="contexto-plan">{t("plan.access", { completed: guiaInicial.filter(h => h.hecho).length, total: 4 })}</option>
                  <option value="contexto-club">{t("club.panel")}</option>
                  {state.ofertas.length > 0 && state.ofertasPara && <option value="contexto-ofertas">{t("offers.reopen")}</option>}
                  {state.dia === 6 && state.pendientes.length > 0 && <option value="contexto-cartelera">{t("schedule.pending", { count: state.pendientes.length })}</option>}
                </optgroup>
              </select>
            ) : pestanas.map(p => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                    className={`btn-poster relative px-3 py-1.5 text-sm sm:text-base cursor-pointer rounded-lg ${
                  pestana === p.id
                    ? "border border-gold2/70 bg-gold text-ink font-bold shadow-md"
                    : "border border-transparent bg-panel2 text-sand hover:text-cream"
                } ${p.pulso && pestana !== p.id ? "guia-luminica" : ""}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <I n={p.icono} className="h-4 w-4" /> {p.nombre}
                </span>
                {p.id === "plantel" && state.pendientes.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center bg-blood px-1 font-cond text-[10px] text-cream rounded-full">
                    {state.pendientes.length}
                  </span>
                )}
              </button>
            ))}

            {!compacto && state.ofertas.length > 0 && state.ofertasPara && (
              <Btn small variant="ghost" onClick={() => setSelectorAbierto(true)}>{t("offers.reopen")}</Btn>
            )}

            {/* AVISO / BOTÓN DE CARTELERA DEL SÁBADO */}
            {!compacto && state.dia === 6 && state.pendientes.length > 0 && (
              <button
                onClick={() => setCarteleraAbierta(true)}
                className="btn-poster guia-luminica ml-auto border border-blood bg-blood px-4 py-1 text-sm sm:text-base text-cream rounded-lg cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5 anim-latido">
                  <I n="bell" className="h-4 w-4" /> {t("schedule.night",{count:state.pendientes.length})}
                </span>
              </button>
            )}

            {!compacto && state.dia === 6 && state.pendientes.length === 0 && (
              <span className="ml-auto flex items-center gap-2 px-3 font-cond text-sm uppercase tracking-wide text-sand">
                <I n="check" className="h-4 w-4 text-win" /> {t("schedule.done")}
              </span>
            )}
          </nav>

          {!compacto && siguientePaso && state.dia <= 5 && (
            <div className="action-banner mb-2 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-gold2/60 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent px-2 py-1.5 shadow-sm">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-sm text-ink font-bold">→</div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xs uppercase tracking-wide text-gold">{t("guide.next")}</div>
                <p className="font-cond text-xs text-cream">{siguientePaso.texto}</p>
              </div>
              <Btn small variant="gold" onClick={() => setPestana(siguientePaso.tab)}>{siguientePaso.boton}</Btn>
            </div>
          )}
          {!compacto && !guiaInicial.every(h => h.hecho) && (
            <div className="mb-2 shrink-0 rounded-xl border border-line bg-panel/80 px-2 py-1.5">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="font-display text-xs uppercase tracking-wide text-cream">{t("guide.title")}</span>
                <span className="font-cond text-xs text-mut">{t("guide.completed",{count:guiaInicial.filter(h=>h.hecho).length})}</span>
              </div>
              <div className="guide-steps grid gap-1 sm:grid-cols-4">
                {guiaInicial.map((h, i) => (
                  <button key={h.texto} onClick={() => !h.hecho && setPestana(h.tab)} disabled={h.hecho}
                    className={`rounded-lg border px-2 py-1.5 text-left font-cond text-[11px] leading-tight transition-colors ${h.hecho ? "border-win/40 bg-win/5 text-win" : "border-line2 bg-panel2 text-sand hover:border-gold2 hover:text-gold"}`}>
                    <span className="mr-1.5 font-display">{h.hecho ? "✓" : i + 1}</span>{h.texto}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!compacto && state.dia <= 5 && (
            <div className="forecast-strip mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line bg-panel/70 px-4 py-2.5 font-cond text-sm">
              <span className="font-display uppercase tracking-wide text-sand">{t("forecast.title")}</span>
              <span className="text-win" title={t("forecast.guard")}>{t("forecast.income",{amount:fmt(ingresosEstimados)})}</span>
              {proyeccion.estimados.length > 0 && <span className="text-gold" title={proyeccion.estimados.map(l => t("forecast.range",{label:presentarContenido(l.concepto,l.presentacion,locale).texto,min:fmt(l.min),max:fmt(l.max),mean:fmt(l.mean)})).join("\n")}>{t("forecast.variables",{amount:fmt(adicionalesEstimados)})}</span>}
              <span className="text-blood">{t("forecast.expenses",{amount:fmt(gastosEstimados)})}</span>
              <span className={balanceEstimado >= 0 ? "text-gold font-bold" : "text-blood font-bold"}>
                {t(balanceEstimado >= 0 ? "forecast.plus" : "forecast.minus")} {balanceEstimado >= 0 ? "+" : "−"}{fmt(Math.abs(balanceEstimado))}
              </span>
              <span className="text-mut">{t("forecast.disclosure")}</span>
            </div>
          )}

          {/* ESCENARIO / VISTA CENTRAL CON TRANSICIONES FLUIDAS */}
          <main className="app-main min-h-0 flex-1 overflow-hidden">
              {pestana === "gimnasio" && <GymView onAbrir={setFichaId} onSeleccionarBoxeador={(b) => setFichaId(b.id)} />}
              {pestana === "ciudad" && <CityMap onIrAPestaña={(tab) => setPestana(tab as Pestana)} />}
              {pestana === "plantel" && (
                <PanelPlantel
                  onAbrir={setFichaId}
                  onBuscarRival={buscarRival}
                  onSeleccionarBoxeador={(b) => setFichaId(b.id)}
                />
              )}
              {pestana === "mercado" && <PanelMercado />}
              {pestana === "perfil" && <PanelPerfil />}
              {pestana === "personal" && <PanelPersonal />}
              {pestana === "calendario" && <CalendarioView />}
          </main>
        </div>

        {/* DOCK LATERAL DEL TELÉFONO (PANTALLAS ANCHAS) */}
        <div className="hidden h-full min-h-0 xl:block">
          <DockLateral pestana={pestanaDock} setPestana={setPestanaDock} lado="escritorio" onNavegarPestana={setPestana} onSeleccionarBoxeador={setFichaId} />
        </div>
      </div>

      {/* DOCK COMPACTO EN DISPOSITIVOS MÓVILES */}
      <div className="z-30 xl:hidden">
        <DockLateral pestana={pestanaDock} setPestana={setPestanaDock} lado="movil" abierto={panelClubAbierto} onCerrar={() => setPanelClubAbierto(false)} accesoEnNavegacion={compacto} onNavegarPestana={setPestana} onSeleccionarBoxeador={setFichaId} />
      </div>

      <ContenedorToast toasts={state.toasts} onCerrar={(id)=>dispatch({type:"QUITAR_TOAST",id})}/>
      <footer data-text-role="secondary" className="app-footer shrink-0 border-t border-line/80 px-4 py-1 text-center font-cond text-xs uppercase tracking-[0.28em] text-mut">
        MadArt Studios
      </footer>

      {planificacionAbierta && <Modal wide fit title={t("plan.title")} icon="calendar" onClose={() => setPlanificacionAbierta(false)}>
        <PlanningDetail steps={guiaInicial} projection={proyeccion} onOpen={tab=>{setPestana(tab);setPlanificacionAbierta(false);}}/>
      </Modal>}

      {/* PANTALLA DE COMBATE EN VIVO */}
      {enCartelera && peleaActual && (
        <FightScreen
          key={peleaActual.id}
          pelea={peleaActual}
          onTerminar={alTerminarPelea}
        />
      )}

      {/* Presentation state is separate from the saved offers and R3 regeneration. */}
      {selectorAbierto && state.ofertas.length > 0 && state.ofertasPara && <Modal wide fit title={t("offer.title")} icon="target" onClose={()=>setSelectorAbierto(false)}>
        <OfferDetail/>
      </Modal>}

      {/* BALANCE SEMANAL DEL DOMINGO */}
      {state.resumen && <WeeklyBalance/>}
      {/* FICHA TÉCNICA DEL ATLETA */}
      {fichaId && (
        <BoxerSheet
          id={fichaId}
          onCerrar={() => setFichaId(null)}
          onCambiarBoxeador={setFichaId}
          onBuscarRival={buscarRival}
          onIrAPestana={(tab) => { setFichaId(null); setPestana(tab); }}
        />
      )}

      {/* AJUSTES & PERSISTENCIA JSON */}
      {ajustes && <ModalAjustes onCerrar={() => setAjustes(false)} atajos={atajos} onCambiarAtajos={setAtajos} />}

    </div>
  );
}

function Raiz() {
  const { t,locale } = useMessages();
  const { state, guardado, reintentarGuardado } = useGame();
  const [detalle,setDetalle]=useState(false);
  const horizontal=useResponsiveCapacity("(max-height: 500px)");
  const aviso=!guardado.ok&&<div role="alert" data-testid="save-error" className="shrink-0"><button
    className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-blood bg-blood text-cream"
    title={t("save.failedBrief")} aria-label={`${t("save.failedBrief")} · ${t("action.detail")}`} onClick={()=>setDetalle(true)}>!</button></div>;
  return <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
    {!state.creado&&aviso&&<div className="shrink-0 px-2 py-1">{aviso}</div>}
    <div className="game-host min-h-0 flex-1 overflow-hidden">{state.creado ? <PantallaPrincipal errorGuardado={aviso||undefined}/> : <Intro />}</div>
    {!guardado.ok&&detalle&&<Modal fit title={t("save.failedBrief")} onClose={()=>setDetalle(false)}><div className="bounded-detail">
      <TextoPaginado capacidad={horizontal?20:40} texto={presentarContenido(guardado.mensaje,guardado.presentacion,locale).texto}/>
      <Btn small onClick={reintentarGuardado}>{t("save.retry")}</Btn>
    </div></Modal>}
  </div>;
}

export default function App() {
  return (
    <GameProvider>
      <Raiz />
    </GameProvider>
  );
}
