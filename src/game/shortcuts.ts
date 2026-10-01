export type Atajos = {
  gimnasio: string;
  ciudad: string;
  plantel: string;
  mercado: string;
  perfil: string;
  personal: string;
  calendario: string;
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
  calendario: "7",
  avanzar: "n",
  semanaRapida: "s",
  cerrar: "Escape",
};

const CLAVE_ATAJOS = "vida-del-boxeo:atajos";

export const ATAJOS_LABELS: Array<[keyof Atajos, string]> = [
  ["gimnasio", "Gimnasio"], ["ciudad", "Ciudad"], ["plantel", "Plantel"],
  ["mercado", "Mercado"], ["perfil", "Mi Perfil"], ["personal", "Personal"], ["calendario", "Calendario"],
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

export function conflictosAtajos(atajos: Atajos): Array<[keyof Atajos, keyof Atajos]> {
  const entradas = Object.entries(atajos) as Array<[keyof Atajos, string]>;
  const conflictos: Array<[keyof Atajos, keyof Atajos]> = [];
  for (let i = 0; i < entradas.length; i++) {
    for (let j = i + 1; j < entradas.length; j++) {
      if (entradas[i][1].toLowerCase() === entradas[j][1].toLowerCase()) conflictos.push([entradas[i][0], entradas[j][0]]);
    }
  }
  return conflictos;
}
