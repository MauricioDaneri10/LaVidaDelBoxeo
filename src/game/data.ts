import type {
  Atributos, CategoriaMercado,
  ComboId, Consejo, CursoId, GearId, PersonalId, PropiedadId, RamaCurso,
} from "./types";

// ==================== NOMBRES Y APARIENCIAS ====================
// Nombres masculinos (16 canónicos + 34 ampliados de fuente local = 50 pugilistas)
export const NOMBRES_H = [
  "Marcos", "Julián", "Rodrigo", "Emiliano", "Sergio", "Iván", "Nicolás", "Federico",
  "Gastón", "Bruno", "Damián", "Ezequiel", "Matías", "Leandro", "Ramiro", "Facundo",
  "Mateo", "Santiago", "Lucas", "Lautaro", "Agustín", "Tomás", "Ignacio", "Joaquín",
  "Sebastián", "Diego", "Esteban", "Cristian", "Franco", "Gonzalo", "Nahuel", "Alejandro",
  "Maximiliano", "Gabriel", "Ángel", "Mariano", "Darío", "Oscar", "Raúl", "Claudio",
  "César", "Hugo", "Gustavo", "Martín", "Pablo", "Enzo", "Luciano", "Guillermo",
  "Hernán", "Manuel"
];

// Nombres femeninos (14 canónicos + 22 ampliados de fuente local = 36 pugilistas)
export const NOMBRES_M = [
  "Valentina", "Camila", "Lucía", "Martina", "Julieta", "Antonella", "Florencia", "Milagros",
  "Agustina", "Rocío", "Bianca", "Dana", "Selene", "Priscila", "Sofía", "Abril",
  "Micaela", "Carolina", "Sol", "Brisa", "Candela", "Victoria", "Romina", "Mariana",
  "Natalia", "Daniela", "Cecilia", "Paula", "Andrea", "Silvina", "Lorena", "Verónica",
  "Jazmín", "Belén", "Luciana", "Guadalupe"
];

// Alias canónicos para compatibilidad transparente de nomenclatura
export const NOMBRES_F = NOMBRES_M;
export const NOMBRES_MASCULINOS = NOMBRES_H;
export const NOMBRES_FEMENINOS = NOMBRES_M;

// Apellidos (24 canónicos + 40 ampliados de fuente local = 64 linajes)
export const APELLIDOS = [
  "Quiroga", "Sosa", "Vega", "Peralta", "Molina", "Roldán", "Ibarra", "Castro",
  "Benítez", "Figueroa", "Ojeda", "Luna", "Cabrera", "Maidana", "Toledo", "Villalba",
  "Herrera", "Paz", "Ríos", "Bustos", "Coronel", "Salas", "Nieto", "Oliva",
  "Rodríguez", "González", "Gómez", "Fernández", "López", "Díaz", "Martínez", "Pérez",
  "García", "Sánchez", "Romero", "Torres", "Álvarez", "Ruiz", "Ramírez", "Flores",
  "Acosta", "Medina", "Aguirre", "Pereyra", "Gutiérrez", "Giménez", "Silva", "Rojas",
  "Ortiz", "Núñez", "Juárez", "Morales", "Godoy", "Moreno", "Ferreyra", "Domínguez",
  "Carrizo", "Castillo", "Vázquez", "Navarro", "Correa", "Mendoza", "Barrios", "Bravo"
];

// Apodos pugilísticos
export const APODOS = [
  "El Toro", "La Cobra", "Dinamita", "El Rayo", "El Tanque", "Martillo", "La Furia",
  "El Cirujano", "Relámpago", "El Huracán", "El Gladiador", "La Pantera", "El Cazador",
  "Terremoto", "El Diamante", "La Roca", "El Vikingo", "El Destructor", "El Zurdo de Oro",
  "El Matador", "El Fantasma", "Piedra Fuerte", "El Chacal", "Corazón de León", "El León Negro",
  "El Trueno", "Impacto Puro", "Mano de Piedra", "La Topadora", "El Maestro", "El Asesino Silencioso"
];

