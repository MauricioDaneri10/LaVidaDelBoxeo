# Gate 28 — Insolvencia, nómina y recuperación

**Fecha:** 2026-09-23\
**Estado:** límite contra espiral financiera implementado; recuperación leve probada; carrera con insolvencia severa aún requiere decisión de producto. No habilita playtest final.

## Alcance

Validar qué ocurre si el jugador contrata personal con ingresos recurrentes insuficientes, entra en caja negativa, pide el préstamo de emergencia, deja de cargar nómina innecesaria y trata de recuperarse mediante las recaudaciones disponibles. Se mantuvo la fuente única del libro semanal y se verificó que los cambios de caja siguen conciliando.

## Corrección de raíz implementada

Antes, el costo semanal por caja negativa era `max($10, ceil(3% × deuda))`. Al crecer la deuda, el propio cargo escalaba sin límite; en una simulación determinista de nómina temprana el saldo pasó de −$2.450 en la semana 12 a −$20.249 en la semana 52.

Ahora el cargo es `clamp(ceil(3% × deuda), $10, $50)` y la proyección semanal usa exactamente la misma regla. La tasa conserva una consecuencia visible para saldos pequeños/medianos, pero el componente financiero no aumenta sin límite solo por el tamaño de la deuda. El cambio no borra la deuda ni entrega dinero.

## Resultados reproducibles a semilla 260923

| Escenario | Antes de Gate 28, fin S12 / S52 | Después, fin S12 / S52 | Resultado |
|---|---:|---:|---|
| Nómina temprana (entrenador; asistente y preparador desde S2), sin recaudación | −$2.474 / −$20.249 | **−$2.450 / −$10.842** | Mejora sustancial; sigue siendo una estrategia insostenible y no se rescata sola |
| Entrenador + naipes cada semana | $133 / −$6.350 | **$133 / −$4.951** | Cargo acotado, pero esta estrategia sigue agotando caja |
| Base sin personal/recaudación | $600 / $1.800 | $600 / $1.800 | Sin cambio |
| Entrenador + bingo semanal | $1.295 / $3.831 | $1.295 / $3.831 | Se mantiene solvente bajo esta semilla |

Las cifras derivan del test exacto de seis escenarios de Gate 27, con las mismas condiciones y horizonte; no son una promesa para todas las semillas ni para toda la economía del juego.

## Playtest automatizado de recuperación leve

Escenario controlado: caja inicial −$143; se toma el préstamo disponible una vez, se agenda bingo únicamente cuando hay capital suficiente, se avanza y liquida durante 12 semanas. El test confirma que al final:

- el préstamo queda totalmente amortizado y no se cobra dos veces;
- la caja regresa a **$0 o más**;
- cada inversión y retorno se registra en el balance semanal;
- el límite del costo financiero también tiene cobertura propia para deuda pequeña ($10) y muy grande ($50).

Esto demuestra una ruta de salida en una crisis acotada, no en una bancarrota profunda.

## Riesgo residual y punto de decisión

El escenario de nómina temprana termina el año en **−$10.842**. Aunque se despida luego al personal, no existe un mecanismo para eliminar ese principal acumulado. El préstamo de $500 no aporta capital suficiente y todas las recaudaciones requieren inversión inicial; un jugador profundamente insolvente puede quedar bloqueado. El tope evita que el cargo crezca indefinidamente, pero no inventa una solución operativa donde no hay fondos.

Para cerrar esta rama hay que decidir una regla de producto con controles anti-exploit: rescate excepcional con penalización y tope de carrera, reestructuración de deuda, liquidación/cierre con reinicio conservando legado, o que el jugador evite la insolvencia mediante avisos y despido. No implementar un rescate grande sin esa decisión: convertiría una penalización legible en una fuente de capital repetible o podría neutralizar las decisiones de nómina.

## Archivos tocados

- `src/game/state.tsx`: aplica el techo de $50 al movimiento real del cierre semanal.
- `src/game/engine.ts`: usa el mismo techo en la previsión de caja.
- `src/game/game.test.ts`: casos del mínimo/máximo, recuperación leve en 12 semanas y nuevas curvas exactas de deuda a 12/52 semanas.
- Documentos canónicos y handoff actualizados para no describir como vigente la fórmula sin límite.

## Verificación

`npm run verify`: **PASS** — TypeScript PASS; **49/49 tests PASS**; build PASS; JS **485.2/560 KiB**, CSS **70.5/90 KiB**; auditoría estructural **0 errores / 0 advertencias**. `git diff --check`: PASS.

## Siguiente fase

**Gate 29 — decidir y probar la respuesta a insolvencia severa.** Antes de código adicional, escoger una política entre las alternativas anteriores. Medir tres tamaños de deuda y abuso intencional, persistencia/recarga a mitad del plan, costos de nómina, acceso a recaudaciones y salidas a 12/26/52 semanas. El test debe demostrar tanto una recuperación posible como que no es una estrategia rentable para conseguir dinero gratis.
