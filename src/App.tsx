import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import BoxerSheet from "./components/BoxerSheet";
import CityMap from "./components/CityMap";
import FightScreen from "./components/FightScreen";
import GymView from "./components/GymView";
import Intro from "./components/Intro";
import Phone from "./components/Phone";
import TopBar from "./components/TopBar";
import { MarketPanel, ProfilePanel, RosterPanel, StaffPanel } from "./components/panels";
import { Btn, I, Modal } from "./components/ui";
import { fmt } from "./game/data";
import { GameProvider, useGame } from "./game/state";
import type { Tab, Toast } from "./game/types";

const TABS: { id: Tab; nombre: string; icon: string }[] = [
  { id: "gimnasio", nombre: "Gimnasio", icon: "ring" },
  { id: "ciudad", nombre: "Ciudad", icon: "map" },
  { id: "roster", nombre: "Roster", icon: "glove" },
  { id: "mercado", nombre: "Mercado", icon: "cart" },
  { id: "staff", nombre: "Personal", icon: "case" },
  { id: "perfil", nombre: "Perfil", icon: "user" },
];

function ToastItem({ t }: { t: Toast }) {
  const { dispatch } = useGame();
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: "DROP_TOAST", id: t.id }), 3400);
    return () => clearTimeout(timer);
  }, [t.id, dispatch]);
  const border = t.tono === "oro" ? "border-gold2 text-gold" : t.tono === "ok" ? "border-win/60 text-win" : "border-line2 text-sand";
  return (
    <motion.div layout initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      className={`panel flex items-center gap-2 border px-3 py-2 font-cond text-sm ${border} hard-shadow-sm`}>
      <I n={t.tono === "oro" ? "trophy" : t.tono === "ok" ? "check" : "phone"} className="h-4 w-4 shrink-0" />
      {t.texto}
    </motion.div>
  );
}

function ResumenSemanal() {
  const { state, dispatch } = useGame();
  const r = state.resumen;
  if (!r) return null;
  const balance = r.ingresos - r.gastos;
  return (
    <Modal title={`Resumen · Semana ${state.semana}`} icon="calendar">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center font-cond">
          <div className="border border-line bg-panel2 py-3">
            <div className="text-2xl font-bold text-win">{fmt(r.ingresos)}</div>
            <div className="text-[10px] uppercase tracking-widest text-mut">Ingresos</div>
          </div>
          <div className="border border-line bg-panel2 py-3">
            <div className="text-2xl font-bold text-lose">{fmt(r.gastos)}</div>
            <div className="text-[10px] uppercase tracking-widest text-mut">Gastos</div>
          </div>
          <div className="border border-gold2/60 bg-gold/10 py-3">
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-gold" : "text-lose"}`}>{balance >= 0 ? "+" : ""}{fmt(balance)}</div>
            <div className="text-[10px] uppercase tracking-widest text-mut">Balance</div>
          </div>
        </div>
        {r.famaDelta > 0 && (
          <div className="flex items-center gap-2 border border-blood/50 bg-blood/10 px-3 py-2 font-cond text-sm text-[#ff9c90]">
            <I n="star" className="h-4 w-4" /> Tu fama creció +{r.famaDelta} esta semana. La ciudad murmura tu nombre.
          </div>
        )}
        {r.notas.length > 0 && (
          <div>
            <div className="mb-1.5 font-cond text-xs uppercase tracking-widest text-mut">Lo más destacado</div>
            <ul className="space-y-1">
              {r.notas.slice(0, 5).map((n, i) => (
                <li key={i} className="flex items-start gap-2 font-cond text-sm text-sand">
                  <I n="chevR" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />{n}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-cond text-xs text-mut">Caja actual: <b className="text-gold">{fmt(state.dinero)}</b></span>
          <Btn variant="gold" onClick={() => dispatch({ type: "CLOSE_SUMMARY" })}>
            <I n="play" className="h-4 w-4" /> Comenzar nueva semana
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function Shell() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<Tab>("gimnasio");
  const [selBoxer, setSelBoxer] = useState<string | null>(null);

  if (!state.creado) return <Intro />;

  const pelea = state.fights[0] ?? null;

  return (
    <div className="min-h-screen pb-24">
      <TopBar />

      {/* navegación */}
      <nav className="sticky top-[92px] z-30 border-b border-line bg-ink/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`tab-btn flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 font-display text-lg tracking-wider ${tab === t.id ? "active text-cream" : "text-mut hover:text-sand"}`}>
              <I n={t.icon} className="h-4 w-4" /> {t.nombre}
              {t.id === "roster" && state.schedule.length > 0 && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-blood font-cond text-[10px] text-cream">{state.schedule.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* contenido */}
      <main className="mx-auto max-w-7xl px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {tab === "gimnasio" && <GymView onOpenBoxer={setSelBoxer} />}
            {tab === "ciudad" && <CityMap onGoMarket={() => setTab("mercado")} onGoGym={() => setTab("gimnasio")} />}
            {tab === "roster" && <RosterPanel onOpenBoxer={setSelBoxer} />}
            {tab === "mercado" && <MarketPanel />}
            {tab === "staff" && <StaffPanel />}
            {tab === "perfil" && <ProfilePanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Phone />

      {/* toasts */}
      <div className="fixed right-4 top-28 z-50 flex w-72 flex-col gap-2">
        <AnimatePresence>
          {state.toasts.map(t => <ToastItem key={t.id} t={t} />)}
        </AnimatePresence>
      </div>

      {/* overlays */}
      {selBoxer && <BoxerSheet id={selBoxer} onClose={() => setSelBoxer(null)} />}
      <AnimatePresence>{state.resumen && !pelea && <ResumenSemanal />}</AnimatePresence>
      {pelea && (
        <FightScreen key={pelea.id} fight={pelea} onDone={result => dispatch({ type: "FIGHT_RESULT", result })} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
