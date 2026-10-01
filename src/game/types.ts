// ============================================================
// "La Vida del Boxeo" — Tipos centrales del juego
// Todo el vocabulario sigue el glosario oficial en español neutro.
// ============================================================

export type Genero = "M" | "F";
export type Rol = "alumno" | "boxeador";
export type Circuito = "amateur" | "pro";

/** Las 11 capacidades de la matriz oficial */
export interface Atributos {
  // Pilar Físico
  fuerza: number; velocidad: number; potencia: number; resistencia: number;
  // Pilar Técnico
  ataque: number; defensa: number; tecnica: number; eficacia: number;
  // Pilar Mental
  inteligencia: number; mentalidad: number; talento: number;
}
export type ClaveAtributo = keyof Atributos;

export type ComboId = "noqueador" | "estilista" | "presion" | "tactico" | "acondicionamiento" | "descanso";
export interface RecordBoxeo { v: number; d: number; e: number; ko: number; }

export interface Pugilista {
  id: string;
  nombre: string;
  genero: Genero;
  edad: number;
  piel: string;
  pantalon: string;
  pelo: string;
  atrib: Atributos;
  rol: Rol;
  circuito: Circuito;
  division: string;
  /** Récord acumulado mostrado al público: victorias-derrotas-empates. */
  record: RecordBoxeo;
  /** Cantidad de combates disputados en cada etapa del recorrido. */
  peleasAmateur: number;
  peleasProfesionales: number;
  victoriasProfesionales: number;
  derrotasProfesionales: number;
  empatesProfesionales: number;
  kosProfesionales: number;
  /** Club de procedencia en rankings y rivales generados. */
  club?: string;
  /** 0 sin título · 1 Nacional · 2 Regional · 3 Continental · 4 Mundial */
  titulo: 0 | 1 | 2 | 3 | 4;
  /** Licencia individual del atleta para competir oficialmente. */
  licenciaFederativa: boolean;
  energia: number;
  combo: ComboId;
  fogueo: number;
  fogueoMeta: number;
  guanteosRealizados: number;
  lesion: Lesion | null;
  proximaPeleaSemana: number | null;
  ultimaPeleaSemana: number | null;
  rasgo: string;
  elite: boolean;
  /** Bono de Madurez: +10% Temple Mental y Defensa en su debut oficial */
  bonusDebut: boolean;
  /** Si es alumno y el gimnasio no tiene cupo, espera hasta que se libere un lugar. */
  enEspera?: boolean;
  /** Semana en que se incorporó al club, para destacar el alta reciente en la interfaz. */
  semanaIngreso?: number;
}

export interface Lesion {
  tipo: "golpe" | "muscular" | "mano" | "corte";
  semanas: number;
  gravedad: "leve" | "media" | "grave";
  tratamiento: number;
}

export interface OfertaRival {
  id: string;
  rival: Pugilista;
  nivel: "accesible" | "parejo" | "desafio";
  bolsa: number;
  etiqueta: string;
  detalle: string;
  esTitulo: 0 | 1 | 2 | 3 | 4;
}

export interface Pelea {
  id: string;
  miId: string;
  rival: Pugilista;
  bolsa: number;
  esTitulo: 0 | 1 | 2 | 3 | 4;
  velada: boolean;
  semanaProgramada?: number;
  diaProgramado?: number;
}

export interface CajaGolpes { lanzados: number; conectados: number; }
export interface CompuBox { jab: CajaGolpes; poder: CajaGolpes; }
export interface TarjetaJuez { a: number; b: number; }

export interface ResultadoPelea {
  /** Identidad del atleta propio; permite mostrar el historial correcto por boxeador. */
  miId?: string;
  rivalNombre?: string;
  gane: boolean;
  empate: boolean;
  metodo: "Nocaut" | "Nocaut Técnico" | "Decisión Unánime" | "Decisión Dividida" | "Decisión Mayoritaria" | "Empate";
  tarjetas: TarjetaJuez[];
  caidasA: number;
  caidasB: number;
  registroA: CompuBox;
  registroB: CompuBox;
  bolsa: number;
  fama: number;
  tituloGanado: 0 | 1 | 2 | 3 | 4;
  resumen: string;
}

