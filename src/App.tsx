import { useEffect, useState } from "react";
import BoxerSheet from "./components/BoxerSheet";
import CityMap from "./components/CityMap";
import FightScreen from "./components/FightScreen";
import GymView from "./components/GymView";
import Intro from "./components/Intro";
import DockLateral, { type PestanaDock } from "./components/Phone";
import { ModalAjustes, PanelMercado, PanelPerfil, PanelPersonal, PanelPlantel } from "./components/panels";
import TopBar from "./components/TopBar";
import { Btn, Chip, ContenedorToast, I, Modal } from "./components/ui";
import { iniciarAudio, monedas } from "./game/audio";
import { PERSONAL_INFO, TITULOS } from "./game/data";
import { alumnosActivos, fmt, nivelGimnasio, puedeHabilitar, valoracion } from "./game/engine";
import { cargarAtajos, guardarAtajos, teclaCoincide, type Atajos } from "./game/shortcuts";
import { GameProvider, useGame } from "./game/state";
import type { ResultadoPelea } from "./game/types";

export type Pestana = "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal";

function PantallaPrincipal() {
  const { state, dispatch } = useGame();
  const [pestana, setPestana] = useState<Pestana>("gimnasio");
  const [pestanaDock, setPestanaDock] = useState<PestanaDock>("mensajes");
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState(false);
  const [carteleraAbierta, setCarteleraAbierta] = useState(false);
  const [atajos, setAtajos] = useState<Atajos>(() => cargarAtajos());

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

  const peleaActual = state.pendientes[0];
  const enCartelera = carteleraAbierta && state.dia === 6 && peleaActual;

  useEffect(() => {
    const manejarAtajo = (event: KeyboardEvent) => {
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
      const pantallas: Pestana[] = ["gimnasio", "ciudad", "plantel", "mercado", "perfil", "personal"];
      const teclasPantalla: Array<keyof Atajos> = ["gimnasio", "ciudad", "plantel", "mercado", "perfil", "personal"];
      const destino = pantallas.findIndex((_, i) => teclaCoincide(tecla, atajos[teclasPantalla[i]]));
      if (destino >= 0 && destino < pantallas.length) {
        setPestana(pantallas[destino]);
      } else if (teclaCoincide(tecla, atajos.avanzar) || teclaCoincide(event.key, atajos.avanzar)) {
        event.preventDefault();
        if (state.dia < 6 || state.pendientes.length === 0) dispatch({ type: "AVANZAR_DIA" });
      } else if (teclaCoincide(tecla, atajos.semanaRapida) && state.dia < 6) {
        dispatch({ type: "SEMANA_RAPIDA" });
      }
    };
    window.addEventListener("keydown", manejarAtajo);
    return () => window.removeEventListener("keydown", manejarAtajo);
  }, [ajustes, atajos, carteleraAbierta, fichaId, state.dia, state.pendientes.length]);

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

  const resolverOferta = (ofertaId: string) => dispatch({ type: "ELEGIR_OFERTA", ofertaId });

  const primerAlumnoListo = state.plantel.find(p => puedeHabilitar(p, state));
  const ingresosEstimados = alumnosActivos(state).length * (18 + 2 * (nivelGimnasio(state) - 1))
    + state.plantel.filter(p => p.rol === "boxeador").length * 12 + (state.patrocinio?.semanal ?? 0);
  const gastosEstimados = 150 + state.personal.reduce((total, p) => total + (PERSONAL_INFO[p.tipo]?.sueldo ?? 0), 0);
  const balanceEstimado = ingresosEstimados - gastosEstimados;
  const guiaInicial = [
    { texto: "Equipar el gimnasio", hecho: state.equipamiento.length > 0, tab: "mercado" as Pestana },
    { texto: "Elegir un enfoque de entrenamiento", hecho: state.plantel.some(p => p.rol === "alumno" && p.combo !== "acondicionamiento"), tab: "plantel" as Pestana },
    { texto: "Completar prácticas de combate", hecho: state.plantel.some(p => p.rol === "alumno" && p.fogueo > 0), tab: "plantel" as Pestana },
    { texto: "Habilitar al primer boxeador", hecho: state.plantel.some(p => p.rol === "boxeador"), tab: "plantel" as Pestana },
  ];
  const siguientePaso = !state.equipamiento.length
    ? { texto: "Empezá por equipar el gimnasio: una mejora activa beneficios para toda la semana.", boton: "Abrir Mercado", tab: "mercado" as Pestana }
    : !state.cursos.includes("dt")
      ? { texto: "Obtené la Licencia de Entrenador del club para poder registrar atletas.", boton: "Ir a Mi Perfil", tab: "perfil" as Pestana }
      : primerAlumnoListo
        ? { texto: `${primerAlumnoListo.nombre} ya está listo: abrí su ficha y habilitalo para competir.`, boton: "Abrir Plantel", tab: "plantel" as Pestana }
        : null;

  const pestanas: { id: Pestana; nombre: string; icono: string; pulso: boolean }[] = [
    { id: "gimnasio", nombre: "Gimnasio", icono: "ring", pulso: false },
    { id: "ciudad", nombre: "Ciudad", icono: "map", pulso: false },
    {
      id: "plantel",
      nombre: "Plantel",
      icono: "glove",
      pulso:
        state.dia <= 5 &&
        state.plantel.some(
          p => puedeHabilitar(p, state)
        ),
    },
    { id: "mercado", nombre: "Mercado", icono: "cart", pulso: false },
    { id: "perfil", nombre: "Mi Perfil", icono: "cap", pulso: false },
    { id: "personal", nombre: "Personal", icono: "users", pulso: false },
  ];

  return (
    <div className="fondo-app h-screen overflow-hidden select-none">
      {/* BARRA SUPERIOR DE ESTADO Y CABECERA */}
      <TopBar
        onAjustes={() => setAjustes(true)}
        pulsoAvanzar={state.dia === 6 && state.pendientes.length > 0}
      />

      <div className="mx-auto flex h-[calc(100vh-126px)] min-h-0 max-w-[1560px] gap-4 overflow-hidden px-4 py-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* NAVEGACIÓN PRINCIPAL ENTRE LAS 6 PESTAÑAS */}
          <nav className="app-nav relative z-30 mb-4 flex flex-wrap gap-1.5 border border-gold2/20 bg-ink/82 p-1.5 shadow-[0_12px_28px_rgba(0,0,0,.22)] backdrop-blur-xl rounded-2xl lg:sticky lg:top-[102px]">
            {pestanas.map(p => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                className={`btn-poster relative px-3.5 py-1.5 text-sm sm:text-base cursor-pointer rounded-lg ${
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

            {/* AVISO / BOTÓN DE CARTELERA DEL SÁBADO */}
            {state.dia === 6 && state.pendientes.length > 0 && (
              <button
                onClick={() => setCarteleraAbierta(true)}
                className="btn-poster guia-luminica ml-auto border border-blood bg-blood px-4 py-1 text-sm sm:text-base text-cream rounded-lg cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5 anim-latido">
                  <I n="bell" className="h-4 w-4" /> Noche de peleas · {state.pendientes.length} en cartelera
                </span>
              </button>
            )}

            {state.dia === 6 && state.pendientes.length === 0 && (
              <span className="ml-auto flex items-center gap-2 px-3 font-cond text-sm uppercase tracking-wide text-sand">
                <I n="check" className="h-4 w-4 text-win" /> Cartelera resuelta · pasá al balance
              </span>
            )}
          </nav>

          {siguientePaso && state.dia <= 5 && (
            <div className="action-banner mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gold2/60 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent px-4 py-3 shadow-sm">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-ink font-bold">→</div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm uppercase tracking-wide text-gold">Siguiente paso</div>
                <p className="font-cond text-sm text-cream">{siguientePaso.texto}</p>
              </div>
              <Btn small variant="gold" onClick={() => setPestana(siguientePaso.tab)}>{siguientePaso.boton}</Btn>
            </div>
          )}
          {state.semana === 1 && !guiaInicial.every(h => h.hecho) && (
            <div className="mb-4 rounded-2xl border border-line bg-panel/80 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-display text-sm uppercase tracking-wide text-cream">Primeros pasos del club</span>
                <span className="font-cond text-xs text-mut">{guiaInicial.filter(h => h.hecho).length}/4 completados</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                {guiaInicial.map((h, i) => (
                  <button key={h.texto} onClick={() => !h.hecho && setPestana(h.tab)} disabled={h.hecho}
                    className={`rounded-xl border px-2.5 py-2 text-left font-cond text-xs transition-colors ${h.hecho ? "border-win/40 bg-win/5 text-win" : "border-line2 bg-panel2 text-sand hover:border-gold2 hover:text-gold"}`}>
                    <span className="mr-1.5 font-display">{h.hecho ? "✓" : i + 1}</span>{h.texto}
                  </button>
                ))}
              </div>
            </div>
          )}
          {state.dia <= 5 && (
            <div className="forecast-strip mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line bg-panel/70 px-4 py-2.5 font-cond text-sm">
              <span className="font-display uppercase tracking-wide text-sand">Previsión del domingo</span>
              <span className="text-win">Entradas seguras {fmt(ingresosEstimados)}</span>
              <span className="text-blood">Gastos previstos {fmt(gastosEstimados)}</span>
              <span className={balanceEstimado >= 0 ? "text-gold font-bold" : "text-blood font-bold"}>
                {balanceEstimado >= 0 ? "A favor" : "En pérdida"} {balanceEstimado >= 0 ? "+" : "−"}{fmt(Math.abs(balanceEstimado))}
              </span>
              <span className="text-mut">No incluye eventos, peleas ni veladas: son ingresos variables.</span>
            </div>
          )}

          {/* ESCENARIO / VISTA CENTRAL CON TRANSICIONES FLUIDAS */}
          <main className="min-h-0 flex-1 overflow-hidden">
              {pestana === "gimnasio" && <GymView onAbrir={setFichaId} onSeleccionarBoxeador={(b) => setFichaId(b.id)} />}
              {pestana === "ciudad" && <CityMap onIrAPestaña={(tab) => setPestana(tab as Pestana)} />}
              {pestana === "plantel" && (
                <PanelPlantel
                  onAbrir={setFichaId}
                  onBuscarRival={(id) => dispatch({ type: "BUSCAR_RIVAL", id })}
                  onSeleccionarBoxeador={(b) => setFichaId(b.id)}
                />
              )}
              {pestana === "mercado" && <PanelMercado />}
              {pestana === "perfil" && <PanelPerfil />}
              {pestana === "personal" && <PanelPersonal />}
          </main>
        </div>

        {/* DOCK LATERAL DEL TELÉFONO (PANTALLAS ANCHAS) */}
        <div className="hidden h-full min-h-0 xl:block">
          <DockLateral pestana={pestanaDock} setPestana={setPestanaDock} lado="escritorio" onNavegarPestana={setPestana} onSeleccionarBoxeador={setFichaId} />
        </div>
      </div>

      {/* DOCK COMPACTO EN DISPOSITIVOS MÓVILES */}
      <div className="z-30 xl:hidden">
        <DockLateral pestana={pestanaDock} setPestana={setPestanaDock} lado="movil" onNavegarPestana={setPestana} onSeleccionarBoxeador={setFichaId} />
      </div>

      {/* PANTALLA DE COMBATE EN VIVO */}
      {enCartelera && peleaActual && (
        <FightScreen
          key={peleaActual.id}
          pelea={peleaActual}
          onTerminar={alTerminarPelea}
        />
      )}

      {/* MODAL MATCHMAKING: SELECCIÓN DE RIVAL (3 OFERTAS DEL PROMOTOR) */}
      {state.ofertas.length > 0 && state.ofertasPara && (
        <Modal
          wide
          title="Selección de Rival · 3 ofertas del promotor"
          icon="target"
          onClose={() =>
            dispatch({
              type: "TOAST",
              texto: "Ofertas retiradas. Podés volver a buscar cuando quieras.",
              tono: "info",
            })
          }
        >
          <p className="mb-3 font-cond text-sm text-sand">
            Tu rival del sábado para{" "}
            <b className="text-cream">
              {state.plantel.find(p => p.id === state.ofertasPara)?.nombre}
            </b>
            . Los rivales llegan con energía real (40–80%), nunca descansados al 100%.
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {state.ofertas.map(of => (
              <div
                key={of.id}
                className={`panel p-4 rounded-2xl ${
                  of.esTitulo > 0
                    ? "border-gold2/70"
                    : of.nivel === "desafio"
                    ? "border-blood/50"
                    : ""
                }`}
              >
                <Chip
                  tone={
                    of.esTitulo > 0
                      ? "gold"
                      : of.nivel === "accesible"
                      ? "win"
                      : of.nivel === "parejo"
                      ? "mut"
                      : "blood"
                  }
                >
                  {of.etiqueta}
                </Chip>
                <div className="mt-2 font-display text-xl leading-tight text-cream">
                  {of.rival.nombre}
                </div>
                <div className="font-cond text-xs uppercase tracking-wide text-mut">
                  {of.rival.division} · {of.rival.circuito} · Récord {of.rival.record.v}-
                  {of.rival.record.d}-{of.rival.record.e ?? 0} ({of.rival.record.ko} KO)
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="border border-line bg-panel2 py-1.5 rounded-lg">
                    <div className="font-display text-2xl text-gold">
                      {valoracion(of.rival.atrib)}
                    </div>
                    <div className="font-cond text-[10px] uppercase text-mut">Valoración</div>
                  </div>
                  <div className="border border-line bg-panel2 py-1.5 rounded-lg">
                    <div className="font-display text-2xl text-win">
                      {Math.round(of.rival.energia)}%
                    </div>
                    <div className="font-cond text-[10px] uppercase text-mut">Energía</div>
                  </div>
                </div>
                <p className="mt-2 font-cond text-xs leading-snug text-sand">{of.detalle}</p>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                  <span className="font-display text-lg text-gold">{fmt(of.bolsa)}</span>
                  {of.esTitulo > 0 && (
                    <span className="anim-cinturon font-cond text-[10px] uppercase text-gold font-bold">
                      <I n="trophy" className="mr-1 inline h-3 w-3" />
                      {TITULOS[of.esTitulo as 1 | 2 | 3 | 4].cinturon}
                    </span>
                  )}
                </div>
                <Btn
                  variant={
                    of.esTitulo > 0 ? "gold" : of.nivel === "desafio" ? "blood" : "dark"
                  }
                  className="mt-2 w-full"
                  onClick={() => resolverOferta(of.id)}
                >
                  Firmar pelea
                </Btn>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* BALANCE SEMANAL DEL DOMINGO */}
      {state.resumen && (
        <Modal wide title={`Balance Semanal · Semana ${state.semana}`} icon="calendar">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-win/40 bg-win/5 p-4 rounded-2xl">
              <div className="mb-2 flex items-center gap-2 font-display text-xl tracking-wide text-win">
                <I n="up" className="h-4 w-4" /> Ingresos
              </div>
              {state.resumen.ingresos.map((l, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-line/60 py-1.5 font-cond text-sm"
                >
                  <span className="text-sand">{l.concepto}</span>
                  <span className="text-win">{fmt(l.monto)}</span>
                </div>
              ))}
            </div>

            <div className="border border-blood/40 bg-blood/5 p-4 rounded-2xl">
              <div className="mb-2 flex items-center gap-2 font-display text-xl tracking-wide text-[#ff8a7e]">
                <I n="down" className="h-4 w-4" /> Gastos Fijos
              </div>
              {state.resumen.gastos.length === 0 && (
                <p className="font-cond text-sm italic text-mut">
                  Sin gastos: local propio y sin personal.
                </p>
              )}
              {state.resumen.gastos.map((l, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-line/60 py-1.5 font-cond text-sm"
                >
                  <span className="text-sand">{l.concepto}</span>
                  <span className="text-[#ff8a7e]">−{fmt(l.monto)}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between border-2 p-4 rounded-2xl ${
              state.resumen.total >= 0
                ? "border-gold2/70 bg-gold/10"
                : "border-blood/60 bg-blood/10"
            }`}
          >
            <span className="font-display text-2xl tracking-wide text-cream">
              Resultado neto de la semana
            </span>
            <span
              className={`font-display text-4xl font-bold ${
                state.resumen.total >= 0 ? "text-gold" : "text-blood"
              }`}
            >
              {state.resumen.total >= 0 ? "+" : "−"}
              {fmt(Math.abs(state.resumen.total))}
            </span>
          </div>

          <p className="mt-2 font-cond text-xs text-mut">
            Las bolsas y entradas se cobran el sábado; el domingo se liquidan cuotas, alquiler y sueldos.
            Caja después del cierre: {fmt(state.dinero)}. El resultado neto histórico se ve en Mi Perfil.
          </p>

          <Btn
            variant="gold"
            className="mt-4 w-full py-2.5"
            onClick={() => dispatch({ type: "CERRAR_DOMINGO" })}
          >
            <I n="play" className="h-4 w-4" /> Cerrar el domingo y abrir el gimnasio el lunes
          </Btn>
        </Modal>
      )}

      {/* FICHA TÉCNICA DEL ATLETA */}
      {fichaId && (
        <BoxerSheet
          id={fichaId}
          onCerrar={() => setFichaId(null)}
          onCambiarBoxeador={setFichaId}
          onIrAPestana={(tab) => { setFichaId(null); setPestana(tab); }}
        />
      )}

      {/* AJUSTES & PERSISTENCIA JSON */}
      {ajustes && <ModalAjustes onCerrar={() => setAjustes(false)} atajos={atajos} onCambiarAtajos={setAtajos} />}

      {/* TOASTS DEL SISTEMA */}
      <ContenedorToast
        toasts={state.toasts}
        onCerrar={(id) => dispatch({ type: "QUITAR_TOAST", id })}
      />
    </div>
  );
}

function Raiz() {
  const { state } = useGame();
  return state.creado ? <PantallaPrincipal /> : <Intro />;
}

export default function App() {
  return (
    <GameProvider>
      <Raiz />
    </GameProvider>
  );
}
