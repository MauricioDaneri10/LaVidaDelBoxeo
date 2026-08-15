import type { CourseId, EventType, GearId, StaffType } from "./types";

export const DIVISIONES_M = ["Minimosca", "Mosca", "Gallo", "Pluma", "Ligero", "Wélter", "Medio", "Semicompleto", "Completo"];
export const DIVISIONES_F = ["Minimosca", "Mosca", "Gallo", "Pluma", "Ligero", "Wélter", "Medio", "Semicompleto", "Completo"];

export const NOMBRES_M = ["Marco", "Javier", "Andrés", "Rubén", "Tomás", "Iker", "Santi", "Emilio", "Bruno", "Dante", "Óscar", "León", "Camilo", "Rodrigo", "Fausto", "Nicolás", "Gael", "Elías", "Simón", "Rafael"];
export const NOMBRES_F = ["Valeria", "Camila", "Renata", "Julieta", "Daniela", "Paloma", "Abril", "Marina", "Lucía", "Karla", "Sofía", "Elena", "Bianca", "Rocío", "Irene", "Alma", "Celeste", "Marta"];
export const APELLIDOS = ["Ríos", "Vega", "Montoya", "Cruz", "Salazar", "Peralta", "Ibarra", "Quintana", "Reyes", "Navarro", "Fuentes", "Aguilar", "Castillo", "Mendoza", "Ortega", "Villalba", "Serrano", "Paredes", "Delgado", "Herrera", "Campos", "Roldán", "Bustos", "Ferrer"];

export const TRAITS: Record<string, { nombre: string; desc: string; mod: Partial<Record<string, number>> }> = {
  mandibula: { nombre: "Mandíbula de Acero", desc: "Recibe 20% menos de daño.", mod: { defensa: 8, mentalidad: 5 } },
  leyenda: { nombre: "Hijo de Leyenda", desc: "Suma fama extra al ganar y +mentalidad.", mod: { mentalidad: 10, talento: 5 } },
  noqueador: { nombre: "Noqueador Nato", desc: "Más probabilidad de golpe de suerte.", mod: { potencia: 8 } },
  rapidas: { nombre: "Manos Rápidas", desc: "Golpea con más frecuencia.", mod: { velocidad: 8, ataque: 4 } },
  corazon: { nombre: "Corazón de Campeón", desc: "Recupera más energía entre rounds.", mod: { resistencia: 8, mentalidad: 6 } },
  zurdo: { nombre: "Zurdo Incómodo", desc: "Los rivales fallan más contra él.", mod: { tecnica: 6, ataque: 4 } },
  veterano: { nombre: "Veterano Astuto", desc: "La inteligencia compensa el físico.", mod: { inteligencia: 9, tecnica: 5 } },
  tortuga: { nombre: "Tortuga Táctica", desc: "Defensa sólida, ritmo paciente.", mod: { defensa: 7, inteligencia: 5, velocidad: -3 } },
  torbellino: { nombre: "Torbellino", desc: "Presiona sin pausa: +velocidad y ataque.", mod: { velocidad: 6, ataque: 6, defensa: -3 } },
  diamante: { nombre: "Diamante en Bruto", desc: "Crece mucho más rápido al entrenar.", mod: { talento: 12 } },
};

export const SKINS = ["#f0c9a0", "#e0ac7e", "#c98d5f", "#a5673f", "#7c4a2a", "#5d3a22"];
export const SHORTS = ["#d4342c", "#e8b23a", "#2c6e8f", "#4f8f3f", "#7a4fb0", "#c05a8f", "#3a3a3a", "#b3552c"];
export const PELOS = ["#241a12", "#3d2c1a", "#101010", "#5a4630", "#8a6a3a", "#2e2e38"];

