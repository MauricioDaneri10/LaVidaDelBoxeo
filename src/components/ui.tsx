import React, { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Atributos, Pugilista } from "../game/types";

// ============================================================================
// CONTRATOS DE UI AUXILIARES
// ============================================================================
export interface MensajeToast {
  id: number;
  texto: string;
  tono?: "oro" | "ok" | "alerta" | "info";
  tiempo?: number;
}

// ============================================================================
// DICCIONARIO VECTORIAL CANÓNICO (GITHUB - PATH STRINGS)
// ============================================================================
const ICONOS: Record<string, string[]> = {
  glove: ["M6.5 12V9a5.5 5.5 0 0 1 11 0v3", "M6.5 11.5h9a3.5 3.5 0 0 1 3.5 3.5v.5a4 4 0 0 1-4 4h-5a3.5 3.5 0 0 1-3.5-3.5z", "M9.5 19.5V21h6v-1.5"],
  coin: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 6.5v11", "M14.8 8.6c-.5-.8-1.6-1.2-2.8-1.2-1.6 0-2.8.8-2.8 2s1 1.7 2.8 2 2.8.9 2.8 2-1.2 2-2.8 2c-1.2 0-2.3-.5-2.8-1.2"],
  star: ["M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"],
  phone: ["M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5z", "M10.5 18.5h3"],
  calendar: ["M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z", "M3 10h18", "M8 3.5V7", "M16 3.5V7"],
  ring: ["M3 21h18", "M5 21V9l7-4.5L19 9v12", "M5 12.5h14", "M5 16.5h14"],
  map: ["M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z", "M9 4.5v13", "M15 6.5v13"],
  users: ["M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5", "M15.5 7.5a3 3 0 1 1 2 5.2", "M17 14.7c2.3.4 3.7 2.2 4 5.3"],
  cart: ["M4 5h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h7.8a1.5 1.5 0 0 0 1.5-1.2L21 8H7", "M10 20.5a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z", "M17.5 20.5a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"],
  user: ["M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4.5 20.5c.7-4 3.7-6 7.5-6s6.8 2 7.5 6"],
  case: ["M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z", "M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8", "M3 13h18"],
  house: ["M4 21V10.5L12 4l8 6.5V21", "M9.5 21v-6h5v6"],
  store: ["M3.5 7.5L5.5 3.5h13l2 4", "M3.5 7.5h17v3a2.8 2.8 0 0 1-5.6 0 2.9 2.9 0 0 1-5.8 0 2.8 2.8 0 0 1-5.6 0z", "M5 13.5V20.5h14v-7", "M9.5 20.5v-5h5v5"],
  plot: ["M4 20.5h16", "M4 20.5V9l8-5 8 5v11.5", "M4 9h16", "M12 4v5.5", "M8 20.5v-6h8v6"],
  trophy: ["M8 4.5h8V9a4 4 0 0 1-8 0z", "M8 5.5H5v1.5a3 3 0 0 0 3 3", "M16 5.5h3V7a3 3 0 0 1-3 3", "M12 13v3.5", "M8.5 20.5h7", "M10 20.5v-4h4v4"],
  bolt: ["M13 2.5L4.5 13.5H11l-1 8L18.5 10H12z"],
  spark: ["M12 3v3.5", "M12 17.5V21", "M3 12h3.5", "M17.5 12H21", "M5.8 5.8l2.4 2.4", "M15.8 15.8l2.4 2.4", "M5.8 18.2l2.4-2.4", "M15.8 8.2l2.4-2.4"],
  play: ["M8.5 5.5v13l10-6.5z"],
  ff: ["M4 5.5v13l7.5-6.5z", "M12.5 5.5v13L20 12z"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  check: ["M4.5 12.5l5 5L19.5 7"],
  chevR: ["M9.5 6l6 6-6 6"],
  up: ["M12 19.5v-15", "M5.5 11L12 4.5 18.5 11"],
  cap: ["M2.5 9.5L12 5l9.5 4.5L12 14z", "M6.5 11.5v4.5c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.5", "M21.5 9.5v5"],
  shirt: ["M8.5 3.5L12 5.5l3.5-2 4.5 3-2 3.5-1.5-1v11.5h-9V9L6 10 4 6.5z"],
  bed: ["M3 19V7", "M3 13h18v6", "M3 16.5h18", "M6.5 13v-2.5h6V13"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3.5 2"],
  dumbbell: ["M6.5 7v10", "M17.5 7v10", "M3.5 9.5v5", "M20.5 9.5v5", "M6.5 12h11"],
  target: ["M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z", "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z", "M12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"],
  heart: ["M12 20.5S4 15.5 4 9.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8c0 5.7-8 10.7-8 10.7z"],
  flag: ["M5 21.5V4", "M5 4.5c3-1.8 6 1.8 9 0s4-1 5-.3V14c-1-.7-2-1.3-5 .5s-6-1.8-9 0"],
  fire: ["M12 21.5c3.9 0 6.5-2.5 6.5-6.2 0-3.2-2-5-3.4-7.3-.5 1.6-1.2 2.4-2.3 3C11.6 8.6 11 6 11.5 3.5 8 6 5.5 9.5 5.5 13.5c0 4.5 2.6 8 6.5 8z"],
  rope: ["M12 3v4", "M7 7.5h10", "M8 7.5c-2 4-2 7 0 10", "M16 7.5c2 4 2 7 0 10", "M8 17.5h8", "M12 17.5V21"],
  boot: ["M7 3.5h7v8l4.5 3.5a2.5 2.5 0 0 1-1.5 4.5H5.5A1.5 1.5 0 0 1 4 18V16c2.5-.5 3-2.5 3-5z", "M7 8h7"],
  shield: ["M12 3.5l7 2.5v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z", "M9 11.5l2.2 2.2L15.5 9"],
  bell: ["M12 4a5.5 5.5 0 0 1 5.5 5.5V14l1.5 3H5l1.5-3V9.5A5.5 5.5 0 0 1 12 4z", "M10 20a2 2 0 0 0 4 0", "M12 2.5V4"],
  volume: ["M4 9v6h4l5 4V5L8 9z", "M16 9.5a4 4 0 0 1 0 5", "M18.5 7a7 7 0 0 1 0 10"],
  download: ["M12 4v10", "M8 10.5l4 4 4-4", "M5 19.5h14"],
  upload: ["M12 15V5", "M8 8.5l4-4 4 4", "M5 19.5h14"],
  gear: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M12 2.5v3", "M12 18.5v3", "M2.5 12h3", "M18.5 12h3", "M5.3 5.3l2.1 2.1", "M16.6 16.6l2.1 2.1", "M5.3 18.7l2.1-2.1", "M16.6 7.4l2.1-2.1"],
  dice: ["M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M8.5 8.5h.01", "M15.5 8.5h.01", "M12 12h.01", "M8.5 15.5h.01", "M15.5 15.5h.01"],
  cards: ["M7 4.5h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z", "M10.5 3l8 2-2 13.5", "M9.5 9.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z"],
  mic: ["M12 3.5a3 3 0 0 1 3 3V11a3 3 0 0 1-6 0V6.5a3 3 0 0 1 3-3z", "M6.5 11a5.5 5.5 0 0 0 11 0", "M12 16.5v3", "M9 21.5h6"],
  tv: ["M4 6.5h16a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1z", "M8.5 21.5h7", "M12 19v2.5", "M8 3.5l4 3 4-3"],
  scale: ["M12 4v16", "M7 20h10", "M4 7h16", "M6.5 7L4 12.5a2.8 2.8 0 0 0 5 0z", "M17.5 7L15 12.5a2.8 2.8 0 0 0 5 0z"],
  medal: ["M12 13.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M8.5 14.5L6 3.5h4l2 5 2-5h4l-2.5 11"],
};

// Renderizador canónico de iconos por nombre
export function I({ n, className = "w-4 h-4" }: { n: string; className?: string }) {
  const paths = ICONOS[n] ?? ICONOS.spark;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

// Botón canónico de estilo póster de imprenta
export function Btn({ children, onClick, disabled, variant = "blood", className = "", small, pulso }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "blood" | "gold" | "ghost" | "dark" | "neon"; className?: string; small?: boolean; pulso?: boolean;
}) {
  const bg = variant === "blood" ? "bg-blood text-cream border border-[#ff6b5e]/40"
    : variant === "gold" ? "bg-gold text-ink border border-[#ffe0a0]/50"
    : variant === "neon" ? "bg-neonc text-ink border border-[#a0fff2]/50"
    : variant === "dark" ? "bg-panel2 text-cream border border-line2"
    : "bg-transparent text-sand border border-line hover:border-gold2";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn-poster ${bg} ${small ? "px-3 py-1 text-sm" : "px-4 py-1.5 text-lg"} ${className} ${pulso ? "guia-luminica" : ""}`}>
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}

// Chip de estado editorial
export function Chip({ children, tone = "mut" }: { children: ReactNode; tone?: "mut" | "gold" | "blood" | "win" | "neon" }) {
  const c = tone === "gold" ? "text-gold border-gold2/60 bg-gold/10"
    : tone === "blood" ? "text-[#ff8a7e] border-blood/60 bg-blood/10"
    : tone === "win" ? "text-win border-win/50 bg-win/10"
    : tone === "neon" ? "text-neonc border-neonc/50 bg-neonc/10"
    : "text-sand border-line2 bg-panel2";
  return <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider font-cond ${c}`}>{children}</span>;
}

// Barra de estadísticas
export function BarraStat({ v, color = "auto" }: { v: number; color?: string }) {
  const c = v >= 75 ? "var(--color-blood)" : v >= 50 ? "var(--color-gold)" : "var(--color-sand)";
  return (
    <div className="stat-bar w-full">
      <i style={{ width: `${Math.min(100, v)}%`, background: color === "auto" ? c : color }} />
    </div>
  );
}

// Fila de estadística con etiqueta y valor
export function FilaStat({ label, v }: { label: string; v: number }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-2">
      <span className="min-w-0 truncate font-cond text-[12px] uppercase tracking-wide text-sand">{label}</span>
      <BarraStat v={v} color="auto" />
      <span className="text-right font-cond text-sm font-bold text-cream">{Math.round(v)}</span>
    </div>
  );
}

