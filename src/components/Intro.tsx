import { motion } from "framer-motion";
import { useState } from "react";
import { useGame } from "../game/state";
import { Btn, I } from "./ui";

export default function Intro() {
  const { state, dispatch } = useGame();
  const [nombre, setNombre] = useState("");
  const [gimnasio, setGimnasio] = useState("");
  const hayCarrera = state.nombreJugador !== "";

  const comenzar = () => {
    dispatch({ type: "NEW_GAME", nombre: nombre.trim() || "El Coach", gimnasio: gimnasio.trim() || "Puños de Oro" });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* focos */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(700px 420px at 50% 8%, rgba(232,178,58,0.16), transparent 65%), radial-gradient(500px 380px at 15% 90%, rgba(212,52,44,0.12), transparent 60%), radial-gradient(500px 380px at 85% 85%, rgba(212,52,44,0.10), transparent 60%)" }} />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[560px] w-[820px] -translate-x-1/2 rotate-0"
        style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(242,231,208,0.05) 47%, rgba(242,231,208,0.09) 50%, rgba(242,231,208,0.05) 53%, transparent 60%)" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-3xl text-center">
        <div className="mb-2 flex items-center justify-center gap-3 font-cond text-sm uppercase tracking-[0.45em] text-sand">
          <span className="h-px w-12 bg-line2" /> Simulador de gestión y boxeo <span className="h-px w-12 bg-line2" />
        </div>
        <h1 className="font-display leading-[0.86]">
          <span className="block text-7xl tracking-wide text-cream sm:text-8xl" style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.6)" }}>LA VIDA</span>
          <span className="block text-5xl tracking-[0.3em] text-blood sm:text-6xl" style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}>DEL</span>
          <span className="block text-8xl tracking-wide text-gold sm:text-9xl" style={{ textShadow: "5px 5px 0 var(--color-blood2), 9px 9px 0 rgba(0,0,0,0.5)" }}>BOXEO</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-cond text-lg text-sand">
          Alquila un local, forma talentos de barrio, sube al ring como director técnico y termina construyendo un imperio:
          veladas, sucursales, sponsors y tu propia marca. <b className="text-gold">Sin castigos, solo oportunidades.</b>
        </p>
      </motion.div>

      {/* cartelera */}
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
        className="panel relative mt-8 w-full max-w-3xl p-6 hard-shadow">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blood via-gold to-blood" />
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 font-display text-xl tracking-[0.2em] text-gold">CARTELERA INICIAL</div>
            <div className="space-y-2 font-cond text-sm text-sand">
              {[
                ["LUN–VIE", "Gestiona entrenamientos, mercado y personal"],
                ["SÁBADO", "Peleas federadas, exhibiciones y veladas propias"],
                ["DOMINGO", "Balance semanal y nuevas oportunidades"],
                ["TU META", "De instructor de barrio a mega-promotor"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3 border-b border-dashed border-line pb-2">
                  <span className="w-20 shrink-0 font-display text-lg text-blood">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 font-cond text-xs uppercase tracking-widest text-mut">
              Consejos invisibles: sigue la historia, ella te enseña. Curso → Federación → Veladas → Imperio.
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block font-cond text-xs uppercase tracking-widest text-sand">Tu nombre de coach</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={22} placeholder="Ej: Nacho Reyes"
                className="w-full border border-line bg-ink px-3 py-2.5 font-cond text-lg text-cream outline-none placeholder:text-mut focus:border-gold" />
            </div>
            <div>
              <label className="mb-1 block font-cond text-xs uppercase tracking-widest text-sand">Nombre de tu gimnasio</label>
              <input value={gimnasio} onChange={e => setGimnasio(e.target.value)} maxLength={22} placeholder="Ej: Puños de Oro"
                className="w-full border border-line bg-ink px-3 py-2.5 font-cond text-lg text-cream outline-none placeholder:text-mut focus:border-gold" />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Btn variant="gold" onClick={comenzar} className="w-full justify-center text-xl">
                <I n="glove" className="h-5 w-5" /> ¡Que suene la campana!
              </Btn>
              {hayCarrera && (
                <Btn variant="dark" onClick={() => dispatch({ type: "CONTINUE_GAME" })} className="w-full justify-center">
                  <I n="play" className="h-4 w-4" /> Continuar carrera de {state.nombreJugador}
                </Btn>
              )}
            </div>
            {state.legados > 0 && hayCarrera && (
              <div className="border border-gold2/60 bg-gold/10 px-3 py-2 font-cond text-sm text-gold">
                <I n="trophy" className="mr-1.5 inline h-4 w-4" /> Partida con {state.legados} legado(s) activo(s).
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-cond text-xs uppercase tracking-[0.25em] text-mut">
        <span>Turnos semanales</span><span className="text-blood">●</span><span>Rankings amateur y pro</span><span className="text-blood">●</span><span>Eventos por teléfono</span><span className="text-blood">●</span><span>Sandbox sin final</span>
      </div>
    </div>
  );
}
