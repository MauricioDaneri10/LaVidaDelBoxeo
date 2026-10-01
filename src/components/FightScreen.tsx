import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TITULOS } from "../game/data";
import {
  cerrarAsalto,
  crearEstadoPelea,
  fmt,
  PLANES,
  planSugerido,
  resolverPelea,
  simularIntercambio,
  simularPeleaEntera,
  valoracion,
} from "../game/engine";
import type { EstadoPelea, PlanId } from "../game/engine";
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
import type { Pelea, ResultadoPelea } from "../game/types";
import { Figura } from "./GymView";
import { BotonBrillante, Btn, Chip, I } from "./ui";

type FasePelea = "cartelera" | "esquina" | "asalto" | "conteo" | "final";

interface IntercambioVisual {
  acciones: {
    atacante: "a" | "b";
    tipo: "jab" | "poder";
    conecto: boolean;
    dano: number;
    critico: boolean;
  }[];
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
  const { state } = useGame();
  const mio = state.plantel.find(p => p.id === pelea.miId) || state.plantel[0];

  const estado = useRef<EstadoPelea | null>(null);
  if (!estado.current) {
    estado.current = crearEstadoPelea(pelea, mio, state.equipamiento);
  }
  const e = estado.current;

  const [fase, setFase] = useState<FasePelea>("cartelera");
  const [plan, setPlan] = useState<PlanId>(planSugerido(e));
  const [, setTick] = useState(0);

  const colaRef = useRef<IntercambioVisual[]>([]);
  const accionIdxRef = useRef(0);
  const [conteoNum, setConteoNum] = useState(1);
  const [ladoCaida, setLadoCaida] = useState<"a" | "b">("b");
  const [resultado, setResultado] = useState<ResultadoPelea | null>(null);
  const [sacudida, setSacudida] = useState(0);
  const [golpeA, setGolpeA] = useState(0);
  const [golpeB, setGolpeB] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Registro detallado de tarjetas round-by-round para los 3 jueces
  const [desgloseRounds, setDesgloseRounds] = useState<DesgloseRoundJueces[]>([]);
  const prevTarjetasRef = useRef<{ a: number; b: number }[]>([
    { a: 0, b: 0 },
    { a: 0, b: 0 },
    { a: 0, b: 0 },
  ]);

  const rerender = () => setTick(t => t + 1);