export const RASGOS = [
  { id: "mandibula", nombre: "Mandíbula de Acero", desc: "Resiste mejor los golpes de poder (+defensa efectiva)." },
  { id: "hijo", nombre: "Hijo de Leyenda", desc: "Crece más rápido en mentalidad e inteligencia." },
  { id: "tren", nombre: "Tren Inferior", desc: "Potencia de golpes notablemente superior." },
  { id: "gacela", nombre: "Gacela del Ring", desc: "Velocidad y esquivas por encima de la media." },
  { id: "reloj", nombre: "Reloj Suizo", desc: "Mantiene el ritmo: gasta menos energía por golpe." },
  { id: "espejo", nombre: "Lector de Espejos", desc: "Gran eficacia: pocos golpes al aire." },
  { id: "volcan", nombre: "Volcán Dormido", desc: "Cuando conecta de poder, duele el doble (críticos más frecuentes)." },
  { id: "maraton", nombre: "Maratonista", desc: "Recupera energía entre asaltos como pocos." },
  { id: "diamante", nombre: "Diamante en Bruto", desc: "Talento oculto: su techo es altísimo." },
  { id: "sereno", nombre: "Corazón Sereno", desc: "Nunca se desespera: mentalidad de hierro." },
];

export const PIELES = ["#f0c8a0", "#e0b088", "#c9986a", "#b07d52", "#8f5f3d", "#6e462c"];
export const PANTALONES = ["#d4342c", "#1f6fb2", "#2e9e63", "#e8b23a", "#8b4fbf", "#e2e2e2", "#23262d", "#e0662e"];
export const PELOS = ["#20180f", "#3a2a18", "#151515", "#5a3d20", "#7a5230", "#2c2c34"];

// Alias de apariencia
export const SKINS = PIELES;
export const SHORTS = PANTALONES;

// Divisiones oficiales
export const DIVISIONES = ["Mosca", "Gallo", "Pluma", "Ligero", "Wélter", "Mediano", "Semipesado", "Pesado"];

// Divisiones por sexo y peso
export const DIVISIONES_M = [
  "Pluma (57 kg)",
  "Ligero (61 kg)",
  "Wélter (66 kg)",
  "Mediano (72 kg)",
  "Semipesado (79 kg)",
  "Pesado (+91 kg)"
];

export const DIVISIONES_F = [
  "Pluma (57 kg)",
  "Ligero (61 kg)",
  "Wélter (66 kg)",
  "Mediano (72 kg)"
];

export const GIMNASIOS_RIVALES = ["Club La Loma", "Club Ferro", "Gimnasio Atlas", "Puños del Sur", "Escuela Centenario"];

// ==================== 6 COMBOS DE ENTRENAMIENTO ====================
export const COMBOS: Record<ComboId, {
  nombre: string; corto: string; desc: string;
  stats: (keyof Atributos)[]; energia: number; bonus: number; icono: string;
}> = {
  noqueador: { nombre: "Enfoque Noqueador", corto: "Noqueador", desc: "Potencia + Eficacia + Fuerza + Ataque. Para los que buscan el golpe que apague la luz.", stats: ["potencia", "eficacia", "fuerza", "ataque"], energia: -8, bonus: 1, icono: "fire" },
  estilista: { nombre: "Enfoque Estilista", corto: "Estilista", desc: "Eficacia + Velocidad + Técnica + Defensa. Boxeo de precisión y manos limpias.", stats: ["eficacia", "velocidad", "tecnica", "defensa"], energia: -8, bonus: 1, icono: "spark" },
  presion: { nombre: "Presión Asfixiante", corto: "Presión", desc: "Resistencia + Ataque + Eficacia + Velocidad. No dejar respirar al rival.", stats: ["resistencia", "ataque", "eficacia", "velocidad"], energia: -8, bonus: 1, icono: "bolt" },
  tactico: { nombre: "Maestro Táctico", corto: "Táctico", desc: "Defensa + Inteligencia + Mentalidad + Técnica. Ganar la pelea antes de pelearla.", stats: ["defensa", "inteligencia", "mentalidad", "tecnica"], energia: -6, bonus: 1, icono: "target" },
  acondicionamiento: { nombre: "Acondicionamiento Total", corto: "Doble Turno", desc: "Fuerza + Resistencia + Velocidad + Eficacia. Doble turno Lun-Mié-Vie: +35% de ganancia, −6 de energía extra.", stats: ["fuerza", "resistencia", "velocidad", "eficacia"], energia: -14, bonus: 1.35, icono: "dumbbell" },
  descanso: { nombre: "Descanso Activo y Spa", corto: "Descanso", desc: "+25 de Energía, y un poco de Mentalidad e Inteligencia. El cuerpo también entrena descansando.", stats: ["mentalidad", "inteligencia"], energia: 25, bonus: 0.5, icono: "heart" },
};
export const LISTA_COMBOS = Object.keys(COMBOS) as ComboId[];

