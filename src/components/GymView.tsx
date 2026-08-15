import { useMemo } from "react";
import { FOCUS_INFO } from "../game/data";
import { capacidadAlumnos, capacidadFederados } from "../game/engine";
import { useGame } from "../game/state";
import type { Boxer } from "../game/types";
import { I } from "./ui";

export function Sprite({ b, pose = "shadow", scale = 1, onClick }: {
  b: Boxer; pose?: "shadow" | "bag" | "rope" | "rest"; scale?: number; onClick?: () => void;
}) {
  const skin = b.skin, shirt = b.short, pelo = b.pelo;
  const anim = pose === "rest" ? "anim-bob" : pose === "rope" ? "anim-rope" : "anim-bob";
  return (
    <button onClick={onClick} title={`${b.nombre} — ver ficha`}
      className="group relative flex flex-col items-center outline-none" style={{ width: 56 * scale }}>
      {/* etiqueta */}
      <div className="pointer-events-none absolute -top-7 z-10 flex items-center gap-1 whitespace-nowrap border border-line bg-ink/90 px-1.5 py-0.5 font-cond text-[10px] uppercase tracking-wide text-sand opacity-0 transition-opacity group-hover:opacity-100">
        {b.nombre.split(" ")[0]} · {FOCUS_INFO[b.focus].nombre}
      </div>
      <div className={anim} style={{ animationDelay: `${(b.nombre.length % 5) * 0.18}s` }}>
        <svg viewBox="0 0 48 66" width={52 * scale} height={71 * scale}>
          {/* sombra */}
          <ellipse cx="24" cy="62" rx="14" ry="3.4" fill="rgba(0,0,0,0.4)" />
          {pose === "bag" && (
            <g className="anim-bag" style={{ transformOrigin: "8px 4px" }}>
              <line x1="8" y1="0" x2="8" y2="6" stroke="#6b5a42" strokeWidth="2" />
              <rect x="0" y="6" width="16" height="32" rx="7" fill="#7c4a28" stroke="#5a341b" strokeWidth="1.5" />
              <line x1="3" y1="14" x2="13" y2="14" stroke="#5a341b" strokeWidth="1" />
              <line x1="3" y1="28" x2="13" y2="28" stroke="#5a341b" strokeWidth="1" />
            </g>
          )}
          {pose === "rope" && (
            <ellipse cx="24" cy="58" rx="17" ry="5" fill="none" stroke="#c9b896" strokeWidth="1.4" opacity="0.7" />
          )}
          {/* piernas */}
          <rect x="17" y="40" width="5.5" height="18" rx="2" fill="#2e2822" />
          <rect x="26" y="40" width="5.5" height="18" rx="2" fill="#2e2822" />
          <rect x="16" y="35" width="16.5" height="8" rx="2" fill={shirt} />
          {/* torso */}
          <rect x="14.5" y="19" width="19.5" height="18" rx="4" fill={shirt} />
          <rect x="14.5" y="19" width="19.5" height="5" rx="2" fill="rgba(0,0,0,0.18)" />
          {/* brazo izq (guardia) */}
          <g>
            <line x1="16" y1="23" x2="10.5" y2="28" stroke={skin} strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="10" cy="29" r="4" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
          </g>
          {/* brazo der (golpe) */}
          <g className={pose === "rest" ? "" : "anim-punch"} style={{ transformOrigin: "32px 23px" }}>
            <line x1="32.5" y1="23" x2={pose === "rest" ? "37" : "39"} y2={pose === "rest" ? "32" : "26"} stroke={skin} strokeWidth="3.4" strokeLinecap="round" />
            <circle cx={pose === "rest" ? "37.5" : "40"} cy={pose === "rest" ? "33" : "26"} r="4" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
          </g>
          {/* cabeza */}
          <circle cx="24" cy="11" r="7" fill={skin} />
          <path d="M17 10a7 7 0 0 1 14 0c0-1-.5-4.5-7-4.5S17 9 17 10z" fill={pelo} />
          {b.genero === "F" && <path d="M17 10c-1.5 1-2 4-1.5 7 1-1 1.6-3 1.8-5z" fill={pelo} />}
          {b.elite && <circle cx="24" cy="3" r="2" fill="var(--color-gold)" stroke="#8a6516" strokeWidth="0.8" />}
        </svg>
      </div>
      <div className="mt-0.5 border border-line bg-ink/85 px-1.5 py-px font-cond text-[10px] uppercase tracking-wide text-cream transition-colors group-hover:border-gold2 group-hover:text-gold">
        {b.nombre.split(" ")[0]}{b.rol === "boxeador" && <span className="text-blood"> ●</span>}
      </div>
    </button>
  );
}

