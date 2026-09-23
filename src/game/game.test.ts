import { describe, expect, it } from "vitest";
import {
  alumnosActivos,
  alumnosEnEspera,
  aplicarEntrenamientoSemanal,
  azar,
  calcularModificadores,
  capacidadAlumnos,
  capacidadPlantel,
  capacidadProfesionales,
  cerrarAsalto,
  crearEstadoBase,
  crearEstadoPelea,
  genPugilista,
  generarOfertas,
  normalizarListaEspera,
  puedeHabilitar,
  rankingMundial,
  tituloAspirable,
  puedePactarPelea,
  proyeccionSemanal,
  prepararLuchador,
  resolverPelea,
  sanitizarEstado,
  valoracion,
} from "./engine";
import { migrarGuardado, reductor } from "./state";
import { conflictosAtajos, ATAJOS_DEFAULT } from "./shortcuts";
import { formatearMoneda, formatearNumero } from "../i18n";
import { usarSemilla } from "./random";
import { leerDiagnosticos } from "../diagnostics";
import { crearPersistencia } from "./storage";

describe("reglas principales de La Vida del Boxeo", () => {
  it("asigna el mejor enfoque inmediatamente al contratar el entrenador automático", () => {
    const base = { ...crearEstadoBase(), creado: true, cursos: ["dt"] as ReturnType<typeof crearEstadoBase>["cursos"] };
    const resultado = reductor(base, { type: "CONTRATAR", tipo: "directorTecnico" });
    expect(resultado.personal.some(p => p.tipo === "directorTecnico")).toBe(true);
    expect(resultado.plantel.every(p => p.enEspera || p.combo !== "acondicionamiento")).toBe(true);
  });

  it("limita el salto profesional a diez plazas y mantiene el contador de recreativos", () => {
    const base = crearEstadoBase();
    const pros = Array.from({ length: capacidadProfesionales(base) }, () => ({ ...genPugilista({ rol: "boxeador" }), circuito: "pro" as const }));
    const amateur = { ...genPugilista({ rol: "boxeador" }), circuito: "amateur" as const, peleasAmateur: 50 };
    let siguiente = { ...base, creado: true, plantel: [...pros, amateur], fama: 32, recreativos: 0 };
    for (let i = 0; i < 6; i++) siguiente = reductor(siguiente, { type: "AVANZAR_DIA" });
    siguiente = reductor(siguiente, { type: "CERRAR_DOMINGO" });
    expect(siguiente.plantel.filter(p => p.circuito === "pro")).toHaveLength(10);
    expect(siguiente.recreativos).toBeGreaterThanOrEqual(1);
  });

  it("sostiene una partida durante 120 semanas sin saturar ni romper el calendario", () => {
    let estado = { ...crearEstadoBase(), creado: true };
    for (let semana = 0; semana < 120; semana++) {
      for (let dia = 0; dia < 6; dia++) estado = reductor(estado, { type: "AVANZAR_DIA" });
      estado = reductor(estado, { type: "AVANZAR_DIA" });
      estado = reductor(estado, { type: "CERRAR_DOMINGO" });
      expect(estado.semana).toBe(semana + 2);
      expect(estado.plantel.length).toBeLessThanOrEqual(30);
      expect(estado.dia).toBe(1);
    }
  });
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

    expect(estado.dinero).toBe(-500);
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

  it("separa la licencia del entrenador de la licencia individual del pugilista", () => {
    const base = crearEstadoBase();
    const alumno = { ...base.plantel.find(p => p.rol === "alumno")!, fogueo: 10, fogueoMeta: 10 };
    const conLicenciaEntrenador = { ...base, cursos: ["dt"] as typeof base.cursos, dinero: 500 };
    expect(conLicenciaEntrenador.cursos).toContain("dt");
    expect(alumno.licenciaFederativa).toBe(false);
    const federado = reductor({ ...conLicenciaEntrenador, plantel: [alumno] }, { type: "LICENCIAR", id: alumno.id });
    expect(federado.plantel[0].rol).toBe("boxeador");
    expect(federado.plantel[0].licenciaFederativa).toBe(true);
    expect(federado.plantel[0].record).toEqual({ v: 0, d: 0, e: 0, ko: 0 });
    expect(federado.dinero).toBe(300);
  });

  it("limita la búsqueda de talentos a una vez por semana", () => {
    const base = { ...crearEstadoBase(), creado: true };
    const primera = reductor(base, { type: "SCOUT" });
    expect(primera.ultimaSemanaScout).toBe(primera.semana);
    expect(primera.plantel.length).toBe(base.plantel.length + 1);
    const repetida = reductor(primera, { type: "SCOUT" });
    expect(repetida.plantel.length).toBe(primera.plantel.length);
    const siguienteSemana = reductor({ ...primera, semana: primera.semana + 1 }, { type: "SCOUT" });
    expect(siguienteSemana.plantel.length).toBe(primera.plantel.length + 1);
  });

  it("proyecta todas las fuentes y costos recurrentes que se liquidan el domingo", () => {
    const base = crearEstadoBase();
    const estado = {
      ...base,
      creado: true,
      recreativos: 3,
      dinero: -200,
      equipamiento: ["estudioMarca"] as typeof base.equipamiento,
      marcaRopa: "Daneri Fightwear",
      propiedades: ["local", "sucursal"] as typeof base.propiedades,
      personal: [
        { id: "g", tipo: "gerente" as const, nombre: "Gerente" },
        { id: "l", tipo: "entrenadorLocal" as const, nombre: "Entrenador" },
      ],
      comunitarios: [{ id: "b", tipo: "bingo" as const, nombre: "Bingo", venceEn: 2 }],
    };
    const proyeccion = proyeccionSemanal(estado);
    expect(proyeccion.ingresos.map(l => l.concepto)).toEqual(expect.arrayContaining([
      "Cuotas recreativas (3 × $10)",
      "Ingresos pasivos de sucursales (1)",
      'Ventas de la marca "Daneri Fightwear"',
      "Dividendos estimados: Bingo",
    ]));
    expect(proyeccion.gastos.map(l => l.concepto)).toContain("Costo financiero por caja negativa");
  });

  it("otorga la fama del equipamiento una sola vez y no cada semana", () => {
    let estado = { ...crearEstadoBase(), creado: true, dinero: 1_000, fama: 4 };
    estado = reductor(estado, { type: "COMPRAR_EQUIPO", id: "carteles" });
    expect(estado.fama).toBe(5);
    const famaTrasCompra = estado.fama;
    for (let i = 0; i < 6; i++) estado = reductor(estado, { type: "AVANZAR_DIA" });
    estado = reductor(estado, { type: "CERRAR_DOMINGO" });
    expect(estado.fama).toBe(famaTrasCompra);
  });

  it("permite bajar seguidores cuando fama y resultados caen", () => {
    let estado = { ...crearEstadoBase(), creado: true, fama: 40, seguidores: 10_000 };
    for (let i = 0; i < 6; i++) estado = reductor(estado, { type: "AVANZAR_DIA" });
    estado = reductor(estado, { type: "CERRAR_DOMINGO" });
    expect(estado.seguidores).toBe(4_800);
  });

  it("evita que el plantel crezca sin límite después de licenciar boxeadores", () => {
    const base = crearEstadoBase();
    const lleno = {
      ...base,
      creado: true,
      plantel: Array.from({ length: capacidadPlantel(base) }, (_, i) => genPugilista({ rol: i < 10 ? "boxeador" : "alumno" })),
    };
    const resultado = reductor(lleno, { type: "SCOUT" });
    expect(resultado.plantel).toHaveLength(lleno.plantel.length);
    expect(resultado.ultimaSemanaScout).toBe(lleno.ultimaSemanaScout);
  });

  it("retirar a un alumno libera una plaza y promueve al primero de la espera", () => {
    const base = crearEstadoBase();
    const alumnos = Array.from({ length: capacidadAlumnos(base) + 1 }, () => genPugilista({ rol: "alumno" }));
    const lleno = normalizarListaEspera({ ...base, plantel: alumnos });
    const enEspera = alumnosEnEspera(lleno)[0];
    const siguiente = reductor(lleno, { type: "RETIRAR_ATLETA", id: alumnosActivos(lleno)[0].id });
    expect(siguiente.plantel.some(p => p.id === alumnosActivos(lleno)[0]?.id)).toBe(false);
    expect(siguiente.plantel.find(p => p.id === enEspera.id)?.enEspera).toBe(false);
  });

  it("separa las metas amateur/profesionales y arma un ranking con clubes rivales", () => {
    const base = crearEstadoBase();
    expect(base.rivales.length).toBe(20);
    const pro = { ...base.plantel[0], rol: "boxeador" as const, circuito: "pro" as const, peleasAmateur: 50, peleasProfesionales: 10, victoriasProfesionales: 7, derrotasProfesionales: 2, empatesProfesionales: 1, kosProfesionales: 4, record: { v: 7, d: 2, e: 1, ko: 4 } };
    expect(tituloAspirable(pro)).toBe(1);
    expect(rankingMundial({ ...base, plantel: [pro] }).some(item => item.pugilista.id === pro.id)).toBe(true);
  });

  it("bloquea peleas por cooldown en búsqueda y confirmación", () => {
    const base = { ...crearEstadoBase(), creado: true, dia: 1, semana: 5 };
    const boxeador = { ...base.plantel[0], rol: "boxeador" as const, licenciaFederativa: true, energia: 100, proximaPeleaSemana: 7 };
    const estado = { ...base, plantel: [boxeador] };
    expect(puedePactarPelea(boxeador, estado)).toEqual({ ok: false, motivo: "cooldown", disponibleSemana: 7 });
    const bloqueado = reductor(estado, { type: "BUSCAR_RIVAL", id: boxeador.id });
    expect(bloqueado.ofertas).toHaveLength(0);
    expect(bloqueado.toasts[bloqueado.toasts.length - 1]?.texto).toContain("semana 7");

    const oferta = generarOfertas(boxeador)[0];
    const conOfertaVieja = { ...estado, ofertas: [oferta], ofertasPara: boxeador.id };
    const confirmado = reductor(conOfertaVieja, { type: "ELEGIR_OFERTA", ofertaId: oferta.id });
    expect(confirmado.pendientes).toHaveLength(0);
    expect(confirmado.toasts[confirmado.toasts.length - 1]?.texto).toContain("semana 7");
  });

  it("no deja transferir un boxeador con cartelera pendiente", () => {
    const base = { ...crearEstadoBase(), creado: true };
    const boxeador = { ...base.plantel[0], rol: "boxeador" as const, licenciaFederativa: true };
    const estado = { ...base, plantel: [boxeador], pendientes: [{ id: "p1", miId: boxeador.id, rival: genPugilista({ rol: "boxeador" }), bolsa: 500, esTitulo: 0 as const, velada: false }] };
    const siguiente = reductor(estado, { type: "RETIRAR_ATLETA", id: boxeador.id });
    expect(siguiente.plantel).toHaveLength(1);
    expect(siguiente.pendientes).toHaveLength(1);
    expect(siguiente.toasts[siguiente.toasts.length - 1]?.tono).toBe("alerta");
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

  it("detecta conflictos de atajos antes de guardarlos", () => {
    expect(conflictosAtajos({ ...ATAJOS_DEFAULT, ciudad: "1" })).toContainEqual(["gimnasio", "ciudad"]);
    expect(conflictosAtajos(ATAJOS_DEFAULT)).toHaveLength(0);
  });

  it("prepara formatos internacionales sin alterar el valor económico", () => {
    expect(formatearNumero(1200, "es")).toContain("1.200");
    expect(formatearNumero(1200, "en")).toContain("1,200");
    expect(formatearMoneda(500, "es")).toContain("500");
    expect(formatearMoneda(500, "en")).toContain("500");
  });

  it("migra una partida vieja a un envelope compatible sin perder identidad", () => {
    const anterior = { ...crearEstadoBase(), creado: true, schemaVersion: 1, partidaId: "", nombreGimnasio: "Club Viejo" };
    const resultado = migrarGuardado(anterior);
    const estado = resultado.estado as typeof anterior & { schemaVersion: number; partidaId: string };
    expect(resultado.migrado).toBe(true);
    expect(estado.schemaVersion).toBe(3);
    expect(estado.nombreGimnasio).toBe("Club Viejo");
    expect(estado.partidaId).toMatch(/^migrada-/);
  });

  it("permite avanzar desde sábado sin pelea y bloquea el salto si hay cartelera pendiente", () => {
    const base = { ...crearEstadoBase(), creado: true, dia: 6 };
    const domingo = reductor(base, { type: "SEMANA_RAPIDA" });
    expect(domingo.dia).toBe(7);
    expect(domingo.resumen).not.toBeNull();
    const pendiente = { ...base, pendientes: [{ id: "p1", miId: base.plantel[0].id, rival: genPugilista({ rol: "boxeador" }), bolsa: 100, esTitulo: 0 as const, velada: false }] };
    const bloqueado = reductor(pendiente, { type: "SEMANA_RAPIDA" });
    expect(bloqueado.dia).toBe(6);
    expect(bloqueado.toasts[bloqueado.toasts.length - 1]?.tono).toBe("alerta");
  });

  it("reproduce la misma simulación cuando se fija una semilla", () => {
    const restaurar = usarSemilla(20260923);
    const primera = Array.from({ length: 12 }, () => azarSeguro());
    restaurar();
    const restaurarOtra = usarSemilla(20260923);
    const segunda = Array.from({ length: 12 }, () => azarSeguro());
    restaurarOtra();
    expect(segunda).toEqual(primera);
  });

  it("mantiene el diagnóstico de cliente acotado y separado de la partida", () => {
    expect(leerDiagnosticos()).toEqual([]);
  });

  it("permite ejecutar la persistencia con un adaptador aislado del navegador", () => {
    const almacenamiento = crearPersistencia();
    almacenamiento.setItem("prueba", "ok");
    expect(almacenamiento.getItem("prueba")).toBe("ok");
    almacenamiento.removeItem("prueba");
    expect(almacenamiento.getItem("prueba")).toBeNull();
  });

  it("mantiene los atajos nuevos sin conflictos", () => {
    expect(ATAJOS_DEFAULT.calendario).toBe("7");
    expect(conflictosAtajos(ATAJOS_DEFAULT)).toHaveLength(0);
  });
});

function azarSeguro(): number {
  return azar(0, 1_000_000);
}
