export interface DiagnosticoCliente {
  id: string;
  fecha: string;
  mensaje: string;
  contexto: string;
}

const CLAVE = "vida-del-boxeo:diagnosticos";
const MAX = 20;

function idDiagnostico(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registrarDiagnostico(error: unknown, contexto = "app"): DiagnosticoCliente {
  const mensaje = error instanceof Error ? error.message : String(error);
  const item: DiagnosticoCliente = { id: idDiagnostico(), fecha: new Date().toISOString(), mensaje, contexto };
  try {
    const anterior = JSON.parse(sessionStorage.getItem(CLAVE) || "[]") as DiagnosticoCliente[];
    sessionStorage.setItem(CLAVE, JSON.stringify([...anterior, item].slice(-MAX)));
  } catch {
    // El diagnóstico no debe impedir que el juego muestre su recuperación.
  }
  return item;
}

export function leerDiagnosticos(): DiagnosticoCliente[] {
  try {
    const datos = JSON.parse(sessionStorage.getItem(CLAVE) || "[]") as DiagnosticoCliente[];
    return Array.isArray(datos) ? datos.slice(-MAX) : [];
  } catch { return []; }
}

export function limpiarDiagnosticos(): void {
  try { sessionStorage.removeItem(CLAVE); } catch { /* almacenamiento opcional */ }
}
