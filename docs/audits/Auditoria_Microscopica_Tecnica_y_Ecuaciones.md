# 🔬 AUDITORÍA MICROSCÓPICA: ESPECIFICACIÓN TÉCNICA, ECUACIONES Y MODELO DE DATOS
**Título del Proyecto:** La Vida del Boxeo  
**Versión:** 2.0 — Auditoría y Blindaje Microscópico Integral  
**Idioma:** Español Neutro Universal / TypeScript  
**Propósito:** Especificación matemática, algorítmica y técnica completa para la implementación del motor de juego y lógica de estado.

---

## 1. MODELO DE DATOS Y TIPOS ESTRICTOS DE TYPESCRIPT (`types.ts`)

```typescript
export type Genero = "M" | "F";
export type Circuito = "amateur" | "profesional";
export type RolAtleta = "alumno" | "boxeador";
export type NivelTitulo = "ninguno" | "regional" | "nacional" | "continental" | "mundial";

export type EnfoqueEntrenamiento =
  | "noqueador"       // Potencia + Eficacia + Fuerza + Ataque
  | "estilista"       // Eficacia + Velocidad + Técnica + Defensa
  | "presion"         // Resistencia + Ataque + Eficacia + Velocidad
  | "maestroTactico"  // Defensa + Inteligencia + Mentalidad + Técnica
  | "dobleTurno"      // Fuerza + Resistencia + Velocidad + Eficacia (+35% ganancia, -6 energía)
  | "descansoSpa";    // +25 energía, +Mentalidad, +Inteligencia

export type InstruccionEsquina = "presionar" | "distancia" | "buscarNocaut" | "recuperarAire";

export interface AtributosBoxeador {
  // Pilar Físico
  fuerza: number;
  velocidad: number;
  potencia: number;
  resistencia: number;
  // Pilar Técnico
  ataque: number;
  defensa: number;
  tecnica: number;
  eficacia: number; // Precisión de impacto (0-99)
  // Pilar Mental
  inteligencia: number;
  mentalidad: number;
  talento: number;  // Techo y velocidad de aprendizaje (0-99)
}

export interface RegistroPeleaHistorial {
  id: string;
  rivalNombre: string;
  rivalNivel: number;
  resultado: "victoria" | "derrota" | "empate";
  metodo: "KO" | "DecisionUnanime" | "DecisionDividida";
  asaltos: number;
  bolsa: number;
  tituloEnJuego: NivelTitulo;
  semana: number;
  anio: number;
}

export interface Boxeador extends AtributosBoxeador {
  id: string;
  nombre: string;
  apodo?: string;
  genero: Genero;
  edad: number;
  division: string;
  rol: RolAtleta;
  circuito: Circuito;
  elite: boolean;
  enfoque: EnfoqueEntrenamiento;
  energia: number; // 0 - 100
  ganadas: number;
  perdidas: number;
  empates: number;
  nocauts: number;
  tituloActual: NivelTitulo;
  defensasTitulo: number;
  guanteosPrevios: number; // 0 - 10 para fogueo previo
  rasgoEspecial: string | null;
  tonoPiel: string;
  colorPantalon: string;
  colorPelo: string;
  semanasEntrenadas: number;
  suspensionMedicaSemanas: number; // Descanso obligatorio tras KO (0-2)
  historialPeleas: RegistroPeleaHistorial[];
}

export type TipoPersonal =
  | "asistente"
  | "preparador"
  | "directorTecnico"
  | "representante"
  | "jefeDifusion"
  | "gerenteSucursal";

export interface Empleado {
  id: string;
  tipo: TipoPersonal;
  nombre: string;
  sueldoMensual: number;
  sucursalAsignadaId?: string;
}

export type CategoriaEquipamiento = "entrenamiento" | "indumentaria" | "salud" | "difusion";

export interface ArticuloMercado {
  id: string;
  nombre: string;
  categoria: CategoriaEquipamiento;
  costo: number;
  descripcion: string;
  beneficioTexto: string;
  iconoClave: string;
  desbloqueado: boolean;
}

export interface OfertaRivalMatchmaking {
  id: string;
  tipo: "accesible" | "parejo" | "desafio";
  boxeador: Boxeador;
  bolsaGarantizada: number;
  saltoRankingEstimado: number;
  riesgoTexto: string;
}

export interface TarjetaJuez {
  juezId: number;
  puntosAtletaA: number;
  puntosAtletaB: number;
  desgloseAsaltos: { asalto: number; scoreA: number; scoreB: number }[];
}

export interface ResultadoCombate {
  peleaId: string;
  ganadorId: string;
  metodo: "KO" | "DecisionUnanime" | "DecisionDividida" | "Empate";
  asaltoFinal: number;
  bolsaCobrada: number;
  tituloGanado: NivelTitulo;
  tarjetas: TarjetaJuez[];
  estadisticasCompuBox: {
    jabsLanzadosA: number; jabsConectadosA: number;
    poderLanzadosA: number; poderConectadosA: number;
    jabsLanzadosB: number; jabsConectadosB: number;
    poderLanzadosB: number; poderConectadosB: number;
  };
}

export interface BalanceSemanalDetalle {
  ingresosCuotasAlumnos: number;
  ingresosSucursales: number;
  ingresosMarcaRopa: number;
  ingresosEventosClub: number;
  ingresosBolsasPremios: number;
  gastosAlquiler: number;
  gastosSueldosPersonal: number;
  gastosMantenimiento: number;
  balanceNeto: number;
  famaGanada: number;
  resumenNotas: string[];
}

export interface GameState {
  versionEsquema: number; // 2
  creado: boolean;
  nombreEntrenador: string;
  nombreGimnasio: string;
  dinero: number;
  fama: number; // 0 - 100
  diaSemana: number; // 1=Lunes a 7=Domingo
  semana: number;
  mes: number;
  anio: number;
  legadosCompletados: number;
  plantel: Boxeador[];
  rivalesPool: Boxeador[];
  personal: Empleado[];
  equipamientoComprado: string[];
  cursosCompletados: string[];
  propiedadesAdquiridas: string[];
  marcaRopaNombre: string | null;
  patrocinioActivo: { marca: string; semanal: number; semanasRestantes: number } | null;
  carteleraSabado: { atletaId: string; rival: Boxeador; bolsa: number; titulo: NivelTitulo }[];
  combateEnVivo: any | null;
  balanceSemanalActual: BalanceSemanalDetalle | null;
  notificaciones: { id: string; titulo: string; remitente: string; texto: string; diasRestantes: number; tipo: string; accion?: any }[];
  registroHistorialEventos: string[];
  sonidoActivado: boolean;
}
```

