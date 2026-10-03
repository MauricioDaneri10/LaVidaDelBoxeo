/** Semantic presentation keys only. Domain IDs and accounting text are not keys. */
import { COMBOS } from "../game/data";
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
  "nav.choose": "Pestaña del juego",
  "club.management": "Gestión del club",
  "club.panel": "Panel del club",
  "club.channel": "Canal del panel del club",
  "plan.title": "Objetivos y previsión",
  "plan.access": "Objetivos y previsión · {completed}/{total}",
  "schedule.pending": "Cartelera · {count} peleas",
  "roster.management": "Plantel · Cupos y gestión",
  "roster.dialog": "Gestión del plantel",
  "roster.group": "Grupo del plantel",
  "roster.sort": "Ordenar boxeadores y alumnos",
  "roster.all": "Todos ({count})",
  "roster.students": "Alumnos ({count}/{capacity})",
  "roster.competitors": "Competidores ({count})",
  "roster.waiting": "En espera ({count})",
  "roster.newest": "Nuevos esta semana",
  "roster.highest": "Mayor valoración",
  "roster.lowest": "Menor valoración",
  "roster.focus": "Confirmar enfoque",
  "staff.payroll": "Nómina y previsión",
  "staff.summary": "Personal · Nómina y previsión",
  "staff.review": "Revisar costo de contratación",
  "profile.section": "Sección del perfil",
  "profile.details": "Perfil del coach · Detalles y legado",
  "profile.courses": "Cursos",
  "profile.properties": "Bienes raíces",
  "profile.activities": "Actividades del club",
  "profile.branch": "Rama de cursos",
  "market.category": "Categoría del mercado",
  "notification.dismiss": "Cerrar notificación",
  "settings.title": "Configuración y Partida",
  "settings.section": "Sección de configuración",
  "settings.save": "Guardar y cargar",
  "settings.reading": "Comodidad de lectura",
  "settings.sound": "Sonido",
  "settings.shortcuts": "Atajos de teclado",
  "settings.reset": "Reiniciar carrera",
  "settings.defaultName": "Mi carrera",
  "settings.preferenceError": "Almacenamiento no disponible: las preferencias solo se aplican a esta sesión.",
  "settings.saved": "Partida guardada. Podés continuarla desde el inicio.",
  "settings.saveError": "No se pudo guardar. Se conservaron los datos anteriores; revisá el aviso de almacenamiento.",
  "settings.saveHelp": "La partida se guarda sola después de cada acción. Poné un nombre para encontrarla en “Continuar partida”.",
  "settings.saveName": "Nombre de la partida",
  "settings.saveNow": "Guardar ahora",
  "settings.readingHelp": "Estas opciones se guardan en este navegador y no cambian las reglas del juego.",
  "settings.largeText": "Texto grande",
  "settings.contrast": "Alto contraste",
  "settings.motion": "Menos movimiento",
  "settings.soundHelp": "Sonido de campana, golpes y notificaciones",
  "settings.soundOn": "Activado",
  "settings.soundOff": "Silenciado",
  "settings.risk": "Zona de riesgo",
  "settings.resetHelp": "Borra la carrera actual (los legados también). No se puede deshacer.",
  "settings.resetConfirm": "Se borrará toda la carrera actual, incluidos los legados. No se puede deshacer.",
  "settings.shortcutHelp": "Elegí una tecla por acción. Podés escribir Esc o Espacio; los cambios quedan guardados en este navegador.",
  "settings.shortcutLabel": "Atajo para {action}",
  "settings.shortcutSave": "Guardar atajos",
  "settings.shortcutRestore": "Restaurar predeterminados",
  "settings.shortcutSaved": "Atajos guardados.",
  "settings.shortcutRestored": "Atajos restaurados.",
  "settings.shortcutConflict": "Hay teclas repetidas. Asigná una tecla distinta a cada acción antes de guardar.",
  "action.cancel": "Cancelar",
  "action.advance": "Avanzar día",
  "action.quickWeek": "Semana rápida",
  "action.closeWindows": "Cerrar ventanas",
  "gym.station": "Estación del gimnasio",
  "gym.cardio": "Soga y cardio",
  "gym.power": "Sacos y potencia",
  "gym.ring": "Ring de práctica",
  "gym.technique": "Técnica y espejo",
  "gym.hydration": "Hidratación",
  "gym.roster": "Plantel del gimnasio ({count})",
  "gym.viewRoster": "Ver plantel ({count})",
  "sheet.title": "Ficha Técnica · {name}",
  "sheet.boxer": "Boxeador de la ficha",
  "sheet.section": "Sección de la ficha",
  "sheet.identity": "Datos y licencia",
  "sheet.figure": "Boxeador",
  "sheet.record": "Récord y trayectoria",
  "sheet.trait": "Rasgo del boxeador",
  "sheet.radar": "Radar de capacidades",
  "sheet.attributes": "Atributos",
  "sheet.focus": "Enfoque de entrenamiento",
  "sheet.confirm": "Confirmar elección pendiente",
  "sheet.corner": "Consejo de esquina",
  "sheet.practice": "Prácticas de combate",
  "sheet.management": "Gestión y requisitos",
  "sheet.history": "Historial reciente",
  "sheet.pillar": "Pilar de atributos",
  "sheet.physical": "Pilar Físico",
  "sheet.technical": "Pilar Técnico",
  "sheet.mental": "Pilar Mental",
  "stat.fuerza": "Fuerza",
  "stat.velocidad": "Velocidad",
  "stat.potencia": "Potencia",
  "stat.resistencia": "Resistencia",
  "stat.ataque": "Ataque",
  "stat.defensa": "Defensa",
  "stat.tecnica": "Técnica",
  "stat.eficacia": "Eficacia",
  "stat.inteligencia": "Inteligencia",
  "stat.mentalidad": "Mentalidad",
  "stat.talento": "Talento",
  "combo.noqueador": COMBOS.noqueador.nombre,
  "combo.estilista": COMBOS.estilista.nombre,
  "combo.presion": COMBOS.presion.nombre,
  "combo.tactico": COMBOS.tactico.nombre,
  "combo.acondicionamiento": COMBOS.acondicionamiento.nombre,
  "combo.descanso": COMBOS.descanso.nombre,
  "combo.noqueador.desc": COMBOS.noqueador.desc,
  "combo.estilista.desc": COMBOS.estilista.desc,
  "combo.presion.desc": COMBOS.presion.desc,
  "combo.tactico.desc": COMBOS.tactico.desc,
  "combo.acondicionamiento.desc": COMBOS.acondicionamiento.desc,
  "combo.descanso.desc": COMBOS.descanso.desc,
  "focus.review": "Enfoque para revisar antes de asignar",
  "focus.assign": "Asignar enfoque",
  "focus.confirmed": "La elección actual ya está confirmada.",
  "focus.recommended": "Enfoque recomendado: {focus}",
  "city.propertySection": "Sección del inmueble",
  "city.propertyDetail": "Descripción y requisitos",
  "city.propertyBenefit": "Beneficios y previsión",
  "city.propertyOwnership": "Compra y titularidad",
  "transfer.title": "Transferir fuera del club",
  "transfer.message": "¿Transferir a {name}? Su ficha histórica y récord se conservarán en esta partida, pero dejará de ocupar un lugar en el plantel.",
  "transfer.action": "Transferir",
  "waiting.removeTitle": "Retirar de la lista de espera",
  "waiting.removeMessage": "¿Retirar a {name} de la lista de espera?",
  "waiting.remove": "Retirar",
  "legacy.title": "Sistema de Legado",
  "legacy.confirm": "¿Iniciar el Sistema de Legado? Renacerás como tu mejor alumno con bonificaciones de prestigio.",
  "legacy.start": "Iniciar legado",
  "save.newTitle": "Iniciar nueva partida",
  "save.newConfirm": "Vas a iniciar una partida nueva. La carrera actual seguirá guardada. ¿Continuar?",
  "save.deleteTitle": "Borrar partida guardada",
  "save.deleteConfirm": "¿Borrar esta partida guardada? No se puede deshacer.",
  "save.deleteFailure": "No se pudo borrar la ranura",
  "save.protected": "Sus datos anteriores siguen protegidos.",
  "action.confirm": "Confirmar",
  "sheet.heading": "Ficha Técnica",
  "sheet.name": "Nombre completo",
  "archive.title": "Archivo de carreras",
  "archive.empty": "Todavía no hay bajas competitivas archivadas.",
  "archive.boxer": "Boxeador archivado",
  "archive.section": "Sección del archivo",
  "archive.club": "Club y salida",
  "archive.licence": "Licencia y categoría",
  "archive.record": "Récord y trayectoria",
  "archive.attribute": "Dato de la ficha histórica",
  "archive.result": "Combate archivado",
  "archive.historical": "Registro histórico — texto original",
  "archive.noResults": "Sin resultados individuales conservados. El récord completo figura en Récord y trayectoria.",
  "stat.energia": "Energía",
  "stat.guanteos": "Guanteos",
  "archive.pro": "Récord profesional",
  "licence.amateur": "Licencia Amateur",
  "licence.pro": "Licencia Profesional",
  "archive.clubDetails": "{club} · {reason} · Semana {week}",
  "archive.licenceDetails": "{licence} · {division} · {age} años",
  "archive.recordDetails": "Récord {record} · {ko} KO · Títulos: {titles}. Amateur: {amateur} peleas · Profesional: {pro} peleas",
  "intro.section": "Sección de inicio",
  "intro.coach": "Tu nombre de coach",
  "intro.club": "Nombre de tu gimnasio",
  "intro.emblem": "Emblema del gimnasio",
  "intro.saves": "Partidas guardadas",
  "intro.help": "Cómo jugar",
} as const;

