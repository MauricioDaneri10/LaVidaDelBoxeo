import { useEffect, useMemo, useState } from "react";
import { useMessages } from "../i18n";
import { COMBOS, TITULOS } from "../game/data";
import { enfoqueRecomendado, estadoRecord, fmt, puedeHabilitar, puedeProfesionalizar, rasgoInfo, tituloAspirable, totalPeleas, valoracion } from "../game/engine";
import { useGame } from "../game/state";
import type { ComboId, Pugilista } from "../game/types";
import { Figura } from "./GymView";
import { BarraEnergia, Btn, Chip, FilaStat, I, Modal, RadarCapacidades } from "./ui";
import { useResponsiveCapacity } from "./useResponsiveCapacity";

const PILARES: { color: string; stats: { k: keyof import("../game/types").Atributos }[] }[] = [
  {
    color: "text-blood",
    stats: [
      { k: "fuerza" },
      { k: "velocidad" },
      { k: "potencia" },
      { k: "resistencia" },
    ],
  },
  {
    color: "text-gold",
    stats: [
      { k: "ataque" },
      { k: "defensa" },
      { k: "tecnica" },
      { k: "eficacia" },
    ],
  },
  {
    color: "text-neonc",
    stats: [
      { k: "inteligencia" },
      { k: "mentalidad" },
      { k: "talento" },
    ],
  },
];

export interface BoxerSheetProps {
  id?: string;
  boxeadorId?: string;
  onCerrar: () => void;
  onCambiarBoxeador?: (id: string) => void;
  onBuscarRival?: (id: string) => void;
  onIrAPestana?: (tab: "gimnasio" | "ciudad" | "plantel" | "mercado" | "perfil" | "personal") => void;
}

