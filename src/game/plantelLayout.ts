/**
 * Cálculo determinístico y puro de la capacidad y distribución de la grilla del Plantel.
 *
 * Utilizado de forma compartida por:
 * 1. `PanelPlantel` (componente React, vía ResizeObserver sobre el área neta del contenedor).
 * 2. `game.test.ts` (suite unitaria para verificar límites 0/1/4/5/6/8/10/11/20, columnas, filas y paginación).
 * 3. Suite de auditoría E2E Playwright.
 */

export interface DimensionesLayoutPlantel {
  anchoDisponible: number;
  altoDisponible: number;
}

export interface ConfiguracionPlantelLayout {
  cardMinW?: number;          // Ancho mínimo legible por tarjeta (defecto: 195px)
  cardMinH?: number;          // Alto mínimo de tarjeta (defecto: 105px)
  gap?: number;               // Espacio entre tarjetas en px (defecto: 8px)
  maxColumnas?: number;       // Máximo de columnas permitido por diseño canónico (defecto: 5)
  maxFilas?: number;          // Máximo de filas permitido por diseño canónico (defecto: 2)
  altoPaginacion?: number;    // Altura reservada para barra de paginación si se requiere (defecto: 36px)
}

export interface ResultadoCapacidadPlantel {
  columnas: number;
  filas: number;
  porPagina: number;
  totalPaginas: number;
  paginaActual: number;
  necesitaPaginacion: boolean;
  tarjetasEnPagina: number;
  estiloGrilla: {
    display: "grid";
    gridTemplateColumns: string;
    gridTemplateRows: string;
    gap: string;
  };
  obtenerAtletasVisibles: <T>(lista: T[], pagina?: number) => T[];
}

export const CONFIG_PLANTEL_DEFAULT: Required<ConfiguracionPlantelLayout> = {
  cardMinW: 195,
  cardMinH: 105,
  gap: 8,
  maxColumnas: 5,
  maxFilas: 2,
  altoPaginacion: 36,
};

export type OrdenPlantel = "recientes" | "valoracion-desc" | "valoracion-asc";

/** Ordena solo la vista; nunca muta el estado guardado ni el orden original ante empates. */
export function ordenarPlantel<T extends { semanaIngreso?: number }>(
  lista: readonly T[],
  semanaActual: number,
  orden: OrdenPlantel,
  obtenerValoracion: (item: T) => number,
): T[] {
  return lista
    .map((item, indice) => ({ item, indice }))
    .sort((a, b) => {
      const recienteA = a.item.semanaIngreso === semanaActual;
      const recienteB = b.item.semanaIngreso === semanaActual;
      if (orden === "recientes" && recienteA !== recienteB) return recienteB ? 1 : -1;
      if (orden === "valoracion-desc") {
        const diferencia = obtenerValoracion(b.item) - obtenerValoracion(a.item);
        if (diferencia !== 0) return diferencia;
      }
      if (orden === "valoracion-asc") {
        const diferencia = obtenerValoracion(a.item) - obtenerValoracion(b.item);
        if (diferencia !== 0) return diferencia;
      }
      return a.indice - b.indice;
    })
    .map(({ item }) => item);
}

/**
 * Calcula de forma pura cuántas columnas y filas corresponden exactamente al área disponible
 * y al número de elementos de la página actual, garantizando:
 * - Cero filas vacías.
 * - Una fila expandida para 1..5 tarjetas (según columnas disponibles; e.g. 4 tarjetas ocupan 4 columnas en 1 fila).
 * - Dos filas equilibradas para 6..10 tarjetas cuando la altura lo permita (e.g. 6 -> 3x2, 8 -> 4x2, 10 -> 5x2).
 * - En viewports bajos, paginación con 1 fila dimensionada para aprovechar su espacio.
 * - Sin desborde, sin recorte y con correspondencia 1:1 con la lista de atletas visibles.
 */
