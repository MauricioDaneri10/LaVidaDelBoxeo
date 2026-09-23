export type Atajos = {
  gimnasio: string;
  ciudad: string;
  plantel: string;
  mercado: string;
  perfil: string;
  personal: string;
  avanzar: string;
  semanaRapida: string;
  cerrar: string;
};

export const ATAJOS_DEFAULT: Atajos = {
  gimnasio: "1",
  ciudad: "2",
  plantel: "3",
  mercado: "4",
  perfil: "5",
  personal: "6",
  avanzar: "n",
  semanaRapida: "s",
  cerrar: "Escape",
};

const CLAVE_ATAJOS = "vida-del-boxeo:atajos";

export const ATAJOS_LABELS: Array<[keyof Atajos, string]> = [
  ["gimnasio", "Gimnasio"], ["ciudad", "Ciudad"], ["plantel", "Plantel"],
  ["mercado", "Mercado"], ["perfil", "Mi Perfil"], ["personal", "Personal"],
  ["avanzar", "Avanzar día"], ["semanaRapida", "Semana rápida"], ["cerrar", "Cerrar ventanas"],
];

export function cargarAtajos(): Atajos {
  try {
    const raw = JSON.parse(localStorage.getItem(CLAVE_ATAJOS) || "null") as Partial<Atajos> | null;
    return { ...ATAJOS_DEFAULT, ...(raw && typeof raw === "object" ? raw : {}) };
  } catch {
    return { ...ATAJOS_DEFAULT };
  }
}

export function guardarAtajos(atajos: Atajos) {
  try { localStorage.setItem(CLAVE_ATAJOS, JSON.stringify(atajos)); } catch { /* almacenamiento opcional */ }
}

export function normalizarTecla(valor: string, fallback: string): string {
  const limpio = valor.trim();
  if (!limpio) return fallback;
  if (limpio.toLowerCase() === "esc") return "Escape";
  if (limpio.toLowerCase() === "espacio" || limpio.toLowerCase() === "space") return " ";
  return limpio.length === 1 ? limpio.toLowerCase() : limpio[0].toLowerCase();
}

export function teclaCoincide(eventKey: string, configurada: string): boolean {
  return eventKey.toLowerCase() === configurada.toLowerCase();
}
