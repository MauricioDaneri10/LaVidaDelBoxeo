import { EQUIPOS } from "./data";
import type { CategoriaMercado, GearId } from "./types";

const PRIORIDAD_POR_CATEGORIA: Record<CategoriaMercado, GearId[]> = {
  equipamiento: ["soga", "sacosCuero", "perasDoble", "manoplasPro", "pisoGoma", "cuerdaVelocidad", "plataformaReaccion", "ringReglamentario", "zonaElite"],
  indumentaria: ["bucal", "cabezal", "botas", "batas"],
  instalaciones: ["botiquin", "vestuarios", "barraProteinas", "sauna"],
  difusion: ["carteles", "estudioMarca", "sonido", "marquesina", "vitrina"],
};

/** Sugiere una compra disponible y pagable; la decisión final siempre queda en manos del jugador. */
export function recomendarEquipo(
  categoria: CategoriaMercado,
  instalados: readonly GearId[],
  dinero: number,
): GearId | null {
  return PRIORIDAD_POR_CATEGORIA[categoria].find(id =>
    !instalados.includes(id) && EQUIPOS[id].costo <= dinero,
  ) ?? null;
}
