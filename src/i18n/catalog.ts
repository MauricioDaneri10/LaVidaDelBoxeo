/** Semantic presentation keys only. Domain IDs and accounting text are not keys. */
export const es = {
  "dialog.close": "Cerrar ventana",
  "action.close": "Cerrar",
  "action.previous": "Anterior",
  "action.next": "Siguiente",
  "nav.gym": "Gimnasio",
  "nav.city": "Ciudad",
  "nav.roster": "Plantel",
  "nav.market": "Mercado",
  "nav.profile": "Mi Perfil",
  "nav.staff": "Personal",
  "nav.calendar": "Calendario",
  "focus.pending": "Enfoque pendiente de confirmar. Podés conservar el actual o elegir otro.",
  "focus.confirm": "Confirmar enfoque actual",
  "focus.assigned": "Asignado",
  "focus.title": "Enfoque de Entrenamiento Semanal",
  "offers.reopen": "Ver ofertas pendientes",
  "record.historical": "Registro histórico en su idioma original",
  "page.position": "Página {page} de {total}",
} as const;

export type MessageKey = keyof typeof es;
export type Catalog = Record<MessageKey, string>;
export const en: Catalog = {
  "dialog.close": "Close window",
  "action.close": "Close",
  "action.previous": "Previous",
  "action.next": "Next",
  "nav.gym": "Gym",
  "nav.city": "City",
  "nav.roster": "Roster",
  "nav.market": "Market",
  "nav.profile": "My Profile",
  "nav.staff": "Staff",
  "nav.calendar": "Calendar",
  "focus.pending": "Training focus needs confirmation. Keep the current focus or choose another.",
  "focus.confirm": "Confirm current focus",
  "focus.assigned": "Assigned",
  "focus.title": "Weekly Training Focus",
  "offers.reopen": "View pending offers",
  "record.historical": "Historical record in its original language",
  "page.position": "Page {page} of {total}",
};
export const ptBR: Catalog = {
  "dialog.close": "Fechar janela",
  "action.close": "Fechar",
  "action.previous": "Anterior",
  "action.next": "Próximo",
  "nav.gym": "Academia",
  "nav.city": "Cidade",
  "nav.roster": "Elenco",
  "nav.market": "Mercado",
  "nav.profile": "Meu Perfil",
  "nav.staff": "Equipe",
  "nav.calendar": "Calendário",
  "focus.pending": "Confirme o foco de treino. Mantenha o foco atual ou escolha outro.",
  "focus.confirm": "Confirmar foco atual",
  "focus.assigned": "Atribuído",
  "focus.title": "Foco de Treino Semanal",
  "offers.reopen": "Ver ofertas pendentes",
  "record.historical": "Registro histórico no idioma original",
  "page.position": "Página {page} de {total}",
};

export const catalogs = { es, en, "pt-BR": ptBR };
type Slots<T extends string> = T extends `${string}{${infer P}}${infer Rest}` ? P | Slots<Rest> : never;
type Parameters<K extends MessageKey> = Record<Slots<(typeof es)[K]>, string | number>;
export type Arguments<K extends MessageKey> = [Slots<(typeof es)[K]>] extends [never] ? [params?: never] : [params: Parameters<K>];

export function placeholders(text: string): string[] {
  return Array.from(new Set(Array.from(text.matchAll(/\{([a-zA-Z][\w]*)\}/g), match => match[1]))).sort();
}

/** Never silently fall back to Spanish or expose a raw missing key. */
export function translate<K extends MessageKey>(locale: keyof typeof catalogs, key: K, ...args: Arguments<K>): string {
  const text = catalogs[locale]?.[key];
  if (typeof text !== "string" || !text.trim()) throw new Error(`Missing translation: ${locale}/${key}`);
  const params = (args[0] ?? {}) as Record<string, string | number>;
  const expected = placeholders(text);
  if (Object.keys(params).sort().join("|") !== expected.join("|")) throw new Error(`Invalid translation parameters: ${key}`);
  return text.replace(/\{([a-zA-Z][\w]*)\}/g, (_, slot: string) => String(params[slot]));
}

/** Test-only expansion of static copy; interpolate parameters afterwards. */
export function pseudoTemplate(text: string): string {
  const slots = text.match(/\{[a-zA-Z][\w]*\}/g) ?? [];
  let index = 0;
  const copy = text.replace(/\{[a-zA-Z][\w]*\}/g, () => `\u0000${index++}\u0000`);
  const expanded = `[${copy}${"~".repeat(Math.ceil(text.replace(/\{[^}]+\}/g, "").length * .4))}]`;
  return expanded.replace(/\u0000(\d+)\u0000/g, (_, n: string) => slots[Number(n)]);
}
