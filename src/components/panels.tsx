import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { CATEGORIAS, CURSOS, EQUIPOS, PERSONAL_INFO, PROPIEDADES, TITULOS } from "../game/data";
import { audioHabilitado, setAudioHabilitado } from "../game/audio";
import { alumnosActivos, alumnosEnEspera, capacidadAlumnos, fmt, nivelGimnasio, sanitizarEstado, sucursales, valoracion } from "../game/engine";
import { CLAVE_GUARDADO, guardarPartida, useGame } from "../game/state";
import type { Accion, CategoriaMercado, CursoId, EstadoJuego, PersonalId, Pugilista, RamaCurso } from "../game/types";
import { BarraEnergia, Btn, Chip, I, Modal, RostroBoxeador } from "./ui";

// ==================== EXPORTACIÓN / IMPORTACIÓN DE PARTIDA JSON ====================
export function exportarPartidaJSON(estado: EstadoJuego) {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `partida-${(estado.nombreGimnasio || "vida-del-boxeo").toLowerCase().replace(/\s+/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarPartidaJSON(
  archivo: File,
  dispatch: (a: Accion) => void,
  onExito?: () => void,
  onError?: () => void
) {
  const lector = new FileReader();
  if (archivo.size > 2_000_000) {
    dispatch({ type: "TOAST", texto: "El archivo es demasiado grande (máximo 2 MB).", tono: "alerta" });
    if (onError) onError();
    return;
  }
  lector.onload = () => {
    try {
      const bruto: unknown = JSON.parse(String(lector.result));
      if (!bruto || typeof bruto !== "object" || !Array.isArray((bruto as { plantel?: unknown }).plantel)) {
        throw new Error("formato inválido");
      }
      const estado = sanitizarEstado(bruto);
      dispatch({ type: "IMPORTAR", estado });
      if (onExito) onExito();
    } catch {
      dispatch({ type: "TOAST", texto: "El archivo no parece una partida válida.", tono: "alerta" });
      if (onError) onError();
    }
  };
  lector.readAsText(archivo);
}

interface PanelPlantelProps {
  onAbrir?: (id: string) => void;
  onBuscarRival?: (id: string) => void;
  onSeleccionarBoxeador?: (b: Pugilista) => void;
}

// ==================== PLANTEL DE ATLETAS ====================
export function PanelPlantel({ onAbrir, onBuscarRival, onSeleccionarBoxeador }: PanelPlantelProps) {
  const { state, dispatch } = useGame();
  const alumnos = alumnosActivos(state);
  const alumnosEspera = alumnosEnEspera(state);
  const boxeadores = state.plantel.filter(p => p.rol === "boxeador");
  const tieneDT = state.cursos.includes("dt");
  const cupoAlumnos = capacidadAlumnos(state);

  const seleccionarAtleta = (p: Pugilista) => {
    if (onAbrir) onAbrir(p.id);
    if (onSeleccionarBoxeador) onSeleccionarBoxeador(p);
  };

  const Tarjeta = ({ p }: { p: Pugilista }) => {
    const agendada = state.pendientes.some(x => x.miId === p.id);
    const listoSabado = p.rol === "alumno" && p.fogueo >= p.fogueoMeta && tieneDT;

    return (
      <motion.button
        layout
        whileHover={{ y: -2 }}
        onClick={() => seleccionarAtleta(p)}
        className={`panel w-full p-3 text-left transition-colors hover:border-gold2 cursor-pointer ${agendada ? "border-blood/60" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <RostroBoxeador atleta={p} className="w-12 h-12 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <div className="font-display text-lg leading-tight tracking-wide text-cream truncate">
                {p.nombre}
              </div>
              <div className="font-cond text-[11px] uppercase tracking-wider text-mut truncate">
                {p.edad} años · {p.division} · {p.rol === "boxeador" ? (p.circuito === "pro" ? "Profesional" : "Amateur") : "Alumno"}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-display text-2xl text-gold">{valoracion(p.atrib)}</div>
            <div className="font-cond text-[10px] uppercase text-mut">Valoración</div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <BarraEnergia v={p.energia} />
          {p.enEspera && <Chip tone="gold">En espera</Chip>}
          {p.elite && <Chip tone="neon">Élite</Chip>}
          {p.titulo > 0 && (
            <Chip tone="gold">
              <I n="trophy" className="h-3 w-3" />
              {TITULOS[p.titulo as 1 | 2 | 3 | 4].nombre}
            </Chip>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
          {p.rol === "alumno" ? (
            <>
              <span className="font-cond text-[11px] uppercase tracking-wide text-sand">
                Prácticas <b className="text-gold">{p.fogueo}/{p.fogueoMeta}</b>
              </span>
              <div className="stat-bar w-16">
                <i style={{ width: `${(p.fogueo / p.fogueoMeta) * 100}%`, background: "var(--color-gold)" }} />
              </div>
              {listoSabado && !p.enEspera && (
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    dispatch({ type: "LICENCIAR", id: p.id });
                  }}
                  className="btn-poster guia-luminica ml-auto border border-[#ffe0a0]/50 bg-gold px-3 py-1 text-sm text-ink cursor-pointer"
                >
                  <span>Licenciar {fmt(200)}</span>
                </button>
              )}
            </>
          ) : (
            <>
              <span className="font-cond text-[11px] uppercase text-sand">
                Récord: <b className="text-cream">{p.record.v}-{p.record.d}</b> · <b className="text-blood">{p.record.ko} KO</b>
              </span>
              <div className="ml-auto">
                {agendada ? (
                  <Chip tone="blood">En cartelera</Chip>
                ) : (
                  onBuscarRival && (
                    <Btn
                      small
                      variant="dark"
                      onClick={() => onBuscarRival(p.id)}
                    >
                      <I n="target" className="h-3 w-3" /> Buscar rival
                    </Btn>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Plantel de Atletas</h2>
        <Chip tone={alumnosEspera.length ? "blood" : "gold"}><I n="users" className="h-3 w-3" /> Alumnos {alumnos.length}/{cupoAlumnos}{alumnosEspera.length ? ` · ${alumnosEspera.length} en espera` : ""}</Chip>
        <Chip tone="blood"><I n="glove" className="h-3 w-3" /> Federados {boxeadores.length}</Chip>
        <Chip><I n="bell" className="h-3 w-3" /> Cartelera del sábado: {state.pendientes.length} pelea(s)</Chip>
        <div className="ml-auto flex gap-2">
          <Btn
            small
            variant={state.veladaProgramada ? "gold" : "ghost"}
            onClick={() => dispatch({ type: "ALTERNAR_VELADA" })}
            disabled={!state.cursos.includes("veladas")}
          >
            <I n="ring" className="h-3.5 w-3.5" /> {state.veladaProgramada ? "Velada programada" : "Programar velada"}
          </Btn>
        </div>
      </div>

      {!tieneDT && (
        <div className="border border-gold2/50 bg-gold/5 px-4 py-2.5 font-cond text-sm text-sand rounded-xl">
          <b className="text-gold">Cómo habilitar a tu primer boxeador:</b> aprobá la licencia de entrenador en Mi Perfil,
          completá sus <b>prácticas de combate</b> (8 a 10, los sábados) y luego pagá la habilitación.
        </div>
      )}

      {/* SECCIÓN BOXEADORES FEDERADOS */}
      {boxeadores.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl tracking-wide text-blood flex items-center gap-2">
            <span>🥊 Boxeadores Federados Oficiales ({boxeadores.length})</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {boxeadores.map(p => <Tarjeta key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* SECCIÓN ALUMNOS EN FORMACIÓN */}
      <section>
        <h3 className="mb-2 font-display text-xl tracking-wide text-sand flex items-center gap-2">
            <span>🥋 Alumnos en Formación y Práctica ({alumnos.length}/{cupoAlumnos})</span>
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {alumnos.map(p => <Tarjeta key={p.id} p={p} />)}
        </div>
        {alumnos.length === 0 && (
          <p className="font-cond text-sm italic text-mut">
            Sin alumnos: la fama y el boca a boca traerán nuevos talentos al gimnasio.
          </p>
        )}
      </section>
      {alumnosEspera.length > 0 && (
        <section className="rounded-xl border border-dashed border-gold2/50 bg-gold/5 p-4">
          <h3 className="mb-2 font-display text-lg tracking-wide text-gold">Lista de espera ({alumnosEspera.length})</h3>
          <p className="mb-3 font-cond text-sm text-sand">Estos alumnos todavía no ocupan una plaza de entrenamiento. Al liberar un cupo, pasan automáticamente a las clases.</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {alumnosEspera.map(p => <Tarjeta key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ==================== MERCADO EN 4 CATEGORÍAS ====================
export function PanelMercado() {
  const { state, dispatch } = useGame();
  const [cat, setCat] = useState<CategoriaMercado>("equipamiento");
  const [nombreMarca, setNombreMarca] = useState("");
  const items = Object.entries(EQUIPOS).filter(([, v]) => v.cat === cat);

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Equipamiento e Instalaciones</h2>
        <span className="font-cond text-sm text-sand">Caja disponible: <b className="text-gold">{fmt(state.dinero)}</b></span>
        <span className="font-cond text-sm text-sand">Instalado: <b className="text-cream">{state.equipamiento.length}/21</b></span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`border px-3 py-1.5 font-cond text-sm uppercase tracking-wider transition-colors cursor-pointer ${
              cat === c.id ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel text-sand hover:border-line2"
            }`}
          >
            <span className="inline-flex items-center gap-1.5"><I n={c.icono} className="h-4 w-4" /> {c.nombre}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(([id, eq]) => {
          const comprado = state.equipamiento.includes(id as never);
          const bloqueado = id === "zonaElite" && !state.cursos.includes("altoRendimiento");
          return (
            <div key={id} className={`panel p-4 ${comprado ? "border-win/50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold2/50 bg-gold/10 text-gold shadow-inner"><I n={eq.icono} className="h-6 w-6" /></div>
                  <div>
                    <div className="font-display text-lg leading-tight tracking-wide text-cream">{eq.nombre}</div>
                    <div className="font-display text-base text-gold">{fmt(eq.costo)}</div>
                  </div>
                </div>
                {comprado && <Chip tone="win"><I n="check" className="h-3 w-3" /> Instalado</Chip>}
              </div>
              <p className="mt-2 font-cond text-sm text-sand">{eq.desc}</p>
              <p className="mt-1 font-cond text-xs text-neonc">{eq.efecto}</p>
              {!comprado && (
                <Btn
                  small
                  variant={state.dinero >= eq.costo && !bloqueado ? "gold" : "dark"}
                  className="mt-3 w-full"
                  disabled={state.dinero < eq.costo || bloqueado}
                  onClick={() => dispatch({ type: "COMPRAR_EQUIPO", id: id as never })}
                >
                  {bloqueado ? "Requiere Alto Rendimiento" : `Comprar · ${fmt(eq.costo)}`}
                </Btn>
              )}
              {id === "estudioMarca" && comprado && (
                <div className="mt-3 border-t border-line pt-2">
                  {state.marcaRopa ? (
                    <p className="font-cond text-sm text-gold">Tu marca: <b>"{state.marcaRopa}"</b> — liquidación de ventas cada domingo.</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={nombreMarca}
                        onChange={e => setNombreMarca(e.target.value)}
                        maxLength={16}
                        placeholder="Nombre de la marca"
                        className="w-full border border-line bg-ink px-2 py-1 font-cond text-sm text-cream outline-none focus:border-gold"
                      />
                      <Btn small variant="gold" onClick={() => dispatch({ type: "CREAR_MARCA", nombre: nombreMarca })}>Lanzar</Btn>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MI PERFIL: CURSOS, PROPIEDADES, LEGADO ====================
export function PanelPerfil() {
  const { state, dispatch } = useGame();
  const ramas: { id: RamaCurso; nombre: string; icono: string; color: string }[] = [
    { id: "deportiva", nombre: "Rama Deportiva", icono: "glove", color: "text-blood" },
    { id: "promotora", nombre: "Rama Promotora", icono: "ring", color: "text-gold" },
    { id: "empresarial", nombre: "Rama Empresarial", icono: "store", color: "text-neonc" },
  ];
  const puedeLegado = state.plantel.some(p => p.titulo === 4) || state.fama >= 85;

  return (
    <div className="space-y-5">
      <div className="panel grid gap-4 p-4 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-gold">Perfil del Coach · {state.nombreJugador}</h2>
          <p className="font-cond text-sm text-sand">
            Semana {state.semana} al frente de <b className="text-cream">{state.nombreGimnasio}</b>. Nivel de gimnasio: <b className="text-gold">{nivelGimnasio(state)}</b> · Legados: <b className="text-neonc">{state.legados}</b>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Peleas", state.stats.peleas], ["Victorias", state.stats.victorias], ["KOs", state.stats.kos],
              ["Veladas", state.stats.veladas], ["Títulos", state.stats.titulos],
            ].map(([k, v]) => (
              <div key={k as string} className="border border-line bg-panel2 px-2 py-1.5 text-center">
                <div className="font-display text-2xl text-cream">{v}</div>
                <div className="font-cond text-[10px] uppercase tracking-widest text-mut">{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <Btn
            variant={puedeLegado ? "gold" : "dark"}
            disabled={!puedeLegado}
            onClick={() => {
              if (window.confirm("¿Iniciar el Sistema de Legado? Renacerás como tu mejor alumno con bonificaciones de prestigio.")) {
                dispatch({ type: "LEGADO" });
              }
            }}
          >
            <I n="medal" className="h-4 w-4" /> Sistema de Legado
          </Btn>
          <span className="font-cond text-[11px] text-mut">Se desbloquea con un Título Mundial o 85 de fama.</span>
        </div>
      </div>

      {/* CURSOS */}
      <section>
        <h3 className="mb-2 font-display text-xl tracking-wide text-cream">Cursos del Coach · 3 ramas de especialización</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {ramas.map(rama => (
            <div key={rama.id} className="panel p-4">
              <div className={`mb-3 flex items-center gap-2 font-display text-xl tracking-wide ${rama.color}`}>
                <I n={rama.icono} className="h-5 w-5" /> {rama.nombre}
              </div>
              <div className="space-y-3">
                {(Object.keys(CURSOS) as CursoId[]).filter(c => CURSOS[c].rama === rama.id)
                  .sort((x, y) => CURSOS[x].nivel - CURSOS[y].nivel)
                  .map(cid => {
                    const c = CURSOS[cid];
                    const aprobado = state.cursos.includes(cid);
                    const reqOk = !c.req || state.cursos.includes(c.req);
                    return (
                      <div key={cid} className={`border p-3 ${aprobado ? "border-win/50 bg-win/5" : "border-line bg-panel2"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-display text-base tracking-wide text-cream">
                            <span className="mr-1.5 text-mut">Nv.{c.nivel}</span>{c.nombre}
                          </div>
                          {aprobado ? (
                            <Chip tone="win"><I n="check" className="h-3 w-3" /> Aprobado</Chip>
                          ) : (
                            <Btn
                              small
                              variant={reqOk && state.dinero >= c.costo ? "gold" : "dark"}
                              disabled={!reqOk || state.dinero < c.costo}
                              onClick={() => dispatch({ type: "COMPRAR_CURSO", id: cid })}
                            >
                              Comprar · {fmt(c.costo)}
                            </Btn>
                          )}
                        </div>
                        <p className="mt-1 font-cond text-xs text-sand">{c.desc}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROPIEDADES */}
      <section>
        <h3 className="mb-2 font-display text-xl tracking-wide text-cream">Bienes Raíces Adquiridos</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["local", "terreno", "sucursal", "apartamento", "mansion", "arena"] as const).map(pid => {
            const p = PROPIEDADES[pid];
            const adquirida = state.propiedades.includes(pid);
            return (
              <div key={pid} className={`panel p-3 ${adquirida ? "border-win/50" : "opacity-60"}`}>
                <div className="flex items-center gap-2">
                  <I n={p.icono} className="h-4 w-4 text-gold" />
                  <span className="font-display text-base tracking-wide text-cream">{p.nombre}</span>
                  {adquirida ? <span className="ml-auto"><Chip tone="win">Escriturada</Chip></span> : <span className="ml-auto font-cond text-xs text-mut">{fmt(p.costo)}</span>}
                </div>
                <p className="mt-1 font-cond text-xs text-sand">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ==================== PERSONAL TÉCNICO ====================
export function PanelPersonal() {
  const { state, dispatch } = useGame();
  const tipos = Object.keys(PERSONAL_INFO) as PersonalId[];
  const nSuc = sucursales(state);

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-display text-2xl tracking-wide text-gold">Cuerpo Técnico & Empleados</h2>
        <span className="font-cond text-sm text-sand">Contratados: <b className="text-cream">{state.personal.length}</b></span>
        <span className="font-cond text-sm text-sand">Costo nómina semanal: <b className="text-blood">{fmt(state.personal.reduce((ac, p) => ac + PERSONAL_INFO[p.tipo].sueldo, 0))}</b></span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tipos.map(t => {
          const info = PERSONAL_INFO[t];
          const contratados = state.personal.filter(p => p.tipo === t);
          const limiteSucursal = info.multiple && contratados.length >= Math.max(nSuc, 1);
          return (
            <div key={t} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg tracking-wide text-cream">{info.nombre}</div>
                  <div className="font-cond text-xs text-gold">Sueldo: {fmt(info.sueldo)}/sem</div>
                </div>
                <div className="grid h-9 w-9 place-items-center border border-line bg-ink text-sand"><I n={info.icono} className="h-4 w-4" /></div>
              </div>
              <p className="mt-2 font-cond text-xs text-sand">{info.desc}</p>
              {contratados.length > 0 && (
                <div className="mt-3 border-t border-line pt-2">
                  <div className="font-cond text-[11px] uppercase tracking-wider text-mut">Personal activo:</div>
                  {contratados.map(m => (
                    <div key={m.id} className="mt-1 flex items-center justify-between font-cond text-sm text-cream">
                      <span>{m.nombre}</span>
                      <button onClick={() => dispatch({ type: "DESPEDIR", id: m.id })} className="font-cond text-xs uppercase text-mut transition-colors hover:text-blood cursor-pointer">Despedir</button>
                    </div>
                  ))}
                </div>
              )}
              {(!info.multiple || !limiteSucursal) && !(contratados.length > 0 && !info.multiple) && (
                <Btn small variant="gold" className="mt-3 w-full" onClick={() => dispatch({ type: "CONTRATAR", tipo: t })}>
                  <I n="case" className="h-3.5 w-3.5" /> Contratar {info.multiple ? `(${contratados.length}/${Math.max(nSuc, 1)})` : ""}
                </Btn>
              )}
              {info.multiple && limiteSucursal && <p className="mt-2 font-cond text-[11px] text-mut">Cada puesto de sucursal requiere una sucursal propia.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== AJUSTES: EXPORTAR / IMPORTAR ====================
export function ModalAjustes({ onCerrar }: { onCerrar: () => void }) {
  const { state, dispatch } = useGame();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [guardadoEn, setGuardadoEn] = useState(() => {
    try { return localStorage.getItem(`${CLAVE_GUARDADO}:guardadoEn`); } catch { return null; }
  });
  const [sonido, setSonido] = useState(audioHabilitado);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const exportar = () => {
    exportarPartidaJSON(state);
    setMensaje("Archivo preparado para descargar.");
  };

  const guardarAhora = () => {
    if (guardarPartida(state)) {
      const ahora = new Date().toISOString();
      setGuardadoEn(ahora);
      setMensaje("Partida guardada en este navegador.");
      dispatch({ type: "TOAST", texto: "Partida guardada correctamente.", tono: "ok" });
    } else {
      setMensaje("No se pudo guardar. Exportá un archivo .json como respaldo.");
    }
  };

  const importar = (archivo: File) => {
    importarPartidaJSON(archivo, dispatch, onCerrar);
  };

  return (
    <Modal title="Configuración y Partida" icon="gear" onClose={onCerrar}>
      <div className="space-y-3">
        <div className="border border-line bg-panel2 p-3 rounded-xl">
          <div className="font-display text-lg text-cream">Guardar y cargar</div>
          <p className="font-cond text-xs text-sand">La partida se guarda sola después de cada acción. También podés crear un respaldo para moverla a otra computadora.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn small variant="gold" onClick={guardarAhora}><I n="check" className="h-3.5 w-3.5" /> Guardar ahora</Btn>
            <Btn small variant="gold" onClick={exportar}><I n="download" className="h-3.5 w-3.5" /> Exportar .json</Btn>
            <Btn small variant="dark" onClick={() => archivoRef.current?.click()}><I n="upload" className="h-3.5 w-3.5" /> Importar .json</Btn>
            <input
              ref={archivoRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) importar(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-2 font-cond text-[11px] text-mut">
            {guardadoEn ? `Último guardado: ${new Date(guardadoEn).toLocaleString()}` : "Todavía no hay un guardado registrado."}
          </div>
          {mensaje && <div className="mt-2 rounded-lg border border-gold2/40 bg-gold/10 px-2.5 py-1.5 font-cond text-xs text-gold">{mensaje}</div>}
        </div>

        <div className="border border-blood/40 bg-blood/5 p-3 rounded-xl">
          <div className="font-display text-lg text-[#ff8a7e]">Zona de riesgo</div>
          <p className="font-cond text-xs text-sand">Borra la carrera actual (los legados también). No se puede deshacer.</p>
          <Btn
            small
            variant="blood"
            className="mt-2"
            onClick={() => {
              if (window.confirm("¿Seguro? Se borrará toda la carrera actual.")) {
                dispatch({ type: "REINICIAR" });
                onCerrar();
              }
            }}
          >
            <I n="x" className="h-3.5 w-3.5" /> Reiniciar carrera
          </Btn>
        </div>

        <div className="border border-line bg-panel2 p-3 rounded-xl">
          <div className="font-display text-lg text-cream">Atajos de teclado</div>
          <div className="mt-2 grid gap-1.5 font-cond text-xs text-sand sm:grid-cols-2">
            <span><kbd className="keycap">1–6</kbd> Cambiar de pantalla</span>
            <span><kbd className="keycap">N</kbd> Cerrar el día</span>
            <span><kbd className="keycap">S</kbd> Semana rápida</span>
            <span><kbd className="keycap">Esc</kbd> Cerrar ventanas</span>
          </div>
        </div>

        <div className="border border-line bg-panel2 p-3 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg text-cream">Sonido</div>
              <p className="font-cond text-xs text-sand">Campana, golpes, monedas y notificaciones.</p>
            </div>
            <Btn small variant={sonido ? "gold" : "dark"} onClick={() => {
              const siguiente = !sonido;
              setSonido(siguiente);
              setAudioHabilitado(siguiente);
            }}>
              <I n={sonido ? "volume" : "x"} className="h-3.5 w-3.5" /> {sonido ? "Activado" : "Silenciado"}
            </Btn>
          </div>
        </div>

        <div className="font-cond text-[11px] leading-relaxed text-mut">
          La Vida del Boxeo · Simulador de gestión deportiva y vida · Turnos semanales · Sistema de 10 puntos · Registro Oficial de Golpes ·
          Todo el contenido es ficción y cualquier parecido con la realidad es pura gloria compartida.
        </div>
      </div>
    </Modal>
  );
}
