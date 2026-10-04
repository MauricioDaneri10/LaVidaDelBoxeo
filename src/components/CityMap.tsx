import { useEffect, useRef, useState } from "react";
import { m as motion } from "framer-motion";
import { GIMNASIOS_RIVALES, PROPIEDADES } from "../game/data";
import { fmt, rankingMundial, sucursales } from "../game/engine";
import { useGame } from "../game/state";
import type { PropiedadId } from "../game/types";
import { BotonBrillante, Btn, Modal, TextoPaginado } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { useMessages } from "../i18n";
import { presentarCurso, presentarDivision, presentarPropiedad } from "../i18n/presentation";

interface CityMapProps {
  onIrAPestaña?: (pestana: string) => void;
}

export function CityMap({ onIrAPestaña }: CityMapProps) {
  const { t, locale } = useMessages();
  const { state, dispatch, nivel } = useGame();
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<PropiedadId>("arena");
  const [rankingAbierto, setRankingAbierto] = useState(false);
  const [rankingPagina, setRankingPagina] = useState(0);
  const [salonAbierto, setSalonAbierto] = useState(false);
  const [salonPagina, setSalonPagina] = useState(0);
  const horizontal = useResponsiveCapacity("(max-height: 450px)");
  const [inspectorAbierto, setInspectorAbierto] = useState(false);
  const [seccionInmueble, setSeccionInmueble] = useState("detalle");
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 800px)");
  const mapaRef = useRef<SVGSVGElement>(null);
  const [radioAccion, setRadioAccion] = useState(36);
  useEffect(() => {
    const svg = mapaRef.current;
    if (!svg) return;
    const ajustar = () => {
      const scale = Math.min(svg.clientWidth / 1000, svg.clientHeight / 600);
      if (scale > 0) setRadioAccion(Math.max(22, 24 / scale));
    };
    const observer = new ResizeObserver(ajustar);
    observer.observe(svg);
    ajustar();
    return () => observer.disconnect();
  }, []);

  const ranking = rankingMundial(state);
  const nSuc = sucursales(state);
  const propActual = presentarPropiedad(propiedadSeleccionada,locale);
  const esPropiedadMia = state.propiedades.includes(propiedadSeleccionada);
  const requisitoPropiedad = propiedadSeleccionada === "terreno" && !state.cursos.includes("clubes")
    ? t("city.requiresCourse",{course:presentarCurso("clubes",locale).nombre})
    : propiedadSeleccionada === "sucursal" && !state.propiedades.includes("terreno")
    ? t("city.requiresLand")
    : propiedadSeleccionada === "arena" && !state.cursos.includes("tv")
    ? t("city.requiresCourse",{course:presentarCurso("tv",locale).nombre})
    : null;
  const puedeComprar = state.dinero >= propActual.costo && !esPropiedadMia && !requisitoPropiedad;

  const comprar = (id: PropiedadId) => {
    dispatch({ type: "COMPRAR_PROPIEDAD", id });
  };

  const propiedadesList: { id: PropiedadId; data: typeof PROPIEDADES[PropiedadId] }[] = (
    Object.keys(PROPIEDADES) as PropiedadId[]
  ).map(id => ({ id, data: presentarPropiedad(id,locale) }));

  const propertyCopy = seccionInmueble === "detalle"
    ? [propActual.distrito,fmt(propActual.costo),propActual.desc,!esPropiedadMia && requisitoPropiedad].filter(Boolean).join(" · ")
    : seccionInmueble === "beneficio"
    ? [propActual.beneficio,!esPropiedadMia && t("city.afterPurchase",{cash:fmt(state.dinero-propActual.costo)}),propiedadSeleccionada==="sucursal" && t("city.branches",{count:nSuc})].filter(Boolean).join(" · ")
    : [t(esPropiedadMia ? "property.deeded" : "property.notOwned"),!esPropiedadMia && requisitoPropiedad].filter(Boolean).join(" · ");
  const inspector = <div className="city-property-details min-h-0 space-y-2">
    <TextoPaginado texto={propertyCopy} capacidad={horizontal ? 20 : compacto ? 40 : 160}/>
    {seccionInmueble === "compra" && <BotonBrillante onClick={()=>comprar(propiedadSeleccionada)} disabled={!puedeComprar} variante={esPropiedadMia ? "secundario" : "dorado"} className="w-full">
      {esPropiedadMia ? t("city.owned") : requisitoPropiedad ? t("city.requirementPending") : puedeComprar ? t("action.buy",{price:fmt(propActual.costo)}) : t("city.noFunds")}
    </BotonBrillante>}
  </div>;
  return (
    <div className="game-screen relative grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden rounded-3xl border border-line bg-ink/90 p-3 text-sand shadow-2xl backdrop-blur-xl select-none">
      
      {/* CABECERA URBANÍSTICA */}
      <div className="city-header flex flex-wrap items-center justify-between gap-4 border-b border-line pb-2">
        <div>
          {!compacto && <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/40 font-mono-data">
              {t("city.plan")}
            </span>
            <span className="text-xs text-mut font-cond">{t("city.subtitle")}</span>
          </div>}
          <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wide text-cream mt-1">
            {t("city.title")}
          </h2>
        </div>

      </div>

      {/* PLANO URBANÍSTICO VECTORIAL ISOMÉTRICO 1000x600 + PANEL LATERAL */}
      <div className={`city-map-area grid min-h-0 gap-2 items-stretch overflow-hidden ${compacto ? "grid-cols-1" : "md:grid-cols-12"}`}>
        
        {/* COLUMNA IZQUIERDA: MAPA ISOMÉTRICO (8 COLS) */}
        <div className={`${compacto ? "" : "md:col-span-8"} h-full min-h-0 bg-[#090d16] border border-line rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center p-2`}>
          <svg ref={mapaRef} viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet" role={compacto ? "img" : undefined} aria-label={compacto ? t("city.mapLabel") : undefined}>
            <defs>
              <linearGradient id="gradRioRetro" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#082f49" />
              </linearGradient>
              <radialGradient id="luzNocheRetro" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e8b23a" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Fondo y terreno */}
            <rect width="1000" height="600" fill="#0b0e14" />
            
            {/* Río Metropolitano */}
            <path d="M-50 220 Q300 350 600 200 T1050 300 L1050 380 Q600 280 300 430 T-50 300 Z" fill="url(#gradRioRetro)" opacity="0.75" />
            <text x="450" y="270" fill="#38bdf8" fontSize="11" fontWeight="bold" opacity="0.45" letterSpacing="3" fontFamily="var(--font-cond)">
              {t("city.river")}
            </text>

            {/* Red de Avenidas y Calles Principales */}
            {/* Autopista Norte-Sur */}
            <line x1="500" y1="0" x2="500" y2="600" stroke="#1c212c" strokeWidth="24" />
            <line x1="500" y1="0" x2="500" y2="600" stroke="#e8b23a" strokeWidth="2" strokeDasharray="12,12" opacity="0.7" />

            {/* Avenida Central Este-Oeste */}
            <line x1="0" y1="360" x2="1000" y2="360" stroke="#1c212c" strokeWidth="20" />
            <line x1="0" y1="360" x2="1000" y2="360" stroke="#f2e7d0" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />

            {/* Avenida Costanera */}
            <line x1="0" y1="180" x2="1000" y2="180" stroke="#1c212c" strokeWidth="16" />

            {/* Cuadrículas de Manzanas Residenciales - Distrito Sur */}
            <g fill="#121620" stroke="#252c3b" strokeWidth="1.5">
              {[80, 160, 240, 320].map(x => (
                <g key={`manz-sur-${x}`}>
                  <rect x={x} y="420" width="60" height="40" rx="4" />
                  <rect x={x} y="480" width="60" height="40" rx="4" />
                  <rect x={x + 10} y="430" width="16" height="12" fill="#0d111a" stroke="#333f52" />
                  <rect x={x + 35} y="430" width="16" height="12" fill="#0d111a" stroke="#333f52" />
                </g>
              ))}
            </g>

            {/* Cuadrículas de Distrito Centro: Rascacielos y Oficinas */}
            <g fill="#0e131d" stroke="#2c3546" strokeWidth="1.5">
              {[580, 680, 780, 880].map((x) => (
                <g key={`manz-cen-${x}`}>
                  <rect x={x} y="220" width="70" height="60" rx="4" />
                  <rect x={x + 15} y="200" width="40" height="80" rx="3" fill="#182030" />
                  <rect x={x + 25} y="170" width="20" height="110" rx="2" fill="#253247" />
                </g>
              ))}
            </g>

            {/* Distrito Norte: Lomas y Colinas */}
            <path d="M550 160 Q750 60 1000 120 L1000 0 L550 0 Z" fill="#063828" opacity="0.6" />
            <text x="800" y="60" fill="#34d399" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="var(--font-cond)">
              {t("city.hills")}
            </text>

            {/* ETIQUETAS DE DISTRITOS */}
            <rect x="60" y="540" width="280" height="30" rx="6" fill="#0c1018" stroke="#2a3344" strokeWidth="1.5" />
            <text x="200" y="560" fill="#c9b896" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-cond)">
              {t("city.south")}
            </text>

            <rect x="600" y="320" width="280" height="30" rx="6" fill="#0c1018" stroke="#2a3344" strokeWidth="1.5" />
            <text x="740" y="340" fill="#c9b896" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-cond)">
              {t("city.centre")}
            </text>

            {/* PIN: SEDE CENTRAL DEL JUGADOR */}
            <g transform="translate(180, 480)">
              <circle cx="0" cy="0" r="24" fill="#8a6516" stroke="#e8b23a" strokeWidth="2.5" />
              <text x="0" y="6" fontSize="15" textAnchor="middle">🥊</text>
              <g transform="translate(0, -32)">
                <rect x="-85" y="-12" width="170" height="24" rx="6" fill="#0c1018" stroke="#e8b23a" strokeWidth="1.5" />
                <text x="0" y="4" fill="#e8b23a" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="var(--font-cond)">
                  {t("city.clubLevel",{club:state.nombreGimnasio,level:nivel})}
                </text>
              </g>
            </g>

            {/* PINES: RED DE CLUBES RIVALES */}
            {GIMNASIOS_RIVALES.slice(0, 6).map((club, i) => {
              const posiciones = [[110, 410], [90, 260], [300, 300], [720, 420], [850, 420], [820, 125]];
              const [x, y] = posiciones[i];
              return (
                <g key={club} transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="0" r="18" fill="#581c1c" stroke="#dc2626" strokeWidth="2" />
                  <text x="0" y="5" fontSize="12" textAnchor="middle">⚔️</text>
                  <g transform="translate(0, -26)">
                    <rect x="-65" y="-10" width="130" height="20" rx="4" fill="#0c1018" stroke="#dc2626" strokeWidth="1" />
                    <text x="0" y="4" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-cond)">
                      {club}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* PINES INTERACTIVOS PARA CADA PROPIEDAD CANÓNICA */}
            {propiedadesList.map(({ id, data }) => {
              const coords = data.coordenadasSvg || { x: 500, y: 300 };
              const esSeleccionado = propiedadSeleccionada === id;
              const esMio = state.propiedades.includes(id);

              const pinEmoji = data.tipo === "estadio" ? "🏟️" : data.tipo === "vivienda" ? "🏡" : "🏬";

              return (
                <g
                  key={id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  onClick={compacto ? undefined : () => setPropiedadSeleccionada(id)}
                  onKeyDown={event => {
                    if (!compacto && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setPropiedadSeleccionada(id);
                    }
                  }}
                  role={compacto ? undefined : "button"}
                  tabIndex={compacto ? undefined : 0}
                  aria-label={`${data.nombre} · ${esMio ? t("city.owned") : fmt(data.costo)}`}
                  aria-pressed={compacto ? undefined : esSeleccionado}
                  className={`${compacto ? "" : "cursor-pointer"} group outline-none`}
                >
                  {!compacto && <circle r={radioAccion} fill="transparent" />}
                  {/* Halo animado de selección */}
                  {esSeleccionado && (
                    <circle cx="0" cy="0" r="32" fill="#e8b23a" opacity="0.25" className="animate-ping" />
                  )}

                  {/* Base del Pin */}
                  <circle
                    cx="0"
                    cy="0"
                    r="22"
                    fill={esMio ? "#047857" : esSeleccionado ? "#b45309" : "#1e2433"}
                    stroke={esMio ? "#10b981" : esSeleccionado ? "#e8b23a" : "#475569"}
                    strokeWidth={esSeleccionado ? "3" : "2"}
                    className="transition-all group-hover:scale-110 group-focus-visible:stroke-cream group-focus-visible:stroke-[4]"
                  />

                  {/* Emoji del Inmueble */}
                  <text x="0" y="6" fontSize="16" textAnchor="middle">
                    {pinEmoji}
                  </text>

                  {/* Mostramos etiquetas sólo cuando ayudan a decidir: evita el mapa ilegible. */}
                  {(esSeleccionado || esMio) && <g transform="translate(0, -32)">
                    <rect
                      x="-80"
                      y="-12"
                      width="160"
                      height="24"
                      rx="6"
                      fill="#0c1018"
                      stroke={esMio ? "#10b981" : esSeleccionado ? "#e8b23a" : "#334155"}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="4"
                      fill={esMio ? "#34d399" : esSeleccionado ? "#e8b23a" : "#ffffff"}
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                      fontFamily="var(--font-cond)"
                    >
                      {data.nombre} {esMio ? "✓" : ""}
                    </text>
                  </g>}
                </g>
              );
            })}
          </svg>

          {/* Tráfico ambiental simulado */}
          <div className="pointer-events-none absolute left-0 right-0 top-[35%] h-1 overflow-hidden opacity-50">
            <motion.div className="h-1 w-3 bg-gold" animate={{ x: ["-4vw", "104vw"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
          </div>
          <div className="pointer-events-none absolute left-0 right-0 top-[60%] h-1 overflow-hidden opacity-40">
            <motion.div className="h-1 w-3 bg-blood" animate={{ x: ["104vw", "-4vw"] }} transition={{ duration: 13, repeat: Infinity, ease: "linear" }} />
          </div>
        </div>

        {/* COLUMNA DERECHA: INSPECTOR DE PROPIEDAD SELECCIONADA (4 COLS) */}
        {!compacto && <div className="md:col-span-4 panel min-h-0 flex flex-col justify-between gap-2 p-3 text-sm">
          <div className="space-y-2"><h3 className="font-display text-lg text-gold">{propActual.nombre}</h3><p>{fmt(propActual.costo)}</p><p>{propActual.desc}</p>{requisitoPropiedad && !esPropiedadMia && <p className="text-gold">{requisitoPropiedad}</p>}</div>
          <Btn small variant="gold" onClick={() => setInspectorAbierto(true)}>{t("city.inspect")}</Btn>
        </div>}
      </div>

      <div className="flex min-h-0 flex-wrap justify-center gap-1.5 border-t border-line pt-2">
        {compacto ? <select aria-label={t("city.management")} value="" onChange={e => {
          e.currentTarget.focus();
          const value = e.target.value;
          if (value === "ranking") { setRankingPagina(0); setRankingAbierto(true); }
          else if (value === "salon") { setSalonPagina(0); setSalonAbierto(true); }
          else if (value === "talentos") dispatch({ type: "SCOUT" });
          else if (value) { setPropiedadSeleccionada(value as PropiedadId); setInspectorAbierto(true); }
        }} className="r4-select">
          <option value="" disabled>{t("city.choose")}</option>
          <optgroup label={t("city.properties")}>{propiedadesList.map(p => <option value={p.id} key={p.id}>{p.data.nombre} · {fmt(p.data.costo)}</option>)}</optgroup>
          <option value="ranking">{t("city.ranking")}</option><option value="salon">{t("city.hall")}</option><option value="talentos" disabled={state.ultimaSemanaScout === state.semana}>{state.ultimaSemanaScout === state.semana ? t("city.scoutUsed") : t("city.scout")}</option>
        </select> : <>
        <Btn small className="w-fit" variant="gold" onClick={() => { setRankingPagina(0); setRankingAbierto(true); }}>{t("city.ranking")}</Btn>
        <Btn small className="w-fit" variant="ghost" onClick={() => { setSalonPagina(0); setSalonAbierto(true); }}>{t("city.hall")}</Btn>
        <Btn small className="w-fit" variant="blood" disabled={state.ultimaSemanaScout === state.semana} onClick={() => dispatch({ type: "SCOUT" })}>
          {state.ultimaSemanaScout === state.semana ? t("city.scoutUsed") : t("city.scout")}
        </Btn>
        </>}
      </div>
      {inspectorAbierto && <Modal title={propActual.nombre} icon="house" onClose={() => setInspectorAbierto(false)} wide fit className="settings-dialog">
        <div className="city-property-screen">
          <select aria-label={t("city.propertySection")} value={seccionInmueble} onChange={e => setSeccionInmueble(e.target.value)} className="mb-2 r4-select">
            <option value="detalle">{t("city.propertyDetail")}</option><option value="beneficio">{t("city.propertyBenefit")}</option><option value="compra">{t("city.propertyOwnership")}</option>
          </select>
          {inspector}
        </div>
      </Modal>}
      {rankingAbierto && <Modal wide fit title={t("city.ranking")} icon="trophy" onClose={()=>setRankingAbierto(false)}>
        <div className="bounded-detail">
          <select aria-label={t("city.record")} className="r4-select" value={rankingPagina} onChange={e=>setRankingPagina(Number(e.target.value))}>
            {ranking.map((entry,index)=><option key={entry.pugilista.id} value={index}>#{index+1} · {entry.pugilista.nombre}</option>)}
          </select>
          {ranking[rankingPagina] && <TextoPaginado key={ranking[rankingPagina].pugilista.id} capacidad={horizontal ? 20 : compacto ? 40 : 180} texto={t("city.rankingRecord",{
            position:rankingPagina+1,name:ranking[rankingPagina].pugilista.nombre,club:ranking[rankingPagina].club,
            circuit:t(ranking[rankingPagina].pugilista.circuito==="pro" ? "city.pro" : "city.amateur"),
            division:presentarDivision(ranking[rankingPagina].pugilista.division,locale),wins:ranking[rankingPagina].pugilista.record.v,
            losses:ranking[rankingPagina].pugilista.record.d,draws:ranking[rankingPagina].pugilista.record.e??0,
            kos:ranking[rankingPagina].pugilista.record.ko,points:ranking[rankingPagina].puntos
          })}/>}
        </div>
      </Modal>}
      {salonAbierto && <Modal wide fit title={t("city.hall")} icon="trophy" onClose={()=>setSalonAbierto(false)}>
        {state.salonFama.length===0 ? <p>{t("city.noLegends")}</p> : <div className="bounded-detail">
          <select aria-label={t("city.record")} className="r4-select" value={salonPagina} onChange={e=>setSalonPagina(Number(e.target.value))}>
            {state.salonFama.map((entry,index)=><option key={entry.id} value={index}>#{index+1} · {entry.nombre}</option>)}
          </select>
          {state.salonFama[salonPagina] && <TextoPaginado key={state.salonFama[salonPagina].id} capacidad={horizontal ? 20 : compacto ? 40 : 180} texto={t("city.hallRecord",{
            position:salonPagina+1,name:state.salonFama[salonPagina].nombre,club:state.salonFama[salonPagina].club,
            wins:state.salonFama[salonPagina].record.v,losses:state.salonFama[salonPagina].record.d,
            draws:state.salonFama[salonPagina].record.e,kos:state.salonFama[salonPagina].record.ko,
            titles:state.salonFama[salonPagina].titulos,week:state.salonFama[salonPagina].semanaRetiro,reason:state.salonFama[salonPagina].motivo
          })}/>}
        </div>}
      </Modal>}

    </div>
  );
}

export default CityMap;
export { CityMap as MapaCiudad };
