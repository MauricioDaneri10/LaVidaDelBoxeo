import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CATEGORIAS, COMUNITARIOS, CURSOS, EQUIPOS, EVENTOS_CLUB_INFO, PERSONAL_INFO, PROPIEDADES, TITULOS } from "../game/data";
import { audioHabilitado, setAudioHabilitado } from "../game/audio";
import { alumnosActivos, alumnosEnEspera, capacidadAlumnos, capacidadAmateurs, capacidadProfesionales, estadoRecord, fmt, nivelGimnasio, puedeHabilitar, sucursales, totalPeleas, valoracion } from "../game/engine";
import { guardarEnRanura, useGame } from "../game/state";
import { ATAJOS_DEFAULT, ATAJOS_LABELS, conflictosAtajos, normalizarTecla, type Atajos } from "../game/shortcuts";
import type { CategoriaMercado, CursoId, PersonalId, Pugilista, RamaCurso } from "../game/types";
import { BarraEnergia, Btn, Chip, I, Modal, RostroBoxeador } from "./ui";

interface PanelPlantelProps {
  onAbrir?: (id: string) => void;
  onBuscarRival?: (id: string) => void;
  onSeleccionarBoxeador?: (b: Pugilista) => void;
}

// ==================== PLANTEL DE ATLETAS ====================
export function PanelPlantel({ onAbrir, onBuscarRival, onSeleccionarBoxeador }: PanelPlantelProps) {
  const { state, dispatch } = useGame();
  const alumnos = alumnosActivos(state);
  const alumnosEspera = alumnosEnEspera(state);
  const boxeadores = state.plantel.filter(p => p.rol === "boxeador");
  const tieneDT = state.cursos.includes("dt");
  const cupoAlumnos = capacidadAlumnos(state);
  const amateurs = boxeadores.filter(p => p.circuito === "amateur").length;
  const profesionales = boxeadores.filter(p => p.circuito === "pro").length;
  const [paginaBoxeadores, setPaginaBoxeadores] = useState(0);
  const [paginaAlumnos, setPaginaAlumnos] = useState(0);
  const porPagina = 5;
  const boxeadoresVisibles = boxeadores.slice(paginaBoxeadores * porPagina, paginaBoxeadores * porPagina + porPagina);
  const alumnosVisibles = alumnos.slice(paginaAlumnos * porPagina, paginaAlumnos * porPagina + porPagina);

  const seleccionarAtleta = (p: Pugilista) => {
    if (onAbrir) onAbrir(p.id);
    if (onSeleccionarBoxeador) onSeleccionarBoxeador(p);
  };

  const Tarjeta = ({ p }: { p: Pugilista }) => {
    const agendada = state.pendientes.some(x => x.miId === p.id);
    const listoSabado = puedeHabilitar(p, state);

    return (
      <motion.div
        layout
        whileHover={{ y: -2 }}
        onClick={() => seleccionarAtleta(p)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") seleccionarAtleta(p); }}
        role="button"
        tabIndex={0}
        className={`panel w-full p-2 text-left transition-colors hover:border-gold2 cursor-pointer ${agendada ? "border-blood/60" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <RostroBoxeador atleta={p} className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <div className="font-display text-base leading-tight tracking-wide text-cream truncate">
                {p.nombre}
              </div>
              <div className="font-cond text-[11px] uppercase tracking-wider text-mut truncate">
                {p.edad} años · {p.division} · {p.rol === "boxeador" ? (p.circuito === "pro" ? "Profesional" : "Amateur") : "Alumno"}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-display text-xl text-gold">{valoracion(p.atrib)}</div>
            <div className="font-cond text-[10px] uppercase text-mut">Valoración</div>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <BarraEnergia v={p.energia} />
          {p.enEspera && <Chip tone="gold">En espera</Chip>}
          {p.elite && <Chip tone="neon">Élite</Chip>}
          {p.titulo > 0 && (
            <Chip tone="gold">
              <I n="trophy" className="h-3 w-3" />
              {TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}
            </Chip>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1 border-t border-line pt-1.5">
          {p.rol === "alumno" ? (
            <>
              <span className="font-cond text-[11px] uppercase tracking-wide text-sand">
                Guanteos <b className="text-gold">{p.fogueo}/{p.fogueoMeta}</b>
              </span>
              <div className="stat-bar w-16">
                <i style={{ width: `${(p.fogueo / p.fogueoMeta) * 100}%`, background: "var(--color-gold)" }} />
              </div>
              {listoSabado && !p.enEspera && (
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    dispatch({ type: "LICENCIAR", id: p.id });
                  }}
                  className="btn-poster guia-luminica ml-auto border border-[#ffe0a0]/50 bg-gold px-3 py-1 text-sm text-ink cursor-pointer"
                >
                  <span>Tramitar licencia · {fmt(200)}</span>
                </button>
              )}
              {p.enEspera && (
                <button
                  onClick={e => { e.stopPropagation(); if (window.confirm(`¿Retirar a ${p.nombre} de la lista de espera?`)) dispatch({ type: "RETIRAR_ATLETA", id: p.id }); }}
                  className="ml-auto rounded-lg border border-line2 px-2 py-1 font-cond text-[11px] uppercase tracking-wide text-mut hover:border-blood/60 hover:text-blood cursor-pointer"
                >
                  Retirar de la lista
                </button>
              )}
            </>
          ) : (
            <>
              <span className="font-cond text-[11px] uppercase text-sand">
                Récord: <b className="text-cream">{p.record.v}-{p.record.d}-{p.record.e ?? 0}</b> · <b className="text-blood">{p.record.ko} KO</b> · {totalPeleas(p)} peleas
                <span className="ml-1 text-mut">· {estadoRecord(p).etiqueta}</span>
              </span>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                {agendada ? (
                  <Chip tone="blood">En cartelera</Chip>
                ) : (
                  onBuscarRival && (
                    <Btn
                      small
                      variant="dark"
                      onClick={() => onBuscarRival(p.id)}
                    >
                      <I n="target" className="h-3 w-3" /> Buscar rival
                    </Btn>
                  )
                )}
                <button
                  onClick={e => { e.stopPropagation(); if (window.confirm(`¿Transferir a ${p.nombre} fuera del club?`)) dispatch({ type: "RETIRAR_ATLETA", id: p.id }); }}
                  className="rounded-lg border border-line2 px-2 py-1 font-cond text-[11px] uppercase tracking-wide text-mut hover:border-blood/60 hover:text-blood cursor-pointer"
                >
                  Transferir
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="game-screen h-full overflow-hidden space-y-3">
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Plantel de Boxeadores</h2>
        <Chip tone={alumnosEspera.length ? "blood" : "gold"}><I n="users" className="h-3 w-3" /> Alumnos {alumnos.length}/{cupoAlumnos}{alumnosEspera.length ? ` · ${alumnosEspera.length} en espera` : ""}</Chip>
        <Chip tone="blood"><I n="glove" className="h-3 w-3" /> Amateurs {amateurs}/{capacidadAmateurs(state)} · Profesionales {profesionales}/{capacidadProfesionales(state)}</Chip>
        <Chip tone="neon"><I n="users" className="h-3 w-3" /> Recreativos {state.recreativos}</Chip>
        <Chip><I n="bell" className="h-3 w-3" /> Cartelera del sábado: {state.pendientes.length} pelea(s)</Chip>
        <div className="ml-auto flex gap-2">
          <Btn
            small
            variant={state.veladaProgramada ? "gold" : "ghost"}
            onClick={() => dispatch({ type: "ALTERNAR_VELADA" })}
            disabled={!state.cursos.includes("veladas")}
          >
            <I n="ring" className="h-3.5 w-3.5" /> {state.veladaProgramada ? "Velada programada" : "Programar velada"}
          </Btn>
        </div>
      </div>

      {!tieneDT && (
        <div className="border border-gold2/50 bg-gold/5 px-4 py-2.5 font-cond text-sm text-sand rounded-xl">
          <b className="text-gold">Cómo habilitar a tu primer boxeador:</b> obtené la Licencia de Entrenador en Mi Perfil,
          completá sus <b>10 guanteos (sparring)</b> y luego tramitá su licencia amateur.
        </div>
      )}

      {/* SECCIÓN BOXEADORES FEDERADOS */}
      {boxeadores.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl tracking-wide text-blood flex items-center gap-2">
            <span>🥊 Boxeadores Federados Oficiales ({boxeadores.length})</span>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {boxeadoresVisibles.map(p => <Tarjeta key={p.id} p={p} />)}
          </div>
          {boxeadores.length > porPagina && <div className="mt-1 flex justify-center gap-2 font-cond text-xs text-mut"><button className="cursor-pointer" disabled={paginaBoxeadores === 0} onClick={() => setPaginaBoxeadores(p => Math.max(0, p - 1))}>Anterior</button><span>{paginaBoxeadores + 1}/{Math.ceil(boxeadores.length / porPagina)}</span><button className="cursor-pointer text-gold" disabled={(paginaBoxeadores + 1) * porPagina >= boxeadores.length} onClick={() => setPaginaBoxeadores(p => p + 1)}>Más boxeadores</button></div>}
        </section>
      )}

      {/* SECCIÓN ALUMNOS EN FORMACIÓN */}
      <section>
        <h3 className="mb-2 font-display text-xl tracking-wide text-sand flex items-center gap-2">
            <span>🥋 Alumnos en Formación y Práctica ({alumnos.length}/{cupoAlumnos})</span>
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {alumnosVisibles.map(p => <Tarjeta key={p.id} p={p} />)}
        </div>
        {alumnos.length > porPagina && <div className="mt-1 flex justify-center gap-2 font-cond text-xs text-mut"><button className="cursor-pointer" disabled={paginaAlumnos === 0} onClick={() => setPaginaAlumnos(p => Math.max(0, p - 1))}>Anterior</button><span>{paginaAlumnos + 1}/{Math.ceil(alumnos.length / porPagina)}</span><button className="cursor-pointer text-gold" disabled={(paginaAlumnos + 1) * porPagina >= alumnos.length} onClick={() => setPaginaAlumnos(p => p + 1)}>Más alumnos</button></div>}
        {alumnos.length === 0 && (
          <p className="font-cond text-sm italic text-mut">
            Sin alumnos: la fama y el boca a boca traerán nuevos talentos al gimnasio.
          </p>
        )}
      </section>
      {alumnosEspera.length > 0 && (
        <section className="rounded-xl border border-dashed border-gold2/50 bg-gold/5 p-4">
          <h3 className="mb-2 font-display text-lg tracking-wide text-gold">Lista de espera ({alumnosEspera.length})</h3>
          <p className="mb-3 font-cond text-sm text-sand">Ordenados por llegada. No entrenan ni avanzan sus prácticas hasta ocupar una plaza; al liberar un cupo, el primero pasa automáticamente.</p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
            {alumnosEspera.map(p => (
              <div key={p.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-panel2 px-2 py-1.5">
                <RostroBoxeador atleta={p} className="h-7 w-7 shrink-0 rounded-md" />
                <button onClick={() => seleccionarAtleta(p)} className="min-w-0 flex-1 truncate text-left font-cond text-xs text-cream hover:text-gold cursor-pointer">{p.nombre}</button>
                <button onClick={() => { if (window.confirm(`¿Retirar a ${p.nombre} de la lista de espera?`)) dispatch({ type: "RETIRAR_ATLETA", id: p.id }); }} className="shrink-0 font-cond text-[10px] uppercase text-mut hover:text-blood cursor-pointer">Retirar</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ==================== MERCADO EN 4 CATEGORÍAS ====================
export function PanelMercado() {
  const { state, dispatch } = useGame();
  const [cat, setCat] = useState<CategoriaMercado>("equipamiento");
  const [pagina, setPagina] = useState(0);
  const [nombreMarca, setNombreMarca] = useState("");
  const ordenInicial = ["vendasGel", "botiquin", "soga", "pisoGoma"];
  const recomendadoId = ordenInicial.find(id => !state.equipamiento.includes(id as never) && EQUIPOS[id as keyof typeof EQUIPOS].cat === cat);
  const items = Object.entries(EQUIPOS)
    .filter(([, v]) => v.cat === cat)
    .sort(([a], [b]) => (a === recomendadoId ? -1 : b === recomendadoId ? 1 : 0));

  return (
    <div className="game-screen h-full overflow-hidden space-y-2">
      <div className="panel flex flex-wrap items-center gap-2 p-2.5">
        <h2 className="font-display text-xl tracking-wide text-gold">Equipamiento e Instalaciones</h2>
        <span className="font-cond text-xs text-sand">Caja: <b className="text-gold">{fmt(state.dinero)}</b></span>
        <span className="font-cond text-xs text-sand">Instalado: <b className="text-cream">{state.equipamiento.length}/21</b></span>
        {recomendadoId && <span className="rounded-full border border-neonc/50 bg-neonc/10 px-2.5 py-1 font-cond text-xs text-neonc">Sugerencia: empezá por una mejora de recuperación</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => { setCat(c.id); setPagina(0); }}
            className={`border px-3 py-1.5 font-cond text-sm uppercase tracking-wider transition-colors cursor-pointer ${
              cat === c.id ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel text-sand hover:border-line2"
            }`}
          >
            <span className="inline-flex items-center gap-1.5"><I n={c.icono} className="h-4 w-4" /> {c.nombre}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(pagina * 4, pagina * 4 + 4).map(([id, eq]) => {
          const comprado = state.equipamiento.includes(id as never);
          const bloqueado = id === "zonaElite" && !state.cursos.includes("altoRendimiento");
          return (
            <div key={id} title={`${eq.nombre}: ${eq.desc} ${eq.efecto}`} className={`market-card panel flex min-h-[132px] flex-col p-2 ${comprado ? "border-win/50" : ""}`}>
              <div className="flex min-h-[42px] items-start justify-between gap-1">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold2/50 bg-gold/10 text-gold shadow-inner"><I n={eq.icono} className="h-4 w-4" /></div>
                  <div>
                    <div className="font-display text-sm leading-tight tracking-wide text-cream">{eq.nombre}</div>
                    <div className="font-display text-sm text-gold">{fmt(eq.costo)}</div>
                  </div>
                </div>
                {comprado && <Chip tone="win"><I n="check" className="h-3 w-3" /> Instalado</Chip>}
                {!comprado && id === recomendadoId && <Chip tone="neon">Recomendado ahora</Chip>}
              </div>
              <p className="mt-1 min-h-[24px] font-cond text-[10px] text-sand">{eq.desc}</p>
              <p className="mt-1 min-h-[22px] font-cond text-[10px] text-neonc">{eq.efecto}</p>
              {!comprado && (
                <Btn
                  small
                  variant={state.dinero >= eq.costo && !bloqueado ? "gold" : "dark"}
                  className="mt-auto w-full"
                  disabled={state.dinero < eq.costo || bloqueado}
                  onClick={() => dispatch({ type: "COMPRAR_EQUIPO", id: id as never })}
                >
                  {bloqueado ? "Requiere Alto Rendimiento" : `Comprar · ${fmt(eq.costo)}`}
                </Btn>
              )}
              {comprado && <div className="mt-auto pt-3"><div className="h-8" /></div>}
              {id === "estudioMarca" && comprado && (
                <div className="mt-3 border-t border-line pt-2">
                  {state.marcaRopa ? (
                    <p className="font-cond text-sm text-gold">Tu marca: <b>"{state.marcaRopa}"</b> — liquidación de ventas cada domingo.</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={nombreMarca}
                        onChange={e => setNombreMarca(e.target.value)}
                        maxLength={16}
                        placeholder="Nombre de la marca"
                        className="w-full border border-line bg-ink px-2 py-1 font-cond text-sm text-cream outline-none focus:border-gold"
                      />
                      <Btn small variant="gold" onClick={() => dispatch({ type: "CREAR_MARCA", nombre: nombreMarca })}>Lanzar</Btn>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {items.length > 4 && (
        <div className="flex items-center justify-center gap-2 font-cond text-xs text-mut">
          <Btn small variant="dark" disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))}>Anterior</Btn>
          <span>{pagina + 1} / {Math.ceil(items.length / 4)}</span>
          <Btn small variant="gold" disabled={(pagina + 1) * 4 >= items.length} onClick={() => setPagina(p => p + 1)}>Más</Btn>
        </div>
      )}
    </div>
  );
}

// ==================== MI PERFIL: CURSOS, PROPIEDADES, LEGADO ====================
export function PanelPerfil() {
  const { state, dispatch } = useGame();
  const [seccionPerfil, setSeccionPerfil] = useState<"cursos" | "bienes">("cursos");
  const [ramaActiva, setRamaActiva] = useState<RamaCurso>("deportiva");
  const [detalleRama, setDetalleRama] = useState<RamaCurso | null>(null);
  const [socialAbierto, setSocialAbierto] = useState(false);
  const ramas: { id: RamaCurso; nombre: string; icono: string; color: string }[] = [
    { id: "deportiva", nombre: "Rama Deportiva", icono: "glove", color: "text-blood" },
    { id: "promotora", nombre: "Rama Promotora", icono: "ring", color: "text-gold" },
    { id: "empresarial", nombre: "Rama Empresarial", icono: "store", color: "text-neonc" },
  ];
  const puedeLegado = state.plantel.some(p => p.titulo === 4) || state.fama >= 85;

  return (
    <div className="game-screen h-full overflow-hidden space-y-2">
      <div className="panel grid gap-2 p-2.5 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="font-display text-xl tracking-wide text-gold">Perfil del Coach · {state.nombreJugador}</h2>
          <p className="font-cond text-xs text-sand">
            Semana {state.semana} al frente de <b className="text-cream">{state.nombreGimnasio}</b>. Nivel de gimnasio: <b className="text-gold">{nivelGimnasio(state)}</b> · Legados: <b className="text-neonc">{state.legados}</b>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
            {[
              ["Peleas", state.stats.peleas], ["Victorias", state.stats.victorias], ["KOs", state.stats.kos],
              ["Veladas", state.stats.veladas], ["Títulos", state.stats.titulos], ["Neto histórico", fmt(state.stats.resultadoNeto)],
            ].map(([k, v]) => (
              <div key={k as string} className="border border-line bg-panel2 px-2 py-1.5 text-center">
                <div className="font-display text-xl text-cream">{v}</div>
                <div className="font-cond text-[10px] uppercase tracking-widest text-mut">{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <Btn
            variant={puedeLegado ? "gold" : "dark"}
            disabled={!puedeLegado}
            onClick={() => {
              if (window.confirm("¿Iniciar el Sistema de Legado? Renacerás como tu mejor alumno con bonificaciones de prestigio.")) {
                dispatch({ type: "LEGADO" });
              }
            }}
          >
            <I n="medal" className="h-4 w-4" /> Sistema de Legado
          </Btn>
          <span className="font-cond text-[11px] text-mut">Se desbloquea con un Título Mundial o 85 de fama.</span>
        </div>
      </div>

      <div className="mx-auto flex w-fit justify-center gap-2 rounded-xl border border-line bg-panel2 p-1">
        <button onClick={() => setSeccionPerfil("cursos")} className={`w-fit rounded-lg px-4 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "cursos" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>Cursos</button>
        <button onClick={() => setSeccionPerfil("bienes")} className={`w-fit rounded-lg px-4 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "bienes" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>Bienes raíces</button>
      </div>

      {/* CURSOS */}
      {seccionPerfil === "cursos" && <section className="mx-auto min-h-0 max-w-3xl">
        <h3 className="mb-2 text-center font-display text-lg tracking-wide text-cream">Cursos del Coach · elegí una rama</h3>
        <div className="mb-2 flex flex-wrap justify-center gap-1.5">
          {ramas.map(rama => <button key={rama.id} onClick={() => setRamaActiva(rama.id)} className={`w-fit rounded-lg border px-3 py-1.5 font-cond text-xs uppercase tracking-wide ${ramaActiva === rama.id ? `border-gold bg-gold/15 ${rama.color}` : "border-line bg-panel2 text-mut"}`}><I n={rama.icono} className="mr-1 inline h-3.5 w-3.5" />{rama.nombre.replace("Rama ", "")}</button>)}
        </div>
        <div className="profile-branch-panel grid gap-2">
          {ramas.filter(rama => rama.id === ramaActiva).map(rama => (
            <div key={rama.id} className="panel mx-auto w-fit max-w-full p-2">
              <div className={`mb-1 flex items-center gap-2 font-display text-base tracking-wide ${rama.color}`}>
                <I n={rama.icono} className="h-4 w-4" /> {rama.nombre}
              </div>
              <div className="space-y-1 hidden">
                {(Object.keys(CURSOS) as CursoId[]).filter(c => CURSOS[c].rama === rama.id)
                  .sort((x, y) => CURSOS[x].nivel - CURSOS[y].nivel)
                  .map(cid => {
                    const c = CURSOS[cid];
                    const aprobado = state.cursos.includes(cid);
                    const reqOk = !c.req || state.cursos.includes(c.req);
                    return (
                      <div key={cid} className={`border p-1.5 ${aprobado ? "border-win/50 bg-win/5" : "border-line bg-panel2"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-display text-sm tracking-wide text-cream">
                            <span className="mr-1.5 text-mut">Nv.{c.nivel}</span>{c.nombre}
                          </div>
                          {aprobado ? (
                            <Chip tone="win"><I n="check" className="h-3 w-3" /> Aprobado</Chip>
                          ) : (
                            <Btn
                              small
                              variant={reqOk && state.dinero >= c.costo ? "gold" : "dark"}
                              disabled={!reqOk || state.dinero < c.costo}
                              onClick={() => dispatch({ type: "COMPRAR_CURSO", id: cid })}
                            >
                              Comprar · {fmt(c.costo)}
                            </Btn>
                          )}
                        </div>
                        <p className="mt-0.5 font-cond text-[10px] leading-tight text-sand">{c.desc}</p>
                      </div>
                    );
                  })}
              </div>
            <Btn small variant="gold" className="mt-2 w-fit max-w-full" onClick={() => setDetalleRama(rama.id)}>Ver cursos</Btn>
            </div>
          ))}
        </div>
      </section>}

      <div className="mt-3 flex justify-center">
        <Btn small variant="ghost" onClick={() => setSocialAbierto(true)}><I n="calendar" className="h-3.5 w-3.5" /> Finanzas sociales</Btn>
      </div>

      {detalleRama && (
        <Modal wide fit title={`Cursos · ${ramas.find(r => r.id === detalleRama)?.nombre ?? "Rama"}`} icon="cap" onClose={() => setDetalleRama(null)}>
          <div className="space-y-2">
            {(Object.keys(CURSOS) as CursoId[]).filter(c => CURSOS[c].rama === detalleRama).sort((x, y) => CURSOS[x].nivel - CURSOS[y].nivel).map(cid => {
              const c = CURSOS[cid];
              const aprobado = state.cursos.includes(cid);
              const reqOk = !c.req || state.cursos.includes(c.req);
              return <div key={cid} className={`border p-2 ${aprobado ? "border-win/50 bg-win/5" : "border-line bg-panel2"}`}>
                <div className="flex items-center justify-between gap-2"><div className="font-display text-base text-cream">Nv.{c.nivel} · {c.nombre}</div>{aprobado ? <Chip tone="win">Aprobado</Chip> : <Btn small variant={reqOk && state.dinero >= c.costo ? "gold" : "dark"} disabled={!reqOk || state.dinero < c.costo} onClick={() => dispatch({ type: "COMPRAR_CURSO", id: cid })}>Comprar · {fmt(c.costo)}</Btn>}</div>
                <p className="mt-1 font-cond text-xs text-sand">{c.desc}</p>
              </div>;
            })}
          </div>
        </Modal>
      )}

      {socialAbierto && (
        <Modal wide fit title="Finanzas sociales" icon="calendar" onClose={() => setSocialAbierto(false)}>
          <div className="space-y-2">
            <p className="font-cond text-xs text-sand">Elegí una actividad, invertí una vez y cobrá el resultado al cerrar la semana.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["bingo", "naipes", "festival"] as const).map(k => {
                const c = COMUNITARIOS[k];
                const evInfo = k === "bingo" ? EVENTOS_CLUB_INFO.bingoFamiliar : k === "naipes" ? EVENTOS_CLUB_INFO.torneoJuegosMesa : EVENTOS_CLUB_INFO.festivalBoxeo;
                return <div key={k} className="rounded-xl border border-line bg-panel2 p-2 text-xs">
                  <div className="mb-1 text-base">{evInfo?.emoji || "🎟️"}</div>
                  <div className="font-display text-sm text-cream">{c.nombre}</div>
                  <div className="mb-2 font-cond text-mut">Inv. {fmt(c.inversion)} · retorno {fmt(c.min)}–{fmt(c.max)}</div>
                  <button className="w-fit rounded border border-gold2/50 px-2 py-1 text-[11px] text-gold hover:bg-gold/10 disabled:opacity-40" disabled={state.comunitarios.length > 0 || state.dinero < c.inversion || state.dia >= 6} onClick={() => dispatch({ type: "PROGRAMAR_SOCIAL", actividad: k })}>{state.comunitarios.some(x => x.tipo === k) ? "Agendado" : "Agendar"}</button>
                </div>;
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* PROPIEDADES */}
      {seccionPerfil === "bienes" && <section className="mx-auto min-h-0 max-w-5xl">
        <h3 className="mb-2 font-display text-xl tracking-wide text-cream">Bienes Raíces Adquiridos</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["local", "terreno", "sucursal", "apartamento", "mansion", "arena"] as const).map(pid => {
            const p = PROPIEDADES[pid];
            const adquirida = state.propiedades.includes(pid);
            return (
              <div key={pid} className={`panel p-3 ${adquirida ? "border-win/50" : "opacity-60"}`}>
                <div className="flex items-center gap-2">
                  <I n={p.icono} className="h-4 w-4 text-gold" />
                  <span className="font-display text-base tracking-wide text-cream">{p.nombre}</span>
                  {adquirida ? <span className="ml-auto"><Chip tone="win">Escriturada</Chip></span> : <span className="ml-auto font-cond text-xs text-mut">{fmt(p.costo)}</span>}
                </div>
                <p className="mt-1 font-cond text-xs text-sand">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>}
    </div>
  );
}

// ==================== PERSONAL TÉCNICO ====================
export function PanelPersonal() {
  const { state, dispatch } = useGame();
  const tipos = Object.keys(PERSONAL_INFO) as PersonalId[];
  const [pagina, setPagina] = useState(0);
  const nSuc = sucursales(state);

  return (
    <div className="game-screen h-full overflow-hidden space-y-2">
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Cuerpo Técnico & Empleados</h2>
        <span className="font-cond text-sm text-sand">Contratados: <b className="text-cream">{state.personal.length}</b></span>
        <span className="font-cond text-sm text-sand">Costo nómina semanal: <b className="text-blood">{fmt(state.personal.reduce((ac, p) => ac + PERSONAL_INFO[p.tipo].sueldo, 0))}</b></span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tipos.slice(pagina * 4, pagina * 4 + 4).map(t => {
          const info = PERSONAL_INFO[t];
          const contratados = state.personal.filter(p => p.tipo === t);
          const limiteSucursal = info.multiple && contratados.length >= Math.max(nSuc, 1);
          return (
            <div key={t} className="staff-card panel flex min-h-[218px] flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg tracking-wide text-cream">{info.nombre}</div>
                  <div className="font-cond text-xs text-gold">Costo: {fmt(info.sueldo)}/semana</div>
                </div>
                <div className="grid h-9 w-9 place-items-center border border-line bg-ink text-sand"><I n={info.icono} className="h-4 w-4" /></div>
              </div>
              <p className="mt-2 min-h-[42px] font-cond text-xs text-sand"><span className="text-cream">Aporta:</span> {info.desc}</p>
              {contratados.length > 0 && (
                <div className="mt-3 border-t border-line pt-2">
                  <div className="font-cond text-[11px] uppercase tracking-wider text-mut">Personal activo:</div>
                  {contratados.map(m => (
                    <div key={m.id} className="mt-1 flex items-center justify-between font-cond text-sm text-cream">
                      <span>{m.nombre}</span>
                      <button onClick={() => dispatch({ type: "DESPEDIR", id: m.id })} className="font-cond text-xs uppercase text-mut transition-colors hover:text-blood cursor-pointer">Despedir</button>
                    </div>
                  ))}
                </div>
              )}
              {(!info.multiple || !limiteSucursal) && !(contratados.length > 0 && !info.multiple) && (
                <Btn small variant="gold" className="mt-auto w-fit min-w-[126px] self-stretch" onClick={() => dispatch({ type: "CONTRATAR", tipo: t })}>
                  <I n="case" className="h-3.5 w-3.5" /> Contratar {info.multiple ? `(${contratados.length}/${Math.max(nSuc, 1)})` : ""}
                </Btn>
              )}
              {info.multiple && limiteSucursal && <p className="mt-2 font-cond text-[11px] text-mut">Cada puesto de sucursal requiere una sucursal propia.</p>}
            </div>
          );
        })}
      </div>
      {tipos.length > 4 && (
        <div className="flex items-center justify-center gap-2 font-cond text-xs text-mut">
          <Btn small variant="dark" disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))}>Anterior</Btn>
          <span>{pagina + 1} / {Math.ceil(tipos.length / 4)}</span>
          <Btn small variant="gold" disabled={(pagina + 1) * 4 >= tipos.length} onClick={() => setPagina(p => p + 1)}>Más personal</Btn>
        </div>
      )}
    </div>
  );
}

