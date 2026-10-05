import { m as motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIAS, COMBOS, COMUNITARIOS, CURSOS, EQUIPOS, PERSONAL_INFO, PROPIEDADES, TITULOS } from "../game/data";
import { recomendarEquipo } from "../game/market";
import { audioHabilitado, setAudioHabilitado } from "../game/audio";
import { alumnosActivos, alumnosEnEspera, capacidadAlumnos, capacidadAmateurs, capacidadProfesionales, estadoRecord, nivelGimnasio, puedeContratarPersonal, puedeHabilitar, puedeProfesionalizar, proyeccionSemanalRecurrente, totalPeleas, valoracion } from "../game/engine";
import { guardarEnRanura, useGame } from "../game/state";
import { ATAJOS_DEFAULT, ATAJOS_LABELS, conflictosAtajos, normalizarTecla, type Atajos } from "../game/shortcuts";
import type { CategoriaMercado, CursoId, GearId, PersonalId, PropiedadId, Pugilista, RamaCurso, TipoComunitario } from "../game/types";
import { BarraEnergia, Btn, Chip, I, Modal, RostroBoxeador, TextoPaginado } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import {LanguagePicker} from "./LanguagePicker";
import { calcularCapacidadPlantel, ordenarPlantel, type DimensionesLayoutPlantel, type OrdenPlantel } from "../game/plantelLayout";
import ArchivoCarreras from "./CareerArchive";
import { formatearDineroJuego as fmt, useMessages } from "../i18n";
import { contenidoMensaje } from "../game/messageContent";
import { disponibilidadPersonal, legadoDisponible, presentarActividad, presentarCategoria, presentarCurso, presentarDivision, presentarEquipo, presentarPersonal, presentarPropiedad, presentarTitulo } from "../i18n/presentation";

interface PanelPlantelProps {
  onAbrir?: (id: string) => void;
  onBuscarRival?: (id: string) => void;
  onSeleccionarBoxeador?: (b: Pugilista) => void;
}

