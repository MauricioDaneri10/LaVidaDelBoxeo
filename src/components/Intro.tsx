import { m as motion } from "framer-motion";
import { useState } from "react";
import { LOGOS_DISPONIBLES } from "../game/data";
import { borrarPartida, listarPartidas, useGame } from "../game/state";
import { Btn, I, Modal, TextoPaginado } from "./ui";
import { formatearFecha, useMessages } from "../i18n";
import { presentarEmblema } from "../i18n/presentation";
import { useResponsiveCapacity } from "./useResponsiveCapacity";
import {LanguagePicker} from "./LanguagePicker";
export default function Intro() {
  const { t, locale } = useMessages();
  const cartelera = [[t("intro.weekdays"), t("intro.training")], [t("intro.saturday"), t("intro.bouts")], [t("intro.sunday"), t("intro.balance")], [t("intro.goal"), t("intro.belts")]];
  const { state, dispatch } = useGame();
  const [nombre, setNombre] = useState("");
  const [gimnasio, setGimnasio] = useState("");
  const [partidas, setPartidas] = useState(() => listarPartidas());
  const [logoSeleccionado, setLogoSeleccionado] = useState<string>("guante");
  const [confirmacion, setConfirmacion] = useState<"nueva" | { borrar: string } | null>(null);
  const [errorRanura, setErrorRanura] = useState(false);
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 950px)");
  const [seccion, setSeccion] = useState("coach");
  const [ranura, setRanura] = useState(0);
  const hayCarrera = state.nombreJugador !== "";

  const logoActual = LOGOS_DISPONIBLES.find(l => l.id === logoSeleccionado) || LOGOS_DISPONIBLES[0];
  const emblema = presentarEmblema(logoActual, locale);

  const iniciarNuevoJuego = (confirmado = false) => {
    if (hayCarrera && !confirmado) { setConfirmacion("nueva"); return; }
    dispatch({
      type: "NUEVO_JUEGO",
      nombre: nombre.trim() || "El Coach",
      gimnasio: gimnasio.trim() || "Puños de Oro",
      logoGimnasio: logoSeleccionado,
    });
  };

  const cargarPartida = (id: string) => dispatch({ type: "CARGAR_PARTIDA", id });
  const eliminarPartida = (id: string) => {
    if (!borrarPartida(id)) { setErrorRanura(true); return; }
    setPartidas(listarPartidas());
  };

  return (
    <div className={`fondo-app intro-screen ${compacto ? "intro-compact" : ""} relative flex h-dvh min-h-0 flex-col items-center justify-start overflow-hidden px-4 py-5 select-none sm:py-6`}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(700px 420px at 50% 8%, rgba(232,178,58,0.16), transparent 65%), radial-gradient(500px 380px at 12% 92%, rgba(212,52,44,0.13), transparent 60%), radial-gradient(500px 380px at 88% 88%, rgba(56,224,207,0.07), transparent 60%)" }} />
      {/* Haz de reflector clásico */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[560px] w-[860px] -translate-x-1/2"
        style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(242,231,208,0.05) 47%, rgba(242,231,208,0.1) 50%, rgba(242,231,208,0.05) 53%, transparent 60%)" }} />

      {/* Título Principal y Tipografía Editorial Vintage */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-4xl shrink-0 text-center">
        <div className="mb-1 flex items-center justify-center gap-2 font-cond text-xs uppercase tracking-[0.35em] text-sand sm:text-sm">
          <span className="h-px w-12 bg-line2" /> {t("intro.tagline")} <span className="h-px w-12 bg-line2" />
        </div>
        <h1 className="font-display leading-[0.86]">
          <span className="block text-6xl tracking-wide text-cream sm:text-7xl" style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.6)" }}>LA VIDA</span>
          <span className="block text-3xl tracking-[0.3em] text-blood sm:text-4xl" style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}>DEL</span>
          <span className="block text-7xl tracking-wide text-gold sm:text-8xl" style={{ textShadow: "5px 5px 0 var(--color-blood2), 9px 9px 0 rgba(0,0,0,0.5)" }}>BOXEO</span>
        </h1>
        {!compacto && <p className="mx-auto mt-2 max-w-xl font-cond text-base text-sand sm:text-lg">
          {t("intro.pitch")} <b className="text-gold">{t("intro.risks")}</b>
        </p>}
      </motion.div>

      {/* Cartelera Central y Formulario de Fundación */}
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
        className="panel relative mt-4 w-full max-w-5xl shrink-0 p-4 sm:mt-5 sm:p-5 hard-shadow">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blood via-gold to-blood" />
        {compacto && <select aria-label={t("intro.section")} value={seccion} onChange={e=>setSeccion(e.target.value)} className="r4-select">
          <option value="coach">{t("intro.coach")}</option><option value="gimnasio">{t("intro.club")}</option><option value="emblema">{t("intro.emblem")}</option><option value="partidas">{t("intro.saves")}</option><option value="idioma">{t("language.label")}</option><option value="ayuda">{t("intro.help")}</option>
        </select>}
        {(!compacto||seccion==="idioma")&&<LanguagePicker/>}
        <div className="grid gap-5 md:grid-cols-12">
          
          {/* Columna Izquierda: Cartelera de Vida (5 columnas) */}
          {(!compacto || seccion === "ayuda") && <div className="space-y-3 md:col-span-5 intro-help">
            {!compacto && <div className="font-display text-xl tracking-[0.16em] text-gold sm:text-2xl">{t("intro.agenda")}</div>}
            {compacto ? <TextoPaginado texto={cartelera.map(([k,v])=>`${k}: ${v}`).join(" · ") + " · " + t("intro.guide")} capacidad={40} /> : <div className="space-y-2 font-cond text-sm text-sand">
              {cartelera.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 border-b border-dashed border-line pb-1.5">
                  <span className="w-20 shrink-0 font-display text-base text-blood">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>}
            {!compacto && <div className="pt-1 font-cond text-xs uppercase tracking-widest text-mut">{t("intro.guide")}</div>}
          </div>}

          {/* Columna Derecha: Fundación y Selección de Emblema (7 columnas) */}
          <div className="space-y-3 md:col-span-7">
            
            {/* 1. Selector de Emblema */}
            {(!compacto || seccion === "emblema") && <div>
              <label className="mb-1.5 block font-cond text-xs uppercase tracking-widest text-sand flex items-center justify-between">
                <span>{t("intro.emblem")}</span>
                <span className="text-gold font-bold">{emblema.nombre}</span>
              </label>
              {compacto ? <><select aria-label={t("intro.emblem")} value={logoSeleccionado} onChange={e=>setLogoSeleccionado(e.target.value)} className="r4-select">{LOGOS_DISPONIBLES.map(l=><option key={l.id} value={l.id}>{l.emoji} {presentarEmblema(l, locale).nombre}</option>)}</select><TextoPaginado texto={emblema.lema} capacidad={40} /></> : <div className="grid grid-cols-6 gap-1.5">
                {LOGOS_DISPONIBLES.map(l => { const copy = presentarEmblema(l, locale); return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLogoSeleccionado(l.id)}
                    className={`p-1.5 border transition-all flex flex-col items-center justify-center cursor-pointer ${
                      logoSeleccionado === l.id
                        ? "border-gold bg-gold/20 text-gold scale-105 shadow-md hard-shadow"
                        : "border-line bg-ink text-sand hover:border-line2 hover:text-cream"
                    }`}
                    title={`${copy.nombre} — ${copy.lema}`}
                    aria-label={`${copy.nombre} — ${copy.lema}`}
                  >
                    <span className="text-xl leading-none">{l.emoji}</span>
                    <span className="text-xs font-cond uppercase mt-1 tracking-tighter max-w-full">
                      {copy.nombre}
                    </span>
                  </button>
                ); })}
              </div>}
            </div>}

            {/* 2. Nombre del Coach y Gimnasio */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(!compacto || seccion === "coach") && <div>
                <label className="mb-1 block font-cond text-sm uppercase tracking-widest text-sand">{t("intro.coach")}</label>
                <input aria-label={t("intro.coach")} value={nombre} onChange={e => setNombre(e.target.value)} maxLength={24} placeholder={t("intro.coachExample")}
                  className="w-full border border-line bg-ink px-3 py-1.5 font-cond text-base text-cream outline-none placeholder:text-mut focus:border-gold" />
              </div>}
              {(!compacto || seccion === "gimnasio") && <div>
                <label className="mb-1 block font-cond text-sm uppercase tracking-widest text-sand">{t("intro.club")}</label>
                <input aria-label={t("intro.club")} value={gimnasio} onChange={e => setGimnasio(e.target.value)} maxLength={24} placeholder={t("intro.clubExample")}
                  className="w-full border border-line bg-ink px-3 py-1.5 font-cond text-base text-cream outline-none placeholder:text-mut focus:border-gold" />
              </div>}
            </div>

            {/* Botones de Acción */}
            {(!compacto || seccion === "gimnasio") && <div className="flex flex-col gap-2 pt-1">
              <Btn variant="gold" onClick={() => iniciarNuevoJuego()} className="w-full text-lg py-2">
                <I n="glove" className="h-5 w-5" /> {t("intro.start")}
              </Btn>
            </div>}

            {(!compacto || seccion === "partidas") && partidas.length > 0 && (
              <div className="mt-1 rounded-xl border border-line bg-ink/60 p-2.5">
                <div className="mb-1 font-display text-sm uppercase tracking-wide text-gold">{t("intro.continue")}</div>
                <div className="space-y-1.5">
                  {compacto && <select aria-label={t("intro.saves")} value={Math.min(ranura, partidas.length-1)} onChange={e=>setRanura(Number(e.target.value))} className="r4-select">{partidas.map((p,i)=><option key={p.id} value={i}>{p.nombre}</option>)}</select>}
                  {(compacto ? partidas.slice(Math.min(ranura, partidas.length-1), Math.min(ranura, partidas.length-1)+1) : partidas).map(partida => (
                    <div key={partida.id} className="flex items-center gap-2 rounded-lg border border-line bg-panel2 px-2 py-1.5">
                      <button onClick={() => cargarPartida(partida.id)} className="min-w-0 flex-1 text-left font-cond text-xs text-cream hover:text-gold">
                        <span className="block truncate font-bold">{partida.nombre}</span>
                        <span className="block text-mut">{t("intro.saveDetails", { coach: partida.coach, club: partida.gimnasio, week: partida.semana, date: formatearFecha(new Date(partida.guardadaEn), locale) })}</span>
                      </button>
                      <button onClick={() => setConfirmacion({ borrar: partida.id })} aria-label={t("intro.deleteSave", { name: partida.nombre })} className="rounded px-1.5 py-1 text-xs text-mut hover:bg-blood/15 hover:text-blood">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {seccion === "partidas" && partidas.length === 0 && <p className="text-sm">{t("intro.noSaves")}</p>}
            {(!compacto || seccion === "partidas") && state.legados > 0 && hayCarrera && (
              <div className="border border-neonc/60 bg-neonc/10 px-3 py-2 font-cond text-sm text-neonc">
                <I n="medal" className="mr-1.5 inline h-4 w-4" /> {t("intro.legacy", { count: state.legados })}
              </div>
            )}
          </div>

        </div>
      </motion.div>

      {/* Pie de página con pilares clave */}
      {!compacto && <div className="mt-3 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 font-cond text-[11px] uppercase tracking-[0.2em] text-mut">
        <span>{t("intro.capabilities")}</span><span className="text-blood">●</span><span>{t("intro.scoring")}</span><span className="text-blood">●</span><span>{t("intro.districts")}</span><span className="text-blood">●</span><span>{t("intro.endless")}</span>
      </div>}
      <footer data-text-role="secondary" className="app-footer mt-auto shrink-0 border-t border-line/80 px-4 py-1 text-center font-cond text-xs uppercase tracking-[0.28em] text-mut">
        MadArt Studios
      </footer>
      {confirmacion && <Modal fit title={t(confirmacion === "nueva" ? "save.newTitle" : "save.deleteTitle")} onClose={() => setConfirmacion(null)}>
        <p className="text-sm">{t(confirmacion === "nueva" ? "save.newConfirm" : "save.deleteConfirm")}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => setConfirmacion(null)}>{t("action.cancel")}</Btn><Btn variant="blood" onClick={() => { if (confirmacion === "nueva") iniciarNuevoJuego(true); else eliminarPartida(confirmacion.borrar); setConfirmacion(null); }}>{t("action.confirm")}</Btn></div>
      </Modal>}
      {errorRanura && <Modal fit title={t("save.deleteFailure")} onClose={() => setErrorRanura(false)}><p role="alert" className="text-sm">{t("save.protected")}</p><Btn className="mt-3" onClick={() => setErrorRanura(false)}>{t("action.close")}</Btn></Modal>}
    </div>
  );
}

export { Intro };