// ==================== MERCADO: 4 CATEGORÍAS ====================
export const CATEGORIAS: { id: CategoriaMercado; nombre: string; icono: string; desc: string }[] = [
  { id: "equipamiento", nombre: "Equipamiento", icono: "glove", desc: "Herramientas de entrenamiento para el gimnasio." },
  { id: "indumentaria", nombre: "Indumentaria", icono: "shirt", desc: "Protección y estilo para tus pugilistas." },
  { id: "instalaciones", nombre: "Instalaciones y Salud", icono: "heart", desc: "Recuperación, comodidad y bienestar del plantel." },
  { id: "difusion", nombre: "Difusión y Marca Propia", icono: "star", desc: "Fama, marca de ropa y presencia en la ciudad." },
];

export const EQUIPOS: Record<GearId, { nombre: string; costo: number; desc: string; efecto: string; cat: CategoriaMercado; icono: string }> = {
  vendasGel: { nombre: "Vendas de Gel", costo: 450, desc: "Protegen las manos del plantel.", efecto: "+4 de recuperación de energía semanal", cat: "equipamiento", icono: "glove" },
  sacosCuero: { nombre: "Sacos de Cuero", costo: 900, desc: "Cuerpo a cuerpo contra el cuero pesado.", efecto: "+25% de ganancia en Fuerza y Potencia", cat: "equipamiento", icono: "dumbbell" },
  perasDoble: { nombre: "Peras Doble Elástico", costo: 550, desc: "Ritmo, ritmo y más ritmo.", efecto: "+25% de ganancia en Velocidad y Eficacia", cat: "equipamiento", icono: "bolt" },
  manoplasPro: { nombre: "Manoplas Pro", costo: 650, desc: "Precisión quirúrgica con el entrenador.", efecto: "+25% de ganancia en Ataque y Técnica", cat: "equipamiento", icono: "target" },
  soga: { nombre: "Sogas de Salto", costo: 200, desc: "El clásico que nunca falla.", efecto: "Habilita la estación Soga y Cardio, +15% en Resistencia", cat: "equipamiento", icono: "rope" },
  pisoGoma: { nombre: "Piso de Goma", costo: 800, desc: "Menos impacto, más sesiones.", efecto: "+2 de recuperación de energía semanal", cat: "equipamiento", icono: "plot" },
  ringReglamentario: { nombre: "Ring Reglamentario", costo: 2500, desc: "Doce cuerdas de pura seriedad.", efecto: "+25% en Técnica y Defensa, tus veladas recaudan más", cat: "equipamiento", icono: "ring" },
  zonaElite: { nombre: "Zona Élite VIP", costo: 15000, desc: "Ring privado con neón para tus 3 estrellas.", efecto: "3 cupos Élite: entrenan +70% más rápido", cat: "equipamiento", icono: "trophy" },
  bucal: { nombre: "Bucal Moldeado", costo: 180, desc: "A medida para cada mandíbula.", efecto: "+5% de esquiva en combate", cat: "indumentaria", icono: "shield" },
  cabezal: { nombre: "Cabezal Olímpico", costo: 600, desc: "Protección de sparring de primer nivel.", efecto: "-5% de daño recibido en combate", cat: "indumentaria", icono: "cap" },
  botas: { nombre: "Botas Antideslizantes", costo: 750, desc: "Agarre total sobre la lona.", efecto: "+5% de esquiva en combate", cat: "indumentaria", icono: "boot" },
  batas: { nombre: "Batas de Seda", costo: 1200, desc: "El paseo al ring es un espectáculo.", efecto: "+25% de fama por victoria", cat: "indumentaria", icono: "shirt" },
  botiquin: { nombre: "Botiquín con Hielo", costo: 350, desc: "Hielo, vendas y manos expertas.", efecto: "+6 de recuperación de energía semanal", cat: "instalaciones", icono: "heart" },
  vestuarios: { nombre: "Vestuarios con Duchas", costo: 1800, desc: "Comodidad que se nota.", efecto: "+4 cupos de alumnos y +2 de recuperación", cat: "instalaciones", icono: "house" },
  barraProteinas: { nombre: "Barra de Proteínas", costo: 3200, desc: "Batidos después de cada turno.", efecto: "+20% de ganancia en Fuerza y +4 energía", cat: "instalaciones", icono: "bolt" },
  sauna: { nombre: "Sauna Seco y Frío", costo: 8500, desc: "Recuperación de atletas de élite.", efecto: "+10 de recuperación de energía semanal", cat: "instalaciones", icono: "fire" },
  carteles: { nombre: "Carteles del Barrio", costo: 250, desc: "Tu nombre en cada esquina.", efecto: "+1 de fama semanal y más boca a boca", cat: "difusion", icono: "flag" },
  sonido: { nombre: "Sonido Motivacional", costo: 1100, desc: "Música que empuja en el último minuto.", efecto: "+10% de ganancia en todos los combos", cat: "difusion", icono: "play" },
  marquesina: { nombre: "Marquesina Neón", costo: 4000, desc: "La ciudad entera sabe dónde entrenas.", efecto: "+2 de fama semanal", cat: "difusion", icono: "spark" },
  vitrina: { nombre: "Vitrina de Trofeos", costo: 5500, desc: "Cristal, terciopelo y gloria expuesta.", efecto: "+1 de fama semanal y cinturones exhibidos con estilo", cat: "difusion", icono: "trophy" },
  estudioMarca: { nombre: "Estudio de Marca de Ropa", costo: 2500, desc: "Diseña y vende indumentaria propia.", efecto: "Habilita crear tu marca y venderla cada semana", cat: "difusion", icono: "shirt" },
};

