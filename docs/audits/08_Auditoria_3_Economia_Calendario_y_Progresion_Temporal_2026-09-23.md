# Auditoría 3 — Economía, calendario y progresión temporal

**Proyecto:** La Vida del Boxeo  
**Fecha:** 23 de septiembre de 2026  
**Alcance:** ingresos, gastos, saldo, libros, fama, seguidores, alumnos recreativos, personal, eventos, calendario, peleas, licencias, profesionalización, títulos, envejecimiento, retiros y simulación a largo plazo.  
**Estado:** auditoría realizada; correcciones pendientes.

## 1. Veredicto

El ciclo semanal funciona y es entendible, pero la economía todavía no tiene una única fuente contable y la progresión temporal está incompleta para una partida larga. El problema principal no es que falten números: es que algunos números se generan en lugares distintos y no todos quedan conectados al saldo, al libro, a las estadísticas y al calendario de la misma manera.

| Área | Estado | Severidad | Resultado |
|---|---:|---:|---|
| Avance diario/semanal | Amarillo | P1 | Funciona, pero el calendario tiene fuentes duplicadas. |
| Ingresos y gastos | Rojo | P0/P1 | Algunas operaciones no entran al ledger ni al resultado histórico. |
| Proyección | Amarillo | P1 | No representa todos los ingresos seguros o variables. |
| Fama | Amarillo | P1 | El equipamiento puede sumar fama semanal indefinidamente. |
| Seguidores | Amarillo | P1 | La métrica nunca baja aunque el cálculo contemple derrotas. |
| Recreativos | Verde/amarillo | P2 | El contador funciona, pero falta vincularlo mejor a capacidad y satisfacción. |
| Peleas y bolsas | Amarillo | P1 | La bolsa depende del récord, pero falta negociación real y agenda flexible. |
| Progresión amateur/pro | Amarillo | P1 | Hay promoción automática, sin decisión explícita del jugador. |
| Títulos | Amarillo | P2 | Hay requisitos, pero falta integrar ranking, calendario y oportunidades. |
| Envejecimiento/retiros | Rojo | P1 | No existe ciclo de retiro y renovación de rivales. |
| Eventos | Amarillo | P1 | Hay variedad y vencimiento, pero algunos efectos contables son incompletos. |
| Partida larga | Amarillo | P1 | Hay test de 120 semanas, pero no cubre economía reconciliada ni generaciones. |

## 2. Flujo temporal observado

El juego tiene:

- días 1 a 5 de preparación;
- sábado de guanteo o pelea;
- domingo de balance;
- cierre del domingo que inicia la siguiente semana;
- entrenamiento semanal;
- recuperación dominical;
- eventos generados principalmente el martes;
- promoción a profesional al cierre semanal.

Esto da un loop claro, pero hay decisiones temporales que están implícitas y deberían estar formalizadas:

- el día exacto de una pelea se fuerza a sábado;
- el mes se incrementa cada cuatro semanas;
- el calendario visual calcula fechas reales con otra fórmula;
- el envejecimiento ocurre por semanas acumuladas, pero no existe retiro;
- los eventos vencen por contador, no por fecha canónica;
- la agenda no es todavía la fuente de verdad de las actividades.

## 3. Hallazgos económicos

### C1 — El resultado neto histórico no incluye todos los gastos

**Severidad:** P0/P1.

Comprar equipo, cursos, propiedades, actividades sociales, reparaciones y contratar personal modifica dinero, pero no actualiza de forma consistente stats.resultadoNeto ni un ledger único.

**Consecuencia:** el jugador puede gastar mucho y luego ver un “neto histórico” que parece positivo porque solo registra cierres semanales, peleas y algunas operaciones.

**Solución:** todo movimiento debe pasar por una función contable atómica. El resultado neto debe representar ingresos menos gastos reales, incluyendo inversiones y compras, con categorías separadas.

**Test:** realizar una secuencia de compras, contratación, evento, pelea y cierre; la suma de todos los movimientos debe coincidir con la diferencia entre caja inicial y final.

### C2 — La proyección semanal no coincide con el balance real

**Severidad:** P1.

proyeccionSemanal incluye cuotas de alumnos activos, aporte del plantel federado, subsidio inicial, patrocinio, alquiler y sueldos. No incluye:

