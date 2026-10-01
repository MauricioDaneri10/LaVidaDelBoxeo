import { describe, expect, it } from "vitest";
import { calcularCapacidadPlantel, ordenarPlantel } from "./plantelLayout";
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
  fechaDelJuego,
  genPugilista,
  generarEventos,
  generarOfertas,
  normalizarListaEspera,
  puedeHabilitar,
  rankingMundial,
  tituloAspirable,
  puedePactarPelea,
  puedeProfesionalizar,
  proyeccionSemanal,
  proyeccionSemanalRecurrente,
  prepararLuchador,
  resolverPelea,
  simularPeleaEntera,
  totalPeleas,
  sanitizarEstado,
  valoracion,
} from "./engine";
import { migrarGuardado, objetivoConsejoCumplido, reductor } from "./state";
import { COMUNITARIOS, CATEGORIAS, EQUIPOS } from "./data";
import { recomendarEquipo } from "./market";
import { conflictosAtajos, ATAJOS_DEFAULT } from "./shortcuts";
import { formatearMoneda, formatearNumero } from "../i18n";
import { usarSemilla } from "./random";
import { leerDiagnosticos } from "../diagnostics";
import { crearPersistencia } from "./storage";
import { SCHEMA_ACTUAL } from "./saveValidation";

describe("reglas principales de La Vida del Boxeo", () => {
  it("genera una entrevista con opciones cuyo texto y consecuencias coinciden", () => {
    const base = { ...crearEstadoBase(), fama: 12 };
    let entrevista: ReturnType<typeof generarEventos>[number] | undefined;
    let mantenimiento: ReturnType<typeof generarEventos>[number] | undefined;
    for (let semilla = 1; semilla <= 300 && (!entrevista || !mantenimiento); semilla++) {
      const restaurar = usarSemilla(semilla);
      try {
        const eventos = generarEventos(base);
        entrevista = eventos.find(e => e.tipo === "entrevista");
        mantenimiento ??= eventos.find(e => e.tipo === "mantenimiento");
      }
      finally { restaurar(); }
    }
    expect(entrevista).toBeDefined();
    expect(entrevista?.opciones.map(op => op.accion)).toEqual([
      expect.objectContaining({ tipo: "entrevista", fama: 2, monto: 80 }),
      expect.objectContaining({ tipo: "entrevista", fama: -2, monto: -40 }),
      expect.objectContaining({ tipo: "nada" }),
    ]);
    expect(entrevista?.texto).toContain("mejorar o perjudicar");
    expect(mantenimiento).toBeDefined();
    expect(mantenimiento?.texto).toContain("reparación preventiva");
    expect(mantenimiento?.texto).toContain("no cambia el entrenamiento");
    expect(mantenimiento?.opciones[0].accion).toMatchObject({ tipo: "mantenimiento", costo: 120 });
    expect(mantenimiento?.opciones[0].accion).not.toHaveProperty("monto");
  });

  it("mantiene el catálogo de mercado completo, categorizado y con sugerencias pagables", () => {
    const ids = Object.keys(EQUIPOS);
    expect(ids).toHaveLength(23);
    expect(CATEGORIAS).toHaveLength(4);
    expect(CATEGORIAS.every(c => ids.some(id => EQUIPOS[id as keyof typeof EQUIPOS].cat === c.id))).toBe(true);
    expect(recomendarEquipo("equipamiento", [], 400)).toBe("soga");
    expect(recomendarEquipo("equipamiento", ["soga"], 400)).toBeNull();
    expect(recomendarEquipo("instalaciones", [], 350)).toBe("botiquin");
    expect(recomendarEquipo("difusion", [], 0)).toBeNull();
  });

  it("ordena talentos recientes y valoración sin mutar el plantel guardado", () => {
    const roster = [
      { id: "veterano-1", semanaIngreso: 1, vg: 55 },
      { id: "nuevo-1", semanaIngreso: 4, vg: 44 },
      { id: "veterano-2", semanaIngreso: 2, vg: 68 },
      { id: "nuevo-2", semanaIngreso: 4, vg: 44 },
      { id: "sin-fecha", vg: 32 },
    ];

    expect(ordenarPlantel(roster, 4, "recientes", p => p.vg).map(p => p.id)).toEqual([
      "nuevo-1", "nuevo-2", "veterano-1", "veterano-2", "sin-fecha",
    ]);
    expect(ordenarPlantel(roster, 4, "valoracion-desc", p => p.vg).map(p => p.id)).toEqual([
      "veterano-2", "veterano-1", "nuevo-1", "nuevo-2", "sin-fecha",
    ]);
    expect(ordenarPlantel(roster, 4, "valoracion-asc", p => p.vg).map(p => p.id)).toEqual([
      "sin-fecha", "nuevo-1", "nuevo-2", "veterano-1", "veterano-2",
    ]);
    expect(roster.map(p => p.id)).toEqual(["veterano-1", "nuevo-1", "veterano-2", "nuevo-2", "sin-fecha"]);
  });

  it("alinea las fechas del calendario con la semana de lunes a domingo", () => {
    const fechaLocal = (semana: number, dia: number) => {
      const fecha = fechaDelJuego(semana, dia);
      return [fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate(), fecha.getDay()];
    };
    expect(fechaLocal(1, 1)).toEqual([2026, 1, 5, 1]);
    expect(fechaLocal(1, 7)).toEqual([2026, 1, 11, 0]);
    expect(fechaLocal(5, 3)).toEqual([2026, 2, 4, 3]);
    expect(fechaLocal(1, 0)).toEqual([2026, 1, 5, 1]);
  });

  it("no descuenta el plazo de un evento nuevo el mismo día que aparece", () => {
    const base = {
      ...crearEstadoBase(),
      creado: true,
      dia: 1,
      semana: 2,
      plantel: [],
      eventos: [{
        id: "evento-anterior", tipo: "entrevista" as const, de: "Prensa", titulo: "Evento previo",
        texto: "Ya estaba activo antes de avanzar el día.", venceEn: 3,
        opciones: [{ texto: "Cerrar", accion: { tipo: "nada" as const } }],
      }],
    };
    let conDiaAvanzado: ReturnType<typeof crearEstadoBase> | undefined;
    for (let semilla = 1; semilla <= 100 && !conDiaAvanzado?.eventos.some(e => e.id !== "evento-anterior"); semilla++) {
      const restaurar = usarSemilla(semilla);
      try { conDiaAvanzado = reductor(base, { type: "AVANZAR_DIA" }); }
      finally { restaurar(); }
    }
    expect(conDiaAvanzado?.eventos.some(e => e.id !== "evento-anterior")).toBe(true);
    if (!conDiaAvanzado) throw new Error("No se pudo avanzar el día");
    const anterior = conDiaAvanzado.eventos.find(e => e.id === "evento-anterior");

    expect(anterior?.venceEn).toBe(2);
    for (const nuevo of conDiaAvanzado.eventos.filter(e => e.id !== "evento-anterior")) {
      expect([3, 4]).toContain(nuevo.venceEn);
    }
  });

  it("conserva eventos accionables vigentes cuando el buzón ya alcanzó su capacidad", () => {
    const base = {
      ...crearEstadoBase(), creado: true, dia: 1, semana: 2,
      eventos: Array.from({ length: 4 }, (_, i) => ({
        id: `activo-${i}`, tipo: "entrevista" as const, de: "Prensa", titulo: `Evento ${i}`,
        texto: "Sigue esperando una decisión.", venceEn: 5,
        opciones: [{ texto: "Cerrar", accion: { tipo: "nada" as const } }],
      })),
    };
    const resultado = reductor(base, { type: "AVANZAR_DIA" });
    expect(resultado.eventos).toHaveLength(4);
    expect(resultado.eventos.map(e => e.id)).toEqual(["activo-0", "activo-1", "activo-2", "activo-3"]);
    expect(resultado.eventos.every(e => e.venceEn === 4)).toBe(true);
  });

  it("mantiene alcanzables los tres hitos únicos de Anselmo sin derechos repetibles", () => {
    const base = crearEstadoBase();
    expect(objetivoConsejoCumplido("c8", { ...base, recreativos: 3 })).toBe(true);
    expect(objetivoConsejoCumplido("c9", { ...base, seguidores: 1500 })).toBe(true);
    expect(objetivoConsejoCumplido("c10", { ...base, stats: { ...base.stats, victorias: 3 } })).toBe(true);
    expect(objetivoConsejoCumplido("c11", { ...base, recreativos: 3 })).toBe(false);
    expect(objetivoConsejoCumplido("c14", { ...base, recreativos: 3 })).toBe(false);
    expect(objetivoConsejoCumplido("c15", { ...base, seguidores: 1500 })).toBe(false);
    expect(objetivoConsejoCumplido("c10", { ...base, stats: { ...base.stats, peleas: 20, victorias: 2 } })).toBe(false);
  });

  it("no genera consejos sucesores y acredita una sola vez la recompensa", () => {
    const base = crearEstadoBase();
    const consejos = [
      ...base.consejos.map(c => ({ ...c, cumplido: true, reclamado: c.id !== "c10" })),
    ];
    const lista = { ...base, consejos };
    const cobrado = reductor(lista, { type: "RECLAMAR_CONSEJO", id: "c10" });
    expect(cobrado.consejos.filter(c => c.id === "c11")).toHaveLength(0);
    expect(cobrado.consejos.find(c => c.id === "c10")?.reclamado).toBe(true);
    const repetido = reductor(cobrado, { type: "RECLAMAR_CONSEJO", id: "c10" });
    expect(repetido.consejos).toHaveLength(cobrado.consejos.length);
    expect(repetido.fama).toBe(cobrado.fama);
    expect(cobrado.dinero - lista.dinero).toBe(120);
    expect(repetido.dinero).toBe(cobrado.dinero);
  });

  it("refleja al representante contratado y rechaza una segunda contratación única", () => {
    const base = { ...crearEstadoBase(), creado: true, semana: 2, cursos: ["veladas"] as ReturnType<typeof crearEstadoBase>["cursos"] };
    const contratado = reductor(base, { type: "CONTRATAR", tipo: "representante", confirmado: true });
    expect(contratado.personal.filter(p => p.tipo === "representante")).toHaveLength(1);
    expect(contratado.toasts[contratado.toasts.length - 1]?.tono).toBe("ok");
    expect(sanitizarEstado(JSON.parse(JSON.stringify(contratado))).personal.filter(p => p.tipo === "representante")).toHaveLength(1);
    const duplicado = reductor(contratado, { type: "CONTRATAR", tipo: "representante", confirmado: true });
    expect(duplicado.personal.filter(p => p.tipo === "representante")).toHaveLength(1);
  });

  it("no contrata puestos antes de cumplir la semana y el curso requeridos", () => {
    const inicio = { ...crearEstadoBase(), creado: true, semana: 1 };
    const bloqueado = reductor(inicio, { type: "CONTRATAR", tipo: "representante", confirmado: true });
    expect(bloqueado.personal.some(p => p.tipo === "representante")).toBe(false);
    expect(bloqueado.toasts[bloqueado.toasts.length - 1]?.texto).toContain("semana 2");

    const habilitado = { ...inicio, semana: 2, cursos: ["veladas"] as ReturnType<typeof crearEstadoBase>["cursos"] };
    const contratado = reductor(habilitado, { type: "CONTRATAR", tipo: "representante", confirmado: true });
    expect(contratado.personal.filter(p => p.tipo === "representante")).toHaveLength(1);
  });

  it("el representante agenda una pelea elegible una sola vez y solo con licencia de entrenador", () => {
    const base = crearEstadoBase();
    const boxeador = {
      ...base.plantel[0], rol: "boxeador" as const, licenciaFederativa: true,
      circuito: "amateur" as const, energia: 95, lesion: null, proximaPeleaSemana: null,
    };
    const conRepresentante = {
      ...base, creado: true, dia: 5, semana: 2,
      cursos: ["dt"] as ReturnType<typeof crearEstadoBase>["cursos"],
      personal: [{ id: "representante-test", tipo: "representante" as const, nombre: "Representante de prueba" }],
      plantel: [boxeador], pendientes: [],
    };
    const restaurar = usarSemilla(711);
    let cartelera: ReturnType<typeof reductor>;
    try { cartelera = reductor(conRepresentante, { type: "AVANZAR_DIA" }); }
    finally { restaurar(); }
    expect(cartelera.dia).toBe(6);
    expect(cartelera.pendientes).toHaveLength(1);
    expect(cartelera.pendientes[0].miId).toBe(boxeador.id);
    expect(cartelera.pendientes[0].esTitulo).toBeLessThan(3);

    const sinLicenciaEntrenador = reductor({ ...conRepresentante, cursos: [] }, { type: "AVANZAR_DIA" });
    expect(sinLicenciaEntrenador.pendientes).toHaveLength(0);
    const cansado = reductor({ ...conRepresentante, plantel: [{ ...boxeador, energia: 69 }] }, { type: "AVANZAR_DIA" });
    expect(cansado.pendientes).toHaveLength(0);
  });

  it("mantiene una propuesta pagable si falta dinero y la retira al resolverla", () => {
    const evento = {
      id: "colecta-test", tipo: "recaudacion" as const, de: "Comisión", titulo: "Colecta",
      texto: "Propuesta con costo inicial.", venceEn: 2,
      opciones: [
        { texto: "Aportar $80", accion: { tipo: "recaudacion" as const, costo: 80, monto: 180 } },
        { texto: "No organizarla", accion: { tipo: "nada" as const } },
      ],
    };
    const sinFondos = { ...crearEstadoBase(), creado: true, dinero: 20, eventos: [evento] };
    const bloqueado = reductor(sinFondos, { type: "EVENTO", id: evento.id, opcion: 0 });
    expect(bloqueado.eventos).toHaveLength(1);
    expect(bloqueado.dinero).toBe(20);

    const resuelto = reductor({ ...sinFondos, dinero: 100 }, { type: "EVENTO", id: evento.id, opcion: 1 });
    expect(resuelto.eventos).toHaveLength(0);
    const doble = reductor(resuelto, { type: "EVENTO", id: evento.id, opcion: 1 });
    expect(doble).toBe(resuelto);
  });

  it("aplica el impacto positivo o negativo de una entrevista con feedback veraz", () => {
    const evento = {
      id: "entrevista-test", tipo: "entrevista" as const, de: "Radio Guante", titulo: "Entrevista",
      texto: "Elegí una respuesta.", venceEn: 3,
      opciones: [
        { texto: "Hablar del proyecto", accion: { tipo: "entrevista" as const, fama: 2, monto: 80 } },
        { texto: "Provocar al rival", accion: { tipo: "entrevista" as const, fama: -2, monto: -40 } },
      ],
    };
    const base = { ...crearEstadoBase(), creado: true, fama: 10, seguidores: 20, eventos: [evento] };
    const favorable = reductor(base, { type: "EVENTO", id: evento.id, opcion: 0 });
    expect(favorable).toMatchObject({ fama: 12, seguidores: 100, eventos: [] });
    expect(favorable.toasts[favorable.toasts.length - 1]?.texto).toContain("+2 fama y +80 seguidores");

    const polemica = reductor(base, { type: "EVENTO", id: evento.id, opcion: 1 });
    expect(polemica).toMatchObject({ fama: 8, seguidores: 0, eventos: [] });
    expect(polemica.toasts[polemica.toasts.length - 1]?.texto).toContain("−2 fama y −40 seguidores");
  });

  it("registra la reparación preventiva aunque la acción no use un campo monto artificial", () => {
    const evento = {
      id: "mantenimiento-test", tipo: "mantenimiento" as const, de: "Comisión", titulo: "Revisión del saco",
      texto: "Desgaste preventivo.", venceEn: 3,
      opciones: [{ texto: "Reparar por $120", accion: { tipo: "mantenimiento" as const, costo: 120 } }],
    };
    const base = { ...crearEstadoBase(), creado: true, dinero: 300, eventos: [evento] };
    const resuelto = reductor(base, { type: "EVENTO", id: evento.id, opcion: 0 });
    expect(resuelto.dinero).toBe(180);
    expect(resuelto.libroGastos.reduce((total, linea) => total + linea.monto, 0)).toBe(120);
    expect(resuelto.toasts[resuelto.toasts.length - 1]?.texto).toContain("Mantenimiento preventivo pagado");
  });

  it("asigna el mejor enfoque inmediatamente al contratar el entrenador automático", () => {
    const base = { ...crearEstadoBase(), creado: true, cursos: ["dt"] as ReturnType<typeof crearEstadoBase>["cursos"] };
    const resultado = reductor(base, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
    expect(resultado.personal.some(p => p.tipo === "directorTecnico")).toBe(true);
    expect(resultado.plantel.every(p => p.enEspera || p.combo !== "acondicionamiento")).toBe(true);
  });

  it("asigna el enfoque y marca el alta al instante al sumar talento con entrenador", () => {
    const base = { ...crearEstadoBase(), creado: true, cursos: ["dt"] as ReturnType<typeof crearEstadoBase>["cursos"] };
    const conEntrenador = reductor(base, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
    const trasBusqueda = reductor(conEntrenador, { type: "SCOUT" });
    const nuevo = trasBusqueda.plantel.find(p => p.semanaIngreso === trasBusqueda.semana);

    expect(nuevo).toBeDefined();
    expect(nuevo?.rol).toBe("alumno");
    expect(nuevo?.combo).not.toBe("acondicionamiento");
  });

  it("caduca el distintivo de nuevo talento al avanzar la semana en el motor y sobrevive la sanitización", () => {
    let estado = { ...crearEstadoBase(), creado: true, semana: 3, dia: 1 };
    estado = reductor(estado, { type: "SCOUT" });
    const atleta = estado.plantel.find(p => p.semanaIngreso === estado.semana);
    expect(atleta).toBeDefined();
    expect(atleta?.semanaIngreso).toBe(3);
    expect(atleta?.semanaIngreso === estado.semana).toBe(true);

    // Sanitización y persistencia preservan semanaIngreso
    const guardado = JSON.parse(JSON.stringify(estado));
    const sanitizado = sanitizarEstado(guardado);
    const atletaSanitizado = sanitizado.plantel.find(p => p.id === atleta?.id);
    expect(atletaSanitizado?.semanaIngreso).toBe(3);

    // Avanzar el motor de juego día por día hasta el cierre dominical
    let enTranscurso = sanitizado;
    for (let d = 1; d <= 6; d++) {
      enTranscurso = reductor(enTranscurso, { type: "AVANZAR_DIA" });
    }
    expect(enTranscurso.dia).toBe(7);
    const enNuevaSemana = reductor(enTranscurso, { type: "CERRAR_DOMINGO" });
    expect(enNuevaSemana.semana).toBe(4);
    expect(enNuevaSemana.dia).toBe(1);

    // Regla de caducidad evaluada en el nuevo estado real del motor
    const atletaEnNuevaSemana = enNuevaSemana.plantel.find(p => p.id === atleta?.id);
    expect(atletaEnNuevaSemana?.semanaIngreso).toBe(3);
    expect(atletaEnNuevaSemana?.semanaIngreso === enNuevaSemana.semana).toBe(false);

    // Un nuevo talento reclutado en la semana 4 sí recibe la marca activa
    const conNuevoEnSem4 = reductor(enNuevaSemana, { type: "SCOUT" });
    const nuevoSem4 = conNuevoEnSem4.plantel.find(p => p.id !== atleta?.id && p.semanaIngreso === conNuevoEnSem4.semana);
    expect(nuevoSem4).toBeDefined();
    expect(nuevoSem4?.semanaIngreso === 4).toBe(true);
  });

  it("diferencia tener licencia DT de tener Director Técnico contratado para auto-enfoque", () => {
    // Caso A: Tiene la licencia en cursos, pero NO contrató el empleado directorTecnico
    const conLicenciaSinEmpleado = {
      ...crearEstadoBase(),
      creado: true,
      cursos: ["dt"] as ReturnType<typeof crearEstadoBase>["cursos"],
      personal: [],
    };
    const scoutSinEmpleado = reductor(conLicenciaSinEmpleado, { type: "SCOUT" });
    const nuevoSinEmpleado = scoutSinEmpleado.plantel.find(p => p.semanaIngreso === scoutSinEmpleado.semana);
    expect(nuevoSinEmpleado).toBeDefined();
    // Debe mantener combo manual por defecto "acondicionamiento"
    expect(nuevoSinEmpleado?.combo).toBe("acondicionamiento");

    // Caso B: Tiene el empleado directorTecnico contratado
    const conEmpleado = reductor(conLicenciaSinEmpleado, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
    expect(conEmpleado.personal.some(p => p.tipo === "directorTecnico")).toBe(true);
    const scoutConEmpleado = reductor(conEmpleado, { type: "SCOUT" });
    const nuevoConEmpleado = scoutConEmpleado.plantel.find(p => p.semanaIngreso === scoutConEmpleado.semana && p.id !== nuevoSinEmpleado?.id);
    expect(nuevoConEmpleado).toBeDefined();
    // El empleado sí automatiza el enfoque
    expect(nuevoConEmpleado?.combo).not.toBe("acondicionamiento");
  });

  it("valida invariantes de plantel en límites 0, 1, 4, 10 alumnos y lista de espera", () => {
    let estado: ReturnType<typeof crearEstadoBase> = { ...crearEstadoBase(), creado: true, plantel: [] };
    // Límite 0
    expect(alumnosActivos(estado)).toHaveLength(0);
    expect(alumnosEnEspera(estado)).toHaveLength(0);

    // Límite 1
    const p1 = genPugilista({ rol: "alumno" });
    estado = { ...estado, plantel: [p1] };
    expect(alumnosActivos(estado)).toHaveLength(1);
    expect(puedeHabilitar(p1, estado)).toBe(false);

    // Límite 4
    for (let i = 2; i <= 4; i++) {
      estado = { ...estado, plantel: [...estado.plantel, genPugilista({ rol: "alumno" })] };
    }
    expect(alumnosActivos(estado)).toHaveLength(4);

    // Límite 10 (capacidad máxima de alumnos nivel 1)
    const cupo = capacidadAlumnos(estado);
    expect(cupo).toBe(10);
    for (let i = 5; i <= cupo; i++) {
      estado = { ...estado, plantel: [...estado.plantel, genPugilista({ rol: "alumno" })] };
    }
    expect(alumnosActivos(estado)).toHaveLength(10);
    expect(alumnosEnEspera(estado)).toHaveLength(0);

    // Cupo lleno + atleta adicional pasa a lista de espera
    estado = reductor(estado, { type: "SCOUT" });
    expect(alumnosActivos(estado)).toHaveLength(10);
    expect(alumnosEnEspera(estado)).toHaveLength(1);

    // Lesión en atleta
    const atletaLesionado = { ...p1, lesion: { tipo: "mano" as const, semanas: 2, gravedad: "media" as const, tratamiento: 100 } };
    expect(atletaLesionado.lesion).toBeDefined();
    expect(atletaLesionado.lesion?.semanas).toBe(2);
  });

  it("calcula de forma pura la capacidad de grilla, columnas, filas y paginación determinística", () => {
    // Generar lista de 20 atletas mock
    const atletas20 = Array.from({ length: 20 }, (_, i) => ({ id: `ath-${i + 1}`, nombre: `Atleta ${i + 1}` }));
    const dimsAmplio = { anchoDisponible: 1080, altoDisponible: 450 };

    // --- Verificación rigurosa de conteos: 1, 4, 5, 6, 8, 10, 11, 20 en Desktop Amplio ---

    // 1 atleta: 1 fila, 1 columna (sin fila vacía reservada)
    const l1 = calcularCapacidadPlantel(dimsAmplio, 1);
    expect(l1.filas).toBe(1);
    expect(l1.columnas).toBe(1);
    expect(l1.totalPaginas).toBe(1);
    expect(l1.necesitaPaginacion).toBe(false);
    expect(l1.estiloGrilla.gridTemplateRows).toBe("repeat(1, minmax(0, 1fr))");
    expect(l1.obtenerAtletasVisibles(atletas20.slice(0, 1))).toHaveLength(1);

    // 4 atletas: 1 fila expandida de 4 columnas (ocupa todo el alto disponible, sin 2da fila vacía)
    const l4 = calcularCapacidadPlantel(dimsAmplio, 4);
    expect(l4.filas).toBe(1);
    expect(l4.columnas).toBe(4);
    expect(l4.totalPaginas).toBe(1);
    expect(l4.necesitaPaginacion).toBe(false);
    expect(l4.estiloGrilla.gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
    expect(l4.estiloGrilla.gridTemplateRows).toBe("repeat(1, minmax(0, 1fr))");
    expect(l4.obtenerAtletasVisibles(atletas20.slice(0, 4))).toHaveLength(4);

    // 5 atletas: 1 fila de 5 columnas (cabe completa en 1 fila)
    const l5 = calcularCapacidadPlantel(dimsAmplio, 5);
    expect(l5.filas).toBe(1);
    expect(l5.columnas).toBe(5);
    expect(l5.totalPaginas).toBe(1);
    expect(l5.necesitaPaginacion).toBe(false);
    expect(l5.estiloGrilla.gridTemplateRows).toBe("repeat(1, minmax(0, 1fr))");
    expect(l5.obtenerAtletasVisibles(atletas20.slice(0, 5))).toHaveLength(5);

    // 6 atletas: 2 filas equilibradas de 3 columnas (3 arriba, 3 abajo, cero celdas vacías)
    const l6 = calcularCapacidadPlantel(dimsAmplio, 6);
    expect(l6.filas).toBe(2);
    expect(l6.columnas).toBe(3);
    expect(l6.totalPaginas).toBe(1);
    expect(l6.necesitaPaginacion).toBe(false);
    expect(l6.estiloGrilla.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");
    expect(l6.estiloGrilla.gridTemplateRows).toBe("repeat(2, minmax(0, 1fr))");
    expect(l6.obtenerAtletasVisibles(atletas20.slice(0, 6))).toHaveLength(6);

    // 8 atletas: 2 filas equilibradas de 4 columnas (4 arriba, 4 abajo, cero celdas vacías)
    const l8 = calcularCapacidadPlantel(dimsAmplio, 8);
    expect(l8.filas).toBe(2);
    expect(l8.columnas).toBe(4);
    expect(l8.totalPaginas).toBe(1);
    expect(l8.necesitaPaginacion).toBe(false);
    expect(l8.estiloGrilla.gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
    expect(l8.estiloGrilla.gridTemplateRows).toBe("repeat(2, minmax(0, 1fr))");
    expect(l8.obtenerAtletasVisibles(atletas20.slice(0, 8))).toHaveLength(8);

    // 10 atletas: 2 filas equilibradas de 5 columnas (5 arriba, 5 abajo, cero celdas vacías)
    const l10 = calcularCapacidadPlantel(dimsAmplio, 10);
    expect(l10.columnas).toBe(5);
    expect(l10.filas).toBe(2);
    expect(l10.porPagina).toBe(10);
    expect(l10.totalPaginas).toBe(1);
    expect(l10.necesitaPaginacion).toBe(false);
    expect(l10.estiloGrilla.gridTemplateColumns).toBe("repeat(5, minmax(0, 1fr))");
    expect(l10.estiloGrilla.gridTemplateRows).toBe("repeat(2, minmax(0, 1fr))");
    expect(l10.obtenerAtletasVisibles(atletas20.slice(0, 10))).toHaveLength(10);

    // 11 atletas: requiere paginación (porPagina = 10, totalPaginas = 2)
    // Página 0: 10 atletas en 5x2
    const l11_p0 = calcularCapacidadPlantel(dimsAmplio, 11, 0);
    expect(l11_p0.filas).toBe(2);
    expect(l11_p0.columnas).toBe(5);
    expect(l11_p0.porPagina).toBe(10);
    expect(l11_p0.totalPaginas).toBe(2);
    expect(l11_p0.necesitaPaginacion).toBe(true);
    expect(l11_p0.obtenerAtletasVisibles(atletas20.slice(0, 11), 0)).toHaveLength(10);
    // Página 1: 1 atleta restante (1 col x 1 fila, sin 2da fila vacía)
    const l11_p1 = calcularCapacidadPlantel(dimsAmplio, 11, 1);
    expect(l11_p1.filas).toBe(1);
    expect(l11_p1.columnas).toBe(1);
    expect(l11_p1.estiloGrilla.gridTemplateRows).toBe("repeat(1, minmax(0, 1fr))");
    expect(l11_p1.obtenerAtletasVisibles(atletas20.slice(0, 11), 1)).toHaveLength(1);

    // 20 atletas: 2 páginas completas de 10 (5 cols x 2 filas cada una)
    const l20_p0 = calcularCapacidadPlantel(dimsAmplio, 20, 0);
    expect(l20_p0.filas).toBe(2);
    expect(l20_p0.columnas).toBe(5);
    expect(l20_p0.porPagina).toBe(10);
    expect(l20_p0.totalPaginas).toBe(2);
    expect(l20_p0.obtenerAtletasVisibles(atletas20, 0)).toHaveLength(10);
    const l20_p1 = calcularCapacidadPlantel(dimsAmplio, 20, 1);
    expect(l20_p1.filas).toBe(2);
    expect(l20_p1.columnas).toBe(5);
    expect(l20_p1.obtenerAtletasVisibles(atletas20, 1)).toHaveLength(10);

    // --- Desktop Estándar (1280x720): ancho ~920px (dock lateral restado), alto ~300px ---
    // 4 atletas en Desktop Estándar: 1 fila expandida de 4 cols
    const layoutEstandar4 = calcularCapacidadPlantel({ anchoDisponible: 920, altoDisponible: 300 }, 4);
    expect(layoutEstandar4.columnas).toBe(4);
    expect(layoutEstandar4.filas).toBe(1);
    expect(layoutEstandar4.totalPaginas).toBe(1);
    expect(layoutEstandar4.necesitaPaginacion).toBe(false);
    expect(layoutEstandar4.obtenerAtletasVisibles(atletas20.slice(0, 4))).toHaveLength(4);

    // 10 atletas en Desktop Estándar: porPagina = 8, 2 páginas (pág 0: 4x2=8, pág 1: 2x1=2)
    const layoutEstandar10 = calcularCapacidadPlantel({ anchoDisponible: 920, altoDisponible: 300 }, 10, 0);
    expect(layoutEstandar10.columnas).toBe(4);
    expect(layoutEstandar10.filas).toBe(2);
    expect(layoutEstandar10.porPagina).toBe(8);
    expect(layoutEstandar10.totalPaginas).toBe(2);
    expect(layoutEstandar10.necesitaPaginacion).toBe(true);
    expect(layoutEstandar10.obtenerAtletasVisibles(atletas20.slice(0, 10), 0)).toHaveLength(8);

    const layoutEstandar10_p1 = calcularCapacidadPlantel({ anchoDisponible: 920, altoDisponible: 300 }, 10, 1);
    expect(layoutEstandar10_p1.columnas).toBe(2);
    expect(layoutEstandar10_p1.filas).toBe(1); // 2 atletas en 1 fila, sin 2da fila vacía
    expect(layoutEstandar10_p1.obtenerAtletasVisibles(atletas20.slice(0, 10), 1)).toHaveLength(2);

    // --- Viewport Bajo (1024x600): ancho ~990px, alto neto ~150px ---
    // Alto de 150px solo permite 1 fila segura sin scroll; 4 columnas -> porPagina = 4
    const layoutBajo = calcularCapacidadPlantel({ anchoDisponible: 990, altoDisponible: 150 }, 10, 0);
    expect(layoutBajo.columnas).toBe(4);
    expect(layoutBajo.filas).toBe(1);
    expect(layoutBajo.porPagina).toBe(4);
    expect(layoutBajo.totalPaginas).toBe(3);
    expect(layoutBajo.necesitaPaginacion).toBe(true);
    expect(layoutBajo.obtenerAtletasVisibles(atletas20.slice(0, 10), 0)).toHaveLength(4);
    expect(layoutBajo.obtenerAtletasVisibles(atletas20.slice(0, 10), 1)).toHaveLength(4);
    expect(layoutBajo.obtenerAtletasVisibles(atletas20.slice(0, 10), 2)).toHaveLength(2);

    // --- Límite 0 atletas: siempre totalPaginas = 1, lista vacía, sin crash ---
    const layoutCero = calcularCapacidadPlantel({ anchoDisponible: 920, altoDisponible: 300 }, 0);
    expect(layoutCero.totalPaginas).toBe(1);
    expect(layoutCero.necesitaPaginacion).toBe(false);
    expect(layoutCero.obtenerAtletasVisibles([])).toHaveLength(0);
  });

  it("advierte sobre la nómina recurrente y exige confirmación antes de asumir déficit", () => {
    const base = { ...crearEstadoBase(), creado: true, cursos: ["dt"] as ReturnType<typeof crearEstadoBase>["cursos"] };
    const antes = reductor(base, { type: "CONTRATAR", tipo: "directorTecnico" });
    expect(antes.personal).toHaveLength(0);
    expect(antes.toasts[antes.toasts.length - 1]?.texto).toContain("déficit recurrente");
    const confirmado = reductor(base, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
    expect(confirmado.personal.some(p => p.tipo === "directorTecnico")).toBe(true);
    expect(proyeccionSemanalRecurrente(confirmado).total).toBeLessThan(0);
  });

  it("no presenta ayudas ni retornos temporales como flujo sostenible", () => {
    const base = crearEstadoBase();
    const recurrente = proyeccionSemanalRecurrente(base);
    const temporal = proyeccionSemanal({ ...base, creado: true, semana: 1,
      comunitarios: [{ tipo: "bingo", nombre: "Bingo de prueba" }],
      patrocinio: { nombre: "Sponsor de prueba", semanal: 900, semanas: 3 },
    });
    expect(recurrente.ingresos.some(l => l.concepto.includes("subsidio") || l.concepto.includes("Bingo") || l.concepto.includes("Sponsor"))).toBe(false);
    expect(temporal.total).toBeGreaterThan(recurrente.total);
  });

  it("cierra una carrera insolvente solo con confirmación y conserva únicamente récord e hitos", () => {
    const base = crearEstadoBase();
    const salonFama = [{ id: "leyenda-1", nombre: "Leyenda", club: "Club viejo", record: { v: 15, d: 2, e: 1, ko: 9 }, titulos: 3, semanaRetiro: 40, motivo: "Campeón" }];
    const insolvente = { ...base, creado: true, nombreJugador: "Coach", nombreGimnasio: "Club viejo", nombrePartida: "Guardado viejo", partidaId: "partida-fija",
      dinero: -1_500, fama: 88, seguidores: 99_000, legados: 4, plantel: [genPugilista({ rol: "boxeador" })], personal: [{ id: "empleado", tipo: "directorTecnico" as const, nombre: "Entrenador" }],
      cursos: ["dt"] as typeof base.cursos, equipamiento: ["soga"] as typeof base.equipamiento, propiedades: ["local"] as typeof base.propiedades,
      patrocinio: { nombre: "Marca", semanal: 100, semanas: 2 }, stats: { peleas: 20, victorias: 12, kos: 6, veladas: 3, dineroGanado: 5000, resultadoNeto: -2500, titulos: 4 }, salonFama };
    const sinConfirmar = reductor(insolvente, { type: "CERRAR_CLUB" });
    expect(sinConfirmar.partidaId).toBe("partida-fija");
    expect(sinConfirmar.dinero).toBe(-1_500);
    expect(sinConfirmar.toasts[sinConfirmar.toasts.length - 1]?.texto).toContain("confirmación");

    const reconstruido = reductor(insolvente, { type: "CERRAR_CLUB", confirmado: true });
    expect(reconstruido).toMatchObject({ creado: true, nombreJugador: "Coach", nombreGimnasio: "Club viejo II", dinero: 900, fama: 4, seguidores: 480, legados: 0, partidaId: "partida-fija" });
    expect(reconstruido.stats).toEqual({ ...base.stats, peleas: 20, victorias: 12, kos: 6, veladas: 3, titulos: 4 });
    expect(reconstruido.salonFama).toEqual(salonFama);
    expect(reconstruido.plantel).toHaveLength(base.plantel.length);
    expect(reconstruido.plantel.every(p => p.rol === "alumno")).toBe(true);
    expect(reconstruido.plantel.some(p => p.id === insolvente.plantel[0].id)).toBe(false);
    expect(reconstruido).toMatchObject({ personal: [], cursos: [], equipamiento: [], propiedades: [], patrocinio: null, prestamo: null, eventos: [], comunitarios: [] });
    expect(reconstruido.stats.dineroGanado).toBe(0);
    expect(reconstruido.stats.resultadoNeto).toBe(0);
  });

  it("no permite cerrar antes del umbral severo de insolvencia", () => {
    const base = { ...crearEstadoBase(), creado: true, dinero: -1_499 };
    const resultado = reductor(base, { type: "CERRAR_CLUB", confirmado: true });
    expect(resultado.dinero).toBe(-1_499);
    expect(resultado.toasts[resultado.toasts.length - 1]?.texto).toContain("$1.500");
  });

  it("ofrece el pase profesional al pugil con 50 peleas amateur sin cambiarle el circuito automáticamente", () => {
    const base = crearEstadoBase();
    const pros = Array.from({ length: capacidadProfesionales(base) }, () => ({ ...genPugilista({ rol: "boxeador" }), circuito: "pro" as const }));
    const amateur = { ...genPugilista({ rol: "boxeador" }), circuito: "amateur" as const, peleasAmateur: 50 };
    let siguiente = { ...base, creado: true, plantel: [...pros, amateur], fama: 32, recreativos: 0 };
    for (let i = 0; i < 6; i++) siguiente = reductor(siguiente, { type: "AVANZAR_DIA" });
    siguiente = reductor(siguiente, { type: "CERRAR_DOMINGO" });
    expect(siguiente.plantel.filter(p => p.circuito === "pro")).toHaveLength(10);
    expect(siguiente.plantel.find(p => p.id === amateur.id)?.circuito).toBe("amateur");
    expect(puedeProfesionalizar(amateur, siguiente)).toEqual({ ok: false, motivo: "cupo" });

    const conCupo = { ...siguiente, plantel: siguiente.plantel.filter(p => p.id !== pros[0].id) };
    expect(puedeProfesionalizar(amateur, conCupo)).toEqual({ ok: true });
    const promovido = reductor(conCupo, { type: "PROMOVER_PRO", id: amateur.id });
    const profesional = promovido.plantel.find(p => p.id === amateur.id)!;
    expect(profesional.circuito).toBe("pro");
    expect(profesional.peleasAmateur).toBe(50);
    expect(profesional.record).toEqual(amateur.record);
    expect(promovido.toasts[promovido.toasts.length - 1]?.texto).toContain("récord e historial amateur se conservan");
    const duplicado = reductor(promovido, { type: "PROMOVER_PRO", id: amateur.id });
    expect(duplicado.plantel.find(p => p.id === amateur.id)?.circuito).toBe("pro");
    expect(duplicado.plantel.filter(p => p.circuito === "pro")).toHaveLength(10);
    expect(siguiente.recreativos).toBeGreaterThanOrEqual(1);

    const conCartelera = { ...conCupo, pendientes: [{ id: "pase-bloqueado", miId: amateur.id, rival: pros[0], bolsa: 200, esTitulo: 0 as const, velada: false }] };
    expect(puedeProfesionalizar(amateur, conCartelera)).toEqual({ ok: false, motivo: "cartelera" });
    const bloqueadoPorPelea = reductor(conCartelera, { type: "PROMOVER_PRO", id: amateur.id });
    expect(bloqueadoPorPelea.plantel.find(p => p.id === amateur.id)?.circuito).toBe("amateur");
  });

  it("recorre licencia, rival compatible, combate y actualización única del récord amateur", () => {
    const restaurar = usarSemilla(14014);
    try {
      const base = crearEstadoBase();
      const alumno = { ...base.plantel.find(p => p.rol === "alumno")!, fogueo: 10, fogueoMeta: 10, guanteosRealizados: 10, energia: 100 };
      let estado = { ...base, creado: true, semana: 4, dia: 1, dinero: 1_000, cursos: ["dt"] as typeof base.cursos, plantel: [alumno] };
      estado = reductor(estado, { type: "LICENCIAR", id: alumno.id });
      const federado = estado.plantel[0];
      expect(federado).toMatchObject({ rol: "boxeador", circuito: "amateur", licenciaFederativa: true });
      expect(estado.dinero).toBe(800);

      estado = reductor(estado, { type: "BUSCAR_RIVAL", id: federado.id });
      expect(estado.ofertas).toHaveLength(3);
      expect(estado.ofertas.every(of => of.rival.circuito === "amateur" && of.rival.peleasAmateur <= 3)).toBe(true);
      estado = reductor(estado, { type: "ELEGIR_OFERTA", ofertaId: estado.ofertas[1].id });
      expect(estado.pendientes).toHaveLength(1);
      const pelea = estado.pendientes[0];
      while (estado.dia < 6) estado = reductor(estado, { type: "AVANZAR_DIA" });
      const resultado = simularPeleaEntera(crearEstadoPelea(pelea, estado.plantel[0], []), "equilibrado");
      estado = reductor(estado, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado });

      const boxeador = estado.plantel[0];
      expect(estado.pendientes).toHaveLength(0);
      expect(estado.stats.peleas).toBe(1);
      expect(estado.historial[0]?.miId).toBe(federado.id);
      expect(boxeador.peleasAmateur).toBe(1);
      expect(boxeador.peleasProfesionales).toBe(0);
      expect(boxeador.record.v + boxeador.record.d + boxeador.record.e).toBe(1);
      expect(boxeador.ultimaPeleaSemana).toBe(4);
      expect(boxeador.proximaPeleaSemana).toBe(6);
      expect(estado.libroIngresos.some(linea => linea.concepto.startsWith("Bolsa vs "))).toBe(true);

      const duplicado = reductor(estado, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado });
      expect(duplicado.stats.peleas).toBe(1);
      expect(duplicado.plantel[0].record).toEqual(boxeador.record);
      const buscarDuranteCooldown = reductor(estado, { type: "BUSCAR_RIVAL", id: federado.id });
      expect(buscarDuranteCooldown.ofertas).toHaveLength(0);
      expect(buscarDuranteCooldown.toasts[buscarDuranteCooldown.toasts.length - 1]?.texto).toContain("semana 6");
    } finally {
      restaurar();
    }
  });

  it("sostiene 50 combates amateur en dos temporadas y deja el pase profesional a elección", () => {
    const restaurar = usarSemilla(14050);
    try {
      const base = crearEstadoBase();
      const pugil = {
        ...genPugilista({ rol: "boxeador" }), circuito: "amateur" as const,
        licenciaFederativa: true, energia: 100, lesion: null,
        peleasAmateur: 0, peleasProfesionales: 0,
        record: { v: 0, d: 0, e: 0, ko: 0 },
      };
      let estado: ReturnType<typeof crearEstadoBase> = { ...base, creado: true, semana: 1, dia: 1, dinero: 10_000, plantel: [pugil] };
      for (let numero = 0; numero < 50; numero++) {
        estado = reductor(estado, { type: "BUSCAR_RIVAL", id: pugil.id });
        expect(estado.ofertas).toHaveLength(3);
        estado = reductor(estado, { type: "ELEGIR_OFERTA", ofertaId: estado.ofertas[0].id });
        expect(estado.pendientes).toHaveLength(1);
        while (estado.dia < 6) estado = reductor(estado, { type: "AVANZAR_DIA" });
        const pelea = estado.pendientes[0];
        const boxeadorActual = estado.plantel.find(p => p.id === pugil.id)!;
        const resultado = simularPeleaEntera(crearEstadoPelea(pelea, boxeadorActual, []), "equilibrado");
        estado = reductor(estado, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado });
        expect(estado.plantel[0].circuito).toBe("amateur");
        estado = reductor(estado, { type: "AVANZAR_DIA" });
        estado = reductor(estado, { type: "CERRAR_DOMINGO" });
        if (numero < 49) {
          while (estado.dia < 7) estado = reductor(estado, { type: "AVANZAR_DIA" });
          estado = reductor(estado, { type: "CERRAR_DOMINGO" });
        }
      }
      const final = estado.plantel.find(p => p.id === pugil.id)!;
      expect(final.peleasAmateur).toBe(50);
      expect(totalPeleas(final)).toBe(50);
      expect(estado.stats.peleas).toBe(50);
      expect(estado.historial).toHaveLength(12); // UI feed stays intentionally recent; career totals remain persistent.
      expect(puedeProfesionalizar(final, estado)).toEqual({ ok: true });
      expect(final.circuito).toBe("amateur"); // Reaching 50 never opts in on behalf of the player.
    } finally {
      restaurar();
    }
  });

  it("sostiene una partida durante 120 semanas sin saturar ni romper el calendario", () => {
    let estado = { ...crearEstadoBase(), creado: true };
    for (let semana = 0; semana < 120; semana++) {
      const saldoInicialSemana = estado.dinero;
      for (let dia = 0; dia < 6; dia++) estado = reductor(estado, { type: "AVANZAR_DIA" });
      expect(estado.dia).toBe(7);
      expect(estado.resumen?.total).toBe(estado.dinero - saldoInicialSemana);
      estado = reductor(estado, { type: "CERRAR_DOMINGO" });
      expect(estado.semana).toBe(semana + 2);
      expect(estado.plantel.length).toBeLessThanOrEqual(30);
      expect(estado.dia).toBe(1);
      expect(estado.libroIngresos).toHaveLength(0);
      expect(estado.libroGastos).toHaveLength(0);
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

  it("cierra una semana sin errores con plantel vacío y conserva el ciclo del calendario", () => {
    let estado: ReturnType<typeof crearEstadoBase> = { ...crearEstadoBase(), creado: true, plantel: [] };
    for (let i = 0; i < 6; i++) estado = reductor(estado, { type: "AVANZAR_DIA" });
    expect(estado.dia).toBe(7);
    expect(estado.resumen).not.toBeNull();
    estado = reductor(estado, { type: "CERRAR_DOMINGO" });
    expect(estado.dia).toBe(1);
    expect(estado.semana).toBe(2);
    expect(estado.plantel).toHaveLength(0);
  });

  it("no simula sparring con un solo pugilista disponible y explica por qué", () => {
    const base = crearEstadoBase();
    const activo = { ...genPugilista({ rol: "alumno" }), fogueo: 3, energia: 80, enEspera: false };
    const espera = { ...genPugilista({ rol: "alumno" }), fogueo: 2, energia: 80, enEspera: true };
    const estado = { ...base, creado: true, dia: 5, ultimaSemanaEntrenada: 1, plantel: [activo, espera] };
    const sabado = reductor(estado, { type: "AVANZAR_DIA" });

    expect(sabado.dia).toBe(6);
    expect(sabado.plantel.find(p => p.id === activo.id)?.fogueo).toBe(3);
    expect(sabado.plantel.find(p => p.id === activo.id)?.energia).toBe(80);
    expect(sabado.toasts[sabado.toasts.length - 1]?.texto).toContain("al menos dos pugilistas disponibles");
  });

  it("respeta los cupos 10/10/10 al tramitar licencias y permite licenciar tras liberar una plaza amateur", () => {
    const base = crearEstadoBase();
    const alumnos = Array.from({ length: capacidadAlumnos(base) }, () => ({ ...genPugilista({ rol: "alumno" }), fogueo: 10, fogueoMeta: 10, guanteosRealizados: 10 }));
    const amateurs = Array.from({ length: 10 }, () => ({ ...genPugilista({ rol: "boxeador" }), circuito: "amateur" as const }));
    const pros = Array.from({ length: capacidadProfesionales(base) }, () => ({ ...genPugilista({ rol: "boxeador" }), circuito: "pro" as const }));
    const lleno = normalizarListaEspera({ ...base, creado: true, dinero: 10_000, cursos: ["dt"], plantel: [...alumnos, ...amateurs, ...pros] });
    expect(lleno.plantel).toHaveLength(capacidadPlantel(lleno));
    expect(alumnosActivos(lleno)).toHaveLength(10);

    const bloqueado = reductor(lleno, { type: "LICENCIAR", id: alumnosActivos(lleno)[0].id });
    expect(bloqueado.dinero).toBe(lleno.dinero);
    expect(bloqueado.plantel.find(p => p.id === alumnosActivos(lleno)[0].id)?.rol).toBe("alumno");
    expect(bloqueado.toasts[bloqueado.toasts.length - 1]?.texto).toContain("cupo amateur está completo");

    const trasTransferencia = reductor(lleno, { type: "RETIRAR_ATLETA", id: amateurs[0].id });
    const licenciado = reductor(trasTransferencia, { type: "LICENCIAR", id: alumnosActivos(trasTransferencia)[0].id });
    expect(licenciado.plantel.filter(p => p.rol === "boxeador" && p.circuito === "amateur")).toHaveLength(10);
    expect(licenciado.plantel.filter(p => p.rol === "boxeador" && p.circuito === "pro")).toHaveLength(10);
    expect(licenciado.dinero).toBe(9_800);
    expect(licenciado.plantel).toHaveLength(capacidadPlantel(licenciado) - 1);
  });

  it("solo marca como habilitable a un alumno activo con licencia y prácticas", () => {
    const base = crearEstadoBase();
    const alumno = { ...base.plantel.find(p => p.rol === "alumno")! };
    alumno.fogueo = alumno.fogueoMeta; alumno.guanteosRealizados = 10;
    expect(puedeHabilitar(alumno, base)).toBe(false);
    const conLicencia = { ...base, cursos: ["dt"] as typeof base.cursos };
    expect(puedeHabilitar(alumno, conLicencia)).toBe(true);
    expect(puedeHabilitar({ ...alumno, enEspera: true }, conLicencia)).toBe(false);
  });

  it("separa la licencia del entrenador de la licencia individual del pugilista", () => {
    const base = crearEstadoBase();
    const alumno = { ...base.plantel.find(p => p.rol === "alumno")!, fogueo: 10, fogueoMeta: 10, guanteosRealizados: 10 };
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

  it("bloquea compras urbanas si faltan sus requisitos sin cobrar dinero", () => {
    const base = { ...crearEstadoBase(), creado: true, dinero: 100_000 };
    const casos = [
      { id: "terreno" as const, toast: "Gestión de Clubes" },
      { id: "sucursal" as const, toast: "comprá un terreno" },
      { id: "arena" as const, toast: "Televisión Estelar" },
    ];

    for (const caso of casos) {
      const resultado = reductor(base, { type: "COMPRAR_PROPIEDAD", id: caso.id });
      expect(resultado.dinero).toBe(base.dinero);
      expect(resultado.propiedades).toEqual(base.propiedades);
      expect(resultado.toasts[resultado.toasts.length - 1]?.texto).toContain(caso.toast);
    }
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
    ]));
    expect(proyeccion.ingresos.map(l => l.concepto)).not.toContain("Dividendos estimados: Bingo");
    expect(proyeccion.estimados).toEqual([{ concepto: "Dividendos estimados: Bingo", min: 250, max: 420, mean: 335 }]);
    expect(proyeccion.gastos.map(l => l.concepto)).toContain("Costo financiero por caja negativa");
  });

  it("concilia movimientos manuales y liquidación dominical tras guardar a mitad de semana", () => {
    let estado: ReturnType<typeof crearEstadoBase> = {
      ...crearEstadoBase(), creado: true, semana: 2, dia: 1, dinero: 2_000,
      plantel: [],
    };
    const saldoInicial = estado.dinero;
    estado = reductor(estado, { type: "COMPRAR_EQUIPO", id: "vendasGel" });
    estado = reductor(estado, { type: "PROGRAMAR_SOCIAL", actividad: "bingo" });
    expect(estado.libroGastos.map(l => l.concepto)).toEqual(expect.arrayContaining([
      "Compra · Vendas de Gel", "Inversión · Gran Bingo Familiar del Club",
    ]));

    // Una recarga conserva exactamente el libro activo y no duplica las líneas.
    estado = sanitizarEstado(JSON.parse(JSON.stringify(estado)));
    expect(estado.libroGastos).toHaveLength(2);
    while (estado.dia < 7) estado = reductor(estado, { type: "AVANZAR_DIA" });

    expect(estado.resumen).not.toBeNull();
    expect(estado.resumen!.ingresos.some(l => l.concepto === "Dividendos: Gran Bingo Familiar del Club")).toBe(true);
    expect(estado.resumen!.gastos.filter(l => l.concepto === "Compra · Vendas de Gel")).toHaveLength(1);
    expect(estado.resumen!.gastos.filter(l => l.concepto === "Inversión · Gran Bingo Familiar del Club")).toHaveLength(1);
    expect(estado.resumen!.total).toBe(estado.resumen!.ingresos.reduce((n, l) => n + l.monto, 0) - estado.resumen!.gastos.reduce((n, l) => n + l.monto, 0));
    expect(estado.resumen!.total).toBe(estado.dinero - saldoInicial);

    estado = reductor(estado, { type: "CERRAR_DOMINGO" });
    expect(estado.semana).toBe(3);
    expect(estado.semanaLibro).toBe(3);
    expect(estado.libroIngresos).toHaveLength(0);
    expect(estado.libroGastos).toHaveLength(0);
  });

  it("incluye una bolsa y la velada del sábado una sola vez en el balance semanal", () => {
    const base = crearEstadoBase();
    const boxeador = { ...genPugilista({ rol: "boxeador" }), licenciaFederativa: true, circuito: "amateur" as const };
    const rival = { ...genPugilista({ rol: "boxeador", genero: boxeador.genero }), division: boxeador.division, circuito: boxeador.circuito };
    const pelea = { id: "pelea-semanal", miId: boxeador.id, rival, bolsa: 500, esTitulo: 0 as const, velada: true, semanaProgramada: 2, diaProgramado: 6 as const };
    let estado: ReturnType<typeof crearEstadoBase> = {
      ...base, creado: true, semana: 2, dia: 5, dinero: 1_000,
      plantel: [boxeador], pendientes: [pelea], veladaProgramada: true,
    };
    const saldoInicial = estado.dinero;
    estado = reductor(estado, { type: "AVANZAR_DIA" });
    const resultado = simularPeleaEntera(crearEstadoPelea(pelea, estado.plantel[0], []), "equilibrado");
    estado = reductor(estado, { type: "RESOLVER_PELEA", peleaId: pelea.id, resultado });
    estado = reductor(estado, { type: "AVANZAR_DIA" });

    const ingresos = estado.resumen!.ingresos;
    expect(ingresos.some(l => l.concepto === "Entradas de la velada del sábado")).toBe(true);
    expect(ingresos.some(l => l.concepto.startsWith("Bolsa vs "))).toBe(true);
    expect(ingresos.filter(l => l.concepto === "Entradas de la velada del sábado")).toHaveLength(1);
    expect(ingresos.filter(l => l.concepto.startsWith("Bolsa vs "))).toHaveLength(1);
    expect(estado.resumen!.total).toBe(estado.dinero - saldoInicial);
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

  it("hace que los seguidores converjan gradualmente y limita las variaciones semanales", () => {
    let estado = { ...crearEstadoBase(), creado: true, fama: 40, seguidores: 10_000 };
    for (let i = 0; i < 6; i++) estado = reductor(estado, { type: "AVANZAR_DIA" });
    estado = reductor(estado, { type: "CERRAR_DOMINGO" });
    expect(estado.seguidores).toBe(9_940);

    let comunidadEnCrecimiento = { ...crearEstadoBase(), creado: true, fama: 100, seguidores: 440 };
    for (let i = 0; i < 6; i++) comunidadEnCrecimiento = reductor(comunidadEnCrecimiento, { type: "AVANZAR_DIA" });
    comunidadEnCrecimiento = reductor(comunidadEnCrecimiento, { type: "CERRAR_DOMINGO" });
    expect(comunidadEnCrecimiento.seguidores).toBe(530);
  });

  it("ofrece un préstamo único y descuenta cuotas en cada balance", () => {
    let estado = { ...crearEstadoBase(), creado: true, dinero: -143 };
    let saldoInicialSemana = estado.dinero;
    estado = reductor(estado, { type: "PEDIR_PRESTAMO" });
    expect(estado.dinero).toBe(357);
    expect(estado.prestamo?.saldo).toBe(600);
    expect(estado.libroIngresos.filter(l => l.concepto === "Desembolso del préstamo").reduce((n, l) => n + l.monto, 0)).toBe(500);
    let totalDevuelto = 0;
    for (let semana = 0; semana < 10; semana++) {
      for (let i = 0; i < 6; i++) estado = reductor(estado, { type: "AVANZAR_DIA" });
      expect(estado.resumen?.total).toBe(estado.dinero - saldoInicialSemana);
      const cuota = estado.resumen?.gastos.filter(l => l.concepto.includes("Cuota del préstamo")).reduce((n, l) => n + l.monto, 0) ?? 0;
      totalDevuelto += cuota;
      expect(cuota).toBe(60);
      if (semana === 0) expect(estado.stats.dineroGanado).toBe(294); // Cuotas y subsidio; el préstamo no es ingreso ganado.
      estado = reductor(estado, { type: "CERRAR_DOMINGO" });
      saldoInicialSemana = estado.dinero;
    }
    expect(totalDevuelto).toBe(600);
    expect(estado.prestamo).toBeNull();
  });

  it("protege el préstamo de emergencia también en el motor de reglas", () => {
    const saldoHolgado = { ...crearEstadoBase(), creado: true, dinero: 300 };
    const intento = reductor(saldoHolgado, { type: "PEDIR_PRESTAMO" });
    expect(intento.dinero).toBe(300);
    expect(intento.prestamo).toBeNull();
    expect(intento.toasts[intento.toasts.length - 1]?.texto).toContain("solo está disponible");
  });

  it("limita el costo semanal de caja negativa y conserva un costo mínimo", () => {
    const leve = proyeccionSemanal({ ...crearEstadoBase(), dinero: -100 });
    const severa = proyeccionSemanal({ ...crearEstadoBase(), dinero: -100_000 });
    expect(leve.gastos.find(l => l.concepto === "Costo financiero por caja negativa")?.monto).toBe(10);
    expect(severa.gastos.find(l => l.concepto === "Costo financiero por caja negativa")?.monto).toBe(50);
    let cierre = { ...crearEstadoBase(), creado: true, dinero: -100_000, plantel: [] as ReturnType<typeof crearEstadoBase>["plantel"] };
    for (let dia = 0; dia < 6; dia++) cierre = reductor(cierre, { type: "AVANZAR_DIA" });
    expect(cierre.resumen?.gastos.find(l => l.concepto === "Costo financiero por caja negativa")?.monto).toBe(50);
  });

  it("permite salir de una insolvencia leve con austeridad, préstamo limitado y recaudación", () => {
    const restaurar = usarSemilla(280923);
    try {
      let estado = { ...crearEstadoBase(), creado: true, dinero: -143 };
      estado = reductor(estado, { type: "PEDIR_PRESTAMO" });
      for (let semana = 0; semana < 12; semana++) {
        if (estado.dinero >= COMUNITARIOS.bingo.inversion && estado.dia < 6) {
          estado = reductor(estado, { type: "PROGRAMAR_SOCIAL", actividad: "bingo" });
        }
        for (let dia = 0; dia < 6; dia++) estado = reductor(estado, { type: "AVANZAR_DIA" });
        estado = reductor(estado, { type: "CERRAR_DOMINGO" });
      }
      expect(estado.prestamo).toBeNull();
      expect(estado.dinero).toBeGreaterThanOrEqual(0);
    } finally { restaurar(); }
  });

  it("concilia retorno, inversión y saldo al liquidar cada actividad social", () => {
    const actividades = ["bingo", "naipes", "festival", "claseAbierta"] as const;
    for (let i = 0; i < actividades.length; i++) {
      const actividad = actividades[i];
      let estado = { ...crearEstadoBase(), creado: true, semana: 2, dinero: 1_000, plantel: [] as ReturnType<typeof crearEstadoBase>["plantel"] };
      const saldoInicial = estado.dinero;
      estado = reductor(estado, { type: "PROGRAMAR_SOCIAL", actividad });
      expect(estado.dinero).toBe(saldoInicial - COMUNITARIOS[actividad].inversion);
      for (let dia = 0; dia < 6; dia++) estado = reductor(estado, { type: "AVANZAR_DIA" });
      const resumen = estado.resumen!;
      const retorno = resumen.ingresos.find(l => l.concepto === `Dividendos: ${COMUNITARIOS[actividad].nombre}`)?.monto;
      const inversion = resumen.gastos.find(l => l.concepto === `Inversión · ${COMUNITARIOS[actividad].nombre}`)?.monto;
      expect(retorno).toBeGreaterThanOrEqual(COMUNITARIOS[actividad].min);
      expect(retorno).toBeLessThanOrEqual(COMUNITARIOS[actividad].max);
      expect(inversion).toBe(COMUNITARIOS[actividad].inversion);
      expect(resumen.total).toBe(estado.dinero - saldoInicial);
    }
  });

  it("la clase abierta aplica su efecto temporal de alumno recreativo y respeta el tope", () => {
    const base = { ...crearEstadoBase(), creado: true, dinero: 500, recreativos: 0 };
    let agendada = reductor(base, { type: "PROGRAMAR_SOCIAL", actividad: "claseAbierta" });
    expect(agendada.recreativos).toBe(1);
    expect(agendada.toasts[agendada.toasts.length - 1]?.texto).toContain("1 alumno recreativo esta semana");
    for (let dia = 0; dia < 6; dia++) agendada = reductor(agendada, { type: "AVANZAR_DIA" });
    expect(agendada.resumen?.ingresos.some(l => l.concepto === "Cuotas recreativas (1 × $10)")).toBe(true);
    expect(agendada.recreativos).toBe(0); // La plaza adicional es temporal, no una renta perpetua.

    const llena = reductor({ ...base, recreativos: 12 }, { type: "PROGRAMAR_SOCIAL", actividad: "claseAbierta" });
    expect(llena.recreativos).toBe(12);
  });

  it("calibra escenarios semilla de caja para semanas 1–12 y 13–52", () => {
    const resultados: Record<string, { fin12: number; min12: number; fin52: number; min52: number }> = {};
    const ejecutar = (nombre: string, actividadSemanal: "bingo" | "naipes" | null, plantillaCompleta = false, nominaTemprana = false, soloEntrenador = false) => {
      const restaurar = usarSemilla(260923);
      try {
        let estado = { ...crearEstadoBase(), creado: true, dinero: 900 };
        if (plantillaCompleta) {
          estado = { ...estado, fama: 40, plantel: Array.from({ length: 10 }, () => genPugilista({ rol: "alumno" })) };
        }
        if (nominaTemprana || soloEntrenador) estado = reductor(estado, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
        let min12 = estado.dinero;
        let min52 = estado.dinero;
        let fin12 = estado.dinero;
        for (let semana = 1; semana <= 52; semana++) {
          if (nominaTemprana && semana === 2) {
            estado = reductor(estado, { type: "CONTRATAR", tipo: "asistente", confirmado: true });
            estado = reductor(estado, { type: "CONTRATAR", tipo: "preparador", confirmado: true });
          }
          if (actividadSemanal && estado.dia === 1 && estado.dinero >= COMUNITARIOS[actividadSemanal].inversion) {
            estado = reductor(estado, { type: "PROGRAMAR_SOCIAL", actividad: actividadSemanal });
            min52 = Math.min(min52, estado.dinero);
            if (semana <= 12) min12 = Math.min(min12, estado.dinero);
          }
          for (let dia = 0; dia < 6; dia++) {
            estado = reductor(estado, { type: "AVANZAR_DIA" });
            min52 = Math.min(min52, estado.dinero);
            if (semana <= 12) min12 = Math.min(min12, estado.dinero);
          }
          if (semana <= 12) min12 = Math.min(min12, estado.dinero);
          if (semana === 12) fin12 = estado.dinero;
          estado = reductor(estado, { type: "CERRAR_DOMINGO" });
        }
        resultados[nombre] = { fin12, min12, fin52: estado.dinero, min52 };
      } finally { restaurar(); }
    };
    ejecutar("base", null);
    ejecutar("recaudacion", "naipes");
    ejecutar("plantel_lleno_recaudacion", "naipes", true);
    ejecutar("nomina_temprana", null, false, true);
    ejecutar("entrenador_recaudacion", "naipes", false, false, true);
    ejecutar("entrenador_bingo", "bingo", false, false, true);
    expect(Object.keys(resultados)).toHaveLength(6);
    // R2 baseline explicitly approved: same exact assertions, no economic parameter changes.
    expect(resultados.base).toEqual({ fin12: 546, min12: 546, fin52: 1_584, min52: 534 });
    expect(resultados.recaudacion).toEqual({ fin12: 1_703, min12: 800, fin52: 5_971, min52: 800 });
    expect(resultados.plantel_lleno_recaudacion).toEqual({ fin12: 3_268, min12: 800, fin52: 10_170, min52: 800 });
    expect(resultados.nomina_temprana).toEqual({ fin12: -1_979, min12: -1_979, fin52: -10_299, min52: -10_299 });
    expect(resultados.entrenador_recaudacion).toEqual({ fin12: -180, min12: -180, fin52: -6_076, min52: -6_076 });
    expect(resultados.entrenador_bingo).toEqual({ fin12: 1_288, min12: 587, fin52: 3_156, min52: 587 });
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

  it("conserva el legado de un campeón transferido y no lo duplica en el Salón de la Fama", () => {
    const base = crearEstadoBase();
    const campeon = {
      ...genPugilista({ rol: "boxeador" }), circuito: "pro" as const, titulo: 3 as const,
      record: { v: 18, d: 3, e: 1, ko: 11 }, peleasProfesionales: 22,
    };
    const estado = { ...base, creado: true, plantel: [campeon], salonFama: [] };
    const transferido = reductor(estado, { type: "RETIRAR_ATLETA", id: campeon.id });
    expect(transferido.plantel.some(p => p.id === campeon.id)).toBe(false);
    expect(transferido.salonFama).toHaveLength(1);
    expect(transferido.salonFama[0]).toMatchObject({ id: campeon.id, record: campeon.record, titulos: 3 });
    const repetido = reductor(transferido, { type: "RETIRAR_ATLETA", id: campeon.id });
    expect(repetido.salonFama).toHaveLength(1);
  });

  it("separa las metas amateur/profesionales y arma un ranking con clubes rivales", () => {
    const base = crearEstadoBase();
    expect(base.rivales.length).toBe(20);
    const pro = { ...base.plantel[0], rol: "boxeador" as const, circuito: "pro" as const, peleasAmateur: 50, peleasProfesionales: 10, victoriasProfesionales: 7, derrotasProfesionales: 2, empatesProfesionales: 1, kosProfesionales: 4, record: { v: 7, d: 2, e: 1, ko: 4 } };
    expect(tituloAspirable(pro)).toBe(1);
    expect(rankingMundial({ ...base, plantel: [pro] }).some(item => item.pugilista.id === pro.id)).toBe(true);
  });

  it("empareja rivales dentro de ±3 peleas del circuito vigente, no del récord histórico", () => {
    const base = crearEstadoBase();
    const amateur = {
      ...base.plantel[0], circuito: "amateur" as const, peleasAmateur: 0,
      peleasProfesionales: 0, record: { v: 0, d: 0, e: 0, ko: 0 },
    };
    const debutantes = generarOfertas(amateur);
    for (const oferta of debutantes) {
      expect(oferta.rival.peleasAmateur).toBeGreaterThanOrEqual(0);
      expect(oferta.rival.peleasAmateur).toBeLessThanOrEqual(3);
    }

    // El récord general incluye la etapa amateur, pero el primer rival pro
    // debe medirse contra cero peleas profesionales, no contra esas 45.
    const debutPro = {
      ...amateur, circuito: "pro" as const, peleasAmateur: 45,
      peleasProfesionales: 0, record: { v: 30, d: 12, e: 3, ko: 8 },
    };
    const ofertasDebutPro = generarOfertas(debutPro);
    for (const oferta of ofertasDebutPro) {
      expect(oferta.rival.peleasProfesionales).toBeGreaterThanOrEqual(0);
      expect(oferta.rival.peleasProfesionales).toBeLessThanOrEqual(3);
    }

    const proConTrayectoria = {
      ...debutPro, peleasProfesionales: 8,
      record: { v: 36, d: 14, e: 3, ko: 10 },
    };
    const ofertasPro = generarOfertas(proConTrayectoria);
    for (const oferta of ofertasPro) {
      expect(Math.abs(oferta.rival.peleasProfesionales - 8)).toBeLessThanOrEqual(3);
    }

    const proElegibleParaTitulo = {
      ...proConTrayectoria, peleasProfesionales: 25,
      victoriasProfesionales: 18, derrotasProfesionales: 7, kosProfesionales: 8,
    };
    const ofertasTitulo = generarOfertas(proElegibleParaTitulo);
    const titulo = ofertasTitulo.find(oferta => oferta.esTitulo > 0);
    expect(titulo).toBeDefined();
    expect(Math.abs(titulo!.rival.peleasProfesionales - 25)).toBeLessThanOrEqual(3);
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
    const anterior = { ...crearEstadoBase(), creado: true, schemaVersion: 1, partidaId: "", nombreGimnasio: "Club Viejo", libroIngresos: [{ concepto: "Libro ambiguo", monto: 50 }] };
    const resultado = migrarGuardado(anterior);
    const estado = resultado.estado as typeof anterior & { schemaVersion: number; partidaId: string };
    expect(resultado.migrado).toBe(true);
    expect(estado.schemaVersion).toBe(SCHEMA_ACTUAL);
    expect(estado.nombreGimnasio).toBe("Club Viejo");
    expect(estado.partidaId).toMatch(/^migrada-/);
    expect((estado as typeof estado & { libroIngresos: unknown[]; semanaLibro: number }).libroIngresos).toEqual([]);
    expect((estado as typeof estado & { semanaLibro: number }).semanaLibro).toBe(0);
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

  it("completa un playtest prolongado con invariantes de economía y plantel", () => {
    const restaurar = usarSemilla(90210);
    let estado = { ...crearEstadoBase(), creado: true, dinero: 2_000, fama: 8 };
    for (let semana = 0; semana < 52; semana++) {
      if (semana === 0) estado = reductor(estado, { type: "COMPRAR_EQUIPO", id: "soga" });
      if (semana === 1 && !estado.personal.some(p => p.tipo === "directorTecnico")) {
        estado = reductor(estado, { type: "CONTRATAR", tipo: "directorTecnico", confirmado: true });
      }
      for (let dia = 0; dia < 6; dia++) estado = reductor(estado, { type: "AVANZAR_DIA" });
      estado = reductor(estado, { type: "AVANZAR_DIA" });
      estado = reductor(estado, { type: "CERRAR_DOMINGO" });
      expect(estado.dia).toBe(1);
      expect(estado.semana).toBe(semana + 2);
      expect(estado.plantel.length).toBeLessThanOrEqual(30);
      expect(Number.isFinite(estado.dinero)).toBe(true);
      expect(Number.isFinite(estado.fama)).toBe(true);
      expect(estado.fama).toBeGreaterThanOrEqual(0);
      expect(estado.fama).toBeLessThanOrEqual(100);
      expect(estado.plantel.every(p => p.energia >= 0 && p.energia <= 100)).toBe(true);
    }
    restaurar();
  });
});

function azarSeguro(): number {
  return azar(0, 1_000_000);
}
