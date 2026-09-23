import { motion } from "framer-motion";
import { useState } from "react";
import { LOGOS_DISPONIBLES } from "../game/data";
import { useGame } from "../game/state";
import { Btn, I } from "./ui";

export default function Intro() {
  const { state, dispatch } = useGame();
  const [nombre, setNombre] = useState("");
  const [gimnasio, setGimnasio] = useState("");
  const [logoSeleccionado, setLogoSeleccionado] = useState<string>("guante");
  const hayCarrera = state.nombreJugador !== "";

  const logoActual = LOGOS_DISPONIBLES.find(l => l.id === logoSeleccionado) || LOGOS_DISPONIBLES[0];

  const iniciarNuevoJuego = () => {
    if (hayCarrera && !window.confirm("Ya tenés una carrera guardada. ¿Querés reemplazarla por una nueva?")) return;
    dispatch({
      type: "NUEVO_JUEGO",
      nombre: nombre.trim() || "El Coach",
      gimnasio: gimnasio.trim() || "Puños de Oro",
      logoGimnasio: logoSeleccionado,
    });
  };

  return (
    <div className="fondo-app relative flex h-dvh min-h-0 flex-col items-center justify-start overflow-hidden px-4 py-5 select-none sm:py-6">
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(700px 420px at 50% 8%, rgba(232,178,58,0.16), transparent 65%), radial-gradient(500px 380px at 12% 92%, rgba(212,52,44,0.13), transparent 60%), radial-gradient(500px 380px at 88% 88%, rgba(56,224,207,0.07), transparent 60%)" }} />
      {/* Haz de reflector clásico */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[560px] w-[860px] -translate-x-1/2"
        style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(242,231,208,0.05) 47%, rgba(242,231,208,0.1) 50%, rgba(242,231,208,0.05) 53%, transparent 60%)" }} />

      {/* Título Principal y Tipografía Editorial Vintage */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-4xl shrink-0 text-center">
        <div className="mb-1 flex items-center justify-center gap-2 font-cond text-xs uppercase tracking-[0.35em] text-sand sm:text-sm">
          <span className="h-px w-12 bg-line2" /> Simulador Tycoon · Sandbox de Boxeo <span className="h-px w-12 bg-line2" />
        </div>
        <h1 className="font-display leading-[0.86]">
          <span className="block text-6xl tracking-wide text-cream sm:text-7xl" style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.6)" }}>LA VIDA</span>
          <span className="block text-3xl tracking-[0.3em] text-blood sm:text-4xl" style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}>DEL</span>
          <span className="block text-7xl tracking-wide text-gold sm:text-8xl" style={{ textShadow: "5px 5px 0 var(--color-blood2), 9px 9px 0 rgba(0,0,0,0.5)" }}>BOXEO</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl font-cond text-base text-sand sm:text-lg">
          De un local alquilado en el barrio a mega-promotor: formá talentos, dirigí desde la esquina, colgá cinturones
          y levantá un imperio. <b className="text-gold">Sin castigos: cada evento es una oportunidad.</b>
        </p>
      </motion.div>

      {/* Cartelera Central y Formulario de Fundación */}
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
        className="panel relative mt-4 w-full max-w-5xl shrink-0 p-4 sm:mt-5 sm:p-5 hard-shadow">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blood via-gold to-blood" />
        <div className="grid gap-5 md:grid-cols-12">
          
          {/* Columna Izquierda: Cartelera de Vida (5 columnas) */}
          <div className="space-y-3 md:col-span-5">
            <div className="font-display text-xl tracking-[0.16em] text-gold sm:text-2xl">LA CARTELERA DE TU VIDA</div>
            <div className="space-y-2 font-cond text-sm text-sand">
              {[
                ["LUN–VIE", "Gestión pura: 6 combos de entrenamiento, mercado, personal y cursos"],
                ["SÁBADO", "Prácticas de combate, noches de boxeo y peleas con jueces de 10 puntos"],
                ["DOMINGO", "Balance semanal: cuotas, sucursales, sponsors y eventos comunitarios"],
                ["TU META", "Los 4 cinturones: Regional, Nacional, Continental y el Mundial Absoluto"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 border-b border-dashed border-line pb-1.5">
                  <span className="w-20 shrink-0 font-display text-base text-blood">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="pt-1 font-cond text-[11px] uppercase tracking-widest text-mut">
              Guía inicial: Don Anselmo te acompaña desde el teléfono y cada pantalla te indica el próximo paso.
            </div>
          </div>

          {/* Columna Derecha: Fundación y Selección de Emblema (7 columnas) */}
          <div className="space-y-3 md:col-span-7">
            
            {/* 1. Selector de Emblema */}
            <div>
              <label className="mb-1.5 block font-cond text-xs uppercase tracking-widest text-sand flex items-center justify-between">
                <span>1. Emblema del Gimnasio</span>
                <span className="text-gold font-bold">{logoActual.nombre}</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {LOGOS_DISPONIBLES.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLogoSeleccionado(l.id)}
                    className={`p-1.5 border transition-all flex flex-col items-center justify-center cursor-pointer ${
                      logoSeleccionado === l.id
                        ? "border-gold bg-gold/20 text-gold scale-105 shadow-md hard-shadow"
                        : "border-line bg-ink text-sand hover:border-line2 hover:text-cream"
                    }`}
                    title={`${l.nombre} — ${l.lema}`}
                  >
                    <span className="text-xl leading-none">{l.emoji}</span>
                    <span className="text-[9px] font-cond uppercase mt-1 tracking-tighter truncate max-w-full">
                      {l.nombre.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Nombre del Coach y Gimnasio */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-cond text-xs uppercase tracking-widest text-sand">Tu nombre de coach</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={24} placeholder="Ej: Nacho Reyes"
                  className="w-full border border-line bg-ink px-3 py-1.5 font-cond text-base text-cream outline-none placeholder:text-mut focus:border-gold" />
              </div>
              <div>
                <label className="mb-1 block font-cond text-xs uppercase tracking-widest text-sand">Nombre de tu gimnasio</label>
                <input value={gimnasio} onChange={e => setGimnasio(e.target.value)} maxLength={24} placeholder="Ej: Puños de Oro"
                  className="w-full border border-line bg-ink px-3 py-1.5 font-cond text-base text-cream outline-none placeholder:text-mut focus:border-gold" />
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col gap-2 pt-1">
              <Btn variant="gold" onClick={iniciarNuevoJuego} className="w-full text-lg py-2">
                <I n="glove" className="h-5 w-5" /> ¡Que suene la campana!
              </Btn>
              {hayCarrera && (
                <Btn variant="dark" onClick={() => dispatch({ type: "CONTINUAR" })} className="w-full">
                  <I n="play" className="h-4 w-4" /> Continuar carrera de {state.nombreJugador}
                </Btn>
              )}
            </div>

            {state.legados > 0 && hayCarrera && (
              <div className="border border-neonc/60 bg-neonc/10 px-3 py-2 font-cond text-sm text-neonc">
                <I n="medal" className="mr-1.5 inline h-4 w-4" /> Partida con {state.legados} legado(s): prestigio y contactos heredados.
              </div>
            )}
          </div>

        </div>
      </motion.div>

      {/* Pie de página con pilares clave */}
      <div className="mt-3 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 font-cond text-[11px] uppercase tracking-[0.2em] text-mut">
        <span>11 capacidades + Eficacia</span><span className="text-blood">●</span><span>Sistema de 10 puntos</span><span className="text-blood">●</span><span>4 distritos</span><span className="text-blood">●</span><span>Legado infinito</span>
      </div>
    </div>
  );
}

export { Intro };
