import { COMUNITARIOS, PERSONAL_INFO } from "./data";
import type { EstadoJuego, LineaLibro, TipoComunitario } from "./types";

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
  const ingresos: LineaLibro[] = [{ concepto: `Cuotas de alumnos (${alumnos} × $${Math.round(cuota).toLocaleString("es-AR")})`, monto: alumnos * cuota }];
  if (e.recreativos > 0) ingresos.push({ concepto: `Cuotas recreativas (${e.recreativos} × $10)`, monto: e.recreativos * 10 });
  if (boxeadores > 0) ingresos.push({ concepto: `Aporte del plantel federado (${boxeadores} × $12)`, monto: boxeadores * 12 });
  if (e.semana === 1) ingresos.push({ concepto: "Subsidio de apertura del club", monto: 240 });

  const nSuc = e.propiedades.filter(p => p === "sucursal").length;
  const gerentes = e.personal.filter(p => p.tipo === "gerente" || p.tipo === "coordinadorSucursal").length;
  const entrenadoresLocales = e.personal.filter(p => p.tipo === "entrenadorLocal").length;
  if (nSuc > 0) {
    const activas = Math.min(nSuc, gerentes);
    if (activas > 0) {
      // Preserve the existing per-branch coach bonus, including its multiplication by activas.
      let porSucursal = 650 + 8 * e.fama + Math.min(activas, entrenadoresLocales) * 200;
      if (e.cursos.includes("imperio")) porSucursal *= 1.5;
      ingresos.push({ concepto: `Ingresos pasivos de sucursales (${activas})`, monto: Math.round(porSucursal * activas) });
    } else ingresos.push({ concepto: "Sucursales sin gerente (sin ingresos)", monto: 0 });
  }
  if (e.marcaRopa && e.equipamiento.includes("estudioMarca")) {
    const ventas = Math.round(Math.round(e.fama * 6 + 40) * multiplicadorMarca);
    ingresos.push({ concepto: `Ventas de la marca "${e.marcaRopa}"`, monto: ventas });
  }
  if (e.patrocinio) ingresos.push({ concepto: `Patrocinio de ${e.patrocinio.nombre}`, monto: e.patrocinio.semanal });

  const gastos: LineaLibro[] = [];
  if (!e.propiedades.includes("local") && !e.propiedades.includes("arena")) gastos.push({ concepto: "Alquiler del local", monto: 150 });
  const sueldos = e.personal.reduce((total, p) => total + (PERSONAL_INFO[p.tipo]?.sueldo ?? 0), 0);
  if (sueldos > 0) gastos.push({ concepto: `Sueldos del personal (${e.personal.length})`, monto: sueldos });
  if (e.dinero < 0) gastos.push({ concepto: "Costo financiero por caja negativa", monto: costoFinancieroCaja(e.dinero) });
  if (e.prestamo && e.prestamo.saldo > 0) gastos.push({ concepto: `Cuota del préstamo (${e.prestamo.semanasRestantes} restantes)`, monto: Math.min(e.prestamo.cuota, e.prestamo.saldo) });
  return { ingresos, gastos, total: ingresos.reduce((total, l) => total + l.monto, 0) - gastos.reduce((total, l) => total + l.monto, 0) };
}
