import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, CURSOS, EQUIPOS, PERSONAL_INFO, PROPIEDADES, TITULOS } from "../game/data";
import { audioHabilitado, setAudioHabilitado } from "../game/audio";
import { alumnosActivos, alumnosEnEspera, capacidadAlumnos, estadoRecord, fmt, nivelGimnasio, puedeHabilitar, sanitizarEstado, sucursales, totalPeleas, valoracion } from "../game/engine";
import { CLAVE_GUARDADO, guardarPartida, useGame } from "../game/state";
import { ATAJOS_DEFAULT, ATAJOS_LABELS, normalizarTecla, type Atajos } from "../game/shortcuts";
import type { Accion, CategoriaMercado, CursoId, EstadoJuego, PersonalId, Pugilista, RamaCurso } from "../game/types";
import { BarraEnergia, Btn, Chip, I, Modal, RostroBoxeador } from "./ui";

// ==================== EXPORTACIÓN / IMPORTACIÓN DE PARTIDA JSON ====================
export function exportarPartidaJSON(estado: EstadoJuego) {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `partida-${(estado.nombreGimnasio || "vida-del-boxeo").toLowerCase().replace(/\s+/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarPartidaJSON(
  archivo: File,
  dispatch: (a: Accion) => void,
  onExito?: () => void,
  onError?: () => void
) {
  const lector = new FileReader();
  if (archivo.size > 2_000_000) {
    dispatch({ type: "TOAST", texto: "El archivo es demasiado grande (máximo 2 MB).", tono: "alerta" });
    if (onError) onError();
    return;
  }
  lector.onload = () => {
    try {
      const bruto: unknown = JSON.parse(String(lector.result));
      if (!bruto || typeof bruto !== "object" || !Array.isArray((bruto as { plantel?: unknown }).plantel)) {
        throw new Error("formato inválido");
      }
      const estado = sanitizarEstado(bruto);
      dispatch({ type: "IMPORTAR", estado });
      if (onExito) onExito();
    } catch {
      dispatch({ type: "TOAST", texto: "El archivo no parece una partida válida.", tono: "alerta" });
      if (onError) onError();
    }
  };
  lector.readAsText(archivo);
}

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
                Prácticas <b className="text-gold">{p.fogueo}/{p.fogueoMeta}</b>
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
                  <span>Emitir licencia {fmt(200)}</span>
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
        <h2 className="font-display text-2xl tracking-wide text-gold">Plantel de Atletas</h2>
        <Chip tone={alumnosEspera.length ? "blood" : "gold"}><I n="users" className="h-3 w-3" /> Alumnos {alumnos.length}/{cupoAlumnos}{alumnosEspera.length ? ` · ${alumnosEspera.length} en espera` : ""}</Chip>
        <Chip tone="blood"><I n="glove" className="h-3 w-3" /> Federados {boxeadores.length}</Chip>
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
          completá sus <b>prácticas de combate</b> (8 a 10, los sábados) y luego emití su licencia individual.
        </div>
      )}

      {/* SECCIÓN BOXEADORES FEDERADOS */}
      {boxeadores.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl tracking-wide text-blood flex items-center gap-2">
            <span>🥊 Boxeadores Federados Oficiales ({boxeadores.length})</span>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {boxeadores.map(p => <Tarjeta key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* SECCIÓN ALUMNOS EN FORMACIÓN */}
      <section>
        <h3 className="mb-2 font-display text-xl tracking-wide text-sand flex items-center gap-2">
            <span>🥋 Alumnos en Formación y Práctica ({alumnos.length}/{cupoAlumnos})</span>
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {alumnos.map(p => <Tarjeta key={p.id} p={p} />)}
        </div>
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
  const [nombreMarca, setNombreMarca] = useState("");
  const ordenInicial = ["vendasGel", "botiquin", "soga", "pisoGoma"];
  const recomendadoId = ordenInicial.find(id => !state.equipamiento.includes(id as never) && EQUIPOS[id as keyof typeof EQUIPOS].cat === cat);
  const items = Object.entries(EQUIPOS)
    .filter(([, v]) => v.cat === cat)
    .sort(([a], [b]) => (a === recomendadoId ? -1 : b === recomendadoId ? 1 : 0));

  return (
    <div className="game-screen h-full overflow-hidden space-y-2">
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Equipamiento e Instalaciones</h2>
        <span className="font-cond text-sm text-sand">Caja disponible: <b className="text-gold">{fmt(state.dinero)}</b></span>
        <span className="font-cond text-sm text-sand">Instalado: <b className="text-cream">{state.equipamiento.length}/21</b></span>
        {recomendadoId && <span className="rounded-full border border-neonc/50 bg-neonc/10 px-2.5 py-1 font-cond text-xs text-neonc">Sugerencia: empezá por una mejora de recuperación</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`border px-3 py-1.5 font-cond text-sm uppercase tracking-wider transition-colors cursor-pointer ${
              cat === c.id ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel text-sand hover:border-line2"
            }`}
          >
            <span className="inline-flex items-center gap-1.5"><I n={c.icono} className="h-4 w-4" /> {c.nombre}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([id, eq]) => {
          const comprado = state.equipamiento.includes(id as never);
          const bloqueado = id === "zonaElite" && !state.cursos.includes("altoRendimiento");
          return (
            <div key={id} className={`panel p-4 ${comprado ? "border-win/50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold2/50 bg-gold/10 text-gold shadow-inner"><I n={eq.icono} className="h-6 w-6" /></div>
                  <div>
                    <div className="font-display text-lg leading-tight tracking-wide text-cream">{eq.nombre}</div>
                    <div className="font-display text-base text-gold">{fmt(eq.costo)}</div>
                  </div>
                </div>
                {comprado && <Chip tone="win"><I n="check" className="h-3 w-3" /> Instalado</Chip>}
                {!comprado && id === recomendadoId && <Chip tone="neon">Recomendado ahora</Chip>}
              </div>
              <p className="mt-2 font-cond text-sm text-sand">{eq.desc}</p>
              <p className="mt-1 font-cond text-xs text-neonc">{eq.efecto}</p>
              {!comprado && (
                <Btn
                  small
                  variant={state.dinero >= eq.costo && !bloqueado ? "gold" : "dark"}
                  className="mt-3 w-full"
                  disabled={state.dinero < eq.costo || bloqueado}
                  onClick={() => dispatch({ type: "COMPRAR_EQUIPO", id: id as never })}
                >
                  {bloqueado ? "Requiere Alto Rendimiento" : `Comprar · ${fmt(eq.costo)}`}
                </Btn>
              )}
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
    </div>
  );
}

