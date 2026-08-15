export type Genero = "M" | "F";
export type Circuito = "amateur" | "pro";
export type Rol = "alumno" | "boxeador";
export type Focus = "fuerza" | "tecnica" | "condicion" | "descanso";
export type Instruccion = "presionar" | "distancia" | "nocaut" | "recuperar";

export interface Stats {
  fuerza: number; velocidad: number; potencia: number; resistencia: number;
  ataque: number; defensa: number; tecnica: number;
  inteligencia: number; mentalidad: number; talento: number;
}

export interface Boxer extends Stats {
  id: string;
  nombre: string;
  genero: Genero;
  edad: number;
  division: string;
  rol: Rol;
  circuito: Circuito;
  elite: boolean;
  focus: Focus;
  energia: number;
  ganadas: number;
  perdidas: number;
  kos: number;
  campeon: boolean;
  trait: string | null;
  skin: string;
  short: string;
  pelo: string;
  semanas: number;
  avisadoTalento?: boolean;
}

export type StaffType = "asistente" | "preparador" | "marketing" | "gerente";

export interface StaffMember { id: string; type: StaffType; nombre: string; }

export type GearId = "guantesPro" | "vendas" | "saco" | "peras" | "ring" | "neon" | "vestuarios" | "zonaElite";

export type CourseId = "instructor" | "tecnico" | "promotor" | "empresarial";

export type PropertyId = "local2" | "terreno" | "apartamento" | "mansion" | "tienda" | "sucursalNorte";

export interface Propiedad { id: PropertyId; nombre: string; tipo: "sucursal" | "terreno" | "vivienda" | "tienda"; precio: number; }

export type EventType = "sparring" | "exhibicion" | "entrevista" | "sponsor" | "prospecto" | "beca" | "torneo";

export interface GameEventOption { label: string; hint: string; }
export interface GameEvent {
  id: string;
  type: EventType;
  titulo: string;
  de: string;
  texto: string;
  dias: number;
  opciones: GameEventOption[];
  necesitaBoxeador?: boolean;
  extra?: { dinero?: number; fama?: number; purseX?: number };
}

export interface FightSetup {
  id: string;
  miBoxeador: Boxer;
  rival: Boxer;
  circuito: Circuito;
  titulo: boolean;
  purse: number;
  esVelada: boolean;
}

export interface FightResult {
  fightId: string;
  gane: boolean;
  metodo: "KO" | "Decision";
  rounds: number;
  purse: number;
  titulo: boolean;
}

export interface WeekSummary {
  ingresos: number;
  gastos: number;
  famaDelta: number;
  notas: string[];
}

export interface Toast { id: number; texto: string; tono: "ok" | "info" | "oro"; }

export type Tab = "gimnasio" | "ciudad" | "roster" | "mercado" | "perfil" | "staff";

export interface GameState {
  version: number;
  creado: boolean;
  nombreJugador: string;
  nombreGimnasio: string;
  rivales: Boxer[];
  dinero: number;
  fama: number;
  dia: number; // 1=Lun ... 6=Sáb 7=Dom
  semana: number;
  mes: number; // 1..12
  anio: number;
  legados: number;
  roster: Boxer[];
  staff: StaffMember[];
  courses: CourseId[];
  gear: GearId[];
  propiedades: PropertyId[];
  marcaRopa: string | null;
  patrocinio: { nombre: string; semanal: number; semanas: number } | null;
  purseMult: number;
  veladaProgramada: boolean;
  schedule: string[]; // ids de boxeadores con pelea el sábado
  fights: FightSetup[];
  events: GameEvent[];
  log: string[];
  toasts: Toast[];
  resumen: WeekSummary | null;
  ingresosSemana: number;
  gastosSemana: number;
  famaSemana: number;
  notasSemana: string[];
  stats: { peleas: number; victorias: number; kos: number; veladas: number; dineroGanado: number };
}