  const finalizarCombate = (koLado: "a" | "b" | null) => {
    if (koLado) e.ko = koLado;
    const r = resolverPelea(e);
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
    if (cola.length === 0) return;
    const inter = cola[0];

    if (accionIdxRef.current < inter.acciones.length) {
      const acc = inter.acciones[accionIdxRef.current];
      accionIdxRef.current++;

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

    if (inter.ko) {
      finalizarCombate(inter.ko === "a" ? "a" : "b");
      return;
    }

    if (inter.caida) {
      setLadoCaida(inter.caida);
      playCaida();
      setConteoNum(1);
      setFase("conteo");
      return;
    }

    if (cola.length > 0) {
      timerRef.current = setTimeout(consumirAcciones, 280);
      return;
    }

    // Fin regular del asalto
    const rondaAnterior = e.asalto;
    cerrarAsalto(e);

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
    rerender();

    if (e.asalto > e.totalAsaltos) {
      finalizarCombate(null);
      return;
    }

    setFase("esquina");
  };

  const iniciarAsalto = () => {
    e.A.plan = plan;
    playCampana();
    const ronda: IntercambioVisual[] = [];

    for (let i = 0; i < 3; i++) {
      const r = simularIntercambio(e);
      ronda.push({ acciones: e.acciones, caida: r.caida, ko: r.ko });
      if (r.ko) break;
    }

    colaRef.current = ronda;
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

  return (
    <div className="fondo-app fight-screen-overlay fixed inset-0 z-50 overflow-y-auto overscroll-contain select-none p-2 sm:p-3">
      <div className="fight-screen-content mx-auto flex min-h-full w-full max-w-5xl flex-col gap-2 sm:gap-2.5">
        
        {/* ENCABEZADO DE CARTELERA OFICIAL */}
        <div className="fight-heading shrink-0 text-center space-y-0.5">
          <div className="font-cond text-xs uppercase tracking-[0.35em] text-sand">
            {esTitulo
              ? `${TITULOS[pelea.esTitulo as 1 | 2 | 3 | 4].cinturon} EN JUEGO`
              : pelea.velada
              ? "VELADA DE GALA DEL CLUB · COMBATE ESTELAR"
              : "COMBATE OFICIAL FEDERADO"}
          </div>

          <h1 className="font-display text-2xl tracking-wide text-cream sm:text-4xl">
            {fase === "final" ? "Fallo Oficial de los Jueces" : `Asalto ${Math.min(e.asalto, e.totalAsaltos)} de ${e.totalAsaltos}`}
          </h1>

          {esTitulo && fase !== "final" && (
            <div className="mx-auto mt-1 w-fit border border-gold2/70 bg-gold/10 px-4 py-0.5 font-display text-base tracking-widest text-gold anim-cinturon rounded-full shadow-md">
              {TITULOS[pelea.esTitulo as 1 | 2 | 3 | 4].nombre.toUpperCase()} · BOLSA: {fmt(pelea.bolsa)}
            </div>
          )}
        </div>

        {/* BARRAS DINÁMICAS DE SALUD, STAMINA Y CONDICIÓN */}
        <div className="fight-status-grid grid shrink-0 grid-cols-2 gap-2">
          {[
            { l: e.A, nombre: nombreA, pugil: mio, lado: "izq", golpes: golpeA },
            { l: e.B, nombre: nombreB, pugil: pelea.rival, lado: "der", golpes: golpeB },
          ].map(({ l, nombre, pugil, lado }) => (
            <div
              key={nombre}
              className={`panel fight-status-card p-2 sm:p-2.5 rounded-2xl ${lado === "der" ? "text-right" : ""}`}
            >
              <div className={`flex items-baseline gap-2 ${lado === "der" ? "flex-row-reverse" : ""}`}>
                <span className="font-display text-2xl tracking-wide text-cream truncate">{nombre}</span>
                <span className="font-cond text-xs uppercase text-mut">
                  VG {valoracion(pugil.atrib)} · {pugil.circuito}
                </span>
                {l.caidas > 0 && (
                  <span className="font-cond text-xs text-blood font-black">
                    ({l.caidas} KD)
                  </span>
                )}
              </div>

              {/* Barra de Vida / Aguante */}
              <div className="mt-1.5 flex items-center gap-2">
                <I n="shield" className="h-3.5 w-3.5 text-blood shrink-0" />
                <div className="stat-bar h-2.5 flex-1">
                  <i
                    style={{
                      width: `${Math.max(0, Math.min(100, (l.hp / l.hpMax) * 100))}%`,
                      background: l.hp > 40 ? "var(--color-gold)" : "var(--color-blood)",
                    }}
                  />
                </div>
                <span className="font-mono-data text-[11px] text-sand font-bold">
                  {Math.round(l.hp)}/{l.hpMax}
                </span>
              </div>

              {/* Barra de Stamina / Energía */}
              <div className="mt-1 flex items-center gap-2">
                <I n="bolt" className="h-3.5 w-3.5 text-win shrink-0" />
                <div className="stat-bar h-2 flex-1">
                  <i
                    style={{
                      width: `${Math.max(0, Math.min(100, l.energia))}%`,
                      background: "var(--color-win)",
                    }}
                  />
                </div>
                <span className="font-mono-data text-[11px] text-mut">
                  Aire {Math.round(l.energia)}%
                </span>
                {l.aturdido > 0 && (
                  <span className="font-cond text-[11px] text-blood font-black anim-latido">
                    ATURDIDO
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CUADRILÁTERO VECTORIAL CON ANIMACIONES PROCEDIMENTALES Y SACUDIDA */}
        <div
          key={sacudida}
          className={`panel fight-ring relative shrink-0 overflow-hidden rounded-3xl border border-line ${
            sacudida > 0 && fase === "asalto" ? "anim-shake" : ""
          }`}
          style={{ height: "clamp(150px, 28vh, 290px)" }}
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
                  p={e.A.p}
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
                    p={e.B.p}
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
                    ¡Caída a la Lona! Conteo Oficial de Protección
                  </div>
                  <div
                    key={conteoNum}
                    className="anim-conteo font-display text-9xl text-gold"
                    style={{
                      textShadow: "0 0 30px rgba(232,178,58,0.6), 4px 4px 0 rgba(0,0,0,0.6)",
                    }}
                  >
                    {Math.min(conteoNum, 10)}
                  </div>
                  <Btn small variant="ghost" onClick={() => setConteoNum(11)}>
                    Saltar conteo
                  </Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Relato y comentarios de Ringside */}
          <div className="absolute bottom-1.5 left-1/2 w-[94%] -translate-x-1/2 border border-line bg-ink/95 px-3 py-1.5 text-center rounded-xl shadow-lg">
            <span className="font-cond text-sm text-sand">
              <span className="mr-1.5 font-bold uppercase tracking-widest text-gold font-mono-data">Ringside:</span>
              {fase === "cartelera" && "Los pugilistas se desafían en el centro del cuadrilátero. ¡El público está de pie!"}
              {fase === "esquina" && `Minuto de descanso: definí la estrategia para el asalto ${Math.min(e.asalto, e.totalAsaltos)}.`}
              {fase === "asalto" && `${nombreA} (${PLANES[e.A.plan].nombre.toLowerCase()}) buscando el intercambio ante ${nombreB}. ¡Alta intensidad!`}
              {fase === "conteo" && `¡${ladoCaida === "a" ? nombreA : nombreB} ha caído a la lona! El réferi marca el conteo...`}
              {fase === "final" && resultado && `${resultado.metodo}. ${resultado.gane ? `¡${nombreA} se consagra vencedor!` : `${nombreB} gana la noche.`}`}
            </span>
          </div>
        </div>

        {/* REGISTRO COMPUBOX Y PANELES DE INSTRUCCIONES / FALLO OFICIAL */}
        <div className="fight-details grid shrink-0 items-stretch gap-2 lg:grid-cols-[1fr_320px]">
          
          {/* ESTADÍSTICAS COMPUBOX OFICIALES */}
          <div className="panel fight-stats-panel p-2.5 sm:p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-display text-lg tracking-wide text-gold flex items-center gap-2">
                <I n="target" className="h-4 w-4" /> Estadísticas
              </span>
              <span className="font-mono-data text-[10px] text-mut uppercase">Registro Computarizado</span>
            </div>

            <table className="w-full font-cond text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-mut">
                  <th className="py-1">Pugilista</th>
                  <th>Jabs Conectados</th>
                  <th>% Jab</th>
                  <th>Poder Conectados</th>
                  <th>% Poder</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { l: e.A, n: nombreA },
                  { l: e.B, n: nombreB },
                ].map(({ l, n }) => (
                  <tr key={n} className="border-t border-line/60">
                    <td className="py-2 font-bold text-cream">{n}</td>
                    <td className="text-sand">{l.registro.jab.conectados}/{l.registro.jab.lanzados}</td>
                    <td className="text-gold font-mono-data font-bold">
                      {eficaciaPct(l.registro.jab.conectados, l.registro.jab.lanzados)}%
                    </td>
                    <td className="text-sand">{l.registro.poder.conectados}/{l.registro.poder.lanzados}</td>
                    <td className="text-blood font-mono-data font-bold">
                      {eficaciaPct(l.registro.poder.conectados, l.registro.poder.lanzados)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TABLA OFICIAL ROUND-BY-ROUND DE LOS 3 JUECES (PRESERVADO DE LOCAL) */}
            {desgloseRounds.length > 0 && (
              <div className="pt-2 border-t border-line space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm text-sand uppercase tracking-wider">
                    Tarjetas Round-by-Round (Sistema 10-Point Must)
                  </span>
                  <span className="text-[10px] font-mono-data text-gold">3 Jueces Oficiales</span>
                </div>

                <div className="max-h-36 overflow-hidden space-y-1 pr-1">
                  {desgloseRounds.map(dr => (
                    <div
                      key={dr.asalto}
                      className="p-1.5 rounded-lg bg-panel2 border border-line text-xs font-mono-data flex items-center justify-between"
                    >
                      <span className="text-mut font-bold">Round {dr.asalto}</span>
                      <span className="text-sand">J1: <b className="text-cream">{dr.juez1.a}-{dr.juez1.b}</b></span>
                      <span className="text-sand">J2: <b className="text-cream">{dr.juez2.a}-{dr.juez2.b}</b></span>
                      <span className="text-sand">J3: <b className="text-cream">{dr.juez3.a}-{dr.juez3.b}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CONTROLES TÁCTICOS DE ESQUINA / FALLO OFICIAL */}
          <div className="panel fight-controls-panel p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between">
            {fase === "cartelera" && (
              <div className="space-y-3">
                <div className="font-display text-lg text-cream border-b border-line pb-1.5">
                  Presentación de los Contendientes
                </div>
                <div className="font-cond text-xs text-sand space-y-1 leading-relaxed">
                  <p><b>{nombreA}:</b> VG {valoracion(mio.atrib)} · Récord {mio.record.v}-{mio.record.d}-{mio.record.e ?? 0} ({mio.record.ko} KO)</p>
                  <p><b>{nombreB}:</b> VG {valoracion(pelea.rival.atrib)} · Récord {pelea.rival.record.v}-{pelea.rival.record.d}-{pelea.rival.record.e ?? 0} ({pelea.rival.record.ko} KO)</p>
                  <p className="pt-1 text-gold font-bold">Bolsa oficial en disputa: {fmt(pelea.bolsa)}</p>
                </div>
                <BotonBrillante
                  onClick={() => setFase("esquina")}
                  variante="dorado"
                  className="w-full py-3 text-xs font-black"
                >
                  <I n="bell" className="h-4 w-4" /> ¡Que suene la Campana!
                </BotonBrillante>
              </div>
            )}

            {fase === "esquina" && (
              <div className="fight-corner-content space-y-2">
                <div className="font-display text-base text-gold border-b border-line pb-1">
                  Tu Esquina · Instrucciones Tácticas
                </div>
                <div className="fight-plan-list space-y-1">
                  {(Object.keys(PLANES) as PlanId[]).map(pid => {
                    const pl = PLANES[pid];
                    const esSeleccionado = plan === pid;
                    return (
                      <button
                        key={pid}
                        onClick={() => setPlan(pid)}
                        className={`fight-plan-option flex w-full items-center gap-2 border p-1.5 rounded-xl text-left transition-all cursor-pointer ${
                          esSeleccionado
                            ? "border-gold bg-gold/15 text-gold shadow-md"
                            : "border-line bg-panel2 text-sand hover:border-line2"
                        }`}
                      >
                        <I n={pl.icono} className={`h-4 w-4 shrink-0 ${esSeleccionado ? "text-gold" : "text-sand"}`} />
                        <div className="min-w-0">
                          <span className="block font-display text-xs text-cream truncate">{pl.nombre}</span>
                          <span className="block font-cond text-[9px] text-mut truncate">{pl.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Btn
                  variant="blood"
                  className="fight-round-button w-full mt-1"
                  onClick={iniciarAsalto}
                  pulso
                >
                  <I n="play" className="h-4 w-4" /> Salir al Asalto
                </Btn>
              </div>
            )}

            {(fase === "asalto" || fase === "conteo") && (
              <div className="flex h-full flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="font-display text-base text-gold">Combate en Curso</div>
                  <div className="font-cond text-xs text-sand leading-relaxed">
                    Estrategia en ejecución: <b className="text-cream">{PLANES[e.A.plan].nombre}</b>
                    <br />
                    Asalto {Math.min(e.asalto, e.totalAsaltos)} de {e.totalAsaltos}
                  </div>
                </div>

                <Btn variant="ghost" onClick={simularResto}>
                  <I n="ff" className="h-4 w-4" /> Simular resto del combate
                </Btn>
              </div>
            )}

            {fase === "final" && resultado && (
              <div className="space-y-3">
                <div className="border-b border-line pb-2">
                  <div
                    className={`font-display text-2xl font-black ${
                      resultado.gane ? "text-emerald-400" : resultado.empate ? "text-gold" : "text-blood"
                    }`}
                  >
                    {resultado.gane ? "¡VICTORIA OFICIAL!" : resultado.empate ? "EMPATE OFICIAL" : "DERROTA"}
                  </div>
                  <div className="font-cond text-xs text-sand mt-0.5">
                    {resultado.metodo} · {resultado.resumen}
                  </div>
                </div>

                <div className="space-y-1 font-cond text-xs">
                  <div className="flex justify-between">
                    <span className="text-mut">Bolsa cobrada:</span>
                    <b className="text-gold font-mono-data">{fmt(resultado.bolsa)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mut">Impacto en Fama:</span>
                    <b className="text-gold font-mono-data">+{resultado.fama} pts</b>
                  </div>
                </div>

                {resultado.tituloGanado > 0 && (
                  <div className="anim-cinturon border border-gold bg-gold/15 p-2 rounded-xl text-center font-display text-base tracking-widest text-gold shadow-lg">
                    🏆 ¡CAMPEÓN {TITULOS[resultado.tituloGanado as 1 | 2 | 3 | 4].cinturon.toUpperCase()}!
                  </div>
                )}

                {/* Tarjetas Finales de los 3 Jueces */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-mut font-mono-data">
                    Puntuación Final de los 3 Jueces
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {resultado.tarjetas.map((t, i) => (
                      <div
                        key={i}
                        className="border border-line bg-panel2 p-1.5 rounded-lg text-center font-mono-data"
                      >
                        <div className="text-[9px] uppercase text-mut">Juez {i + 1}</div>
                        <div
                          className={`text-base font-black ${
                            t.a > t.b ? "text-emerald-400" : t.b > t.a ? "text-blood" : "text-sand"
                          }`}
                        >
                          {t.a}–{t.b}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <BotonBrillante
                  onClick={() => callbackTerminar(resultado)}
                  variante="dorado"
                  className="w-full py-3 text-xs font-black"
                >
                  <I n="check" className="h-4 w-4" /> Continuar Velada
                </BotonBrillante>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default FightScreen;
export { FightScreen as PantallaPelea };