// ==================== CURSOS: 3 RAMAS × 3 NIVELES ====================
export const CURSOS: Record<CursoId, { nombre: string; rama: RamaCurso; nivel: 1 | 2 | 3; costo: number; desc: string; req: CursoId | null }> = {
  dt: { nombre: "Licencia de Entrenador", rama: "deportiva", nivel: 1, costo: 500, desc: "Te habilita como entrenador responsable para registrar y dirigir atletas federados.", req: null },
  nutricion: { nombre: "Nutrición Deportiva", rama: "deportiva", nivel: 2, costo: 1500, desc: "Planes de alimentación para el plantel: +6 de recuperación de energía semanal.", req: "dt" },
  altoRendimiento: { nombre: "Alto Rendimiento", rama: "deportiva", nivel: 3, costo: 4000, desc: "Metodología de élite: +20% de ganancia en todo y habilita la Zona Élite VIP.", req: "nutricion" },
  veladas: { nombre: "Organización de Veladas", rama: "promotora", nivel: 1, costo: 800, desc: "Arma tu propia cartelera de los sábados y cobra entradas.", req: null },
  prensa: { nombre: "Prensa y Medios", rama: "promotora", nivel: 2, costo: 2000, desc: "Tu nombre en los diarios: más sponsors y mejor recaudación de veladas.", req: "veladas" },
  tv: { nombre: "Televisión Estelar", rama: "promotora", nivel: 3, costo: 6000, desc: "Contratos de TV: veladas en la Arena Central y derechos de transmisión.", req: "prensa" },
  clubes: { nombre: "Gestión de Clubes", rama: "empresarial", nivel: 1, costo: 1000, desc: "Comprá el local del gimnasio, terrenos y abrí tu primera sucursal.", req: null },
  franquicias: { nombre: "Franquicias", rama: "empresarial", nivel: 2, costo: 3500, desc: "Habilita más sucursales y automatiza el descubrimiento de talentos.", req: "clubes" },
  imperio: { nombre: "Imperio Global", rama: "empresarial", nivel: 3, costo: 10000, desc: "La cima empresarial: +50% en todos los ingresos pasivos.", req: "franquicias" },
};

