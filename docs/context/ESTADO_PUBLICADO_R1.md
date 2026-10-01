# Estado versionado — cierre R1

Fecha: 2026-10-01. Proyecto: La Vida del Boxeo · MadArt Studios.

## Qué representa esta rama

`feature/audit-hardening`, remoto `origin` de `MauricioDaneri10/LaVidaDelBoxeo`. Publica los commits locales anteriores y el estado completo que estaba pendiente de commit, incluyendo BOX históricos y R1. Los cambios comparten archivos: no se reconstruyó artificialmente una separación anterior/R1. Consultar `git log` y el informe 45 para distinguir el alcance.

La publicación Git no cierra gates adicionales, no modifica reglas ni convierte este prototipo en un candidato final. `main` y su despliegue Pages no se fusionan ni se actualizan en esta operación.

## Fuente vigente para continuar

1. Cinco documentos de `docs/canonical/` como contratos de diseño, técnica, arte, proyecto y QA.
2. `docs/audits/44_Auditoria_Integral_Pre_BOX-15_2026-10-01.md`: hallazgos A01–A28 y gates R1–R5.
3. `docs/audits/45_Gate_R1_Partidas_Carrera_2026-10-01.md`: correcciones, tests, archivos y límites de R1.
4. `docs/plans/Contrato_Pulido_Pre_Playtest_y_Matriz_de_Canvas.md` y `docs/plans/Plan_Implementacion_Pulido_y_Playtest_Candidato.md`: requisitos previos de pulido; leer como historial de implementación junto con 44/45.

R1 cierra A01, A02, A12, A13 y solo guardado operacional de A28. R2–R5 y BOX-15 **no fueron iniciados durante R1 ni durante esta publicación**. Próximo gate requiere indicación del propietario; no comenzar automáticamente.

El handoff previo externo se conserva como `docs/context/ANTIGRAVITY_HANDOFF_HISTORICO.md` por trazabilidad. Sus números, rutas de workspace y siguiente BOX son históricos; no reemplazan el estado vigente ni exigen Antigravity para trabajar.

## Verificación reproducible

Desde la raíz del clon: `npm ci`, `npm run verify`, `git diff --check`. Referencia: 133/133 Vitest (60 R1 y 73 previos), TypeScript/build/budget/auditoría estructural PASS. Browser R1: `python scratch/test_r1_persistence.py` con Playwright/Chromium instalado y build existente. El README explica instalación y aislamiento.

Persistencia prolongada: 840 roundtrips en 120 semanas, igualdad exacta por ciclo. No equivale a aprobar el resto del juego. Chunk JS supera aviso genérico 500 kB pero cumple presupuesto 560 KiB. Garantía de almacenamiento de un escritor, no simultaneidad multi-tab. No se reconstruye historia que ya se perdió en versiones anteriores.

## Integridad y exclusiones

Se incluyen código, lockfile, configuración/workflow, tests, scripts auxiliares útiles, canónicos, auditorías, planes y capturas de fixtures. No se incluyen node_modules, dist/build, logs, cachés Python, entornos virtuales, credenciales ni los tres helpers temporales de reescritura citados en scratch/README. No se elimina nada para limpiar Git.

Se revisan archivos candidatos e historial local no publicado para patrones de secretos; una revisión de patrones no certifica ausencia universal de información sensible. No hay datos de partidas reales en este snapshot. Documentos contienen rutas históricas del entorno de desarrollo y autoría del proyecto.
