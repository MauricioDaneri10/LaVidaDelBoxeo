# BOX-12 — Revisión del Panel del Club

**Fecha:** 2026-09-26\
**Estado:** correcciones aplicadas; verificación lógica, build y matriz de navegador PASS. Playtest subjetivo y QA global siguen abiertos.\
**Alcance:** indicadores, canales, avisos de comisión, entrevistas, vencimiento, panel responsive y coherencia entre texto y consecuencias. No se cambió la economía base, la frecuencia ni la cantidad de eventos; tampoco se modificó la partida del propietario.

## Hallazgos de raíz

1. **Indicador general incompleto:** Don Anselmo mostraba badge cuando un pugilista alcanzaba los diez guanteos y podía tramitar la licencia, pero el punto del encabezado del Panel del Club no consideraba ese mismo pendiente.
2. **Canal móvil sin cierre:** al abrir un canal del dock inferior, volver a pulsar el canal activo cambiaba a Mensajes, pero mantenía el panel expandido. No había una acción directa para cerrarlo.
3. **Texto de entrevista prometía una elección inexistente:** la tarjeta hablaba de una declaración que podía perjudicar la imagen del club, pero solo ofrecía respuesta favorable o declinar.
4. **Avería con una consecuencia ficticia:** el mensaje decía que el saco estaba inutilizado; posponer el arreglo no aplicaba deterioro ni impedía entrenar. Además, el reductor exigía un campo `monto` ficticio para cobrar el mantenimiento.
5. **Plazo poco accesible:** el indicador abreviado `3d` no explicaba que se trataba de días de juego a lectores de pantalla o al pasar el mouse.

## Correcciones aplicadas

- El punto de asunto pendiente ahora también se activa si hay un pugilista listo para tramitar licencia. El badge del canal y el indicador global describen la misma acción.
- El dock móvil abre el canal elegido; al volver a pulsar ese mismo canal lo cierra. `aria-expanded` expone el estado real. Cambiar a otro canal mantiene abierto el panel.
- La entrevista ahora ofrece tres opciones con consecuencias visibles: declaración favorable (+2 fama, +80 seguidores), provocación (−2 fama, −40 seguidores) y declinar. El resultado usa feedback neutral y refleja correctamente signos y cantidades; seguidores no cae por debajo de cero.
- El aviso se describe como **reparación preventiva** y aclara que posponerla no afecta el entrenamiento. Mantenimiento se resuelve con el costo real, sin un valor centinela `monto`.
- El plazo conserva el diseño compacto `3d`, pero incluye nombre accesible y tooltip, por ejemplo “Vence en 3 días”.
- Se mantiene el scroll dentro del contenido del panel: puede haber cuatro avisos activos y varias tarjetas de consejo sin empujar el footer ni crear scroll global. Los eventos vigentes permanecen en la bandeja hasta resolverse o vencer.

## Pruebas y evidencia

- `npm run verify`: **PASS**, TypeScript, build, presupuesto y auditoría estructural con cero errores/advertencias; **70/70 pruebas** unitarias.
- Pruebas de reglas cubren las tres respuestas de entrevista, cambios de fama/seguidores, límite inferior de seguidores, mensaje producido por el generador, mantenimiento sin `monto` artificial y cargo conciliado en el libro semanal.
- `python scratch/test_box12_club_panel.py`: **PASS** en 1280×720, 1440×900, 1024×600, 970×900 y 390×844. Prueba cuatro avisos, badges, acción pendiente de licencia, etiquetas de vencimiento, cierre del panel móvil, altura del footer y ausencia de scroll global.
- No se avanzó el calendario, no se pulsaron decisiones del guardado real ni se reclamaron consejos de la partida del jugador. El test usa contextos y datos sintéticos aislados.
- Sigue el aviso informativo de Vite para un chunk JS minificado mayor a 500 kB; el control configurado sí pasa: JS 494.8/560 KiB y CSS 79.5/90 KiB.

## Riesgo conocido que no se amplía en esta fase

El límite de cuatro avisos activos no desplaza eventos vigentes. Si el generador produce más propuestas que plazas libres, las adicionales de ese ciclo no quedan en una cola persistente. Esto evita saturar el Panel, pero significa que algunas oportunidades aleatorias podrían no llegar a mostrarse. No se cambió ese contrato sin definir antes cómo debe comportarse la cola y su vencimiento; debe revisarse en el balance/QA de eventos.

## Dictamen

**BOX-12 pasa los gates automatizables de coherencia texto-consecuencia, indicadores y geometría responsive del Panel del Club.** No certifica que todo evento tenga frecuencia/economía ideal ni que el juego completo soporte una carrera extensa sin fallos. Quedan pendientes el playtest del propietario y la decisión futura sobre propuestas descartadas al alcanzar el límite de avisos.
