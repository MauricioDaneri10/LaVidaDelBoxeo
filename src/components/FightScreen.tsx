import { AnimatePresence, m as motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mountDialog } from "../ui/dialogs";
import { useMessages } from "../i18n";
import type { MessageKey } from "../i18n/catalog";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { presentarDivision, presentarResultadoActual, presentarTitulo } from "../i18n/presentation";
import {
  cerrarAsalto,
  crearEstadoPelea,
  emitirCheckpointCombate,
  fmt,
  PLANES,
  planSugerido,
  resolverPelea,
  simularIntercambio,
  simularPeleaEntera,
  valoracion,
} from "../game/engine";
import type { AccionRing, EstadoPelea, PlanId } from "../game/engine";
import {
  caida as sndCaida,
  campana,
  campanaFinal,
  conteo as sndConteo,
  golpe as sndGolpe,
  monedas as sndMonedas,
  ovacion as sndOvacion,
} from "../game/audio";
import { useGame } from "../game/state";
import { hashTexto } from "../game/saveValidation";
import type { Pelea, ResultadoPelea } from "../game/types";
import { Figura } from "./GymView";
import { Btn, TextoPaginado } from "./ui";

type FasePelea = "cartelera" | "esquina" | "asalto" | "conteo" | "final";

interface IntercambioVisual {
  acciones: AccionRing[];
  caida: "a" | "b" | null;
  ko: "a" | "b" | null;
}

interface DesgloseRoundJueces {
  asalto: number;
  juez1: { a: number; b: number };
  juez2: { a: number; b: number };
  juez3: { a: number; b: number };
}

export interface FightScreenProps {
  pelea: Pelea;
  alTerminar?: (r: ResultadoPelea) => void;
  onTerminar?: (r: ResultadoPelea) => void;
}

// Wrappers de audio con manejo defensivo ante bloqueos de AudioContext
function playCampana() { try { campana(); } catch {} }
function playCampanaFinal() { try { campanaFinal(); } catch {} }
function playGolpe(critico = false) { try { sndGolpe(critico); } catch {} }
function playCaida() { try { sndCaida(); } catch {} }
function playConteo() { try { sndConteo(); } catch {} }
function playOvacion() { try { sndOvacion(); } catch {} }
function playMonedas() { try { sndMonedas(); } catch {} }

