import { useState } from "react";
import { CURSOS, DIVISIONES_M, FOCUS_INFO, GEAR, STAFF_INFO, fmt } from "../game/data";
import { capacidadAlumnos, capacidadFederados, rankingDe, tablaRanking } from "../game/engine";
import { useGame } from "../game/state";
import type { Boxer, Circuito, CourseId, Focus, Genero, GearId, StaffType } from "../game/types";
import { Btn, Chip, EnergyBar, I, StatBar } from "./ui";

function BoxerCard({ b, onOpen }: { b: Boxer; onOpen: () => void }) {
  const { state } = useGame();
  const ov = Math.round(b.fuerza * 0.11 + b.velocidad * 0.11 + b.potencia * 0.11 + b.resistencia * 0.1 + b.ataque * 0.13 + b.defensa * 0.12 + b.tecnica * 0.12 + b.inteligencia * 0.07 + b.mentalidad * 0.06 + b.talento * 0.07);
  const programada = state.schedule.includes(b.id);
  return (
    <button onClick={onOpen} className="panel group w-full p-3 text-left transition-all hover:-translate-y-0.5 hover:border-gold2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-xl tracking-wide text-cream group-hover:text-gold">{b.nombre}</span>
            {b.campeon && <I n="trophy" className="h-4 w-4 shrink-0 text-gold" />}
            {b.elite && <Chip tone="neon">Élite</Chip>}
          </div>
          <div className="font-cond text-xs uppercase tracking-wider text-mut">
            {b.division} · {b.edad}a · {b.rol === "boxeador" ? `${b.circuito} · ${b.ganadas}-${b.perdidas} (${b.kos} KO)` : `talento ${b.talento}`}
          </div>
        </div>
        <div className="shrink-0 border border-line2 bg-panel2 px-2.5 py-1 text-center">
          <div className="font-cond text-xl font-bold leading-none" style={{ color: ov >= 70 ? "var(--color-blood)" : ov >= 50 ? "var(--color-gold)" : "var(--color-sand)" }}>{ov}</div>
          <div className="font-cond text-[9px] uppercase text-mut">global</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <EnergyBar v={b.energia} />
        {programada ? <Chip tone="blood">En cartelera</Chip> : (
          <span className="flex items-center gap-1 font-cond text-[11px] uppercase tracking-wide text-sand">
            <I n={FOCUS_INFO[b.focus].icon} className="h-3 w-3 text-gold" /> {FOCUS_INFO[b.focus].nombre}
          </span>
        )}
      </div>
    </button>
  );
}