export type GearId =
  | "vendasGel" | "sacosCuero" | "perasDoble" | "manoplasPro" | "soga" | "pisoGoma" | "cuerdaVelocidad" | "plataformaReaccion" | "ringReglamentario" | "zonaElite"
  | "bucal" | "cabezal" | "botas" | "batas"
  | "botiquin" | "vestuarios" | "barraProteinas" | "sauna"
  | "carteles" | "sonido" | "marquesina" | "vitrina" | "estudioMarca";

export type CategoriaMercado = "equipamiento" | "indumentaria" | "instalaciones" | "difusion";

export type CursoId = "dt" | "nutricion" | "altoRendimiento" | "veladas" | "prensa" | "tv" | "clubes" | "franquicias" | "imperio";
export type RamaCurso = "deportiva" | "promotora" | "empresarial";

export type PersonalId = "directorTecnico" | "representante" | "preparador" | "asistente" | "difusion" | "gerente" | "entrenadorLocal" | "coordinadorSucursal" | "ojeador";

export interface MiembroPersonal { id: string; tipo: PersonalId; nombre: string; }

export type TipoEvento = "desafio" | "patrocinio" | "comunitario" | "prospecto" | "federacion" | "mantenimiento" | "entrevista" | "recaudacion";

export interface AccionEvento {
  tipo: "dinero" | "fama" | "nuevoAlumno" | "programarComunitario" | "aceptarPatrocinio" | "exhibicion" | "mantenimiento" | "entrevista" | "recaudacion" | "nada";
  monto?: number;
  costo?: number;
  fama?: number;
  nombre?: string;
  semanas?: number;
  comunitario?: TipoComunitario;
}

export interface OpcionEvento { texto: string; accion: AccionEvento; }

export interface EventoJuego {
  id: string;
  tipo: TipoEvento;
  de: string;
  titulo: string;
  texto: string;
  venceEn: number;
  opciones: OpcionEvento[];
}

export interface PatrocinioActivo { nombre: string; semanal: number; semanas: number; }
export type TipoComunitario = "bingo" | "naipes" | "festival" | "claseAbierta";
export interface ComunitarioProgramado { tipo: TipoComunitario; nombre: string; }
export interface PrestamoActivo { saldo: number; cuota: number; semanasRestantes: number; }
export interface Consejo { id: string; texto: string; fama: number; dinero?: number; cumplido: boolean; reclamado: boolean; archivado?: boolean; motivoArchivo?: string; }
export interface NotaPrensa { id: string; semana: number; texto: string; }
export interface Cinturon { id: string; dueno: string; nivel: 1 | 2 | 3 | 4; semana: number; }
export interface EntradaSalonFama {
  id: string;
  nombre: string;
  club: string;
  record: RecordBoxeo;
  titulos: number;
  semanaRetiro: number;
  motivo: string;
}
export interface LineaLibro { concepto: string; monto: number; }
/** Every competitive departure; separate from the selected Hall of Fame. */
export interface CarreraArchivada {
  id: string;
  pugilista: Pugilista;
  club: string;
  semanaSalida: number;
  motivo: string;
  historial: ResultadoPelea[];
}
export interface ResumenSemanal { ingresos: LineaLibro[]; gastos: LineaLibro[]; total: number; }

export type PropiedadId = "local" | "terreno" | "sucursal" | "apartamento" | "mansion" | "arena";

