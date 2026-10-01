import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIAS, COMBOS, COMUNITARIOS, CURSOS, EQUIPOS, PERSONAL_INFO, PROPIEDADES, TITULOS } from "../game/data";
import { recomendarEquipo } from "../game/market";
import { audioHabilitado, setAudioHabilitado } from "../game/audio";
import { alumnosActivos, alumnosEnEspera, capacidadAlumnos, capacidadAmateurs, capacidadProfesionales, estadoRecord, fmt, nivelGimnasio, puedeHabilitar, puedeProfesionalizar, proyeccionSemanalRecurrente, sucursales, totalPeleas, valoracion } from "../game/engine";
import { guardarEnRanura, useGame } from "../game/state";
import { ATAJOS_DEFAULT, ATAJOS_LABELS, conflictosAtajos, normalizarTecla, type Atajos } from "../game/shortcuts";
import type { CategoriaMercado, CursoId, PersonalId, Pugilista, RamaCurso } from "../game/types";
import { BarraEnergia, Btn, Chip, I, Modal, RostroBoxeador } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { calcularCapacidadPlantel, ordenarPlantel, type DimensionesLayoutPlantel, type OrdenPlantel } from "../game/plantelLayout";
import ArchivoCarreras from "./CareerArchive";

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
  const tieneLicenciaDT = state.cursos.includes("dt");
  const tieneDT = state.personal.some(p => p.tipo === "directorTecnico");
  const cupoAlumnos = capacidadAlumnos(state);
  const amateurs = boxeadores.filter(p => p.circuito === "amateur").length;
  const profesionales = boxeadores.filter(p => p.circuito === "pro").length;
  const [filtroGrupo, setFiltroGrupo] = useState<"todos" | "alumnos" | "federados" | "espera">("todos");
  const [pagina, setPagina] = useState(0);
  const [orden, setOrden] = useState<OrdenPlantel>("recientes");
  const [archivoAbierto, setArchivoAbierto] = useState(false);

  // Lista según filtro
  const listaAtletasSinPrioridad = filtroGrupo === "todos"
    ? [...boxeadores, ...alumnos, ...alumnosEspera]
    : filtroGrupo === "alumnos"
    ? alumnos
    : filtroGrupo === "federados"
    ? boxeadores
    : alumnosEspera;
  const listaAtletas = ordenarPlantel(listaAtletasSinPrioridad, state.semana, orden, p => valoracion(p.atrib));

  // --- Medición reactiva del área neta de contenido para el cálculo puro ---
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<DimensionesLayoutPlantel>(() => ({
    anchoDisponible: typeof window !== "undefined" ? Math.max(320, window.innerWidth - 360) : 920,
    altoDisponible: 300,
  }));

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ anchoDisponible: Math.round(width), altoDisponible: Math.round(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = calcularCapacidadPlantel(dims, listaAtletas.length, pagina);
  const { columnas, filas, porPagina, totalPaginas, estiloGrilla, obtenerAtletasVisibles } = layout;

  useEffect(() => {
    setPagina(0);
  }, [filtroGrupo, orden]);

  useEffect(() => {
    setPagina(p => Math.min(p, totalPaginas - 1));
  }, [totalPaginas]);

  const atletasVisibles = obtenerAtletasVisibles(listaAtletas);

  const seleccionarAtleta = (p: Pugilista) => {
    if (onAbrir) onAbrir(p.id);
    if (onSeleccionarBoxeador) onSeleccionarBoxeador(p);
  };

  const Tarjeta = ({ p }: { p: Pugilista }) => {
    const agendada = state.pendientes.some(x => x.miId === p.id);
    const listoSabado = puedeHabilitar(p, state);
    const paseProfesional = p.rol === "boxeador" ? puedeProfesionalizar(p, state) : { ok: false };
    const recienIngresado = p.semanaIngreso === state.semana;

    return (
      <motion.article
        layout
        whileHover={{ y: -2 }}
        className={`roster-card panel flex h-full min-h-0 w-full flex-col justify-between p-1.5 sm:p-2 text-left transition-colors hover:border-gold2 overflow-hidden ${
          agendada
            ? "border-blood/60"
            : recienIngresado
            ? "border-neonc/60 shadow-[0_0_10px_rgba(56,224,207,0.12)]"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => seleccionarAtleta(p)}
            className="flex items-center gap-2 min-w-0 text-left cursor-pointer group focus:outline-none"
            title={`Abrir ficha técnica de ${p.nombre}`}
          >
            <RostroBoxeador atleta={p} className="roster-avatar h-8 w-8 shrink-0 rounded-lg group-hover:ring-1 group-hover:ring-gold transition-all" />
            <div className="min-w-0">
              <div className="font-display text-sm sm:text-base leading-tight tracking-wide text-cream truncate group-hover:text-gold transition-colors">
                {p.nombre}
              </div>
              <div className="font-cond text-[10px] sm:text-[11px] uppercase tracking-wider text-mut truncate">
                {p.edad} años · {p.division} · {p.rol === "boxeador" ? (p.circuito === "pro" ? "Profesional" : "Amateur") : "Alumno"}
              </div>
              {recienIngresado && (
                tieneDT ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded border border-neonc/40 bg-neonc/10 px-1.5 py-0.5 font-cond text-[9px] uppercase tracking-wide text-neonc" title="Enfoque táctico asignado automáticamente por tu Director Técnico">
                    ✨ Nuevo · Enfoque auto ({COMBOS[p.combo]?.corto ?? "Asignado"})
                  </span>
                ) : (
                  <span
                    className="mt-0.5 inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 font-cond text-[9px] uppercase tracking-wide text-gold"
                    title="Talento nuevo: abrí su ficha para asignar su enfoque semanal"
                  >
                    ✨ Nuevo · Asignar enfoque
                  </span>
                )
              )}
            </div>
          </button>

          <div className="text-right shrink-0">
            <div className="font-display text-xl text-gold">{valoracion(p.atrib)}</div>
            <div className="font-cond text-[10px] uppercase text-mut">Valoración</div>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-1 min-h-0 overflow-hidden">
          <BarraEnergia v={p.energia} />
          {paseProfesional.ok && <Chip tone="gold">Pase profesional · decisión pendiente</Chip>}
          {p.enEspera && <Chip tone="gold">Espera</Chip>}
          {p.lesion && (
            <Chip tone="blood">
              <I n="activity" className="h-3 w-3" /> Lesión ({p.lesion.semanas}s)
            </Chip>
          )}
          {p.elite && <Chip tone="neon">Élite</Chip>}
          {p.titulo > 0 && (
            <Chip tone="gold">
              <I n="trophy" className="h-3 w-3" />
              {TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}
            </Chip>
          )}
          {COMBOS[p.combo] && (
            <span
              className="inline-flex items-center gap-1 rounded border border-line bg-panel2 px-1.5 py-0.5 font-cond text-[10px] text-sand truncate"
              title={`Enfoque semanal: ${COMBOS[p.combo].nombre}`}
            >
              <I n="glove" className="h-3 w-3 text-gold" /> {COMBOS[p.combo].corto}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-1 border-t border-line pt-1 min-h-0 shrink-0">
          {p.rol === "alumno" ? (
            <>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-cond text-[10px] sm:text-[11px] uppercase tracking-wide text-sand whitespace-nowrap">
                  Guanteos <b className="text-gold">{p.fogueo}/{p.fogueoMeta}</b>
                </span>
                <div className="stat-bar w-full min-w-0" aria-label={`${p.fogueo} de ${p.fogueoMeta} guanteos`}>
                  <i style={{ width: `${(p.fogueo / p.fogueoMeta) * 100}%`, background: "var(--color-gold)" }} />
                </div>
              </div>
              {listoSabado && !p.enEspera && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}
                  aria-label={`Tramitar licencia amateur de ${p.nombre} por ${fmt(200)}`}
                  className="btn-poster guia-luminica ml-auto border border-[#ffe0a0]/50 bg-gold px-2 py-0.5 text-xs text-ink cursor-pointer shrink-0"
                >
                  <span>Tramitar licencia · {fmt(200)}</span>
                </button>
              )}
              {p.enEspera && (
                <button
                  type="button"
                  onClick={() => { if (window.confirm(`¿Retirar a ${p.nombre} de la lista de espera?`)) dispatch({ type: "RETIRAR_ATLETA", id: p.id }); }}
                  className="ml-auto rounded-lg border border-line2 px-2 py-0.5 font-cond text-[10px] uppercase tracking-wide text-mut hover:border-blood/60 hover:text-blood cursor-pointer shrink-0"
                >
                  Retirar
                </button>
              )}
            </>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-cond text-[10px] sm:text-[11px] uppercase text-sand whitespace-nowrap">
                <b className="text-cream">{p.record.v}-{p.record.d}-{p.record.e ?? 0}</b> · <b className="text-blood">{p.record.ko} KO</b>
              </span>
              <div className="flex items-center justify-end gap-1 shrink-0">
                {agendada ? (
                  <Chip tone="blood">Cartelera</Chip>
                ) : (
                  onBuscarRival && (
                    <Btn
                      small
                      variant="dark"
                      onClick={() => onBuscarRival(p.id)}
                    >
                      <I n="target" className="h-3 w-3" /> Rival
                    </Btn>
                  )
                )}
                <button
                  type="button"
                  onClick={() => { if (window.confirm(`¿Transferir a ${p.nombre} fuera del club?`)) dispatch({ type: "RETIRAR_ATLETA", id: p.id }); }}
                  className="rounded-lg border border-line2 px-2 py-0.5 font-cond text-[10px] uppercase tracking-wide text-mut hover:border-blood/60 hover:text-blood cursor-pointer"
                >
                  Transferir
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.article>
    );
  };

  return (
    <div className="game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      {/* CABECERA COMPACTA DE PLANTEL */}
      <div className="panel flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-1 shrink-0">
        <h2 className="font-display text-base sm:text-lg tracking-wide text-gold mr-1">Plantel</h2>
        <Chip tone={alumnosEspera.length ? "blood" : "gold"}><I n="users" className="h-3 w-3" /> Alumnos {alumnos.length}/{cupoAlumnos}{alumnosEspera.length ? ` · ${alumnosEspera.length} espera` : ""}</Chip>
        <Chip tone="blood"><I n="glove" className="h-3 w-3" /> Amateurs {amateurs}/{capacidadAmateurs(state)} · Profesionales {profesionales}/{capacidadProfesionales(state)}</Chip>
        <Chip tone="neon"><I n="users" className="h-3 w-3" /> Recreativos {state.recreativos}</Chip>
        {state.pendientes.length > 0 && <Chip><I n="bell" className="h-3 w-3" /> Cartelera: {state.pendientes.length}</Chip>}
        <div className="ml-auto flex gap-1.5">
          <Btn small onClick={() => setArchivoAbierto(true)}>Archivo de carreras</Btn>
          <Btn
            small
            variant={state.veladaProgramada ? "gold" : "ghost"}
            onClick={() => dispatch({ type: "ALTERNAR_VELADA" })}
            disabled={!state.cursos.includes("veladas")}
          >
            <I n="ring" className="h-3.5 w-3.5" /> {state.veladaProgramada ? "Velada lista" : "Programar velada"}
          </Btn>
        </div>
      </div>

      {/* RECORRER GRUPOS */}
      {archivoAbierto && <ArchivoCarreras onClose={() => setArchivoAbierto(false)} />}
      <div className="flex flex-wrap items-center gap-1 border-b border-line pb-1 font-cond text-xs uppercase tracking-wider shrink-0">
        <button
          type="button"
          onClick={() => setFiltroGrupo("todos")}
          aria-pressed={filtroGrupo === "todos"}
          className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
            filtroGrupo === "todos"
              ? "bg-gold text-ink border-gold font-bold shadow-sm"
              : "border-line bg-panel text-mut hover:text-cream"
          }`}
        >
          Todos ({state.plantel.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroGrupo("alumnos")}
          aria-pressed={filtroGrupo === "alumnos"}
          className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
            filtroGrupo === "alumnos"
              ? "bg-gold text-ink border-gold font-bold shadow-sm"
              : "border-line bg-panel text-mut hover:text-cream"
          }`}
        >
          Alumnos ({alumnos.length}/{cupoAlumnos})
        </button>
        <button
          type="button"
          onClick={() => setFiltroGrupo("federados")}
          aria-pressed={filtroGrupo === "federados"}
          className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
            filtroGrupo === "federados"
              ? "bg-gold text-ink border-gold font-bold shadow-sm"
              : "border-line bg-panel text-mut hover:text-cream"
          }`}
        >
          Federados ({boxeadores.length})
        </button>
        {alumnosEspera.length > 0 && (
          <button
            type="button"
            onClick={() => setFiltroGrupo("espera")}
            aria-pressed={filtroGrupo === "espera"}
            className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
              filtroGrupo === "espera"
                ? "bg-blood text-cream border-blood font-bold shadow-sm"
                : "border-line bg-panel text-mut hover:text-blood"
            }`}
          >
            En espera ({alumnosEspera.length})
          </button>
        )}
        <label className="ml-auto flex items-center gap-1.5 font-cond text-[10px] uppercase tracking-wide text-mut">
          <span>Orden</span>
          <select
            aria-label="Ordenar boxeadores y alumnos"
            value={orden}
            onChange={event => setOrden(event.target.value as OrdenPlantel)}
            className="max-w-40 rounded-lg border border-line bg-panel px-2 py-1 font-cond text-[11px] uppercase text-sand outline-none focus:border-gold2"
          >
            <option value="recientes">Nuevos esta semana</option>
            <option value="valoracion-desc">Mayor valoración</option>
            <option value="valoracion-asc">Menor valoración</option>
          </select>
        </label>
      </div>

      {/* GUÍA INFORMATIVA COMPACTA (oculta en altura baja para priorizar tarjetas y footer visible) */}
      {!tieneLicenciaDT && dims.altoDisponible >= 200 && (
        <div className="border border-gold2/50 bg-gold/5 px-2.5 py-1 font-cond text-[11px] text-sand rounded-xl shrink-0">
          <b className="text-gold">Cómo habilitar a tu primer boxeador:</b> obtené la Licencia de Entrenador en Mi Perfil,
          completá sus <b>10 guanteos (sparring)</b> y luego tramitá su licencia amateur.
        </div>
      )}

      {/* GRILLA PRINCIPAL DE ATLETAS (DISTRIBUCIÓN RIGUROSA DE 2 FILAS SIN SCROLL) */}
      <div ref={contenedorRef} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {atletasVisibles.length > 0 ? (
          <div className="plantel-grid roster-cards flex-1 min-h-0 w-full overflow-hidden" style={estiloGrilla}>
            {atletasVisibles.map(p => <Tarjeta key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="panel p-6 text-center font-cond text-sm text-mut my-auto">
            {filtroGrupo === "federados"
              ? "No tienes boxeadores federados todavía. Completá los 10 guanteos de un alumno y tramitá su licencia para federarlo."
              : filtroGrupo === "espera"
              ? "No hay aspirantes en la lista de espera."
              : "Sin alumnos activos: la fama y el boca a boca traerán nuevos talentos al gimnasio."}
          </div>
        )}

        {/* PAGINACIÓN COMPACTA INFERIOR */}
        {totalPaginas > 1 && (
          <div className="mt-1 flex items-center justify-center gap-2 font-cond text-xs text-mut shrink-0 pt-1 border-t border-line/40">
            <Btn
              small
              variant="dark"
              disabled={pagina === 0}
              onClick={() => setPagina(p => Math.max(0, p - 1))}
            >
              Anterior
            </Btn>
            <span>{pagina + 1} / {totalPaginas} ({listaAtletas.length} atletas)</span>
            <Btn
              small
              variant="gold"
              disabled={pagina >= totalPaginas - 1}
              onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
            >
              Siguiente
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MERCADO EN 4 CATEGORÍAS ====================
export function PanelMercado() {
  const { state, dispatch } = useGame();
  const [cat, setCat] = useState<CategoriaMercado>("equipamiento");
  const [pagina, setPagina] = useState(0);
  const [nombreMarca, setNombreMarca] = useState("");
  const canvasAmplio = useResponsiveCapacity();
  const canvasIntermedio = useResponsiveCapacity("(min-width: 900px) and (min-height: 900px)");
  const porPagina = canvasAmplio ? 8 : canvasIntermedio ? 6 : 4;
  useEffect(() => setPagina(0), [cat, porPagina]);
  const recomendadoId = recomendarEquipo(cat, state.equipamiento, state.dinero);
  const items = Object.entries(EQUIPOS)
    .filter(([, v]) => v.cat === cat)
    .sort(([a], [b]) => (a === recomendadoId ? -1 : b === recomendadoId ? 1 : 0));

  return (
    <div className="game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      <div className="panel flex flex-wrap items-center gap-2 p-2.5">
        <h2 className="font-display text-xl tracking-wide text-gold">Mercado del Gimnasio</h2>
        <span className="font-cond text-xs text-sand">Instalado: <b className="text-cream">{state.equipamiento.length}/{Object.keys(EQUIPOS).length}</b></span>
        {recomendadoId && <span className="rounded-full border border-neonc/50 bg-neonc/10 px-2.5 py-1 font-cond text-xs text-neonc">Prioridad sugerida: {EQUIPOS[recomendadoId].nombre}</span>}
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

      <div className={`market-items-grid grid min-h-0 gap-2 sm:grid-cols-2 lg:grid-cols-4 ${canvasAmplio && items.length >= 8 ? "market-items-grid-expanded flex-1" : "shrink-0"}`}>
        {items.slice(pagina * porPagina, pagina * porPagina + porPagina).map(([id, eq]) => {
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
      {items.length > porPagina && (
        <div className="flex items-center justify-center gap-2 font-cond text-xs text-mut">
          <Btn small variant="dark" disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))}>Anterior</Btn>
          <span>{pagina + 1} / {Math.ceil(items.length / porPagina)}</span>
          <Btn small variant="gold" disabled={(pagina + 1) * porPagina >= items.length} onClick={() => setPagina(p => p + 1)}>Más</Btn>
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
  const [socialAbierto, setSocialAbierto] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const ramas: { id: RamaCurso; nombre: string; icono: string; color: string }[] = [
    { id: "deportiva", nombre: "Rama Deportiva", icono: "glove", color: "text-blood" },
    { id: "promotora", nombre: "Rama Promotora", icono: "ring", color: "text-gold" },
    { id: "empresarial", nombre: "Rama Empresarial", icono: "store", color: "text-neonc" },
  ];
  const puedeLegado = state.plantel.some(p => p.titulo === 4) || state.fama >= 85;

  return (
    <div className="game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      <div className="profile-summary panel grid gap-2 p-2.5 md:grid-cols-[1fr_auto]">
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
          {state.dinero <= -1_500 && (
            <div className="border border-blood/60 bg-blood/10 p-2">
              <p className="font-cond text-xs text-sand">La deuda superó $1.500. Podés cerrar y reconstruir el club; no es obligatorio.</p>
              <Btn small variant="blood" className="mt-2 w-fit self-center" onClick={() => setConfirmarCierre(true)}>Cerrar el club</Btn>
            </div>
          )}
        </div>
      </div>

      <div className="profile-subnav flex flex-wrap items-center justify-center gap-2">
        <div className="flex w-fit justify-center gap-2 rounded-xl border border-line bg-panel2 p-1">
          <button onClick={() => setSeccionPerfil("cursos")} className={`w-fit rounded-lg px-4 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "cursos" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>Cursos</button>
          <button onClick={() => setSeccionPerfil("bienes")} className={`w-fit rounded-lg px-4 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "bienes" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>Bienes raíces</button>
        </div>
        <Btn small variant="ghost" onClick={() => setSocialAbierto(true)}><I n="calendar" className="h-3.5 w-3.5" /> Actividades del club</Btn>
      </div>

      {/* CURSOS */}
      {seccionPerfil === "cursos" && <section className="profile-courses flex min-h-0 w-full flex-1 flex-col">
        <h3 className="mb-2 text-center font-display text-lg tracking-wide text-cream">Cursos del Coach · elegí una rama</h3>
        <div className="mb-2 flex flex-wrap justify-center gap-1.5">
          {ramas.map(rama => <button key={rama.id} onClick={() => setRamaActiva(rama.id)} className={`profile-branch-tab inline-flex min-h-8 w-fit items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 font-cond text-xs uppercase tracking-wide ${ramaActiva === rama.id ? `border-gold bg-gold/15 ${rama.color}` : "border-line bg-panel2 text-mut"}`}><I n={rama.icono} className="h-3.5 w-3.5 shrink-0" />{rama.nombre.replace("Rama ", "")}</button>)}
        </div>
        <div className="profile-branch-panel grid min-h-0 flex-1 gap-2">
          {ramas.filter(rama => rama.id === ramaActiva).map(rama => (
            <div key={rama.id} className="profile-branch-card panel flex min-h-0 w-full flex-col p-2">
              <div className="profile-course-grid grid grid-cols-3 gap-2">
                {(Object.keys(CURSOS) as CursoId[]).filter(c => CURSOS[c].rama === rama.id)
                  .sort((x, y) => CURSOS[x].nivel - CURSOS[y].nivel)
                  .map(cid => {
                    const c = CURSOS[cid];
                    const aprobado = state.cursos.includes(cid);
                    const reqOk = !c.req || state.cursos.includes(c.req);
                    return (
                      <div key={cid} className={`profile-course-card flex min-w-0 flex-col justify-between gap-1.5 rounded-lg border p-2 ${aprobado ? "border-win/50 bg-win/5" : "border-line bg-panel2"}`}>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-display text-sm leading-tight tracking-wide text-cream">
                              <span className="mr-1 text-mut">Nv.{c.nivel}</span>{c.nombre}
                            </div>
                          {aprobado ? (
                              <Chip tone="win"><I n="check" className="h-3 w-3" /> Aprobado</Chip>
                            ) : <span className="shrink-0 font-cond text-xs text-gold">{fmt(c.costo)}</span>}
                          </div>
                          <p title={c.desc} className="profile-course-description mt-1 font-cond text-xs leading-snug text-sand">{c.desc}</p>
                        </div>
                        {!aprobado && <Btn
                          small
                          variant={reqOk && state.dinero >= c.costo ? "gold" : "dark"}
                          disabled={!reqOk || state.dinero < c.costo}
                          onClick={() => dispatch({ type: "COMPRAR_CURSO", id: cid })}
                        >{reqOk ? `Comprar · ${fmt(c.costo)}` : `Requiere nivel ${c.nivel - 1}`}</Btn>}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>}

      {socialAbierto && (
        <Modal wide fit title="Actividades del club" icon="calendar" onClose={() => setSocialAbierto(false)}>
          <div className="space-y-2">
            <p className="font-cond text-xs text-sand">Elegí una actividad, invertí una vez y cobrá el resultado al cerrar la semana.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["bingo", "naipes", "festival", "claseAbierta"] as const).map(k => {
                const c = COMUNITARIOS[k];
                return <div key={k} className="rounded-xl border border-line bg-panel2 p-2 text-xs">
                  <div className="mb-1 text-base">{c.emoji}</div>
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
      {seccionPerfil === "bienes" && <section className="profile-properties flex min-h-0 flex-1 flex-col">
        <h3 className="mb-2 text-center font-display text-lg tracking-wide text-cream">Bienes raíces del club</h3>
        <div className="profile-property-grid grid min-h-0 flex-1 content-center gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(["local", "terreno", "sucursal", "apartamento", "mansion", "arena"] as const).map(pid => {
            const p = PROPIEDADES[pid];
            const adquirida = state.propiedades.includes(pid);
            return (
              <div key={pid} title={`${p.desc}${p.beneficio ? ` ${p.beneficio}` : ""}`} className={`profile-property-card panel flex min-w-0 flex-col p-2.5 ${adquirida ? "border-win/50" : "opacity-60"}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <I n={p.icono} className="h-4 w-4 text-gold" />
                  <span className="min-w-0 flex-1 font-display text-base tracking-wide text-cream">{p.nombre}</span>
                  {adquirida ? <span className="ml-auto"><Chip tone="win">Escriturada</Chip></span> : <span className="ml-auto font-cond text-xs text-mut">{fmt(p.costo)}</span>}
                </div>
                {p.beneficio && <p className="pt-1 font-cond text-[11px] leading-snug text-neonc">{p.beneficio}</p>}
              </div>
            );
          })}
        </div>
      </section>}

      {confirmarCierre && (
        <Modal title="Cerrar el club y reconstruir" icon="fire" onClose={() => setConfirmarCierre(false)}>
          <div className="space-y-3 font-cond text-sm text-sand">
            <p>Esta decisión reemplaza la partida actual por una reconstrucción nueva y no se puede deshacer.</p>
            <div className="border border-line bg-panel2 p-3">
              <p className="text-win">Se conservan únicamente:</p>
              <ul className="mt-1 list-inside list-disc"><li>Récord histórico del coach: peleas, victorias, KOs, veladas y títulos.</li><li>Entradas del Salón de la Fama.</li></ul>
              <p className="mt-2 text-blood">Se pierden caja, deuda, plantel, empleados, cursos, equipo, propiedades, patrocinios, fama y seguidores.</p>
              <p className="mt-1">La reconstrucción comienza con $900, sin deuda, y un gimnasio nuevo llamado “{state.nombreGimnasio} II”.</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Btn small variant="dark" onClick={() => setConfirmarCierre(false)}>Seguir con el club</Btn>
              <Btn small variant="blood" onClick={() => {
                dispatch({ type: "CERRAR_CLUB", confirmado: true });
                setConfirmarCierre(false);
              }}>Confirmar cierre irreversible</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== PERSONAL TÉCNICO ====================
export function PanelPersonal() {
  const { state, dispatch } = useGame();
  const tipos = Object.keys(PERSONAL_INFO) as PersonalId[];
  const [pagina, setPagina] = useState(0);
  const [contratacionPendiente, setContratacionPendiente] = useState<PersonalId | null>(null);
  const capacidadEscritorio = useResponsiveCapacity("(min-width: 1100px) and (min-height: 650px)");
  const porPagina = capacidadEscritorio ? 4 : 2;
  useEffect(() => setPagina(p => Math.min(p, Math.max(0, Math.ceil(tipos.length / porPagina) - 1))), [porPagina, tipos.length]);
  const nSuc = sucursales(state);
  const flujoActual = proyeccionSemanalRecurrente(state).total;

  return (
    <div className="staff-screen game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      <div className="staff-header panel flex shrink-0 flex-wrap items-center gap-3 p-3">
        <h2 className="font-display text-2xl tracking-wide text-gold">Cuerpo Técnico & Empleados</h2>
        <span className="font-cond text-sm text-sand">Contratados: <b className="text-cream">{state.personal.length}</b></span>
        <span className="font-cond text-sm text-sand">Costo nómina semanal: <b className="text-blood">{fmt(state.personal.reduce((ac, p) => ac + PERSONAL_INFO[p.tipo].sueldo, 0))}</b></span>
        <span className="font-cond text-sm text-sand" title="Excluye ayuda inicial, eventos y patrocinios temporales.">Flujo recurrente (sin temporales): <b className={flujoActual < 0 ? "text-blood" : "text-win"}>{flujoActual < 0 ? `En contra ${fmt(Math.abs(flujoActual))}` : `A favor ${fmt(flujoActual)}`}/semana</b><span className="sr-only"> Excluye ayuda inicial, eventos y patrocinios temporales.</span></span>
      </div>

      <div className="staff-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tipos.slice(pagina * porPagina, pagina * porPagina + porPagina).map(t => {
          const info = PERSONAL_INFO[t];
          const contratados = state.personal.filter(p => p.tipo === t);
          const limiteSucursal = info.multiple && contratados.length >= Math.max(nSuc, 1);
          const requisito = info.requisito;
          const requisitosPendientes = [
            requisito?.semana && state.semana < requisito.semana ? `Semana ${requisito.semana}` : null,
            requisito?.fama && state.fama < requisito.fama ? `${requisito.fama} de fama` : null,
            requisito?.curso && !state.cursos.includes(requisito.curso) ? `Curso ${CURSOS[requisito.curso].nombre}` : null,
          ].filter((texto): texto is string => Boolean(texto));
          const previsionTrasContratar = proyeccionSemanalRecurrente({
            ...state,
            personal: [...state.personal, { id: "prevision-nomina", tipo: t, nombre: "Previsión" }],
          }).total;
          const requiereConfirmacionFinanciera = previsionTrasContratar < 0;
          return (
            <div key={t} className="staff-card panel flex min-h-[218px] flex-col p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg tracking-wide text-cream">{info.nombre}</div>
                  <div className="font-cond text-xs text-gold">Costo: {fmt(info.sueldo)}/semana</div>
                </div>
                <div className="grid h-9 w-9 place-items-center border border-line bg-ink text-sand"><I n={info.icono} className="h-4 w-4" /></div>
              </div>
              <p className="staff-desc mt-2 min-h-[42px] font-cond text-xs text-sand" title={info.desc}><span className="text-cream">Aporta:</span> {info.desc}</p>
              {contratacionPendiente === t && requiereConfirmacionFinanciera && (
                <div className="mt-2 border border-blood/60 bg-blood/10 p-2" role="status" aria-live="polite">
                  <p className="font-cond text-xs text-cream">Flujo recurrente después de contratar: <b className="text-blood">En contra {fmt(Math.abs(previsionTrasContratar))}/semana</b>.</p>
                  <p className="mt-1 font-cond text-[11px] text-sand">No cuenta subsidios, eventos ni patrocinios temporales. Podés asumir el costo, pero revisá cómo cubrirlo.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Btn small variant="blood" onClick={() => {
                      dispatch({ type: "CONTRATAR", tipo: t, confirmado: true });
                      setContratacionPendiente(null);
                    }}>Contratar igualmente</Btn>
                    <Btn small variant="dark" onClick={() => setContratacionPendiente(null)}>Cancelar</Btn>
                  </div>
                </div>
              )}
              {contratados.length > 0 && (
                <div className="mt-3 border-t border-line pt-2">
                  <div className="flex items-center gap-2 font-cond text-[11px] uppercase tracking-wider text-mut"><span>Personal activo</span><span className="border border-win/50 bg-win/10 px-1.5 py-0.5 text-[10px] text-win">Contratado</span></div>
                  {contratados.map(m => (
                    <div key={m.id} className="mt-1 flex items-center justify-between font-cond text-sm text-cream">
                      <span>{m.nombre}</span>
                      <button onClick={() => dispatch({ type: "DESPEDIR", id: m.id })} className="font-cond text-xs uppercase text-mut transition-colors hover:text-blood cursor-pointer">Despedir</button>
                    </div>
                  ))}
                </div>
              )}
              {requisitosPendientes.length > 0 && !(contratados.length > 0 && !info.multiple) && (
                <div className="mt-auto">
                  <p className="pt-2 text-center font-cond text-[11px] leading-tight text-mut" title={`Requisitos pendientes: ${requisitosPendientes.join(" · ")}`}>
                    Se habilita: {requisitosPendientes.join(" · ")}
                  </p>
                  <Btn small variant="dark" disabled className="mt-2 min-h-9 w-full justify-center">No disponible</Btn>
                </div>
              )}
              {(!info.multiple || !limiteSucursal) && requisitosPendientes.length === 0 && !(contratados.length > 0 && !info.multiple) && contratacionPendiente !== t && (
                <Btn small variant="gold" className="mt-auto min-h-9 w-full justify-center" onClick={() => {
                  if (requiereConfirmacionFinanciera) setContratacionPendiente(t);
                  else dispatch({ type: "CONTRATAR", tipo: t });
                }}>
                  <I n="case" className="h-3.5 w-3.5" /> {contratacionPendiente === t && requiereConfirmacionFinanciera ? "Revisando costo" : "Contratar"} {info.multiple ? `(${contratados.length}/${Math.max(nSuc, 1)})` : ""}
                </Btn>
              )}
              {info.multiple && limiteSucursal && <p className="mt-2 font-cond text-[11px] text-mut">Cada puesto de sucursal requiere una sucursal propia.</p>}
            </div>
          );
        })}
      </div>
      {tipos.length > porPagina && (
        <div className="staff-pagination flex items-center justify-center gap-2 font-cond text-xs text-mut">
          <Btn small variant="dark" disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))}>Anterior</Btn>
          <span>{pagina + 1} / {Math.ceil(tipos.length / porPagina)}</span>
          <Btn small variant="gold" disabled={(pagina + 1) * porPagina >= tipos.length} onClick={() => setPagina(p => p + 1)}>Más personal</Btn>
        </div>
      )}
    </div>
  );
}

