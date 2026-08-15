import { motion } from "framer-motion";
import { useState } from "react";
import { PROPIEDADES, fmt } from "../game/data";
import { sucursales } from "../game/engine";
import { useGame } from "../game/state";
import { Btn, Chip, I } from "./ui";

interface Spot { id: string; x: number; y: number; icon: string; nombre: string; }

const SPOTS: Spot[] = [
  { id: "gym", x: 30, y: 52, icon: "glove", nombre: "Tu gimnasio" },
  { id: "loma", x: 12, y: 22, icon: "glove", nombre: "Gim. La Loma" },
  { id: "ferro", x: 80, y: 64, icon: "glove", nombre: "Club Ferro" },
  { id: "tienda", x: 50, y: 36, icon: "store", nombre: "Tienda Anselmo" },
  { id: "local2", x: 64, y: 16, icon: "house", nombre: "Local Av. Central" },
  { id: "terreno", x: 88, y: 12, icon: "plot", nombre: "Terreno Norte" },
  { id: "apartamento", x: 16, y: 76, icon: "house", nombre: "Apartamento" },
  { id: "mansion", x: 88, y: 86, icon: "house", nombre: "Las Lomas" },
  { id: "arena", x: 56, y: 74, icon: "trophy", nombre: "Arena Central" },
];

