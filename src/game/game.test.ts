import { describe, expect, it } from "vitest";
import {
  crearEstadoBase,
  crearEstadoPelea,
  genPugilista,
  generarOfertas,
  resolverPelea,
  sanitizarEstado,
  valoracion,
} from "./engine";
import { reductor } from "./state";

describe("reglas principales de La Vida del Boxeo", () => {
  it("entrena una sola vez por semana aunque se avancen varios días", () => {
    let estado = crearEstadoBase();
    estado.creado = true;
    const antes = estado.plantel[0].atrib;

    estado = reductor(estado, { type: "AVANZAR_DIA" });
    expect(estado.dia).toBe(2);
    expect(estado.ultimaSemanaEntrenada).toBe(1);
    const despuesPrimerDia = { ...estado.plantel[0].atrib };

    estado = reductor(estado, { type: "AVANZAR_DIA" });
    expect(estado.dia).toBe(3);
    expect(estado.ultimaSemanaEntrenada).toBe(1);
    expect(estado.plantel[0].atrib).toEqual(despuesPrimerDia);
    expect(antes).not.toBe(estado.plantel[0].atrib);
  });

  it("mantiene género, división y circuito al generar ofertas", () => {
    const atleta = genPugilista({ rol: "boxeador", genero: "F" });
    atleta.division = "Ligero";
    atleta.circuito = "pro";
    for (let i = 0; i < 50; i++) {
      const ofertas = generarOfertas(atleta);
      expect(ofertas).toHaveLength(3);
      for (const oferta of ofertas) {
        expect(oferta.rival.genero).toBe(atleta.genero);
        expect(oferta.rival.division).toBe(atleta.division);
        expect(oferta.rival.circuito).toBe(atleta.circuito);
      }
    }
  });

  it("resuelve correctamente un empate por tarjetas", () => {
    const mio = genPugilista({ rol: "boxeador", genero: "M" });
    const rival = genPugilista({ rol: "boxeador", genero: "M" });
    const pelea = { id: "p1", miId: mio.id, rival, bolsa: 600, esTitulo: 0 as const, velada: false };
    const estado = crearEstadoPelea(pelea, mio, []);
    estado.tarjetas = [{ a: 30, b: 30 }, { a: 30, b: 30 }, { a: 30, b: 30 }];

    const resultado = resolverPelea(estado);
    expect(resultado.empate).toBe(true);
    expect(resultado.gane).toBe(false);
    expect(resultado.metodo).toBe("Empate");
  });

  it("no permite que una partida corrupta desborde los límites básicos", () => {
    const base = crearEstadoBase();
    const estado = sanitizarEstado({
      ...base,
      creado: true,
      dinero: -500,
      fama: 999,
      dia: 99,
      logoGimnasio: "ring",
      plantel: [{ ...base.plantel[0], energia: 500, fogueo: -4 }],
    });

    expect(estado.dinero).toBe(0);
    expect(estado.fama).toBe(100);
    expect(estado.dia).toBe(7);
    expect(estado.plantel[0].energia).toBe(100);
    expect(estado.plantel[0].fogueo).toBe(0);
    expect(typeof estado.logoGimnasio).toBe("string");
    expect(valoracion(estado.plantel[0].atrib)).toBeGreaterThanOrEqual(0);
  });
});
