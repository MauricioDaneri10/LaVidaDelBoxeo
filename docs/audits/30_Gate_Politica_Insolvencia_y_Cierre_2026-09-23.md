# Gate 30 — insolvencia informada y reconstrucción de carrera

**Fecha:** 2026-09-23\
**Estado:** implementación económica y pruebas automáticas PASS; verificación visual de los flujos todavía pendiente. No declara el juego listo para el playtest final.

## Decisión canónica aplicada

El propietario aprobó la opción E (prevención informada + cierre voluntario, sin rescate monetario) y precisó que deben sobrevivir **solo récord e hitos históricos**.

| Se conserva | Se reinicia |
|---|---|
| Identidad del entrenador (para continuidad narrativa) | Caja, deuda/préstamo, salario y personal |
| Récord histórico: peleas, victorias, KOs, veladas y títulos | Plantel previo; aparecen los tres alumnos iniciales nuevos |
| Entradas del Salón de la Fama | Cursos, equipo, propiedades, contratos, calendario y eventos |
| ID de guardado, para autosave de la reconstrucción en esa partida | Fama, seguidores, estadísticas económicas y contador/bonificación de Legado |

El identificador se conserva solamente como identidad técnica de la partida; no conserva estado operativo. El contador de legado se reinicia a cero porque genera ventajas económicas en nuevas carreras y podría convertir una cadena de cierres en progreso repetible. No se otorga efectivo de rescate: los $900 son el saldo normal de inicio de una reconstrucción.

## Implementación

- La función `proyeccionSemanalRecurrente` excluye subsidio inicial, actividades comunitarias y patrocinio temporal. Usa una semana mínima de 2 para que el subsidio de apertura no infle la previsión.
- Antes de añadir un puesto con flujo recurrente negativo, la interfaz muestra el déficit proyectado por semana y explica que no cuenta ayudas/eventos temporales. El jugador puede cancelar o confirmar el riesgo.
- El reducer repite la misma comprobación. Sin `confirmado: true`, la acción no contrata; la UI no es la única barrera.
- El cierre solo aparece cuando la caja llega a −$1.500 o menos; el reducer valida el mismo umbral y requiere `confirmado: true` otra vez. La interfaz detalla qué se conserva y qué se pierde.
- Tras confirmar, se reconstruye un club nuevo sin deuda ni activos heredados. Se mantiene el `partidaId`, por lo que la persistencia actualiza la misma ranura; el acto destructivo requiere confirmación consciente.
- El cierre por encima del umbral o sin confirmación no cambia la carrera.

## Cobertura de tests añadida

- Nómina deficitaria: rechaza contratación sin confirmación; permite la decisión explícita y deja al jugador informado.
- Proyección recurrente: excluye ingresos de patrocinio y actividades sociales puntuales.
- Insolvencia: rechaza exactamente el caso por encima del límite (−$1.499); verifica el límite de −$1.500 y la confirmación obligatoria.
- Reconstrucción: comprueba identidad técnica, saldo inicial, identidad del entrenador, récord, Salón de la Fama, reinicio de Legado y eliminación del estado operativo anterior.
- Se actualizaron las pruebas que contratan personal intencionalmente para que confirmen la nómina riesgosa de forma explícita.

## Verificación ejecutada

`npm run verify` — **PASS**

- TypeScript: PASS.
- Vitest: **53/53**.
- Build Vite: PASS. Vite muestra advertencia del chunk generado de 500.87 kB antes de gzip; el control de presupuesto configurado pasa: JS **489.1/560 KiB**, CSS **70.5/90 KiB**.
- Auditoría estructural: **0 errores, 0 advertencias**.
- No se realizó inspección manual del modal a distintas resoluciones en este gate.

## Riesgos y puntos ciegos que siguen abiertos

1. La advertencia de nómina informa el **flujo semanal agregado**, no el saldo mínimo de caja ni un runway; podría aprobarse un puesto sostenible a largo plazo pero imposible de pagar hoy. Próximo refinamiento económico: mostrar costo semanal incremental, caja inmediata y semanas de liquidez.
2. El jugador puede hundir deliberadamente la caja mediante compras para cruzar el umbral; el cierre no devuelve más dinero que el presupuesto estándar de reconstrucción. Aun así, la mecánica debe probarse en rutas repetidas y guardado/carga.
3. El cierre reemplaza la carrera guardada al autosavear. La confirmación lo explica, pero debe verificarse visualmente y manualmente con una copia recuperable del guardado.
4. El corte de insolvencia es un punto de diseño provisional aprobado; falta simular múltiples decisiones, semillas y horizontes 12/26/52 semanas para comprobar que no sea ni demasiado fácil ni punitivo.
5. Los retornos de recaudación siguen siendo positivos por construcción y no tienen riesgo; no se modificaron en este gate.
6. No se hizo playtest de horas ni se verificaron todos los viewports/estados del juego. Esto **no** significa que toda la economía o el end-to-end estén cerrados.

## Siguiente gate

Gate 31: verificar el flujo de cierre y confirmación en UI (focus, teclado, cancelar, confirmar, autosave y recarga), ampliar escenarios económicos de insolvencia a 12/26/52 semanas y comprobar si la previsión necesita caja/runway además del neto semanal. Luego continuar los gates visuales y E2E pendientes; el playtest del propietario se habilita solamente tras el checklist canónico completo.