export interface EstadoJuego {
  combateActivo: import("./engine").EstadoPelea | null;
  contratosTitularesHistoricos?: string[];
  version: number;
  schemaVersion: number;
  creado: boolean;
  nombreJugador: string;
  nombreGimnasio: string;
  dinero: number;
  fama: number;
  seguidores: number;
  recreativos: number;
  dia: number; // 1 = Lunes ... 6 = Sábado · 7 = Domingo de Balance
  semana: number;
  /** Semana en la que se utilizó por última vez el buscador de talentos. */
  ultimaSemanaScout: number;
  mes: number;
  anio: number;
  plantel: Pugilista[];
  rivales: Pugilista[];
  ofertas: OfertaRival[];
  ofertasPara: string | null;
  pendientes: Pelea[];
  historial: ResultadoPelea[];
  equipamiento: GearId[];
  marcaRopa: string;
  cursos: CursoId[];
  personal: MiembroPersonal[];
  propiedades: PropiedadId[];
  patrocinio: PatrocinioActivo | null;
  prestamo: PrestamoActivo | null;
  eventos: EventoJuego[];
  comunitarios: ComunitarioProgramado[];
  consejos: Consejo[];
  prensa: NotaPrensa[];
  cinturones: Cinturon[];
  salonFama: EntradaSalonFama[];
  archivoCarreras: CarreraArchivada[];
  veladaProgramada: boolean;
  libroIngresos: LineaLibro[];
  libroGastos: LineaLibro[];
  /** Semana a la que pertenecen los movimientos acumulados en el libro activo. */
  semanaLibro: number;
  resumen: ResumenSemanal | null;
  legados: number;
  stats: { peleas: number; victorias: number; kos: number; veladas: number; dineroGanado: number; resultadoNeto: number; titulos: number };
  toasts: Toast[];
  logoGimnasio: string;
  ultimaSemanaEntrenada: number;
  nombrePartida: string;
  partidaId: string;
}

export interface PartidaGuardada {
  id: string;
  nombre: string;
  coach: string;
  gimnasio: string;
  semana: number;
  dia: number;
  dinero: number;
  guardadaEn: string;
  estado: EstadoJuego;
}

/** Formato externo versionado del autoguardado; no se expone en la UI. */
export interface SaveEnvelope {
  formatVersion: 1;
  gameVersion: number;
  schemaVersion: number;
  saveId: string;
  savedAt: string;
  checksum?: string;
  state: EstadoJuego;
}

export interface Toast { id: number; texto: string; tono: "ok" | "info" | "oro" | "alerta"; }

export type Accion =
  | { type: "NUEVO_JUEGO"; nombre: string; gimnasio: string; logoGimnasio?: string }
  | { type: "CARGAR_PARTIDA"; id: string }
  | { type: "RENOMBRAR_PARTIDA"; nombre: string }
  | { type: "CONTINUAR" }
  | { type: "IMPORTAR"; estado: EstadoJuego }
  | { type: "REINICIAR" }
  | { type: "AVANZAR_DIA" }
  | { type: "SEMANA_RAPIDA" }
  | { type: "CERRAR_DOMINGO" }
  | { type: "CAMBIAR_COMBO"; id: string; combo: ComboId }
  | { type: "LICENCIAR"; id: string }
  | { type: "PROMOVER_PRO"; id: string }
  | { type: "ALTERNAR_ELITE"; id: string }
  | { type: "BUSCAR_RIVAL"; id: string }
  | { type: "ELEGIR_OFERTA"; ofertaId: string }
  | { type: "CANCELAR_PELEA"; peleaId: string }
  | { type: "RESOLVER_PELEA"; peleaId: string; resultado: ResultadoPelea }
  | { type: "CHECKPOINT_COMBATE"; estado: import("./engine").EstadoPelea }
  | { type: "COMPRAR_EQUIPO"; id: GearId }
  | { type: "CREAR_MARCA"; nombre: string }
  | { type: "COMPRAR_CURSO"; id: CursoId }
  | { type: "COMPRAR_PROPIEDAD"; id: PropiedadId }
  | { type: "CONTRATAR"; tipo: PersonalId; confirmado?: boolean }
  | { type: "DESPEDIR"; id: string }
  | { type: "RETIRAR_ATLETA"; id: string }
  | { type: "ALTERNAR_VELADA" }
  | { type: "PROGRAMAR_SOCIAL"; actividad: TipoComunitario }
  | { type: "PEDIR_PRESTAMO" }
  | { type: "CERRAR_CLUB"; confirmado?: boolean }
  | { type: "EVENTO"; id: string; opcion: number }
  | { type: "RECLAMAR_CONSEJO"; id: string }
  | { type: "TOAST"; texto: string; tono?: Toast["tono"] }
  | { type: "QUITAR_TOAST"; id: number }
  | { type: "SCOUT" }
  | { type: "LEGADO" };
