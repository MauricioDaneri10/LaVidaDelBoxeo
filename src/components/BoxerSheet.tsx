import { useEffect, useMemo, useState } from "react";
import { COMBOS, TITULOS } from "../game/data";
import { consejoEsquina, estadoRecord, fmt, puedeHabilitar, rasgoInfo, tituloAspirable, totalPeleas, valoracion } from "../game/engine";
import { useGame } from "../game/state";
import type { ComboId, Pugilista } from "../game/types";
import { Figura } from "./GymView";
import { BarraEnergia, Btn, Chip, FilaStat, I, Modal, RadarCapacidades } from "./ui";

const PILARES: { titulo: string; color: string; stats: { k: keyof import("../game/types").Atributos; n: string }[] }[] = [
  {
    titulo: "Pilar Físico",
    color: "text-blood",
    stats: [
      { k: "fuerza", n: "Fuerza" },
      { k: "velocidad", n: "Velocidad" },
      { k: "potencia", n: "Potencia" },
      { k: "resistencia", n: "Resistencia" },
    ],
  },
  {
    titulo: "Pilar Técnico",
    color: "text-gold",
    stats: [
      { k: "ataque", n: "Ataque" },
      { k: "defensa", n: "Defensa" },
      { k: "tecnica", n: "Técnica" },
      { k: "eficacia", n: "Eficacia" },
    ],
  },
  {
    titulo: "Pilar Mental",
    color: "text-neonc",
    stats: [
      { k: "inteligencia", n: "Inteligencia" },
      { k: "mentalidad", n: "Mentalidad" },
      { k: "talento", n: "Talento (techo)" },
    ],
  },
];

export interface BoxerSheetProps {
  id?: string;
  boxeadorId?: string;
  onCerrar: () => void;
  onCambiarBoxeador?: (id: string) => void;
  onIrAPestana?: (tab: "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal") => void;
}

