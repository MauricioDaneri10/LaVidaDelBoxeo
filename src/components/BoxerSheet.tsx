import { motion } from "framer-motion";
import { COMBOS, LISTA_COMBOS, TITULOS } from "../game/data";
import { consejoEsquina, fmt, rasgoInfo, tituloAspirable, valoracion } from "../game/engine";
import { useGame } from "../game/state";
import type { ComboId } from "../game/types";
import { Figura } from "./GymView";
import { BarraEnergia, Btn, Chip, FilaStat, I, Modal } from "./ui";

const PILARES: { titulo: string; color: string; stats: { k: keyof import("../game/types").Atributos; n: string }[] }[] = [
  { titulo: "Pilar Físico", color: "text-blood", stats: [
    { k: "fuerza", n: "Fuerza" }, { k: "velocidad", n: "Velocidad" }, { k: "potencia", n: "Potencia" }, { k: "resistencia", n: "Resistencia" },
  ]},
  { titulo: "Pilar Técnico", color: "text-gold", stats: [
    { k: "ataque", n: "Ataque" }, { k: "defensa", n: "Defensa" }, { k: "tecnica", n: "Técnica" }, { k: "eficacia", n: "Eficacia" },
  ]},
  { titulo: "Pilar Mental", color: "text-neonc", stats: [
    { k: "inteligencia", n: "Inteligencia" }, { k: "mentalidad", n: "Mentalidad" }, { k: "talento", n: "Talento (techo)" },
  ]},
];

