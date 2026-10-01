import { useSyncExternalStore } from "react";
import { translate, type Arguments, type MessageKey } from "./catalog";
export type Locale = "es" | "en" | "pt-BR";

// Do not enable incomplete UI/content. Expand only after global coverage verification.
export const IDIOMAS_HABILITADOS: readonly Locale[] = ["es"];
const CAMBIO_IDIOMA = "vida-del-boxeo:idioma-cambio";

export const LOCALES: Array<{ id: Locale; nombre: string }> = [
  { id: "es", nombre: "Español" },
  { id: "en", nombre: "English" },
  { id: "pt-BR", nombre: "Português (Brasil)" },
];

const CLAVE_IDIOMA = "vida-del-boxeo:idioma";
const intlLocale: Record<Locale, string> = { es: "es-AR", en: "en-US", "pt-BR": "pt-BR" };

export function cargarIdioma(): Locale {
  try {
    const valor = localStorage.getItem(CLAVE_IDIOMA);
    return IDIOMAS_HABILITADOS.includes(valor as Locale) ? valor as Locale : "es";
  } catch {
    return "es";
  }
}

export function guardarIdioma(locale: Locale) {
  if (!IDIOMAS_HABILITADOS.includes(locale)) return false;
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

export function formatearMoneda(valor: number, locale: Locale = cargarIdioma(), moneda = "ARS"): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(valor);
}

export function formatearFecha(fecha: Date, locale: Locale = cargarIdioma()): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", year: "numeric" }).format(fecha);
}
