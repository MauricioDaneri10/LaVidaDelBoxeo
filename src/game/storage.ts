/** Contrato mínimo de persistencia. Permite cambiar localStorage por nube sin tocar el reducer. */
export interface PersistenciaJuego {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
}

const memoria = new Map<string, string>();
const fallback: PersistenciaJuego = {
  getItem: clave => memoria.get(clave) ?? null,
  setItem: (clave, valor) => { memoria.set(clave, valor); },
  removeItem: clave => { memoria.delete(clave); },
};

export function crearPersistencia(): PersistenciaJuego {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Privacidad estricta o incógnito: usar memoria durante esta sesión.
  }
  return fallback;
}

export const persistencia = crearPersistencia();
