# BOX-13 — Calendario, eventos y acciones de agenda

**Fecha:** 2026-09-26\
**Estado:** correcciones de calendario aplicadas; reglas/build y E2E responsive PASS. QA integral y playtest del jugador siguen abiertos.\
**Alcance:** correspondencia de días/fechas, agenda semanal, decisiones de eventos, gestión de peleas programadas desde Calendario y geometría del canvas. No se alteró la política ni la economía de generación de eventos.

## Hallazgos

1. **Se ocultaba el guanteo del sábado:** la vista solo mostraba “Guanteo” cuando no existía ninguna actividad en toda la semana. Un evento del domingo hacía desaparecer una rutina propia del sábado.
2. **El resumen recomendaba pasos incorrectos:** mostraba “Resolver cartelera” todos los sábados, aun sin peleas, y “Preparar equipo” incluso el domingo de balance.
3. **La agenda era de consulta solamente:** no dejaba resolver un aviso ni gestionar peleas desde Calendario, pese a ser el lugar que reúne las actividades futuras.
4. **No había protección ante una baja accidental:** una acción directa de cancelación podía quitar una pelea sin confirmación explícita.
5. **El detalle podía desbordarse en 720p:** una tarjeta de agenda y su botón llegaban al borde inferior del panel. La geometría exterior seguía respetando el footer, pero el control quedaba parcialmente recortado dentro del área disponible.
6. **La tarjeta de domingo podía ser contradictoria:** mostraba “Balance” incluso cuando la casilla ya contenía una actividad comunitaria.

## Correcciones

- “Guanteo” se mantiene visible los sábados sin importar si hay eventos en otros días. “Balance” se muestra en domingo solo si no hay otro elemento ese día.
- “Próximo paso” depende del estado/día: revisar balance el domingo; resolver cartelera si hay peleas el sábado; guanteos si no las hay; atender aviso urgente próximo a vencer; preparar equipo o atender una actividad social cuando corresponda.
- Cada aviso activo expone sus opciones en la propia agenda. La selección despacha el mismo evento al reducer compartido del juego; Calendario y Panel del Club observan el mismo estado y no mantienen copias separadas.
- Las peleas agendadas muestran fecha, rival y bolsa. “Bajar pelea” abre confirmación; “Conservar” no muta el estado y “Sí, bajar pelea” despacha una única cancelación.
- Se compactó el grid semanal en ventanas de baja altura y se redistribuyó el espacio al panel de agenda. Los controles de decisión quedan enteros visibles en 1280×720; el panel conserva scroll interno cuando la lista crece.
- No se avanzó el día ni se alteró la partida del propietario: browser tests cargan localStorage sintético en contextos aislados.

## Validación y evidencia

- `npm run verify`: **PASS** — TypeScript; **70/70** pruebas unitarias; build; presupuesto; auditoría estructural con **0 errores y 0 advertencias**.
- `python scratch/test_box13_calendar.py`: **PASS** en **1280×720, 1440×900, 1024×600, 970×900 y 390×844**. Verifica siete días, fecha civil lunes-domingo, sábado guanteo con evento dominical, actividad en el domingo sin etiqueta contradictoria, aviso/plazo, próximo paso del domingo, footer visible y ausencia de scroll global.
- El E2E acepta una decisión del evento y comprueba que se retira de la agenda. Comprueba que el primer intento de baja no muta, que “Conservar” retiene la pelea y que la confirmación sí la quita y actualiza el contador.
- Screenshot revisado manualmente a 1280×720: `scratch/box13-calendar-1280x720.png`. El botón de evento queda completo dentro de la tarjeta y el footer MadArt Studios permanece visible.
- Build todavía imprime el aviso informativo de Vite por chunk JavaScript minificado de ~510 kB. El gate de presupuesto configurado pasa: JS 497.9/560 KiB y CSS 80.4/90 KiB.

## Pendientes / límites del dictamen

- Sigue pendiente decidir si los avisos que exceden el tope activo se descartan o esperan en cola persistente. BOX-13 no modifica ese contrato.
- La política para cancelar una pelea ya pactada no aplica penalidad económica ni reputacional; solo se pide confirmación y se retira de la agenda. Si el diseño exige costo/efecto, debe definirse antes de cambiar la regla.
- Cierre, foco y teclado de modales de ranking/ficha/finanzas no forman parte de esta validación.
- Los anchos móviles pasan geometría/footer, pero la evaluación de legibilidad fina y densidad táctil corresponde al recorrido UX dedicado.
- No certifica una carrera de muchas semanas ni el juego end-to-end completo. Eso requiere las fases restantes y luego playtest del jugador.

## Dictamen

**BOX-13 pasa el gate automatizado de correspondencia del calendario, acciones básicas de agenda y canvas/footer en las resoluciones enumeradas.** La Fase 3 queda parcialmente cerrada; no pasar todavía a declarar el candidato final de playtest mientras queden pendientes de la fase, de carrera extensa y QA integral.
