import { motion } from "framer-motion";
import { GIMNASIOS_RIVALES, PROPIEDADES } from "../game/data";
import { fmt, genPugilista, sucursales, valoracion } from "../game/engine";
import { useGame } from "../game/state";
import type { PropiedadId } from "../game/types";
import { Btn, Chip, I } from "./ui";

interface Lugar { x: number; y: number; icono: string; nombre: string; sub: string; tono: "oro" | "sangre" | "neon" | "mut"; }

export default function MapaCiudad() {
  const { state, dispatch, nivel } = useGame();
  const nSuc = sucursales(state);

  const lugares: Lugar[] = [
    // Distrito Tradicional
    { x: 12, y: 62, icono: "glove", nombre: state.nombreGimnasio, sub: "Tu club · Nivel " + nivel, tono: "oro" },
    { x: 30, y: 30, icono: "users", nombre: GIMNASIOS_RIVALES[0], sub: "Club rival · Guanteos interclubes", tono: "sangre" },
    { x: 8, y: 26, icono: "users", nombre: GIMNASIOS_RIVALES[1], sub: "Club rival · De aquí salen prospectos", tono: "sangre" },
    { x: 34, y: 72, icono: "house", nombre: "Barrio Residencial", sub: state.propiedades.includes("mansion") ? "Tu mansión" : state.propiedades.includes("apartamento") ? "Tu apartamento" : "Viviendas en venta", tono: "mut" },
    // Distrito Comercial
    { x: 52, y: 46, icono: "cart", nombre: "Tienda de Equipamiento", sub: "Todo para el ring y el plantel", tono: "oro" },
    { x: 60, y: 24, icono: "shirt", nombre: "Paseo de las Marcas", sub: state.marcaRopa ? `Boutique "${state.marcaRopa}"` : "Espacio para tu marca de ropa", tono: "oro" },
    { x: 46, y: 74, icono: "store", nombre: "Local de la Sucursal", sub: nSuc > 0 ? `${nSuc} sucursal(es) activas` : "Ingresos pasivos semanales", tono: "neon" },
    // Distrito Financiero
    { x: 76, y: 20, icono: "house", nombre: "Inmobiliaria Central", sub: "Terrenos, locales y la Arena", tono: "neon" },
    { x: 86, y: 42, icono: "plot", nombre: "Terreno Baldío", sub: state.propiedades.includes("terreno") ? "Ya es tuyo" : "Paso previo a la sucursal", tono: "mut" },
    // Distrito Espectáculo
    { x: 78, y: 70, icono: "ring", nombre: "Arena Central", sub: state.propiedades.includes("arena") ? "¡Tu templo del boxeo!" : "El escenario máximo", tono: "sangre" },
  ];

  const comprar = (id: PropiedadId) => dispatch({ type: "COMPRAR_PROPIEDAD", id });

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Mapa de la Ciudad</h2>
        <span className="font-cond text-sm text-sand">Caja: <b className="text-gold">{fmt(state.dinero)}</b></span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {["Tradicional", "Comercial", "Financiero", "Espectáculo"].map((d, i) => (
            <Chip key={d} tone={i === 0 ? "gold" : i === 3 ? "blood" : i === 2 ? "neon" : "mut"}>{d}</Chip>
          ))}
        </div>
      </div>

      <div className="panel relative overflow-hidden" style={{ height: 520 }}>
        {/* fondo del mapa */}
        <svg viewBox="0 0 100 62" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <rect x="0" y="0" width="100" height="62" fill="#1a1510" />
          <rect x="0" y="0" width="42" height="62" fill="#201a12" />
          <rect x="42" y="0" width="26" height="62" fill="#1c1712" />
          <rect x="68" y="0" width="32" height="34" fill="#191a1f" />
          <rect x="68" y="34" width="32" height="28" fill="#231518" />
          {/* calles */}
          {[14, 30, 46, 58].map(y => <rect key={y} x="0" y={y * 0.62} width="100" height="1.1" fill="#2c241a" />)}
          {[20, 44, 68, 84].map(x => <rect key={x} x={x} y="0" width="1" height="62" fill="#2c241a" />)}
          {/* río */}
          <path d="M0 52 C 25 48, 45 56, 70 50 S 95 52, 100 48 L 100 62 L 0 62 Z" fill="#17202b" />
          <path d="M0 53 C 25 49, 45 57, 70 51 S 95 53, 100 49" fill="none" stroke="#2a3a4d" strokeWidth="0.5" />
          {/* edificios de fondo */}
          {[4, 12, 24, 36, 48, 56, 72, 80, 90].map((x, i) => (
            <g key={x}>
              <rect x={x} y={34 - (i % 4) * 5 - 8} width={5 + (i % 3)} height={(i % 4) * 5 + 8} fill="#241d14" stroke="#31281c" strokeWidth="0.25" />
              <rect x={x + 1} y={34 - (i % 4) * 5 - 6} width="1" height="1" fill="#e8b23a" opacity={0.5 + (i % 3) * 0.15} />
            </g>
          ))}
          {/* etiquetas de distrito */}
          <text x="6" y="5" fontSize="3.4" fill="#c9b896" fontFamily="Bebas Neue" letterSpacing="0.6">DISTRITO TRADICIONAL</text>
          <text x="45" y="5" fontSize="3.4" fill="#c9b896" fontFamily="Bebas Neue" letterSpacing="0.6">COMERCIAL</text>
          <text x="70" y="5" fontSize="3.4" fill="#c9b896" fontFamily="Bebas Neue" letterSpacing="0.6">FINANCIERO</text>
          <text x="70" y="39" fontSize="3.4" fill="#c9b896" fontFamily="Bebas Neue" letterSpacing="0.6">ESPECTÁCULO</text>
        </svg>

        {/* tráfico ambiental */}
        <div className="pointer-events-none absolute left-0 right-0 top-[38%] h-2 overflow-hidden opacity-60">
          <motion.div className="h-1.5 w-3 bg-gold" animate={{ x: ["-4vw", "104vw"] }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }} />
        </div>
        <div className="pointer-events-none absolute left-0 right-0 top-[62%] h-2 overflow-hidden opacity-40">
          <motion.div className="h-1.5 w-3 bg-blood" animate={{ x: ["104vw", "-4vw"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
        </div>

        {/* lugares */}
        {lugares.map(l => {
          const esMio =
            (l.nombre === state.nombreGimnasio) ||
            (l.nombre === "Terreno Baldío" && state.propiedades.includes("terreno")) ||
            (l.nombre === "Arena Central" && state.propiedades.includes("arena")) ||
            (l.nombre === "Local de la Sucursal" && nSuc > 0) ||
            (l.nombre === "Barrio Residencial" && (state.propiedades.includes("apartamento") || state.propiedades.includes("mansion")));
          const color = l.tono === "oro" ? "border-gold2 text-gold" : l.tono === "sangre" ? "border-blood/70 text-[#ff8a7e]" : l.tono === "neon" ? "border-neonc/60 text-neonc" : "border-line2 text-sand";
          return (
            <div key={l.nombre} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
              <div className="group relative flex flex-col items-center">
                <div className={`grid h-11 w-11 place-items-center border-2 bg-ink/90 transition-transform group-hover:scale-110 ${color}`}
                  style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}>
                  <I n={l.icono} className="h-5 w-5" />
                  {esMio && <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center bg-win text-ink"><I n="check" className="h-3 w-3" /></span>}
                </div>
                <div className="mt-1 max-w-[120px] text-center leading-tight">
                  <div className="font-cond text-[11px] font-semibold uppercase tracking-wide text-cream">{l.nombre}</div>
                  <div className="font-cond text-[10px] text-mut">{l.sub}</div>
                </div>
                <div className="pointer-events-none absolute -top-9 hidden whitespace-nowrap border border-line bg-ink/95 px-2 py-1 font-cond text-[10px] uppercase tracking-wide text-sand group-hover:block">
                  Distrito {l.x < 42 ? "Tradicional" : l.x < 68 ? "Comercial" : l.y < 34 ? "Financiero" : "Espectáculo"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* acciones de la ciudad */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(["terreno", "sucursal", "local", "apartamento", "mansion", "arena"] as PropiedadId[]).map(pid => {
          const pr = PROPIEDADES[pid];
          const mia = state.propiedades.includes(pid);
          return (
            <div key={pid} className={`panel p-3 ${mia ? "border-win/50" : ""}`}>
              <div className="flex items-center gap-2">
                <I n={pr.icono} className="h-4 w-4 text-gold" />
                <span className="font-display text-base tracking-wide text-cream">{pr.nombre}</span>
                <span className="ml-auto font-cond text-sm text-gold">{fmt(pr.costo)}</span>
              </div>
              {mia ? <Chip tone="win">Tuya</Chip> : (
                <Btn small variant={state.dinero >= pr.costo ? "gold" : "dark"} disabled={state.dinero < pr.costo} className="mt-2 w-full" onClick={() => comprar(pid)}>
                  Comprar
                </Btn>
              )}
            </div>
          );
        })}
        {/* scouting de clubes rivales */}
        <div className="panel p-3">
          <div className="flex items-center gap-2">
            <I n="users" className="h-4 w-4 text-blood" />
            <span className="font-display text-base tracking-wide text-cream">Scouting en clubes rivales</span>
          </div>
          <p className="mt-1 font-cond text-xs text-sand">Invitá a un talento de {GIMNASIOS_RIVALES[0]} o {GIMNASIOS_RIVALES[1]} a probarse gratis.</p>
          <Btn small variant="blood" className="mt-2 w-full" onClick={() => dispatch({ type: "SCOUT" })}>
            Enviar visor · Gratis
          </Btn>
        </div>
      </div>
      <p className="font-cond text-xs text-mut">
        Sucursales: {nSuc} · Gerentes contratados: {state.personal.filter(p => p.tipo === "gerente").length} · Ingreso pasivo por sucursal: {fmt(650 + 8 * state.fama)}/semana (requiere Gerente).
      </p>
    </div>
  );
}
