import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import FichaAtleta from "./components/BoxerSheet";
import MapaCiudad from "./components/CityMap";
import PantallaPelea from "./components/FightScreen";
import GymView from "./components/GymView";
import Intro from "./components/Intro";
import DockLateral, { type PestanaDock } from "./components/Phone";
import { ModalAjustes, PanelMercado, PanelPerfil, PanelPersonal, PanelPlantel } from "./components/panels";
import TopBar from "./components/TopBar";
import { Btn, Chip, I, Modal } from "./components/ui";
import { iniciarAudio, monedas } from "./game/audio";
import { TITULOS } from "./game/data";
import { fmt, valoracion } from "./game/engine";
import { GameProvider, useGame } from "./game/state";
import type { ResultadoPelea } from "./game/types";

type Pestana = "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal";

function PantallaPrincipal() {
  const { state, dispatch } = useGame();
  const [pestana, setPestana] = useState<Pestana>("gimnasio");
  const [pestanaDock, setPestanaDock] = useState<PestanaDock>("mensajes");
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState(false);
  const [carteleraAbierta, setCarteleraAbierta] = useState(false);

  // audio perezoso en el primer gesto
  useEffect(() => {
    const activar = () => iniciarAudio();
    window.addEventListener("pointerdown", activar, { once: true });
    return () => window.removeEventListener("pointerdown", activar);
  }, []);

  const peleaActual = state.pendientes[0];
  const enCartelera = carteleraAbierta && state.dia === 6 && peleaActual;

  const alTerminarPelea = (r: ResultadoPelea) => {
    if (peleaActual) {
      if (r.gane) monedas();
      dispatch({ type: "RESOLVER_PELEA", peleaId: peleaActual.id, resultado: r });
    }
  };

  const resolverOferta = (ofertaId: string) => dispatch({ type: "ELEGIR_OFERTA", ofertaId });

  const pestanas: { id: Pestana; nombre: string; icono: string; pulso: boolean }[] = [
    { id: "gimnasio", nombre: "Gimnasio", icono: "ring", pulso: false },
    { id: "ciudad", nombre: "Ciudad", icono: "map", pulso: false },
    { id: "plantel", nombre: "Plantel", icono: "glove", pulso: state.dia <= 5 && state.plantel.some(p => p.rol === "alumno" && p.fogueo >= p.fogueoMeta && state.cursos.includes("dt")) },
    { id: "mercado", nombre: "Mercado", icono: "cart", pulso: false },
    { id: "perfil", nombre: "Mi Perfil", icono: "cap", pulso: false },
    { id: "personal", nombre: "Personal", icono: "users", pulso: false },
  ];

  return (
    <div className="fondo-app min-h-screen">
      <TopBar onAjustes={() => setAjustes(true)} pulsoAvanzar={state.dia === 6 && state.pendientes.length > 0} />

      <div className="mx-auto flex max-w-[1560px] gap-4 px-4 py-4">
        <div className="min-w-0 flex-1">
          {/* navegación */}
          <nav className="sticky top-[76px] z-30 mb-4 flex flex-wrap gap-1.5 border border-line bg-ink/92 p-1.5 backdrop-blur-sm">
            {pestanas.map(p => (
              <button key={p.id} onClick={() => setPestana(p.id)}
                className={`btn-poster relative px-3.5 py-1 text-base ${pestana === p.id ? "border border-gold2/70 bg-gold text-ink" : "border border-transparent bg-panel2 text-sand hover:text-cream"} ${p.pulso && pestana !== p.id ? "guia-luminica" : ""}`}>
                <span className="inline-flex items-center gap-1.5"><I n={p.icono} className="h-4 w-4" /> {p.nombre}</span>
                {p.id === "plantel" && state.pendientes.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center bg-blood px-0.5 font-cond text-[10px] text-cream">{state.pendientes.length}</span>
                )}
              </button>
            ))}
            {/* aviso de cartelera del sábado */}
            {state.dia === 6 && state.pendientes.length > 0 && (
              <button onClick={() => setCarteleraAbierta(true)}
                className="btn-poster guia-luminica ml-auto border border-blood bg-blood px-4 py-1 text-base text-cream">
                <span className="inline-flex items-center gap-1.5 anim-latido"><I n="bell" className="h-4 w-4" /> Noche de peleas · {state.pendientes.length} en cartelera</span>
              </button>
            )}
            {state.dia === 6 && state.pendientes.length === 0 && (
              <span className="ml-auto flex items-center gap-2 px-3 font-cond text-sm uppercase tracking-wide text-sand">
                <I n="check" className="h-4 w-4 text-win" /> Cartelera resuelta · pasá al balance
              </span>
            )}
          </nav>

          {/* vista central */}
          <AnimatePresence mode="wait">
            <motion.main key={pestana} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {pestana === "gimnasio" && <GymView onAbrir={setFichaId} />}
              {pestana === "ciudad" && <MapaCiudad />}
              {pestana === "plantel" && <PanelPlantel onAbrir={setFichaId} onBuscarRival={(id) => dispatch({ type: "BUSCAR_RIVAL", id })} />}
              {pestana === "mercado" && <PanelMercado />}
              {pestana === "perfil" && <PanelPerfil />}
              {pestana === "personal" && <PanelPersonal />}
            </motion.main>
          </AnimatePresence>
        </div>

        {/* dock lateral del teléfono (pantallas anchas) */}
        <div className="sticky top-[84px] hidden h-fit xl:block">
          <DockLateral pestana={pestanaDock} setPestana={setPestanaDock} lado="escritorio" />
        </div>
      </div>

      {/* dock compacto en pantallas chicas */}
      <div className="sticky bottom-0 z-30 xl:hidden">
        <DockLateral pestana={pestanaDock} setPestana={setPestanaDock} lado="movil" />
      </div>

      {/* pantalla de combate */}
      {enCartelera && peleaActual && (
        <PantallaPelea key={peleaActual.id} pelea={peleaActual} alTerminar={alTerminarPelea} />
      )}

      {/* selección de rival: 3 ofertas */}
      {state.ofertas.length > 0 && state.ofertasPara && (
        <Modal wide title="Selección de Rival · 3 ofertas del promotor" icon="target" onClose={() => dispatch({ type: "TOAST", texto: "Ofertas retiradas. Podés volver a buscar cuando quieras.", tono: "info" })}>
          <p className="mb-3 font-cond text-sm text-sand">
            Tu rival del sábado para <b className="text-cream">{state.plantel.find(p => p.id === state.ofertasPara)?.nombre}</b>. Los rivales llegan con energía real (40–80%), nunca descansados al 100%.
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {state.ofertas.map(of => (
              <div key={of.id} className={`panel p-4 ${of.esTitulo > 0 ? "border-gold2/70" : of.nivel === "desafio" ? "border-blood/50" : ""}`}>
                <Chip tone={of.esTitulo > 0 ? "gold" : of.nivel === "accesible" ? "win" : of.nivel === "parejo" ? "mut" : "blood"}>{of.etiqueta}</Chip>
                <div className="mt-2 font-display text-xl leading-tight text-cream">{of.rival.nombre}</div>
                <div className="font-cond text-xs uppercase tracking-wide text-mut">
                  {of.rival.division} · {of.rival.circuito} · Récord {of.rival.record.v}-{of.rival.record.d} ({of.rival.record.ko} KO)
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="border border-line bg-panel2 py-1.5">
                    <div className="font-display text-2xl text-gold">{valoracion(of.rival.atrib)}</div>
                    <div className="font-cond text-[10px] uppercase text-mut">Valoración</div>
                  </div>
                  <div className="border border-line bg-panel2 py-1.5">
                    <div className="font-display text-2xl text-win">{Math.round(of.rival.energia)}%</div>
                    <div className="font-cond text-[10px] uppercase text-mut">Energía</div>
                  </div>
                </div>
                <p className="mt-2 font-cond text-xs leading-snug text-sand">{of.detalle}</p>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                  <span className="font-display text-lg text-gold">{fmt(of.bolsa)}</span>
                  {of.esTitulo > 0 && <span className="anim-cinturon font-cond text-[10px] uppercase text-gold"><I n="trophy" className="mr-1 inline h-3 w-3" />{TITULOS[of.esTitulo as 1 | 2 | 3 | 4].cinturon}</span>}
                </div>
                <Btn variant={of.esTitulo > 0 ? "gold" : of.nivel === "desafio" ? "blood" : "dark"} className="mt-2 w-full" onClick={() => resolverOferta(of.id)}>
                  Firmar pelea
                </Btn>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* balance semanal del domingo */}
      {state.resumen && (
        <Modal wide title={`Balance Semanal · Semana ${state.semana}`} icon="calendar">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-win/40 bg-win/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-xl tracking-wide text-win"><I n="up" className="h-4 w-4" /> Ingresos</div>
              {state.resumen.ingresos.map((l, i) => (
                <div key={i} className="flex justify-between border-b border-line/60 py-1.5 font-cond text-sm">
                  <span className="text-sand">{l.concepto}</span>
                  <span className="text-win">{fmt(l.monto)}</span>
                </div>
              ))}
            </div>
            <div className="border border-blood/40 bg-blood/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-xl tracking-wide text-[#ff8a7e]"><I n="down" className="h-4 w-4" /> Gastos fijos</div>
              {state.resumen.gastos.length === 0 && <p className="font-cond text-sm italic text-mut">Sin gastos: local propio y sin personal.</p>}
              {state.resumen.gastos.map((l, i) => (
                <div key={i} className="flex justify-between border-b border-line/60 py-1.5 font-cond text-sm">
                  <span className="text-sand">{l.concepto}</span>
                  <span className="text-[#ff8a7e]">−{fmt(l.monto)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`mt-4 flex items-center justify-between border-2 p-4 ${state.resumen.total >= 0 ? "border-gold2/70 bg-gold/10" : "border-blood/60 bg-blood/10"}`}>
            <span className="font-display text-2xl tracking-wide text-cream">Superávit de la semana</span>
            <span className={`font-display text-4xl ${state.resumen.total >= 0 ? "text-gold" : "text-blood"}`}>
              {state.resumen.total >= 0 ? "+" : "−"}{fmt(Math.abs(state.resumen.total))}
            </span>
          </div>
          <p className="mt-2 font-cond text-xs text-mut">
            Las bolsas de pelea y las entradas se cobran el sábado; el domingo solo liquida el ticket contable consolidado. Caja actual: {fmt(state.dinero)}.
          </p>
          <Btn variant="gold" className="mt-4 w-full" onClick={() => dispatch({ type: "CERRAR_DOMINGO" })}>
            <I n="play" className="h-4 w-4" /> Cerrar el domingo y abrir el gimnasio el lunes
          </Btn>
        </Modal>
      )}

      {/* ficha del atleta */}
      {fichaId && <FichaAtleta id={fichaId} onCerrar={() => setFichaId(null)} />}

      {/* ajustes */}
      {ajustes && <ModalAjustes onCerrar={() => setAjustes(false)} />}

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {state.toasts.map(t => (
          <ToastItem key={t.id} id={t.id} texto={t.texto} tono={t.tono} />
        ))}
      </div>
    </div>
  );
}

function ToastItem({ id, texto, tono }: { id: number; texto: string; tono: string }) {
  const { dispatch } = useGame();
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: "QUITAR_TOAST", id }), 4200);
    return () => clearTimeout(t);
  }, [id, dispatch]);
  const color = tono === "oro" ? "border-gold2/70 text-gold" : tono === "ok" ? "border-win/60 text-win" : tono === "alerta" ? "border-blood/60 text-[#ff8a7e]" : "border-line2 text-sand";
  return (
    <button onClick={() => dispatch({ type: "QUITAR_TOAST", id })}
      className={`toast-in pointer-events-auto border bg-ink/95 px-3 py-2 text-left font-cond text-sm backdrop-blur-sm ${color}`}
      style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.4)" }}>
      {texto}
    </button>
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
