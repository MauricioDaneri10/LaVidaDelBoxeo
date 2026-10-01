# Gate 29 — Decisión de diseño: insolvencia severa

**Fecha:** 2026-09-23\
**Estado:** auditoría comparativa completada; opción E aprobada por el propietario y especificación preservada confirmada (“Solo récord e hitos históricos”). La implementación y verificación están registradas en Gate 30.

## Pregunta

¿Qué debe ocurrir si una mala gestión deja al club con deuda que ya no puede amortizar? Gate 28 probó que el costo financiero sin tope llevaba la nómina temprana a −$20.249 en un año; el tope de $50 reduce ese saldo a −$10.842, pero la caja no se recupera automáticamente. Un préstamo fijo de $500 no alcanza a cubrir ese hueco, y el juego exige fondos antes de invertir en recaudaciones.

## Requisitos no negociables

1. La deuda no debe crecer matemáticamente sin límite por su propio cargo financiero.
2. El jugador debe entender el origen del déficit antes de contratar personal o invertir.
3. La respuesta no puede entregar una suma repetible ni hacer rentable gastar hasta quedar en crisis.
4. No se debe borrar progreso, plantel, títulos o historia sin aviso y decisión explícita.
5. Guardar/cargar a mitad de un plan no debe resetear el límite de uso, la deuda o el estado de insolvencia.

## Alternativas evaluadas

| Política | Recuperación profunda | Riesgo de abuso | Impacto al progreso | Complejidad |
|---|---|---|---|---|
| A. Rescate/subsidio de efectivo grande | Sí, si cubre principal y runway | Alto: gasto previo al rescate, activos retenidos, repetición por save/migración | Bajo si conserva carrera | Media/alta: límite persistente, castigo y auditoría anti-exploit |
| B. Reestructuración de deuda | Parcial; baja cuotas, no crea flujo operativo | Medio: préstamo permanente o refinanciación en bucle | Bajo/medio | Alta: calendario, interés, prioridad de pagos y persistencia |
| C. Cierre de club y nueva carrera | Sí, al terminar la carrera fallida | Bajo si realmente se pierden activos/caja y es confirmación explícita | Muy alto: se pierde el club operativo | Alta: cierre de partida, legado/historial y creación de nuevo save |
| D. Solo prevención y despido | Previene parte de los casos nuevos; no rescata deuda ya acumulada | Bajo | Bajo | Media: reglas de contratación, previsión y confirmación |
| E. Híbrida: prevención + cierre voluntario, sin rescate de efectivo | Sí como salida de carrera; no conserva la operación actual | Bajo | Alto pero transparente; récord/Salón de la Fama se preservan | Alta: cierre y reinicio con protección de historial |

## Evaluación con resultados actuales

- Escenario de nómina temprana sin recaudación: semana 12 **−$2.450**, semana 52 **−$10.842** tras limitar costo financiero.
- Entrenador con naipes semanales: semana 12 **+$133**, semana 52 **−$4.951**.
- Entrenador con bingo semanal: semana 12 **+$1.295**, semana 52 **+$3.831**.
- Recuperación leve probada: desde **−$143**, un préstamo de $500 (total $600 en 10 cuotas) y bingo cuando hay fondos; en 12 semanas el préstamo se liquida y la caja termina ≥ $0.
- El caso severo no puede organizar recaudación de inversión, y el préstamo existente no ofrece runway suficiente. Por tanto, no declarar que el sistema actual recupera toda deuda.

La recuperación leve comprueba una táctica para un descubierto pequeño; no es evidencia a favor de aumentar el préstamo hasta cinco cifras. Un rescate que salve −$10.842 necesitaría monto/penalidad/pérdida equivalentes y cobertura contra compras seguidas de rescate. Hacerlo en código sin regla aprobada sería inventar una mecánica económica de alto impacto.

## Recomendación

Adoptar **E — híbrida** en dos partes, previa aprobación:

1. **Prevención/advertencia:** antes de contratar, mostrar el salario semanal añadido y el resultado proyectado sin subsidios/eventos puntuales; si el flujo recurrente queda negativo, pedir confirmación explícita con el déficit estimado. No bloquear al jugador: debe poder asumir una inversión deportiva arriesgada con conocimiento del costo. Advertir de nuevo al cerrar si la nómina no se cubre.
2. **Sin rescate de efectivo:** conservar el préstamo pequeño ya existente para una crisis leve y el tope de costo financiero. Si el jugador decide terminar una carrera insolvente, cerrar esa partida mediante una acción claramente destructiva y confirmada; iniciar otra conserva solo la historia/logros permitidos por el sistema de Legado, no los activos ni dinero de la carrera fallida.

Esta política preserva decisión estratégica, no premia la insolvencia y evita fingir una recuperación imposible. No se puede completar Cierre de Club con seguridad hasta diseñar de forma explícita qué conserva el jugador (récord del entrenador, títulos e hitos) y qué pierde (caja, plantel activo, personal, propiedades, equipo, deuda y patrocinio), si el nombre/legado se hereda y cómo se evita borrar la partida accidentalmente.

## Decisión solicitada

Elegir una opción antes de implementar el flujo de insolvencia severa:

- **Recomendada: E.** Prevención con confirmación informada + cierre voluntario sin rescate monetario; definir qué historial pasa al legado.
- **A. Rescate limitado:** fijar monto máximo, número de usos por partida, costo y activos que se liquidan.
- **B. Reestructuración:** fijar plazo, costo total, condiciones y acciones bloqueadas.
- **C. Cierre/reinicio directo:** definir con exactitud qué estadísticas e historia sobreviven.
- **D. Sin reinicio especial:** avisos/despido y aceptar que la partida pueda quedar en bancarrota.

No se crea un sistema de monetización, assets, autenticación ni persistencia remota como parte de este gate.

## Siguiente paso (histórico; completado por Gate 30)

El dueño eligió E y confirmó “Solo récord e hitos históricos”. Gate 30 implementó y probó la regla económica en el reducer, UI y tests. Queda para Gate 31 verificar modal/teclado, persistencia con recarga y estrés en horizontes 12/26/52 semanas; no declarar habilitado el playtest final por este gate aislado.