// ==================== PERSONAL DEL GIMNASIO ====================
export const PERSONAL_INFO: Record<PersonalId, { nombre: string; sueldo: number; desc: string; multiple: boolean; icono: string }> = {
  directorTecnico: { nombre: "Entrenador Automático", sueldo: 120, desc: "Organiza al 100% los entrenamientos: asigna el enfoque ideal a cada atleta cada semana.", multiple: false, icono: "glove" },
  representante: { nombre: "Representante Deportivo y Promotor", sueldo: 150, desc: "Agenda solo las peleas del sábado eligiendo la mejor oferta de Selección de Rival.", multiple: false, icono: "case" },
  preparador: { nombre: "Preparador Físico", sueldo: 90, desc: "+20% de ganancia en todo el Pilar Físico.", multiple: false, icono: "dumbbell" },
  asistente: { nombre: "Asistente de Clases", sueldo: 70, desc: "+4 cupos de alumnos y mejora el boca a boca del barrio.", multiple: false, icono: "users" },
  difusion: { nombre: "Jefe de Difusión", sueldo: 100, desc: "Ventas de marca ×1.8, más sponsors y +15% en eventos y veladas.", multiple: false, icono: "star" },
  gerente: { nombre: "Gerente de Sucursal", sueldo: 110, desc: "Administra una sucursal y habilita su ingreso pasivo semanal.", multiple: true, icono: "store" },
  entrenadorLocal: { nombre: "Entrenador Local", sueldo: 80, desc: "Suma $200 al ingreso de la sucursal y descubre talentos automáticamente.", multiple: true, icono: "cap" },
};

// ==================== TÍTULOS Y CINTURONES ====================
export const TITULOS: Record<1 | 2 | 3 | 4, { nombre: string; cinturon: string; bolsa: number; req: string; colores: [string, string] }> = {
  1: { nombre: "Título Regional", cinturon: "Cinturón de Bronce y Cuero", bolsa: 1500, req: "4 a 6 victorias y Top 5 regional", colores: ["#b06a2e", "#7a4218"] },
  2: { nombre: "Título Nacional", cinturon: "Cinturón Nacional Plateado", bolsa: 5000, req: "Profesional, 8 a 12 victorias (4+ por KO)", colores: ["#c9cdd4", "#8d949e"] },
  3: { nombre: "Título Continental", cinturon: "Cinturón Continental Verde y Oro", bolsa: 18000, req: "14 a 18 victorias (8+ por KO) y contratos de TV", colores: ["#2e9e63", "#e8b23a"] },
  4: { nombre: "Título Mundial", cinturon: "Cinturón Absoluto de Oro y Diamantes", bolsa: 150000, req: "18 a 20+ victorias (10+ por KO)", colores: ["#f2c94c", "#e8b23a"] },
};

