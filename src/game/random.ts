/**
 * Fuente de azar del motor. En producción usa Math.random; en tests y
 * reproducciones de soporte puede fijarse una semilla sin tocar las reglas.
 */
export type FuenteAzar = () => number;

let fuente: FuenteAzar = () => Math.random();

export function numeroAleatorio(): number {
  return fuente();
}

/** Scoped combat stream: unrelated UI/game randomness cannot reroll a resumed bout. */
export function conFuenteAzar<T>(temporal: FuenteAzar, ejecutar: () => T): T {
  const anterior = fuente;
  fuente = temporal;
  try { return ejecutar(); } finally { fuente = anterior; }
}

export function usarSemilla(semillaInicial: number): () => void {
  let semilla = (semillaInicial >>> 0) || 1;
  const anterior = fuente;
  fuente = () => {
    semilla += 0x6D2B79F5;
    let t = semilla;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => { fuente = anterior; };
}
