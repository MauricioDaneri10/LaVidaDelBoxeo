import type { Consejo } from "../game/types";
import { CONSEJOS_INICIALES } from "../game/data";
import { objetivoConsejo } from "../game/consejos";
import { translate, type CatalogLocale } from "./catalog";

const claves = {
  c1: "advice.objective.c1", c2: "advice.objective.c2", c3: "advice.objective.c3", c4: "advice.objective.c4", c5: "advice.objective.c5",
  c6: "advice.objective.c6", c7: "advice.objective.c7", c8: "advice.objective.c8", c9: "advice.objective.c9", c10: "advice.objective.c10",
} as const;

/** Domain identity AND exact known template; never infer identity from prose alone. */
export function presentarConsejo(consejo: Consejo, locale: CatalogLocale): { texto: string; historico: boolean } {
  const objetivo = objetivoConsejo(consejo.id);
  const plantilla = CONSEJOS_INICIALES.find(c => c.id === objetivo);
  if (!objetivo || !Object.prototype.hasOwnProperty.call(claves, objetivo) || !plantilla || plantilla.texto !== consejo.texto)
    return { texto: consejo.texto, historico: true };
  return { texto: translate(locale, claves[objetivo as keyof typeof claves]), historico: false };
}