// ==================== AJUSTES: PARTIDAS Y ATAJOS ====================
function leerPreferencia(clave: string): boolean {
  try { return localStorage.getItem(clave) === "1"; } catch { return false; }
}
export function ModalAjustes({ onCerrar, atajos, onCambiarAtajos }: { onCerrar: () => void; atajos: Atajos; onCambiarAtajos: (atajos: Atajos) => void }) {
  const { state, dispatch } = useGame();
  const [sonido, setSonido] = useState(audioHabilitado);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [nombrePartida, setNombrePartida] = useState(state.nombrePartida || state.nombreGimnasio || "Mi carrera");
  const [textoGrande, setTextoGrande] = useState(() => leerPreferencia("vida-del-boxeo:textoGrande"));
  const [altoContraste, setAltoContraste] = useState(() => leerPreferencia("vida-del-boxeo:altoContraste"));
  const [movimientoReducido, setMovimientoReducido] = useState(() => leerPreferencia("vida-del-boxeo:movimientoReducido"));
  const [atajosEditados, setAtajosEditados] = useState<Atajos>(atajos);
  const conflictos = conflictosAtajos(atajosEditados);

  useEffect(() => {
    document.documentElement.classList.toggle("texto-grande", textoGrande);
    document.documentElement.classList.toggle("alto-contraste", altoContraste);
    document.documentElement.classList.toggle("movimiento-reducido", movimientoReducido);
    try {
      localStorage.setItem("vida-del-boxeo:textoGrande", textoGrande ? "1" : "0");
      localStorage.setItem("vida-del-boxeo:altoContraste", altoContraste ? "1" : "0");
      localStorage.setItem("vida-del-boxeo:movimientoReducido", movimientoReducido ? "1" : "0");
    } catch {
      setMensaje("Almacenamiento no disponible: las preferencias solo se aplican a esta sesión.");
    }
  }, [textoGrande, altoContraste, movimientoReducido]);

  const guardarAhora = () => {
    const nombre = nombrePartida.trim() || "Mi carrera";
    dispatch({ type: "RENOMBRAR_PARTIDA", nombre });
    const guardada = guardarEnRanura({ ...state, nombrePartida: nombre }, nombre);
    if (guardada) {
      setMensaje("Partida guardada. Podés continuarla desde el inicio.");
      dispatch({ type: "TOAST", texto: "Partida guardada correctamente.", tono: "ok" });
    } else {
      setMensaje("No se pudo guardar. Se conservaron los datos anteriores; revisá el aviso de almacenamiento.");
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
