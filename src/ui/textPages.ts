/** Presentation-only slices. Unknown historical text is never rewritten or saved. */
export function paginasTexto(texto: string, capacidad = 90): string[] {
  if (!Number.isInteger(capacidad) || capacidad < 1) throw new Error("Invalid text-page capacity");
  const letras = Array.from(texto);
  if (!letras.length) return [""];
  const paginas: string[] = [];
  for (let inicio = 0; inicio < letras.length;) {
    let fin = Math.min(letras.length, inicio + capacidad);
    if (fin < letras.length) {
      for (let i = fin - 1; i > inicio; i--) if (/\s/u.test(letras[i])) { fin = i + 1; break; }
    }
    paginas.push(letras.slice(inicio, fin).join(""));
    inicio = fin;
  }
  return paginas;
}
