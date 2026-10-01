# Plan de Proyecto Canónico

## Actualización R3 aprobada — 2026-10-01

R3 implementado según plan51, entrega mediante PR en borrador para decisión del usuario. Evidencia en informe52. No iniciar R4/R5/BOX15 ni fusionar/desplegar. Pages permanece manual/confirmada/main.


**Proyecto:** La Vida del Boxeo  
**Versión:** 1.0  
**Estado:** Plan rector de trabajo y tiempos  
**Principio:** trabajar por gates verificables, no por cantidad de cambios.

## 1. Objetivo

Organizar la evolución del juego desde el prototipo actual hasta una versión funcional, escalable, traducible y preparada para assets finales, sin mezclar prioridades ni declarar cerrado un sistema que todavía no está probado.

## 2. Método permanente para cualquier actualización

Toda mejora, corrección o expansión sigue este ciclo:

```text
pedido o hallazgo
  → localizar fuente de verdad
  → auditar impacto
  → definir solución y criterio de aceptación
  → implementar el mínimo cambio coherente
  → ejecutar tests
  → revisar visualmente
  → actualizar documentación canónica
  → registrar commit
```

Si el cambio afecta otro dominio, se abre una reauditoría focalizada antes de continuar.

## 3. Fases del proyecto

### Fase 0 — Baseline

Inventario del repositorio, estado del branch, build, tests, auditoría estructural, screenshots y documentos vigentes. Se crea una línea base que no se sobrescribe.

### Fase 1 — Arquitectura

Extraer responsabilidades de motor, reducer, datos, persistencia y UI. Definir comandos, selectores, IDs y límites de módulos.

### Fase 2 — Persistencia

Formalizar envelope, migraciones, validación, respaldo, ranuras, guardado automático y compatibilidad con partidas viejas.

### Fase 3 — Tiempo y economía

Unificar calendario, libro contable, balance diario/semanal/mensual, eventos, sponsors y deuda.

### Fase 4 — Carrera y población

Cerrar carrera amateur/profesional, lesiones, tratamientos, matchmaking, títulos, retiro, rivales, temporadas y Salón de la Fama.

### Fase 5 — Contenido modular

Separar datos de reglas y agregar infraestructura para nuevos equipamientos, cursos, personal, eventos, títulos y clubes.

### Fase 6 — UI/UX existente

Conservar la identidad actual. Fortalecer layouts, modales, paginación, botones, feedback, accesibilidad, atajos y estados límite.

### Fase 7 — Internacionalización

Inventariar textos, convertir a claves, cerrar español, agregar pseudo-localización, inglés y portugués, y validar visualmente.

### Fase 8 — Pruebas y observabilidad

Completar unitarias, integración, migraciones, E2E, visuales, simulación larga y diagnóstico.

### Fase 9 — Integración y cierre técnico

Ejecutar las auditorías de integración y de preparación para expansión. Resolver contradicciones. Generar build candidata.

### Fase 10 — Playtest del usuario

Solo después de aprobar las fases anteriores. El usuario recorre una partida nueva y una avanzada, registra hallazgos y decide si se habilita la etapa de assets.

### Fase 11 — Assets finales

Producción de 2D, 3D, animaciones, audio final y reemplazos visuales mediante IDs, sin tocar el dominio del juego.

### Fase 12 — Cuenta y publicación futura

Login, sincronización, backend, monetización cosmética y distribución. Cada integración se diseña como adaptador, no como dependencia del motor.

## 4. Gates de salida

| Gate | Se aprueba cuando |
|---|---|
| G0 Baseline | el estado del proyecto está documentado |
| G1 Arquitectura | no hay dependencia circular crítica |
| G2 Persistencia | partidas viejas migran sin pérdida silenciosa |
| G3 Economía | cada movimiento tiene trazabilidad |
| G4 Carrera | no existen peleas/licencias/títulos inválidos |
| G5 Contenido | un contenido nuevo puede agregarse por datos |
| G6 UI | ninguna pantalla oculta acciones esenciales |
| G7 Idiomas | no hay texto visible fuera del catálogo |
| G8 QA | tests, build, visual y simulación pasan |
| G9 Integración | los documentos y módulos no se contradicen |
| G10 Playtest | el usuario puede completar el loop sin bloqueos |

## 5. Gestión de cambios

Cada issue debe incluir:

- problema observable;
- contexto y versión;
- fuente de verdad afectada;
- severidad P0–P3;
- solución propuesta;
- archivos o módulos afectados;
- test de aceptación;
- riesgo de migración;
- impacto visual y lingüístico.

No se implementan cambios “rápidos” que creen una segunda regla o un segundo contador.

## 6. Convención de commits

Usar commits pequeños y descriptivos:

- `feat:` nueva capacidad;
- `fix:` corrección;
- `refactor:` estructura sin cambio de comportamiento;
- `test:` cobertura;
- `docs:` documentación;
- `chore:` tooling o mantenimiento.

Un commit debe compilar o declarar claramente por qué es una excepción temporal.

## 7. Gestión de tiempos

Los tiempos se estiman por gate, no por archivo:

- auditoría: entender y delimitar;
- solución: diseñar y ejecutar;
- verificación: demostrar que funciona;
- documentación: hacer repetible el conocimiento.

Si una fase descubre un P0, el calendario se recalcula. No se oculta deuda para “llegar a la fecha”.

## 8. Arte y producto

Los assets finales quedan bloqueados hasta que el motor, la persistencia, la economía, la UI y la traducción base tengan gates verdes. Los prototipos visuales pueden continuar solo si no condicionan la arquitectura.

## 9. Expansiones futuras

Una expansión se evalúa en cinco dimensiones:

1. reglas y estado;
2. economía y balance;
3. calendario y persistencia;
4. UI/UX y traducción;
5. pruebas y migración.

Una expansión no se considera terminada por tener contenido visible: debe actualizar el documento de diseño, técnico, arte, QA y proyecto.

## 10. Regla para nuevas conversaciones

Cuando una conversación futura pida mejorar el juego, se debe:

1. leer los cinco documentos canónicos;
2. identificar qué dominio afecta;
3. consultar auditorías previas;
4. proponer o ejecutar el ciclo definido;
5. actualizar los documentos si cambia una regla.

No se debe pedir al usuario que repita esta metodología.

## 11. Plan vigente para el candidato de playtest

La secuencia detallada de cierre del prototipo, incluyendo gates de UI/UX, loop, economía, localización, persistencia, simulaciones largas y su auditoría de cobertura, está en:

`docs/plans/Plan_Implementacion_Pulido_y_Playtest_Candidato.md`

Antes de crear un plan nuevo o reiniciar una ronda general de auditorías, revisar su sección “Decisión sobre auditorías previas” y actualizar su estado/evidencia. La fase vigente comienza por baseline y reconciliación; no implica que ya se haya aprobado el playtest del propietario.

**Estado del candidato (2026-09-23, Gate 30):** opción E aprobada e implementada: advertencia informada antes de añadir una nómina recurrentemente deficitaria y cierre/reconstrucción voluntaria a caja ≤ −$1.500, preservando solo récord e hitos históricos. `npm run verify` PASS con 53/53 tests, TypeScript, build, presupuesto y auditoría estructural 0/0. Evidencia: `docs/audits/30_Gate_Politica_Insolvencia_y_Cierre_2026-09-23.md`. Esto resuelve el comportamiento de cierre, no garantiza sostenibilidad de todos los modelos económicos: continúan pendientes el riesgo/balance de recaudaciones y los gates visuales multi-viewport, funcionales, accesibilidad/localización y E2E. No habilitar todavía el playtest final del propietario.