export function calcularCapacidadPlantel(
  dimensiones: DimensionesLayoutPlantel,
  totalAtletas: number,
  paginaSolicitada: number = 0,
  configParcial?: ConfiguracionPlantelLayout
): ResultadoCapacidadPlantel {
  const config = { ...CONFIG_PLANTEL_DEFAULT, ...configParcial };
  const { anchoDisponible, altoDisponible } = dimensiones;
  const { cardMinW, cardMinH, gap, maxColumnas, maxFilas, altoPaginacion } = config;

  // 1. Columnas físicas máximas según ancho real disponible
  const anchoEfectivo = Math.max(cardMinW, anchoDisponible);
  const colsPosibles = Math.floor((anchoEfectivo + gap) / (cardMinW + gap));
  const colsMax = Math.max(1, Math.min(maxColumnas, colsPosibles));

  // 2. Filas físicas máximas según alto disponible
  const altoEfectivo = Math.max(cardMinH, altoDisponible);
  const filasMaxSinPaginacion = Math.max(1, Math.min(maxFilas, Math.floor((altoEfectivo + gap) / (cardMinH + gap))));

  // 3. Determinar si se requiere paginación
  const capacidadSinPaginacion = colsMax * filasMaxSinPaginacion;
  let filasCapacidad = filasMaxSinPaginacion;
  let necesitaPaginacion = false;

  if (totalAtletas > capacidadSinPaginacion) {
    necesitaPaginacion = true;
    const altoNetoConPaginacion = Math.max(cardMinH, altoEfectivo - altoPaginacion);
    filasCapacidad = Math.max(1, Math.min(maxFilas, Math.floor((altoNetoConPaginacion + gap) / (cardMinH + gap))));
  }

  // 4. Capacidad nominal por página (para calcular saltos de página e índices)
  const porPagina = Math.max(1, colsMax * filasCapacidad);

  // 5. Páginas determinísticas
  const totalPaginas = Math.max(1, Math.ceil(Math.max(0, totalAtletas) / porPagina));
  const paginaActual = Math.max(0, Math.min(paginaSolicitada, totalPaginas - 1));

  // 6. Cantidad de tarjetas en la página actual
  const inicio = paginaActual * porPagina;
  const fin = Math.min(totalAtletas, inicio + porPagina);
  const tarjetasEnPagina = Math.max(0, fin - inicio);

  // 7. Distribución equilibrada sin filas vacías para la página actual
  let filas: number;
  let columnas: number;

  if (tarjetasEnPagina === 0) {
    filas = 1;
    columnas = colsMax;
  } else if (filasCapacidad === 1) {
    // Viewport bajo o altura restringida: estrictamente 1 fila
    filas = 1;
    columnas = Math.min(colsMax, Math.max(1, tarjetasEnPagina));
  } else {
    // filasCapacidad >= 2
    if (tarjetasEnPagina <= colsMax && tarjetasEnPagina <= 5) {
      // 1 a 5 tarjetas que caben en el ancho: 1 fila expandida
      // Para 4 tarjetas: 4 columnas x 1 fila (aprovecha ancho y alto, sin 2da fila vacía)
      // Para 5 tarjetas (si colsMax >= 5): 5 columnas x 1 fila
      filas = 1;
      columnas = Math.min(colsMax, Math.max(1, tarjetasEnPagina));
    } else {
      // 6 a 10 tarjetas (o tarjetasEnPagina > colsMax):
      // Repartir en 2 filas equilibradas
      filas = 2;
      const colsEquilibradas = Math.ceil(tarjetasEnPagina / 2);
      columnas = Math.min(colsMax, Math.max(1, colsEquilibradas));
    }
  }

  // 8. Estilo CSS Grid bloqueado a las filas y columnas exactas calculadas
  const estiloGrilla = {
    display: "grid" as const,
    gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${filas}, minmax(0, 1fr))`,
    gap: `${gap}px`,
  };

  // 9. Selector de atletas visibles de página
  const obtenerAtletasVisibles = <T>(lista: T[], pag = paginaActual): T[] => {
    const start = pag * porPagina;
    return lista.slice(start, start + porPagina);
  };

  return {
    columnas,
    filas,
    porPagina,
    totalPaginas,
    paginaActual,
    necesitaPaginacion,
    tarjetasEnPagina,
    estiloGrilla,
    obtenerAtletasVisibles,
  };
}