function Ring({ sparring, nivel, onClickA, onClickB }: { sparring: Boxer[]; nivel: number; onClickA?: () => void; onClickB?: () => void }) {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 340 190" className="h-full w-full">
        {/* plataforma */}
        <polygon points="40,150 300,150 330,182 10,182" fill={nivel >= 3 ? "#2b2733" : "#4a3524"} />
        <rect x="40" y="140" width="260" height="12" fill={nivel >= 3 ? "#3a3547" : "#5d452c"} stroke="#2c2013" strokeWidth="1.5" />
        {/* postes */}
        {[46, 294].map(x => (
          <g key={x}>
            <rect x={x - 4} y="30" width="8" height="112" fill="#8f8577" />
            <rect x={x - 6} y="22" width="12" height="10" rx="3" fill="#d4342c" />
          </g>
        ))}
        {/* cuerdas */}
        {[52, 76, 100].map((y, i) => (
          <g key={y}>
            <line x1="46" y1={y} x2="294" y2={y} stroke={i === 1 ? "#f2e7d0" : "#d4342c"} strokeWidth="3.4" />
            <line x1="46" y1={y + 1.5} x2="294" y2={y + 1.5} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
          </g>
        ))}
        <text x="170" y="133" textAnchor="middle" fontFamily="Bebas Neue" fontSize="15" fill="rgba(242,231,208,0.5)" letterSpacing="3">LA VIDA DEL BOXEO</text>
      </svg>
      {/* sparring en el ring */}
      {sparring[0] && (
        <div className="absolute left-[24%] bottom-[24%]">
          <Sprite b={sparring[0]} pose="shadow" scale={0.82} onClick={onClickA} />
        </div>
      )}
      {sparring[1] && (
        <div className="absolute right-[24%] bottom-[24%] -scale-x-100">
          <div className="-scale-x-100"><Sprite b={sparring[1]} pose="shadow" scale={0.82} onClick={onClickB} /></div>
        </div>
      )}
    </div>
  );
}