// ==================== PLANTEL DE ATLETAS ====================
export function PanelPlantel({ onAbrir, onBuscarRival, onSeleccionarBoxeador }: PanelPlantelProps) {
  const { t, locale } = useMessages();
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
  const paginacionRef = useRef<HTMLDivElement>(null);
  const [altoPaginacion, setAltoPaginacion] = useState(52);
  const [orden, setOrden] = useState<OrdenPlantel>("recientes");
  const [archivoAbierto, setArchivoAbierto] = useState(false);
  const [gestionAbierta, setGestionAbierta] = useState(false);
  const [vistaGestion, setVistaGestion] = useState("cupos");
  const [detalleTarjeta, setDetalleTarjeta] = useState("nombre");
  const [bajaPendiente, setBajaPendiente] = useState<Pugilista | null>(null);
  const compactoPlantel = useResponsiveCapacity("(max-width: 700px), (max-height: 800px)");
  const plantelApaisado = useResponsiveCapacity("(max-height: 450px)");
  const grupos: Array<[string, string]> = [["todos", t("roster.all", { count: state.plantel.length })], ["alumnos", t("roster.students", { count: alumnos.length, capacity: cupoAlumnos })], ["federados", t("roster.competitors", { count: boxeadores.length })], ["espera", t("roster.waiting", { count: alumnosEspera.length })]];
  const ordenes: Array<[string, string]> = [["recientes", t("roster.newest")], ["valoracion-desc", t("roster.highest")], ["valoracion-asc", t("roster.lowest")]];
  const vistas: Array<[string, string]> = [["nombre", t("roster.viewName")], ["identidad", t("roster.viewIdentity")], ["estado", t("roster.viewCondition")], ["rendimiento", t("roster.viewPerformance")]];
  const opciones = (lista: Array<[string, string]>, prefijo = "") => lista.filter(([id]) => id !== "espera" || alumnosEspera.length > 0).map(([id, nombre]) => <option key={id} value={prefijo + id}>{nombre}</option>);

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

  const layout = calcularCapacidadPlantel(dims, listaAtletas.length, pagina, { cardMinH: compactoPlantel ? 160 : 300, cardMinW: 300, altoPaginacion: plantelApaisado ? 0 : altoPaginacion });
  const { columnas, filas, porPagina, totalPaginas, estiloGrilla, obtenerAtletasVisibles } = layout;
  useEffect(() => {
    const el = paginacionRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setAltoPaginacion(Math.ceil(el.getBoundingClientRect().height) + 8));
    observer.observe(el);
    return () => observer.disconnect();
  }, [totalPaginas > 1]);

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

  // Render helper, not a component type recreated on every panel render:
  // keeping the keyed article mounted also preserves the dialog trigger.
  const renderTarjeta = (p: Pugilista) => {
    const agendada = state.pendientes.some(x => x.miId === p.id);
    const listoSabado = puedeHabilitar(p, state);
    const paseProfesional = p.rol === "boxeador" ? puedeProfesionalizar(p, state) : { ok: false };
    const recienIngresado = p.semanaIngreso === state.semana;

    if (compactoPlantel) return <article key={p.id} className="panel min-h-0 p-2">
      {detalleTarjeta === "nombre" && <><button className="flex min-h-11 w-full items-start gap-2 text-left" onClick={() => seleccionarAtleta(p)} aria-label={t("roster.openSheet",{name:p.nombre})}>
        <RostroBoxeador atleta={p} className="h-8 w-8 shrink-0 rounded-lg" />
        <div className="min-w-0"><p>{p.nombre}</p>{(recienIngresado || (p.rol === "alumno" && !p.enEspera && !state.guiaClub?.enfoquesConfirmados.includes(p.id))) && <p className="text-gold">{tieneDT ? t("roster.autoFocus") : t("roster.focus")}</p>}</div>
      </button>{dims.altoDisponible >= 300 && <div className="mt-2 space-y-2"><BarraEnergia v={p.energia} /><p>{valoracion(p.atrib)} · {p.rol === "alumno" ? `${p.guanteosRealizados}/10` : `${p.record.v}-${p.record.d}-${p.record.e ?? 0} · ${p.record.ko} KO`}</p></div>}</>}
      {detalleTarjeta === "identidad" && <TextoPaginado capacidad={40} texto={`${t("roster.identityCopy",{age:p.edad,division:presentarDivision(p.division,locale)})}\n${t(p.rol==="boxeador" ? p.circuito==="pro" ? "licence.pro" : "licence.amateur" : "roster.student")}\n${t("roster.ratingCopy",{rating:valoracion(p.atrib)})}`} />}
      {detalleTarjeta === "estado" && <div className="space-y-2"><BarraEnergia v={p.energia} /><TextoPaginado capacidad={40} texto={`${t(`combo.${p.combo}`)}${p.enEspera ? `\n${t("roster.waitingLabel")}` : ""}${p.lesion ? `\n${t("roster.injury",{weeks:p.lesion.semanas})}` : ""}${paseProfesional.ok ? `\n${t("roster.proDecision")}` : ""}${p.elite ? `\n${t("roster.elite")}` : ""}${p.titulo>0 ? `\n${presentarTitulo(p.titulo as 1|2|3|4,locale).nombre}` : ""}`} /></div>}
      {detalleTarjeta === "rendimiento" && <div className="space-y-2">
        <p>{p.rol === "alumno" ? `${t("stat.guanteos")} ${p.guanteosRealizados}/10` : `${p.record.v}-${p.record.d}-${p.record.e ?? 0} · ${p.record.ko} KO`}</p>
        <div className="flex flex-wrap gap-2">
          {p.rol === "alumno" ? listoSabado && !p.enEspera && <Btn onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}>{t("sheet.apply",{price:fmt(200)})}</Btn> : agendada ? <Chip tone="blood">{t("roster.bill")}</Chip> : onBuscarRival && <Btn onClick={() => onBuscarRival(p.id)}>{t("roster.opponent")}</Btn>}
          {(p.rol === "boxeador" || p.enEspera) && <Btn variant="ghost" onClick={() => setBajaPendiente(p)}>{t(p.enEspera ? "waiting.remove" : "transfer.action")}</Btn>}
        </div>
      </div>}
    </article>;

    return (
      <motion.article
        key={p.id}
        whileHover={{ y: -2 }}
        className={`roster-card panel flex h-full min-h-0 w-full flex-col justify-between p-1.5 sm:p-2 text-left transition-colors hover:border-gold2 overflow-hidden ${
          agendada
            ? "border-blood/60"
            : recienIngresado
            ? "border-neonc/60 shadow-[0_0_10px_rgba(56,224,207,0.12)]"
            : ""
        }`}
      >
        <div className="roster-identity flex items-start justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => seleccionarAtleta(p)}
            className="roster-open flex min-h-11 items-center gap-2 min-w-0 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-gold"
            title={t("roster.openSheet",{name:p.nombre})}
            aria-label={t("roster.openSheet",{name:p.nombre})}
          >
            <RostroBoxeador atleta={p} className="roster-avatar h-8 w-8 shrink-0 rounded-lg group-hover:ring-1 group-hover:ring-gold transition-all" />
            <div className="min-w-0">
              <div className="font-display text-sm leading-normal tracking-wide text-cream group-hover:text-gold transition-colors" style={{ overflowWrap: "anywhere" }}>
                {p.nombre}
              </div>
              <div data-text-role="secondary" className="font-cond text-xs uppercase text-mut" style={{ overflowWrap: "anywhere" }}>
                {t("roster.identityCopy",{age:p.edad,division:presentarDivision(p.division,locale)})} · {t(p.rol==="boxeador" ? p.circuito==="pro" ? "city.pro" : "city.amateur" : "roster.student")}
              </div>
              {(recienIngresado || (p.rol === "alumno" && !p.enEspera && !state.guiaClub?.enfoquesConfirmados.includes(p.id))) && (
                tieneDT ? (
                  <span data-text-role="secondary" className="mt-0.5 inline-flex items-center gap-1 rounded border border-neonc/40 bg-neonc/10 px-1.5 py-0.5 font-cond text-xs uppercase tracking-wide text-neonc" title={t("roster.autoHelp")}>
                    ✨ {t("roster.autoBadge",{focus:t(`combo.${p.combo}.short`)})}
                  </span>
                ) : (
                  <span
                    className="mt-0.5 inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 font-cond text-sm uppercase tracking-wide text-gold"
                    title={t("roster.newHelp")}
                  >
                    {recienIngresado ? `✨ ${t("roster.new")} · ` : ""}{t("roster.focus")}
                  </span>
                )
              )}
            </div>
          </button>

          <div className="text-right shrink-0">
            <div className="font-display text-xl text-gold">{valoracion(p.atrib)}</div>
            <div className="font-cond text-[10px] uppercase text-mut">{t("roster.rating")}</div>
          </div>
        </div>

        <div className="roster-condition mt-1 flex flex-wrap items-center gap-1 min-h-0">
          <BarraEnergia v={p.energia} />
          {paseProfesional.ok && <Chip tone="gold">{t("roster.proDecision")}</Chip>}
          {p.enEspera && <Chip tone="gold">{t("roster.waitingLabel")}</Chip>}
          {p.lesion && (
            <Chip tone="blood">
              <I n="activity" className="h-3 w-3" /> {t("roster.injury",{weeks:p.lesion.semanas})}
            </Chip>
          )}
          {p.elite && <Chip tone="neon">{t("roster.elite")}</Chip>}
          {p.titulo > 0 && (
            <Chip tone="gold">
              <I n="trophy" className="h-3 w-3" />
              {presentarTitulo(p.titulo as 1|2|3|4,locale).nombre}
            </Chip>
          )}
          {COMBOS[p.combo] && (
            <span
              className="inline-flex items-center gap-1 rounded border border-line bg-panel2 px-1.5 py-0.5 font-cond text-[10px] text-sand"
              title={t("roster.weeklyFocus",{focus:t(`combo.${p.combo}`)})}
            >
              <I n="glove" className="h-3 w-3 text-gold" /> {t(`combo.${p.combo}.short`)}
            </span>
          )}
        </div>

        <div className="roster-performance mt-1 flex flex-wrap items-center justify-between gap-1 border-t border-line pt-1 min-h-0 shrink-0">
          {p.rol === "alumno" ? (
            <>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-cond text-[10px] sm:text-[11px] uppercase tracking-wide text-sand whitespace-nowrap">
                  {t("stat.guanteos")} <b className="text-gold">{p.guanteosRealizados}/{10}</b>
                </span>
                <div className="stat-bar w-full min-w-0" aria-label={t("roster.sparAria",{count:p.guanteosRealizados})}>
                  <i style={{ width: `${Math.min(100, (p.guanteosRealizados / 10) * 100)}%`, background: "var(--color-gold)" }} />
                </div>
              </div>
              {listoSabado && !p.enEspera && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}
                  aria-label={t("roster.applyAria",{name:p.nombre,price:fmt(200)})}
                  className="btn-poster guia-luminica ml-auto border border-[#ffe0a0]/50 bg-gold px-2 py-0.5 text-xs text-ink cursor-pointer shrink-0"
                >
                  <span>{t("sheet.apply",{price:fmt(200)})}</span>
                </button>
              )}
              {p.enEspera && (
                <button
                  type="button"
                  onClick={() => setBajaPendiente(p)}
                  className="ml-auto rounded-lg border border-line2 px-2 py-0.5 font-cond text-[10px] uppercase tracking-wide text-mut hover:border-blood/60 hover:text-blood cursor-pointer shrink-0"
                >
                  {t("waiting.remove")}
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
                  <Chip tone="blood">{t("roster.bill")}</Chip>
                ) : (
                  onBuscarRival && (
                    <Btn
                      small
                      variant="dark"
                      onClick={() => onBuscarRival(p.id)}
                    >
                      <I n="target" className="h-3 w-3" /> {t("roster.opponent")}
                    </Btn>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setBajaPendiente(p)}
                  className="rounded-lg border border-line2 px-2 py-0.5 font-cond text-[10px] uppercase tracking-wide text-mut hover:border-blood/60 hover:text-blood cursor-pointer"
                >
                  {t("transfer.action")}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.article>
    );
  };

  const cabeceraPlantel = (
      <div className="panel flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-1 shrink-0">
        <h2 className="font-display text-base sm:text-lg tracking-wide text-gold mr-1">{t("roster.title")}</h2>
        <Chip tone={alumnosEspera.length ? "blood" : "gold"}><I n="users" className="h-3 w-3" /> {t("roster.studentsCopy",{count:alumnos.length,capacity:cupoAlumnos})}{alumnosEspera.length ? ` · ${t("roster.waitingCount",{count:alumnosEspera.length})}` : ""}</Chip>
        <Chip tone="blood"><I n="glove" className="h-3 w-3" /> {t("roster.competitorsCopy",{amateur:amateurs,amateurCapacity:capacidadAmateurs(state),pro:profesionales,proCapacity:capacidadProfesionales(state)})}</Chip>
        <Chip tone="neon"><I n="users" className="h-3 w-3" /> {t("roster.recreation",{count:state.recreativos})}</Chip>
        {state.pendientes.length > 0 && <Chip><I n="bell" className="h-3 w-3" /> {t("roster.billCount",{count:state.pendientes.length})}</Chip>}
        <div className="ml-auto flex gap-1.5">
          <Btn small onClick={() => setArchivoAbierto(true)}>{t("roster.archive")}</Btn>
          <Btn
            small
            variant={state.veladaProgramada ? "gold" : "ghost"}
            onClick={() => dispatch({ type: "ALTERNAR_VELADA" })}
            disabled={!state.cursos.includes("veladas")}
          >
            <I n="ring" className="h-3.5 w-3.5" /> {t(state.veladaProgramada ? "roster.showReady" : "roster.scheduleShow")}
          </Btn>
        </div>
      </div>
  );
  return (
    <div className="roster-screen game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      {/* CABECERA COMPACTA DE PLANTEL */}
      {!compactoPlantel && cabeceraPlantel}
      {gestionAbierta && <Modal fit title={t("roster.dialog")} onClose={() => setGestionAbierta(false)}><div className="event-detail">
        <div className="space-y-2"><select className="r4-select" aria-label={t("roster.managementView")} value={vistaGestion} onChange={e=>setVistaGestion(e.target.value)}>
          <option value="cupos">{t("roster.managementCounts")}</option><option value="acciones">{t("roster.managementActions")}</option><option value="licencias">{t("roster.managementHelp")}</option>
        </select>{vistaGestion==="acciones" && <><Btn onClick={()=>setArchivoAbierto(true)}>{t("roster.archive")}</Btn><Btn disabled={!state.cursos.includes("veladas")} onClick={()=>dispatch({type:"ALTERNAR_VELADA"})}>{t(state.veladaProgramada ? "roster.showReady" : "roster.scheduleShow")}</Btn></>}</div>
        <TextoPaginado capacidad={plantelApaisado ? 20 : 40} texto={vistaGestion==="licencias" ? t("roster.licenceHelp") : t("roster.overview",{students:t("roster.studentsCopy",{count:alumnos.length,capacity:cupoAlumnos}),competitors:t("roster.competitorsCopy",{amateur:amateurs,amateurCapacity:capacidadAmateurs(state),pro:profesionales,proCapacity:capacidadProfesionales(state)}),waiting:t("roster.waitingCount",{count:alumnosEspera.length}),recreation:t("roster.recreation",{count:state.recreativos}),bill:t("roster.billCount",{count:state.pendientes.length})})} />
      </div></Modal>}

      {/* RECORRER GRUPOS */}
      {archivoAbierto && <ArchivoCarreras onClose={() => setArchivoAbierto(false)} />}
      {bajaPendiente && <Modal title={t(bajaPendiente.enEspera ? "waiting.removeTitle" : "transfer.title")} onClose={() => setBajaPendiente(null)} fit>
        <div className="r4-confirmation"><TextoPaginado capacidad={40} texto={t(bajaPendiente.enEspera ? "waiting.removeMessage" : "transfer.message", { name: bajaPendiente.nombre })} />
        <div className="flex flex-wrap gap-2"><Btn onClick={() => setBajaPendiente(null)}>{t("action.cancel")}</Btn><Btn variant="blood" onClick={() => { dispatch({ type: "RETIRAR_ATLETA", id: bajaPendiente.id }); setBajaPendiente(null); }}>{t(bajaPendiente.enEspera ? "waiting.remove" : "transfer.action")}</Btn></div></div>
      </Modal>}
      <div className="roster-filters flex items-center gap-2 border-b border-line pb-1 shrink-0">
        {compactoPlantel ? <select aria-label={`${t("roster.group")} · ${t("roster.sort")}`} value="actual" onChange={e => {
          const [tipo, valor] = e.target.value.split(":");
          if (tipo === "grupo") setFiltroGrupo(valor as typeof filtroGrupo);
          if (tipo === "orden") setOrden(valor as OrdenPlantel);
          if (tipo === "vista") setDetalleTarjeta(valor);
          if (tipo === "gestion") setGestionAbierta(true);
        }} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-panel px-2 text-sm text-sand">
          <option value="actual">{grupos.find(([id]) => id === filtroGrupo)?.[1]} · {ordenes.find(([id]) => id === orden)?.[1]} · {vistas.find(([id]) => id === detalleTarjeta)?.[1]}</option>
          <optgroup label={t("roster.group")}>{opciones(grupos, "grupo:")}</optgroup>
          <optgroup label={t("roster.sort")}>{opciones(ordenes, "orden:")}</optgroup>
          <optgroup label={t("roster.view")}>{opciones(vistas, "vista:")}</optgroup>
          <option value="gestion:abrir">{t("roster.management")}</option>
        </select> : <><select aria-label={t("roster.group")} value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value as typeof filtroGrupo)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-panel px-2 text-sm text-sand">
          {opciones(grupos)}
        </select>
        <select aria-label={t("roster.sort")} value={orden} onChange={e => setOrden(e.target.value as OrdenPlantel)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-panel px-2 text-sm text-sand">
          {opciones(ordenes)}
        </select>
        </>}
      </div>

      {/* La composición no depende de una altura que ella misma modifica. */}
      {!tieneLicenciaDT && !compactoPlantel && (
        <div className="border border-gold2/50 bg-gold/5 px-2.5 py-1 font-cond text-[11px] text-sand rounded-xl shrink-0">
          {t("roster.licenceHelp")}
        </div>
      )}

      {/* GRILLA PRINCIPAL DE ATLETAS (DISTRIBUCIÓN RIGUROSA DE 2 FILAS SIN SCROLL) */}
      <div ref={contenedorRef} className="roster-content flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {atletasVisibles.length > 0 ? (
          <div className="plantel-grid roster-cards flex-1 min-h-0 w-full overflow-hidden" style={estiloGrilla}>
            {atletasVisibles.map(renderTarjeta)}
          </div>
        ) : (
          <div className="panel p-2 text-center font-cond text-sm text-mut my-auto">
            <TextoPaginado capacidad={40} texto={filtroGrupo === "federados"
              ? t("roster.emptyCompetitors")
              : filtroGrupo === "espera"
              ? t("roster.emptyWaiting")
              : t("roster.emptyStudents")} />
          </div>
        )}

        {/* PAGINACIÓN COMPACTA INFERIOR */}
        {totalPaginas > 1 && (
          <div ref={paginacionRef} className="roster-pagination mt-1 flex items-center justify-center gap-2 font-cond text-xs text-mut shrink-0 pt-1 border-t border-line/40">
            <Btn
              small
              variant="dark"
              disabled={pagina === 0}
              onClick={() => setPagina(p => Math.max(0, p - 1))}
            >
              {t("action.previous")}
            </Btn>
            <span>{pagina + 1} / {totalPaginas}</span>
            <Btn
              small
              variant="gold"
              disabled={pagina >= totalPaginas - 1}
              onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
            >
              {t("action.next")}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MERCADO EN 4 CATEGORÍAS ====================
export function PanelMercado() {
  const { t, locale } = useMessages();
  const [equipoDetalle, setEquipoDetalle] = useState<GearId | null>(null);
  const [resumenMercadoAbierto, setResumenMercadoAbierto] = useState(false);
  const { state, dispatch } = useGame();
  const [cat, setCat] = useState<CategoriaMercado>("equipamiento");
  const [pagina, setPagina] = useState(0);
  const [nombreMarca, setNombreMarca] = useState("");
  const canvasAmplio = useResponsiveCapacity("(min-width: 1100px) and (min-height: 650px)");
  const canvasEstrecho = useResponsiveCapacity("(max-width: 639px), (max-height: 650px)");
  const mercadoApaisado = useResponsiveCapacity("(max-height: 450px)");
  const porPagina = canvasEstrecho ? 1 : canvasAmplio ? 8 : 4;
  const detalleMercado = canvasEstrecho || canvasAmplio;
  useEffect(() => setPagina(0), [cat, porPagina]);
  const recomendadoId = recomendarEquipo(cat, state.equipamiento, state.dinero);
  const items = Object.entries(EQUIPOS)
    .filter(([, v]) => v.cat === cat)
    .sort(([a], [b]) => (a === recomendadoId ? -1 : b === recomendadoId ? 1 : 0));
  const cabeceraMercado = <div className="market-header panel flex flex-wrap items-center gap-2 p-2.5">
    <h2 className="font-display text-xl tracking-wide text-gold">{t("market.title")}</h2>
    <span className="font-cond text-sm text-sand">{t("market.installed", { count: state.equipamiento.length, total: Object.keys(EQUIPOS).length })}</span>
  </div>;

  return (
    <div className="market-screen game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      {canvasEstrecho ? <Btn small variant="ghost" className="market-header" onClick={() => setResumenMercadoAbierto(true)}>{t("market.summary")}</Btn> : cabeceraMercado}
      {resumenMercadoAbierto && <Modal title={t("market.title")} onClose={() => setResumenMercadoAbierto(false)}>{cabeceraMercado}</Modal>}

      <div className="market-categories flex shrink-0 flex-wrap gap-2">
        {canvasEstrecho ? <select aria-label={t("market.category")} value={cat} onChange={e => { setCat(e.target.value as typeof cat); setPagina(0); }} className="r4-select">{CATEGORIAS.map(c => <option key={c.id} value={c.id}>{presentarCategoria(c.id, locale).nombre}</option>)}</select> : CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => { setCat(c.id); setPagina(0); }}
            className={`border px-3 py-1.5 font-cond text-sm uppercase tracking-wider transition-colors cursor-pointer ${
              cat === c.id ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel text-sand hover:border-line2"
            }`}
          >
            <span className="inline-flex items-center gap-1.5"><I n={c.icono} className="h-4 w-4" /> {presentarCategoria(c.id, locale).nombre}</span>
          </button>
        ))}
      </div>

      <div style={canvasEstrecho ? {gridTemplateColumns:"minmax(0,1fr)"} : undefined} className={`market-items-grid grid min-h-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 ${canvasAmplio && items.length >= 8 ? "market-items-grid-expanded" : ""}`}>
        {items.slice(pagina * porPagina, pagina * porPagina + porPagina).map(([id]) => {
          const eq = presentarEquipo(id as GearId, locale);
          const comprado = state.equipamiento.includes(id as never);
          const bloqueado = id === "zonaElite" && !state.cursos.includes("altoRendimiento");
          return (
            <div key={id} data-equipment-id={id} title={`${eq.nombre}: ${eq.desc} ${eq.efecto}`} className={`market-card panel flex min-h-[132px] flex-col p-2 ${comprado ? "border-win/50" : ""}`}>
              <div className="flex min-h-[42px] flex-wrap items-start justify-between gap-1">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold2/50 bg-gold/10 text-gold shadow-inner"><I n={eq.icono} className="h-4 w-4" /></div>
                  <div>
                    <div className="font-display text-sm leading-tight tracking-wide text-cream">{eq.nombre}</div>
                    <div className="font-display text-sm text-gold">{fmt(eq.costo)}</div>
                  </div>
                </div>
                {comprado && <Chip tone="win"><I n="check" className="h-3 w-3" /> {t("market.installedLabel")}</Chip>}
                {!comprado && id === recomendadoId && <Chip tone="neon">{t("market.recommended")}</Chip>}
              </div>
              {!detalleMercado && <><p className="mt-1 font-cond text-sm text-sand">{eq.desc}</p><p className="mt-1 font-cond text-sm text-neonc">{eq.efecto}</p></>}
              {(detalleMercado || (id === "estudioMarca" && comprado)) && <Btn className="mt-auto" onClick={() => setEquipoDetalle(id as GearId)}>{t("action.detail")}</Btn>}
              {!comprado && !canvasEstrecho && (
                <Btn
                  small
                  variant={state.dinero >= eq.costo && !bloqueado ? "gold" : "dark"}
                  className={detalleMercado ? "mt-2 w-full" : "mt-auto w-full"}
                  disabled={state.dinero < eq.costo || bloqueado}
                  onClick={() => dispatch({ type: "COMPRAR_EQUIPO", id: id as never })}
                >
                  {bloqueado ? t("market.highPerformance") : t("action.buy", { price: fmt(eq.costo) })}
                </Btn>
              )}
            </div>
          );
        })}
      </div>
      {items.length > porPagina && (
        <div className="market-pagination flex items-center justify-center gap-2 font-cond text-xs text-mut">
          <Btn small variant="dark" disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))}>{t("action.previous")}</Btn>
          <span>{pagina + 1} / {Math.ceil(items.length / porPagina)}</span>
          <Btn small variant="gold" disabled={(pagina + 1) * porPagina >= items.length} onClick={() => setPagina(p => p + 1)}>{t("action.next")}</Btn>
        </div>
      )}
      {equipoDetalle && <Modal fit title={presentarEquipo(equipoDetalle, locale).nombre} onClose={() => setEquipoDetalle(null)}>
        <div className="bounded-detail"><div>
        <p className="my-2">{fmt(EQUIPOS[equipoDetalle].costo)}</p>
        {state.equipamiento.includes(equipoDetalle) ? <p>{t("market.installedLabel")}</p> : <Btn disabled={state.dinero < EQUIPOS[equipoDetalle].costo || (equipoDetalle === "zonaElite" && !state.cursos.includes("altoRendimiento"))} onClick={() => dispatch({ type: "COMPRAR_EQUIPO", id: equipoDetalle })}>{equipoDetalle === "zonaElite" && !state.cursos.includes("altoRendimiento") ? t("market.highPerformance") : t("action.buy", { price: fmt(EQUIPOS[equipoDetalle].costo) })}</Btn>}
        {equipoDetalle === "estudioMarca" && state.equipamiento.includes(equipoDetalle) && !state.marcaRopa && <div className="mt-2 flex flex-wrap gap-2"><input className="r4-select" value={nombreMarca} onChange={e => setNombreMarca(e.target.value)} maxLength={16} aria-label={t("market.brandName")} placeholder={t("market.brandName")} /><Btn onClick={() => dispatch({ type: "CREAR_MARCA", nombre: nombreMarca })}>{t("market.launch")}</Btn></div>}
        </div><TextoPaginado capacidad={mercadoApaisado ? 20 : 40} texto={[presentarEquipo(equipoDetalle, locale).desc, presentarEquipo(equipoDetalle, locale).efecto, equipoDetalle === "estudioMarca" && state.marcaRopa ? t("market.brand", { name: state.marcaRopa }) : ""].filter(Boolean).join("\n")} /></div>
      </Modal>}
    </div>
  );
}