export function RosterPanel({ onOpenBoxer }: { onOpenBoxer: (id: string) => void }) {
  const { state, dispatch } = useGame();
  const alumnos = state.roster.filter(b => b.rol === "alumno");
  const boxeadores = state.roster.filter(b => b.rol === "boxeador");
  const [circ, setCirc] = useState<Circuito>("amateur");
  const [gen, setGen] = useState<Genero>("M");
  const [div, setDiv] = useState(DIVISIONES_M[4]);
  const ranking = tablaRanking(state, circ, div, gen);
  const propios = boxeadores.filter(b => b.circuito === circ && b.division === div && b.genero === gen);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* alumnos */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-display text-2xl tracking-wide text-cream">
            <I n="users" className="h-5 w-5 text-gold" /> Alumnos <span className="font-cond text-sm text-mut">{alumnos.length}/{capacidadAlumnos(state)}</span>
          </h3>
          <div className="space-y-2">
            {alumnos.map(b => <BoxerCard key={b.id} b={b} onOpen={() => onOpenBoxer(b.id)} />)}
            {alumnos.length === 0 && <p className="panel p-4 font-cond text-sm text-mut">Sin alumnos. Los prospectos llegan por eventos o scouting en la ciudad.</p>}
          </div>
        </section>
        {/* boxeadores */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-display text-2xl tracking-wide text-cream">
            <I n="glove" className="h-5 w-5 text-blood" /> Boxeadores <span className="font-cond text-sm text-mut">{boxeadores.length}/{capacidadFederados(state)}</span>
          </h3>
          <div className="space-y-2">
            {boxeadores.map(b => <BoxerCard key={b.id} b={b} onOpen={() => onOpenBoxer(b.id)} />)}
            {boxeadores.length === 0 && (
              <p className="panel p-4 font-cond text-sm text-mut">
                {state.courses.includes("tecnico") ? "Federa a un alumno con talento desde su ficha." : "Haz el curso de Director Técnico para federar competidores."}
              </p>
            )}
          </div>
          {/* cartelera */}
          <div className="panel mt-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 font-display text-xl tracking-wide text-gold"><I n="calendar" className="h-4 w-4" /> Cartelera del sábado</h4>
              {state.courses.includes("promotor") && (
                <Btn small variant={state.veladaProgramada ? "blood" : "dark"} onClick={() => dispatch({ type: "TOGGLE_VELADA" })}>
                  <I n="trophy" className="h-3.5 w-3.5" /> {state.veladaProgramada ? "Velada activa" : "Organizar velada"}
                </Btn>
              )}
            </div>
            {state.veladaProgramada && <p className="mt-1 font-cond text-xs text-sand">Velada propia: cobrarás entradas según tu fama ({fmt(state.fama * 18 + 150)} aprox.) menos costos de producción.</p>}
            <div className="mt-2 space-y-1.5">
              {state.schedule.length === 0 && <p className="font-cond text-sm text-mut">Nadie programado. Abre la ficha de un boxeador y pulsa "Programar pelea".</p>}
              {state.schedule.map(id => {
                const b = state.roster.find(x => x.id === id);
                if (!b) return null;
                return (
                  <div key={id} className="flex items-center justify-between border border-line bg-panel2 px-3 py-1.5">
                    <span className="font-cond text-sm text-cream">{b.nombre} <span className="text-mut">· {b.circuito} · {b.division}</span></span>
                    <button onClick={() => dispatch({ type: "UNSCHEDULE", id })} className="text-mut transition-colors hover:text-blood"><I n="x" className="h-4 w-4" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* rankings */}
      <section className="panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto flex items-center gap-2 font-display text-2xl tracking-wide text-cream"><I n="flag" className="h-5 w-5 text-gold" /> Rankings oficiales</h3>
          <select value={circ} onChange={e => setCirc(e.target.value as Circuito)} className="border border-line bg-panel2 px-2 py-1 font-cond text-sm uppercase text-cream">
            <option value="amateur">Amateur</option><option value="pro">Profesional</option>
          </select>
          <select value={gen} onChange={e => setGen(e.target.value as Genero)} className="border border-line bg-panel2 px-2 py-1 font-cond text-sm uppercase text-cream">
            <option value="M">Masculino</option><option value="F">Femenino</option>
          </select>
          <select value={div} onChange={e => setDiv(e.target.value)} className="border border-line bg-panel2 px-2 py-1 font-cond text-sm uppercase text-cream">
            {DIVISIONES_M.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-line font-cond text-[11px] uppercase tracking-widest text-mut">
                <th className="py-1.5 pr-2">#</th><th className="py-1.5 pr-2">Boxeador</th><th className="py-1.5 pr-2">Récord</th><th className="py-1.5">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.id} className="border-b border-line/50 font-cond text-sm text-sand">
                  <td className="py-1.5 pr-2 font-bold text-gold">{i + 1}</td>
                  <td className="py-1.5 pr-2 text-cream">{r.nombre} {r.campeon && <I n="trophy" className="ml-1 inline h-3.5 w-3.5 text-gold" />}</td>
                  <td className="py-1.5 pr-2">{r.ganadas}-{r.perdidas}</td>
                  <td className="py-1.5"><StatBar v={r.fuerza * 0.2 + r.tecnica * 0.2 + r.defensa * 0.2 + r.ataque * 0.2 + r.potencia * 0.2} color="auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {propios.map(b => (
          <p key={b.id} className="mt-2 font-cond text-sm text-gold">
            <I n="star" className="mr-1 inline h-3.5 w-3.5" /> Tu boxeador {b.nombre}: puesto #{rankingDe(state, b)} en esta división.
            {rankingDe(state, b) <= 2 && b.ganadas >= 3 && " ¡La pelea de título está a tu alcance!"}
          </p>
        ))}
      </section>
    </div>
  );
}

export function MarketPanel() {
  const { state, dispatch } = useGame();
  const [marca, setMarca] = useState("");
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section>
        <h3 className="mb-2 flex items-center gap-2 font-display text-2xl tracking-wide text-cream">
          <I n="cart" className="h-5 w-5 text-gold" /> Tienda de Don Anselmo
        </h3>
        <p className="mb-3 font-cond text-sm text-mut">Equipamiento permanente: cada compra mejora el crecimiento de todo tu plantel.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(GEAR) as GearId[]).map(id => {
            const g = GEAR[id];
            const owned = state.gear.includes(id);
            return (
              <div key={id} className={`panel p-4 transition-all ${owned ? "border-win/50" : "hover:border-gold2"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-xl tracking-wide text-cream">{g.nombre}</div>
                    <div className="font-cond text-xs text-mut">{g.desc}</div>
                  </div>
                  <I n={id === "zonaElite" ? "trophy" : id === "neon" ? "spark" : "dumbbell"} className={`h-6 w-6 shrink-0 ${owned ? "text-win" : "text-gold"}`} />
                </div>
                <div className="mt-2 font-cond text-xs uppercase tracking-wide text-gold">{g.bonus}</div>
                <div className="mt-3">
                  {owned ? <Chip tone="win"><I n="check" className="h-3 w-3" /> Instalado</Chip> : (
                    <Btn small variant="gold" disabled={state.dinero < g.costo} onClick={() => dispatch({ type: "BUY_GEAR", id })}>
                      <I n="coin" className="h-3.5 w-3.5" /> {fmt(g.costo)}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="h-fit space-y-4">
        <div className="panel p-4">
          <h3 className="flex items-center gap-2 font-display text-2xl tracking-wide text-cream"><I n="shirt" className="h-5 w-5 text-neonm" /> Tu marca de ropa</h3>
          {state.marcaRopa ? (
            <div className="mt-3 space-y-2">
              <div className="border border-neonm/50 bg-neonm/10 px-3 py-2 font-display text-2xl tracking-widest text-neonm">{state.marcaRopa}</div>
              <p className="font-cond text-sm text-sand">
                Ventas semanales estimadas: <b className="text-gold">{fmt(state.fama * 2.5 * (state.staff.some(x => x.type === "marketing") ? 1.8 : 1))}</b>
                {state.staff.some(x => x.type === "marketing") && " (con Jefe de Marketing)"}
              </p>
              <p className="font-cond text-xs text-mut">A mayor fama, más camisetas con tu logo en cada esquina.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="font-cond text-sm text-sand">Lanza tu línea de indumentaria y vende según tu fama. Requiere Gestión Empresarial y {fmt(2000)}.</p>
              <input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Furia Box Club"
                className="w-full border border-line bg-ink px-3 py-2 font-cond text-sm text-cream outline-none placeholder:text-mut focus:border-gold2" />
              <Btn disabled={!state.courses.includes("empresarial") || state.dinero < 2000 || !marca.trim()}
                onClick={() => dispatch({ type: "CREATE_BRAND", name: marca })}>
                <I n="shirt" className="h-4 w-4" /> Lanzar marca · {fmt(2000)}
              </Btn>
              {!state.courses.includes("empresarial") && <p className="font-cond text-xs uppercase tracking-wide text-mut">Requiere: Gestión Empresarial</p>}
            </div>
          )}
        </div>
        {state.patrocinio && (
          <div className="panel border-gold2/50 p-4">
            <h4 className="font-display text-xl tracking-wide text-gold">Sponsor activo</h4>
            <p className="font-cond text-sm text-sand">{state.patrocinio.nombre}: <b className="text-gold">{fmt(state.patrocinio.semanal)}/semana</b> · {state.patrocinio.semanas} semana(s) restantes</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function ProfilePanel() {
  const { state, dispatch } = useGame();
  const orden: CourseId[] = ["instructor", "tecnico", "promotor", "empresarial"];
  const puedeLegado = state.fama >= 60 && state.roster.some(b => b.campeon);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-4">
        <div className="panel p-4">
          <h3 className="flex items-center gap-2 font-display text-2xl tracking-wide text-cream"><I n="user" className="h-5 w-5 text-gold" /> {state.nombreJugador}</h3>
          <p className="font-cond text-sm text-mut">Coach de {state.nombreGimnasio} · Semana {state.semana}, Año {state.anio}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Peleas", state.stats.peleas], ["Victorias", state.stats.victorias], ["Nocauts", state.stats.kos],
              ["Veladas", state.stats.veladas], ["Fama", Math.round(state.fama)], ["Legados", state.legados],
            ].map(([k, v]) => (
              <div key={k as string} className="border border-line bg-panel2 px-3 py-2 text-center">
                <div className="font-cond text-2xl font-bold text-gold">{v}</div>
                <div className="font-cond text-[10px] uppercase tracking-widest text-mut">{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* cursos */}
        <div className="panel p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-2xl tracking-wide text-cream"><I n="cap" className="h-5 w-5 text-gold" /> Cursos del entrenador</h3>
          <div className="space-y-3">
            {orden.map((id, idx) => {
              const c = CURSOS[id];
              const done = state.courses.includes(id);
              const reqOk = !c.req || state.courses.includes(c.req);
              return (
                <div key={id} className={`relative border p-3.5 transition-colors ${done ? "border-gold2/60 bg-gold/5" : reqOk ? "border-line hover:border-gold2" : "border-line opacity-60"}`}>
                  {idx < orden.length - 1 && <div className="absolute -bottom-3 left-8 h-3 w-px bg-line2" />}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-display text-xl tracking-wide text-cream">
                        {done && <I n="check" className="h-4 w-4 text-win" />}
                        {c.nombre}
                      </div>
                      <p className="font-cond text-xs text-mut">{c.desc}</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {c.desbloquea.map(d => (
                          <li key={d} className="flex items-center gap-1.5 font-cond text-xs text-sand"><I n="chevR" className="h-3 w-3 text-gold" /> {d}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="shrink-0">
                      {done ? <Chip tone="gold">Completado</Chip> : (
                        <Btn small variant="gold" disabled={!reqOk || state.dinero < c.costo} onClick={() => dispatch({ type: "BUY_COURSE", id })}>
                          {fmt(c.costo)}
                        </Btn>
                      )}
                      {!done && !reqOk && <div className="mt-1 font-cond text-[10px] uppercase text-mut">Requiere {c.req && CURSOS[c.req].nombre}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {/* viviendas */}
        <div className="panel p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-2xl tracking-wide text-cream"><I n="house" className="h-5 w-5 text-gold" /> Vivienda personal</h3>
          {state.propiedades.includes("mansion") ? (
            <p className="font-cond text-sm text-sand">Vives en la <b className="text-gold">Mansión de Las Lomas</b>. Hasta el cartero te pide autógrafos.</p>
          ) : state.propiedades.includes("apartamento") ? (
            <p className="font-cond text-sm text-sand">Tienes tu <b className="text-gold">apartamento céntrico</b>. Sin alquiler personal que pagar.</p>
          ) : (
            <p className="font-cond text-sm text-sand">Pagas {fmt(8)}/día de alquiler personal. Comprar una vivienda elimina ese gasto y suma fama. (Ver en el mapa de la ciudad.)</p>
          )}
        </div>

        {/* legado */}
        <div className={`panel p-4 ${puedeLegado ? "border-gold2" : ""}`}>
          <h3 className="flex items-center gap-2 font-display text-2xl tracking-wide text-cream"><I n="trophy" className="h-5 w-5 text-gold" /> Sistema de legado</h3>
          <p className="mt-1 font-cond text-sm text-sand">
            Retírate en la cima y reencarna en tu mejor alumno: comenzarás con <b className="text-gold">+{fmt(1800)}</b>, fama heredada y a tu campeón de vuelta, joven otra vez.
          </p>
          <div className="mt-3 space-y-1.5 font-cond text-sm">
            <div className={state.fama >= 60 ? "text-win" : "text-mut"}>
              <I n={state.fama >= 60 ? "check" : "x"} className="mr-1.5 inline h-3.5 w-3.5" /> Fama 60+ (tienes {Math.round(state.fama)})
            </div>
            <div className={state.roster.some(b => b.campeon) ? "text-win" : "text-mut"}>
              <I n={state.roster.some(b => b.campeon) ? "check" : "x"} className="mr-1.5 inline h-3.5 w-3.5" /> Al menos un campeón reinante
            </div>
          </div>
          <div className="mt-3">
            <Btn variant={puedeLegado ? "gold" : "dark"} disabled={!puedeLegado} onClick={() => {
              if (window.confirm("¿Iniciar el legado? La partida actual terminará y renacerás con las bonificaciones de prestigio.")) dispatch({ type: "LEGACY" });
            }}>
              <I n="spark" className="h-4 w-4" /> Iniciar legado (reinicia la partida)
            </Btn>
          </div>
        </div>

        <div className="panel p-4">
          <h4 className="font-display text-xl tracking-wide text-cream">Partida</h4>
          <p className="mt-1 font-cond text-sm text-mut">El progreso se guarda solo en este navegador.</p>
          <Btn small variant="ghost" className="mt-2" onClick={() => dispatch({ type: "RESET" })}>
            <I n="x" className="h-3.5 w-3.5" /> Volver a la pantalla de inicio
          </Btn>
        </div>
      </section>
    </div>
  );
}

export function StaffPanel() {
  const { state, dispatch } = useGame();
  const req: Record<StaffType, CourseId> = { asistente: "instructor", preparador: "tecnico", marketing: "promotor", gerente: "empresarial" };
  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-display text-3xl tracking-wide text-cream"><I n="case" className="h-6 w-6 text-gold" /> Personal del imperio</h3>
      <p className="font-cond text-sm text-mut">Delega para crecer: cada puesto se descuenta del sueldo automáticamente, sin microgestión.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(STAFF_INFO) as StaffType[]).map(t => {
          const info = STAFF_INFO[t];
          const miembros = state.staff.filter(s => s.type === t);
          const cursoOk = state.courses.includes(req[t]);
          return (
            <div key={t} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-xl tracking-wide text-cream">{info.nombre}</div>
                  <div className="font-cond text-xs uppercase tracking-wide text-mut">{fmt(info.sueldo)}/mes · {info.req}</div>
                </div>
                <I n={t === "gerente" ? "case" : t === "marketing" ? "star" : "dumbbell"} className="h-6 w-6 text-gold" />
              </div>
              <p className="mt-1.5 font-cond text-sm text-sand">{info.desc}</p>
              {miembros.length > 0 && (
                <div className="mt-2 space-y-1">
                  {miembros.map(m => (
                    <div key={m.id} className="flex items-center justify-between border border-line bg-panel2 px-2.5 py-1">
                      <span className="font-cond text-sm text-cream"><I n="user" className="mr-1.5 inline h-3.5 w-3.5 text-win" />{m.nombre}</span>
                      <button onClick={() => dispatch({ type: "FIRE", id: m.id })} className="font-cond text-xs uppercase text-mut transition-colors hover:text-blood">Despedir</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Btn small variant={cursoOk ? "gold" : "dark"} disabled={!cursoOk} onClick={() => dispatch({ type: "HIRE", staff: t })}>
                  <I n="check" className="h-3.5 w-3.5" /> Contratar
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