---

## 2. ECUACIONES MATEMÁTICAS EXACTAS DEL MOTOR

### 2.1. Cálculo de Valoración General (Nivel Global)
$$\text{ValoracionGlobal} = \text{round}\Big( \text{Fuerza}\times 0.10 + \text{Velocidad}\times 0.10 + \text{Potencia}\times 0.11 + \text{Resistencia}\times 0.09 + \text{Ataque}\times 0.12 + \text{Defensa}\times 0.11 + \text{Tecnica}\times 0.11 + \text{Eficacia}\times 0.12 + \text{Inteligencia}\times 0.05 + \text{Mentalidad}\times 0.05 + \text{Talento}\times 0.04 \Big)$$

### 2.2. Modificadores Microscópicos por División de Peso
Para evitar que un peso Minimosca y un peso Completo se sientan idénticos:
- **Divisiones Ligeras (Minimosca a Pluma):** $+15\%$ volumen de golpes por asalto, $+10\%$ velocidad base, $-10\%$ daño de impacto.
- **Divisiones Medias (Ligero a Wélter):** Valores neutros de referencia ($1.00\times$).
- **Divisiones Pesadas (Medio a Completo):** $+20\%$ daño de impacto por golpe, $+15\%$ probabilidad de crítico de nocaut, $-12\%$ volumen de golpes por asalto.

### 2.3. Ecuación de Ganancia en Entrenamiento Semanal
Para cada uno de los 4 atributos del combo de entrenamiento seleccionado:
$$\Delta \text{Atributo} = 0.45 \times \left(0.60 + \frac{\text{Talento}}{150}\right) \times M_{\text{Equipamiento}} \times M_{\text{Personal}} \times \left(\frac{\text{Potencial} - \text{AtributoActual} + 15}{65}\right) \times \text{rand}(0.85, 1.15)$$
- **Multiplicador de Doble Turno ($M_{\text{DobleTurno}}$):** $1.35\times$
- **Desgaste de Energía:** $-3$ puntos (sesión normal) o $-6$ puntos (doble turno). Si la energía es $<40$, el atleta pasa a régimen regenerativo (+0.08 ganancia, +12 energía).

### 2.4. Ecuación de Probabilidad de Impacto en Combate
$$P_{\text{Acierto}} = \text{clamp}\left( 0.50 + \frac{\text{Ataque}_{\text{Atk}} + 1.5\times\text{Eficacia}_{\text{Atk}}}{500} - \frac{\text{Defensa}_{\text{Def}} + \text{Tecnica}_{\text{Def}}}{500} + M_{\text{InstruccionAtk}} - M_{\text{InstruccionDef}}, \; 0.15, \; 0.92 \right)$$