export function FightScreen({ pelea, alTerminar, onTerminar }: FightScreenProps) {
  const { state, dispatch } = useGame();
  const { t, locale } = useMessages();
  const horizontal = useResponsiveCapacity("(max-height: 450px)");
  const [section, setSection] = useState("decision");
  const [fighter, setFighter] = useState<"a" | "b">("a");
  const fightLayer = useRef<HTMLDivElement>(null);
  const fightDialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (fightLayer.current && fightDialog.current) return mountDialog(fightLayer.current, fightDialog.current, () => {});
  }, []);
  const mio = state.plantel.find(p => p.id === pelea.miId) || state.plantel[0];

  const estado = useRef<EstadoPelea | null>(null);
  if (!estado.current) {
    estado.current = state.combateActivo?.pelea.id === pelea.id
      ? structuredClone(state.combateActivo) : crearEstadoPelea(pelea, mio, state.equipamiento);
    estado.current.semillaAzar ??= parseInt(hashTexto(`${state.partidaId}:${pelea.id}`), 16);
  }
  const e = estado.current;
  const combateTerminado = e.finalizada || e.ko !== null || e.asaltosCerrados >= e.totalAsaltos;
  const [luchadoresVisibles, setLuchadoresVisibles] = useState(() => ({ A: structuredClone(e.A), B: structuredClone(e.B) }));
  const vista = { ...e, ...luchadoresVisibles };

  const [fase, setFase] = useState<FasePelea>(state.combateActivo?.pelea.id === pelea.id ? (combateTerminado ? "final" : "esquina") : "cartelera");
  const [plan, setPlan] = useState<PlanId>(state.combateActivo?.pelea.id === pelea.id ? e.A.plan : planSugerido(e));
  useEffect(() => {
    if (fase === "esquina" || fase === "final") setSection("decision");
    if (fightDialog.current && !fightDialog.current.contains(document.activeElement)) {
      fightDialog.current.querySelector<HTMLSelectElement>("select")?.focus({ preventScroll: true });
    }
  }, [fase]);
  const [, setTick] = useState(0);

  const colaRef = useRef<IntercambioVisual[]>([]);
  const accionIdxRef = useRef(0);
  const [conteoNum, setConteoNum] = useState(1);
  const [ladoCaida, setLadoCaida] = useState<"a" | "b">("b");
  const [resultado, setResultado] = useState<ResultadoPelea | null>(() => combateTerminado ? resolverPelea(e) : null);
  const [sacudida, setSacudida] = useState(0);
  const [golpeA, setGolpeA] = useState(0);
  const [golpeB, setGolpeB] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Registro detallado de tarjetas round-by-round para los 3 jueces
  const [desgloseRounds, setDesgloseRounds] = useState<DesgloseRoundJueces[]>([]);
  const prevTarjetasRef = useRef<{ a: number; b: number }[]>([
    ...e.tarjetas.map(t => ({ ...t })),
  ]);

  const rerender = () => setTick(t => t + 1);
  const guardarCombate = () => dispatch({ type: "CHECKPOINT_COMBATE", estado: emitirCheckpointCombate(e) });

  useEffect(() => { guardarCombate(); }, []);

  const finalizarCombate = (koLado: "a" | "b" | null) => {
    if (koLado) e.ko = koLado;
    const r = resolverPelea(e);
    guardarCombate();
    setLuchadoresVisibles({ A: structuredClone(e.A), B: structuredClone(e.B) });
    setResultado(r);
    playCampanaFinal();
    if (r.gane) {
      playOvacion();
      playMonedas();
    }
    setFase("final");
  };

  const callbackTerminar = (r: ResultadoPelea) => {
    (onTerminar ?? alTerminar)?.(r);
  };

  const consumirAcciones = () => {
    const cola = colaRef.current;
    if (cola.length === 0 && e.intercambiosAsalto < 3 && !e.ko) {
      const r = simularIntercambio(e);
      guardarCombate();
      cola.push({ acciones: e.acciones, caida: r.caida, ko: r.ko });
    }
    // Empty after a last-exchange count is an end-of-round transition,
    // not an instruction to wait for a nonexistent action.
    const inter = cola[0];

    if (inter && accionIdxRef.current < inter.acciones.length) {
      const acc = inter.acciones[accionIdxRef.current];
      accionIdxRef.current++;
      if (acc.estadoVisual) setLuchadoresVisibles(acc.estadoVisual);

      if (acc.conecto) {
        playGolpe(acc.critico);
        if (acc.critico) setSacudida(s => s + 1);
        if (acc.atacante === "a") {
          setGolpeB(g => g + 1);
        } else {
          setGolpeA(g => g + 1);
        }
      }

      rerender();
      timerRef.current = setTimeout(
        consumirAcciones,
        acc.conecto ? (acc.critico ? 680 : 500) : 360
      );
      return;
    }

    // Intercambio completado
    cola.shift();
    accionIdxRef.current = 0;
    setLuchadoresVisibles({ A: structuredClone(e.A), B: structuredClone(e.B) });

    if (inter?.ko || e.ko) {
      finalizarCombate(inter?.ko ?? e.ko);
      return;
    }

    if (inter?.caida) {
      setLadoCaida(inter.caida);
      playCaida();
      setConteoNum(1);
      setFase("conteo");
      return;
    }

    if (cola.length > 0 || e.intercambiosAsalto < 3) {
      timerRef.current = setTimeout(consumirAcciones, 280);
      return;
    }

    // Fin regular del asalto
    const rondaAnterior = e.asalto;
    cerrarAsalto(e);
    setLuchadoresVisibles({ A: structuredClone(e.A), B: structuredClone(e.B) });

    // Calcular desglose exacto de puntos otorgados por los 3 jueces en esta ronda
    const j1Score = { a: e.tarjetas[0].a - prevTarjetasRef.current[0].a, b: e.tarjetas[0].b - prevTarjetasRef.current[0].b };
    const j2Score = { a: e.tarjetas[1].a - prevTarjetasRef.current[1].a, b: e.tarjetas[1].b - prevTarjetasRef.current[1].b };
    const j3Score = { a: e.tarjetas[2].a - prevTarjetasRef.current[2].a, b: e.tarjetas[2].b - prevTarjetasRef.current[2].b };

    setDesgloseRounds(prev => [
      ...prev,
      {
        asalto: rondaAnterior,
        juez1: j1Score,
        juez2: j2Score,
        juez3: j3Score,
      },
    ]);

    prevTarjetasRef.current = e.tarjetas.map(t => ({ a: t.a, b: t.b }));

    e.asalto++;
    guardarCombate();
    rerender();

    if (e.asalto > e.totalAsaltos) {
      finalizarCombate(null);
      return;
    }

    setFase("esquina");
  };

  const iniciarAsalto = () => {
    e.A.plan = plan;
    guardarCombate();
    playCampana();
    colaRef.current = [];
    accionIdxRef.current = 0;
    setFase("asalto");
    timerRef.current = setTimeout(consumirAcciones, 550);
  };

  // Conteo de protección oficial del réferi
  useEffect(() => {
    if (fase !== "conteo") return;
    if (conteoNum > 10) {
      const caido = ladoCaida === "a" ? e.A : e.B;
      if (caido.hp <= 0 || caido.caidas >= 3) {
        finalizarCombate(ladoCaida);
        return;
      }
      // Se incorpora: reanudar combate
      setFase("asalto");
      timerRef.current = setTimeout(consumirAcciones, 450);
      return;
    }

    playConteo();
    const t = setTimeout(() => setConteoNum(n => n + 1), 750);
    return () => clearTimeout(t);
  }, [fase, conteoNum]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const simularResto = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const r = simularPeleaEntera(e, plan);
    guardarCombate();
    setLuchadoresVisibles({ A: structuredClone(e.A), B: structuredClone(e.B) });
    setResultado(r);
    playCampanaFinal();
    if (r.gane) {
      playOvacion();
      playMonedas();
    }
    setFase("final");
  };

  const eficaciaPct = (c: number, l: number) => (l === 0 ? 0 : Math.round((c / l) * 100));
  const nombreA = mio.nombre.split(" ")[0];
  const nombreB = pelea.rival.nombre.split(" ")[0];
  const esTitulo = pelea.esTitulo > 0;

  const round = t("fight.round", { round: Math.min(e.asalto, e.totalAsaltos), total: e.totalAsaltos });
  const bout = (p: typeof mio) => [t("fight.bout", { name: p.nombre, rating: valoracion(p.atrib), wins: p.record.v, losses: p.record.d, draws: p.record.e ?? 0, kos: p.record.ko }), t(p.circuito === "pro" ? "licence.pro" : "licence.amateur"), presentarDivision(p.division, locale)].join("\n");
  const resultCopy = resultado ? presentarResultadoActual(resultado, e.asalto, e.ko !== null, locale) : null;
  const outcome = resultado ? t(resultado.gane ? "fight.won" : resultado.empate ? "fight.draw" : "fight.lost") : "";
  const story = fase === "cartelera" ? t("fight.before")
    : fase === "esquina" ? t("fight.rest", { round: Math.min(e.asalto, e.totalAsaltos) })
    : fase === "asalto" ? t("fight.running", { a: nombreA, b: nombreB, plan: t(`plan.${vista.A.plan}`) })
    : fase === "conteo" ? t("fight.counting", { name: ladoCaida === "a" ? nombreA : nombreB })
    : resultado && resultCopy ? resultado.empate ? t("fight.tie", { method: resultCopy.method })
      : t("fight.winner", { method: resultCopy.method, name: resultado.gane ? nombreA : nombreB }) : "";
  const selectedFighter = fighter === "a" ? vista.A : vista.B;
  const identity = [bout(mio), bout(pelea.rival), t("fight.purse", { purse: fmt(pelea.bolsa) }),
    esTitulo ? t("fight.titleAtStake", { title: presentarTitulo(pelea.esTitulo as 1 | 2 | 3 | 4, locale).nombre }) : ""].filter(Boolean).join("\n");
  const stats = [selectedFighter.p.nombre,
    t("fight.health", { current: Math.round(selectedFighter.hp), total: selectedFighter.hpMax }),
    t("fight.energy", { energy: Math.round(selectedFighter.energia), falls: selectedFighter.caidas }),
    selectedFighter.aturdido > 0 ? t("fight.stunned") : "",
    t("fight.jabs", { landed: selectedFighter.registro.jab.conectados, thrown: selectedFighter.registro.jab.lanzados, percent: eficaciaPct(selectedFighter.registro.jab.conectados, selectedFighter.registro.jab.lanzados) }),
    t("fight.power", { landed: selectedFighter.registro.poder.conectados, thrown: selectedFighter.registro.poder.lanzados, percent: eficaciaPct(selectedFighter.registro.poder.conectados, selectedFighter.registro.poder.lanzados) }),
  ].filter(Boolean).join("\n");
  const cards = [ ...e.tarjetas.map((card, index) => t("fight.judge", { judge: index + 1, a: card.a, b: card.b })),
    ...desgloseRounds.map(card => t("fight.roundCards", { round: card.asalto, a1: card.juez1.a, b1: card.juez1.b, a2: card.juez2.a, b2: card.juez2.b, a3: card.juez3.a, b3: card.juez3.b })),
  ].join("\n");
  const verdict = resultado && resultCopy ? [outcome, resultCopy.method, resultCopy.summary,
    t("fight.resultPurse", { purse: fmt(resultado.bolsa) }), t("fight.fame", { fame: resultado.fama }),
    resultado.tituloGanado > 0 ? presentarTitulo(resultado.tituloGanado as 1 | 2 | 3 | 4, locale).cinturon : "",
  ].filter(Boolean).join("\n") : "";

  return createPortal(
    <div ref={fightLayer} data-dialog-layer className="fondo-app fight-screen-overlay p-2">
      <div ref={fightDialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-animation-ready="true"
        className="fight-screen-content mx-auto w-full max-w-5xl">
        <span id={titleId} className="sr-only">{t("fight.title")}</span>
        <header className="fight-heading">
          <h1 className="font-display text-lg text-gold">{fase === "final" ? t("fight.verdict") : round}</h1>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[vista.A, vista.B].map((fighter, index) => <div key={index} className="min-w-0">
              <p className="[overflow-wrap:anywhere]">{fighter.p.nombre.split(" ")[0]}</p>
              <p>{t("fight.health", { current: Math.round(fighter.hp), total: fighter.hpMax })}</p>
              <p>{t("fight.energy", { energy: Math.round(fighter.energia), falls: fighter.caidas })}</p>
            </div>)}
          </div>
        </header>
        <div className="fight-navigation">
          <select className="r4-select" aria-label={t("fight.view")} value={section} onChange={event => setSection(event.target.value)}>
            {(["decision", "identidad", "ring", "estadisticas", "tarjetas", "relato"] as const).map(view =>
              <option key={view} value={view}>{t({ decision: "fight.decision", identidad: "fight.identity", ring: "fight.ring", estadisticas: "fight.stats", tarjetas: "fight.cards", relato: "fight.story" }[view] as MessageKey)}</option>)}
          </select>
        </div>
        <main className="fight-view panel p-2">
          {section === "decision" && <div className="space-y-2">
            {fase === "esquina" && <select className="r4-select" aria-label={t("fight.strategy")} value={plan} onChange={event => setPlan(event.target.value as PlanId)}>
              {(Object.keys(PLANES) as PlanId[]).map(id => <option key={id} value={id}>{t(`plan.${id}`)}</option>)}
            </select>}
            <TextoPaginado capacidad={horizontal ? 20 : 40} texto={fase === "final" ? verdict : fase === "cartelera" ? `${t("fight.presentation")}\n${t("fight.purse", { purse: fmt(pelea.bolsa) })}` : `${t("fight.selected", { plan: t(`plan.${fase === "esquina" ? plan : vista.A.plan}`) })}\n${t(`plan.${fase === "esquina" ? plan : vista.A.plan}.desc`)}`} />
          </div>}
          {section === "identidad" && <TextoPaginado capacidad={horizontal ? 20 : 40} texto={identity} />}
          {section === "estadisticas" && <div className="space-y-2">
            <select className="r4-select" aria-label={t("fight.boxer")} value={fighter} onChange={event => setFighter(event.target.value as "a" | "b")}>
              <option value="a">{mio.nombre}</option><option value="b">{pelea.rival.nombre}</option>
            </select>
            <TextoPaginado capacidad={horizontal ? 20 : 40} texto={stats} />
          </div>}
          {section === "tarjetas" && <TextoPaginado capacidad={horizontal ? 20 : 40} texto={cards} />}
          {section === "relato" && <TextoPaginado capacidad={horizontal ? 20 : 40} texto={story} />}
          {section === "ring" && (<>
        {/* CUADRILÁTERO VECTORIAL CON ANIMACIONES PROCEDIMENTALES Y SACUDIDA */}
        <div
          key={sacudida}
          className={`panel fight-ring relative shrink-0 overflow-hidden rounded-3xl border border-line ${
            sacudida > 0 && fase === "asalto" ? "anim-shake" : ""
          }`}
          style={{ height: "100%", minHeight: 0 }}
        >
          {/* Gradas y público atmosférico */}
          <div
            className="absolute inset-x-0 top-0 h-16 opacity-70"
            style={{
              background: "repeating-linear-gradient(90deg, #1c150e 0 14px, #261c12 14px 28px, #18130c 28px 42px)",
            }}
          >
            <div className="flex h-full items-end justify-around">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="anim-bob h-5 w-5 rounded-full"
                  style={{
                    background: ["#5a4630", "#3f4a55", "#553a3a", "#44503c"][i % 4],
                    animationDelay: `${(i % 6) * 0.18}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Estructura del Ring de Combate */}
          <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[64%] w-full">
            <polygon points="30,96 370,96 398,140 2,140" fill="#3a2c1c" />
            <rect x="30" y="84" width="340" height="14" fill={esTitulo ? "#4c3a58" : "#5d452c"} stroke="#2c2013" strokeWidth="1.5" />
            {[36, 364].map(x => (
              <g key={x}>
                <rect x={x - 4} y="8" width="8" height="78" fill="#8f8577" />
                <rect x={x - 6} y="0" width="12" height="10" rx="3" fill="#d4342c" />
              </g>
            ))}
            {[22, 44, 66].map((y, i) => (
              <g key={y}>
                <line x1="36" y1={y} x2="364" y2={y} stroke={i === 1 ? "#f2e7d0" : "#d4342c"} strokeWidth="3.4" />
                <line x1="36" y1={y + 1.4} x2="364" y2={y + 1.4} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
              </g>
            ))}
            <text x="200" y="118" textAnchor="middle" fontFamily="var(--font-display)" fontSize="16" fill="rgba(242,231,208,0.4)" letterSpacing="4">
              LA VIDA DEL BOXEO
            </text>
          </svg>

          {/* Boxeador Esquina Azul (Jugador) */}
          <div
            className={`absolute bottom-[16%] left-[16%] transition-transform duration-200 ${
              fase === "asalto" ? "translate-x-2" : ""
            }`}
          >
            <div key={`a${golpeA}`} className={golpeA > 0 && fase === "asalto" ? "anim-golpe" : ""}>
              <div className={ladoCaida === "a" && (fase === "conteo" || (fase === "final" && e.ko === "a")) ? "anim-caida" : ""}>
                <Figura
                  p={vista.A.p}
                  pose={ladoCaida === "a" && fase === "conteo" ? "caido" : "guardia"}
                  escala={1.5}
                />
              </div>
            </div>
          </div>

          {/* Boxeador Esquina Roja (Rival) */}
          <div
            className={`absolute bottom-[16%] right-[16%] transition-transform duration-200 ${
              fase === "asalto" ? "-translate-x-2" : ""
            }`}
          >
            <div key={`b${golpeB}`} className={golpeB > 0 && fase === "asalto" ? "anim-golpe" : ""}>
              <div className={ladoCaida === "b" && (fase === "conteo" || (fase === "final" && e.ko === "b")) ? "anim-caida" : ""}>
                <div className="-scale-x-100">
                  <Figura
                    p={vista.B.p}
                    pose={ladoCaida === "b" && fase === "conteo" ? "caido" : "guardia"}
                    escala={1.5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Réferi en el centro */}
          <div className="anim-ref absolute bottom-[13%] left-1/2 -translate-x-1/2">
            <svg viewBox="0 0 30 50" width="26" height="44">
              <rect x="10" y="17" width="10" height="16" rx="3" fill="#f2e7d0" />
              <rect x="10.5" y="31" width="4" height="14" rx="2" fill="#23262d" />
              <rect x="15.5" y="31" width="4" height="14" rx="2" fill="#23262d" />
              <circle cx="15" cy="10" r="5.5" fill="#c9986a" />
              <line x1="10" y1="21" x2="3" y2="27" stroke="#c9986a" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="20" y1="21" x2="27" y2="15" stroke="#c9986a" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>

          {/* Modal / Overlay del Conteo de Knockdown */}
          <AnimatePresence>
            {fase === "conteo" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm z-30"
              >
                <div className="text-center space-y-2">
                  <div className="font-cond text-xs uppercase tracking-[0.35em] text-sand font-bold">
                    {t("fight.knockdown")}
                  </div>
                  <div
                    key={conteoNum}
                    className="anim-conteo font-display text-5xl text-gold"
                    style={{
                      textShadow: "0 0 30px rgba(232,178,58,0.6), 4px 4px 0 rgba(0,0,0,0.6)",
                    }}
                  >
                    {Math.min(conteoNum, 10)}
                  </div>
                  <Btn small variant="ghost" onClick={() => setConteoNum(11)}>
                    {t("fight.skipCount")}
                  </Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          </>)}
        </main>
        <div className="fight-actions">
          {fase === "cartelera" && <Btn variant="gold" className="w-full" onClick={() => setFase("esquina")}>{t("fight.bell")}</Btn>}
          {fase === "esquina" && <Btn variant="blood" className="w-full" onClick={iniciarAsalto}>{t("fight.start")}</Btn>}
          {(fase === "asalto" || fase === "conteo") && <Btn variant="ghost" className="w-full" onClick={simularResto}>{t("fight.simulate")}</Btn>}
          {fase === "final" && resultado && <Btn variant="gold" className="w-full" onClick={() => callbackTerminar(resultado)}>{t("fight.continue")}</Btn>}
        </div>
        <footer className="app-footer text-center text-xs text-sand">MadArt Studios</footer>
      </div>
    </div>, document.body
  );
}

export default FightScreen;
export { FightScreen as PantallaPelea };
