import { useSyncExternalStore } from "react";
import { catalogs, cargarCatalogo, translate, type Arguments, type MessageKey } from "./catalog";
export type Locale = "es" | "en" | "pt-BR";

// Candidate activation is verified against global source/content coverage and browser tests.
export const IDIOMAS_HABILITADOS: readonly Locale[] = ["es", "en", "pt-BR"];
const CAMBIO_IDIOMA = "vida-del-boxeo:idioma-cambio";

export const LOCALES: Array<{ id: Locale; nombre: string }> = [
  { id: "es", nombre: "Español" },
  { id: "en", nombre: "English" },
  { id: "pt-BR", nombre: "Português (Brasil)" },
];

const CLAVE_IDIOMA = "vida-del-boxeo:idioma";
const intlLocale: Record<Locale, string> = { es: "es-AR", en: "en-US", "pt-BR": "pt-BR" };

export function idiomaPreferido(): Locale {
  try {
    const valor = localStorage.getItem(CLAVE_IDIOMA);
    return IDIOMAS_HABILITADOS.includes(valor as Locale) ? valor as Locale : "es";
  } catch {
    return "es";
  }
}

/** A persisted preference alone never makes an unloaded catalog usable. */
export function cargarIdioma(): Locale {
  const locale=idiomaPreferido();
  return catalogs[locale]?locale:"es";
}

let solicitud=0;
export async function seleccionarIdioma(locale:Locale,baseURL?:string):Promise<boolean> {
  if(!IDIOMAS_HABILITADOS.includes(locale))return false;
  const actual=++solicitud;
  try {await cargarCatalogo(locale,baseURL);return actual===solicitud&&guardarIdioma(locale);}
  catch {return false;}
}
export async function restaurarIdioma(baseURL?:string):Promise<boolean> {
  try {await cargarCatalogo(idiomaPreferido(),baseURL);if(!catalogs[idiomaPreferido()])return false;window.dispatchEvent(new Event(CAMBIO_IDIOMA));return true;}
  catch {return false;}
}

export function guardarIdioma(locale: Locale) {
  if (!IDIOMAS_HABILITADOS.includes(locale) || !catalogs[locale]) return false;
  try {
    localStorage.setItem(CLAVE_IDIOMA, locale);
    window.dispatchEvent(new Event(CAMBIO_IDIOMA));
    return true;
  } catch { return false; }
}

function subscribe(listener: () => void) {
  window.addEventListener(CAMBIO_IDIOMA, listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener(CAMBIO_IDIOMA, listener); window.removeEventListener("storage", listener); };
}
export function useMessages() {
  const locale = useSyncExternalStore(subscribe, cargarIdioma, () => "es" as Locale);
  return { locale, t: <K extends MessageKey>(key: K, ...args: Arguments<K>) => translate(locale, key, ...args) };
}

export function formatearNumero(valor: number, locale: Locale = cargarIdioma()): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(valor);
}

/** Game currency remains one unit; locale changes separators, never exchange rates. */
export function formatearDineroJuego(valor:number,locale:Locale=cargarIdioma()):string {
  return "$"+Math.round(valor).toLocaleString(intlLocale[locale]);
}

export function formatearMoneda(valor: number, locale: Locale = cargarIdioma(), moneda = "ARS"): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(valor);
}

export function formatearFecha(fecha: Date, locale: Locale = cargarIdioma()): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", year: "numeric" }).format(fecha);
}
