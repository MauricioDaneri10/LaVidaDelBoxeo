import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

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

export function I({ n, className = "w-4 h-4" }: { n: string; className?: string }) {
  const paths = ICONOS[n] ?? ICONOS.spark;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

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

export function Chip({ children, tone = "mut" }: { children: ReactNode; tone?: "mut" | "gold" | "blood" | "win" | "neon" }) {
  const c = tone === "gold" ? "text-gold border-gold2/60 bg-gold/10"
    : tone === "blood" ? "text-[#ff8a7e] border-blood/60 bg-blood/10"
    : tone === "win" ? "text-win border-win/50 bg-win/10"
    : tone === "neon" ? "text-neonc border-neonc/50 bg-neonc/10"
    : "text-sand border-line2 bg-panel2";
  return <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider font-cond ${c}`}>{children}</span>;
}

export function BarraStat({ v, color = "auto" }: { v: number; color?: string }) {
  const c = v >= 75 ? "var(--color-blood)" : v >= 50 ? "var(--color-gold)" : "var(--color-sand)";
  return (
    <div className="stat-bar w-full">
      <i style={{ width: `${Math.min(100, v)}%`, background: color === "auto" ? c : color }} />
    </div>
  );
}

export function FilaStat({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 font-cond text-[12px] uppercase tracking-wide text-sand">{label}</span>
      <BarraStat v={v} color="auto" />
      <span className="w-7 text-right font-cond text-sm font-bold text-cream">{Math.round(v)}</span>
    </div>
  );
}

export function Modal({ title, icon, onClose, children, wide }: {
  title: ReactNode; icon?: string; onClose?: () => void; children: ReactNode; wide?: boolean;
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
          className={`panel relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto scroll-fino hard-shadow`}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel2/95 px-5 py-3 backdrop-blur-sm">
            <h3 className="font-display flex items-center gap-2 text-2xl tracking-wide text-gold">
              {icon && <I n={icon} className="h-5 w-5" />}{title}
            </h3>
            {onClose && (
              <button onClick={onClose} className="text-mut transition-colors hover:text-blood"><I n="x" className="h-5 w-5" /></button>
            )}
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function BarraEnergia({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <I n="bolt" className={`h-3.5 w-3.5 ${v < 40 ? "text-blood" : "text-gold"}`} />
      <div className="stat-bar w-14"><i style={{ width: `${v}%`, background: v < 40 ? "var(--color-blood)" : "var(--color-win)" }} /></div>
      <span className="font-cond text-xs text-sand">{Math.round(v)}</span>
    </div>
  );
}