export default function GymView({ onOpenBoxer }: { onOpenBoxer: (id: string) => void }) {
  const { state, nivel } = useGame();
  const alumnos = state.roster.filter(b => b.rol === "alumno");
  const boxeadores = state.roster.filter(b => b.rol === "boxeador");
  const elite = boxeadores.filter(b => b.elite);
  const sparring = boxeadores.filter(b => !b.elite);
  const tieneZona = state.gear.includes("zonaElite");

  const wall = nivel >= 3 ? "linear-gradient(180deg,#262033 0%,#1d1a28 60%,#171420 100%)"
    : nivel === 2 ? "linear-gradient(180deg,#413222 0%,#332618 65%,#291e12 100%)"
    : "linear-gradient(180deg,#4c3823 0%,#3b2b1a 65%,#2e2113 100%)";
  const floor = nivel >= 3 ? "linear-gradient(180deg,#241f2e,#191521)" : "linear-gradient(180deg,#6b4d2e,#4a341e)";

  const bagBoxers = useMemo(() => alumnos.filter(b => b.focus === "fuerza" || b.focus === "tecnica"), [alumnos]);
  const ropeBoxers = useMemo(() => alumnos.filter(b => b.focus === "condicion"), [alumnos]);
  const restBoxers = useMemo(() => alumnos.filter(b => b.focus === "descanso"), [alumnos]);

  return (
    <div className="panel relative overflow-hidden" style={{ minHeight: 540 }}>
      {/* pared */}
      <div className="absolute inset-x-0 top-0 h-[58%]" style={{ background: wall }}>
        {/* luces colgantes */}
        {[18, 50, 82].map((x, i) => (
          <div key={x} className="absolute top-0" style={{ left: `${x}%` }}>
            <div className="mx-auto h-8 w-px bg-line2" />
            <div className="mx-auto h-3 w-6 rounded-b-full bg-[#2c2418] border border-line2" />
            <div className="mx-auto -mt-0.5 h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--color-gold)", boxShadow: "0 0 22px 8px rgba(232,178,58,0.35)", animation: `ringPulse ${2.2 + i * 0.5}s ease-in-out infinite` }} />
          </div>
        ))}
        {/* letrero */}
        <div className="absolute left-1/2 top-8 -translate-x-1/2 text-center">
          <div className={`border-2 px-6 py-2 font-display text-3xl tracking-[0.12em] sm:text-4xl ${nivel >= 3 ? "border-neonc text-neonc" : "border-gold2 text-gold"}`}
            style={nivel >= 3 ? { textShadow: "0 0 18px rgba(56,224,207,0.8), 0 0 40px rgba(255,79,160,0.4)", boxShadow: "0 0 24px rgba(56,224,207,0.25) inset, 0 0 20px rgba(56,224,207,0.3)" } : { textShadow: "0 0 14px rgba(232,178,58,0.55)" }}>
            {state.nombreGimnasio}
          </div>
          <div className="mt-1 font-cond text-[11px] uppercase tracking-[0.3em] text-sand">Club de Box · desde el año {state.anio}</div>
        </div>
        {/* posters */}
        <div className="absolute left-[6%] top-24 hidden -rotate-2 border-4 border-[#efe3c8] bg-[#e8d9b8] p-1 sm:block" style={{ width: 74 }}>
          <div className="bg-blood px-1 py-0.5 text-center font-display text-[13px] leading-tight text-cream">VELADA<br />DE ORO</div>
          <div className="py-1 text-center font-cond text-[9px] uppercase text-ink">Sábado · 21 hs</div>
        </div>
        <div className="absolute right-[6%] top-28 hidden rotate-1 border-4 border-[#efe3c8] bg-[#e8d9b8] p-1 sm:block" style={{ width: 74 }}>
          <div className="px-1 py-1 text-center font-display text-[15px] leading-none text-ink">SE BUSCAN<br /><span className="text-blood">CAMPEONES</span></div>
        </div>
        {nivel >= 3 && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg,transparent,var(--color-neonc),var(--color-neonm),transparent)", animation: "marqueeLight 3s ease-in-out infinite" }} />
          </>
        )}
      </div>
      {/* piso */}
      <div className="absolute inset-x-0 bottom-0 h-[42%]" style={{ background: floor }}>
        <div className="absolute inset-0 opacity-25" style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 56px)" }} />
      </div>

      {/* zonas de entrenamiento */}
      <div className="absolute bottom-[6%] left-[3%] h-[34%] w-[30%]">
        <div className="pointer-events-none absolute -top-5 font-cond text-[11px] uppercase tracking-[0.25em] text-sand">Sacos</div>
        {state.gear.includes("saco") && <div className="absolute left-1 top-0 h-full w-3 bg-[#7c4a28] opacity-40" style={{ clipPath: "polygon(30% 0,70% 0,60% 100%,40% 100%)" }} />}
        {bagBoxers.slice(0, 3).map((b, i) => (
          <div key={b.id} className="absolute bottom-0" style={{ left: `${i * 32}%` }}>
            <Sprite b={b} pose="bag" onClick={() => onOpenBoxer(b.id)} />
          </div>
        ))}
        {bagBoxers.length === 0 && ropeBoxers.length === 0 && restBoxers.length === 0 && (
          <div className="absolute bottom-2 font-cond text-xs italic text-mut">Sin alumnos por ahora...</div>
        )}
      </div>

      {/* ring */}
      <div className="absolute bottom-[4%] left-[32%] h-[46%] w-[38%]">
        <Ring sparring={sparring.slice(0, 2)} nivel={nivel}
          onClickA={() => sparring[0] && onOpenBoxer(sparring[0].id)}
          onClickB={() => sparring[1] && onOpenBoxer(sparring[1].id)} />
        {sparring.length > 2 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border border-line bg-ink/85 px-2 py-0.5 font-cond text-[11px] uppercase text-sand">
            +{sparring.length - 2} en vestuarios
          </div>
        )}
      </div>

      {/* zona de cuerdas / descanso */}
      <div className="absolute bottom-[6%] right-[3%] h-[34%] w-[26%]">
        <div className="pointer-events-none absolute -top-5 right-0 font-cond text-[11px] uppercase tracking-[0.25em] text-sand">Cardio</div>
        {ropeBoxers.slice(0, 2).map((b, i) => (
          <div key={b.id} className="absolute bottom-0" style={{ right: `${i * 40}%` }}>
            <Sprite b={b} pose="rope" onClick={() => onOpenBoxer(b.id)} />
          </div>
        ))}
        {restBoxers.slice(0, 2).map((b, i) => (
          <div key={b.id} className="absolute bottom-0" style={{ right: `${10 + i * 40}%`, bottom: ropeBoxers.length ? "-4%" : "0" }}>
            <Sprite b={b} pose="rest" onClick={() => onOpenBoxer(b.id)} />
          </div>
        ))}
      </div>

      {/* zona élite */}
      {tieneZona && (
        <div className="absolute right-[3%] top-[30%] h-[24%] w-[30%] border border-neonc/50 bg-neonc/5 p-2"
          style={{ boxShadow: "0 0 22px rgba(56,224,207,0.2) inset, 0 0 16px rgba(56,224,207,0.18)" }}>
          <div className="flex items-center gap-1.5 font-cond text-[11px] uppercase tracking-[0.2em] text-neonc">
            <I n="trophy" className="h-3.5 w-3.5" /> Zona de Alto Rendimiento
          </div>
          <div className="relative mt-1 h-[75%]">
            {elite.slice(0, 3).map((b, i) => (
              <div key={b.id} className="absolute bottom-0" style={{ left: `${i * 33}%` }}>
                <Sprite b={b} pose="shadow" scale={0.9} onClick={() => onOpenBoxer(b.id)} />
              </div>
            ))}
            {elite.length === 0 && <div className="mt-4 font-cond text-xs italic text-neonc/60">Asciende a tus estrellas aquí.</div>}
          </div>
        </div>
      )}

      {/* barra de estado del gimnasio */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-ink/90 px-4 py-2">
        <span className="flex items-center gap-1.5 font-cond text-sm text-sand">
          <I n="users" className="h-4 w-4 text-gold" /> Alumnos <b className="text-cream">{alumnos.length}/{capacidadAlumnos(state)}</b>
        </span>
        <span className="flex items-center gap-1.5 font-cond text-sm text-sand">
          <I n="glove" className="h-4 w-4 text-blood" /> Federados <b className="text-cream">{boxeadores.length}/{capacidadFederados(state)}</b>
        </span>
        {tieneZona && (
          <span className="flex items-center gap-1.5 font-cond text-sm text-sand">
            <I n="trophy" className="h-4 w-4 text-neonc" /> Élite <b className="text-cream">{elite.length}/3</b>
          </span>
        )}
        <span className="ml-auto hidden font-cond text-[12px] uppercase tracking-wider text-mut sm:block">
          Haz clic en un atleta para ver su ficha
        </span>
      </div>
    </div>
  );
}