- cuotas recreativas;
- ingresos de sucursales;
- ventas de marca;
- eventos sociales ya agendados;
- veladas;
- exhibiciones;
- gastos financieros por saldo negativo;
- otros ingresos variables que el balance sí puede ejecutar.

Aunque se la presenta como conservadora, el jugador necesita distinguir “ingreso seguro”, “ingreso probable” e “ingreso variable”, no recibir una proyección que parece contradicha por el domingo.

**Solución:** crear tres bloques contables:

- confirmado;
- probable;
- oportunidad/riesgo.

El balance debe consumir el mismo servicio de cálculo que la proyección.

### C3 — Algunas operaciones registran dinero sin registrar movimiento

**Severidad:** P1.

Las acciones de tipo dinero de eventos suman saldo y no agregan línea de ingresos. La colecta suma el neto como ingreso sin registrar separadamente su costo. La velada registra el neto de entradas, no ingresos brutos y costos.

**Solución:** cada acción debe registrar ingreso, gasto o inversión por separado. El resumen puede mostrar neto, pero el detalle debe explicar ambos lados.

**Test:** ningún cambio de dinero permitido por el reducer puede dejar saldo diferente al ledger.

### C4 — El costo de saldo negativo existe, pero no hay política de deuda

**Severidad:** P1.

La caja puede quedar negativa y se aplica un costo financiero semanal mínimo. No existe límite de deuda, préstamo explícito, embargo, bloqueo de compras, patrocinio de emergencia ni condición de recuperación.

**Riesgos:**

- el jugador puede permanecer indefinidamente en negativo;
- el costo mínimo puede ser irrelevante frente a ingresos de veladas, sucursales o títulos;
- no se informa cuándo la deuda afecta decisiones futuras.

**Solución:** definir estados de caja: saludable, ajustada, negativa y crítica. En estado crítico deben activarse consecuencias comprensibles: prioridad de gastos, imposibilidad de nuevas inversiones, préstamo limitado o reestructuración.

### C5 — La fama de equipamiento se cobra semanalmente de forma indefinida

**Severidad:** P1.

Cada domingo carteles, marquesina y vitrina vuelven a sumar fama. Si se compran varios objetos, la fama crece automáticamente todas las semanas sin necesidad de actividad del club.

**Consecuencia:** se llega a fama alta sin que el jugador tome decisiones y se desbloquean seguidores, nivel, sponsors y oportunidades demasiado rápido.

**Solución:** separar efectos permanentes, bonus de lanzamiento y reputación recurrente con rendimiento decreciente. Un cartel puede dar boca a boca; la instalación puede otorgar un bonus inicial y luego un incremento menor condicionado a actividad.

**Test:** simular 52 semanas con el mismo equipamiento y medir fama, seguidores, eventos y desbloqueos. El ritmo debe ser gradual y documentado.

### C6 — Los seguidores nunca disminuyen

**Severidad:** P1.

El objetivo de seguidores considera victorias y derrotas, pero se aplica con Math.max. Por lo tanto, una derrota o una mala etapa nunca reduce seguidores acumulados.

**Solución:** distinguir seguidores acumulados históricos de seguidores activos. La métrica visible debe poder subir y bajar; el histórico puede conservar el máximo. Entrevistas, derrotas, inactividad y campeonatos deben afectar la audiencia de forma explicable.

**Test:** construir una racha positiva y luego una racha negativa; comprobar que seguidores activos bajan sin borrar el máximo histórico.

### C7 — La economía de recreativos no usa una capacidad claramente explicada

**Severidad:** P2.

El contador recreativo aporta ingresos, sube o baja según fama y derrotas, y no muestra nombres ni fichas, lo cual coincide con el diseño. Sin embargo, tiene máximo 12 fijo y no se conecta explícitamente con cupos, asistentes, instalaciones o satisfacción.

**Solución:** definir capacidad recreativa independiente, modificadores de instalaciones y una razón visible para alta o baja. Mantenerlos fuera del plantel competitivo.

### C8 — Las compras no tienen impacto histórico uniforme

**Severidad:** P1.

Equipo, cursos, propiedades y personal reducen la caja, pero no todos afectan resultado neto, estadísticas ni proyección del mismo modo. Esto hace difícil evaluar qué inversión conviene primero.

**Solución:** cada compra debe declarar costo inicial, gasto recurrente, ingreso recurrente, efecto deportivo, efecto reputacional y tiempo de retorno.

