import { COMUNITARIOS, PERSONAL_INFO } from "./data";
import type { EstadoJuego, LineaLibro, TipoComunitario } from "./types";
import { contenidoLibro } from "./messageContent";

export interface WeeklyEconomyContext {
  nivel: number;
  multiplicadorMarca: number;
}

export interface WeeklyEconomy {
  ingresos: LineaLibro[];
  gastos: LineaLibro[];
  total: number;
}

export interface SocialActivityRange {
  min: number;
  max: number;
  mean: number;
}

export interface EstimatedIncome extends SocialActivityRange {
  concepto: string;
  presentacion?: import("./messageContent").PresentacionContenido;
}

/** Same bounded charge for projection, settlement and its presentation. */
export function costoFinancieroCaja(caja: number): number {
  return caja < 0 ? Math.max(10, Math.min(50, Math.ceil(Math.abs(caja) * 0.03))) : 0;
}

/** Applies the existing rounding after the caller draws the activity's base revenue. */
export function socialActivityIncome(baseRevenue: number, multiplicadorEventos: number): number {
  return Math.round(baseRevenue * multiplicadorEventos);
}

/** Gross revenue: investment is already paid when scheduling, never deducted twice. */
export function socialActivityRange(tipo: TipoComunitario, multiplicadorEventos: number): SocialActivityRange {
  const { min, max } = COMUNITARIOS[tipo];
  return {
    min: socialActivityIncome(min, multiplicadorEventos),
    max: socialActivityIncome(max, multiplicadorEventos),
    mean: socialActivityIncome((min + max) / 2, multiplicadorEventos),
  };
}

/** Sunday's deterministic amounts, evaluated against the same pre-settlement state.
 * Does not draw RNG, settle social activities, mutate loans, or replay the weekly ledger.
 * Modifiers/level are supplied by the caller so this module never imports engine/state.
 */
export function weeklyEconomy(e: EstadoJuego, { nivel, multiplicadorMarca }: WeeklyEconomyContext): WeeklyEconomy {
  const alumnos = e.plantel.filter(p => p.rol === "alumno" && !p.enEspera).length;
  const boxeadores = e.plantel.filter(p => p.rol === "boxeador").length;
  const cuota = 18 + 2 * (nivel - 1);
  const ingresos: LineaLibro[] = [contenidoLibro("ledger.students",alumnos*cuota,{count:alumnos,fee:Math.round(cuota).toLocaleString("es-AR")})];
  if (e.recreativos > 0) ingresos.push(contenidoLibro("ledger.recreation",e.recreativos*10,{count:e.recreativos}));
  if (boxeadores > 0) ingresos.push(contenidoLibro("ledger.competitors",boxeadores*12,{count:boxeadores}));
  if (e.semana === 1) ingresos.push(contenidoLibro("ledger.opening",240));

  const nSuc = e.propiedades.filter(p => p === "sucursal").length;
  const gerentes = e.personal.filter(p => p.tipo === "gerente" || p.tipo === "coordinadorSucursal").length;
  const entrenadoresLocales = e.personal.filter(p => p.tipo === "entrenadorLocal").length;
  if (nSuc > 0) {
    const activas = Math.min(nSuc, gerentes);
    if (activas > 0) {
      // Preserve the existing per-branch coach bonus, including its multiplication by activas.
      let porSucursal = 650 + 8 * e.fama + Math.min(activas, entrenadoresLocales) * 200;
      if (e.cursos.includes("imperio")) porSucursal *= 1.5;
      ingresos.push(contenidoLibro("ledger.branches",Math.round(porSucursal*activas),{count:activas}));
    } else ingresos.push(contenidoLibro("ledger.unmanaged",0));
  }
  if (e.marcaRopa && e.equipamiento.includes("estudioMarca")) {
    const ventas = Math.round(Math.round(e.fama * 6 + 40) * multiplicadorMarca);
    ingresos.push(contenidoLibro("ledger.brand",ventas,{name:e.marcaRopa}));
  }
  if (e.patrocinio) ingresos.push(contenidoLibro("ledger.sponsor",e.patrocinio.semanal,{name:e.patrocinio.nombre}));

  const gastos: LineaLibro[] = [];
  if (!e.propiedades.includes("local") && !e.propiedades.includes("arena")) gastos.push(contenidoLibro("ledger.rent",150));
  const sueldos = e.personal.reduce((total, p) => total + (PERSONAL_INFO[p.tipo]?.sueldo ?? 0), 0);
  if (sueldos > 0) gastos.push(contenidoLibro("ledger.salaries",sueldos,{count:e.personal.length}));
  if (e.dinero < 0) gastos.push(contenidoLibro("ledger.overdraft",costoFinancieroCaja(e.dinero)));
  if (e.prestamo && e.prestamo.saldo > 0) gastos.push(contenidoLibro("ledger.loan",Math.min(e.prestamo.cuota,e.prestamo.saldo),{count:e.prestamo.semanasRestantes}));
  return { ingresos, gastos, total: ingresos.reduce((total, l) => total + l.monto, 0) - gastos.reduce((total, l) => total + l.monto, 0) };
}