export function BoxerSheet({ id, boxeadorId, onCerrar, onCambiarBoxeador, onBuscarRival, onIrAPestana }: BoxerSheetProps) {
  const { state, dispatch } = useGame();
  const { t } = useMessages();
  const nombreEnfoque = (combo: ComboId) => t(`combo.${combo}`);
  const descripcionEnfoque = (combo: ComboId) => t(`combo.${combo}.desc`);
  const nombrePilar = (index: number) => t((["sheet.physical", "sheet.technical", "sheet.mental"] as const)[index]);
  const inicialId = id || boxeadorId || state.plantel[0]?.id || "";
  const [activoId, setActivoId] = useState<string>(inicialId);
  const compacto = useResponsiveCapacity("(max-width: 1100px), (max-height: 900px)");
  const [apartado, setApartado] = useState("enfoque");
  const [pilar, setPilar] = useState(0);
  const [enfoquePrevio, setEnfoquePrevio] = useState<ComboId>("acondicionamiento");
  const [accionGestion, setAccionGestion] = useState("ofertas");
  const [confirmarTransferencia, setConfirmarTransferencia] = useState(false);
  const [paginaHistorial, setPaginaHistorial] = useState(0);

  useEffect(() => {
    if (id || boxeadorId) {
      setActivoId(id || boxeadorId || "");
    }
  }, [id, boxeadorId]);

  const indexActual = state.plantel.findIndex(p => p.id === activoId);
  const p = (indexActual >= 0 ? state.plantel[indexActual] : state.plantel[0]) as Pugilista | undefined;
  useEffect(() => { if (p) { setEnfoquePrevio(p.combo); setPaginaHistorial(0); } }, [p?.id, p?.combo]);
  useEffect(() => { setAccionGestion("ofertas"); setConfirmarTransferencia(false); }, [p?.id]);

  const irAnterior = () => {
    if (state.plantel.length <= 1) return;
    const nuevoIndex = (indexActual - 1 + state.plantel.length) % state.plantel.length;
    const nuevoId = state.plantel[nuevoIndex].id;
    setActivoId(nuevoId);
    if (onCambiarBoxeador) onCambiarBoxeador(nuevoId);
  };

  const irSiguiente = () => {
    if (state.plantel.length <= 1) return;
    const nuevoIndex = (indexActual + 1) % state.plantel.length;
    const nuevoId = state.plantel[nuevoIndex].id;
    setActivoId(nuevoId);
    if (onCambiarBoxeador) onCambiarBoxeador(nuevoId);
  };

  if (!p) return null;

  const vg = valoracion(p.atrib);
  const necesitaEnfoque = p.rol === "alumno" && !p.enEspera && !state.guiaClub?.enfoquesConfirmados.includes(p.id);
  const rasgo = rasgoInfo(p.rasgo);
  const peleaAgendada = state.pendientes.find(x => x.miId === p.id);
  const consejo = enfoqueRecomendado(p, state);
  const aspirable = tituloAspirable(p);
  const puedeLicenciar = puedeHabilitar(p, state);
  const paseProfesional = puedeProfesionalizar(p, state);
  const tieneDT = state.personal.some(x => x.tipo === "directorTecnico");
  const categoriaRecord = estadoRecord(p);

  const cambiarCombo = (c: ComboId) => dispatch({ type: "CAMBIAR_COMBO", id: p.id, combo: c });

  // Normalización estricta sin NaN ni valores undefined
  const atributosSeguros = {
    fuerza: Math.round(p.atrib.fuerza ?? 50),
    velocidad: Math.round(p.atrib.velocidad ?? 50),
    potencia: Math.round(p.atrib.potencia ?? 50),
    resistencia: Math.round(p.atrib.resistencia ?? 50),
    ataque: Math.round(p.atrib.ataque ?? 50),
    defensa: Math.round(p.atrib.defensa ?? 50),
    tecnica: Math.round(p.atrib.tecnica ?? 50),
    eficacia: Math.round(p.atrib.eficacia ?? 50),
    inteligencia: Math.round(p.atrib.inteligencia ?? 50),
    mentalidad: Math.round(p.atrib.mentalidad ?? 50),
    talento: Math.round(p.atrib.talento ?? 50),
  };

  // Historial de peleas de este atleta o del club
  const historialAtleta = state.historial.filter(h => {
    // Las partidas antiguas pueden no tener miId: solo se muestran en la
    // ficha cuando el resultado está identificado de forma segura.
    return h.miId === p.id;
  }).slice(0, 5);
  const dialogoTransferencia = confirmarTransferencia && <Modal title={t("transfer.title")} onClose={() => setConfirmarTransferencia(false)} fit><p className="text-sm">{t("transfer.message", { name: p.nombre })}</p><div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => setConfirmarTransferencia(false)}>{t("action.cancel")}</Btn><Btn variant="blood" onClick={() => { dispatch({ type: "RETIRAR_ATLETA", id: p.id }); onCerrar(); }}>{t("transfer.action")}</Btn></div></Modal>;

  if (compacto) return <Modal wide fit className="boxer-sheet-modal" title={t("sheet.heading")} icon="user" onClose={onCerrar}>
    <div className="boxer-sheet-compact text-sm">
      <div className="space-y-2">
        <select aria-label={t("sheet.boxer")} value={p.id} onChange={e => { setActivoId(e.target.value); onCambiarBoxeador?.(e.target.value); }} className="r4-select">
          {state.plantel.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
        <select aria-label={t("sheet.section")} value={apartado} onChange={e => setApartado(e.target.value)} className="r4-select">
          <option value="nombre">{t("sheet.name")}</option><option value="identidad">{t("sheet.identity")}</option><option value="figura">{t("sheet.figure")}</option><option value="record">{t("sheet.record")}</option><option value="rasgo">{t("sheet.trait")}</option><option value="radar">{t("sheet.radar")}</option><option value="atributos">{t("sheet.attributes")}</option><option value="enfoque">{t("sheet.focus")}</option><option value="confirmacion">{t("sheet.confirm")}</option><option value="consejo">{t("sheet.corner")}</option><option value="practicas">{t("sheet.practice")}</option><option value="gestion">{t("sheet.management")}</option><option value="historial">{t("sheet.history")}</option>
        </select>
      </div>
      <div className="min-w-0 space-y-2 rounded-xl border border-line bg-panel p-2.5">
        {apartado === "nombre" && <p>{p.nombre}</p>}
        {apartado === "identidad" && <>
          <p>Valoración general: <b className="text-gold">{vg}</b></p>
          <p>{p.edad} años · {p.genero === "M" ? "Masculino" : "Femenino"} · {p.division}</p>
          <p>{p.rol === "boxeador" ? (p.circuito === "pro" ? "Licencia Profesional" : "Licencia Amateur") : "Pugil en formación"}{p.elite && " · Zona Élite"}</p>
          <p>Energía: {Math.round(p.energia)}</p>
          {p.titulo > 0 && <p>{TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}</p>}
          <p>{t("focus.assigned")}: {nombreEnfoque(p.combo)}</p>
        </>}
        {apartado === "figura" && <div className="flex justify-center"><Figura p={p} escala={1} /></div>}
        {apartado === "record" && <>
          <p>Récord: {p.record.v}-{p.record.d}-{p.record.e ?? 0} · {p.record.ko} KO · {totalPeleas(p)} peleas</p>
          <p>{categoriaRecord.etiqueta}{p.bonusDebut && " · Bono de Madurez"}</p>
          <p>Amateur: {p.peleasAmateur} · Profesional: {p.peleasProfesionales} ({p.victoriasProfesionales}-{p.derrotasProfesionales}-{p.empatesProfesionales}, {p.kosProfesionales} KO)</p>
          <p>{p.circuito === "amateur" ? p.peleasAmateur >= 50 ? "Trayectoria amateur completa: el pase profesional queda a decisión del jugador." : `Camino profesional: ${50 - p.peleasAmateur} peleas amateurs restantes.` : "Títulos: Nacional desde 10 peleas pro · Regional/Mundial desde 25."}</p>
        </>}
        {apartado === "rasgo" && <><p className="text-gold">{rasgo?.nombre ?? "Sin rasgo especial"}</p>{rasgo && <p>{rasgo.desc}</p>}</>}
        {apartado === "radar" && <RadarCapacidades atributos={atributosSeguros} className="max-w-[160px]" />}
        {apartado === "atributos" && <>
          <select aria-label={t("sheet.pillar")} value={pilar} onChange={e => setPilar(Number(e.target.value))} className="r4-select">{PILARES.map((pil, i) => <option key={pil.color} value={i}>{nombrePilar(i)}</option>)}</select>
          {PILARES[pilar].stats.map(s => <FilaStat key={s.k} label={t(`stat.${s.k}`)} v={p.atrib[s.k]} />)}
        </>}
        {apartado === "enfoque" && <>
          <select aria-label={t("focus.review")} value={enfoquePrevio} onChange={e => setEnfoquePrevio(e.target.value as ComboId)} className="r4-select">
            {(Object.keys(COMBOS) as ComboId[]).map(cid => <option key={cid} value={cid}>{nombreEnfoque(cid)}{p.combo === cid ? ` · ${t("focus.assigned")}` : ""}</option>)}
          </select>
          <p>{descripcionEnfoque(enfoquePrevio)}</p>
          <Btn small variant="gold" onClick={() => cambiarCombo(enfoquePrevio)}>{t("focus.assign")}</Btn>
        </>}
        {apartado === "confirmacion" && (necesitaEnfoque ? <><p>{t("focus.pending")}</p><p>{t("focus.assigned")}: {nombreEnfoque(p.combo)}</p><Btn small onClick={() => cambiarCombo(p.combo)}>{t("focus.confirm")}</Btn></> : <p>{t("focus.confirmed")}</p>)}
        {apartado === "consejo" && <><p>{t("focus.recommended", { focus: nombreEnfoque(consejo) })}</p>{aspirable > 0 && <p>Posibilidad de disputa: {TITULOS[aspirable as 1 | 2 | 3 | 4].nombre}.</p>}</>}
        {apartado === "practicas" && <>
          <p>{p.guanteosRealizados}/10 guanteos (sparring)</p>
          <div className="stat-bar"><i style={{ width: `${Math.min(100, p.guanteosRealizados / 10 * 100)}%`, background: "var(--color-gold)" }} /></div>
          <p>{p.enEspera ? "Está en lista de espera: cuando se libere una plaza podrá continuar." : p.guanteosRealizados >= 10 ? "¡Pugil listo para tramitar su licencia!" : `Requiere ${10 - p.guanteosRealizados} guanteos más para tramitar la licencia.`}</p>
          <p>Las prácticas de combate se completan los sábados.</p>
        </>}
        {apartado === "gestion" && (p.rol === "alumno" ? <>
          <p>{p.enEspera ? "Está en lista de espera y todavía no puede entrenar ni competir." : !state.cursos.includes("dt") ? "Obtené la Licencia de Entrenador para federar boxeadores del club." : p.guanteosRealizados >= 10 ? "Prácticas completas: tramitá la licencia amateur para competir." : "Completá las prácticas de los sábados para habilitar la competencia amateur."}</p>
          {!state.cursos.includes("dt") && onIrAPestana && <Btn small variant="ghost" onClick={() => onIrAPestana("perfil")}>Obtener Licencia de Entrenador</Btn>}
          {puedeLicenciar && <Btn small variant="gold" onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}>Tramitar licencia del pugil ({fmt(200)})</Btn>}
        </> : <>
          <select aria-label="Acción de gestión del boxeador" value={accionGestion} onChange={e => setAccionGestion(e.target.value)} className="r4-select">
            <option value="ofertas">Ofertas de combate</option><option value="elite">Zona Élite</option><option value="transferencia">Transferencia</option>{p.circuito === "amateur" && p.peleasAmateur >= 50 && <option value="profesional">Pase profesional</option>}
          </select>
          {accionGestion === "ofertas" && <><p>{peleaAgendada ? `Pelea pactada vs ${peleaAgendada.rival.nombre}: respetá el descanso y la recuperación.` : p.lesion ? `Lesión ${p.lesion.gravedad}: ${p.lesion.semanas} semana(s) de recuperación.` : p.energia < 70 ? "Necesita descansar antes de pactar una pelea." : "Disponible para pactar una pelea."}</p>{!peleaAgendada && <Btn small onClick={() => { if (onBuscarRival) onBuscarRival(p.id); else dispatch({ type: "BUSCAR_RIVAL", id: p.id }); onCerrar(); }}>Buscar Ofertas de Combate</Btn>}</>}
          {accionGestion === "elite" && <Btn small variant={p.elite ? "gold" : "ghost"} onClick={() => dispatch({ type: "ALTERNAR_ELITE", id: p.id })}>{p.elite ? "✓ En Zona Élite" : "+ Promover a Zona Élite"}</Btn>}
          {accionGestion === "transferencia" && <><p>Su récord se conserva en esta partida y deja de ocupar un lugar en el plantel.</p><Btn small variant="ghost" onClick={() => setConfirmarTransferencia(true)}>Transferir fuera del club</Btn></>}
          {accionGestion === "profesional" && p.circuito === "amateur" && p.peleasAmateur >= 50 && <><p>{paseProfesional.ok ? "Puede aceptar el pase; conserva su récord amateur." : paseProfesional.motivo === "cupo" ? "Cupo profesional completo: seguirá amateur hasta que liberes una plaza." : "Resuelve la pelea agendada antes de cambiar de circuito."}</p><Btn small variant="gold" disabled={!paseProfesional.ok} onClick={() => dispatch({ type: "PROMOVER_PRO", id: p.id })}>Aceptar pase profesional</Btn></>}
        </>)}
        {apartado === "historial" && (historialAtleta.length ? <>
          <select aria-label="Combate del historial" value={Math.min(paginaHistorial, historialAtleta.length - 1)} onChange={e => setPaginaHistorial(Number(e.target.value))} className="r4-select">{historialAtleta.map((h, i) => <option key={i} value={i}>{i + 1} · {h.rivalNombre}</option>)}</select>
          {historialAtleta.slice(Math.min(paginaHistorial, historialAtleta.length - 1), Math.min(paginaHistorial, historialAtleta.length - 1) + 1).map((h, i) => <div key={i}><p>{h.empate ? "EMPATE" : h.gane ? "VICTORIA" : "DERROTA"} · {h.metodo}</p><p>{h.resumen}</p><p>Bolsa: {fmt(h.bolsa)}</p></div>)}
        </> : <p>Aún no registra combates oficiales en su historial.</p>)}
      </div>
    </div>
    {dialogoTransferencia}
  </Modal>;

  return (
    <Modal
      wide
      fit
      className="boxer-sheet-modal"
      title={t("sheet.title", { name: p.nombre })}
      icon="user"
      onClose={onCerrar}
    >
      <div className="boxer-sheet-content space-y-1.5 select-none text-[.96em]">
        
        {/* BARRA DE NAVEGACIÓN ANTERIOR / SIGUIENTE ENTRE ATLETAS */}
        <div className="boxer-sheet-nav flex flex-wrap items-center justify-between gap-2 border-b border-line pb-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={irAnterior}
              disabled={state.plantel.length <= 1}
              className="r4-sheet-nav"
            >
              ← Anterior
            </button>
            <span className="font-mono-data text-xs text-mut">
              Atleta <b className="text-cream">{indexActual + 1}</b> de <b className="text-cream">{state.plantel.length}</b>
            </span>
            <button
              onClick={irSiguiente}
              disabled={state.plantel.length <= 1}
              className="r4-sheet-nav"
            >
              Siguiente →
            </button>
          </div>

          <div className="flex items-center gap-2">
            {peleaAgendada ? (
              <Chip tone="blood">
                <I n="bell" className="h-3 w-3" /> Pelea agendada para el sábado vs {peleaAgendada.rival.nombre}
              </Chip>
            ) : (
              <span className="font-cond text-xs text-mut">Sin combate agendado</span>
            )}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: 2 COLUMNAS (IZQ: HERO + RADAR, DER: ATRIBUTOS + ENTRENAMIENTO + HISTORIAL) */}
        <div className="boxer-sheet-main grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          
          {/* COLUMNA IZQUIERDA: HERO + FIGURA PROCEDIMENTAL + RADAR PENTAGONAL */}
          <div className="boxer-sheet-left space-y-2">
            
            {/* ESCENARIO DEL ATLETA CON FIGURA PROCEDIMENTAL */}
            <div className="relative flex h-28 items-end justify-center overflow-hidden border border-line bg-gradient-to-b from-panel2 to-ink rounded-2xl shadow-inner">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(232,178,58,0.28),transparent)]" />
              <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-line2" />
              <Figura p={p} pose="guardia" escala={1.45} />
            </div>

            {/* TARJETA DE VALORACIÓN GENERAL Y DATOS BIOGRÁFICOS */}
            <div className="space-y-1.5 border border-line bg-panel p-2.5 rounded-2xl">
              <div className="flex items-center justify-between gap-3">
                <span className="font-cond text-xs uppercase tracking-widest text-mut">Valoración General</span>
                <span className="font-display text-3xl text-gold" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                  {vg}
                </span>
              </div>
              <div className="stat-bar">
                <i style={{ width: `${vg}%`, background: vg >= 70 ? "var(--color-blood)" : "var(--color-gold)" }} />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <Chip tone={p.rol === "boxeador" ? "blood" : "mut"}>
                      {p.rol === "boxeador" ? (p.circuito === "pro" ? "Licencia Profesional" : "Licencia Amateur") : "Pugil en formación"}
                </Chip>
                {p.rol === "boxeador" && (
                  <Chip tone={p.circuito === "pro" ? "gold" : "mut"}>
                    {p.circuito === "pro" ? "Profesional" : "Amateur"}
                  </Chip>
                )}
                <Chip>{p.division}</Chip>
                {p.elite && <Chip tone="neon">Zona Élite</Chip>}
                {p.titulo > 0 && (
                  <Chip tone="gold">
                    <I n="trophy" className="h-3 w-3" /> {TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}
                  </Chip>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-2 font-cond text-sm text-sand">
                <span>{p.edad} años · {p.genero === "M" ? "Masculino" : "Femenino"}</span>
                <BarraEnergia v={p.energia} />
              </div>

              {p.rol === "boxeador" && (
              <div className="border-t border-line pt-2 font-cond text-xs text-sand">
                  Récord: <b className="text-cream">{p.record.v}-{p.record.d}-{p.record.e ?? 0}</b> · <b className="text-blood">{p.record.ko} KO</b> · {totalPeleas(p)} peleas
                  {p.bonusDebut && <span className="ml-1 text-neonc font-bold">(Bono de Madurez)</span>}
                  <div className={`mt-1 font-bold ${categoriaRecord.tono === "alerta" ? "text-blood" : categoriaRecord.tono === "oro" ? "text-gold" : categoriaRecord.tono === "ok" ? "text-emerald-300" : "text-mut"}`}>{categoriaRecord.etiqueta}</div>
                  <div className="text-[11px] text-mut">Amateur: {p.peleasAmateur} · Profesional: {p.peleasProfesionales} ({p.victoriasProfesionales}-{p.derrotasProfesionales}-{p.empatesProfesionales}, {p.kosProfesionales} KO)</div>
                  {p.circuito === "amateur"
                    ? <div className="text-[11px] text-gold">{p.peleasAmateur >= 50 ? "Trayectoria amateur completa: el pase profesional queda a decisión del jugador." : `Camino profesional: ${50 - p.peleasAmateur} peleas amateurs restantes.`}</div>
                    : <div className="text-[11px] text-gold">Títulos: Nacional desde 10 peleas pro · Regional/Mundial desde 25.</div>}
                </div>
              )}

              {rasgo && (
                <div className="border-t border-line pt-2">
                  <div className="font-cond text-xs uppercase tracking-widest text-gold font-bold">{rasgo.nombre}</div>
                  <div className="font-cond text-xs text-sand leading-relaxed">{rasgo.desc}</div>
                </div>
              )}
            </div>

            {/* GRÁFICO DE RADAR PENTAGONAL DE CAPACIDADES */}
            <div className="p-1.5 border border-line bg-panel rounded-2xl space-y-0.5 text-center">
              <span className="text-[10px] font-black uppercase text-gold font-mono-data tracking-wider">
                RADAR HOLÍSTICO DE RENDIMIENTO
              </span>
              <RadarCapacidades atributos={atributosSeguros} className="max-w-[150px]" />
            </div>

          </div>

          {/* COLUMNA DERECHA: ATRIBUTOS DE LOS 3 PILARES + ENTRENAMIENTO + ACCIONES + HISTORIAL */}
          <div className="boxer-sheet-right space-y-2">
            
            {/* LOS 3 PILARES CANÓNICOS (11 ATRIBUTOS) */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PILARES.map((pil, index) => (
                <div key={pil.color} className="panel p-2 rounded-2xl space-y-1">
                  <div className={`font-display text-base tracking-wide border-b border-line pb-1 ${pil.color}`}>
                    {nombrePilar(index)}
                  </div>
                  <div className="space-y-1">
                    {pil.stats.map(s => (
                      <FilaStat
                        key={s.k}
                        label={t(`stat.${s.k}`)}
                        v={p.atrib[s.k]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ENFOQUE DE ENTRENAMIENTO SEMANAL (COMBOS) */}
            <div className="panel p-2.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-wide text-gold flex items-center gap-1.5">
                  <I n="glove" className="h-4 w-4" /> {t("focus.title")}
                </span>
                <span className="min-w-[120px] text-center font-cond text-xs leading-tight text-mut">
                  <span className="block">{t("focus.assigned")}</span><b className="block text-cream">{nombreEnfoque(p.combo)}</b>
                </span>
              </div>

              {necesitaEnfoque && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 p-2">
                  <p className="text-sm text-cream">{t("focus.pending")}</p>
                  <Btn small onClick={() => cambiarCombo(p.combo)}>{t("focus.confirm")}</Btn>
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                {(Object.keys(COMBOS) as ComboId[]).map(cid => {
                  const esActivo = p.combo === cid;
                  return (
                    <button
                      key={cid}
                      onClick={() => cambiarCombo(cid)}
                      title={descripcionEnfoque(cid)}
                      className={`min-h-[56px] p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        esActivo
                          ? "border-gold bg-gold/15 text-gold shadow-md"
                          : "border-line bg-panel2 text-sand hover:border-line2"
                      }`}
                    >
                      <div className="font-display text-sm leading-tight text-cream">{nombreEnfoque(cid)}</div>
                      <div className="font-cond text-sm leading-tight text-mut">{descripcionEnfoque(cid)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONSEJO TÁCTICO DE ESQUINA */}
            <div className="panel p-2.5 rounded-2xl bg-gold/5 border-gold/30 flex items-start gap-2">
              <I n="target" className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs font-cond">
                <span className="font-bold uppercase tracking-wider text-gold">Consejo de Esquina:</span>
                <p className="text-cream leading-relaxed">{t("focus.recommended", { focus: nombreEnfoque(consejo) })}</p>
                {aspirable > 0 && (
                  <p className="text-neonc text-[11px] pt-1">
                    • Posibilidad de disputa: <b>{TITULOS[aspirable as 1 | 2 | 3 | 4].nombre}</b>.
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN ESPECÍFICA SEGÚN ROL: ALUMNO (FOGUEO / LICENCIA) O BOXEADOR (MATCHMAKING / ÉLITE) */}
            <div className="panel p-2.5 rounded-2xl space-y-2">
              {p.rol === "alumno" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base tracking-wide text-cream">
                      Progreso de prácticas de combate
                    </span>
                    <span className="font-mono-data text-xs text-gold font-bold">
                      {p.guanteosRealizados}/{10} guanteos (sparring)
                    </span>
                  </div>
                  <div className="stat-bar h-3">
                    <i
                      style={{
                        width: `${Math.min(100, (p.guanteosRealizados / 10) * 100)}%`,
                        background: "var(--color-gold)",
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="font-cond text-xs text-mut">
                      {p.enEspera
                        ? "Está en lista de espera: cuando se libere una plaza podrá continuar."
                        : p.guanteosRealizados >= 10
                        ? "¡Pugil listo para tramitar su licencia!"
                        : `Requiere ${10 - p.guanteosRealizados} guanteos más para tramitar la licencia.`}
                    </p>
                    {!state.cursos.includes("dt") && onIrAPestana && (
                      <Btn small variant="ghost" onClick={() => onIrAPestana("perfil")}>
                        Obtener Licencia de Entrenador
                      </Btn>
                    )}
                    {puedeLicenciar && (
                      <Btn
                        small
                        variant="gold"
                        onClick={() => dispatch({ type: "LICENCIAR", id: p.id })}
                      >
                        Tramitar licencia del pugil ({fmt(200)})
                      </Btn>
                    )}
                  </div>
                  <div className="rounded-xl border border-gold2/50 bg-gold/10 p-2 text-xs font-cond text-sand">
                    {p.enEspera
                      ? "Está en lista de espera y todavía no puede entrenar ni competir."
                      : !state.cursos.includes("dt")
                      ? "Obtené la Licencia de Entrenador para federar boxeadores del club."
                      : p.guanteosRealizados >= 10
                      ? "Prácticas completas: la ficha ya puede tramitar la licencia amateur para competir."
                      : "Completá las prácticas de combate de los sábados para habilitar la competencia amateur."}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-display text-base tracking-wide text-cream block">
                      Gestión
                    </span>
                    <span className="font-cond text-xs text-mut">
                      {peleaAgendada ? "Pelea pactada: respetá el descanso y la recuperación." : p.lesion ? `Lesión ${p.lesion.gravedad}: ${p.lesion.semanas} semana(s) de recuperación.` : p.energia < 70 ? "Necesita descansar antes de pactar una pelea." : "Disponible para pactar una pelea."}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {p.rol === "boxeador" && p.circuito === "amateur" && p.peleasAmateur >= 50 && (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gold2/40 bg-gold/5 px-2 py-1">
                        <span className="font-cond text-xs text-sand" title="La decisión no cambia ni borra su récord amateur.">
                          {paseProfesional.ok ? "Puede aceptar el pase; conserva su récord amateur." : paseProfesional.motivo === "cupo" ? "Cupo profesional completo: seguirá amateur hasta que liberes una plaza." : "Resuelve la pelea agendada antes de cambiar de circuito."}
                        </span>
                        <Btn small variant="gold" disabled={!paseProfesional.ok} onClick={() => dispatch({ type: "PROMOVER_PRO", id: p.id })}>
                          Aceptar pase profesional
                        </Btn>
                      </div>
                    )}
                    <Btn
                      small
                      variant={p.elite ? "gold" : "ghost"}
                      onClick={() => dispatch({ type: "ALTERNAR_ELITE", id: p.id })}
                    >
                      {p.elite ? "✓ En Zona Élite" : "+ Promover a Zona Élite"}
                    </Btn>

                    {!peleaAgendada && (
                      <Btn
                        small
                        variant="blood"
                        onClick={() => {
                          if (onBuscarRival) onBuscarRival(p.id);
                          else dispatch({ type: "BUSCAR_RIVAL", id: p.id });
                          onCerrar();
                        }}
                      >
                        <I n="target" className="h-3.5 w-3.5" /> Buscar Ofertas de Combate
                      </Btn>
                    )}
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => setConfirmarTransferencia(true)}
                    >
                      Transferir fuera del club
                    </Btn>
                  </div>
                </div>
              )}
            </div>

            {/* HISTORIAL RECIENTE DE COMBATES */}
            <div className="panel p-2.5 rounded-2xl space-y-1">
              <span className="font-display text-sm uppercase tracking-wider text-sand flex items-center gap-1.5">
                <I n="trophy" className="h-3.5 w-3.5 text-gold" /> Historial de Combates Recientes
              </span>

              {historialAtleta.length > 0 ? (
                <div className="space-y-1 text-xs font-cond">
                  {historialAtleta.map((h, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-panel2 border border-line flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${h.gane ? "text-emerald-400" : "text-blood"}`}>
                          {h.empate ? "EMPATE" : h.gane ? "VICTORIA" : "DERROTA"}
                        </span>
                        <span className="text-sand">{h.metodo}</span>
                        <span className="text-mut font-mono-data">({h.resumen})</span>
                      </div>
                      <span className="text-gold font-mono-data font-bold">+{fmt(h.bolsa)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-cond text-xs text-mut italic">
                  Aún no registra combates oficiales en su historial.
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
      {dialogoTransferencia}
    </Modal>
  );
}

export default BoxerSheet;
export { BoxerSheet as FichaAtleta };