export default function FichaAtleta({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  const { state, dispatch } = useGame();
  const p = state.plantel.find(x => x.id === id);
  if (!p) return null;

  const vg = valoracion(p.atrib);
  const rasgo = rasgoInfo(p.rasgo);
  const peleaAgendada = state.pendientes.find(x => x.miId === p.id);
  const rivalSabado = peleaAgendada?.rival ?? null;
  const consejo = consejoEsquina(p, rivalSabado);
  const aspirable = tituloAspirable(p);
  const puedeLicenciar = p.rol === "alumno" && p.fogueo >= p.fogueoMeta && state.cursos.includes("dt");
  const tieneDT = state.personal.some(x => x.tipo === "directorTecnico");

  const cambiarCombo = (c: ComboId) => dispatch({ type: "CAMBIAR_COMBO", id: p.id, combo: c });

  return (
    <Modal wide title={`Ficha Técnica · ${p.nombre}`} icon="user" onClose={onCerrar}>
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        {/* columna retrato */}
        <div>
          <div className="relative flex h-52 items-end justify-center overflow-hidden border border-line bg-gradient-to-b from-panel2 to-ink">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(232,178,58,0.28),transparent)]" />
            <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-line2" />
            <Figura p={p} pose="guardia" escala={1.7} />
          </div>
          <div className="mt-3 space-y-2 border border-line bg-panel p-3">
            <div className="flex items-center justify-between">
              <span className="font-cond text-xs uppercase tracking-widest text-mut">Valoración General</span>
              <span className="font-display text-4xl text-gold" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>{vg}</span>
            </div>
            <div className="stat-bar"><i style={{ width: `${vg}%`, background: vg >= 70 ? "var(--color-blood)" : "var(--color-gold)" }} /></div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Chip tone={p.rol === "boxeador" ? "blood" : "mut"}>{p.rol === "boxeador" ? "Federado" : "Alumno"}</Chip>
              {p.rol === "boxeador" && <Chip tone={p.circuito === "pro" ? "gold" : "mut"}>{p.circuito === "pro" ? "Profesional" : "Amateur"}</Chip>}
              <Chip>{p.division}</Chip>
              {p.elite && <Chip tone="neon">Élite VIP</Chip>}
              {p.titulo > 0 && <Chip tone="gold"><I n="trophy" className="h-3 w-3" /> {TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}</Chip>}
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2 font-cond text-sm text-sand">
              <span>{p.edad} años · {p.genero === "M" ? "Masculino" : "Femenino"}</span>
              <BarraEnergia v={p.energia} />
            </div>
            {p.rol === "boxeador" && (
              <div className="border-t border-line pt-2 font-cond text-sm text-sand">
                Récord: <b className="text-cream">{p.record.v}-{p.record.d}</b> · <b className="text-blood">{p.record.ko} KO</b>
                {p.bonusDebut && <span className="ml-1 text-neonc">(Bono de Madurez activo)</span>}
              </div>
            )}
            {rasgo && (
              <div className="border-t border-line pt-2">
                <div className="font-cond text-xs uppercase tracking-widest text-gold">{rasgo.nombre}</div>
                <div className="font-cond text-xs text-sand">{rasgo.desc}</div>
              </div>
            )}
          </div>
        </div>

        {/* columna datos */}
        <div className="space-y-4">
          {/* fogueo */}
          {p.rol === "alumno" && (
            <div className="border border-line bg-panel p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-lg tracking-wide text-cream">
                  <I n="glove" className="h-4 w-4 text-blood" /> Guanteos de Fogueo
                </span>
                <span className="font-display text-2xl text-gold">{p.fogueo} / {p.fogueoMeta}</span>
              </div>
              <div className="stat-bar mt-2"><i style={{ width: `${(p.fogueo / p.fogueoMeta) * 100}%`, background: "var(--color-gold)" }} /></div>
              <p className="mt-2 font-cond text-xs text-sand">
                Antes del debut federado necesita {p.fogueoMeta} guanteos de práctica (los junta los sábados).
                Al completarlos gana el <b className="text-neonc">Bono de Madurez</b>: +10% de Temple Mental y Defensa en su debut oficial.
              </p>
            </div>
          )}

          {/* pilares */}
          <div className="grid gap-3 sm:grid-cols-3">
            {PILARES.map(pilar => (
              <div key={pilar.titulo} className="border border-line bg-panel p-3">
                <div className={`mb-2 font-display text-base tracking-wider ${pilar.color}`}>{pilar.titulo}</div>
                <div className="space-y-1.5">
                  {pilar.stats.map(s => <FilaStat key={s.k} label={s.n} v={p.atrib[s.k]} />)}
                </div>
              </div>
            ))}
          </div>

          {/* combos de entrenamiento */}
          <div className="border border-line bg-panel p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-lg tracking-wide text-cream">Combo de Entrenamiento Semanal</span>
              {p.rol === "boxeador" && (
                <Btn small variant="gold" onClick={() => cambiarCombo(consejo)}>
                  <I n="spark" className="h-3.5 w-3.5" /> Consejo de la Esquina: {COMBOS[consejo].corto}
                </Btn>
              )}
            </div>
            {tieneDT && (
              <p className="mb-2 border border-neonc/40 bg-neonc/5 px-2 py-1 font-cond text-xs text-neonc">
                El Director Técnico Principal tiene el control: asigna el combo ideal a todo el plantel cada semana.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {LISTA_COMBOS.map(c => {
                const info = COMBOS[c];
                const activo = p.combo === c;
                const sugerido = consejo === c;
                return (
                  <motion.button key={c} whileTap={{ scale: 0.97 }} onClick={() => cambiarCombo(c)}
                    className={`border p-2 text-left transition-colors ${activo ? "border-gold bg-gold/10" : "border-line bg-panel2 hover:border-line2"} ${sugerido && !activo ? "guia-luminica" : ""}`}>
                    <div className="flex items-center gap-1.5 font-display text-base tracking-wide text-cream">
                      <I n={info.icono} className={`h-4 w-4 ${activo ? "text-gold" : "text-sand"}`} /> {info.nombre}
                    </div>
                    <div className="mt-0.5 font-cond text-[11px] leading-tight text-sand">{info.desc}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* acciones */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {p.rol === "alumno" && (
              <Btn variant={puedeLicenciar ? "gold" : "dark"} disabled={!puedeLicenciar}
                onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}
                pulso={puedeLicenciar}>
                <I n="cap" className="h-4 w-4" /> Licencia Federativa · {fmt(200)}
              </Btn>
            )}
            {p.rol === "boxeador" && !peleaAgendada && (
              <Btn variant="blood" onClick={() => dispatch({ type: "BUSCAR_RIVAL", id: p.id })}>
                <I n="target" className="h-4 w-4" /> Selección de Rival · 3 ofertas
              </Btn>
            )}
            {peleaAgendada && (
              <>
                <Chip tone="blood">Cartelera del sábado: vs {peleaAgendada.rival.nombre.split(" ")[0]} · {fmt(peleaAgendada.bolsa)}</Chip>
                <Btn small variant="ghost" onClick={() => dispatch({ type: "CANCELAR_PELEA", peleaId: peleaAgendada.id })}>Bajar de la cartelera</Btn>
              </>
            )}
            {p.rol === "boxeador" && aspirable > 0 && (
              <Chip tone="gold"><I n="trophy" className="h-3 w-3" /> Puede pelear por el {TITULOS[aspirable as 1 | 2 | 3 | 4].nombre}</Chip>
            )}
            {p.rol === "boxeador" && state.equipamiento.includes("zonaElite") && (
              <Btn small variant={p.elite ? "neon" : "dark"} onClick={() => dispatch({ type: "ALTERNAR_ELITE", id: p.id })}>
                <I n="trophy" className="h-3.5 w-3.5" /> {p.elite ? "Quitar de la Zona Élite" : "Ascender a Zona Élite"}
              </Btn>
            )}
            {p.rol === "alumno" && !state.cursos.includes("dt") && (
              <span className="font-cond text-xs text-mut">Necesitás el curso "Director Técnico Federado" para licenciar alumnos.</span>
            )}
            {p.rol === "alumno" && state.cursos.includes("dt") && p.fogueo < p.fogueoMeta && (
              <span className="font-cond text-xs text-mut">Le faltan {p.fogueoMeta - p.fogueo} guanteos de fogueo para la licencia.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