**Test:** una tabla de retorno de inversión para cada ítem de mercado y curso, calculada por el mismo motor que usa el juego.

## 4. Hallazgos de calendario y agenda

### C9 — El mes del estado no coincide necesariamente con la fecha calculada

**Severidad:** P1.

cerrarDomingo incrementa mes cada cuatro semanas, mientras TopBar y CalendarView calculan una fecha real desde 1 de enero de 2026 más semanas. Cuatro semanas no equivalen siempre a un mes del calendario.

**Consecuencia:** después de varias semanas el encabezado, el calendario, los eventos y los datos guardados pueden mostrar meses diferentes.

**Solución:** elegir una fuente canónica. Recomendación: fecha real como fuente, con día/semana derivados. Crear calendarService para todas las vistas y eventos.

**Test:** semana 1, semana 5, cambio de febrero, cambio de año y 120 semanas, comparando TopBar, Calendario y estado.

### C10 — Las peleas no usan realmente una agenda flexible

**Severidad:** P1.

Pelea tiene semanaProgramada y diaProgramado, pero ELEGIR_OFERTA fija el día 6 y la interfaz actual trabaja con cartelera del sábado. La idea de pactar una pelea para otra fecha todavía no está implementada como decisión jugable.

**Solución:** agenda con fecha válida, preparación, descanso, confirmación de bolsa y cancelación. El sábado puede ser la frecuencia por defecto, no una obligación rígida.

### C11 — Eventos y actividades no comparten un calendario operativo único

**Severidad:** P1.

Eventos telefónicos, comunitarios, veladas y peleas viven en campos separados. CalendarView los combina para mostrarlos, pero la lógica de disponibilidad y vencimiento sigue repartida.

**Solución:** crear AgendaItem común con tipo, inicio, fin, estado, costo, ingreso esperado y acción asociada. La vista y el motor deben consumir la misma agenda.

### C12 — El tiempo avanza por acciones correctas, pero falta un resumen diario consistente

**Severidad:** P2.

Existe transición visual de día y balance semanal, pero no existe un resumen diario de entrenamientos, recuperaciones, eventos vencidos, decisiones pendientes y recomendaciones.

**Solución:** registrar un DailyReport efímero o persistente corto y mostrarlo al avanzar cuando hubo consecuencias relevantes.

## 5. Hallazgos de progresión

### C13 — No existe retiro ni renovación de rivales

**Severidad:** P1.

Los pugiles envejecen en el plantel, pero no hay una política de retiro por edad, inactividad, récord o salud. Los rivales iniciales se mantienen y no nacen nuevas generaciones.

**Consecuencia:** el ranking mundial no representa un ecosistema vivo después de años.

**Solución por etapas:**

1. edad y estado de carrera;
2. probabilidad de retiro;
3. reemplazo procedural de rivales;
4. historial y Salón de la Fama;
5. límites de población para evitar saturación.

### C14 — El paso a profesional es automático

**Severidad:** P1 de diseño.

Al llegar a 50 peleas amateur y existir cupo, el boxeador pasa automáticamente a profesional. Esto contradice la posibilidad de que el entrenador quiera seguir compitiendo o formando al pugil antes de dar el salto.

**Solución:** al cumplir requisitos, mostrar decisión: promover ahora, mantener amateur o reservar la decisión. El paso debe registrar fecha, licencia y consecuencias económicas.

### C15 — Licencia, guanteos y progresión no están representados como una línea de carrera completa

**Severidad:** P2.

Los guanteos siguen sumando entrenamiento y pueden seguir haciéndose, lo cual es correcto. Falta explicitar estados:

- alumno recreativo;
- alumno en formación;
- pugil amateur con licencia;
- pugil profesional;
- contendiente;
- campeón;
- veterano;
- retirado.

Cada estado debe definir qué puede hacer, cuánto cobra, qué riesgos tiene y qué pasa si el jugador no toma la siguiente decisión.

### C16 — Ranking y títulos no evolucionan con calendario y población

**Severidad:** P1.

El ranking calcula puntos actuales a partir de atributos, récord, KOs y títulos, pero no hay historial de posiciones, actividad de rivales ni movimientos generacionales. Los títulos aparecen como oferta cuando se cumplen requisitos, pero no existe una agenda de oportunidades ni campeones que defiendan o pierdan cinturones fuera del jugador.

