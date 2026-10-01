export type Locale = "es" | "en" | "pt-BR";

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
    return valor === "en" || valor === "pt-BR" || valor === "es" ? valor : "es";
  } catch {
    return "es";
  }
}

export function guardarIdioma(locale: Locale) {
  try { localStorage.setItem(CLAVE_IDIOMA, locale); } catch { /* preferencia opcional */ }
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
