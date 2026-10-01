# Gate 26 — Auditoría y pruebas económicas

**Fecha:** 2026-09-23\
**Estado:** corregidos los defectos verificables; balance económico sujeto a calibración de diseño antes del playtest final.

## Alcance

Auditoría de entradas y salidas de caja, eventos de recaudación, préstamo, penalización por caja negativa, seguidores y conciliación semanal a través de `engine.ts`, `state.tsx`, la proyección y sus pruebas. No se modificó una partida guardada del usuario.

## Hallazgos y resolución

### Corregidos

1. **Crecimiento de seguidores en saltos.** El domingo se reemplazaba el contador por su objetivo teórico, por lo que un cambio de fama podía causar una variación de miles en un cierre. Ahora converge gradualmente: máximo **+90** o **−60 seguidores por semana**. La fama y los resultados siguen definiendo el objetivo a largo plazo; acciones puntuales de prensa conservan su efecto inmediato.
2. **Préstamo de emergencia sin regla de elegibilidad en el motor.** La interfaz lo mostraba bajo $300, pero una acción directa podía pedirlo con caja holgada. El reducer ahora aplica el mismo umbral: solo disponible con saldo **menor de $300** y si no hay otra deuda activa.
3. **Préstamo contado como dinero ganado.** El desembolso seguía correctamente en el libro y afectaba el flujo de caja, pero inflaba `stats.dineroGanado`. Ahora se excluye de ese indicador de ingresos operativos, mientras se conserva la entrada y las 10 cuotas en el flujo de caja para conciliar saldo.
4. **Cobertura de regresión insuficiente para estas reglas.** Se añadieron pruebas de límite de seguidores, elegibilidad de deuda, desembolso, amortización completa durante 10 cierres, ausencia de doble préstamo y conciliación de las cuatro actividades sociales.

### Observaciones para calibración, no alteradas sin criterio de producto

- Las actividades sociales tienen retorno mínimo superior a su inversión, antes de bonificaciones: bingo **+$120 mínimo / +$285 esperado**; juegos de mesa **+$80 / +$200**; festival **+$200 / +$550**; clase abierta **+$40 / +$100**. Difusión aplica además **×1,15**. Por tanto, el riesgo financiero actual es nulo y la elección se basa en escala, fama/alumnos y coste de oportunidad de una actividad semanal. Es una decisión estratégica limitada; no se añadió azar negativo ni se cambiaron cifras a ciegas.
- El préstamo entrega **$500** y exige devolver **$600** en 10 cuotas de $60: coste fijo total **$100** (20% del desembolso), aparte del cargo semanal por mantener caja negativa. Queda explícito en los saldos y libros; la elegibilidad ya no permite tomarlo con liquidez holgada.
- La penalización por caja negativa usa `max($10, ceil(3% del saldo negativo))` al cierre. Es computable y se refleja en la proyección y en el resumen. En esta arquitectura se determina usando el saldo antes de liquidar los flujos dominicales; refinar cálculo diario de intereses exigiría registrar exposición diaria y queda fuera de este gate.
- Las actividades pagan un rango aleatorio y la proyección usa su punto medio, no una garantía. No se detectó descuadre entre retorno, inversión y variación real de caja en los escenarios automatizados.

## Pruebas inteligentes añadidas

- Todas las actividades sociales: inversión se debita al agendar, pago real cae dentro del rango configurado, el gasto queda listado una vez y `resumen.total = saldo final − saldo inicial`.
- Préstamo de emergencia: saldo inicial bajo, entrada de $500, elegibilidad de caja, 10 cargos exactos de $60 y deuda en cero tras el décimo cierre; el préstamo no incrementa dinero ganado.
- Seguidores: cae de forma acotada hacia un objetivo inferior y crece con máximo semanal fijo hacia uno superior.
- La suite existente sigue cubriendo 120 cierres consecutivos y conciliación del libro.

## Verificación de cierre

- `npm run verify`: **PASS**.
- TypeScript: PASS.
- Tests: **45/45 PASS**.
- Build: PASS.
- Bundle: JS **485.3 / 560 KiB**; CSS **70.5 / 90 KiB**.
- Auditoría estructural: **0 errores, 0 advertencias**.
- `git diff --check`: PASS.

## Límite y propuesta de siguiente paso

Este gate cierra defectos lógicos reproducibles y cobertura de pruebas económicas, pero **no declara calibrada toda la economía ni habilita el playtest final**. El siguiente paso útil es una calibración basada en escenarios del ciclo inicial (primeras 12 semanas) y carrera estable (semanas 13–52): decidir objetivos de caja esperados, ventaja/risco de cada recaudación y presión de nómina/deuda; registrar tablas antes/después y automatizar umbrales para impedir regresiones. Requiere fijar objetivos de balance, no inventarlos desde una ejecución aislada.
