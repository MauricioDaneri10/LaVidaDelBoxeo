import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { alumnosActivos, fmt, puedeHabilitar } from "../game/engine";
import { notificacion } from "../game/audio";
import { useGame } from "../game/state";
import type { EventoJuego } from "../game/types";
import { I } from "./ui";
import { objetivoConsejo } from "../game/consejos";
import { useResponsiveCapacity } from "./useResponsiveCapacity";

export type PestanaDock = "mensajes" | "patrocinios" | "prensa" | "consejos";

const ICONO_TIPO: Record<string, string> = {
  desafio: "glove",
  comunitario: "dice",
  prospecto: "users",
  federacion: "flag",
  patrocinio: "case",
};

function TarjetaEvento({ ev, compacto }: { ev: EventoJuego; compacto?: boolean }) {
  const { dispatch } = useGame();
  const plazo = ev.venceEn === 1 ? "1 día" : `${ev.venceEn} días`;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`club-event-card rounded-xl border border-line bg-panel ${compacto ? "p-2.5" : "p-3"} shadow-sm`}>
      <div className="flex items-center gap-2">
        <I n={ICONO_TIPO[ev.tipo] ?? "phone"} className="h-4 w-4 text-gold" />
        <span className="font-display text-base leading-tight tracking-wide text-cream">{ev.titulo}</span>
        <span className="ml-auto font-cond text-[10px] uppercase text-mut" title={`Vence en ${plazo}`} aria-label={`Vence en ${plazo}`}>{ev.venceEn}d</span>
      </div>
      <div className="mt-0.5 font-cond text-[11px] uppercase tracking-wide text-gold">{ev.de}</div>
      <p className="mt-1 font-cond text-sm leading-snug text-sand">{ev.texto}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ev.opciones.map((op, i) => (
          <button key={i}
            onClick={() => { dispatch({ type: "EVENTO", id: ev.id, opcion: i }); }}
            aria-label={op.texto}
            className={`btn-poster max-w-full whitespace-normal px-3 py-1 text-sm leading-tight cursor-pointer ${i === 0
              ? "border border-[#ffe0a0]/50 bg-gold text-ink"
              : "border border-line bg-panel2 text-sand hover:border-line2"}`}>
             <span>{op.texto}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

interface DockLateralProps {
  pestana?: PestanaDock;
  setPestana?: (p: PestanaDock) => void;
  lado?: "escritorio" | "movil";
  onNavegarPestana?: (p: "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal") => void;
  onSeleccionarBoxeador?: (id: string) => void;
}

export default function DockLateral({
  pestana = "mensajes",
  setPestana = () => {},
  lado = "escritorio",
  onNavegarPestana,
  onSeleccionarBoxeador,
}: DockLateralProps) {
  const { state, dispatch } = useGame();
  const mensajes = state.eventos.filter(e => e.tipo !== "patrocinio");
  const patrocinios = state.eventos.filter(e => e.tipo === "patrocinio");
  const consejosPendientes = state.consejos.filter(c => !c.reclamado && !c.archivado);
  const [verHistorial, setVerHistorial] = useState(false);
  const consejosActivos = verHistorial ? state.consejos.filter(c => c.reclamado || c.archivado) : consejosPendientes;
  const consejosListos = consejosPendientes.filter(c => c.cumplido && objetivoConsejo(c.id));
  const esEscritorio = lado === "escritorio";
  const panelAmplio = useResponsiveCapacity("(min-width: 1280px) and (min-height: 720px)");
  const [movilAbierto, setMovilAbierto] = useState(false);
  const [paginaConsejos, setPaginaConsejos] = useState(0);
  const consejosPorPagina = esEscritorio && panelAmplio ? 4 : 2;
  useEffect(() => setPaginaConsejos(p => Math.min(p, Math.max(0, Math.ceil(consejosActivos.length / consejosPorPagina) - 1))), [consejosActivos.length, consejosPorPagina]);
  const consejosVisibles = consejosActivos.slice(paginaConsejos * consejosPorPagina, paginaConsejos * consejosPorPagina + consejosPorPagina);

  // Inteligencia Contextual: Detección proactiva del estado del plantel
  const alumnoListoParaFederar = alumnosActivos(state).find(b => puedeHabilitar(b, state));
  const saldoCritico = state.dinero < 300;
  const hayPendientes = mensajes.length > 0 || patrocinios.length > 0 || consejosListos.length > 0 || !!alumnoListoParaFederar;

  const tabs: { id: PestanaDock; nombre: string; icono: string; badge: number }[] = [
    { id: "mensajes", nombre: "Mensajes", icono: "phone", badge: mensajes.length },
    { id: "patrocinios", nombre: "Patrocinios", icono: "case", badge: patrocinios.length },
    { id: "prensa", nombre: "Prensa", icono: "mic", badge: 0 },
    { id: "consejos", nombre: "Don Anselmo", icono: "cap", badge: consejosListos.length + (alumnoListoParaFederar ? 1 : 0) },
  ];

  const contenido = (
    <div className="h-full min-h-0 space-y-2 overflow-y-auto scroll-fino p-2.5 select-none">
      {/* PESTAÑA: MENSAJES Y DESAFÍOS */}
      {pestana === "mensajes" && (
        <>
          {mensajes.length === 0 && (
            <p className="px-1 py-6 text-center font-cond text-sm italic text-mut">
              No hay asuntos pendientes. Los desafíos y oportunidades llegan durante la semana.
            </p>
          )}
          {mensajes.map(ev => <TarjetaEvento key={ev.id} ev={ev} compacto={esEscritorio} />)}
        </>
      )}

      {/* PESTAÑA: SPONSORS Y PATROCINIOS */}
      {pestana === "patrocinios" && (
        <>
          {state.patrocinio && (
            <div className="border border-gold2/60 bg-gold/10 p-3 shadow-sm">
              <div className="flex items-center gap-2 font-display text-lg text-gold">
                <I n="case" className="h-4 w-4" /> {state.patrocinio.nombre}
              </div>
              <p className="font-cond text-sm text-sand">
                Contrato activo: {fmt(state.patrocinio.semanal)}/semana · {state.patrocinio.semanas} semana(s) restante(s). Se liquida cada domingo.
              </p>
            </div>
          )}
          {patrocinios.map(ev => <TarjetaEvento key={ev.id} ev={ev} compacto={esEscritorio} />)}
          {!state.patrocinio && patrocinios.length === 0 && (
            <p className="px-1 py-6 text-center font-cond text-sm italic text-mut">
              Las marcas aparecen cuando tu fama llega a 10. El Jefe de Difusión mejora las ofertas.
            </p>
          )}
        </>
      )}

      {/* PESTAÑA: PRENSA Y NOTICIAS */}
      {pestana === "prensa" && (
        <>
          <div className="flex items-center gap-2 px-1 pb-1">
            <I n="mic" className="h-4 w-4 text-blood" />
            <span className="font-display text-lg tracking-wide text-cream">Noticias del Ring</span>
          </div>
          {state.prensa.length === 0 && (
            <p className="px-1 py-6 text-center font-cond text-sm italic text-mut">
              Todavía no hablan de vos. Ganá peleas u organizá veladas para salir en los diarios.
            </p>
          )}
          {state.prensa.map(n => (
            <div key={n.id} className="border border-line bg-panel p-2.5 shadow-sm">
              <div className="font-cond text-[10px] uppercase tracking-widest text-mut">Semana {n.semana}</div>
              <p className="font-cond text-sm leading-snug text-sand">{n.texto}</p>
            </div>
          ))}
        </>
      )}

      {/* PESTAÑA: CONSEJOS TÁCTICOS DE DON ANSELMO */}
      {pestana === "consejos" && (
        <>
          {/* Tarjeta de Don Anselmo */}
          <div className="border border-line bg-panel p-3 shadow-sm">
            <div className="flex items-center gap-2 font-display text-lg text-cream">
              <I n="cap" className="h-4 w-4 text-gold" /> Don Anselmo, el viejo del club
            </div>
            <p className="mt-1 font-cond text-sm italic leading-snug text-sand">
              "Te vi llegar con las manos vacías y el corazón lleno. Cumplí mis hitos y te regalo fama, que es la moneda del barrio."
            </p>
          </div>

          {/* Banner Táctico Proactivo: Alumno listo para Federar (Aporte Local) */}
          {alumnoListoParaFederar && (
            <div
              onClick={() => {
                if (onSeleccionarBoxeador) onSeleccionarBoxeador(alumnoListoParaFederar.id);
              }}
              className="border-2 border-gold bg-gold/15 p-3 shadow-md transition-all hover:bg-gold/25 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-cond text-[11px] uppercase tracking-wider text-gold font-bold">
                <I n="spark" className="h-3.5 w-3.5" /> ¡10/10 Guanteos Completados!
              </div>
              <p className="font-display text-base text-cream mt-0.5">
                {alumnoListoParaFederar.nombre} está listo para competir oficialmente.
              </p>
              <p className="font-cond text-xs text-sand mt-0.5 leading-tight">
                Abrí su ficha técnica para tramitar su licencia amateur ($200).
              </p>
            </div>
          )}

          {/* Alerta Financiera Táctica (Aporte Local) */}
          {saldoCritico && (
            <div className="border border-blood/60 bg-blood/10 p-2.5 shadow-sm">
              <div className="flex items-center gap-1 font-cond text-xs uppercase text-[#ff8a7e] font-bold">
                <I n="fire" className="h-3.5 w-3.5" /> Precaución Financiera
              </div>
              <p className="font-cond text-xs text-sand mt-0.5">
                Fondos por debajo de $300. Cuidado con los salarios del personal en el balance del domingo.
              </p>
              {!state.prestamo && <button onClick={() => dispatch({ type: "PEDIR_PRESTAMO" })} className="mt-2 btn-poster border border-gold2/60 bg-gold/15 px-2.5 py-1 font-cond text-xs text-gold cursor-pointer">Pedir préstamo de emergencia · $500</button>}
              {state.prestamo && <p className="mt-1 font-cond text-[11px] text-gold">Préstamo activo: quedan {state.prestamo.semanasRestantes} cuotas de {fmt(state.prestamo.cuota)}.</p>}
            </div>
          )}

          {/* Hitos Canónicos de Don Anselmo */}
          <button className="btn-poster border border-line px-2 py-1 text-xs text-sand" onClick={() => { setVerHistorial(v => !v); setPaginaConsejos(0); }}>{verHistorial ? "Ver hitos pendientes" : "Ver historial de hitos"}</button>
          {verHistorial && <p className="font-cond text-xs text-mut">Los hitos duplicados se archivan sin nuevo pago. Los cobros anteriores se conservan.</p>}
          {consejosVisibles.map(c => (
            <div key={c.id} className={`border p-2.5 shadow-sm ${c.reclamado ? "border-line bg-panel opacity-60" : c.cumplido ? "border-gold2/70 bg-gold/10" : "border-line bg-panel"}`}>
              <p className="font-cond text-sm leading-snug text-sand">{c.texto}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-cond text-[11px] uppercase tracking-wide text-mut">Recompensa: +{c.fama} fama{c.dinero ? ` · ${c.dinero} pesos` : ""}</span>
                {c.reclamado ? <span className="font-cond text-[11px] uppercase text-win">Cobrado</span>
                  : c.archivado ? <span className="font-cond text-[11px] uppercase text-mut" title={c.motivoArchivo}>Archivado · sin cobro</span>
                  : !objetivoConsejo(c.id) ? <span className="font-cond text-[11px] uppercase text-mut">Hito no reconocido</span>
                  : !c.cumplido ? <span className="font-cond text-[11px] uppercase text-mut">Pendiente</span> : (
                    <button onClick={() => { notificacion(); dispatch({ type: "RECLAMAR_CONSEJO", id: c.id }); }}
                      className="btn-poster guia-luminica border border-[#ffe0a0]/50 bg-gold px-2.5 py-0.5 text-sm text-ink cursor-pointer">
                      <span>Cobrar</span>
                    </button>
                  )}
              </div>
            </div>
          ))}
          {consejosActivos.length > consejosPorPagina && (
            <div className="flex items-center justify-center gap-2 pt-1 font-cond text-xs text-mut">
              <button className="btn-poster border border-line px-2 py-1 disabled:opacity-40" disabled={paginaConsejos === 0} onClick={() => setPaginaConsejos(p => Math.max(0, p - 1))}>Anterior</button>
              <span>{paginaConsejos + 1} / {Math.ceil(consejosActivos.length / consejosPorPagina)}</span>
              <button className="btn-poster border border-gold2/50 px-2 py-1 text-gold disabled:opacity-40" disabled={(paginaConsejos + 1) * consejosPorPagina >= consejosActivos.length} onClick={() => setPaginaConsejos(p => p + 1)}>Más consejos</button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (esEscritorio) {
    return (
      <aside className="club-panel anim-dock flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl select-none"
        style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2 border-b border-line bg-panel2/70 px-3 py-2">
            <span className={`grid h-7 w-7 place-items-center border ${hayPendientes ? "border-gold text-gold" : "border-line2 text-sand"}`} title={hayPendientes ? "Hay decisiones o consejos pendientes" : "No hay decisiones pendientes"}>
              <I n="phone" className="h-4 w-4" />
            </span>
            <span className="font-display text-lg tracking-wide text-cream">Panel del Club</span>
          {hayPendientes && <span className="ml-auto h-2 w-2 rounded-full bg-blood" title="Hay asuntos pendientes" />}
        </div>
        <div className="grid grid-cols-4 border-b border-line">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setPestana(t.id)}
            aria-label={`${t.nombre}${t.badge > 0 ? `, ${t.badge} ${t.badge === 1 ? "pendiente" : "pendientes"}` : ""}`}
            title={t.badge > 0 ? `${t.badge} ${t.badge === 1 ? "asunto pendiente" : "asuntos pendientes"}` : t.nombre}
            className={`relative flex flex-col items-center gap-0.5 rounded-t-lg border-b-2 px-1 py-2 transition-colors cursor-pointer ${pestana === t.id ? "border-gold bg-gold/10 text-gold" : "border-transparent text-mut hover:text-sand"}`}>
              <I n={t.icono} className="h-4 w-4" />
              <span className="font-cond text-[10px] uppercase tracking-wide">{t.nombre}</span>
              {t.badge > 0 && <span className="absolute right-1.5 top-1 grid h-4 min-w-4 place-items-center bg-blood px-0.5 font-cond text-[10px] text-cream">{t.badge}</span>}
            </button>
          ))}
        </div>
        {contenido}
      </aside>
    );
  }

  // Versión compacta para pantallas móviles
  return (
    <div className="rounded-t-2xl border-t border-line bg-panel/95 select-none shadow-[0_-12px_28px_rgba(0,0,0,.25)]">
      <div className="grid grid-cols-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => {
            if (movilAbierto && pestana === t.id) setMovilAbierto(false);
            else { setPestana(t.id); setMovilAbierto(true); }
          }}
            aria-label={`${t.nombre}${t.badge > 0 ? `, ${t.badge} ${t.badge === 1 ? "pendiente" : "pendientes"}` : ""}`}
            aria-expanded={movilAbierto && pestana === t.id}
            title={t.badge > 0 ? `${t.badge} ${t.badge === 1 ? "asunto pendiente" : "asuntos pendientes"}` : t.nombre}
            className={`relative flex items-center justify-center gap-1.5 border-t-2 px-2 py-2 cursor-pointer ${pestana === t.id ? "border-gold bg-gold/10 text-gold" : "border-transparent text-mut"}`}>
            <I n={t.icono} className="h-4 w-4" />
            <span className="font-cond text-[11px] uppercase">{t.nombre}</span>
            {t.badge > 0 && <span className="grid h-4 min-w-4 place-items-center bg-blood px-0.5 font-cond text-[10px] text-cream">{t.badge}</span>}
          </button>
        ))}
      </div>
      <AnimatePresence>
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: movilAbierto ? 220 : 0, opacity: movilAbierto ? 1 : 0 }} className="overflow-hidden border-t border-line">
          {contenido}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { DockLateral, DockLateral as Phone };
