# Revisión PR #2 — historia previa y R2

## Dictamen breve

R2 tenía un defecto P1 de validación semántica de checkpoint, reproducido y corregido en esta revisión. No recomiendo fusionar ahora el PR completo: mezcla aceptación del baseline histórico y de R2, e incorpora publicación automática al fusionar. Recomiendo separar esas dos decisiones de revisión; no se reestructuraron ramas ni PRs.

## Qué se revisó directamente

- GitHub confirmó PR borrador, base `9317da96cbb2ed0bd749c49608b8b310e385b9d0`, head inicial `658d881ed14f96a20a4b40af892b4922c3f72fc1`, 54 commits/155 archivos.
- Diff incremental R2 `ec2b72d..658d881`: 24 archivos; motor, reducer, validación/migración, FightScreen, cambios de UI que reflejan reglas, fixtures/baselines y scripts/informes.
- Historia `main..ec2b72d`: lista completa de 52 commits y 148 archivos del snapshot; contexto publicado R1, informe 45, auditoría 44, configuración, dependencias, infraestructura, ejemplos de herramientas y localización. No se afirma una nueva revisión línea a línea de todos los archivos históricos ni un playtest integral del baseline.
- Workflow de Pages y consultas read-only a configuración GitHub. No se ejecutó workflow ni despliegue.

Evidencia reutilizada: red/green original de informes 45/46; 840 roundtrips R1 en 120 semanas y cinco grupos de navegador R1 previos; comparativa GPU 47. Son evidencia específica, no certificación de todos los 52 commits.

## Hallazgos y gravedad

| Hallazgo | Gravedad / estado | Archivos y consecuencia |
| --- | --- | --- |
| Checkpoint con final prematuro, cursor de asalto saltado o identidad A diferente de `miId` aceptado al cargar | **P1, corregido** | `src/game/saveValidation.ts`, `src/game/r2.test.ts`. Tipos/IDs existentes no bastaban: la UI podía mostrar un final imposible o simular desde un asalto saltado; el reducer después rechazaba el resultado. El informe 46 sobre checkpoints corruptos era demasiado amplio respecto de estos casos. |
| Merge inicia publicación sin un gate manual dentro del workflow | **P1 para aceptar/fusionar, pendiente de decisión de publicación** | `.github/workflows/deploy-pages.yml`. R2 aprobado no equivale a autorización de publicar. |
| Diff del PR no es exclusivamente R2 ni exclusivamente R1 | **P2 de revisión** | 52 commits anteriores/148 archivos, con UI, economía, contenido y tooling. Está explicado por `ESTADO_PUBLICADO_R1.md` y el commit snapshot; no debe presentarse como 54 commits de correcciones R2. |
| Evidencia histórica no cierra hallazgos ajenos a R1/R2 | **P1/P2 ya registrados, sin implementar otros gates** | Auditoría 44: contenido/economía (A08/A10/A11/A21/A24), canvas/texto/idiomas (A18–A20/A23/A26), integración/horizonte (A25/A27/A28 documental). Ejemplo directo: `src/i18n/index.ts` tiene Intl pero no catálogo completo `t`; no hay traducción completa demostrada. No es regresión introducida por R2. |
| Herramientas gráficas históricas no portables ni verificadas por npm | **P2 de alcance/higiene** | `scripts/run_v2_pipeline.py`, `generate_v2_*`, `sprite_processor.py`: rutas/venv/dependencias locales y procesamiento de assets. README las declara opcionales históricas. No se ejecutaron ni se certificaron; no las confundir con assets finales o funcionalidad web. |
| No hay checks automáticos para PR | **P2 de entrega** | Workflow solo `push: main`/manual, no `pull_request`. La evidencia actual es local; auditoría estructural comprueba estructura/patrones, no equivalencia funcional de todo el juego. No se cambió CI fuera de alcance. |

## Corrección R2 y evidencia nueva

Causa: se comprobaban tipos, referencias, tamaño de tarjetas y límites superiores, pero no la relación entre `asalto`, `asaltosCerrados`, `finalizada` y la identidad programada.

Solución mínima: exigir identidad A/miId; cursor activo con `asaltosCerrados = asalto − 1`; final normal solo después de cerrar todos los asaltos, sin intercambios pendientes. Se conservan ambos cursores terminales legítimos: UI N+1 y simulación rápida N. KO antes del resumen sigue siendo válido. No cambia schema, reglas de combate, migración ni importa una regla económica nueva.