// ==================== MI PERFIL: CURSOS, PROPIEDADES, LEGADO ====================
export function PanelPerfil() {
  const { state, dispatch } = useGame();
  const [seccionPerfil, setSeccionPerfil] = useState<"cursos" | "bienes">("cursos");
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

      <div className="flex gap-2 rounded-xl border border-line bg-panel2 p-1">
        <button onClick={() => setSeccionPerfil("cursos")} className={`flex-1 rounded-lg px-3 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "cursos" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>Cursos del coach</button>
        <button onClick={() => setSeccionPerfil("bienes")} className={`flex-1 rounded-lg px-3 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "bienes" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>Bienes raíces</button>
      </div>

      {/* CURSOS */}
      {seccionPerfil === "cursos" && <section className="min-h-0">
        <h3 className="mb-2 font-display text-xl tracking-wide text-cream">Cursos del Coach · 3 ramas de especialización</h3>
        <div className="grid gap-2 lg:grid-cols-3">
          {ramas.map(rama => (
            <div key={rama.id} className="panel p-2.5">
              <div className={`mb-1.5 flex items-center gap-2 font-display text-lg tracking-wide ${rama.color}`}>
                <I n={rama.icono} className="h-5 w-5" /> {rama.nombre}
              </div>
              <div className="space-y-1.5">
                {(Object.keys(CURSOS) as CursoId[]).filter(c => CURSOS[c].rama === rama.id)
                  .sort((x, y) => CURSOS[x].nivel - CURSOS[y].nivel)
                  .map(cid => {
                    const c = CURSOS[cid];
                    const aprobado = state.cursos.includes(cid);
                    const reqOk = !c.req || state.cursos.includes(c.req);
                    return (
                      <div key={cid} className={`border p-2 ${aprobado ? "border-win/50 bg-win/5" : "border-line bg-panel2"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-display text-base tracking-wide text-cream">
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
                        <p className="mt-1 font-cond text-[10px] leading-tight text-sand">{c.desc}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>}

      {/* PROPIEDADES */}
      {seccionPerfil === "bienes" && <section className="min-h-0">
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
  const nSuc = sucursales(state);

  return (
    <div className="game-screen h-full overflow-hidden space-y-2">
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Cuerpo Técnico & Empleados</h2>
        <span className="font-cond text-sm text-sand">Contratados: <b className="text-cream">{state.personal.length}</b></span>
        <span className="font-cond text-sm text-sand">Costo nómina semanal: <b className="text-blood">{fmt(state.personal.reduce((ac, p) => ac + PERSONAL_INFO[p.tipo].sueldo, 0))}</b></span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tipos.map(t => {
          const info = PERSONAL_INFO[t];
          const contratados = state.personal.filter(p => p.tipo === t);
          const limiteSucursal = info.multiple && contratados.length >= Math.max(nSuc, 1);
          return (
            <div key={t} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg tracking-wide text-cream">{info.nombre}</div>
                  <div className="font-cond text-xs text-gold">Costo: {fmt(info.sueldo)}/semana</div>
                </div>
                <div className="grid h-9 w-9 place-items-center border border-line bg-ink text-sand"><I n={info.icono} className="h-4 w-4" /></div>
              </div>
              <p className="mt-2 font-cond text-xs text-sand"><span className="text-cream">Aporta:</span> {info.desc}</p>
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
                <Btn small variant="gold" className="mt-3 w-full" onClick={() => dispatch({ type: "CONTRATAR", tipo: t })}>
                  <I n="case" className="h-3.5 w-3.5" /> Contratar {info.multiple ? `(${contratados.length}/${Math.max(nSuc, 1)})` : ""}
                </Btn>
              )}
              {info.multiple && limiteSucursal && <p className="mt-2 font-cond text-[11px] text-mut">Cada puesto de sucursal requiere una sucursal propia.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== AJUSTES: EXPORTAR / IMPORTAR ====================
export function ModalAjustes({ onCerrar, atajos, onCambiarAtajos }: { onCerrar: () => void; atajos: Atajos; onCambiarAtajos: (atajos: Atajos) => void }) {
  const { state, dispatch } = useGame();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [guardadoEn, setGuardadoEn] = useState(() => {
    try { return localStorage.getItem(`${CLAVE_GUARDADO}:guardadoEn`); } catch { return null; }
  });
  const [sonido, setSonido] = useState(audioHabilitado);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [textoGrande, setTextoGrande] = useState(() => localStorage.getItem("vida-del-boxeo:textoGrande") === "1");
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem("vida-del-boxeo:altoContraste") === "1");
  const [movimientoReducido, setMovimientoReducido] = useState(() => localStorage.getItem("vida-del-boxeo:movimientoReducido") === "1");
  const [atajosEditados, setAtajosEditados] = useState<Atajos>(atajos);

  useEffect(() => {
    document.documentElement.classList.toggle("texto-grande", textoGrande);
    document.documentElement.classList.toggle("alto-contraste", altoContraste);
    document.documentElement.classList.toggle("movimiento-reducido", movimientoReducido);
    localStorage.setItem("vida-del-boxeo:textoGrande", textoGrande ? "1" : "0");
    localStorage.setItem("vida-del-boxeo:altoContraste", altoContraste ? "1" : "0");
    localStorage.setItem("vida-del-boxeo:movimientoReducido", movimientoReducido ? "1" : "0");
  }, [textoGrande, altoContraste, movimientoReducido]);

  const exportar = () => {
    exportarPartidaJSON(state);
    setMensaje("Archivo preparado para descargar.");
  };

  const guardarAhora = () => {
    if (guardarPartida(state)) {
      const ahora = new Date().toISOString();
      setGuardadoEn(ahora);
      setMensaje("Partida guardada en este navegador.");
      dispatch({ type: "TOAST", texto: "Partida guardada correctamente.", tono: "ok" });
    } else {
      setMensaje("No se pudo guardar. Exportá un archivo .json como respaldo.");
    }
  };

  const importar = (archivo: File) => {
    importarPartidaJSON(archivo, dispatch, onCerrar);
  };

  return (
    <Modal title="Configuración y Partida" icon="gear" onClose={onCerrar} fit>
      <div className="space-y-2 text-sm">
        <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="font-display text-base text-cream">Guardar y cargar</div>
          <p className="font-cond text-xs text-sand">La partida se guarda sola después de cada acción. También podés crear un respaldo para moverla a otra computadora.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn small variant="gold" onClick={guardarAhora}><I n="check" className="h-3.5 w-3.5" /> Guardar ahora</Btn>
            <Btn small variant="gold" onClick={exportar}><I n="download" className="h-3.5 w-3.5" /> Exportar .json</Btn>
            <Btn small variant="dark" onClick={() => archivoRef.current?.click()}><I n="upload" className="h-3.5 w-3.5" /> Importar .json</Btn>
            <input
              ref={archivoRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) importar(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-2 font-cond text-[11px] text-mut">
            {guardadoEn ? `Último guardado: ${new Date(guardadoEn).toLocaleString()}` : "Todavía no hay un guardado registrado."}
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
            <Btn small variant="gold" onClick={() => { onCambiarAtajos(atajosEditados); setMensaje("Atajos guardados."); }}>
              Guardar atajos
            </Btn>
            <Btn small variant="dark" onClick={() => { setAtajosEditados({ ...ATAJOS_DEFAULT }); onCambiarAtajos({ ...ATAJOS_DEFAULT }); setMensaje("Atajos restaurados."); }}>
              Restaurar predeterminados
            </Btn>
          </div>
          <div className="mt-2 grid gap-1.5 font-cond text-xs text-sand sm:grid-cols-2">
            <span><kbd className="keycap">{atajos.gimnasio}</kbd> Gimnasio · <kbd className="keycap">{atajos.ciudad}</kbd> Ciudad · <kbd className="keycap">{atajos.plantel}</kbd> Plantel</span>
            <span><kbd className="keycap">{atajos.avanzar === " " ? "Espacio" : atajos.avanzar}</kbd> Cerrar el día · <kbd className="keycap">{atajos.semanaRapida}</kbd> Semana rápida · <kbd className="keycap">{atajos.cerrar}</kbd> Cerrar</span>
          </div>
        </div>

      </div>
    </Modal>
  );
}
