import { useEffect, useMemo, useRef, useState } from "react";
import { LOGOS_DISPONIBLES } from "../game/data";
import { alumnosActivos, alumnosEnEspera, capacidadAlumnos, nivelGimnasio, valoracion } from "../game/engine";
import { useGame } from "../game/state";
import type { Pugilista } from "../game/types";
import { Btn, I, Modal, RostroBoxeador, TextoPaginado } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import { useMessages } from "../i18n";
import { presentarTitulo, presentarDivision } from "../i18n/presentation";

// ==================== FIGURA PROCEDIMENTAL DE ATLETA ====================
export function Figura({ p, pose = "guardia", escala = 1, voltear = false, onClick }: {
  p: Pugilista; pose?: "guardia" | "sombra" | "sentado" | "saltando" | "caido" | "cabezal";
  escala?: number; voltear?: boolean; onClick?: () => void;
}) {
  const { t } = useMessages();
  const anim = pose === "saltando" ? "anim-salto" : pose === "sombra" ? "anim-sombra" : pose === "sentado" ? "" : "anim-bob";
  const Elemento = onClick ? "button" : "div";
  return (
    <Elemento onClick={onClick} title={onClick ? t("gym.sheetOf",{name:p.nombre}) : p.nombre}
      aria-label={onClick ? t("gym.sheetOf",{name:p.nombre}) : p.nombre} className={`gym-figure group relative flex min-h-11 flex-col items-center focus-visible:outline-2 focus-visible:outline-gold ${onClick ? "cursor-pointer" : ""}`} style={{ width: Math.max(44, 56 * escala) }}>
      <div data-text-role="secondary" className="pointer-events-none absolute -top-6 z-10 flex w-max max-w-[200px] items-center gap-1 whitespace-normal break-words border border-line bg-ink/95 px-1.5 py-0.5 font-cond text-xs uppercase tracking-wide text-sand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 shadow-md">
        {p.nombre.split(" ")[0]} · {t(`combo.${p.combo}`)} · {t("gym.energy",{energy:Math.round(p.energia)})}
      </div>
      <div className={`${anim} ${voltear ? "-scale-x-100" : ""}`} style={{ animationDelay: `${(p.nombre.length % 5) * 0.17}s` }}>
        <svg viewBox="0 0 48 66" width={52 * escala} height={71 * escala}>
          <ellipse cx="24" cy="62" rx="14" ry="3.2" fill="rgba(0,0,0,0.42)" />
          {pose === "sentado" ? (
            <>
              <rect x="15" y="34" width="18" height="10" rx="3" fill="#5a4a33" />
              <rect x="14" y="42" width="8" height="14" rx="2" fill="#2e2822" />
              <rect x="26" y="42" width="8" height="14" rx="2" fill="#2e2822" />
              <rect x="14.5" y="22" width="19.5" height="15" rx="4" fill={p.pantalon} />
              <line x1="17" y1="26" x2="12" y2="33" stroke={p.piel} strokeWidth="3.2" strokeLinecap="round" />
              <line x1="31" y1="26" x2="36" y2="31" stroke={p.piel} strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="11.5" cy="34" r="3.6" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
              <circle cx="36.5" cy="32" r="3.6" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
              <circle cx="24" cy="14" r="7" fill={p.piel} />
              <path d="M17 13a7 7 0 0 1 14 0c0-1-.5-4.5-7-4.5S17 12 17 13z" fill={p.pelo} />
              <path d="M30 10c3 0 4 2 4 4l-4-1z" fill="#f2e7d0" />
            </>
          ) : (
            <>
              <rect x="17" y={pose === "caido" ? 44 : 40} width="5.5" height={pose === "caido" ? 14 : 18} rx="2" fill="#2e2822" transform={pose === "caido" ? "rotate(70 20 50)" : undefined} />
              <rect x="26" y={pose === "caido" ? 44 : 40} width="5.5" height={pose === "caido" ? 14 : 18} rx="2" fill="#2e2822" transform={pose === "caido" ? "rotate(75 28 50)" : undefined} />
              <rect x="16" y={pose === "caido" ? 38 : 35} width="16.5" height="8" rx="2" fill={p.pantalon} />
              <rect x="14.5" y={pose === "caido" ? 24 : 19} width="19.5" height="18" rx="4" fill={p.pantalon} transform={pose === "caido" ? "rotate(80 24 33)" : undefined} />
              <g transform={pose === "caido" ? "rotate(80 24 33)" : undefined}>
                <line x1="16" y1="23" x2="10.5" y2="28" stroke={p.piel} strokeWidth="3.4" strokeLinecap="round" />
                <circle cx="10" cy="29" r="4" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
                <g className={pose === "guardia" || pose === "sombra" || pose === "cabezal" ? "anim-punch" : ""} style={{ transformOrigin: "32px 23px" }}>
                  <line x1="32.5" y1="23" x2="39" y2="26" stroke={p.piel} strokeWidth="3.4" strokeLinecap="round" />
                  <circle cx="40" cy="26" r="4" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
                </g>
                <circle cx="24" cy="11" r="7" fill={p.piel} />
                <path d="M17 10a7 7 0 0 1 14 0c0-1-.5-4.5-7-4.5S17 9 17 10z" fill={p.pelo} />
                {p.genero === "F" && <path d="M17 10c-1.5 1-2 4-1.5 7 1-1 1.6-3 1.8-5z" fill={p.pelo} />}
                {pose === "cabezal" && <path d="M16.5 9.5a7.5 7.5 0 0 1 15 0v3h-15z" fill="#c9cdd4" opacity="0.9" />}
                {p.elite && <circle cx="24" cy="2.5" r="2.2" fill="var(--color-gold)" stroke="#8a6516" strokeWidth="0.8" />}
              </g>
            </>
          )}
        </svg>
      </div>
      {pose !== "caido" && (
        <div className="mt-0.5 border border-line bg-ink/85 px-1.5 py-px font-cond text-sm uppercase tracking-wide text-cream transition-colors group-hover:border-gold2 group-hover:text-gold">
          {p.nombre.split(" ")[0]}{p.rol === "boxeador" && <span className="text-blood"> ●</span>}
        </div>
      )}
    </Elemento>
  );
}