// ==================== AJUSTES: PARTIDAS Y ATAJOS ====================
export function ModalAjustes({ onCerrar, atajos, onCambiarAtajos }: { onCerrar: () => void; atajos: Atajos; onCambiarAtajos: (atajos: Atajos) => void }) {
  const { state, dispatch } = useGame();
  const [sonido, setSonido] = useState(audioHabilitado);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [nombrePartida, setNombrePartida] = useState(state.nombrePartida || state.nombreGimnasio || "Mi carrera");
  const [textoGrande, setTextoGrande] = useState(() => localStorage.getItem("vida-del-boxeo:textoGrande") === "1");
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem("vida-del-boxeo:altoContraste") === "1");
  const [movimientoReducido, setMovimientoReducido] = useState(() => localStorage.getItem("vida-del-boxeo:movimientoReducido") === "1");
  const [atajosEditados, setAtajosEditados] = useState<Atajos>(atajos);
  const conflictos = conflictosAtajos(atajosEditados);

  useEffect(() => {
    document.documentElement.classList.toggle("texto-grande", textoGrande);
    document.documentElement.classList.toggle("alto-contraste", altoContraste);
    document.documentElement.classList.toggle("movimiento-reducido", movimientoReducido);
    localStorage.setItem("vida-del-boxeo:textoGrande", textoGrande ? "1" : "0");
    localStorage.setItem("vida-del-boxeo:altoContraste", altoContraste ? "1" : "0");
    localStorage.setItem("vida-del-boxeo:movimientoReducido", movimientoReducido ? "1" : "0");
  }, [textoGrande, altoContraste, movimientoReducido]);

  const guardarAhora = () => {
    const guardada = guardarEnRanura({ ...state, nombrePartida: nombrePartida.trim() || "Mi carrera" }, nombrePartida);
    if (guardada) {
      setMensaje("Partida guardada. Podés continuarla desde el inicio.");
      dispatch({ type: "TOAST", texto: "Partida guardada correctamente.", tono: "ok" });
    } else {
      setMensaje("No se pudo guardar esta partida en el navegador.");
    }
  };

  return (
    <Modal title="Configuración y Partida" icon="gear" onClose={onCerrar} fit>
      <div className="space-y-2 text-sm">
        <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="font-display text-base text-cream">Guardar y cargar</div>
          <p className="font-cond text-xs text-sand">La partida se guarda sola después de cada acción. Poné un nombre para encontrarla en “Continuar partida”.</p>
          <input value={nombrePartida} onChange={e => setNombrePartida(e.target.value)} maxLength={32} aria-label="Nombre de la partida"
            className="mt-2 w-full rounded-lg border border-line bg-ink px-2 py-1.5 font-cond text-sm text-cream outline-none focus:border-gold" placeholder="Nombre de la partida" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn small variant="gold" onClick={guardarAhora}><I n="check" className="h-3.5 w-3.5" /> Guardar ahora</Btn>
          </div>
          {mensaje && <div className="mt-2 rounded-lg border border-gold2/40 bg-gold/10 px-2.5 py-1.5 font-cond text-xs text-gold">{mensaje}</div>}
        </div>

        <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="font-display text-base text-cream">Comodidad de lectura</div>
          <p className="font-cond text-xs text-sand">Estas opciones se guardan en este navegador y no cambian las reglas del juego.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Btn small variant={textoGrande ? "gold" : "dark"} onClick={() => setTextoGrande(v => !v)}>
              {textoGrande ? "✓ " : ""}Texto grande
            </Btn>
            <Btn small variant={altoContraste ? "gold" : "dark"} onClick={() => setAltoContraste(v => !v)}>
              {altoContraste ? "✓ " : ""}Alto contraste
            </Btn>
            <Btn small variant={movimientoReducido ? "gold" : "dark"} onClick={() => setMovimientoReducido(v => !v)}>
              {movimientoReducido ? "✓ " : ""}Menos movimiento
            </Btn>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-cond text-xs text-sand">Sonido de campana, golpes y notificaciones</span>
            <Btn small variant={sonido ? "gold" : "dark"} onClick={() => {
              const siguiente = !sonido;
              setSonido(siguiente);
              setAudioHabilitado(siguiente);
            }}>
              <I n={sonido ? "volume" : "x"} className="h-3.5 w-3.5" /> {sonido ? "Activado" : "Silenciado"}
            </Btn>
          </div>
        </div>

        <div className="border border-blood/40 bg-blood/5 p-2.5 rounded-xl">
          <div className="font-display text-base text-[#ff8a7e]">Zona de riesgo</div>
          <p className="font-cond text-xs text-sand">Borra la carrera actual (los legados también). No se puede deshacer.</p>
          <Btn
            small
            variant="blood"
            className="mt-2"
            onClick={() => {
              if (window.confirm("¿Seguro? Se borrará toda la carrera actual.")) {
                dispatch({ type: "REINICIAR" });
                onCerrar();
              }
            }}
          >
            <I n="x" className="h-3.5 w-3.5" /> Reiniciar carrera
          </Btn>
        </div>

        <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="font-display text-base text-cream">Atajos de teclado</div>
          <p className="mt-1 font-cond text-xs text-sand">Elegí una tecla por acción. Podés escribir <b>Esc</b> o <b>Espacio</b>; los cambios quedan guardados en este navegador.</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {ATAJOS_LABELS.map(([id, label]) => (
              <label key={id} className="grid gap-1 font-cond text-[11px] uppercase tracking-wide text-mut">
                {label}
                <input
                  value={atajosEditados[id] === " " ? "Espacio" : atajosEditados[id]}
                  onChange={e => setAtajosEditados(prev => ({ ...prev, [id]: e.target.value }))}
                  onBlur={() => setAtajosEditados(prev => ({ ...prev, [id]: normalizarTecla(prev[id], ATAJOS_DEFAULT[id]) }))}
                  maxLength={10}
                  className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 font-mono-data text-sm uppercase text-cream outline-none focus:border-gold"
                  aria-label={`Atajo para ${label}`}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn small variant="gold" disabled={conflictos.length > 0} onClick={() => { onCambiarAtajos(atajosEditados); setMensaje("Atajos guardados."); }}>
              Guardar atajos
            </Btn>
            <Btn small variant="dark" onClick={() => { setAtajosEditados({ ...ATAJOS_DEFAULT }); onCambiarAtajos({ ...ATAJOS_DEFAULT }); setMensaje("Atajos restaurados."); }}>
              Restaurar predeterminados
            </Btn>
          </div>
          {conflictos.length > 0 && <div className="mt-2 rounded-lg border border-blood/50 bg-blood/10 px-2.5 py-1.5 font-cond text-xs text-[#ff8a7e]">
            Hay teclas repetidas. Asigná una tecla distinta a cada acción antes de guardar.
          </div>}
          <div className="mt-2 grid gap-1.5 font-cond text-xs text-sand sm:grid-cols-2">
            <span><kbd className="keycap">{atajos.gimnasio}</kbd> Gimnasio · <kbd className="keycap">{atajos.ciudad}</kbd> Ciudad · <kbd className="keycap">{atajos.plantel}</kbd> Plantel</span>
            <span><kbd className="keycap">{atajos.avanzar === " " ? "Espacio" : atajos.avanzar}</kbd> Avanzar día · <kbd className="keycap">{atajos.semanaRapida}</kbd> Semana rápida · <kbd className="keycap">{atajos.cerrar}</kbd> Cerrar</span>
          </div>
        </div>

      </div>
    </Modal>
  );
}
