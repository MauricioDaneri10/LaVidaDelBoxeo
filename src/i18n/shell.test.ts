import { beforeAll, expect, it, vi } from "vitest";
import { es, registrarCatalogo, translate, type MessageKey } from "./catalog";
import { formatearDineroJuego } from "./index";

beforeAll(async () => {
  const { readFileSync } = await vi.importActual<{ readFileSync: (url: URL, encoding: string) => string }>("node:fs");
  for (const locale of ["en", "pt-BR"] as const)
    registrarCatalogo(locale, JSON.parse(readFileSync(new URL(`../../public/i18n/${locale}.json`, import.meta.url), "utf8")));
});
it("el formato monetario cambia separadores, no convierte ni modifica los ceros",()=>{
  expect(formatearDineroJuego(1500,"es")).toBe("$1.500");
  expect(formatearDineroJuego(1500,"en")).toBe("$1,500");
  expect(formatearDineroJuego(1500,"pt-BR")).toBe("$1.500");
  for(const locale of ["es","en","pt-BR"] as const) {
    expect(formatearDineroJuego(0,locale)).toBe("$0");
    expect(formatearDineroJuego(-143,locale)).toBe("$-143");
  }
});

it.each(["es", "en", "pt-BR"] as const)("%s cubre inicio, emblemas y recuperación sin promesas falsas", locale => {
  const required = ["intro.tagline", "intro.pitch", "intro.risks", "intro.guide", "intro.start", "intro.capabilities", "recovery.title", "recovery.saved", "recovery.retry", "recovery.reload", ...["guante", "leon", "aguila", "corona", "rayo", "lobo"].flatMap(id => [`logo.${id}`, `logo.${id}.motto`])];
  for (const key of required) {
    expect(key in es, key).toBe(true);
    expect(translate(locale, key as MessageKey)).not.toBe(key);
  }
  expect(es["intro.capabilities"]).toBe("11 capacidades");
  expect(es["recovery.saved"]).not.toContain("sigue guardada");
});

it.each(["es", "en", "pt-BR"] as const)("%s conserva ceros, nombres históricos y semántica del estado", locale => {
  const copy = translate(locale, "top.account", { money: "$0", fame: 0, followers: 0 });
  expect(copy.match(/0/g)?.length).toBe(3);
  const historical = "Nombre {coach} 🥊 desconocido";
  expect(translate(locale, "intro.deleteSave", { name: historical })).toContain(historical);
});

it.each(["es", "en", "pt-BR"] as const)("%s cubre ayudas, identidad y vitrinas del gimnasio", locale => {
  for(const key of ["gym.wall","gym.wallIdentity","gym.students","gym.competitors","gym.belts","gym.lockers","gym.clickBoxer","gym.freeStation","gym.eliteEmpty","gym.poster","gym.posterTime","gym.viewSheet"] as const) {
    expect(key in es,key).toBe(true);
    expect(translate(locale,key as MessageKey)).not.toBe(key);
  }
  expect(translate(locale,"gym.allBelts",{count:8})).toContain("8");
});