// Modal con animación Framer Motion
export function Modal({ title, icon, onClose, children, wide, fit }: {
  title: ReactNode; icon?: string; onClose?: () => void; children: ReactNode; wide?: boolean; fit?: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.92, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className={`panel relative flex w-full flex-col ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[calc(100vh-2rem)] overflow-hidden scroll-fino hard-shadow`}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel2/95 px-5 py-3 backdrop-blur-sm">
            <h3 className="font-display flex items-center gap-2 text-2xl tracking-wide text-gold">
              {icon && <I n={icon} className="h-5 w-5" />}{title}
            </h3>
            {onClose && (
              <button onClick={onClose} aria-label="Cerrar ventana" title="Cerrar" className="rounded-lg p-1 text-mut transition-colors hover:bg-blood/10 hover:text-blood"><I n="x" className="h-5 w-5" /></button>
            )}
          </div>
          <div className={`min-h-0 flex-1 ${fit ? "overflow-hidden p-3" : "overflow-y-auto scroll-fino p-4 sm:p-5"}`}>{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Barra de Energía con rayo
export function BarraEnergia({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <I n="bolt" className={`h-3.5 w-3.5 ${v < 40 ? "text-blood" : "text-gold"}`} />
      <div className="stat-bar w-14"><i style={{ width: `${v}%`, background: v < 40 ? "var(--color-blood)" : "var(--color-win)" }} /></div>
      <span className="font-cond text-xs text-sand">{Math.round(v)}</span>
    </div>
  );
}

// ============================================================================
// COMPONENTES EXTENDIDOS Y WIDGETS AVANZADOS (INCORPORADOS DE FUENTE LOCAL)
// ============================================================================

export const Iconos = {
  guante: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 10c0-3.9-3.1-7-7-7S5 6.1 5 10c0 2.5 1.3 4.7 3.2 6L9 21h6l.8-5c1.9-1.3 3.2-3.5 3.2-6z" />
      <path d="M9 13a3 3 0 0 0 6 0" />
      <path d="M7 21h10" />
    </svg>
  ),
  cinturon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="7" width="20" height="10" rx="3" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
      <path d="M7 7v10M17 7v10" />
    </svg>
  ),
  trofeo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v6a6 6 0 0 1-12 0V4z" />
    </svg>
  ),
  moneda: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2.5-2.5 2.5s-2.5 1-2.5 2.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  ),
  estrella: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  fuego: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  diana: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  rayo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  escudo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  pesas: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12" />
    </svg>
  ),
  corazon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  telefono: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
    </svg>
  ),
  tienda: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  usuario: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  corona: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 18h18v2H3zM4 15l3-8 5 4 5-4 3 8H4z" />
    </svg>
  ),
  verificado: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2l3.09 2.26L19 4l1.24 3.73L23 10l-1.74 3.27L22 17l-3.66.74L17 21l-3.73-1.24L10 22l-2.26-3.09L4 18l-.74-3.66L1 12l2.26-3.09L3 5l3.66-.74L9 1z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  altavoz: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  altavozSilencio: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ),
  campana: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