- Tres tests fallaron antes: final prematuro, asalto saltado, identidad cruzada; el validador no lanzaba error.
- Tras corregir, los tres rechazan y el repositorio recupera backup sano sin sobrescribir bytes originales ni backup.
- Tres tests adicionales prueban roundtrip exacto de final rápido, final UI y KO antes del resumen.
- Tests focalizados R1/R2 previos a los tres casos positivos: 159 PASS.
- **Verificación final: 235/235** (102 R2 + 60 R1 + 73 históricos), `npm run verify` exit 0, **9,007 s**; TypeScript/build/presupuesto/auditoría PASS. JS 516,1/560 KiB, CSS 80,7/90 KiB. Warning Vite >500 kB conservado.
- E2E R2 final con GPU, aislado 5232: ocho grupos PASS, **11,383 s**, ambas resoluciones. Checks read-only de historia/configuración en paralelo; build terminó antes del navegador consumidor.
- Assertions anteriores intactas; no partida real ni localhost:3000. `git diff --check` aprobado.

## Qué incorporan los 52 commits históricos

El contenido coincide con el snapshot publicado hasta R1, no con un gate limitado exclusivamente a R1:

1. Loop, licencias/carrera, ranking, entrenamiento, eventos, economía/recaudación/préstamo/cierre de club y personal; cambios de `engine`, `state`, `data` y tipos.
2. UI/UX: grillas, paginación, ventanas, mapas, ficha, combate, calendario, archivo histórico y footer; componentes/CSS y BOX previos.
3. Arquitectura/calidad: almacenamiento inyectable, validación y migraciones R1, journal/backup/ranuras, RNG reproducible, diagnósticos/error boundary, shortcuts, tests y presupuesto.
4. Publicación: workflow Pages, `VITE_BASE_PATH`, favicon, Node 22/Vitest y lockfile; retirada de dependencias router/uuid no usadas. Build/tests actuales respaldan compilación, no una auditoría nueva de todas las dependencias.
5. Documentación: cinco canónicos, auditorías/planes/playtests/contextos; scripts/capturas sintéticas históricos. El commit `ec2b72d` incluye 93 archivos de trabajo acumulado y R1, como declara el contexto: no es un patch puro de persistencia.

No se identificó un bloque de código nuevo sin procedencia Git ni una partida personal en lo inspeccionado. Sí quedan capacidades y herramientas sin evidencia de cierre integral; los informes anteriores de “end-to-end” son históricos y quedan subordinados a auditoría 44 y a los gates pendientes. No se validó nuevamente cada captura ni cada script histórico como parte del juego ejecutable.

## Publicación al fusionar

`push` a `main` dispara verify → build → upload-pages-artifact → deploy-pages. `workflow_dispatch` también permite ejecución manual. PR/draft/push al feature no despliegan.

Si se fusionara, Actions tomaría el **commit resultante en main**, no un release fijo de R1: incluiría los 52 commits históricos, R2 y la corrección de esta revisión, más cualquier cambio añadido antes del merge. Build usa `VITE_BASE_PATH=/LaVidaDelBoxeo/`. No hay aprobación de R2 dentro del YAML ni gate manual configurado allí.

GitHub devolvió `has_pages: false`; consultas de Pages y entorno `github-pages` devolvieron 404. Actualmente no está confirmada/configurada una publicación Pages exitosa: el merge iniciaría el pipeline y podría fallar por esa configuración. Esto no elimina el riesgo de publicación automática cuando Pages se habilite. No se modificó configuración para probarlo.

## Recomendación y bloqueos

Preferir **baseline histórico/R1 primero y R2 separado o apilado**, conservando commits, para aceptar responsabilidades y evidencia por separado. Antes de fusionar cualquier baseline que agregue este workflow, decidir explícitamente política de despliegue: revisión ≠ publicación. Separar PRs no soluciona por sí solo ese disparador. No se hizo rebase, cherry-pick, cambio de base, force push ni merge.

Conservar PR completo es técnicamente posible (main es ancestro, no hay divergencia), pero requeriría aceptar conscientemente **todo** el baseline histórico además de R2 y resolver la decisión de publicación. Mi recomendación es no aceptarlo como si fuese únicamente R2.

R2 específico: defecto encontrado reparado y verificado; permanece pendiente aceptación humana y con límites de presentación/almacenamiento documentados en 46. Merge completo: bloqueado como decisión de revisión por alcance acumulado, hallazgos pendientes de auditoría 44 y política Pages; no se declara bloqueo técnico de Git. R3–R5 y BOX-15 no iniciados.
