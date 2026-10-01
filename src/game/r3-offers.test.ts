import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import { conFuenteAzar, numeroAleatorio, usarSemilla } from "./random";
import type { EstadoJuego, OfertaRival, Pugilista } from "./types";

function seeded<T>(seed: number, run: () => T): T {
  const restore = usarSemilla(seed);
  try { return run(); } finally { restore(); }
}
function fixture(titulo: Pugilista["titulo"] = 0) {
  return seeded(51, () => {
    const p: Pugilista = { ...engine.genPugilista({ rol: "boxeador", genero: "M" }),
      circuito: "pro", titulo, peleasProfesionales: 25, victoriasProfesionales: 20,
      derrotasProfesionales: 5, kosProfesionales: 10, record: { v: 20, d: 5, e: 0, ko: 10 } };
    const e: EstadoJuego = { ...engine.crearEstadoBase({ sinPoblacion: true }), plantel: [p], cursos: [] };
    return { p, e };
  });
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe("R3 A10: generación y elegibilidad de ofertas no pactadas", () => {
  for (const seed of [1001, 260923, 220001]) {
    for (const titulo of [0, 1, 2, 3, 4] as const) {
      it(`título ${titulo}, sin TV, seed ${seed}: desafío ordinario y ninguna tirada de campeón`, () => {
        const { p, e } = fixture(titulo);
        const before = JSON.stringify({ p, e }); freeze(p); freeze(e);
        // Un campeón mundial no aspira a otro título: referencia ordinaria
        // independiente de la nueva opción y con el mismo récord/atributos.
        const ordinary = seeded(seed, () => {
          const offers = engine.generarOfertas({ ...p, titulo: 4 });
          return { offers, next: numeroAleatorio() };
        });
        const actual = seeded(seed, () => ({ offers: engine.ofertasValidasPara(p, e), next: numeroAleatorio() }));
        expect(actual).toEqual(ordinary);
        expect(actual.offers.map(o => o.bolsa)).toEqual([Math.round(250 * 1.45), Math.round(600 * 1.45), Math.round(1800 * 1.45)]);
        for (const o of actual.offers) {
          expect(engine.ofertaValidaPara(p, o, e)).toBe(true);
          expect(o.esTitulo).toBe(0); expect(o.rival.titulo).toBe(0);
          expect(o.rival).toMatchObject({ circuito: p.circuito, division: p.division, genero: p.genero });
        }
        expect(JSON.stringify({ p, e })).toBe(before);
      });
      it(`título ${titulo}, con TV, seed ${seed}: fórmula titular y RNG originales`, () => {
        const { p, e } = fixture(titulo); e.cursos = ["tv"];
        const expectedWorld = { 1001: 83000, 260923: 71000, 220001: 145000 }[seed];
        const offers = seeded(seed, () => engine.ofertasValidasPara(p, e));
        expect(offers).toEqual(seeded(seed, () => engine.generarOfertas(p)));
        expect(offers.map(o => o.bolsa)).toEqual([363, 870, titulo < 4 ? expectedWorld : 2610]);
        expect(offers[2].esTitulo).toBe(titulo < 4 ? 4 : 0);
        expect(offers[2].rival.titulo).toBe(offers[2].esTitulo);
        expect(offers.every(o => engine.ofertaValidaPara(p, o, e))).toBe(true);
      });
    }
  }

  it.each([
    [10, 6, 3, 1, 5000], [25, 12, 4, 2, 15000], [25, 15, 6, 3, 18000],
  ] as const)("umbral %i/%i/%i: título %i y bolsa %i exacta", (peleas, wins, kos, title, purse) => {
    const { p, e } = fixture();
    Object.assign(p, { peleasProfesionales: peleas, victoriasProfesionales: wins, kosProfesionales: kos });
    for (const tv of [false, true]) {
      e.cursos = tv ? ["tv"] : [];
      const offers = seeded(1001, () => engine.ofertasValidasPara(p, e));
      expect(offers[2].esTitulo).toBe(title === 3 && !tv ? 0 : title);
      expect(offers[2].bolsa).toBe(title === 3 && !tv ? 2610 : purse);
      expect(offers[2].rival.titulo).toBe(offers[2].esTitulo);
      expect(engine.ofertaValidaPara(p, offers[2], e)).toBe(true);
      expect(engine.ofertaValidaPara(p, { ...offers[2], bolsa: offers[2].bolsa + 1 }, e)).toBe(false);
    }
  });

  it.each(["amateur", "pro"] as const)("debut %s: bolsa de formación y experiencia del circuito", circuito => {
    const { p, e } = fixture();
    Object.assign(p, { circuito, peleasAmateur: 0, peleasProfesionales: 0, victoriasProfesionales: 0, kosProfesionales: 0, record: { v: 0, d: 0, e: 0, ko: 0 } });
    for (const tv of [false, true]) {
      e.cursos = tv ? ["tv"] : [];
      const offers = seeded(1001, () => engine.ofertasValidasPara(p, e));
      expect(offers.map(o => o.bolsa)).toEqual([200, 480, 1440]);
      for (const o of offers) {
        expect(o.esTitulo).toBe(0); expect(o.rival.circuito).toBe(circuito);
        const experience = circuito === "pro" ? o.rival.peleasProfesionales : o.rival.peleasAmateur;
        expect(experience).toBeGreaterThanOrEqual(0); expect(experience).toBeLessThanOrEqual(3);
      }
    }
  });

  it("debut pro conserva bolsa del récord histórico y empareja con 0–3 peleas pro", () => {
    const { p, e } = fixture();
    Object.assign(p, { peleasAmateur: 50, peleasProfesionales: 0, victoriasProfesionales: 0, kosProfesionales: 0, record: { v: 35, d: 15, e: 0, ko: 15 } });
    const offers = seeded(260923, () => engine.ofertasValidasPara(p, e));
    expect(offers.map(o => o.bolsa)).toEqual([363, 870, 2610]);
    expect(offers.every(o => o.esTitulo === 0 && o.rival.peleasProfesionales <= 3)).toBe(true);
  });

  it("récord negativo: bolsas ordinarias exactas sin habilitar título", () => {
    const { p, e } = fixture();
    Object.assign(p, { victoriasProfesionales: 5, derrotasProfesionales: 20, kosProfesionales: 2, record: { v: 5, d: 20, e: 0, ko: 2 } });
    for (const tv of [false, true]) {
      e.cursos = tv ? ["tv"] : [];
      const offers = seeded(220001, () => engine.ofertasValidasPara(p, e));
      expect(offers.map(o => o.bolsa)).toEqual([145, 348, 1044]);
      expect(offers.every(o => o.esTitulo === 0 && o.rival.titulo === 0)).toBe(true);
    }
  });

  it("ofertas legacy: rechaza campeón/bolsa degradados sin mutar ni consumir RNG", () => {
    const { p, e } = fixture();
    const title = seeded(1001, () => engine.generarOfertas(p)[2]);
    const healthy = seeded(1001, () => engine.generarOfertas({ ...p, titulo: 4 })[2]);
    const degraded: OfertaRival = { ...title, esTitulo: 0, etiqueta: "Pelea de experiencia" };
    const cases: [OfertaRival, boolean][] = [
      [healthy, true], [degraded, false], [title, false],
      [{ ...degraded, rival: { ...degraded.rival, titulo: 0 } }, false],
      [{ ...healthy, rival: { ...healthy.rival, titulo: 4 } }, false],
      [{ ...healthy, bolsa: healthy.bolsa + 1 }, false],
      [{ ...healthy, rival: { ...healthy.rival, circuito: "amateur" } }, false],
      [{ ...healthy, rival: { ...healthy.rival, genero: "F" } }, false],
      [{ ...healthy, rival: { ...healthy.rival, division: "otra" } }, false],
    ];
    freeze(p); freeze(e); freeze(cases);
    const before = JSON.stringify({ p, e, cases });
    let draws = 0;
    conFuenteAzar(() => { draws++; return 0.5; }, () => {
      for (const [offer, valid] of cases) expect(engine.ofertaValidaPara(p, offer, e)).toBe(valid);
      expect(engine.ofertaValidaPara(p, title, { ...e, cursos: ["tv"] })).toBe(true);
    });
    expect(draws).toBe(0); expect(JSON.stringify({ p, e, cases })).toBe(before);
  });

  it("predicado titular exige título/rival/bolsa/requisito, sin usar etiquetas visibles", () => {
    const { p, e } = fixture(); e.cursos = ["tv"];
    const offer = seeded(1001, () => engine.generarOfertas(p)[2]);
    expect(engine.ofertaValidaPara(p, { ...offer, etiqueta: "otro idioma", detalle: "" }, e)).toBe(true);
    for (const bolsa of [59000, 151000, 83001, NaN, Infinity]) {
      expect(engine.ofertaValidaPara(p, { ...offer, bolsa }, e)).toBe(false);
    }
    expect(engine.ofertaValidaPara(p, { ...offer, rival: { ...offer.rival, titulo: 3 } }, e)).toBe(false);
    expect(engine.ofertaValidaPara({ ...p, victoriasProfesionales: 0 }, offer, e)).toBe(false);
  });
});
