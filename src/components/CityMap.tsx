import { useState } from "react";
import { motion } from "framer-motion";
import { COMUNITARIOS, EVENTOS_CLUB_INFO, GIMNASIOS_RIVALES, PROPIEDADES } from "../game/data";
import { fmt, rankingMundial, sucursales } from "../game/engine";
import { useGame } from "../game/state";
import type { PropiedadId } from "../game/types";
import { BotonBrillante, Btn, I, Iconos, Modal } from "./ui";

interface CityMapProps {
  onIrAPestaña?: (pestana: string) => void;
}

export function CityMap({ onIrAPestaña }: CityMapProps) {
  const { state, dispatch, nivel } = useGame();
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<PropiedadId>("arena");
  const [rankingAbierto, setRankingAbierto] = useState(false);
  const [rankingPagina, setRankingPagina] = useState(0);
  const [salonAbierto, setSalonAbierto] = useState(false);

  const nSuc = sucursales(state);
  const ranking = rankingMundial(state);
  const propActual = PROPIEDADES[propiedadSeleccionada];
  const esPropiedadMia = state.propiedades.includes(propiedadSeleccionada);
  const puedeComprar = state.dinero >= propActual.costo && !esPropiedadMia;

  const comprar = (id: PropiedadId) => {
    dispatch({ type: "COMPRAR_PROPIEDAD", id });
  };

  const propiedadesList: { id: PropiedadId; data: typeof PROPIEDADES[PropiedadId] }[] = (
    Object.keys(PROPIEDADES) as PropiedadId[]
  ).map(id => ({ id, data: PROPIEDADES[id] }));

  return (
    <div className="game-screen relative grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden rounded-3xl border border-line bg-ink/90 p-3 text-sand shadow-2xl backdrop-blur-xl select-none">
      
      {/* CABECERA URBANÍSTICA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/40 font-mono-data">
              PLANO URBANÍSTICO DE LA METRÓPOLI
            </span>
            <span className="text-xs text-mut font-cond">Distritos, Bienes Inmuebles & Clubes Rivales</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wide text-cream mt-1">
            Ciudad de Campeones
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-panel border border-line flex items-center gap-2.5">
            <Iconos.moneda className="w-5 h-5 text-gold" />
            <span className="text-xs font-bold text-sand font-cond uppercase">Presupuesto Disponible:</span>
            <span className="text-sm font-black text-gold font-mono-data">{fmt(state.dinero)}</span>
          </div>
        </div>
      </div>

      {/* PLANO URBANÍSTICO VECTORIAL ISOMÉTRICO 1000x600 + PANEL LATERAL */}
      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-12 gap-2 items-stretch overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: MAPA ISOMÉTRICO (8 COLS) */}
        <div className="lg:col-span-8 h-full bg-[#090d16] border border-line rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center p-2">
          <svg viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
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
              RÍO METROPOLITANO
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
              DISTRITO LAS LOMAS
            </text>

            {/* ETIQUETAS DE DISTRITOS */}
            <rect x="60" y="540" width="280" height="30" rx="6" fill="#0c1018" stroke="#2a3344" strokeWidth="1.5" />
            <text x="200" y="560" fill="#c9b896" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-cond)">
              SUR · BARRIO TRADICIONAL & GIMNASIOS
            </text>

            <rect x="600" y="320" width="280" height="30" rx="6" fill="#0c1018" stroke="#2a3344" strokeWidth="1.5" />
            <text x="740" y="340" fill="#c9b896" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-cond)">
              CENTRO · ESPECTÁCULOS & FINANZAS
            </text>

            {/* PIN: SEDE CENTRAL DEL JUGADOR */}
            <g transform="translate(180, 480)" className="cursor-pointer group">
              <circle cx="0" cy="0" r="24" fill="#8a6516" stroke="#e8b23a" strokeWidth="2.5" className="group-hover:scale-110 transition-transform" />
              <text x="0" y="6" fontSize="15" textAnchor="middle">🥊</text>
              <g transform="translate(0, -32)">
                <rect x="-85" y="-12" width="170" height="24" rx="6" fill="#0c1018" stroke="#e8b23a" strokeWidth="1.5" />
                <text x="0" y="4" fill="#e8b23a" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="var(--font-cond)">
                  {state.nombreGimnasio.toUpperCase()} (NIVEL {nivel})
                </text>
              </g>
            </g>

            {/* PINES: RED DE CLUBES RIVALES */}
            {GIMNASIOS_RIVALES.slice(0, 6).map((club, i) => {
              const posiciones = [[110, 410], [90, 260], [300, 300], [720, 420], [850, 420], [820, 125]];
              const [x, y] = posiciones[i];
              return (
                <g key={club} transform={`translate(${x}, ${y})`} className="cursor-pointer group">
                  <circle cx="0" cy="0" r="18" fill="#581c1c" stroke="#dc2626" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
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
                  onClick={() => setPropiedadSeleccionada(id)}
                  className="cursor-pointer group"
                >
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
                    className="transition-all group-hover:scale-110"
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
        <div className="lg:col-span-4 h-full bg-panel border border-line rounded-3xl p-2.5 flex flex-col justify-between gap-2 shadow-2xl min-w-0 overflow-hidden">
          {propActual ? (
            <>
              <div className="min-h-0 space-y-1 text-[11px]">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 border-b border-line pb-1">
                  <span className="max-w-[70%] break-words text-[10px] font-black uppercase text-gold font-mono-data bg-gold/10 px-2 py-1 rounded border border-gold/40">
                    {propActual.distrito || "Distrito Metropolitano"}
                  </span>
                  <span className="shrink-0 text-sm font-black text-gold font-mono-data">
                    {fmt(propActual.costo)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-display uppercase tracking-wide text-cream">
                    {propActual.nombre}
                  </h3>
                  <p className="text-[10px] text-sand font-cond leading-tight">
                    {propActual.desc}
                  </p>
                </div>

                <div className="hidden p-1.5 rounded-xl bg-panel2 border border-line space-y-0.5 text-[10px]">
                  <span className="text-[10px] font-black uppercase text-emerald-400 font-mono-data">
                    BENEFICIO ESTRATÉGICO
                  </span>
                  <p className="font-cond font-bold text-cream leading-tight">
                    {propActual.beneficio || "Incrementa el patrimonio y reputación del club."}
                  </p>
                  {!esPropiedadMia && (
                    <p className="pt-1 font-cond text-mut">
                      Caja después de comprar: <b className={puedeComprar ? "text-cream" : "text-blood"}>{fmt(state.dinero - propActual.costo)}</b>
                    </p>
                  )}
                  {propiedadSeleccionada === "sucursal" && (
                    <p className="pt-1 font-cond text-mut">
                      Recuperación estimada: <b className="text-gold">{state.personal.some(p => p.tipo === "gerente") ? "aprox. 2 semanas" : "primero necesitás un gerente"}</b>
                    </p>
                  )}
                </div>

                <div className="hidden p-2 rounded-xl bg-ink/70 border border-line items-center text-[10px] font-mono-data font-bold">
                  <span className="text-mut">Estado Jurídico:</span>
                  <span className={esPropiedadMia ? "text-emerald-400" : "text-amber-400"}>
                    {esPropiedadMia ? "✓ Escriturada a tu Nombre" : "Disponible para Compra"}
                  </span>
                </div>
              </div>

              {/* ACCIÓN DE ADQUISICIÓN */}
              <div className="space-y-2">
                <BotonBrillante
                  onClick={() => comprar(propiedadSeleccionada)}
                  disabled={!puedeComprar}
                  variante={esPropiedadMia ? "secundario" : "dorado"}
                  className="w-full py-2 text-xs font-black"
                >
                  {esPropiedadMia
                    ? "✓ Inmueble en Posesión"
                    : puedeComprar
                    ? `Comprar por ${fmt(propActual.costo)}`
                    : "Fondos Insuficientes"}
                </BotonBrillante>

                {propiedadSeleccionada === "sucursal" && (
                  <p className="text-[10px] font-cond text-mut text-center">
                    Sucursales activas: {nSuc} · Requiere Gerente en el plantel para rendir ingresos pasivos semanales.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-mut text-center font-cond">
              Selecciona cualquier edificio o icono en el plano urbanístico para inspeccionar sus características.
            </div>
          )}
        </div>
      </div>

      <section className="hidden min-h-0 overflow-hidden rounded-2xl border border-gold2/40 bg-panel p-2.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
          <div>
            <span className="font-display text-lg tracking-wide text-gold">Ranking Mundial</span>
            <p className="font-cond text-xs text-sand">Los mejores récords, nocauts y títulos de todos los clubes de la ciudad.</p>
          </div>
          <span className="font-mono-data text-xs text-mut">{ranking.length} competidores registrados</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Btn small variant="gold" onClick={() => setRankingAbierto(true)}>Ver ranking</Btn>
            <Btn small variant="ghost" onClick={() => setSalonAbierto(true)}>Salón de la Fama</Btn>
          </div>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {ranking.slice(0, 3).map((item, i) => (
            <div key={item.pugilista.id} className={`flex items-center gap-2 rounded-xl border p-2 ${item.club === state.nombreGimnasio ? "border-gold2/60 bg-gold/10" : "border-line bg-panel2"}`}>
              <span className="w-6 text-center font-display text-lg text-gold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm text-cream">{item.pugilista.nombre}</div>
                <div className="truncate font-cond text-[10px] uppercase text-mut">{item.club} · {item.pugilista.division}</div>
              </div>
              <div className="text-right font-mono-data text-[11px] text-sand">
                <div className="text-cream">{item.pugilista.record.v}-{item.pugilista.record.d}-{item.pugilista.record.e ?? 0}</div>
                <div className="text-gold">{item.pugilista.record.ko} KO</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN INFERIOR: SCOUTING & ACTIVIDADES DE LA CIUDAD */}
      <div className="hidden min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 border-t border-line pt-2 overflow-hidden">
        
        {/* SCOUTING EN CLUBES RIVALES (4 COLS) */}
        <div className="lg:col-span-4 p-2.5 rounded-2xl bg-panel border border-line flex flex-col justify-between gap-2 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <I n="users" className="h-4 w-4 text-blood" />
              <span className="font-display text-base tracking-wide text-cream">Buscar talentos en otros clubes</span>
            </div>
            <p className="mt-1 font-cond text-xs text-sand">
              Enviá a un ojeador a los gimnasios de {GIMNASIOS_RIVALES[0]} o {GIMNASIOS_RIVALES[1]} para invitar a un talento a probarse en tu club.
            </p>
          </div>
          <Btn
            small
            variant="blood"
            className="w-full"
            disabled={state.ultimaSemanaScout === state.semana}
            onClick={() => dispatch({ type: "SCOUT" })}
          >
            {state.ultimaSemanaScout === state.semana ? "Búsqueda usada · vuelve el lunes" : "Buscar un talento · 1 uso semanal"}
          </Btn>
        </div>

        {/* ACTIVIDADES Y EVENTOS SOCIALES DEL CLUB (8 COLS) */}
        <div className="lg:col-span-8 p-2.5 rounded-2xl bg-panel border border-line flex flex-col justify-between gap-2 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="hidden text-[10px] font-black uppercase text-gold font-mono-data bg-gold/10 px-2.5 py-0.5 rounded border border-gold/40">
                ACTIVIDADES COMUNITARIAS DEL CLUB
              </span>
              <h4 className="font-display text-[11px] tracking-wide text-cream mt-0.5">
                Finanzas Sociales & Eventos Populares de Fin de Semana
              </h4>
            </div>
            <span className="text-xs font-cond text-mut">
              Fama acumulada: <b className="text-gold">{state.fama} pts</b>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            {(["bingo", "naipes", "festival"] as const).map(k => {
              const c = COMUNITARIOS[k];
              const evInfo = k === "bingo" ? EVENTOS_CLUB_INFO.bingoFamiliar : k === "naipes" ? EVENTOS_CLUB_INFO.torneoJuegosMesa : EVENTOS_CLUB_INFO.festivalBoxeo;
              const emoji = evInfo?.emoji || "🎟️";
              return (
                <div key={k} className="p-1.5 rounded-xl bg-panel2 border border-line text-[10px] font-cond space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base">{emoji}</span>
                    <span className="font-mono-data text-gold font-bold">Inv. {fmt(c.inversion)}</span>
                  </div>
                  <div className="truncate font-display text-xs text-cream">{c.nombre}</div>
                  <div className="truncate text-[10px] text-sand">{c.extra}</div>
                  <div className="flex items-center justify-between gap-1 text-[9px] text-mut font-mono-data"><span>Retorno: {fmt(c.min)} - {fmt(c.max)}</span><button className="rounded border border-gold2/50 px-1.5 py-0.5 text-[9px] text-gold hover:bg-gold/10 disabled:opacity-40" disabled={state.comunitarios.length > 0 || state.dinero < c.inversion || state.dia >= 6} onClick={() => dispatch({ type: "PROGRAMAR_SOCIAL", actividad: k })}>{state.comunitarios.some(x => x.tipo === k) ? "Agendado" : "Agendar"}</button></div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-xs font-cond text-mut">
            <span>
              🏢 Sucursales: <b className="text-cream">{nSuc}</b> · Gerentes: <b className="text-cream">{state.personal.filter(p => p.tipo === "gerente").length}</b> · Ingreso por sucursal con gerente: <b className="text-gold">{fmt(650 + 8 * state.fama)}/sem</b>
            </span>
            {onIrAPestaña && (
              <button onClick={() => onIrAPestaña("gimnasio")} className="text-cream font-bold hover:underline cursor-pointer">
                Volver al Gimnasio →
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-2 gap-1.5 border-t border-line pt-2 sm:grid-cols-4">
        <Btn small variant="gold" onClick={() => { setRankingPagina(0); setRankingAbierto(true); }}>Ranking mundial · {ranking.length}</Btn>
        <Btn small variant="ghost" onClick={() => setSalonAbierto(true)}>Salón de la fama</Btn>
        <Btn small variant="blood" disabled={state.ultimaSemanaScout === state.semana} onClick={() => dispatch({ type: "SCOUT" })}>
          {state.ultimaSemanaScout === state.semana ? "Talentos: usado" : "Buscar talentos"}
        </Btn>
      </div>
      {rankingAbierto && (
        <Modal wide fit title="Ranking Mundial" icon="trophy" onClose={() => setRankingAbierto(false)}>
          <div className="space-y-1.5">
            <p className="mb-2 font-cond text-xs text-sand">Récord, nocauts, títulos y circuito de todos los clubes.</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
            {ranking.slice(rankingPagina * 10, rankingPagina * 10 + 10).map((item, i) => (
              <div key={item.pugilista.id} className={`grid grid-cols-[24px_1fr_auto] items-center gap-1.5 rounded-lg border p-1.5 ${item.club === state.nombreGimnasio ? "border-gold2/60 bg-gold/10" : "border-line bg-panel2"}`}>
                <span className="text-center font-display text-lg text-gold">{rankingPagina * 10 + i + 1}</span>
                <div className="min-w-0"><div className="truncate font-display text-xs text-cream">{item.pugilista.nombre}</div><div className="truncate font-cond text-[9px] uppercase text-mut">{item.club} · {item.pugilista.circuito === "pro" ? "Profesional" : "Amateur"} · {item.pugilista.division}</div></div>
                <div className="text-right font-mono-data text-[10px] text-sand"><div>{item.pugilista.record.v}-{item.pugilista.record.d}-{item.pugilista.record.e ?? 0}</div><div className="text-gold">{item.pugilista.record.ko} KO · {item.puntos} pts</div></div>
              </div>
            ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 font-cond text-xs text-mut">
              <Btn small variant="dark" disabled={rankingPagina === 0} onClick={() => setRankingPagina(p => Math.max(0, p - 1))}>Anterior</Btn>
              <span>{rankingPagina + 1} / {Math.max(1, Math.ceil(ranking.length / 10))}</span>
              <Btn small variant="gold" disabled={(rankingPagina + 1) * 10 >= ranking.length} onClick={() => setRankingPagina(p => p + 1)}>Más ranking</Btn>
            </div>
          </div>
        </Modal>
      )}
      {salonAbierto && (
        <Modal wide fit title="Salón de la Fama" icon="trophy" onClose={() => setSalonAbierto(false)}>
          <p className="mb-2 font-cond text-xs text-sand">Las carreras históricas permanecen aunque el boxeador ya no compita.</p>
          {state.salonFama.length === 0 ? <p className="py-8 text-center font-cond text-sm italic text-mut">Todavía no hay leyendas retiradas.</p> : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {state.salonFama.map((leyenda, i) => (
                <div key={leyenda.id} className="rounded-lg border border-gold2/50 bg-gold/10 p-2">
                  <div className="flex items-center justify-between"><span className="font-display text-sm text-gold">#{i + 1} {leyenda.nombre}</span><span className="font-cond text-[10px] text-mut">S{leyenda.semanaRetiro}</span></div>
                  <div className="font-cond text-xs text-sand">{leyenda.club} · {leyenda.record.v}-{leyenda.record.d}-{leyenda.record.e} · {leyenda.record.ko} KO · {leyenda.titulos} títulos</div>
                  <div className="font-cond text-[11px] text-cream">{leyenda.motivo}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

    </div>
  );
}

export default CityMap;
export { CityMap as MapaCiudad };
