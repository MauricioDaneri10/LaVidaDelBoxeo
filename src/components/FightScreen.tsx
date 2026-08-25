import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TITULOS } from "../game/data";
import {
  cerrarAsalto, crearEstadoPelea, fmt, PLANES, planSugerido, resolverPelea,
  simularIntercambio, simularPeleaEntera, valoracion,
} from "../game/engine";
import type { EstadoPelea, PlanId } from "../game/engine";
import { caida as sndCaida, campana, campanaFinal, conteo as sndConteo, golpe as sndGolpe } from "../game/audio";
import { useGame } from "../game/state";
import type { Pelea, ResultadoPelea } from "../game/types";
import { Figura } from "./GymView";
import { Btn, I } from "./ui";

type Fase = "cartelera" | "esquina" | "asalto" | "conteo" | "final";

interface IntercambioR { acciones: { atacante: "a" | "b"; tipo: "jab" | "poder"; conecto: boolean; dano: number; critico: boolean }[]; caida: "a" | "b" | null; ko: "a" | "b" | null; }

export default function PantallaPelea({ pelea, alTerminar }: { pelea: Pelea; alTerminar: (r: ResultadoPelea) => void }) {
  const { state } = useGame();
  const mio = state.plantel.find(p => p.id === pelea.miId)!;
  const estado = useRef<EstadoPelea | null>(null);
  if (!estado.current) estado.current = crearEstadoPelea(pelea, mio, state.equipamiento);
  const e = estado.current;

  const [fase, setFase] = useState<Fase>("cartelera");
  const [plan, setPlan] = useState<PlanId>(planSugerido(e));
  const [, setTick] = useState(0);
  const colaRef = useRef<IntercambioR[]>([]);
  const accionIdxRef = useRef(0);
  const [conteoNum, setConteoNum] = useState(1);
  const [ladoCaida, setLadoCaida] = useState<"a" | "b">("b");
  const [resultado, setResultado] = useState<ResultadoPelea | null>(null);
  const [sacudida, setSacudida] = useState(0);
  const [golpeA, setGolpeA] = useState(0);
  const [golpeB, setGolpeB] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rerender = () => setTick(t => t + 1);

  const terminar = (koLado: "a" | "b" | null) => {
    if (koLado) e.ko = koLado;
    const r = resolverPelea(e);
    setResultado(r);
    campanaFinal();
    setFase("final");
  };

  const consumirAcciones = () => {
    const cola = colaRef.current;
    if (cola.length === 0) return;
    const inter = cola[0];
    if (accionIdxRef.current < inter.acciones.length) {
      const acc = inter.acciones[accionIdxRef.current];
      accionIdxRef.current++;
      if (acc.conecto) {
        sndGolpe(acc.critico);
        if (acc.critico) setSacudida(s => s + 1);
        if (acc.atacante === "a") setGolpeB(g => g + 1); else setGolpeA(g => g + 1);
      }
      rerender();
      timerRef.current = setTimeout(consumirAcciones, acc.conecto ? (acc.critico ? 700 : 520) : 380);
      return;
    }
    // intercambio consumido
    cola.shift();
    accionIdxRef.current = 0;
    if (inter.ko) { terminar(inter.ko === "a" ? "a" : "b"); return; }
    if (inter.caida) {
      setLadoCaida(inter.caida);
      sndCaida();
      setConteoNum(1);
      setFase("conteo");
      return;
    }
    if (cola.length > 0) {
      timerRef.current = setTimeout(consumirAcciones, 300);
      return;
    }
    // fin del asalto
    cerrarAsalto(e);
    e.asalto++;
    rerender();
    if (e.asalto > e.totalAsaltos) { terminar(null); return; }
    setFase("esquina");
  };

  const iniciarAsalto = () => {
    e.A.plan = plan;
    campana();
    const ronda: IntercambioR[] = [];
    for (let i = 0; i < 3; i++) {
      const r = simularIntercambio(e);
      ronda.push({ acciones: e.acciones, caida: r.caida, ko: r.ko });
      if (r.ko) break;
    }
    colaRef.current = ronda;
    accionIdxRef.current = 0;
    setFase("asalto");
    timerRef.current = setTimeout(consumirAcciones, 600);
  };

  // conteo de protección del réferi
  useEffect(() => {
    if (fase !== "conteo") return;
    if (conteoNum > 10) {
      const caido = ladoCaida === "a" ? e.A : e.B;
      if (caido.hp <= 0 || caido.caidas >= 3) { terminar(ladoCaida); return; }
      // se levanta: sigue el resto de la cola del asalto
      setFase("asalto");
      timerRef.current = setTimeout(consumirAcciones, 500);
      return;
    }
    sndConteo();
    const t = setTimeout(() => setConteoNum(n => n + 1), 780);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, conteoNum]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const simularResto = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const r = simularPeleaEntera(e, plan);
    setResultado(r);
    campanaFinal();
    setFase("final");
  };

  const pct = (hp: number, max: number) => Math.max(0, Math.min(100, (hp / max) * 100));
  const eficaciaPct = (c: number, l: number) => l === 0 ? 0 : Math.round((c / l) * 100);
  const nombreA = mio.nombre.split(" ")[0];
  const nombreB = pelea.rival.nombre.split(" ")[0];
  const esTitulo = pelea.esTitulo > 0;

  return (
    <div className="fondo-app fixed inset-0 z-50 overflow-y-auto scroll-fino">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* encabezado de cartelera */}
        <div className="mb-4 text-center">
          <div className="font-cond text-xs uppercase tracking-[0.4em] text-sand">
            {esTitulo ? TITULOS[pelea.esTitulo as 1 | 2 | 3 | 4].cinturon + " en juego" : pelea.velada ? "Velada propia · pelea estelar" : "Noche de peleas federadas"}
          </div>
          <h1 className="font-display text-4xl tracking-wide text-cream sm:text-5xl">
            {fase === "final" ? "Fallo Oficial" : `Asalto ${Math.min(e.asalto, e.totalAsaltos)} de ${e.totalAsaltos}`}
          </h1>
          {esTitulo && fase !== "final" && (
            <div className="mx-auto mt-1 w-fit border border-gold2/70 bg-gold/10 px-3 py-0.5 font-display text-lg tracking-widest text-gold anim-cinturon">
              {TITULOS[pelea.esTitulo as 1 | 2 | 3 | 4].nombre.toUpperCase()} · {fmt(pelea.bolsa)}
            </div>
          )}
        </div>

        {/* barras de salud y energía */}
        <div className="mb-3 grid grid-cols-2 gap-4">
          {[{ l: e.A, nombre: nombreA, lado: "izq", golpes: golpeA }, { l: e.B, nombre: nombreB, lado: "der", golpes: golpeB }].map(({ l, nombre, lado, golpes }) => (
            <div key={nombre} className={`panel p-3 ${lado === "der" ? "text-right" : ""}`}>
              <div className={`flex items-baseline gap-2 ${lado === "der" ? "flex-row-reverse" : ""}`}>
                <span className="font-display text-2xl tracking-wide text-cream">{nombre}</span>
                <span className="font-cond text-xs uppercase text-mut">VG {valoracion(l.p.atrib)} · {l.p.circuito}</span>
                <span className="font-cond text-xs text-blood">Caídas: {l.caidas}</span>
              </div>
              <div className="stat-bar mt-1.5 h-3.5"><i style={{ width: `${pct(l.hp, l.hpMax)}%`, background: pct(l.hp, l.hpMax) < 30 ? "var(--color-blood)" : "var(--color-gold)" }} /></div>
              <div className={`mt-1 flex items-center gap-2 ${lado === "der" ? "flex-row-reverse" : ""}`}>
                <I n="bolt" className="h-3.5 w-3.5 text-win" />
                <div className="stat-bar h-2 w-28"><i style={{ width: `${l.energia}%`, background: "var(--color-win)" }} /></div>
                <span className="font-cond text-[11px] text-mut">Aire {Math.round(l.energia)}</span>
                {l.aturdido > 0 && <span className="font-cond text-[11px] text-blood anim-latido">ATURDIDO</span>}
              </div>
            </div>
          ))}
        </div>

        {/* RING */}
        <div key={sacudida} className={`panel relative overflow-hidden ${sacudida > 0 && fase === "asalto" ? "anim-shake" : ""}`} style={{ minHeight: 320 }}>
          {/* público */}
          <div className="absolute inset-x-0 top-0 h-16 opacity-70"
            style={{ background: "repeating-linear-gradient(90deg, #241c12 0 14px, #2a2015 14px 28px, #211a10 28px 42px)" }}>
            <div className="flex h-full items-end justify-around">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="anim-bob h-5 w-5 rounded-full" style={{ background: ["#5a4630", "#3f4a55", "#553a3a", "#44503c"][i % 4], animationDelay: `${(i % 6) * 0.2}s` }} />
              ))}
            </div>
          </div>
          {/* estructura del ring */}
          <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[62%] w-full">
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
            <text x="200" y="118" textAnchor="middle" fontFamily="Bebas Neue" fontSize="16" fill="rgba(242,231,208,0.4)" letterSpacing="4">LA VIDA DEL BOXEO</text>
          </svg>

          {/* peleadores */}
          <div className={`absolute bottom-[16%] left-[16%] transition-transform duration-200 ${fase === "asalto" ? "translate-x-2" : ""}`}>
            <div key={`a${golpeA}`} className={golpeA > 0 && fase === "asalto" ? "anim-golpe" : ""}>
              <div className={ladoCaida === "a" && (fase === "conteo" || (fase === "final" && e.ko === "a")) ? "anim-caida" : ""}>
                <Figura p={e.A.p} pose={ladoCaida === "a" && fase === "conteo" ? "caido" : "guardia"} escala={1.5} />
              </div>
            </div>
          </div>
          <div className={`absolute bottom-[16%] right-[16%] transition-transform duration-200 ${fase === "asalto" ? "-translate-x-2" : ""}`}>
            <div key={`b${golpeB}`} className={golpeB > 0 && fase === "asalto" ? "anim-golpe" : ""}>
              <div className={ladoCaida === "b" && (fase === "conteo" || (fase === "final" && e.ko === "b")) ? "anim-caida" : ""}>
                <div className="-scale-x-100">
                  <Figura p={e.B.p} pose={ladoCaida === "b" && fase === "conteo" ? "caido" : "guardia"} escala={1.5} />
                </div>
              </div>
            </div>
          </div>

          {/* réferi */}
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

          {/* conteo de protección */}
          <AnimatePresence>
            {fase === "conteo" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center bg-black/40">
                <div className="text-center">
                  <div className="font-cond text-sm uppercase tracking-[0.35em] text-sand">Caída a la lona · Conteo de protección</div>
                  <div key={conteoNum} className="anim-conteo font-display text-9xl text-gold" style={{ textShadow: "0 0 30px rgba(232,178,58,0.6), 4px 4px 0 rgba(0,0,0,0.6)" }}>
                    {Math.min(conteoNum, 10)}
                  </div>
                  <Btn small variant="ghost" onClick={() => setConteoNum(11)}>Saltar conteo</Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* comentario ringside */}
          <div className="absolute bottom-1 left-1/2 w-[92%] -translate-x-1/2 border border-line bg-ink/90 px-3 py-1.5 text-center">
            <span className="font-cond text-sm text-sand">
              <span className="mr-1.5 font-bold uppercase tracking-widest text-gold">Ringside:</span>
              {fase === "cartelera" && "Los pugilistas se miden con la mirada. La arena huele a linimento y gloria."}
              {fase === "esquina" && `Minuto de descanso: elegí la instrucción para el asalto ${Math.min(e.asalto, e.totalAsaltos)}.`}
              {fase === "asalto" && `${nombreA} (${PLANES[e.A.plan].nombre.toLowerCase()}) contra ${nombreB}. ¡No parpadees!`}
              {fase === "conteo" && `¡${ladoCaida === "a" ? nombreA : nombreB} besa la lona! El réferi cuenta hasta diez...`}
              {fase === "final" && resultado && `${resultado.metodo}. ${resultado.gane ? `¡${nombreA} lo logró!` : `${nombreB} se lleva la noche.`}`}
            </span>
          </div>
        </div>

        {/* Registro Oficial de Golpes en vivo */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_300px]">
          <div className="panel p-3">
            <div className="mb-1.5 flex items-center gap-2 font-display text-lg tracking-wide text-gold">
              <I n="target" className="h-4 w-4" /> Registro Oficial de Golpes
            </div>
            <table className="w-full font-cond text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-mut">
                  <th className="py-1">Pugilista</th><th>Jabs</th><th>%</th><th>Golpes de poder</th><th>%</th>
                </tr>
              </thead>
              <tbody>
                {[{ l: e.A, n: nombreA }, { l: e.B, n: nombreB }].map(({ l, n }) => (
                  <tr key={n} className="border-t border-line">
                    <td className="py-1.5 font-semibold text-cream">{n}</td>
                    <td className="text-sand">{l.registro.jab.conectados}/{l.registro.jab.lanzados}</td>
                    <td className="text-gold">{eficaciaPct(l.registro.jab.conectados, l.registro.jab.lanzados)}%</td>
                    <td className="text-sand">{l.registro.poder.conectados}/{l.registro.poder.lanzados}</td>
                    <td className="text-blood">{eficaciaPct(l.registro.poder.conectados, l.registro.poder.lanzados)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1 font-cond text-[11px] uppercase tracking-wide text-mut">
              Eficacia = golpes conectados vs golpes al aire
            </div>
          </div>

          {/* instrucciones / controles */}
          <div className="panel p-3">
            {fase === "cartelera" && (
              <div className="space-y-2">
                <div className="font-display text-lg text-cream">Tale of the Tape</div>
                <div className="font-cond text-sm text-sand">
                  {nombreA}: VG {valoracion(mio.atrib)} · {mio.division} · {mio.record.v}-{mio.record.d}<br />
                  {nombreB}: VG {valoracion(pelea.rival.atrib)} · {pelea.rival.division} · {pelea.rival.record.v}-{pelea.rival.record.d}<br />
                  Bolsa en juego: <b className="text-gold">{fmt(pelea.bolsa)}</b> · Asaltos: {e.totalAsaltos}
                </div>
                <Btn variant="gold" className="w-full" onClick={() => setFase("esquina")}><I n="bell" className="h-4 w-4" /> ¡Que suene la campana!</Btn>
              </div>
            )}
            {fase === "esquina" && (
              <div className="space-y-1.5">
                <div className="font-display text-lg text-gold">Tu esquina · instrucciones</div>
                {(Object.keys(PLANES) as PlanId[]).map(pid => (
                  <button key={pid} onClick={() => setPlan(pid)}
                    className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-left transition-colors ${plan === pid ? "border-gold bg-gold/10" : "border-line bg-panel2 hover:border-line2"}`}>
                    <I n={PLANES[pid].icono} className={`h-4 w-4 ${plan === pid ? "text-gold" : "text-sand"}`} />
                    <span>
                      <span className="block font-display text-base leading-tight text-cream">{PLANES[pid].nombre}</span>
                      <span className="block font-cond text-[11px] leading-tight text-sand">{PLANES[pid].desc}</span>
                    </span>
                  </button>
                ))}
                <Btn variant="blood" className="mt-1 w-full" onClick={iniciarAsalto} pulso><I n="play" className="h-4 w-4" /> Al ring</Btn>
              </div>
            )}
            {(fase === "asalto" || fase === "conteo") && (
              <div className="flex h-full flex-col justify-between gap-2">
                <div className="font-cond text-sm text-sand">Plan actual: <b className="text-gold">{PLANES[e.A.plan].nombre}</b><br />Asalto {Math.min(e.asalto, e.totalAsaltos)}/{e.totalAsaltos}</div>
                <Btn variant="ghost" onClick={simularResto}><I n="ff" className="h-4 w-4" /> Simular resto de la pelea</Btn>
              </div>
            )}
            {fase === "final" && resultado && (
              <div className="space-y-2">
                <div className={`font-display text-2xl ${resultado.gane ? "text-win" : "text-blood"}`}>
                  {resultado.gane ? "¡VICTORIA!" : "DERROTA"}
                </div>
                <div className="font-cond text-sm text-sand">{resultado.metodo} · {resultado.resumen}</div>
                <div className="font-cond text-sm text-sand">Bolsa cobrada: <b className="text-gold">{fmt(resultado.bolsa)}</b> · +{resultado.fama} de fama</div>
                {resultado.tituloGanado > 0 && (
                  <div className="anim-cinturon border-2 border-gold bg-gold/10 px-3 py-1.5 text-center font-display text-lg tracking-widest text-gold">
                    ¡{TITULOS[resultado.tituloGanado as 1 | 2 | 3 | 4].cinturon.toUpperCase()}!
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1.5">
                  {resultado.tarjetas.map((t, i) => (
                    <div key={i} className="border border-line bg-panel2 px-1 py-1 text-center">
                      <div className="font-cond text-[10px] uppercase text-mut">Juez {i + 1}</div>
                      <div className={`font-display text-lg ${t.a > t.b ? "text-win" : t.b > t.a ? "text-blood" : "text-sand"}`}>{t.a}–{t.b}</div>
                    </div>
                  ))}
                </div>
                <Btn variant="gold" className="w-full" onClick={() => alTerminar(resultado)}><I n="check" className="h-4 w-4" /> Continuar la noche</Btn>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
