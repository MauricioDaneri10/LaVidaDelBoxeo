import { CONSEJOS_INICIALES } from "./data";
import type { Consejo, EstadoJuego } from "./types";

/** Legacy IDs encode one of three objectives; unknown IDs remain unknown. */
export function objetivoConsejo(id: string): string | null {
  const match = /^c([1-9]\d*)$/.exec(id);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n)) return null;
  return n <= 7 ? id : `c${8 + (n - 8) % 3}`;
}

const esConsejo = (x: unknown): x is Consejo => !!x && typeof x === "object" && !Array.isArray(x)
  && typeof (x as Consejo).id === "string" && typeof (x as Consejo).texto === "string"
  && typeof (x as Consejo).fama === "number" && Number.isFinite((x as Consejo).fama)
  && ((x as Consejo).dinero === undefined || typeof (x as Consejo).dinero === "number" && Number.isFinite((x as Consejo).dinero))
  && typeof (x as Consejo).cumplido === "boolean" && typeof (x as Consejo).reclamado === "boolean";

/** A damaged payment record must not disappear in localized validation and unlock another reward. */
export function evidenciaCobroDanada(raw: unknown): boolean {
  return Array.isArray(raw) && raw.some(c => c && typeof c === "object" && !Array.isArray(c)
    && ((c.reclamado === true && (typeof c.id !== "string" || !c.id))
      || typeof c.id === "string" && objetivoConsejo(c.id)
      && (typeof c.reclamado !== "boolean" || c.reclamado === true && !esConsejo(c))));
}

/** Migration is pure: retain IDs/order/extensions, no RNG, payment or invented date. */
export function consolidarConsejos(raw: unknown, completarCatalogo = false): unknown {
  if (!Array.isArray(raw)) return raw;
  const pagados = new Set(raw.filter(esConsejo).filter(c => c.reclamado).map(c => objetivoConsejo(c.id)).filter(Boolean));
  const derechos = new Set<string>();
  const presentes = new Set<string>();
  for (const c of raw) if (c && typeof c === "object" && typeof c.id === "string") {
    const objetivo = objetivoConsejo(c.id); if (objetivo) presentes.add(objetivo);
  }
  const vistos = new Map<string, { original: Consejo; migrado: Consejo }>();
  const result = raw.map(c => {
    if (!esConsejo(c)) return c;
    const objetivo = objetivoConsejo(c.id);
    if (!objetivo) return c;
    const previo = vistos.get(c.id);
    // Identical duplicate IDs remain identical for R1 validation. Conflicts are
    // preserved as conflicts, not resolved by selecting a winner in migration.
    if (previo) return JSON.stringify(previo.original) === JSON.stringify(c) ? previo.migrado : c;
    presentes.add(objetivo);
    if (c.reclamado || c.archivado) { vistos.set(c.id, { original: c, migrado: c }); return c; }
    if (pagados.has(objetivo) || derechos.has(objetivo)) {
      const migrado = { ...c, archivado: true, motivoArchivo: "Objetivo único: derecho duplicado" };
      vistos.set(c.id, { original: c, migrado }); return migrado;
    }
    derechos.add(objetivo);
    vistos.set(c.id, { original: c, migrado: c });
    return c;
  });
  if (completarCatalogo) for (const c of CONSEJOS_INICIALES.filter(c => ["c8", "c9", "c10"].includes(c.id))) {
    if (!presentes.has(c.id)) result.push({ ...c, cumplido: false, reclamado: false });
  }
  return result;
}

export function objetivoConsejoCumplido(id: string, s: EstadoJuego): boolean {
  const objetivo = objetivoConsejo(id);
  const derechos = s.consejos.filter(c => objetivoConsejo(c.id) === objetivo);
  if (!objetivo || derechos.some(c => c.reclamado) || derechos.find(c => !c.archivado)?.id !== id) return false;
  const hitos: Record<string, () => boolean> = {
    c1: () => s.plantel.some(p => p.rol === "boxeador"), c2: () => s.stats.victorias > 0,
    c3: () => s.equipamiento.length > 0, c4: () => s.stats.veladas > 0, c5: () => s.fama >= 40,
    c6: () => s.cinturones.length > 0, c7: () => s.personal.length > 0,
    c8: () => s.recreativos >= 3, c9: () => s.seguidores >= 1500, c10: () => s.stats.victorias >= 3,
  };
  return hitos[objetivo]?.() ?? false;
}