export const CURSOS: Record<CourseId, { nombre: string; costo: number; req: CourseId | null; desc: string; desbloquea: string[] }> = {
  instructor: { nombre: "Instructor Básico", costo: 0, req: null, desc: "Tu punto de partida: dar clases y mantener vivo el gimnasio del barrio.", desbloquea: ["Dar clases a alumnos", "Entrenar enfoque semanal", "Contratar Entrenador Asistente"] },
  tecnico: { nombre: "Director Técnico Federado", costo: 1500, req: "instructor", desc: "Licencia oficial de la federación para formar competidores reales.", desbloquea: ["Federar boxeadores", "Circuito amateur y rankings", "Sparrings y scouting en gimnasios rivales", "Contratar Preparador Físico"] },
  promotor: { nombre: "Promotor de Eventos", costo: 5000, req: "tecnico", desc: "Organiza veladas propias: entradas, cartelera y ventaja de localía.", desbloquea: ["Organizar veladas de boxeo", "Cobrar entradas según tu fama", "Jefe de Marketing"] },
  empresarial: { nombre: "Gestión Empresarial", costo: 15000, req: "promotor", desc: "El salto a magnate: bienes raíces, franquicias y marca propia.", desbloquea: ["Comprar locales y terrenos", "Abrir sucursales con gerentes", "Lanzar tu marca de ropa", "Zona de Alto Rendimiento"] },
};

export const GEAR: Record<GearId, { nombre: string; costo: number; desc: string; bonus: string }> = {
  vendas: { nombre: "Vendas Premium", costo: 250, desc: "Protección profesional para nudillos.", bonus: "+10% crecimiento de Defensa" },
  saco: { nombre: "Sacos de Arena Pro", costo: 400, desc: "Cuatro sacos pesados de cuero legítimo.", bonus: "+15% entrenamiento de Fuerza" },
  peras: { nombre: "Peras de Velocidad", costo: 700, desc: "Ritmo y reflejos para tus peleadores.", bonus: "+15% entrenamiento de Velocidad" },
  ring: { nombre: "Ring Profesional", costo: 1500, desc: "Lona reglamentaria y esquineros nuevos.", bonus: "+15% entrenamiento de Técnica" },
  guantesPro: { nombre: "Guantes de Competencia", costo: 600, desc: "Guantes certificados para sparring duro.", bonus: "+10% crecimiento general" },
  neon: { nombre: "Marquesina Neón", costo: 3000, desc: "Tu gimnasio brilla en la noche de la ciudad.", bonus: "+2 de fama por semana y estilo" },
  zonaElite: { nombre: "Zona de Alto Rendimiento", costo: 12000, desc: "Área exclusiva con ring privado para tus estrellas.", bonus: "3 cupos élite: entrenan 60% más rápido" },
  vestuarios: { nombre: "Vestuarios Modernos", costo: 2000, desc: "Duchas calientes y lockers nuevos.", bonus: "+4 cupos de alumnos" },
};

export const STAFF_INFO: Record<StaffType, { nombre: string; sueldo: number; desc: string; req: string }> = {
  asistente: { nombre: "Entrenador Asistente", sueldo: 450, desc: "Dirige las clases regulares: +25% de crecimiento para todos.", req: "Instructor Básico" },
  preparador: { nombre: "Preparador Físico", sueldo: 500, desc: "Duplica las ganancias de condición y energía diaria.", req: "Director Técnico" },
  marketing: { nombre: "Jefe de Marketing", sueldo: 900, desc: "+3 fama semanal, mejora sponsors y ventas de tu marca.", req: "Promotor de Eventos" },
  gerente: { nombre: "Gerente de Sucursal", sueldo: 700, desc: "Administra una sucursal para que produzca ingresos pasivos.", req: "Gestión Empresarial" },
};