// ==================== PROPIEDADES ENRIQUECIDAS ====================
export const PROPIEDADES: Record<PropiedadId, {
  nombre: string;
  costo: number;
  desc: string;
  icono: string;
  tipo?: "vivienda" | "comercial" | "estadio";
  distrito?: string;
  coordenadasSvg?: { x: number; y: number };
  beneficio?: string;
}> = {
  local: {
    nombre: "Local Propio del Gimnasio",
    costo: 9000,
    desc: "Comprá el local y olvidate del alquiler para siempre.",
    icono: "store",
    tipo: "comercial",
    distrito: "Sur (Barrio Tradicional)",
    coordenadasSvg: { x: 420, y: 340 },
    beneficio: "Elimina el alquiler semanal del gimnasio",
  },
  terreno: {
    nombre: "Terreno Baldío",
    costo: 5000,
    desc: "Paso previo y barato antes de levantar una sucursal.",
    icono: "plot",
    tipo: "comercial",
    distrito: "Sur (Barrio Tradicional)",
    coordenadasSvg: { x: 300, y: 400 },
    beneficio: "Habilita la construcción de nuevas instalaciones",
  },
  sucursal: {
    nombre: "Sucursal del Gimnasio",
    costo: 14000,
    desc: "Nueva sede con ingresos pasivos semanales (requiere Gerente).",
    icono: "store",
    tipo: "comercial",
    distrito: "Centro Urbano",
    coordenadasSvg: { x: 500, y: 300 },
    beneficio: "+10 cupos de alumnos y +$800/sem con Gerente contratado",
  },
  apartamento: {
    nombre: "Apartamento Céntrico",
    costo: 6000,
    desc: "Tu primer techo propio: +2 de fama.",
    icono: "house",
    tipo: "vivienda",
    distrito: "Sur (Barrio Tradicional)",
    coordenadasSvg: { x: 260, y: 380 },
    beneficio: "+2 de Fama permanente y vivienda personal",
  },
  mansion: {
    nombre: "Mansión con Vista",
    costo: 35000,
    desc: "El sueño del magnate: +8 de fama.",
    icono: "house",
    tipo: "vivienda",
    distrito: "Norte (Lomas)",
    coordenadasSvg: { x: 740, y: 140 },
    beneficio: "+8 de Fama permanente y prestigio para el club",
  },
  arena: {
    nombre: "Arena Central",
    costo: 80000,
    desc: "El templo del boxeo es tuyo: veladas con recaudación ×1.5.",
    icono: "ring",
    tipo: "estadio",
    distrito: "Centro Urbano",
    coordenadasSvg: { x: 620, y: 190 },
    beneficio: "Elimina alquiler para siempre y multiplica recaudación ×1.5",
  },
};

export const PROPIEDADES_INFO = PROPIEDADES;

// ==================== EVENTOS COMUNITARIOS ====================
export const COMUNITARIOS: Record<"bingo" | "naipes" | "festival", { nombre: string; inversion: number; min: number; max: number; extra: string }> = {
  bingo: { nombre: "Gran Bingo Familiar del Club", inversion: 200, min: 600, max: 1400, extra: "Atrae alumnos al gimnasio" },
  naipes: { nombre: "Torneo de Juegos de Mesa y Naipes", inversion: 100, min: 400, max: 900, extra: "Noche de camaradería" },
  festival: { nombre: "Noche de Festival y Exhibición de Boxeo", inversion: 500, min: 1000, max: 2500, extra: "+3 de Fama garantizada" },
};

