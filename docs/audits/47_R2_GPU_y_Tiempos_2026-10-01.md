# R2 — GPU y tiempos de verificación

## Alcance

Diagnóstico y aceleración de herramientas de R2. Sin cambios de reglas, código de producción, assertions, cobertura, dependencias ni publicación. Los perfiles de navegador y los orígenes de pruebas son aislados; no se accedió a la partida real ni al puerto 3000.

## Hardware comprobado

Consulta local mediante `Win32_VideoController`:

| Adaptador | Driver | Estado |
| --- | --- | --- |
| AMD Radeon RX 7600 XT | 32.0.31036.15 | OK |
| AMD Radeon(TM) Graphics | 32.0.21045.1000 | OK |

El entorno sí accede a la RX 7600 XT. Chromium headless, sin argumentos adicionales, seleccionó SwiftShader y composición/rasterización por software. Con `--enable-gpu --use-angle=d3d11`, CDP y el renderer WebGL identificaron la RX 7600 XT, driver 32.0.31036.15 y Direct3D 11; composición GPU, rasterización, Canvas 2D y WebGL quedaron habilitados. Esto comprueba el navegador de pruebas; no demuestra la configuración del navegador personal del usuario.

## Mediciones

| Control | Medición |
| --- | --- |
| 12 capturas 1440×900, software, calentamiento excluido | 1,519 s |
| 12 capturas 1440×900, GPU, calentamiento excluido | 1,468 s |
| E2E R2 completo, GPU, ambas resoluciones y ocho grupos de aceptación | 11,058 s; aprobado |
| E2E R2 completo, software, mismas assertions | 11,029 s; aprobado |
| Tests específicos R2 | 96/96; proceso 1,026 s; Vitest 354 ms |
| E2E GPU y tests R2 ejecutados en paralelo | 11,492 s de pared, incluida orquestación |

Las capturas mejoraron aproximadamente 3,4%, pero es una sola muestra por modo y no prueba una mejora estadísticamente estable. En E2E completo no hubo aceleración medible por GPU: la diferencia fue de 0,03 s. No se atribuye a la GPU una mejora frente a ejecuciones anteriores en condiciones distintas. El paralelismo solapó el proceso de tests de aproximadamente un segundo sin sacrificar comprobaciones.

El costo predominante medido es el navegador y las esperas del flujo de aceptación, no los tests de dominio. El control de navegador R1 anterior tardó 26,923 s frente a 15,756 s de R2 en aquella ejecución conjunta; no se repitió R1 para este cambio exclusivamente de herramientas R2. No se redujeron esperas de persistencia ni assertions para acelerar resultados. TypeScript, Vitest y build siguen siendo cargas de CPU; no se promete aceleración GPU para ellas.

## Cambios y política operativa

- `scratch/probe_r2_gpu.py`: diagnóstico CDP/WebGL y medición reproducible, capturas en memoria, perfil desechable y servidor aislado 5233.
- `scratch/test_r2_combat.py`: habilita Direct3D 11 en Windows; `R2_GPU=0` permite repetir con software. Otros sistemas conservan lanzamiento portable. Todas las assertions y escenarios existentes se conservaron.
- Ejecutar controles independientes en paralelo mientras no compartan artefactos mutables, perfil o puerto; no correr build y E2E que consume ese mismo build simultáneamente.
- Durante implementación, seleccionar tests afectados. Al cerrar un gate, ejecutar `npm run verify` completo. Reutilizar resultados aprobados cuando no cambió su código, fixture, build o entorno relevante.
- La verificación completa final de R2 ya aprobó 229/229, typecheck, build, presupuesto y auditoría estructural. Este ajuste no modificó ese código ni el build: no se repitió esa suite sin necesidad. Sí se volvió a ejecutar el E2E afectado con GPU y software para validar la modificación y medirla.
- Persisten los límites y el aviso de tamaño de chunk documentados en el informe 46. Este diagnóstico no modifica la condición de cierre ni certifica otros gates.

## Continuidad

R2 sigue cerrado con su evidencia; R3–R5 y BOX-15 no fueron iniciados. Sin commit, push ni publicación. Usar GPU especialmente para validar renderizado real, sin presentarla como una aceleración general de simulación o tests.