export default function CityMap({ onGoMarket, onGoGym }: { onGoMarket: () => void; onGoGym: () => void }) {
  const { state, dispatch, nivel } = useGame();
  const [sel, setSel] = useState<string>("gym");
  const emp = state.courses.includes("empresarial");

  const owned = (id: string) => state.propiedades.includes(id as never);
  const spot = SPOTS.find(s => s.id === sel)!;

  const estadoDe = (id: string): { chip: string; tone: "mut" | "gold" | "win" | "blood" } => {
    if (id === "gym") return { chip: "Tu casa", tone: "blood" };
    if (id === "loma" || id === "ferro") return { chip: "Rival", tone: "mut" };
    if (id === "tienda") return { chip: "Abierta", tone: "gold" };
    if (id === "arena") return state.veladaProgramada ? { chip: "Velada este sábado", tone: "blood" } : { chip: "Disponible", tone: "mut" };
    if (id === "terreno") {
      if (owned("sucursalNorte")) return { chip: "Sucursal activa", tone: "win" };
      if (owned("terreno")) return { chip: "Tuyo: sin construir", tone: "gold" };
      return { chip: "En venta", tone: "gold" };
    }
    return owned(id) ? { chip: "Propiedad tuya", tone: "win" } : { chip: "En venta", tone: "gold" };
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* mapa */}
      <div className="panel relative overflow-hidden" style={{ minHeight: 480 }}>
        <svg viewBox="0 0 100 62" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <rect width="100" height="62" fill="#1a140e" />
          {/* río */}
          <path d="M-2 44 C 20 40, 30 52, 52 48 S 85 38, 102 44 L 102 62 L -2 62 Z" fill="#14232b" opacity="0.85" />
          <path d="M-2 44 C 20 40, 30 52, 52 48 S 85 38, 102 44" fill="none" stroke="#2c4a57" strokeWidth="0.5" />
          {/* calles horizontales */}
          {[10, 24, 38].map(y => <rect key={y} x="0" y={y} width="100" height="3.2" fill="#2a2118" />)}
          {[10, 24, 38].map(y => <line key={`c${y}`} x1="0" y1={y + 1.6} x2="100" y2={y + 1.6} stroke="#57452d" strokeWidth="0.25" strokeDasharray="2 1.6" />)}
          {/* calles verticales */}
          {[22, 44, 68].map(x => <rect key={x} x={x} y="0" width="3" height="46" fill="#2a2118" />)}
          {/* manzanas */}
          {[
            [2, 2, 18, 7], [27, 2, 15, 7], [48, 2, 18, 7], [72, 2, 26, 7],
            [2, 14, 18, 8], [27, 14, 15, 8], [48, 14, 18, 8], [72, 14, 26, 8],
            [2, 28, 18, 8], [27, 28, 15, 8], [48, 28, 18, 8], [72, 28, 26, 8],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={i % 3 === 0 ? "#221b12" : "#251d13"} stroke="#31271a" strokeWidth="0.25" rx="0.6" />
          ))}
          {/* parque */}
          <rect x="27" y="28" width="15" height="8" rx="1" fill="#1e2a18" />
          {[[30, 31], [35, 33], [39, 30], [32, 34.5]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.3" fill="#2e4523" />)}
          {/* arena */}
          <ellipse cx="56" cy="46" rx="7" ry="3.4" fill="#2c2013" stroke="#57452d" strokeWidth="0.3" />
        </svg>

        {/* autos */}
        <motion.div className="absolute h-2 w-4 bg-gold2/80" style={{ top: "17.5%", borderRadius: 2, boxShadow: "0 0 8px rgba(232,178,58,0.5)" }}
          animate={{ left: ["-5%", "105%"] }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute h-2 w-4 bg-blood/80" style={{ top: "41%", borderRadius: 2, boxShadow: "0 0 8px rgba(212,52,44,0.5)" }}
          animate={{ left: ["105%", "-5%"] }} transition={{ duration: 21, repeat: Infinity, ease: "linear", delay: 2 }} />
        <motion.div className="absolute h-2 w-5 bg-[#4a6a7a]" style={{ top: "25.5%", borderRadius: 2 }}
          animate={{ left: ["-6%", "106%"] }} transition={{ duration: 26, repeat: Infinity, ease: "linear", delay: 6 }} />

        {/* spots */}
        {SPOTS.map(s => {
          const st = estadoDe(s.id);
          const isSel = sel === s.id;
          const mio = s.id === "gym" || (s.id !== "loma" && s.id !== "ferro" && s.id !== "tienda" && s.id !== "arena" && (owned(s.id) || (s.id === "terreno" && owned("sucursalNorte"))));
          return (
            <motion.button key={s.id} onClick={() => setSel(s.id)}
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: `${s.x}%`, top: `${s.y * 100 / 62}%` }}>
              <div className={`mx-auto grid h-9 w-9 place-items-center border-2 transition-colors ${isSel ? "border-gold bg-gold/20 text-gold" : mio ? "border-win/70 bg-[#1a2415] text-win" : s.id === "loma" || s.id === "ferro" ? "border-line2 bg-panel2 text-sand" : "border-gold2/70 bg-panel2 text-gold"}`}
                style={{ boxShadow: isSel ? "0 0 16px rgba(232,178,58,0.45)" : s.id === "arena" && state.veladaProgramada ? "0 0 16px rgba(212,52,44,0.6)" : "2px 2px 0 rgba(0,0,0,0.5)", animation: s.id === "arena" && state.veladaProgramada ? "ringPulse 1.2s ease-in-out infinite" : undefined }}>
                <I n={s.icon} className="h-5 w-5" />
              </div>
              <div className={`mt-1 whitespace-nowrap border px-1.5 py-0.5 font-cond text-[10px] uppercase tracking-wide ${isSel ? "border-gold2 bg-ink text-gold" : "border-line bg-ink/80 text-sand"}`}>
                {s.id === "gym" ? state.nombreGimnasio : s.nombre}
              </div>
              {st.chip === "En venta" && (
                <div className="mx-auto mt-0.5 w-fit bg-blood px-1.5 font-cond text-[9px] font-bold uppercase text-cream">Se vende</div>
              )}
            </motion.button>
          );
        })}

        <div className="absolute left-3 top-3 z-10 border border-line bg-ink/85 px-3 py-1.5 font-display text-lg tracking-widest text-cream">
          CIUDAD <span className="text-gold">DEL RING</span>
        </div>
      </div>

      {/* panel de información */}
      <motion.div key={sel} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="panel h-fit p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-2xl tracking-wide text-cream">{sel === "gym" ? state.nombreGimnasio : spot.nombre}</h3>
          <Chip tone={estadoDe(sel).tone}>{estadoDe(sel).chip}</Chip>
        </div>

        {sel === "gym" && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-sand">Aquí empezó todo: un local alquilado con olor a cuero y sueños. Nivel de gimnasio: <b className="text-gold">{nivel}/3</b>.</p>
            <Btn onClick={onGoGym}><I n="glove" className="h-4 w-4" /> Entrar al gimnasio</Btn>
          </div>
        )}

        {(sel === "loma" || sel === "ferro") && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-sand">Un gimnasio rival. Sus entrenadores no comparten secretos, pero siempre hay jóvenes buscando una oportunidad...</p>
            {!state.courses.includes("tecnico") && <p className="font-cond text-xs uppercase tracking-wide text-mut">Requiere curso: Director Técnico</p>}
            <Btn disabled={!state.courses.includes("tecnico") || state.dinero < 150} onClick={() => dispatch({ type: "SCOUT" })} variant="gold">
              <I n="target" className="h-4 w-4" /> Explorar talento · {fmt(150)}
            </Btn>
            <p className="font-cond text-xs text-mut">Los sparrings cruzados con rivales llegan como eventos al teléfono.</p>
          </div>
        )}

        {sel === "tienda" && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-sand">Don Anselmo vende lo mejor en guantes, vendas y sacos. Todo lo que compres mejora el entrenamiento de por vida.</p>
            <Btn onClick={onGoMarket} variant="gold"><I n="cart" className="h-4 w-4" /> Ir a la tienda</Btn>
          </div>
        )}

        {sel === "arena" && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-sand">La Arena Central: aquí sueñas con organizar tus propias veladas. Entradas según tu fama, cartelera según tus campeones.</p>
            {state.veladaProgramada
              ? <Chip tone="blood">Velada confirmada para este sábado</Chip>
              : !state.courses.includes("promotor")
                ? <p className="font-cond text-xs uppercase tracking-wide text-mut">Requiere curso: Promotor de Eventos</p>
                : <p className="text-sm text-sand">Programa peleas desde la ficha de tus boxeadores y activa la velada en el Roster.</p>}
          </div>
        )}

        {(sel === "local2" || sel === "terreno" || sel === "apartamento" || sel === "mansion") && (() => {
          const p = PROPIEDADES[sel];
          const esSucursal = sel === "local2" || sel === "terreno";
          const ya = owned(sel) || (sel === "terreno" && owned("sucursalNorte"));
          return (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-sand">{p.desc}</p>
              <div className="font-cond text-sm text-sand">Precio: <b className="text-gold">{fmt(p.precio)}</b></div>
              {esSucursal && !emp && !ya && (
                <p className="font-cond text-xs uppercase tracking-wide text-mut">Requiere curso: Gestión Empresarial</p>
              )}
              {!ya && sel !== "terreno" && (
                <Btn disabled={!emp && esSucursal || state.dinero < p.precio} variant="gold"
                  onClick={() => dispatch({ type: "BUY_PROPERTY", id: sel })}>
                  <I n="coin" className="h-4 w-4" /> Comprar · {fmt(p.precio)}
                </Btn>
              )}
              {!owned("terreno") && sel === "terreno" && (
                <Btn disabled={!emp || state.dinero < p.precio} variant="gold"
                  onClick={() => dispatch({ type: "BUY_PROPERTY", id: "terreno" })}>
                  <I n="coin" className="h-4 w-4" /> Comprar terreno · {fmt(p.precio)}
                </Btn>
              )}
              {sel === "terreno" && owned("terreno") && !owned("sucursalNorte") && (
                <Btn disabled={state.dinero < 10000} onClick={() => dispatch({ type: "BUILD_BRANCH" })}>
                  <I n="plot" className="h-4 w-4" /> Construir sucursal · {fmt(10000)}
                </Btn>
              )}
              {ya && (
                <div className="space-y-1.5">
                  <Chip tone="win">Propiedad adquirida</Chip>
                  {esSucursal && (
                    <p className="text-sm text-sand">
                      {sucursales(state).length > 0 && state.staff.some(x => x.type === "gerente")
                        ? "Generando ingresos pasivos con tu gerente al mando."
                        : "Contrata un Gerente de Sucursal en Personal para activarla."}
                    </p>
                  )}
                  {sel === "apartamento" && <p className="text-sm text-sand">Ya no pagas alquiler personal. Duermes como un campeón.</p>}
                  {sel === "mansion" && <p className="text-sm text-sand">Una mansión con gimnasio propio. La ciudad habla de ti.</p>}
                </div>
              )}
            </div>
          );
        })()}
      </motion.div>
    </div>
  );
}
