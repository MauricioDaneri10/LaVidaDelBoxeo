import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMENTARIOS_CRIT, COMENTARIOS_FAIL, COMENTARIOS_HIT, INSTRUCCIONES, fmt } from "../game/data";
import { intercambio, instruccionIA, recuperarRound, roundsPara, type LiveFighter } from "../game/engine";
import { useGame } from "../game/state";
import type { FightResult, FightSetup, Instruccion } from "../game/types";
import { Btn, Chip, I } from "./ui";

const EXCH = 8;

function FighterSprite({ b, side, pose, animKey }: { b: FightSetup["miBoxeador"]; side: "L" | "R"; pose: "guard" | "hit"; animKey: number }) {
  const dir = side === "L" ? 1 : -1;
  return (
    <motion.div key={animKey}
      animate={pose === "hit" ? { x: -14 * dir, rotate: -5 * dir } : { x: 22 * dir, rotate: 2 * dir }}
      transition={{ duration: 0.16, yoyo: true, repeat: 1, repeatType: "reverse" }}
      className="relative" style={{ transform: side === "R" ? "scaleX(-1)" : undefined }}>
      <svg viewBox="0 0 130 170" width="150" height="196">
        <ellipse cx="62" cy="160" rx="34" ry="7" fill="rgba(0,0,0,0.45)" />
        {/* pierna trasera */}
        <path d="M72 96 Q 88 118 84 142" stroke={b.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M84 142 l 12 4" stroke="#2e2822" strokeWidth="9" strokeLinecap="round" />
        {/* pierna delantera */}
        <path d="M58 96 Q 46 118 42 142" stroke={b.skin} strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M42 142 l -12 4" stroke="#2e2822" strokeWidth="9" strokeLinecap="round" />
        {/* calzones */}
        <path d="M48 78 h 34 v 22 l -10 6 h -14 l -10 -6 z" fill={b.short} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
        <rect x="48" y="78" width="34" height="6" fill="rgba(255,255,255,0.25)" />
        {/* torso */}
        <path d="M50 82 Q 46 56 56 42 L 78 44 Q 86 62 82 84 Z" fill={b.skin} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
        {/* cabeza */}
        <g transform={pose === "hit" ? "rotate(-10 52 30)" : undefined}>
          <circle cx="52" cy="27" r="13" fill={b.skin} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
          <path d="M40 24 a 13 13 0 0 1 24 -3 c -2 -8 -9 -11 -13 -10 c -6 1 -10 6 -11 13z" fill={b.pelo} />
          <circle cx="46" cy="27" r="1.6" fill="#241a12" />
        </g>
        {/* brazo trasero (guardia) */}
        <path d="M76 50 Q 74 40 64 38" stroke={b.skin} strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="62" cy="38" r="9" fill="#d4342c" stroke="#8f1f1a" strokeWidth="2" />
        {/* brazo delantero (jab) */}
        <path d={pose === "hit" ? "M54 52 Q 40 56 34 62" : "M54 52 Q 34 50 22 50"} stroke={b.skin} strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx={pose === "hit" ? 32 : 18} cy={pose === "hit" ? 63 : 50} r="10" fill="#d4342c" stroke="#8f1f1a" strokeWidth="2" />
      </svg>
    </motion.div>
  );
}

function Bar({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between font-cond text-[10px] uppercase tracking-widest text-sand"><span>{label}</span><span>{Math.max(0, Math.round(v))}</span></div>
      <div className="stat-bar h-3"><i style={{ width: `${Math.max(0, v)}%`, background: color, transition: "width .3s ease" }} /></div>
    </div>
  );
}

export default function FightScreen({ fight, onDone }: { fight: FightSetup; onDone: (r: FightResult) => void }) {
  const { state } = useGame();
  const total = roundsPara(fight);
  const liveRef = useRef({
    a: { b: fight.miBoxeador, hp: 100, en: fight.miBoxeador.energia, score: 0 } as LiveFighter,
    b: { b: fight.rival, hp: 100, en: fight.rival.energia, score: 0 } as LiveFighter,
  });
  const [view, setView] = useState({ ...liveRef.current, a: { ...liveRef.current.a }, b: { ...liveRef.current.b } });
  const [phase, setPhase] = useState<"intro" | "corner" | "round" | "end">("intro");
  const [round, setRound] = useState(1);
  const exRef = useRef(0);
  const [exIdx, setExIdx] = useState(0);
  const [myInstr, setMyInstr] = useState<Instruccion>("presionar");
  const myInstrRef = useRef<Instruccion>("presionar");
  const [comentario, setComentario] = useState("El réferi da las instrucciones...");
  const [floats, setFloats] = useState<{ id: number; side: "a" | "b"; txt: string; crit: boolean }[]>([]);
  const [hitSide, setHitSide] = useState<{ side: "a" | "b"; key: number } | null>(null);
  const [result, setResult] = useState<FightResult | null>(null);
  const [shakeOn, setShakeOn] = useState(false);
  const fastRef = useRef(false);
  const floatId = useRef(1);

  const crowd = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    x: 2 + (i % 23) * 4.3 + (i > 22 ? 2 : 0), y: i > 22 ? 5 : 0,
    c: ["#5d4a35", "#4a3a2a", "#6b573f", "#54432f", "#7a6248"][i % 5],
  })), []);

  const nombres = { a: fight.miBoxeador.nombre.split(" ")[0], b: fight.rival.nombre.split(" ")[0] };

  const terminar = (metodo: "KO" | "Decision", gane: boolean) => {
    setResult({ fightId: fight.id, gane, metodo, rounds: round, purse: fight.purse, titulo: fight.titulo });
    setPhase("end");
  };

  const paso = () => {
    const L = liveRef.current;
    const iaRival = instruccionIA(L.b, L.a);
    const res = intercambio(L.a, L.b, myInstrRef.current, iaRival, fight.esVelada);
    exRef.current += 1;
    setExIdx(exRef.current);
    setView({ a: { ...L.a }, b: { ...L.b } });
    if (res.hit) {
      const atacante = res.atacante === "a" ? nombres.a : nombres.b;
      const defensor = res.atacante === "a" ? nombres.b : nombres.a;
      const pool = res.crit ? COMENTARIOS_CRIT : COMENTARIOS_HIT;
      setComentario(pool[Math.floor(Math.random() * pool.length)].replace("{a}", atacante).replace("{b}", defensor) + (res.crit ? "" : ` (-${res.dmg.toFixed(0)})`));
      setFloats(f => [...f.slice(-4), { id: floatId.current++, side: res.atacante === "a" ? "b" : "a", txt: `-${res.dmg.toFixed(0)}`, crit: res.crit }]);
      setHitSide({ side: res.atacante === "a" ? "b" : "a", key: floatId.current });
      if (res.crit) {
        setShakeOn(true);
        setTimeout(() => setShakeOn(false), 420);
      }
    } else {
      setComentario(COMENTARIOS_FAIL[Math.floor(Math.random() * COMENTARIOS_FAIL.length)].replace("{a}", nombres.a).replace("{b}", nombres.b));
    }
    if (res.ko) {
      terminar("KO", res.atacante === "a");
      return true;
    }
    if (exRef.current >= EXCH) {
      if (round >= total) {
        const sa = L.a.score + L.a.b.mentalidad * 0.15 + Math.random() * 6;
        const sb = L.b.score + L.b.b.mentalidad * 0.15 + Math.random() * 6;
        setComentario("Suena la campana final. Los jueces suman sus tarjetas...");
        terminar("Decision", sa >= sb);
      } else {
        recuperarRound(L.a, myInstrRef.current);
        recuperarRound(L.b, iaRival);
        setView({ a: { ...L.a }, b: { ...L.b } });
        setPhase("corner");
        setComentario("Fin del round. A la esquina: banquito, agua y consejos.");
      }
      return true;
    }
    return false;
  };

  // intro → corner
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setPhase("corner"), 1900);
    return () => clearTimeout(t);
  }, [phase]);

  // bucle del round
  useEffect(() => {
    if (phase !== "round") return;
    if (fastRef.current) {
      let guard = 0;
      while (guard++ < 400 && !paso()) { /* simulación rápida */ }
      return;
    }
    const t = setTimeout(() => paso(), 640);
    return () => clearTimeout(t);
  });

  const limpiarFloats = () => setTimeout(() => setFloats([]), 900);
  useEffect(() => { if (floats.length) { const t = limpiarFloats(); return () => clearTimeout(t); } }, [floats]);

  const comenzarRound = () => {
    exRef.current = 0;
    setExIdx(0);
    const next = phase === "corner" && exIdx > 0 ? round + 1 : round;
    setRound(next);
    setComentario(`¡Round ${next}! Campana y a pelear.`);
    setPhase("round");
  };

  const simularTodo = () => {
    fastRef.current = true;
    exRef.current = 0;
    setPhase("round");
  };

  const elegir = (i: Instruccion) => { setMyInstr(i); myInstrRef.current = i; };

  return (
    <motion.div className="fixed inset-0 z-50 overflow-y-auto bg-ink/97" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center gap-4 p-4">
        {/* encabezado */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="text-center">
            <div className="font-display text-3xl tracking-wide text-cream sm:text-4xl">{fight.miBoxeador.nombre}</div>
            <div className="font-cond text-xs uppercase tracking-widest text-sand">{fight.miBoxeador.ganadas}-{fight.miBoxeador.perdidas} · {fight.miBoxeador.division} · TÚ</div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display text-5xl text-blood" style={{ textShadow: "0 0 18px rgba(212,52,44,0.6)" }}>VS</span>
            <div className="flex gap-1.5">
              {fight.titulo && <Chip tone="gold"><I n="trophy" className="h-3 w-3" /> Por el título</Chip>}
              {fight.esVelada && <Chip tone="blood">Velada propia</Chip>}
              <Chip>{fight.circuito} · {total} rounds</Chip>
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl tracking-wide text-cream sm:text-4xl">{fight.rival.nombre}</div>
            <div className="font-cond text-xs uppercase tracking-widest text-sand">{fight.rival.ganadas}-{fight.rival.perdidas} · {fight.rival.division}{fight.rival.campeon ? " · Campeón" : ""}</div>
          </div>
        </div>

        {/* barras */}
        <div className="grid grid-cols-2 gap-4">
          <div className="panel space-y-1.5 p-3">
            <Bar label="Salud" v={view.a.hp} color="var(--color-blood)" />
            <Bar label="Energía" v={view.a.en} color="var(--color-win)" />
          </div>
          <div className="panel space-y-1.5 p-3">
            <Bar label="Salud" v={view.b.hp} color="var(--color-blood)" />
            <Bar label="Energía" v={view.b.en} color="var(--color-win)" />
          </div>
        </div>

        {/* ring */}
        <div className={`panel relative overflow-hidden ${shakeOn ? "anim-shake" : ""}`} style={{ minHeight: 300 }}>
          {/* público */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#191310] to-[#221a12]">
            {crowd.map((c, i) => (
              <div key={i} className="absolute h-2.5 w-2.5 rounded-full" style={{ left: `${c.x}%`, top: c.y + 8, background: c.c, animation: `crowdWave ${1.4 + (i % 5) * 0.2}s ease-in-out infinite`, animationDelay: `${(i % 7) * 0.12}s` }} />
            ))}
          </div>
          {/* cuerdas */}
          {[70, 100, 130].map(y => (
            <div key={y} className="absolute left-0 right-0" style={{ top: y }}>
              <div className={`h-[5px] ${y === 100 ? "bg-cream/80" : "bg-blood"}`} style={{ boxShadow: "0 2px 3px rgba(0,0,0,0.5)" }} />
            </div>
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-[#5d452c] to-[#3b2b1a]">
            <div className="absolute inset-0 opacity-20" style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0 2px, transparent 2px 60px)" }} />
          </div>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 font-display text-4xl tracking-[0.3em] text-cream/10">{state.nombreGimnasio}</div>

          {/* boxeadores */}
          <div className="absolute bottom-10 left-[12%] sm:left-[18%]">
            <FighterSprite b={fight.miBoxeador} side="L" pose={hitSide?.side === "a" ? "hit" : "guard"} animKey={hitSide?.side === "b" ? hitSide.key : 0} />
          </div>
          <div className="absolute bottom-10 right-[12%] sm:right-[18%]">
            <FighterSprite b={fight.rival} side="R" pose={hitSide?.side === "b" ? "hit" : "guard"} animKey={hitSide?.side === "a" ? hitSide.key : 0} />
          </div>

          {/* números de daño */}
          {floats.map(f => (
            <div key={f.id} className={`anim-float pointer-events-none absolute font-display ${f.crit ? "text-4xl text-gold" : "text-2xl text-cream"}`}
              style={{ left: f.side === "a" ? "24%" : "68%", top: "38%", textShadow: "2px 2px 0 rgba(0,0,0,0.7)" }}>
              {f.txt}{f.crit && " ✦"}
            </div>
          ))}

          {/* round */}
          <div className="absolute right-3 top-20 border border-gold2 bg-ink/85 px-3 py-1 text-center">
            <div className="font-display text-2xl leading-none text-gold">R{Math.min(round, total)}</div>
            <div className="font-cond text-[10px] uppercase text-mut">{exIdx}/{EXCH}</div>
          </div>

          {/* comentarista */}
          <div className="absolute bottom-2 left-1/2 w-[94%] -translate-x-1/2 border border-line bg-ink/90 px-3 py-1.5 text-center">
            <motion.span key={comentario} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-cond text-sm text-sand">
              <span className="mr-1.5 font-bold uppercase tracking-widest text-gold">Ringside:</span>{comentario}
            </motion.span>
          </div>
        </div>

        {/* controles */}
        {phase === "intro" && (
          <div className="text-center font-display text-3xl tracking-widest text-gold" style={{ animation: "ringPulse 1s ease-in-out infinite" }}>
            PRESENTANDO A LOS CONTENDIENTES...
          </div>
        )}

        {phase === "corner" && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="panel space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 font-display text-2xl tracking-wide text-gold">
                <I n="glove" className="h-5 w-5" /> Tu esquina · instrucciones {round === 1 && exIdx === 0 ? "para el round 1" : `para el round ${round + 1}`}
              </h4>
              <div className="font-cond text-xs uppercase tracking-wide text-mut">Tu boxeador aplica tu plan; el rival decide solo.</div>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {(Object.keys(INSTRUCCIONES) as Instruccion[]).map(k => (
                <button key={k} onClick={() => elegir(k)}
                  className={`border p-2.5 text-left transition-all ${myInstr === k ? "border-gold bg-gold/15 hard-shadow-sm" : "border-line bg-panel2 hover:border-line2"}`}>
                  <div className={`font-display text-lg leading-tight ${myInstr === k ? "text-gold" : "text-cream"}`}>{INSTRUCCIONES[k].nombre}</div>
                  <div className="font-cond text-[11px] text-mut">{INSTRUCCIONES[k].desc}</div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={comenzarRound}><I n="play" className="h-4 w-4" /> {round === 1 && exIdx === 0 ? "¡Que suene la campana!" : `Salir al round ${round + 1}`}</Btn>
              <Btn variant="ghost" onClick={simularTodo}><I n="ff" className="h-4 w-4" /> Simular el resto</Btn>
            </div>
          </motion.div>
        )}

        {phase === "round" && (
          <div className="text-center font-cond text-sm uppercase tracking-[0.3em] text-mut">
            {fastRef.current ? "Simulando..." : "En vivo desde el ringside"}
            <button onClick={simularTodo} className="ml-3 border border-line px-2 py-0.5 text-gold transition-colors hover:border-gold2">simular ⏩</button>
          </div>
        )}

        {/* resultado */}
        <AnimatePresence>
          {phase === "end" && result && (
            <motion.div className="fixed inset-0 z-10 flex items-center justify-center bg-black/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="panel w-full max-w-md p-6 text-center hard-shadow">
                <div className={`font-display text-6xl leading-none ${result.gane ? "text-gold" : "text-lose"}`}
                  style={{ textShadow: result.gane ? "0 0 24px rgba(232,178,58,0.5)" : "none" }}>
                  {result.gane ? "¡VICTORIA!" : "DERROTA"}
                </div>
                <div className="mt-1 font-display text-2xl tracking-widest text-cream">
                  POR {result.metodo === "KO" ? "NOCAUT" : "DECISIÓN"} · ROUND {result.rounds}
                </div>
                {result.titulo && result.gane && (
                  <div className="mx-auto mt-3 flex w-fit items-center gap-2 border-2 border-gold bg-gold/15 px-4 py-1.5 font-display text-xl tracking-widest text-gold" style={{ boxShadow: "0 0 20px rgba(232,178,58,0.35)" }}>
                    <I n="trophy" className="h-5 w-5" /> NUEVO CAMPEÓN DE {fight.miBoxeador.division.toUpperCase()}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 font-cond">
                  <div className="border border-line bg-panel2 py-2"><div className="text-xl font-bold text-cream">{Math.round(view.a.score)}</div><div className="text-[10px] uppercase text-mut">Daño tuyo</div></div>
                  <div className="border border-line bg-panel2 py-2"><div className="text-xl font-bold text-cream">{Math.round(view.b.score)}</div><div className="text-[10px] uppercase text-mut">Daño rival</div></div>
                  <div className="border border-line bg-panel2 py-2"><div className="text-xl font-bold text-gold">{fmt(result.gane ? result.purse : Math.round(result.purse * 0.35))}</div><div className="text-[10px] uppercase text-mut">Bolsa</div></div>
                </div>
                <p className="mt-3 font-cond text-sm text-sand">
                  {result.gane ? "El vestuario es una fiesta. La fama crece y el ranking se mueve." : "Se pierde una pelea, no el camino: el público valoró la entrega (+1 fama)."}
                </p>
                <div className="mt-4">
                  <Btn onClick={() => onDone(result)}><I n="chevR" className="h-4 w-4" /> Continuar</Btn>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
