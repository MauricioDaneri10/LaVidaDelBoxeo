# Gate 25 — Calendario y ciclo de vida de eventos

**Fecha:** 2026-09-23\
**Estado:** implementado y verificado; no habilita todavía el playtest final.

## Alcance

Revisar la coherencia entre avance diario, vencimiento de avisos, agenda del club y visibilidad de eventos. No se modificó ni se usó una partida guardada del jugador.

## Hallazgos confirmados

1. **El plazo de eventos nuevos se reducía al aparecer.** En el avance del segundo día, el motor generaba propuestas y después descontaba un día a todos los eventos. Por lo tanto, una propuesta configurada para cuatro días aparecía con tres.
2. **El calendario ocultaba el contenido de los eventos.** Solo mostraba un contador; el jugador debía descubrir sus títulos y plazos en el Panel del Club.
3. **Las actividades sociales siguen un flujo distinto y consistente:** se agendan para el domingo, se refleja su inversión al programarlas y el balance semanal liquida sus dividendos. Las peleas pactadas se ejecutan el sábado en el modelo actual.

## Cambios realizados

- El paso diario ahora envejece y elimina primero los eventos preexistentes; los eventos nuevos se agregan después y conservan el plazo completo mientras se muestran por primera vez.
- Calendario ahora enumera los eventos activos con título, origen, texto y días restantes, e indica que las decisiones se gestionan desde el Panel del Club. El estado vacío también explica dónde aparecerán las propuestas.
- Se añadió una prueba de regresión determinista: valida que un evento anterior pierde exactamente un día, que una propuesta recién creada conserva su plazo configurado y que el caso no depende de un resultado aleatorio concreto.

## Verificación

- `npm run verify`: **aprobado**.
- TypeScript: sin errores.
- Tests: **43/43 aprobados**.
- Build de producción: aprobado.
- Límites de bundle: JS 485.0 KiB / 560 KiB; CSS 70.5 KiB / 90 KiB.
- Auditoría estructural: **0 errores, 0 advertencias**.

## Límites conocidos y siguiente gate

- El calendario documenta eventos y plazos, pero las decisiones continúan en el Panel del Club; no se duplican controles para evitar dos fuentes de acción.
- `venceEn` es un contador de días de juego, no una fecha civil persistida. Se presenta como “N d” para no fingir una fecha exacta.
- La agenda de peleas es semanal y sus combates se resuelven el sábado; los eventos sociales se resuelven el domingo. Si se decide permitir fechas libres/multisemana, requerirá un cambio de modelo y pruebas propias, no solo de presentación.

**Propuesta de continuación:** gate de economía de ingresos variables y deuda: verificar frecuencia, rentabilidad neta, capacidad de elección estratégica, insolvencia y persistencia de préstamos mediante pruebas de escenarios largos. Esperar confirmación del usuario antes de iniciar ese gate.