export const PROPIEDADES: Record<string, { nombre: string; tipo: "sucursal" | "terreno" | "vivienda" | "tienda"; precio: number; desc: string }> = {
  local2: { nombre: "Local en Av. Central", tipo: "sucursal", precio: 8000, desc: "Un local listo para convertirse en tu primera sucursal." },
  terreno: { nombre: "Terreno en Zona Norte", tipo: "terreno", precio: 15000, desc: "Construye un gimnasio desde cero (+$10.000 de obra)." },
  apartamento: { nombre: "Apartamento Céntrico", tipo: "vivienda", precio: 9000, desc: "Adiós al alquiler personal. +3 de prestigio." },
  mansion: { nombre: "Mansión en Las Lomas", tipo: "vivienda", precio: 120000, desc: "El símbolo definitivo del magnate. +15 de prestigio." },
  tienda: { nombre: "Tienda de Equipamiento", tipo: "tienda", precio: 0, desc: "El clásico local de Don Anselmo: guantes, vendas y sacos." },
};

export const EVENT_TEXTS: Record<EventType, { de: string; titulo: string; textos: string[] }> = {
  sparring: { de: "Gimnasio La Loma", titulo: "Sparring cruzado", textos: ["¿Nos prestas a uno de tus federados para sparring? Pagamos {d} y ambos ganan experiencia."] },
  exhibicion: { de: "Club Deportivo Sur", titulo: "Oferta de exhibición", textos: ["Queremos una pelea de exhibición en nuestra gala. Ofrecemos {d} por la presentación."] },
  entrevista: { de: "BoxStream TV", titulo: "Entrevista viral", textos: ["Un creador de contenido local quiere grabar en tu gimnasio. La exposición podría ser enorme."] },
  sponsor: { de: "HidraMax Bebidas", titulo: "Propuesta de patrocinio", textos: ["Queremos poner nuestro logo en tu lona: {d} por semana durante 8 semanas."] },
  prospecto: { de: "Recepción", titulo: "Talento en la puerta", textos: ["Hay un joven en recepción con una mirada que asusta. Dice que quiere entrenar contigo."] },
  beca: { de: "Federación Nacional", titulo: "Beca federativa", textos: ["Tu trabajo con el boxeo amateur fue destacado. La federación otorga {d} a tu programa."] },
  torneo: { de: "Federación Nacional", titulo: "Invitación a torneo", textos: ["Tu próximo combate federado pagará el doble de bolsa. ¿Aceptas la invitación?"] },
};

export const FOCUS_INFO: Record<string, { nombre: string; stats: string[]; icon: string }> = {
  fuerza: { nombre: "Fuerza y Potencia", stats: ["fuerza", "potencia"], icon: "dumbbell" },
  tecnica: { nombre: "Técnica y Ataque", stats: ["tecnica", "ataque"], icon: "target" },
  condicion: { nombre: "Condición Física", stats: ["resistencia", "velocidad"], icon: "bolt" },
  descanso: { nombre: "Descanso Activo", stats: [], icon: "bed" },
};

export const INSTRUCCIONES: Record<string, { nombre: string; desc: string }> = {
  presionar: { nombre: "Presiona el ritmo", desc: "+ataque, gasta más energía" },
  distancia: { nombre: "Cuida la distancia", desc: "Recibe menos daño, golpea suave" },
  nocaut: { nombre: "Busca el nocaut", desc: "Daño enorme, quedas expuesto" },
  recuperar: { nombre: "Recupera el aire", desc: "Golpea poco, recarga energía" },
};

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const COMENTARIOS_HIT = [
  "¡{a} conecta un jab seco al rostro de {b}!",
  "Gancho de {a} que sacude a {b}.",
  "{a} entra con un cross perfecto.",
  "Uppercut de {a}: {b} siente el golpe.",
  "{b} retrocede tras la combinación de {a}.",
];
export const COMENTARIOS_FAIL = [
  "{a} lanza y {b} se agacha a tiempo.",
  "El guante de {a} roza el aire.",
  "{b} bloquea con los codos arriba.",
  "Intercambio trabado en el clinch.",
];
export const COMENTARIOS_CRIT = [
  "¡¡GOLPE DE SUERTE!! {a} pesca a {b} con todo.",
  "¡{b} TAMBALEA! Impacto brutal de {a}.",
  "¡La multitud ruge! {a} encuentra la mandíbula.",
];

export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