// ============================================================================
// ICONOS VECTORIALES DEDICADOS PARA ARTÍCULOS DEL MERCADO
// ============================================================================

export function IconoArticuloMercado({ id }: { id: string }) {
  switch (id) {
    case "sacosCueroPro":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <line x1="20" y1="2" x2="20" y2="10" stroke="#64748b" strokeWidth="2" />
          <rect x="12" y="10" width="16" height="26" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="16" y1="18" x2="24" y2="18" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="16" y1="24" x2="24" y2="24" stroke="#ef4444" strokeWidth="1.5" />
        </svg>
      );
    case "peraVelocidad":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <rect x="6" y="4" width="28" height="4" rx="2" fill="#334155" />
          <line x1="20" y1="8" x2="20" y2="14" stroke="#64748b" strokeWidth="1.5" />
          <ellipse cx="20" cy="24" rx="9" ry="12" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
      );
    case "guantesCompeticion":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <rect x="10" y="8" width="20" height="24" rx="8" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
          <path d="M12 18 Q20 22 28 18" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <rect x="13" y="28" width="14" height="6" rx="2" fill="#0f172a" />
        </svg>
      );
    case "botasProfesionales":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <path d="M14 6 L22 6 L22 22 L32 26 L32 32 L12 32 L12 10 Z" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="15" y1="12" x2="21" y2="12" stroke="#64748b" strokeWidth="1.5" />
          <line x1="15" y1="16" x2="21" y2="16" stroke="#64748b" strokeWidth="1.5" />
        </svg>
      );
    case "batinesSeda":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <path d="M8 8 L32 8 L36 20 L30 20 L28 34 L12 34 L10 20 L4 20 Z" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
          <polygon points="14,8 20,22 26,8" fill="#fbbf24" opacity="0.3" />
          <line x1="12" y1="22" x2="28" y2="22" stroke="#fbbf24" strokeWidth="1.5" />
        </svg>
      );
    case "crioterapia":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <rect x="8" y="10" width="24" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="20,14 23,20 17,20" fill="#38bdf8" />
          <polygon points="20,28 23,22 17,22" fill="#38bdf8" />
          <line x1="14" y1="21" x2="26" y2="21" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );
    case "suplementosElite":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <rect x="14" y="4" width="12" height="6" rx="2" fill="#1e293b" />
          <rect x="10" y="10" width="20" height="24" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <text x="20" y="24" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">WHEY</text>
        </svg>
      );
    case "botiquinCompleto":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <rect x="6" y="10" width="28" height="22" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
          <rect x="14" y="6" width="12" height="4" rx="2" fill="#334155" />
          <rect x="18" y="14" width="4" height="14" fill="#ef4444" />
          <rect x="13" y="19" width="14" height="4" fill="#ef4444" />
        </svg>
      );
    case "zonaEliteVIP":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <polygon points="6,12 34,12 30,32 10,32" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
          <polygon points="20,16 23,22 30,22 24,26 26,32 20,28 14,32 16,26 10,22 17,22" fill="#fbbf24" />
        </svg>
      );
    case "tiendaIndumentaria":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <polygon points="4,12 36,12 32,28 8,28" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="8" y1="12" x2="12" y2="28" stroke="#3b82f6" strokeWidth="2" />
          <line x1="20" y1="12" x2="20" y2="28" stroke="#3b82f6" strokeWidth="2" />
          <line x1="32" y1="12" x2="28" y2="28" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      );
    case "estudioRopaPropia":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <circle cx="20" cy="10" r="5" fill="#334155" />
          <polygon points="12,18 28,18 24,34 16,34" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <line x1="20" y1="18" x2="20" y2="34" stroke="#10b981" strokeWidth="1.5" />
        </svg>
      );
    case "carteleriaLuminosa":
      return (
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <rect x="4" y="10" width="32" height="20" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1.8" />
          <text x="20" y="23" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle">NEON</text>
        </svg>
      );
    default:
      return <Iconos.guante className="w-8 h-8 text-slate-300" />;
  }
}

