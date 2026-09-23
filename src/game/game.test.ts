import { describe, expect, it } from "vitest";
import {
  alumnosActivos,
  alumnosEnEspera,
  aplicarEntrenamientoSemanal,
  calcularModificadores,
  capacidadAlumnos,
  cerrarAsalto,
  crearEstadoBase,
  crearEstadoPelea,
  genPugilista,
  generarOfertas,
  normalizarListaEspera,
  puedeHabilitar,
  prepararLuchador,
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

  it("completa el ciclo semanal y deja la caja lista para la semana siguiente", () => {
    let estado = { ...crearEstadoBase(), creado: true };
    for (let i = 0; i < 6; i++) estado = reductor(estado, { type: "AVANZAR_DIA" });
    expect(estado.dia).toBe(7);
    expect(estado.resumen).not.toBeNull();
    expect(estado.libroIngresos.length).toBeGreaterThan(0);
    estado = reductor(estado, { type: "CERRAR_DOMINGO" });
    expect(estado.dia).toBe(1);
    expect(estado.semana).toBe(2);
    expect(estado.resumen).toBeNull();
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

  it("asigna las caídas al boxeador correcto en el resultado", () => {
    const mio = genPugilista({ rol: "boxeador" });
    const rival = genPugilista({ rol: "boxeador" });
    const estado = crearEstadoPelea({ id: "caidas", miId: mio.id, rival, bolsa: 600, esTitulo: 0, velada: false }, mio, []);
    estado.A.caidas = 2;
    estado.B.caidas = 1;
    const resultado = resolverPelea(estado);
    expect(resultado.miId).toBe(mio.id);
    expect(resultado.rivalNombre).toBe(rival.nombre);
    expect(resultado.caidasA).toBe(2);
    expect(resultado.caidasB).toBe(1);
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

  it("separa alumnos activos de la lista de espera y no los entrena", () => {
    const base = crearEstadoBase();
    const exceso = Array.from({ length: capacidadAlumnos(base) + 2 }, () => genPugilista({ rol: "alumno" }));
    const estado = normalizarListaEspera({ ...base, plantel: exceso });
    expect(alumnosActivos(estado)).toHaveLength(capacidadAlumnos(estado));
    expect(alumnosEnEspera(estado)).toHaveLength(2);
    const antes = alumnosEnEspera(estado)[0].atrib;
    expect(aplicarEntrenamientoSemanal(estado).plantel.find(p => p.id === alumnosEnEspera(estado)[0].id)?.atrib).toEqual(antes);
  });

  it("solo marca como habilitable a un alumno activo con licencia y prácticas", () => {
    const base = crearEstadoBase();
    const alumno = { ...base.plantel.find(p => p.rol === "alumno")! };
    alumno.fogueo = alumno.fogueoMeta;
    expect(puedeHabilitar(alumno, base)).toBe(false);
    const conLicencia = { ...base, cursos: ["dt"] as typeof base.cursos };
    expect(puedeHabilitar(alumno, conLicencia)).toBe(true);
    expect(puedeHabilitar({ ...alumno, enEspera: true }, conLicencia)).toBe(false);
  });

  it("centraliza los efectos de recuperación, cupos y entrenamiento", () => {
    const base = crearEstadoBase();
    const mejorado = {
      ...base,
      equipamiento: ["vendasGel", "vestuarios", "soga"] as typeof base.equipamiento,
      cursos: ["nutricion"] as typeof base.cursos,
    };
    const mods = calcularModificadores(mejorado);
    expect(mods.recuperacionEnergia).toBe(42);
    expect(mods.energiaEntrenamiento).toBe(6);
    expect(mods.capacidadAlumnos).toBe(4);
    expect(mods.gananciaAtributo.resistencia).toBeCloseTo(1.15);
  });

  it("aplica la caída al boxeador que cayó aunque haya ganado el asalto por daño", () => {
    const mio = genPugilista({ rol: "boxeador" });
    const rival = genPugilista({ rol: "boxeador" });
    const estado = crearEstadoPelea({ id: "p2", miId: mio.id, rival, bolsa: 100, esTitulo: 0, velada: false }, mio, []);
    estado.A.dmgDado = 100;
    estado.A.conectadosAsalto = 10;
    estado.A.kdAsalto = 1;
    estado.B.dmgDado = 1;
    estado.B.kdAsalto = 0;
    cerrarAsalto(estado);
    expect(estado.tarjetas.every(t => t.a === 8 && t.b === 9)).toBe(true);
  });

  it("no entrega el equipamiento del gimnasio al rival", () => {
    const mio = genPugilista({ rol: "boxeador" });
    const rival = genPugilista({ rol: "boxeador" });
    const equipado = prepararLuchador(mio, ["bucal", "botas"], "equilibrado");
    const limpio = prepararLuchador(mio, [], "equilibrado");
    const pelea = crearEstadoPelea({ id: "p3", miId: mio.id, rival, bolsa: 100, esTitulo: 0, velada: false }, mio, ["bucal", "botas"]);
    expect(equipado.evasion - limpio.evasion).toBeCloseTo(0.1, 5);
    expect(pelea.B.evasion).toBeCloseTo(prepararLuchador(rival, [], "equilibrado").evasion, 5);
  });
});
