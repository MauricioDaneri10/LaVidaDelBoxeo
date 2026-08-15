import { FOCUS_INFO, TRAITS, fmt } from "../game/data";
import { capacidadFederados, potencial, rankingDe } from "../game/engine";
import { useGame } from "../game/state";
import type { Focus } from "../game/types";
import { Btn, Chip, EnergyBar, I, Modal, StatRow } from "./ui";
import { Sprite } from "./GymView";

export default function BoxerSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useGame();
  const b = state.roster.find(x => x.id === id);
  if (!b) return null;

  const overall = Math.round(
    b.fuerza * 0.11 + b.velocidad * 0.11 + b.potencia * 0.11 + b.resistencia * 0.1 +
    b.ataque * 0.13 + b.defensa * 0.12 + b.tecnica * 0.12 +
    b.inteligencia * 0.07 + b.mentalidad * 0.06 + b.talento * 0.07
  );
  const rank = b.rol === "boxeador" ? rankingDe(state, b) : null;
  const programada = state.schedule.includes(b.id);
  const puedePelear = b.rol === "boxeador" && state.dia <= 5 && !programada && state.schedule.length < 3 && b.energia >= 40;
  const puedeFederar = b.rol === "alumno" && state.courses.includes("tecnico") &&
    state.roster.filter(x => x.rol === "boxeador").length < capacidadFederados(state) && state.dinero >= 200;
  const puedePro = b.rol === "boxeador" && b.circuito === "amateur" && (b.campeon || b.ganadas >= 5);
  const zonaDisponible = state.gear.includes("zonaElite");
  const elites = state.roster.filter(x => x.elite).length;

  return (
    <Modal title={b.nombre} icon="glove" onClose={onClose} wide>
      <div className="grid gap-5 md:grid-cols-[190px_1fr]">
        {/* retrato */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-48 w-full items-end justify-center overflow-hidden border border-line bg-gradient-to-b from-panel2 to-ink">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(232,178,58,0.25),transparent)]" />
            <div className="relative" style={{ marginBottom: 4 }}>
              <Sprite b={b} pose={b.rol === "boxeador" ? "shadow" : "rest"} scale={1.45} />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            <Chip tone={b.rol === "boxeador" ? "blood" : "mut"}>{b.rol}</Chip>
            {b.rol === "boxeador" && <Chip tone={b.circuito === "pro" ? "gold" : "mut"}>{b.circuito}</Chip>}
            {b.campeon && <Chip tone="gold"><I n="trophy" className="h-3 w-3" /> Campeón</Chip>}
            {b.elite && <Chip tone="neon">Élite</Chip>}
          </div>
          <div className="text-center font-cond text-sm text-sand">
            {b.genero === "M" ? "Masculino" : "Femenino"} · {b.division} · {b.edad} años
          </div>
          {b.rol === "boxeador" && (
            <div className="text-center">
              <div className="font-display text-3xl tracking-wider text-cream">{b.ganadas}-{b.perdidas}</div>
              <div className="font-cond text-xs uppercase tracking-widest text-mut">{b.kos} por KO · {rank ? `Ranking #${rank}` : "Sin ranking"}</div>
            </div>
          )}
        </div>

        {/* datos */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="border-2 border-gold2 bg-gold/10 px-4 py-1.5 text-center hard-shadow-sm">
              <div className="font-display text-4xl leading-none text-gold">{overall}</div>
              <div className="font-cond text-[10px] uppercase tracking-widest text-sand">Global</div>
            </div>
            <div className="text-center">
              <div className="font-cond text-2xl font-bold text-cream">{potencial(b)}</div>
              <div className="font-cond text-[10px] uppercase tracking-widest text-mut">Potencial</div>
            </div>
            <div>
              <div className="mb-1 font-cond text-[10px] uppercase tracking-widest text-mut">Energía</div>
              <EnergyBar v={b.energia} />
            </div>
            {b.rol === "alumno" && (
              <div className="text-center">
                <div className="font-cond text-2xl font-bold" style={{ color: b.talento >= 68 ? "var(--color-gold)" : "var(--color-cream)" }}>{b.talento}</div>
                <div className="font-cond text-[10px] uppercase tracking-widest text-mut">Talento {b.talento >= 68 ? "· ¡joya!" : ""}</div>
              </div>
            )}
          </div>

          {b.trait && TRAITS[b.trait] && (
            <div className="flex items-start gap-2.5 border border-gold2/50 bg-gold/5 px-3 py-2">
              <I n="spark" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <div className="font-cond text-sm font-bold uppercase tracking-wide text-gold">{TRAITS[b.trait].nombre}</div>
                <div className="text-sm text-sand">{TRAITS[b.trait].desc}</div>
              </div>
            </div>
          )}

          {/* atributos */}
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="font-cond text-[11px] uppercase tracking-[0.2em] text-blood">Físico</div>
              <StatRow label="Fuerza" v={b.fuerza} />
              <StatRow label="Velocidad" v={b.velocidad} />
              <StatRow label="Potencia" v={b.potencia} />
              <StatRow label="Resistencia" v={b.resistencia} />
            </div>
            <div className="space-y-1.5">
              <div className="font-cond text-[11px] uppercase tracking-[0.2em] text-gold">Técnico</div>
              <StatRow label="Ataque" v={b.ataque} />
              <StatRow label="Defensa" v={b.defensa} />
              <StatRow label="Técnica" v={b.tecnica} />
            </div>
          </div>
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="font-cond text-[11px] uppercase tracking-[0.2em] text-neonc">Mental</div>
              <StatRow label="Inteligencia" v={b.inteligencia} />
              <StatRow label="Mentalidad" v={b.mentalidad} />
              <StatRow label="Talento" v={b.talento} />
            </div>
            <div>
              <div className="mb-1.5 font-cond text-[11px] uppercase tracking-[0.2em] text-sand">Enfoque semanal</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(FOCUS_INFO) as Focus[]).map(f => (
                  <button key={f} onClick={() => dispatch({ type: "SET_FOCUS", id: b.id, focus: f })}
                    className={`flex items-center gap-1.5 border px-2 py-1.5 text-left font-cond text-xs uppercase tracking-wide transition-colors ${b.focus === f ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel2 text-sand hover:border-line2"}`}>
                    <I n={FOCUS_INFO[f].icon} className="h-3.5 w-3.5 shrink-0" /> {FOCUS_INFO[f].nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* acciones */}
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            {b.rol === "alumno" && (
              state.courses.includes("tecnico")
                ? <Btn variant="gold" disabled={!puedeFederar} onClick={() => dispatch({ type: "FEDERAR", id: b.id })}>
                    <I n="flag" className="h-4 w-4" /> Federar · {fmt(200)}
                  </Btn>
                : <Chip>Necesitas el curso Director Técnico para federar</Chip>
            )}
            {b.rol === "boxeador" && (
              <>
                {programada
                  ? <Btn variant="dark" onClick={() => dispatch({ type: "UNSCHEDULE", id: b.id })}><I n="x" className="h-4 w-4" /> Quitar de la cartelera</Btn>
                  : <Btn disabled={!puedePelear} onClick={() => dispatch({ type: "SCHEDULE_FIGHT", id: b.id })}>
                      <I n="glove" className="h-4 w-4" /> Programar pelea (sábado)
                    </Btn>}
                {puedePro && (
                  <Btn variant="gold" onClick={() => dispatch({ type: "PROMOVER_PRO", id: b.id })}>
                    <I n="up" className="h-4 w-4" /> Pasar a profesional
                  </Btn>
                )}
                {zonaDisponible && (
                  <Btn variant="dark" disabled={!b.elite && elites >= 3} onClick={() => dispatch({ type: "TOGGLE_ELITE", id: b.id })}>
                    <I n="trophy" className="h-4 w-4" /> {b.elite ? "Bajar de Zona Élite" : "Subir a Zona Élite"}
                  </Btn>
                )}
              </>
            )}
          </div>
          {b.rol === "boxeador" && b.energia < 40 && !programada && (
            <p className="font-cond text-xs uppercase tracking-wide text-lose">Energía insuficiente para pelear (mínimo 40)</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