// ==================== MI PERFIL: CURSOS, PROPIEDADES, LEGADO ====================
export function PanelPerfil() {
  const { t, locale } = useMessages();
  const [propiedadActiva, setPropiedadActiva] = useState<PropiedadId>("local");
  const [actividadActiva, setActividadActiva] = useState<TipoComunitario>("bingo");
  const [vistaResumen, setVistaResumen] = useState("identidad");
  const perfilApaisado = useResponsiveCapacity("(max-height: 450px)");
  const { state, dispatch } = useGame();
  const [seccionPerfil, setSeccionPerfil] = useState<"cursos" | "bienes">("cursos");
  const [ramaActiva, setRamaActiva] = useState<RamaCurso>("deportiva");
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 800px)");
  const variosCursos = useResponsiveCapacity("(min-width: 900px) and (min-height: 650px)");
  const cursoUnico = compacto && !variosCursos;
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [paginaCursos, setPaginaCursos] = useState(0);
  const [cursoDetalle, setCursoDetalle] = useState<CursoId | null>(null);
  useEffect(() => setPaginaCursos(0), [ramaActiva]);
  const cursosDeRama = (Object.keys(CURSOS) as CursoId[]).filter(c => CURSOS[c].rama === ramaActiva).sort((x, y) => CURSOS[x].nivel - CURSOS[y].nivel);
  const [socialAbierto, setSocialAbierto] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [confirmarLegado, setConfirmarLegado] = useState(false);
  const ramas: { id: RamaCurso; nombre: string; icono: string; color: string }[] = [
    { id: "deportiva", nombre: t("profile.branch.sports"), icono: "glove", color: "text-blood" },
    { id: "promotora", nombre: t("profile.branch.promoter"), icono: "ring", color: "text-gold" },
    { id: "empresarial", nombre: t("profile.branch.business"), icono: "store", color: "text-neonc" },
  ];
  const compraCurso = (cid: CursoId) => {
    const c = CURSOS[cid], reqOk = !c.req || state.cursos.includes(c.req);
    return state.cursos.includes(cid) ? <p>{t("course.approved")}</p> : <Btn small variant={reqOk && state.dinero >= c.costo ? "gold" : "dark"} disabled={!reqOk || state.dinero < c.costo} onClick={() => dispatch({ type: "COMPRAR_CURSO", id: cid })}>{reqOk ? t("action.buy", { price: fmt(c.costo) }) : t("course.requiredLevel", { level: c.nivel - 1 })}</Btn>;
  };
  const puedeLegado = legadoDisponible(state);
  const textoResumen = vistaResumen === "identidad"
    ? t("profile.identityCopy", { coach: state.nombreJugador, club: state.nombreGimnasio, week: state.semana, level: nivelGimnasio(state), legacies: state.legados })
    : vistaResumen === "estadisticas"
      ? t("profile.statsCopy", { fights: state.stats.peleas, wins: state.stats.victorias, kos: state.stats.kos, shows: state.stats.veladas, titles: state.stats.titulos, net: fmt(state.stats.resultadoNeto) })
      : [t("legacy.requirement"), state.dinero <= -1500 ? t("closure.available") : ""].filter(Boolean).join("\n");
  const resumenPerfil = (
    <div className="profile-summary bounded-detail panel p-2.5">
      <div className="flex min-w-0 flex-col gap-2">
        <select className="r4-select" aria-label={t("profile.sectionDetail")} value={vistaResumen} onChange={e => setVistaResumen(e.target.value)}>
          <option value="identidad">{t("profile.identity")}</option>
          <option value="estadisticas">{t("profile.statistics")}</option>
          <option value="decisiones">{t("profile.decisions")}</option>
        </select>
        <Btn variant={puedeLegado ? "gold" : "dark"} disabled={!puedeLegado} onClick={() => setConfirmarLegado(true)}><I n="medal" className="h-4 w-4" />{t("legacy.system")}</Btn>
        {state.dinero <= -1500 && <Btn variant="blood" onClick={() => setConfirmarCierre(true)}>{t("closure.open")}</Btn>}
      </div>
      <TextoPaginado capacidad={perfilApaisado ? 20 : 40} texto={textoResumen} />
    </div>
  );
  return (
    <div className="profile-screen game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
      {!compacto && resumenPerfil}
      {resumenAbierto && <Modal fit title={t("profile.title")} icon="user" onClose={() => setResumenAbierto(false)}>{resumenPerfil}</Modal>}
      <div className="profile-subnav flex flex-wrap items-center justify-center gap-2">
        {compacto ? <select aria-label={t("profile.section")} value={seccionPerfil} onChange={e => {
          e.currentTarget.focus();
          if (e.target.value === "resumen") setResumenAbierto(true);
          else if (e.target.value === "actividades") setSocialAbierto(true);
          else setSeccionPerfil(e.target.value as "cursos" | "bienes");
        }} className="r4-select min-w-0"><option value="cursos">{t("profile.courses")}</option><option value="bienes">{t("profile.properties")}</option><option value="resumen">{t("profile.details")}</option><option value="actividades">{t("profile.activities")}</option></select> : (
        <div className="flex w-fit justify-center gap-2 rounded-xl border border-line bg-panel2 p-1">
          <button onClick={() => setSeccionPerfil("cursos")} className={`w-fit rounded-lg px-4 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "cursos" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>{t("profile.courses")}</button>
          <button onClick={() => setSeccionPerfil("bienes")} className={`w-fit rounded-lg px-4 py-1.5 font-cond text-sm uppercase tracking-wide cursor-pointer ${seccionPerfil === "bienes" ? "bg-gold text-ink" : "text-sand hover:text-cream"}`}>{t("profile.properties")}</button>
        </div>)}
        {!compacto && <Btn small variant="ghost" onClick={() => setSocialAbierto(true)}><I n="calendar" className="h-3.5 w-3.5" /> {t("profile.activities")}</Btn>}
      </div>

      {/* CURSOS */}
      {seccionPerfil === "cursos" && <section className="profile-courses flex min-h-0 w-full flex-1 flex-col">
        {!compacto && <h3 className="mb-2 text-center font-display text-lg tracking-wide text-cream">{t("course.choose")}</h3>}
        <div className="profile-branches mb-2 flex shrink-0 flex-wrap justify-center gap-1.5">
          {compacto ? <select aria-label={t("profile.branch")} value={ramaActiva} onChange={e => setRamaActiva(e.target.value as RamaCurso)} className="r4-select">{ramas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select> : ramas.map(rama => <button key={rama.id} onClick={() => setRamaActiva(rama.id)} className={`profile-branch-tab inline-flex min-h-8 w-fit items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 font-cond text-xs uppercase tracking-wide ${ramaActiva === rama.id ? `border-gold bg-gold/15 ${rama.color}` : "border-line bg-panel2 text-mut"}`}><I n={rama.icono} className="h-3.5 w-3.5 shrink-0" />{rama.nombre}</button>)}
        </div>
        <div className="profile-branch-panel grid min-h-0 flex-1 gap-2">
          {ramas.filter(rama => rama.id === ramaActiva).map(rama => (
            <div key={rama.id} className="profile-branch-card panel flex min-h-0 w-full flex-col p-2">
              <div className={`profile-course-grid grid ${cursoUnico ? "grid-cols-1" : "grid-cols-3"} gap-2`}>
                {cursosDeRama.slice(cursoUnico ? paginaCursos : 0, cursoUnico ? paginaCursos + 1 : cursosDeRama.length)
                  .map(cid => {
                    const c = CURSOS[cid];
                    const aprobado = state.cursos.includes(cid);
                    return (
                      <div key={cid} className={`profile-course-card flex min-w-0 flex-col justify-between gap-1.5 rounded-lg border p-2 ${aprobado ? "border-win/50 bg-win/5" : "border-line bg-panel2"}`}>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-display text-sm leading-tight tracking-wide text-cream">
                              <span className="mr-1 text-mut">{t("course.level", { level: c.nivel })}</span>{presentarCurso(cid, locale).nombre}
                            </div>
                          {aprobado ? (
                              <Chip tone="win"><I n="check" className="h-3 w-3" /> {t("course.approved")}</Chip>
                            ) : <span className="shrink-0 font-cond text-xs text-gold">{fmt(c.costo)}</span>}
                          </div>
                          {!compacto && <p title={presentarCurso(cid, locale).desc} className="profile-course-description mt-1 font-cond text-xs leading-snug text-sand">{presentarCurso(cid, locale).desc}</p>}
                        </div>
                        {compacto ? <Btn small onClick={() => setCursoDetalle(cid)}>{t("course.open")}</Btn> : !aprobado && compraCurso(cid)}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        {cursoUnico && <div className="profile-pagination flex shrink-0 items-center justify-center gap-2 py-1"><Btn small variant="ghost" disabled={paginaCursos === 0} onClick={() => setPaginaCursos(p => p - 1)}>{t("action.previous")}</Btn><span className="text-xs text-sand">{paginaCursos + 1}/{cursosDeRama.length}</span><Btn small variant="ghost" disabled={paginaCursos + 1 >= cursosDeRama.length} onClick={() => setPaginaCursos(p => p + 1)}>{t("action.next")}</Btn></div>}
      </section>}

      {cursoDetalle && <Modal fit title={presentarCurso(cursoDetalle, locale).nombre} onClose={() => setCursoDetalle(null)}>
        <TextoPaginado texto={presentarCurso(cursoDetalle, locale).desc} capacidad={40} />
        <p className="my-2 text-gold">{fmt(CURSOS[cursoDetalle].costo)}</p>
        {compraCurso(cursoDetalle)}
      </Modal>}

      {socialAbierto && (
        <Modal fit title={t("profile.activities")} icon="calendar" onClose={() => setSocialAbierto(false)}><div className="bounded-detail">
          <div className="flex min-w-0 flex-col gap-2">
          <select className="r4-select" aria-label={t("social.choose")} value={actividadActiva} onChange={e => setActividadActiva(e.target.value as TipoComunitario)}>{(Object.keys(COMUNITARIOS) as TipoComunitario[]).map(id => <option key={id} value={id}>{presentarActividad(id, locale).emoji} {presentarActividad(id, locale).nombre}</option>)}</select>
          <Btn className="mt-2" disabled={state.comunitarios.length > 0 || state.dinero < COMUNITARIOS[actividadActiva].inversion || state.dia >= 6} onClick={() => dispatch({ type: "PROGRAMAR_SOCIAL", actividad: actividadActiva })}>{t(state.comunitarios.some(x => x.tipo === actividadActiva) ? "social.scheduled" : "social.schedule")}</Btn>
          </div><TextoPaginado capacidad={perfilApaisado ? 20 : 40} texto={[t("social.help"), t("social.price", { cost: fmt(COMUNITARIOS[actividadActiva].inversion), min: fmt(COMUNITARIOS[actividadActiva].min), max: fmt(COMUNITARIOS[actividadActiva].max) }), t("social.extra", { effect: presentarActividad(actividadActiva, locale).extra }), t("social.risk")].join("\n")} />
        </div></Modal>
      )}

      {/* PROPIEDADES */}
      {seccionPerfil === "bienes" && <section className="profile-properties flex min-h-0 flex-1 flex-col">
        {!compacto && <h3 className="mb-2 text-center font-display text-lg tracking-wide text-cream">{t("property.title")}</h3>}
        {compacto ? <><select aria-label={t("property.choose")} className="r4-select profile-property-picker" value={propiedadActiva} onChange={e => setPropiedadActiva(e.target.value as PropiedadId)}>{(Object.keys(PROPIEDADES) as PropiedadId[]).map(id => <option key={id} value={id}>{presentarPropiedad(id, locale).nombre}</option>)}</select>
          <div className="profile-property-detail panel min-h-0 flex-1 p-2"><TextoPaginado capacidad={perfilApaisado ? 20 : 40} texto={[presentarPropiedad(propiedadActiva, locale).nombre, t(state.propiedades.includes(propiedadActiva) ? "property.deeded" : "property.notOwned"), fmt(PROPIEDADES[propiedadActiva].costo), presentarPropiedad(propiedadActiva, locale).desc, presentarPropiedad(propiedadActiva, locale).beneficio, t("property.access")].join("\n")} /></div>
        </> : <div className="profile-property-grid grid min-h-0 flex-1 content-center gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(["local", "terreno", "sucursal", "apartamento", "mansion", "arena"] as const).map(pid => {
            const p = presentarPropiedad(pid, locale);
            const adquirida = state.propiedades.includes(pid);
            return (
              <div key={pid} title={`${p.desc}${p.beneficio ? ` ${p.beneficio}` : ""}`} className={`profile-property-card panel flex min-w-0 flex-col p-2.5 ${adquirida ? "border-win/50" : "opacity-60"}`}>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <I n={p.icono} className="h-4 w-4 text-gold" />
                  <span className="min-w-0 flex-1 font-display text-base tracking-wide text-cream">{p.nombre}</span>
                  {adquirida ? <span className="ml-auto"><Chip tone="win">{t("property.deeded")}</Chip></span> : <span className="ml-auto font-cond text-xs text-mut">{fmt(p.costo)}</span>}
                </div>
                {p.beneficio && <p className="pt-1 font-cond text-[11px] leading-snug text-neonc">{p.beneficio}</p>}
              </div>
            );
          })}
        </div>}
      </section>}

      {confirmarCierre && (
        <Modal fit title={t("closure.title")} icon="fire" onClose={() => setConfirmarCierre(false)}>
          <div className="bounded-detail">
            <div className="flex min-w-0 flex-col gap-2">
              <Btn variant="dark" onClick={() => setConfirmarCierre(false)}>{t("closure.keep")}</Btn>
              <Btn small variant="blood" onClick={() => {
                dispatch({ type: "CERRAR_CLUB", confirmado: true });
                setConfirmarCierre(false);
              }}>{t("closure.confirm")}</Btn>
            </div>
            <TextoPaginado capacidad={perfilApaisado ? 20 : 40} texto={t("closure.copy", { club: `${state.nombreGimnasio} II` })} />
          </div>
        </Modal>
      )}
      {confirmarLegado && <Modal title={t("legacy.title")} onClose={() => setConfirmarLegado(false)} fit>
        <div className="bounded-detail"><div className="flex min-w-0 flex-col gap-2"><Btn onClick={() => setConfirmarLegado(false)}>{t("action.cancel")}</Btn><Btn variant="gold" onClick={() => { dispatch({ type: "LEGADO" }); setConfirmarLegado(false); }}>{t("legacy.start")}</Btn></div>
        <TextoPaginado capacidad={perfilApaisado ? 20 : 40} texto={t("legacy.detail", { club: `${state.nombreGimnasio} II` })} /></div>
      </Modal>}
    </div>
  );
}

// ==================== PERSONAL TÉCNICO ====================
export function PanelPersonal() {
  const { t: mensaje, locale } = useMessages();
  const { state, dispatch } = useGame();
  const tipos = Object.keys(PERSONAL_INFO) as PersonalId[];
  const [pagina, setPagina] = useState(0);
  const [contratacionPendiente, setContratacionPendiente] = useState<PersonalId | null>(null);
  const [nominaAbierta, setNominaAbierta] = useState(false);
  const [detallePuesto, setDetallePuesto] = useState<PersonalId | null>(null);
  const [vistaPuesto, setVistaPuesto] = useState("funcion");
  const [empleadoId, setEmpleadoId] = useState("");
  const apaisado = useResponsiveCapacity("(max-height: 450px)");
  const capacidadEscritorio = useResponsiveCapacity("(min-width: 1100px) and (min-height: 650px)");
  const capacidadMedia = useResponsiveCapacity("(min-width: 640px) and (min-height: 451px)");
  const canvasEstrecho = useResponsiveCapacity("(max-width: 639px), (max-height: 650px)");
  const porPagina = capacidadEscritorio ? 8 : capacidadMedia ? 2 : 1;
  useEffect(() => setPagina(p => Math.min(p, Math.max(0, Math.ceil(tipos.length / porPagina) - 1))), [porPagina, tipos.length]);
  const flujoActual = proyeccionSemanalRecurrente(state).total;
  const saldoTexto = (amount: number) => mensaje(amount < 0 ? "staff.negative" : "staff.positive", { price: fmt(Math.abs(amount)) });
  const resumen = [mensaje("staff.hired", { count: state.personal.length }), mensaje("staff.payrollAmount", { price: fmt(state.personal.reduce((ac, p) => ac + PERSONAL_INFO[p.tipo].sueldo, 0)) }), mensaje("staff.flow", { amount: saldoTexto(flujoActual) }), mensaje("staff.excludes")].join("\n");
  const prevision = (tipo: PersonalId) => proyeccionSemanalRecurrente({ ...state, personal: [...state.personal, { id: "prevision-nomina", tipo, nombre: "Previsión" }] }).total;
  const contratar = (tipo: PersonalId) => {
    if (!puedeContratarPersonal(state, tipo).ok) return;
    if (prevision(tipo) < 0) setContratacionPendiente(tipo);
    else dispatch({ type: "CONTRATAR", tipo });
  };
  const disponibilidadTexto = (t: PersonalId) => {
    const disponibilidad = puedeContratarPersonal(state, t);
    return disponibilidad.mensaje ? disponibilidadPersonal(state, t, locale) : mensaje("staff.available");
  };
  const contratos = state.personal.filter(p => p.tipo === detallePuesto);
  const empleado = contratos.find(p => p.id === empleadoId) ?? contratos[0];
  return <div className="staff-screen game-screen flex h-full min-h-0 flex-col overflow-hidden space-y-2">
    {canvasEstrecho ? <Btn small variant="ghost" onClick={() => setNominaAbierta(true)}>{mensaje("staff.summary")}</Btn> :
      <div className="staff-header panel flex shrink-0 flex-wrap items-center gap-3 p-3">
        <h2 className="font-display text-2xl tracking-wide text-gold">{mensaje("staff.title")}</h2>
        <span className="font-cond text-sm text-sand">{mensaje("staff.hired", { count: state.personal.length })}</span>
        <Btn small onClick={() => setNominaAbierta(true)}>{mensaje("staff.payroll")}</Btn>
      </div>}
    {nominaAbierta && <Modal fit title={mensaje("staff.payroll")} onClose={() => setNominaAbierta(false)}><TextoPaginado texto={resumen} capacidad={40} /></Modal>}
    <div style={porPagina>4 ? {gridTemplateColumns:"repeat(4,minmax(0,1fr))",gridTemplateRows:"repeat(2,minmax(0,1fr))"} : undefined} className="staff-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {tipos.slice(pagina * porPagina, pagina * porPagina + porPagina).map(tipo => {
        const info = presentarPersonal(tipo, locale);
        const contratados = state.personal.filter(p => p.tipo === tipo);
        const disponibilidad = puedeContratarPersonal(state, tipo);
        return <div key={tipo} data-staff-type={tipo} className="staff-card panel flex min-h-[218px] flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><div className="font-display text-lg tracking-wide text-cream">{info.nombre}</div><div className="font-cond text-sm text-gold">{mensaje("staff.cost", { price: fmt(info.sueldo) })}</div></div>
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-line bg-ink text-sand"><I n={info.icono} className="h-4 w-4" /></div>
          </div>
          {!canvasEstrecho && porPagina<=4 && <p className="staff-desc font-cond text-sm text-sand">{info.desc}</p>}
          {contratados.length > 0 && <p className="text-sm text-win">{mensaje("staff.hiredLabel")} · {contratados.length}</p>}
          <Btn className="mt-auto" onClick={() => { setDetallePuesto(tipo); setVistaPuesto("funcion"); }}>{mensaje("action.detail")}</Btn>
          {!canvasEstrecho && disponibilidad.ok && <Btn variant="gold" onClick={() => contratar(tipo)}><I n="case" />{mensaje("staff.hire")}</Btn>}
          {!canvasEstrecho && !disponibilidad.ok && contratados.length === 0 && <Btn disabled>{mensaje("staff.unavailable")}</Btn>}
        </div>;
      })}
    </div>
    {tipos.length > porPagina && <div className="staff-pagination flex items-center justify-center gap-2 font-cond text-xs text-mut">
      <Btn small variant="dark" disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))}>{mensaje("action.previous")}</Btn>
      <span>{pagina + 1} / {Math.ceil(tipos.length / porPagina)}</span>
      <Btn small variant="gold" disabled={(pagina + 1) * porPagina >= tipos.length} onClick={() => setPagina(p => p + 1)}>{mensaje("action.next")}</Btn>
    </div>}
    {detallePuesto && <Modal fit title={presentarPersonal(detallePuesto, locale).nombre} onClose={() => setDetallePuesto(null)}>
      <div className="bounded-detail"><div className="bounded-controls space-y-2">
      <select className="r4-select" aria-label={mensaje("staff.detailView")} value={vistaPuesto} onChange={e => setVistaPuesto(e.target.value)}><option value="funcion">{mensaje("staff.benefits")}</option><option value="contratos">{mensaje("staff.contracts")}</option><option value="disponibilidad">{mensaje("staff.availability")}</option></select>
      {vistaPuesto === "contratos" && empleado && <>
        <select className="r4-select" aria-label={mensaje("staff.employee")} value={empleado.id} onChange={e => setEmpleadoId(e.target.value)}>{contratos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
        <Btn variant="blood" onClick={() => dispatch({ type: "DESPEDIR", id: empleado.id })}>{mensaje("staff.fire")}</Btn>
      </>}
      {vistaPuesto === "funcion" && <Btn className="mt-2" disabled={!puedeContratarPersonal(state, detallePuesto).ok} onClick={() => contratar(detallePuesto)}>{mensaje(puedeContratarPersonal(state, detallePuesto).ok ? "staff.hire" : "staff.unavailable")}</Btn>}
      </div><div className="bounded-copy">
      <TextoPaginado capacidad={apaisado ? 20 : 40} texto={vistaPuesto === "funcion" ? presentarPersonal(detallePuesto, locale).desc + "\n" + mensaje("staff.cost", { price: fmt(PERSONAL_INFO[detallePuesto].sueldo) }) : vistaPuesto === "disponibilidad" ? disponibilidadTexto(detallePuesto) : empleado ? empleado.nombre + "\n" + mensaje("staff.cost", { price: fmt(PERSONAL_INFO[detallePuesto].sueldo) }) : mensaje("staff.noEmployees")} />
      </div></div>
    </Modal>}
    {tipos.map(t => {
      const disponibilidad = puedeContratarPersonal(state, t);
      return contratacionPendiente === t && disponibilidad.ok && <Modal key={t} fit title={mensaje("staff.review")} onClose={() => setContratacionPendiente(null)}>
        <TextoPaginado capacidad={apaisado ? 20 : 40} texto={mensaje("staff.after", { amount: saldoTexto(prevision(t)) }) + "\n" + mensaje("staff.warning")} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Btn variant="blood" disabled={!disponibilidad.ok} onClick={() => {
            if (!puedeContratarPersonal(state, t).ok) return;
            dispatch({ type: "CONTRATAR", tipo: t, confirmado: true });
            setContratacionPendiente(null);
          }}>{mensaje("staff.hireAnyway")}</Btn>
          <Btn onClick={() => setContratacionPendiente(null)}>{mensaje("action.cancel")}</Btn>
        </div>
      </Modal>;
    })}

  </div>;
}

// ==================== AJUSTES: PARTIDAS Y ATAJOS ====================
function leerPreferencia(clave: string): boolean {
  try { return localStorage.getItem(clave) === "1"; } catch { return false; }
}
export function ModalAjustes({ onCerrar, atajos, onCambiarAtajos }: { onCerrar: () => void; atajos: Atajos; onCambiarAtajos: (atajos: Atajos) => void }) {
  const { state, dispatch } = useGame();
  const { t } = useMessages();
  const etiquetasAtajos = { gimnasio: t("nav.gym"), ciudad: t("nav.city"), plantel: t("nav.roster"), mercado: t("nav.market"), perfil: t("nav.profile"), personal: t("nav.staff"), calendario: t("nav.calendar"), avanzar: t("action.advance"), semanaRapida: t("action.quickWeek"), cerrar: t("action.closeWindows") };
  const [seccion, setSeccion] = useState("partida");
  const [paginaAtajos, setPaginaAtajos] = useState(0);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const compacto = useResponsiveCapacity("(max-width: 639px), (max-height: 650px)");
  const cantidadAtajos = compacto ? 1 : 3;
  const totalPaginasAtajos = Math.ceil(ATAJOS_LABELS.length / cantidadAtajos);
  const [sonido, setSonido] = useState(audioHabilitado);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [nombrePartida, setNombrePartida] = useState(state.nombrePartida || state.nombreGimnasio || t("settings.defaultName"));
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
      setMensaje(t("settings.preferenceError"));
    }
  }, [textoGrande, altoContraste, movimientoReducido]);

  const guardarAhora = () => {
    const nombre = nombrePartida.trim() || t("settings.defaultName");
    dispatch({ type: "RENOMBRAR_PARTIDA", nombre });
    const guardada = guardarEnRanura({ ...state, nombrePartida: nombre }, nombre);
    if (guardada) {
      setMensaje(t("settings.saved"));
      dispatch({ type: "TOAST", ...contenidoMensaje("toast.saved"), tono: "ok" });
    } else {
      setMensaje(t("settings.saveError"));
    }
  };

  return (
    <Modal title={t("settings.title")} icon="gear" onClose={onCerrar} fit wide className="settings-dialog">
      <div className="settings-screen space-y-2 text-sm">
        <select aria-label={t("settings.section")} value={seccion} onChange={e => setSeccion(e.target.value)} className="r4-select">
          <option value="partida">{t("settings.save")}</option><option value="idioma">{t("language.label")}</option><option value="lectura">{t("settings.reading")}</option><option value="sonido">{t("settings.sound")}</option><option value="atajos">{t("settings.shortcuts")}</option><option value="atajos-ayuda">{t("settings.shortcuts")} · {t("intro.help")}</option><option value="atajos-guardar">{t("settings.shortcutSave")} / {t("settings.shortcutRestore")}</option><option value="riesgo">{t("settings.reset")}</option>
        </select>
        {seccion === "idioma" && <LanguagePicker/>}
        {seccion === "partida" && <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <p className="font-cond text-xs text-sand">{t("settings.saveHelp")}</p>
          <input value={nombrePartida} onChange={e => setNombrePartida(e.target.value)} maxLength={32} aria-label={t("settings.saveName")}
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-2 py-1.5 font-cond text-sm text-cream outline-none focus:border-gold" placeholder={t("settings.saveName")} />
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn small variant="gold" onClick={guardarAhora}><I n="check" className="h-3.5 w-3.5" /> {t("settings.saveNow")}</Btn>
          </div>
          {mensaje && <div className="mt-2 rounded-lg border border-gold2/40 bg-gold/10 px-2.5 py-1.5 font-cond text-xs text-gold">{mensaje}</div>}
        </div>}

        {seccion === "lectura" && <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <p className="font-cond text-xs text-sand">{t("settings.readingHelp")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Btn small variant={textoGrande ? "gold" : "dark"} onClick={() => setTextoGrande(v => !v)}>
              {textoGrande ? "✓ " : ""}{t("settings.largeText")}
            </Btn>
            <Btn small variant={altoContraste ? "gold" : "dark"} onClick={() => setAltoContraste(v => !v)}>
              {altoContraste ? "✓ " : ""}{t("settings.contrast")}
            </Btn>
            <Btn small variant={movimientoReducido ? "gold" : "dark"} onClick={() => setMovimientoReducido(v => !v)}>
              {movimientoReducido ? "✓ " : ""}{t("settings.motion")}
            </Btn>
          </div>
        </div>}
        {seccion === "sonido" && <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-cond text-xs text-sand">{t("settings.soundHelp")}</span>
            <Btn small variant={sonido ? "gold" : "dark"} onClick={() => {
              const siguiente = !sonido;
              setSonido(siguiente);
              setAudioHabilitado(siguiente);
            }}>
              <I n={sonido ? "volume" : "x"} className="h-3.5 w-3.5" /> {sonido ? t("settings.soundOn") : t("settings.soundOff")}
            </Btn>
          </div>
        </div>}

        {seccion === "riesgo" && <div className="border border-blood/40 bg-blood/5 p-2.5 rounded-xl">
          <p className="font-cond text-xs text-sand">{t("settings.resetHelp")}</p>
          <Btn
            small
            variant="blood"
            className="mt-2"
            onClick={() => setConfirmarReinicio(true)}
          >
            <I n="x" className="h-3.5 w-3.5" /> {t("settings.reset")}
          </Btn>
        </div>}

        {seccion === "atajos-ayuda" && <TextoPaginado capacidad={40} texto={t("settings.shortcutHelp")}/>}
        {seccion === "atajos" && <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {ATAJOS_LABELS.slice(Math.min(paginaAtajos, totalPaginasAtajos - 1) * cantidadAtajos, (Math.min(paginaAtajos, totalPaginasAtajos - 1) + 1) * cantidadAtajos).map(([id]) => (
              <label key={id} className="grid gap-1 font-cond text-sm uppercase tracking-wide text-mut">
                {etiquetasAtajos[id]}
                <input
                  value={atajosEditados[id] === " " ? t("key.space") : atajosEditados[id]}
                  onChange={e => setAtajosEditados(prev => ({ ...prev, [id]: e.target.value === t("key.space") ? " " : e.target.value }))}
                  onBlur={() => setAtajosEditados(prev => ({ ...prev, [id]: normalizarTecla(prev[id], ATAJOS_DEFAULT[id]) }))}
                  maxLength={10}
                  className="min-h-11 w-full rounded-lg border border-line bg-panel px-2 py-1.5 font-mono-data text-sm uppercase text-cream outline-none focus:border-gold"
                  aria-label={t("settings.shortcutLabel", { action: etiquetasAtajos[id] })}
                />
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Btn small disabled={paginaAtajos === 0} onClick={() => setPaginaAtajos(v => Math.max(0, v - 1))}>{t("action.previous")}</Btn>
            <span className="text-xs">{Math.min(paginaAtajos, totalPaginasAtajos - 1) + 1}/{totalPaginasAtajos}</span>
            <Btn small disabled={paginaAtajos >= totalPaginasAtajos - 1} onClick={() => setPaginaAtajos(v => Math.min(totalPaginasAtajos - 1, v + 1))}>{t("action.next")}</Btn>
          </div>
        </div>}
        {seccion === "atajos-guardar" && <div className="border border-line bg-panel2 p-2.5 rounded-xl">
          <div className="flex flex-wrap gap-2">
            <Btn small variant="gold" disabled={conflictos.length > 0} onClick={() => { onCambiarAtajos(atajosEditados); setMensaje(t("settings.shortcutSaved")); }}>
              {t("settings.shortcutSave")}
            </Btn>
            <Btn small variant="dark" onClick={() => { setAtajosEditados({ ...ATAJOS_DEFAULT }); onCambiarAtajos({ ...ATAJOS_DEFAULT }); setMensaje(t("settings.shortcutRestored")); }}>
              {t("settings.shortcutRestore")}
            </Btn>
          </div>
          {conflictos.length > 0 && <div className="mt-2 rounded-lg border border-blood/50 bg-blood/10 px-2.5 py-1.5 font-cond text-xs text-[#ff8a7e]">
            {t("settings.shortcutConflict")}
          </div>}
          {!compacto && <div className="mt-2 grid gap-1.5 font-cond text-xs text-sand sm:grid-cols-2">
            <span><kbd className="keycap">{atajos.gimnasio}</kbd> {t("nav.gym")} · <kbd className="keycap">{atajos.ciudad}</kbd> {t("nav.city")} · <kbd className="keycap">{atajos.plantel}</kbd> {t("nav.roster")}</span>
            <span><kbd className="keycap">{atajos.avanzar === " " ? t("key.space") : atajos.avanzar}</kbd> {t("top.advance")} · <kbd className="keycap">{atajos.semanaRapida}</kbd> {t("top.fast")} · <kbd className="keycap">{atajos.cerrar}</kbd> {t("action.close")}</span>
          </div>}
        </div>}

      </div>
      {confirmarReinicio && <Modal title={t("settings.reset")} icon="warning" onClose={() => setConfirmarReinicio(false)} fit>
        <p className="text-sm text-sand">{t("settings.resetConfirm")}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => setConfirmarReinicio(false)}>{t("action.cancel")}</Btn><Btn variant="blood" onClick={() => { dispatch({ type: "REINICIAR" }); onCerrar(); }}>{t("settings.reset")}</Btn></div>
      </Modal>}
    </Modal>
  );
}