function EtiquetaZona({ n, titulo, extra }: { n: string; titulo: string; extra?: string }) {
  return (
    <div className="gym-station-title pointer-events-none absolute top-1 left-1 z-10 flex items-center gap-1.5">
      <span className="bg-blood px-1.5 py-px font-display text-[13px] text-cream">{n}</span>
      <span className="font-cond text-[11px] uppercase tracking-[0.18em] text-sand">{titulo}</span>
      {extra && <span className="font-cond text-[10px] text-mut">{extra}</span>}
    </div>
  );
}

// ==================== VITRINA DE CINTURONES ====================
function VitrinaCinturones({ onAbrirDueno }: { onAbrirDueno: (nombre: string) => void }) {
  const { state } = useGame();
  const { t, locale } = useMessages();
  const [record,setRecord]=useState(0);
  const [open,setOpen]=useState(false);
  const horizontal=useResponsiveCapacity("(max-height: 450px)");
  const current=state.cinturones[Math.min(record,state.cinturones.length-1)];
  const conVitrina = state.equipamiento.includes("vitrina");
  if (state.cinturones.length === 0) return null;

  return (
    <><div className={`absolute right-[2%] top-[8%] z-10 ${conVitrina ? "border-2 border-gold2/70 bg-ink/75 p-2 rounded-xl backdrop-blur-[2px]" : "p-1"}`}
      style={conVitrina ? { boxShadow: "0 0 18px rgba(232,178,58,0.25), inset 0 0 12px rgba(232,178,58,0.12)" } : undefined}>
      <div className="mb-1 flex items-center gap-1.5 font-cond text-[10px] uppercase tracking-[0.2em] text-gold">
        <Btn small onClick={()=>setOpen(true)}>{t("gym.allBelts",{count:state.cinturones.length})}</Btn>
      </div>
      <div className="flex max-w-[240px] flex-wrap gap-2">
        {state.cinturones.slice(0, 6).map(c => {
          const info = presentarTitulo(c.nivel,locale);
          return (
            <div
              key={c.id}
              aria-hidden="true"
              className="anim-cinturon h-6 w-16 cursor-pointer outline-none hover:scale-110 transition-transform"
            >
              <svg viewBox="0 0 60 22" className="w-full h-full">
                <rect x="2" y="8" width="56" height="7" rx="3" fill={info.colores[0]} stroke="#00000055" />
                <rect x="2" y="8" width="56" height="3" rx="1.5" fill="#ffffff22" />
                <circle cx="30" cy="11" r="7.5" fill={info.colores[1]} stroke="#00000066" strokeWidth="1.2" />
                <circle cx="30" cy="11" r="4.5" fill="#f8f3e4" opacity="0.85" />
                {c.nivel === 4 && (
                  <>
                    <circle cx="20" cy="11" r="1.6" fill="#bfefff" /><circle cx="40" cy="11" r="1.6" fill="#bfefff" />
                  </>
                )}
                <text x="30" y="13.6" textAnchor="middle" fontSize="6.5" fontFamily="Bebas Neue" fill="#3a2a12">
                  {c.nivel === 4 ? "M" : c.nivel === 3 ? "C" : c.nivel === 2 ? "N" : "R"}
                </text>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
    {open && current && <Modal fit wide title={t("gym.belts")} onClose={()=>setOpen(false)}>
      <div className="bounded-detail">
        <div className="space-y-2">
          <select aria-label={t("gym.beltSelected")} value={record} onChange={e=>setRecord(Number(e.target.value))} className="r4-select">{state.cinturones.map((belt,index)=><option key={belt.id} value={index}>#{index+1} · {belt.dueno}</option>)}</select>
          {state.plantel.some(p=>p.nombre===current.dueno) && <Btn onClick={()=>{setOpen(false);onAbrirDueno(current.dueno);}}>{t("gym.viewSheet")}</Btn>}
        </div>
        <TextoPaginado key={current.id} texto={t("gym.beltRecord",{belt:presentarTitulo(current.nivel,locale).cinturon,owner:current.dueno,week:current.semana})} capacidad={horizontal?20:40}/>
      </div>
    </Modal>}</>
  );
}

interface GymViewProps {
  onAbrir?: (id: string) => void;
  onSeleccionarBoxeador?: (b: Pugilista) => void;
}

// ==================== DIORAMA DEL GIMNASIO ====================
export function GymView({ onAbrir, onSeleccionarBoxeador }: GymViewProps) {
  const { state, nivel } = useGame();
  const { t, locale } = useMessages();
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [paredAbierta, setParedAbierta] = useState(false);
  const [paginaPlantel, setPaginaPlantel] = useState(0);
  const [detallePlantel, setDetallePlantel] = useState("datos");
  const plantelCompacto = useResponsiveCapacity("(max-width: 700px), (max-height: 650px)");
  const horizontalBajo = useResponsiveCapacity("(max-height: 450px)");
  const estacionesRef = useRef<HTMLDivElement>(null);
  const estadoRef = useRef<HTMLDivElement>(null);
  const [altoEstado, setAltoEstado] = useState(64);
  const [altoEscena, setAltoEscena] = useState(500);
  const [estacionesPorPagina, setEstacionesPorPagina] = useState(1);
  const estacionesPaginadas = estacionesPorPagina < 5;
  const paredEnDetalle = estacionesPaginadas && plantelCompacto;
  const [estacion, setEstacion] = useState(1);
  useEffect(() => {
    const elemento = estacionesRef.current;
    if (!elemento) return;
    const ajustar = () => {
      setEstacionesPorPagina(horizontalBajo ? 1 : Math.max(1, Math.min(5, Math.floor((elemento.clientWidth - 16) / 300))));
      setAltoEscena(elemento.parentElement?.clientHeight ?? 500);
    };
    const observer = new ResizeObserver(ajustar);
    observer.observe(elemento.parentElement ?? elemento);
    ajustar();
    return () => observer.disconnect();
  }, [horizontalBajo]);
  const primeraEstacion = Math.floor((estacion - 1) / estacionesPorPagina) * estacionesPorPagina + 1;
  const ultimaEstacion = Math.min(5, primeraEstacion + estacionesPorPagina - 1);
  useEffect(() => {
    const el = estadoRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setAltoEstado(Math.ceil(el.getBoundingClientRect().height) + 8));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const todos = state.plantel.filter(p => !p.enEspera);
  const cantidadPlantel = plantelCompacto ? 1 : 3;
  const paginasPlantel = Math.max(1, Math.ceil(todos.length / cantidadPlantel));
  const paginaVisiblePlantel = Math.min(paginaPlantel, paginasPlantel - 1);
  const alumnos = alumnosActivos(state);
  const cupoAlumnos = capacidadAlumnos(state);
  const espera = alumnosEnEspera(state).length;
  const tieneZonaElite = state.equipamiento.includes("zonaElite");

  const logoActual = LOGOS_DISPONIBLES.find(l => l.id === state.logoGimnasio) || LOGOS_DISPONIBLES[0];

  const seleccionarAtleta = (id: string) => {
    if (onAbrir) onAbrir(id);
    if (onSeleccionarBoxeador) {
      const b = state.plantel.find(p => p.id === id);
      if (b) onSeleccionarBoxeador(b);
    }
  };

  const abrirPorNombre = (nombre: string) => {
    const pugil = state.plantel.find(p => p.nombre === nombre);
    if (pugil) seleccionarAtleta(pugil.id);
  };

  // Rotación activa: máximo 8 en pantalla
  const asignacion = useMemo(() => {
    const vip: Pugilista[] = [];
    const hidratacion: Pugilista[] = [];
    const soga: Pugilista[] = [];
    const sacos: Pugilista[] = [];
    const ring: Pugilista[] = [];
    const manoplas: Pugilista[] = [];
    for (const b of todos) {
      if (b.elite && tieneZonaElite && vip.length < 3) vip.push(b);
      else if ((b.lesion || b.energia < 35 || b.combo === "descanso") && hidratacion.length < 2) hidratacion.push(b);
      else if (b.combo === "acondicionamiento" && soga.length < 2) soga.push(b);
      else if ((b.combo === "noqueador" || b.combo === "presion") && sacos.length < 2) sacos.push(b);
      else if (b.combo === "estilista" && ring.length < 2) ring.push(b);
      else if (b.combo === "tactico" && manoplas.length < 1) manoplas.push(b);
      else if (sacos.length < 2) sacos.push(b);
      else if (ring.length < 2) ring.push(b);
    }
    const enPantalla = vip.length + hidratacion.length + soga.length + sacos.length + ring.length + manoplas.length;
    return { vip, hidratacion, soga, sacos, ring, manoplas, vestuarios: Math.max(0, todos.length - enPantalla) };
  }, [todos, tieneZonaElite]);

  const pared = nivel >= 3 ? "linear-gradient(180deg,#262033 0%,#1d1a28 60%,#171420 100%)"
    : nivel === 2 ? "linear-gradient(180deg,#413222 0%,#332618 65%,#291e12 100%)"
    : "linear-gradient(180deg,#4c3823 0%,#3b2b1a 65%,#2e2113 100%)";
  const piso = nivel >= 3 ? "linear-gradient(180deg,#241f2e,#191521)" : "linear-gradient(180deg,#6b4d2e,#4a341e)";

  const estadisticas = <div className="flex flex-wrap gap-2 text-sm">
          <span className="flex items-center gap-1.5 font-cond text-sm text-sand">
          <I n="users" className="h-4 w-4 text-gold" /> {t("gym.students")} <b className={espera ? "text-blood" : "text-cream"}>{alumnos.length}/{cupoAlumnos}</b>
          {espera > 0 && <span className="text-[11px] text-blood">· {t("gym.waiting",{count:espera})}</span>}
        </span>
        <span className="flex items-center gap-1.5 font-cond text-sm text-sand">
          <I n="glove" className="h-4 w-4 text-blood" /> {t("gym.competitors")} <b className="text-cream">{state.plantel.filter(p => p.rol === "boxeador").length}</b>
        </span>
        <span className="flex items-center gap-1.5 font-cond text-sm text-sand">
          <I n="medal" className="h-4 w-4 text-gold" /> {t("gym.belts")} <b className="text-cream">{state.cinturones.length}</b>
        </span>
        {asignacion.vestuarios > 0 && (
          <span className="flex items-center gap-1.5 border border-line2 bg-panel2 px-2 py-0.5 font-cond text-sm text-sand">
            <I n="house" className="h-3.5 w-3.5 text-mut" /> {t("gym.lockers")}: <b className="text-cream">{asignacion.vestuarios}</b>
          </span>
        )}
  </div>;
  const paredDelClub = <>
        {/* MARQUESINA CENTRAL DEL GIMNASIO CON EMBLEMA Y NIVEL */}
        <div className={`gym-marquee pointer-events-none absolute left-1/2 top-12 w-[calc(100%-2rem)] max-w-[680px] -translate-x-1/2 text-center ${nivel >= 3 ? "anim-neon" : ""}`}>
          <div className="flex items-center justify-center gap-3">
            <span className="shrink-0 text-xl filter drop-shadow">{logoActual.emoji}</span>
            <div className={`min-w-0 flex-1 break-words rounded-lg border-2 bg-ink/75 px-3 py-2 font-display text-sm tracking-[0.04em] shadow-lg ${nivel >= 3 ? "border-neonc text-neonc" : "border-gold2 text-gold"}`}
              style={nivel >= 3
                ? { fontSize: "clamp(14px, 2vw, 32px)", textShadow: "0 0 16px rgba(56,224,207,0.85), 0 0 38px rgba(255,79,160,0.4)", boxShadow: "0 0 22px rgba(56,224,207,0.22) inset" }
                : { fontSize: "clamp(14px, 2vw, 32px)", textShadow: "0 0 12px rgba(232,178,58,0.55)" }}>
              {state.nombreGimnasio}
            </div>
            <span className="shrink-0 text-xl filter drop-shadow">{logoActual.emoji}</span>
          </div>
          <div className="mt-0.5 font-cond text-[10px] uppercase tracking-[0.3em] text-sand">
            {t("gym.headquarters",{level:nivel})}
          </div>
        </div>

        {nivel >= 3 && <div className="anim-marquee absolute bottom-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg,transparent,var(--color-neonc),var(--color-neonm),transparent)" }} />}
        
        {/* VITRINA DE CINTURONES */}
        <VitrinaCinturones onAbrirDueno={abrirPorNombre} />

        {/* AFICHE DE VELADA */}
        <div className="gym-poster pointer-events-none absolute left-[4%] top-[36%] hidden -rotate-2 border-4 border-[#efe3c8] bg-[#e8d9b8] p-1 sm:block shadow-md" style={{ width: 110 }}>
          <div className="bg-blood px-1 py-0.5 text-center font-display text-[12px] leading-tight text-cream">{t("gym.poster")}</div>
          <div className="py-0.5 text-center font-cond text-[9px] uppercase text-ink">{t("gym.posterTime")}</div>
        </div>
  </>;
  return (
    <div className="gym-scene panel relative h-full min-h-0 overflow-hidden flex flex-col justify-between">

      {/* PARED DEL GIMNASIO */}
      <div className="absolute inset-x-0 top-0 h-[56%]" style={{ background: pared }}>
        {[16, 84].map((x, i) => (
          <div key={x} className="absolute top-0" style={{ left: `${x}%` }}>
            <div className="mx-auto h-7 w-px bg-line2" />
            <div className="mx-auto h-2.5 w-5 rounded-b-full border border-line2 bg-[#2c2418]" />
            <div className="mx-auto -mt-0.5 h-2 w-2 rounded-full"
              style={{ background: nivel >= 3 ? "var(--color-neonc)" : "var(--color-gold)", boxShadow: nivel >= 3 ? "0 0 20px 7px rgba(56,224,207,0.3)" : "0 0 20px 7px rgba(232,178,58,0.3)", animation: `latido ${2.2 + i * 0.5}s ease-in-out infinite` }} />
          </div>
        ))}

        {!paredEnDetalle && paredDelClub}
      </div>

      {/* PISO DE MADERA / RING */}
      <div className="absolute inset-x-0 bottom-0 h-[44%]" style={{ background: piso }}>
        <div className="absolute inset-0 opacity-25" style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 54px)" }} />
      </div>

      {/* ============ LAS 5 ESTACIONES DE ENTRENAMIENTO ============ */}
      <div ref={estacionesRef} className={`gym-stations absolute inset-x-0 bottom-[11%] top-[49%] grid grid-cols-5 gap-1 px-2 ${estacionesPaginadas ? "gym-stations-paged" : ""}`} data-start={primeraEstacion} data-end={ultimaEstacion} style={{ top: horizontalBajo ? 0 : Math.min(altoEscena * (estacionesPaginadas ? .36 : .49), Math.max(0, altoEscena - altoEstado - 136)), bottom: altoEstado, gridTemplateColumns: `repeat(${ultimaEstacion - primeraEstacion + 1}, minmax(0, 1fr))` }}>

        {/* ZONA 1: SOGA Y CARDIO */}
        <div data-visible={primeraEstacion <= 1 && ultimaEstacion >= 1} className="relative overflow-hidden rounded-xl border border-line/60 bg-black/15">
          <EtiquetaZona n="1" titulo={t("gym.cardio")} />
          {asignacion.soga.map((b, i) => (
            <div key={b.id} data-slot={i} className="gym-occupant absolute bottom-1" style={{ left: `${i * 50}%`, width: "50%" }}>
              <svg viewBox="0 0 60 70" width="62" height="72" className="absolute -left-1 -top-1">
                <g className="anim-cuerda">
                  <ellipse cx="30" cy="40" rx="22" ry="26" fill="none" stroke="#c9b896" strokeWidth="1.6" strokeDasharray="4 5" />
                </g>
                <ellipse cx="30" cy="66" rx="13" ry="2.6" fill="rgba(0,0,0,0.35)" />
              </svg>
              <Figura p={b} pose="saltando" escala={0.88} onClick={() => seleccionarAtleta(b.id)} />
            </div>
          ))}
          {asignacion.soga.length === 0 && <Vacia />}
        </div>

        {/* ZONA 2: SACOS Y POTENCIA */}
        <div data-visible={primeraEstacion <= 2 && ultimaEstacion >= 2} className="relative overflow-hidden rounded-xl border border-line/60 bg-black/15">
          <EtiquetaZona n="2" titulo={t("gym.power")} />
          <svg viewBox="0 0 100 90" className="pointer-events-none absolute inset-x-0 top-2 h-[85%] w-full">
            <g className="anim-saco-hit" style={{ transformOrigin: "24px 6px" }}>
              <line x1="24" y1="0" x2="24" y2="8" stroke="#6b5a42" strokeWidth="2" />
              <rect x="14" y="8" width="20" height="38" rx="8" fill="#7c4a28" stroke="#5a341b" strokeWidth="1.5" />
              <line x1="17" y1="18" x2="31" y2="18" stroke="#5a341b" strokeWidth="1" />
              <line x1="17" y1="34" x2="31" y2="34" stroke="#5a341b" strokeWidth="1" />
            </g>
            <g className="anim-pera" style={{ transformOrigin: "74px 8px" }}>
              <line x1="74" y1="0" x2="74" y2="10" stroke="#6b5a42" strokeWidth="1.6" />
              <line x1="74" y1="34" x2="74" y2="44" stroke="#6b5a42" strokeWidth="1.6" />
              <ellipse cx="74" cy="22" rx="8" ry="12" fill="#a05a2c" stroke="#5a341b" strokeWidth="1.4" />
            </g>
          </svg>
          {asignacion.sacos.map((b, i) => (
            <div key={b.id} data-slot={i} className="gym-occupant absolute bottom-1" style={{ left: `${i * 50}%`, width: "50%" }}>
              <Figura p={b} pose="guardia" escala={0.85} onClick={() => seleccionarAtleta(b.id)} />
            </div>
          ))}
          {asignacion.sacos.length === 0 && <Vacia />}
        </div>

        {/* ZONA 3: RING DE PRÁCTICA Y TÉCNICA */}
        <div data-visible={primeraEstacion <= 3 && ultimaEstacion >= 3} className="relative overflow-hidden rounded-xl border border-gold2/40 bg-black/20">
          <EtiquetaZona n="3" titulo={t("gym.ring")} />
          <svg viewBox="0 0 120 70" className="pointer-events-none absolute inset-x-1 bottom-0 h-[72%] w-[94%]">
            <rect x="6" y="46" width="108" height="9" fill="#5d452c" stroke="#2c2013" strokeWidth="1.2" />
            <polygon points="6,55 114,55 120,66 0,66" fill="#4a3524" />
            {[10, 110].map(x => <rect key={x} x={x - 2} y="12" width="4" height="36" fill="#8f8577" />)}
            {[20, 30, 40].map(y => <line key={y} x1="10" y1={y} x2="110" y2={y} stroke={y === 30 ? "#f2e7d0" : "#d4342c"} strokeWidth="2" />)}
          </svg>
          {asignacion.ring[0] && (
            <div className="gym-ring-boxer absolute bottom-[16%] left-[10%]">
              <Figura p={asignacion.ring[0]} pose="cabezal" escala={0.66} onClick={() => seleccionarAtleta(asignacion.ring[0].id)} />
            </div>
          )}
          {asignacion.ring[1] && (
            <div data-slot="1" className="gym-ring-boxer absolute bottom-[16%] right-[10%]">
              <Figura p={asignacion.ring[1]} pose="cabezal" escala={0.66} voltear onClick={() => seleccionarAtleta(asignacion.ring[1].id)} />
            </div>
          )}
          {asignacion.ring.length > 0 && (
            <div className="anim-ref absolute bottom-[10%] left-1/2 -translate-x-1/2">
              <svg viewBox="0 0 30 48" width="22" height="36">
                <rect x="10" y="16" width="10" height="16" rx="3" fill="#f2e7d0" />
                <rect x="10.5" y="30" width="4" height="13" rx="2" fill="#23262d" />
                <rect x="15.5" y="30" width="4" height="13" rx="2" fill="#23262d" />
                <circle cx="15" cy="10" r="5.5" fill="#c9986a" />
                <path d="M10 9a5.5 5.5 0 0 1 10 0c0-2-2-4-5-4s-5 2-5 4z" fill="#20180f" />
                <line x1="10" y1="20" x2="4" y2="26" stroke="#c9986a" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="20" y1="20" x2="26" y2="14" stroke="#c9986a" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
          )}
          {asignacion.ring.length === 0 && <Vacia />}
        </div>

        {/* ZONA 4: TÉCNICA Y ESPEJO */}
        <div data-visible={primeraEstacion <= 4 && ultimaEstacion >= 4} className="relative overflow-hidden rounded-xl border border-line/60 bg-black/15">
          <EtiquetaZona n="4" titulo={t("gym.technique")} />
          <div className="pointer-events-none absolute right-2 top-5 h-[68%] w-[43%] rounded border-2 border-sky-200/30 bg-gradient-to-b from-[#4a5964] to-[#1d252c] opacity-90 shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.08)_45%,transparent_60%)]" />
            <div className="absolute inset-x-2 bottom-2 h-1 rounded bg-sky-200/30" />
          </div>
          {asignacion.manoplas.map(b => (
            <div key={b.id} className="gym-single-boxer absolute bottom-1 left-[8%]">
              <Figura p={b} pose="sombra" escala={0.85} onClick={() => seleccionarAtleta(b.id)} />
            </div>
          ))}
          <svg viewBox="0 0 40 52" width="30" height="40" className="absolute bottom-2 right-[12%]">
            <rect x="12" y="18" width="14" height="18" rx="3" fill="#3a3a44" />
            <rect x="13" y="34" width="5" height="14" rx="2" fill="#23262d" />
            <rect x="20" y="34" width="5" height="14" rx="2" fill="#23262d" />
            <circle cx="19" cy="11" r="6" fill="#e0b088" />
            <path d="M13 10a6 6 0 0 1 12 0c0-2-2.5-4.5-6-4.5S13 8 13 10z" fill="#3a2a18" />
            <circle cx="8" cy="22" r="4" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
            <circle cx="31" cy="22" r="4" fill="#d4342c" stroke="#8f1f1a" strokeWidth="1" />
            <line x1="12" y1="22" x2="8.5" y2="22" stroke="#e0b088" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="26" y1="22" x2="29.5" y2="22" stroke="#e0b088" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          {asignacion.manoplas.length === 0 && <Vacia />}
        </div>

        {/* ZONA 5: HIDRATACIÓN Y DESCANSO */}
        <div data-visible={primeraEstacion <= 5 && ultimaEstacion >= 5} className="relative border border-line/60 bg-black/15">
          <EtiquetaZona n="5" titulo={t("gym.hydration")} />
          <svg viewBox="0 0 100 50" className="pointer-events-none absolute inset-x-2 bottom-1 h-[55%] w-[92%]">
            <rect x="10" y="22" width="60" height="6" fill="#6b5a42" stroke="#4a3d2b" />
            <rect x="14" y="28" width="5" height="18" fill="#4a3d2b" />
            <rect x="61" y="28" width="5" height="18" fill="#4a3d2b" />
            <rect x="78" y="6" width="12" height="22" rx="3" fill="#2f6fb2" stroke="#1d4a7a" />
            <rect x="81" y="2" width="6" height="5" rx="1.5" fill="#c9cdd4" />
            <rect x="24" y="16" width="16" height="6" rx="1" fill="#f2e7d0" />
          </svg>
          {asignacion.hidratacion.map((b, i) => (
            <div key={b.id} className="absolute bottom-1" style={{ left: `${10 + i * 44}%` }}>
              <Figura p={b} pose="sentado" escala={0.85} onClick={() => seleccionarAtleta(b.id)} />
            </div>
          ))}
          {asignacion.hidratacion.length === 0 && <Vacia />}
        </div>
      </div>

      {/* ZONA ÉLITE VIP */}
      {tieneZonaElite && (
        <div className="absolute right-[2%] top-[24%] z-10 h-[26%] w-[34%] border-2 border-neonc/60 bg-neonc/5 p-2 rounded-xl"
          style={{ boxShadow: "0 0 24px rgba(56,224,207,0.18) inset, 0 0 18px rgba(56,224,207,0.2)" }}>
          <div className="anim-neon flex items-center gap-1.5 font-cond text-[11px] uppercase tracking-[0.2em] text-neonc">
            <I n="trophy" className="h-3.5 w-3.5" /> {t("gym.elite")}
          </div>
          <div className="relative mt-1 h-[78%]">
            <div className="pointer-events-none absolute inset-x-2 bottom-0 h-[45%] border-t-2 border-neonc/40 bg-neonc/5" />
            {asignacion.vip.map((b, i) => (
              <div key={b.id} className="absolute bottom-0" style={{ left: `${6 + i * 32}%` }}>
                <Figura p={b} pose="guardia" escala={0.8} onClick={() => seleccionarAtleta(b.id)} />
              </div>
            ))}
            {asignacion.vip.length === 0 && <div className="mt-5 font-cond text-xs italic text-neonc/60">{t("gym.eliteEmpty")}</div>}
          </div>
        </div>
      )}

      {paredAbierta && <Modal fit wide title={t("gym.wall")} onClose={() => setParedAbierta(false)}><div className="gym-wall-detail relative">{paredDelClub}</div></Modal>}

      {/* PLANTEL LATERAL RÁPIDO (PANEL DESPLEGABLE) */}
      {drawerAbierto && (
        <Modal title={t("gym.roster", { count: todos.length })} icon="users" onClose={() => setDrawerAbierto(false)} fit>
          <div className={plantelCompacto ? "gym-roster-screen" : ""}>
          {plantelCompacto && <div className="space-y-2">
            <select aria-label={t("sheet.boxer")} value={paginaVisiblePlantel} onChange={e => setPaginaPlantel(Number(e.target.value))} className="r4-select">{todos.map((b, i) => <option key={b.id} value={i}>{b.nombre}</option>)}</select>
            <select aria-label={t("sheet.section")} value={detallePlantel} onChange={e => setDetallePlantel(e.target.value)} className="r4-select"><option value="datos">{t("sheet.identity")}</option><option value="nombre">{t("sheet.name")}</option></select>
          </div>}

          {!plantelCompacto && estacionesPaginadas && estadisticas}
          <div className="space-y-2 py-3">
            {todos.slice(paginaVisiblePlantel * cantidadPlantel, (paginaVisiblePlantel + 1) * cantidadPlantel).map(b => (
              plantelCompacto && detallePlantel === "nombre" ? <p key={b.id} className="text-sm [overflow-wrap:anywhere]">{b.nombre}</p> :
              <button
                type="button"
                key={b.id}
                onClick={() => { seleccionarAtleta(b.id); setDrawerAbierto(false); }}
                aria-label={t("gym.boxerDetail",{name:b.nombre,division:presentarDivision(b.division,locale),energy:Math.round(b.energia)})}
                className="w-full p-2.5 text-left rounded-xl bg-panel hover:bg-panel2 border border-line cursor-pointer flex items-center gap-3 transition-colors group"
              >
                <RostroBoxeador atleta={b} className="w-10 h-10 shrink-0 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-cond font-bold text-sm text-cream break-words group-hover:text-gold">
                    {plantelCompacto ? t("sheet.heading") : b.nombre}
                  </div>
                  <div data-text-role="secondary" className="font-cond text-xs text-mut uppercase">
                    {presentarDivision(b.division,locale)} · {t("gym.energy",{energy:Math.round(b.energia)})}
                  </div>
                </div>
                <div className="font-mono-data text-sm font-black text-gold">
                  {valoracion(b.atrib)}
                </div>
              </button>
            ))}
          </div>

          {paginasPlantel > 1 && <div className="gym-roster-pagination grid grid-cols-2 items-center gap-2">
            <Btn small disabled={paginaVisiblePlantel === 0} onClick={() => setPaginaPlantel(v => Math.max(0, v - 1))}>{t("action.previous")}</Btn>
            <Btn small disabled={paginaVisiblePlantel === paginasPlantel - 1} onClick={() => setPaginaPlantel(v => Math.min(paginasPlantel - 1, v + 1))}>{t("action.next")}</Btn>
            <span className="col-span-2 text-center text-sm">{paginaVisiblePlantel + 1}/{paginasPlantel}</span>
          </div>}
          </div>
        </Modal>
      )}

      {/* BARRA INFERIOR DE ESTADO CON ACCESO AL ROSTER */}
      <div ref={estadoRef} className="gym-status absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-ink/92 px-4 py-2">
        {estacionesPaginadas && <select aria-label={t("gym.station")} value={estacion} onChange={e => { e.currentTarget.focus(); e.target.value === "club" ? setParedAbierta(true) : setEstacion(Number(e.target.value)); }} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-panel2 px-2 text-sm text-sand">
          {paredEnDetalle && <option value="club">{t("gym.wallIdentity")}</option>}<option value={1}>{t("gym.cardio")}</option><option value={2}>{t("gym.power")}</option><option value={3}>{t("gym.ring")}</option><option value={4}>{t("gym.technique")}</option><option value={5}>{t("gym.hydration")}</option>
        </select>}
        {!estacionesPaginadas && estadisticas}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setDrawerAbierto(!drawerAbierto)}
            className="btn-poster flex items-center gap-1.5 px-3 py-1 rounded-lg bg-panel2 border border-line text-sm font-cond uppercase text-gold hover:border-gold2 transition-colors cursor-pointer"
          >
            <I n="users" className="w-3.5 h-3.5" />
            <span>{t("gym.viewRoster", { count: todos.length })}</span>
          </button>
          <span className="hidden font-cond text-[12px] uppercase tracking-wider text-mut xl:block">
            {t("gym.clickBoxer")}
          </span>
        </div>
      </div>

    </div>
  );
}

export default GymView;

function Vacia() {
  const { t } = useMessages();
  return <div className="absolute bottom-3 left-2 font-cond text-[11px] italic text-mut">{t("gym.freeStation")}</div>;
}