**Solución:** ranking por temporada, actividad mínima, puntos por resultado, defensa de títulos, vacantes y rivales que también progresan.

### C17 — La recompensa y la fama pueden acelerar demasiado la progresión

**Severidad:** P1.

Fama, equipamiento, eventos, entrevistas, veladas, títulos, consejos y seguidores alimentan varios desbloqueos. Sin un presupuesto de fama por semana y sin rendimientos decrecientes, el jugador puede abrir demasiados sistemas en pocas semanas.

**Solución:** definir curvas por fase de carrera:

- barrio;
- club competitivo;
- circuito regional;
- promotora;
- expansión.

Cada recompensa debe tener un valor y una frecuencia máxima.

## 6. Tests inteligentes de economía y tiempo

### Simulaciones

- [ ] 12 semanas sin compras.
- [ ] 12 semanas comprando solo equipamiento.
- [ ] 12 semanas contratando todo el personal posible.
- [ ] 52 semanas con veladas.
- [ ] 52 semanas con derrotas.
- [ ] 52 semanas con victorias.
- [ ] 120 semanas con guardado/carga cada 10 semanas.
- [ ] 10 pugiles amateur con cupo lleno.
- [ ] 10 profesionales con cupo lleno.
- [ ] 50 peleas amateur y decisión de profesionalizar.
- [ ] 25 peleas profesionales y camino a títulos.
- [ ] retiro y reemplazo de rivales.
- [ ] caja positiva, cero, negativa y crítica.

### Invariantes

- [ ] saldo final = saldo inicial + ingresos - gastos;
- [ ] resultado neto histórico incluye inversiones;
- [ ] ninguna fama supera 100 ni baja de 0;
- [ ] seguidores activos y máximo histórico están diferenciados;
- [ ] un evento se cobra una sola vez;
- [ ] una actividad social no se agenda dos veces;
- [ ] una pelea ocupa una sola fecha;
- [ ] un pugil no supera cupo amateur/profesional;
- [ ] el envejecimiento ocurre una vez por año;
- [ ] retiro libera cupo;
- [ ] un cinturón no se duplica por recargar;
- [ ] el calendario es idéntico en todas las vistas.

## 7. Plan de solución

### Fase 1 — Ledger económico

Crear movimientos atómicos y reconciliación de caja, resultado neto, libros y resumen.

### Fase 2 — Proyección honesta

Separar confirmado, probable y variable. Reutilizar el mismo cálculo en encabezado, calendario y balance.

### Fase 3 — Reputación y audiencia

Separar fama actual, fama histórica, seguidores activos y máximo de seguidores. Aplicar rendimientos decrecientes.

### Fase 4 — Calendario único

Crear servicio de fechas y agenda común para peleas, eventos, veladas, actividades y vencimientos.

### Fase 5 — Carrera y generaciones

Implementar retiro, reemplazo procedural, decisión amateur/profesional, temporadas de ranking y Salón de la Fama histórico.

### Fase 6 — Balance de progresión

Simular múltiples estilos de jugador y verificar que siempre existan decisiones estratégicas de gasto.

## 8. Criterios de cierre

Esta auditoría no se considera cerrada hasta que:

1. ningún gasto o ingreso quede fuera del ledger;
2. el resultado neto explique toda la variación de caja;
3. la proyección use la misma fuente que el balance;
4. fama y seguidores no crezcan de forma automática sin límite práctico;
5. la fecha sea única y consistente;
6. la agenda pueda manejar eventos y peleas sin campos paralelos;
7. exista retiro y renovación de población;
8. profesionalizar sea una decisión del jugador;
9. el ranking cambie con resultados y actividad;
10. las simulaciones de 52 y 120 semanas pasen todos los invariantes.

## 9. Conclusión

La economía tiene suficientes sistemas para ser interesante, pero todavía no están conectados con una contabilidad única. El calendario muestra la intención correcta, pero aún no es el motor central del tiempo. La progresión inicial funciona; la progresión de largo plazo todavía necesita generaciones, retiros, temporadas y decisiones de profesionalización.

La prioridad de implementación queda fijada así:

1. ledger y resultado neto;
2. calendario y agenda única;
3. fama/seguidores con ritmo controlado;
4. proyección económica completa;
5. profesionalización elegible;
6. retiro y renovación de rivales;
7. ranking histórico y títulos dinámicos.