export type MessageKey = keyof typeof es;
export type Catalog = Record<MessageKey, string>;
export type CatalogLocale = "es" | "en" | "pt-BR";
// Spanish is embedded for offline startup. Other resources never enter the
// domain/save; load and validate them before any future language activation.
export const catalogs: Record<CatalogLocale, Catalog | undefined> = { es, en: undefined, "pt-BR": undefined };

export function registrarCatalogo(locale: CatalogLocale, raw: unknown): Catalog {
  if (locale !== "es" && locale !== "en" && locale !== "pt-BR") throw new Error("Unsupported translation locale");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid translation catalog");
  const values = raw as Record<string, unknown>;
  const keys = Object.keys(es) as MessageKey[];
  if (Object.keys(values).sort().join("|") !== keys.slice().sort().join("|")) throw new Error("Invalid translation catalog keys");
  for (const key of keys) {
    if (typeof values[key] !== "string" || !(values[key] as string).trim() ||
        placeholders(values[key] as string).join("|") !== placeholders(es[key]).join("|")) throw new Error(`Invalid translation catalog: ${key}`);
  }
  const validated = Object.freeze({ ...values }) as Catalog;
  catalogs[locale] = validated;
  return validated;
}

export async function cargarCatalogo(locale: CatalogLocale, baseURL?: string): Promise<Catalog> {
  if (locale !== "es" && locale !== "en" && locale !== "pt-BR") throw new Error("Unsupported translation locale");
  if (catalogs[locale]) return catalogs[locale]!;
  if (locale !== "en" && locale !== "pt-BR") throw new Error("Unsupported translation locale");
  const response = await fetch(new URL(`i18n/${locale}.json`, baseURL ?? document.baseURI));
  if (!response.ok) throw new Error(`Translation resource unavailable: ${response.status}`);
  return registrarCatalogo(locale, await response.json());
}
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