// ============================================================================
// RETRATO / CARA VECTORIAL GENERATIVA DEL BOXEADOR (ESTILO MINIMALISTA PULIDO)
// ============================================================================

type DatosRostro = Partial<Pugilista> & {
  tonoPiel?: string;
  colorPantalon?: string;
  cortePelo?: number;
  tieneBarba?: boolean;
  tieneCicatriz?: boolean;
};

export function RostroBoxeador({ atleta, className = "w-14 h-14" }: { atleta: DatosRostro; className?: string }) {
  const tonoPiel = atleta.piel || atleta.tonoPiel || "#e2a77a";
  const cortePelo = atleta.cortePelo ?? 1;
  const tieneBarba = atleta.tieneBarba ?? false;
  const tieneCicatriz = atleta.tieneCicatriz ?? false;

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#0c1017] border border-slate-700/80 flex items-center justify-center shadow-lg ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#111622" />
        <rect x="38" y="68" width="24" height="20" fill={tonoPiel} />
        <path d="M20 85 L35 75 L65 75 L80 85 L85 100 L15 100 Z" fill={atleta.pantalon || atleta.colorPantalon || "#ef4444"} stroke="#000" strokeWidth="1.5" />

        <ellipse cx="50" cy="48" rx="24" ry="28" fill={tonoPiel} />
        <ellipse cx="25" cy="48" rx="4" ry="7" fill={tonoPiel} />
        <ellipse cx="75" cy="48" rx="4" ry="7" fill={tonoPiel} />

        {cortePelo === 1 && (
          <path d="M26 40 Q50 18 74 40 L72 32 Q50 14 28 32 Z" fill="#0f172a" />
        )}
        {cortePelo === 2 && (
          <path d="M25 40 Q50 10 75 40 Q50 25 25 40" fill="#1e293b" />
        )}
        {cortePelo === 3 && (
          <g fill="#0f172a">
            <circle cx="32" cy="26" r="8" />
            <circle cx="44" cy="22" r="9" />
            <circle cx="56" cy="22" r="9" />
            <circle cx="68" cy="26" r="8" />
          </g>
        )}
        {cortePelo === 4 && (
          <g>
            <path d="M25 38 Q50 18 75 38" stroke="#0f172a" strokeWidth="8" fill="none" />
            <path d="M24 38 Q50 28 76 38" stroke="#ef4444" strokeWidth="4" fill="none" />
          </g>
        )}

        <line x1="34" y1="40" x2="45" y2="42" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="55" y1="42" x2="66" y2="40" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

        <ellipse cx="39" cy="47" rx="3.5" ry="2.5" fill="#020617" />
        <ellipse cx="61" cy="47" rx="3.5" ry="2.5" fill="#020617" />
        <circle cx="38" cy="46" r="1" fill="#ffffff" />
        <circle cx="60" cy="46" r="1" fill="#ffffff" />

        <path d="M50 44 L48 55 L53 55" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
        <line x1="42" y1="62" x2="58" y2="62" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />

        {tieneBarba && (
          <path d="M38 65 Q50 78 62 65 Q50 70 38 65" fill="#0f172a" />
        )}
        {tieneCicatriz && (
          <line x1="35" y1="36" x2="40" y2="44" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// CONTENEDOR TOAST PARA NOTIFICACIONES FLOTANTES (MINIMALISTA)
// ============================================================================

export function ContenedorToast({
  toasts,
  onCerrar,
}: {
  toasts: MensajeToast[];
  onCerrar: (id: number) => void;
}) {
  useEffect(() => {
    const timers = toasts.map(t => window.setTimeout(() => onCerrar(t.id), t.tiempo ?? 4200));
    return () => timers.forEach(window.clearTimeout);
  }, [toasts, onCerrar]);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence initial={false}>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={`pointer-events-auto px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-bold transition-all duration-300 ${
            t.tono === "oro"
              ? "bg-[#141208]/95 text-amber-300 border-amber-500/50 shadow-black/80"
              : t.tono === "ok"
              ? "bg-[#08140f]/95 text-emerald-300 border-emerald-500/50 shadow-black/80"
              : t.tono === "alerta"
              ? "bg-[#140808]/95 text-rose-300 border-rose-500/50 shadow-black/80"
              : "bg-[#0e131d]/95 text-slate-200 border-slate-700/80 shadow-black/80"
          }`}
        >
          <span>{t.texto}</span>
          <button
            onClick={() => onCerrar(t.id)}
            className="text-slate-400 hover:text-white text-xs font-bold ml-2 cursor-pointer p-1"
          >
            ✕
          </button>
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// BOTONES HOLOGRÁFICOS UNIFICADOS CON INTEGRACIÓN DE TUTORIAL TITILANTE
// ============================================================================

export function BotonBrillante({
  children,
  onClick,
  variante = "primario",
  className = "",
  disabled = false,
  title,
  isTutorialHighlight = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "dorado" | "peligro" | "azul";
  className?: string;
  disabled?: boolean;
  title?: string;
  isTutorialHighlight?: boolean;
}) {
  const [enCooldown, setEnCooldown] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || enCooldown || !onClick) return;
    setEnCooldown(true);
    onClick();
    setTimeout(() => setEnCooldown(false), 300);
  };

  // Estilo Base Holográfico Cristalino
  const baseHolo = "relative overflow-hidden transition-all duration-200 backdrop-blur-md rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none active:scale-[0.98]";

  const estilos = {
    primario: "bg-white/90 hover:bg-white text-black font-extrabold border border-white shadow-lg shadow-white/10 hover:shadow-white/20",
    secundario: "bg-white/[0.05] hover:bg-white/[0.12] text-slate-100 border border-white/15 hover:border-white/35 shadow-md shadow-black/40",
    dorado: "bg-amber-400 hover:bg-amber-300 text-black font-black border border-amber-300 shadow-lg shadow-amber-950/40",
    peligro: "bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/50 shadow-lg shadow-rose-950/40",
    azul: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/60 shadow-lg shadow-blue-950/40",
  };

  const haloTitilante = isTutorialHighlight
    ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse scale-[1.03] shadow-[0_0_25px_rgba(251,191,36,0.8)]"
    : "";

  return (
    <button
      onClick={handleClick}
      disabled={disabled || enCooldown}
      title={title}
      className={`${baseHolo} ${estilos[variante]} ${haloTitilante} ${
        disabled || enCooldown ? "opacity-35 cursor-not-allowed grayscale pointer-events-none" : "cursor-pointer hover:-translate-y-0.5"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// TARJETA MODULAR ELEGANTE
// ============================================================================

export function TarjetaElegante({
  titulo,
  subtitulo,
  children,
  className = "",
}: {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-6 rounded-3xl bg-[#0e121a]/95 border border-slate-800/90 shadow-2xl backdrop-blur-md space-y-4 ${className}`}>
      {(titulo || subtitulo) && (
        <div className="border-b border-slate-800 pb-3.5">
          {titulo && <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-brand">{titulo}</h3>}
          {subtitulo && <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// MATRIZ DE RENDIMIENTO RADAR (11 ATRIBUTOS)
// ============================================================================

// ============================================================================
// MATRIZ DE RENDIMIENTO RADAR (11 ATRIBUTOS CANÓNICOS CON FALLBACK)
// ============================================================================
export function RadarCapacidades({ atributos, className = "" }: { atributos: Atributos | Record<string, number>; className?: string }) {
  // 11 Atributos canónicos oficiales de La Vida del Boxeo
  const llaves: string[] = [
    "fuerza", "velocidad", "potencia", "resistencia", "ataque", "defensa",
    "tecnica", "eficacia", "inteligencia", "mentalidad", "talento"
  ];
  const aliasMap: Record<string, string> = {
    potencia: "quijada",
    talento: "corazon",
    mentalidad: "disciplina",
    ataque: "juegoPiernas",
  };
  const total = llaves.length;
  const radio = 80;
  const centro = 100;

  const puntos = llaves.map((k, i) => {
    const angulo = (Math.PI * 2 / total) * i - Math.PI / 2;
    const valores = atributos as Record<string, number>;
    const valRaw = valores[k] ?? valores[aliasMap[k]] ?? 50;
    const valor = Math.min(100, Math.max(10, valRaw));
    const r = (valor / 100) * radio;
    return {
      x: centro + r * Math.cos(angulo),
      y: centro + r * Math.sin(angulo),
      lx: centro + (radio + 16) * Math.cos(angulo),
      ly: centro + (radio + 16) * Math.sin(angulo),
      etiqueta: k.slice(0, 4).toUpperCase(),
      valor,
    };
  });

  const poligonoPuntos = puntos.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className={`relative w-full max-w-[240px] aspect-square mx-auto flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {[0.25, 0.5, 0.75, 1].map((pct, i) => (
          <polygon
            key={`anillo-${i}`}
            points={llaves.map((_, idx) => {
              const ang = (Math.PI * 2 / total) * idx - Math.PI / 2;
              return `${centro + (radio * pct) * Math.cos(ang)},${centro + (radio * pct) * Math.sin(ang)}`;
            }).join(" ")}
            fill="none"
            stroke="var(--color-line, #332211)"
            strokeWidth="1"
            opacity="0.8"
          />
        ))}

        {puntos.map((p, i) => (
          <line key={`eje-${i}`} x1={centro} y1={centro} x2={p.lx} y2={p.ly} stroke="var(--color-line, #332211)" strokeWidth="1" />
        ))}

        <polygon points={poligonoPuntos} fill="var(--color-gold, #e5a93b)" fillOpacity="0.25" stroke="var(--color-gold, #e5a93b)" strokeWidth="2" />

        {puntos.map((p, i) => (
          <circle key={`nodo-${i}`} cx={p.x} cy={p.y} r="2.5" fill="var(--color-cream, #faf5eb)" />
        ))}
      </svg>
    </div>
  );
}