// Eventos de club ampliados
export const EVENTOS_CLUB_INFO: Record<string, {
  id: string;
  nombre: string;
  emoji: string;
  costoOrganizacion: number;
  recaudacionBase: number;
  famaMultiplicador: number;
  famaGanada: number;
  descripcion: string;
}> = {
  bingoFamiliar: {
    id: "bingoFamiliar",
    nombre: "Gran Bingo Familiar",
    emoji: "🎟️",
    costoOrganizacion: 120,
    recaudacionBase: 250,
    famaMultiplicador: 4,
    famaGanada: 2,
    descripcion: "Tarde de sorteos, premios y buffet con las familias del barrio en el salón del club.",
  },
  torneoJuegosMesa: {
    id: "torneoJuegosMesa",
    nombre: "Torneo de Juegos de Mesa & Truco",
    emoji: "🃏",
    costoOrganizacion: 80,
    recaudacionBase: 160,
    famaMultiplicador: 3,
    famaGanada: 1,
    descripcion: "Competencia barrial de truco, ajedrez y dominó para socios y aficionados.",
  },
  festivalBoxeo: {
    id: "festivalBoxeo",
    nombre: "Festival de Boxeo & Kermesse",
    emoji: "🎪",
    costoOrganizacion: 250,
    recaudacionBase: 450,
    famaMultiplicador: 8,
    famaGanada: 4,
    descripcion: "Exhibición de guanteos al aire libre, puestos gastronómicos y música en vivo.",
  },
  copaMundialClubes: {
    id: "copaMundialClubes",
    nombre: "Copa Mundial de Clubes de Élite",
    emoji: "👑",
    costoOrganizacion: 50000,
    recaudacionBase: 85000,
    famaMultiplicador: 20,
    famaGanada: 25,
    descripcion: "Mega-torneo internacional transmitido a nivel global. Consagra a tu club como la máxima dinastía del pugilismo.",
  },
};

// Emblemas de club
export const LOGOS_DISPONIBLES = [
  { id: "guante", nombre: "Guante Carmesí", emoji: "🥊", lema: "Tradición, forja y disciplina" },
  { id: "leon", nombre: "León Imperial", emoji: "🦁", lema: "Orgullo y dominio en el ring" },
  { id: "aguila", nombre: "Águila Dorada", emoji: "🦅", lema: "Velocidad, visión y precisión" },
  { id: "corona", nombre: "Corona Real", emoji: "👑", lema: "Excelencia y realeza boxística" },
  { id: "rayo", nombre: "Rayo Eléctrico", emoji: "⚡", lema: "Explosividad e impacto fulminante" },
  { id: "lobo", nombre: "Lobo Plateado", emoji: "🐺", lema: "Estrategia, garra y trabajo de esquina" },
];

// ==================== SPONSORS Y PRENSA ====================
export const SPONSORS = ["Bebidas Toro", "Ropa Deportiva Ráfaga", "Ferretería El Yunque", "Autos Falcón", "Lácteos La Pradera", "Zapatillas Trueno", "Seguros Escudo", "Carnes Don Pedro"];
export const MEDIOS = ["Diario La Ciudad", "Radio Guante", "Canal 8 Deportes", "Portal RingSide", "Semanario La Lona"];

// ==================== CONSEJOS DE DON ANSELMO ====================
export const CONSEJOS_INICIALES: Omit<Consejo, "cumplido" | "reclamado">[] = [
  { id: "c1", texto: "Prepará a tu primer alumno: completá sus prácticas, conseguí la licencia de entrenador y habilitalo para competir.", fama: 5 },
  { id: "c2", texto: "Ganá tu primera pelea oficial. La esquina siempre cree en vos.", fama: 5 },
  { id: "c3", texto: "Comprá tu primer equipamiento en el mercado. Un gimnasio serio se nota en las herramientas.", fama: 3 },
  { id: "c4", texto: "Organizá tu primera velada de boxeo. La recaudación es tuya.", fama: 8 },
  { id: "c5", texto: "Llegá a 40 de fama. Que todo el barrio hable de tu gimnasio.", fama: 6 },
  { id: "c6", texto: "Colgá tu primer cinturón en la pared del gimnasio.", fama: 10 },
  { id: "c7", texto: "Contratá a tu primer miembro del personal. Nadie llega solo a la cima.", fama: 4 },
];

// Calendario
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const DIAS_SEMANA_NOMBRES = DIAS;
export const MESES_CALENDARIO = MESES;

// ==================== FUNCIONES AUXILIARES ====================
export function fmtDinero(n: number): string {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

export function generarIdUnico(): string {
  return "id_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}