export function BoxerSheet({ id, boxeadorId, onCerrar, onCambiarBoxeador, onIrAPestana }: BoxerSheetProps) {
  const { state, dispatch } = useGame();
  const inicialId = id || boxeadorId || state.plantel[0]?.id || "";
  const [activoId, setActivoId] = useState<string>(inicialId);

  useEffect(() => {
    if (id || boxeadorId) {
      setActivoId(id || boxeadorId || "");
    }
  }, [id, boxeadorId]);

  const indexActual = state.plantel.findIndex(p => p.id === activoId);
  const p = (indexActual >= 0 ? state.plantel[indexActual] : state.plantel[0]) as Pugilista | undefined;

  const irAnterior = () => {
    if (state.plantel.length <= 1) return;
    const nuevoIndex = (indexActual - 1 + state.plantel.length) % state.plantel.length;
    const nuevoId = state.plantel[nuevoIndex].id;
    setActivoId(nuevoId);
    if (onCambiarBoxeador) onCambiarBoxeador(nuevoId);
  };

  const irSiguiente = () => {
    if (state.plantel.length <= 1) return;
    const nuevoIndex = (indexActual + 1) % state.plantel.length;
    const nuevoId = state.plantel[nuevoIndex].id;
    setActivoId(nuevoId);
    if (onCambiarBoxeador) onCambiarBoxeador(nuevoId);
  };

  if (!p) return null;

  const vg = valoracion(p.atrib);
  const rasgo = rasgoInfo(p.rasgo);
  const peleaAgendada = state.pendientes.find(x => x.miId === p.id);
  const rivalSabado = peleaAgendada?.rival ?? null;
  const consejo = consejoEsquina(p, rivalSabado);
  const aspirable = tituloAspirable(p);
  const puedeLicenciar = puedeHabilitar(p, state);
  const tieneDT = state.personal.some(x => x.tipo === "directorTecnico");
  const categoriaRecord = estadoRecord(p);

  const cambiarCombo = (c: ComboId) => dispatch({ type: "CAMBIAR_COMBO", id: p.id, combo: c });

  // Normalización estricta sin NaN ni valores undefined
  const atributosSeguros = {
    fuerza: Math.round(p.atrib.fuerza ?? 50),
    velocidad: Math.round(p.atrib.velocidad ?? 50),
    potencia: Math.round(p.atrib.potencia ?? 50),
    resistencia: Math.round(p.atrib.resistencia ?? 50),
    ataque: Math.round(p.atrib.ataque ?? 50),
    defensa: Math.round(p.atrib.defensa ?? 50),
    tecnica: Math.round(p.atrib.tecnica ?? 50),
    eficacia: Math.round(p.atrib.eficacia ?? 50),
    inteligencia: Math.round(p.atrib.inteligencia ?? 50),
    mentalidad: Math.round(p.atrib.mentalidad ?? 50),
    talento: Math.round(p.atrib.talento ?? 50),
  };

  // Historial de peleas de este atleta o del club
  const historialAtleta = state.historial.filter(h => {
    // Las partidas antiguas pueden no tener miId: solo se muestran en la
    // ficha cuando el resultado está identificado de forma segura.
    return h.miId === p.id;
  }).slice(0, 5);

  return (
    <Modal
      wide
      fit
      title={`Ficha Técnica · ${p.nombre}`}
      icon="user"
      onClose={onCerrar}
    >
      <div className="space-y-2 select-none">
        
        {/* BARRA DE NAVEGACIÓN ANTERIOR / SIGUIENTE ENTRE ATLETAS */}
        <div className="flex items-center justify-between border-b border-line pb-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={irAnterior}
              disabled={state.plantel.length <= 1}
              className="px-3 py-1 rounded border border-line bg-panel2 text-xs font-cond uppercase text-sand hover:text-gold hover:border-gold transition-colors disabled:opacity-40 cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="font-mono-data text-xs text-mut">
              Atleta <b className="text-cream">{indexActual + 1}</b> de <b className="text-cream">{state.plantel.length}</b>
            </span>
            <button
              onClick={irSiguiente}
              disabled={state.plantel.length <= 1}
              className="px-3 py-1 rounded border border-line bg-panel2 text-xs font-cond uppercase text-sand hover:text-gold hover:border-gold transition-colors disabled:opacity-40 cursor-pointer"
            >
              Siguiente →
            </button>
          </div>

          <div className="flex items-center gap-2">
            {peleaAgendada ? (
              <Chip tone="blood">
                <I n="bell" className="h-3 w-3" /> Pelea agendada para el sábado vs {peleaAgendada.rival.nombre}
              </Chip>
            ) : (
              <span className="font-cond text-xs text-mut">Sin combate agendado</span>
            )}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: 2 COLUMNAS (IZQ: HERO + RADAR, DER: ATRIBUTOS + ENTRENAMIENTO + HISTORIAL) */}
        <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          
          {/* COLUMNA IZQUIERDA: HERO + FIGURA PROCEDIMENTAL + RADAR PENTAGONAL */}
          <div className="space-y-2">
            
            {/* ESCENARIO DEL ATLETA CON FIGURA PROCEDIMENTAL */}
            <div className="relative flex h-28 items-end justify-center overflow-hidden border border-line bg-gradient-to-b from-panel2 to-ink rounded-2xl shadow-inner">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(232,178,58,0.28),transparent)]" />
              <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-line2" />
              <Figura p={p} pose="guardia" escala={1.45} />
            </div>

            {/* TARJETA DE VALORACIÓN GENERAL Y DATOS BIOGRÁFICOS */}
            <div className="space-y-1.5 border border-line bg-panel p-2.5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="font-cond text-xs uppercase tracking-widest text-mut">Valoración General</span>
                <span className="font-display text-3xl text-gold" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                  {vg}
                </span>
              </div>
              <div className="stat-bar">
                <i style={{ width: `${vg}%`, background: vg >= 70 ? "var(--color-blood)" : "var(--color-gold)" }} />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <Chip tone={p.rol === "boxeador" ? "blood" : "mut"}>
                  {p.rol === "boxeador" ? "Licencia individual" : "Alumno"}
                </Chip>
                {p.rol === "boxeador" && (
                  <Chip tone={p.circuito === "pro" ? "gold" : "mut"}>
                    {p.circuito === "pro" ? "Profesional" : "Amateur"}
                  </Chip>
                )}
                <Chip>{p.division}</Chip>
                {p.elite && <Chip tone="neon">Élite VIP</Chip>}
                {p.titulo > 0 && (
                  <Chip tone="gold">
                    <I n="trophy" className="h-3 w-3" /> {TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}
                  </Chip>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-2 font-cond text-sm text-sand">
                <span>{p.edad} años · {p.genero === "M" ? "Masculino" : "Femenino"}</span>
                <BarraEnergia v={p.energia} />
              </div>

              {p.rol === "boxeador" && (
              <div className="border-t border-line pt-2 font-cond text-xs text-sand">
                  Récord: <b className="text-cream">{p.record.v}-{p.record.d}-{p.record.e ?? 0}</b> · <b className="text-blood">{p.record.ko} KO</b> · {totalPeleas(p)} peleas
                  {p.bonusDebut && <span className="ml-1 text-neonc font-bold">(Bono de Madurez)</span>}
                  <div className={`mt-1 font-bold ${categoriaRecord.tono === "alerta" ? "text-blood" : categoriaRecord.tono === "oro" ? "text-gold" : categoriaRecord.tono === "ok" ? "text-emerald-300" : "text-mut"}`}>{categoriaRecord.etiqueta}</div>
                  <div className="text-[11px] text-mut">Amateur: {p.peleasAmateur} · Profesional: {p.peleasProfesionales} ({p.victoriasProfesionales}-{p.derrotasProfesionales}-{p.empatesProfesionales}, {p.kosProfesionales} KO)</div>
                  {p.circuito === "amateur"
                    ? <div className="text-[11px] text-gold">Camino profesional: {Math.max(0, 50 - p.peleasAmateur)} peleas amateurs restantes.</div>
                    : <div className="text-[11px] text-gold">Títulos: Nacional desde 10 peleas pro · Regional/Mundial desde 25.</div>}
                </div>
              )}

              {rasgo && (
                <div className="border-t border-line pt-2">
                  <div className="font-cond text-xs uppercase tracking-widest text-gold font-bold">{rasgo.nombre}</div>
                  <div className="font-cond text-xs text-sand leading-relaxed">{rasgo.desc}</div>
                </div>
              )}
            </div>

            {/* GRÁFICO DE RADAR PENTAGONAL DE CAPACIDADES */}
            <div className="p-1.5 border border-line bg-panel rounded-2xl space-y-0.5 text-center">
              <span className="text-[10px] font-black uppercase text-gold font-mono-data tracking-wider">
                RADAR HOLÍSTICO DE RENDIMIENTO
              </span>
              <RadarCapacidades atributos={atributosSeguros} className="max-w-[150px]" />
            </div>

          </div>

          {/* COLUMNA DERECHA: ATRIBUTOS DE LOS 3 PILARES + ENTRENAMIENTO + ACCIONES + HISTORIAL */}
          <div className="space-y-2">
            
            {/* LOS 3 PILARES CANÓNICOS (11 ATRIBUTOS) */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PILARES.map(pil => (
                <div key={pil.titulo} className="panel p-2 rounded-2xl space-y-1">
                  <div className={`font-display text-base tracking-wide border-b border-line pb-1 ${pil.color}`}>
                    {pil.titulo}
                  </div>
                  <div className="space-y-1">
                    {pil.stats.map(s => (
                      <FilaStat
                        key={s.k}
                        label={s.n}
                        v={p.atrib[s.k]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ENFOQUE DE ENTRENAMIENTO SEMANAL (COMBOS) */}
            <div className="panel p-2.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-wide text-gold flex items-center gap-1.5">
                  <I n="glove" className="h-4 w-4" /> Enfoque de Entrenamiento Semanal
                </span>
                <span className="font-cond text-xs text-mut">
                  Asignado: <b className="text-cream">{COMBOS[p.combo]?.nombre || "Libre"}</b>
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                {(Object.keys(COMBOS) as ComboId[]).map(cid => {
                  const cb = COMBOS[cid];
                  const esActivo = p.combo === cid;
                  return (
                    <button
                      key={cid}
                      onClick={() => cambiarCombo(cid)}
                      className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                        esActivo
                          ? "border-gold bg-gold/15 text-gold shadow-md scale-[1.02]"
                          : "border-line bg-panel2 text-sand hover:border-line2"
                      }`}
                    >
                      <div className="font-display text-xs truncate text-cream">{cb.nombre}</div>
                      <div className="font-cond text-[10px] text-mut truncate">{cb.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONSEJO TÁCTICO DE ESQUINA */}
            <div className="panel p-2.5 rounded-2xl bg-gold/5 border-gold/30 flex items-start gap-2">
              <I n="target" className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs font-cond">
                <span className="font-bold uppercase tracking-wider text-gold">Consejo de Esquina:</span>
                <p className="text-cream leading-relaxed">{consejo}</p>
                {aspirable > 0 && (
                  <p className="text-neonc text-[11px] pt-1">
                    • Posibilidad de disputa: <b>{TITULOS[aspirable as 1 | 2 | 3 | 4].nombre}</b>.
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN ESPECÍFICA SEGÚN ROL: ALUMNO (FOGUEO / LICENCIA) O BOXEADOR (MATCHMAKING / ÉLITE) */}
            <div className="panel p-2.5 rounded-2xl space-y-2">
              {p.rol === "alumno" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base tracking-wide text-cream">
                      Progreso de prácticas de combate
                    </span>
                    <span className="font-mono-data text-xs text-gold font-bold">
                      {p.fogueo}/{p.fogueoMeta} guanteos (sparring)
                    </span>
                  </div>
                  <div className="stat-bar h-3">
                    <i
                      style={{
                        width: `${Math.min(100, (p.fogueo / p.fogueoMeta) * 100)}%`,
                        background: "var(--color-gold)",
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="font-cond text-xs text-mut">
                      {p.enEspera
                        ? "Está en lista de espera: cuando se libere una plaza podrá continuar."
                        : p.fogueo >= p.fogueoMeta
                        ? "¡Atleta listo para tramitar su licencia individual!"
                        : `Requiere ${p.fogueoMeta - p.fogueo} guanteos más para tramitar la licencia.`}
                    </p>
                    {!state.cursos.includes("dt") && onIrAPestana && (
                      <Btn small variant="ghost" onClick={() => onIrAPestana("perfil")}>
                        Obtener Licencia de Entrenador
                      </Btn>
                    )}
                    {puedeLicenciar && (
                      <Btn
                        small
                        variant="gold"
                        onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}
                      >
                        Emitir licencia del atleta ({fmt(200)})
                      </Btn>
                    )}
                  </div>
                  <div className="rounded-xl border border-gold2/50 bg-gold/10 p-2 text-xs font-cond text-sand">
                    {p.enEspera
                      ? "Está en lista de espera y todavía no puede entrenar ni competir."
                      : !state.cursos.includes("dt")
                      ? "Obtené la Licencia de Entrenador para federar atletas del club."
                      : p.fogueo >= p.fogueoMeta
                      ? "Prácticas completas: la ficha ya puede emitir la licencia individual para competir los sábados."
                      : "Completá las prácticas de combate de los sábados para habilitar la competencia amateur."}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-display text-base tracking-wide text-cream block">
                      Gestión Profesional del Pugilista
                    </span>
                    <span className="font-cond text-xs text-mut">
                      {peleaAgendada ? "Pelea pactada: respetá el descanso y la recuperación." : p.lesion ? `Lesión ${p.lesion.gravedad}: ${p.lesion.semanas} semana(s) de recuperación.` : p.energia < 70 ? "Necesita descansar antes de pactar una pelea." : "Disponible para pactar una pelea."}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Btn
                      small
                      variant={p.elite ? "gold" : "ghost"}
                      onClick={() => dispatch({ type: "ALTERNAR_ELITE", id: p.id })}
                    >
                      {p.elite ? "✓ En Zona Élite VIP" : "+ Promover a Zona Élite"}
                    </Btn>

                    {!peleaAgendada && (
                      <Btn
                        small
                        variant="blood"
                        onClick={() => {
                          dispatch({ type: "BUSCAR_RIVAL", id: p.id });
                          onCerrar();
                        }}
                      >
                        <I n="target" className="h-3.5 w-3.5" /> Buscar Ofertas de Combate
                      </Btn>
                    )}
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`¿Transferir a ${p.nombre} fuera del club? Su récord se conservará en esta partida, pero dejará de ocupar un lugar en el plantel.`)) {
                          dispatch({ type: "RETIRAR_ATLETA", id: p.id });
                          onCerrar();
                        }
                      }}
                    >
                      Transferir fuera del club
                    </Btn>
                  </div>
                </div>
              )}
            </div>

            {/* HISTORIAL RECIENTE DE COMBATES */}
            <div className="panel p-2.5 rounded-2xl space-y-1">
              <span className="font-display text-sm uppercase tracking-wider text-sand flex items-center gap-1.5">
                <I n="trophy" className="h-3.5 w-3.5 text-gold" /> Historial de Combates Recientes
              </span>

              {historialAtleta.length > 0 ? (
                <div className="space-y-1 text-xs font-cond">
                  {historialAtleta.map((h, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-panel2 border border-line flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${h.gane ? "text-emerald-400" : "text-blood"}`}>
                          {h.gane ? "VICTORIA" : "DERROTA"}
                        </span>
                        <span className="text-sand">{h.metodo}</span>
                        <span className="text-mut font-mono-data">({h.resumen})</span>
                      </div>
                      <span className="text-gold font-mono-data font-bold">+{fmt(h.bolsa)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-cond text-xs text-mut italic">
                  Aún no registra combates oficiales en su historial.
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </Modal>
  );
}

export default BoxerSheet;
export { BoxerSheet as FichaAtleta };