### 2.5. Ecuación de Daño Diferenciado (Jab vs Golpe de Poder)
$$\text{DañoBase} = \left(\text{Fuerza}\times 0.40 + \text{Potencia}\times 0.60\right) \times 0.14 \times \left(0.50 + 0.50 \times \frac{\text{EnergiaAtk}}{100}\right) \times M_{\text{Instruccion}} \times M_{\text{TipoGolpe}} \times M_{\text{Critico}}$$
- **Jab Preparatorio ($M_{\text{TipoGolpe}} = 0.55$):** Suma puntos limpios en las tarjetas y desgasta guardia.
- **Golpe de Poder ($M_{\text{TipoGolpe}} = 1.30$):** Cross, Gancho o Uppercut de daño real.
- **Golpe Crítico ($M_{\text{Critico}} = 1.85$):** Probabilidad $\propto \frac{\text{Potencia}}{900} + \frac{\text{Eficacia}}{1000}$.
- **Castigo al Cuerpo:** Drena $-4$ de estamina y reduce $5\%$ la velocidad del rival durante el asalto.

### 2.6. Algoritmo de Calificación de los 3 Jueces (Sistema de 10 Puntos Obligatorios)
$$\text{PuntajeRendimiento} = \text{GolpesConectados}\times 1.2 + \text{DañoTotal}\times 0.8 + \text{Eficacia}\times 0.5$$
- **Criterio de Tarjeta:**
  - 1 caída a la lona (Knockdown): **10 - 8** para el agresor.
  - 2 caídas a la lona: **10 - 7**.
  - Sin caídas: **10 - 9** para el mayor puntaje (o 10-10 en empate microscópico).
- **Regla de Desempate Titular:** En caso de empate oficial por puntos en una pelea por campeonato, el campeón reinante retiene el cinturón.

### 2.7. Algoritmo BoxRec Elo de Subida de Ranking
$$\Delta \text{RankingScore} = 12 \times \left( S - \frac{1}{1 + 10^{(\text{ScoreRival} - \text{ScorePropio})/400}} \right) \times M_{\text{Metodo}}$$
- $S = 1$ (victoria), $0$ (derrota), $0.5$ (empate).
- $M_{\text{Metodo}} = 1.30$ (victoria por KO) o $1.00$ (victoria por decisión).

---

## 3. FINANZAS SEMANALES Y FORMULACIÓN DE INGRESOS/GASTOS

1. **Cuotas de Alumnos (Semanal):** $\text{IngresoCuotas} = N_{\text{Alumnos}} \times \left(\$18 + \text{NivelGimnasio} \times \$6\right)$
2. **Eventos Comunitarios del Club:**
   - 🎟️ Gran Bingo Familiar ($200 costo): Recauda $\$200 + \text{Fama}\times \$14 + \text{randInt}(150, 450)$.
   - 🃏 Torneo de Juegos de Mesa ($100 costo): Recauda $\$100 + \text{Fama}\times \$8 + \text{randInt}(80, 250)$.
   - 🍕 Festival Comunitario ($500 costo): Recauda $\$500 + \text{Fama}\times \$25 + \text{randInt}(300, 800) + 3\text{ Fama}$.
3. **Ingresos de Franquicias (Sucursales con Gerente):**
   $$\text{IngresoSucursal} = \$650 + \text{Fama}\times \$8 \quad (\approx \$750 \text{ a } \$1.450/\text{sem por sucursal})$$
4. **Ventas de Marca de Ropa:**
   $$\text{VentaRopa} = \text{round}\Big( \text{Fama}\times 2.8 \times (1.8 \text{ si hay Jefe de Difusión}) \Big)$$

---

## 4. BLINDAJE DE RUNTIME Y PERSISTENCIA

```typescript
export function sanitizarEstado(guardado: any): GameState {
  if (!guardado || typeof guardado !== "object") return estadoInicialVacio();
  return {
    ...estadoInicialVacio(),
    ...guardado,
    versionEsquema: 2,
    plantel: (guardado.plantel || guardado.roster || []).map((b: any) => ({
      ...b,
      eficacia: b.eficacia ?? Math.round(b.tecnica * 0.95),
      guanteosPrevios: b.guanteosPrevios ?? (b.rol === "boxeador" ? 10 : 0),
      tituloActual: b.tituloActual ?? (b.campeon ? "regional" : "ninguno"),
      defensasTitulo: b.defensasTitulo ?? 0,
      suspensionMedicaSemanas: b.suspensionMedicaSemanas ?? 0,
      historialPeleas: b.historialPeleas ?? [],
      enfoque: b.enfoque ?? "estilista",
    })),
    personal: guardado.personal || guardado.staff || [],
    sonidoActivado: guardado.sonidoActivado ?? true,
  };
}
```
