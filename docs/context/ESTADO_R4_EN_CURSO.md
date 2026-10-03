# Continuación de R4 — estado operativo

Fecha2026-10-03. Repositorio oficial LaVidaDelBoxeo, PR #6 en borrador, rama `feature/r4-interface-accessibility`, workspace `workspaces/r3-scope`. Base autorizada `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`.

## Leer antes de continuar

1. Instrucciones del repositorio y cinco documentos de `docs/canonical`.
2. Auditoría44, plan54 aprobado, informe55 completo; prevalecen los límites de la sección2026-10-03, no los conteos anteriores.
3. Código y tests actuales de R4, estado del PR y diff contra base. No asumir que R4 está aprobado porque verify pase.

## Autorización vigente

Completar R4 A18/A19/A20/A23/A26 y selector en el mismo PR, con commits/push permitidos. No necesita otra autorización para pendientes en alcance. No hacer merge, despliegue, Pages, R5 o BOX-15. No usar partida personal, navegador existente ni origen3000. Las dos imágenes modificadas `scratch/r1_archive_1280.png` y `scratch/r1_archive_1440.png` son ajenas: conservar y no incluir en commits.

## Estado verificado, no cierre

Verify410 tests13 archivos, typecheck/build/presupuesto/auditoría estructural aprobados. Seis curvas económicas exactas conservadas, sin recalibrar. Idiomas en/pt-BR siguen deshabilitados:184 claves no constituyen catálogo global. Persistencia/guía protege originales y ambigüedad; fixtures usan perfiles/puertos efímeros.

El detector antiguo aprobó210 casos de controles/fuentes y60 ventanas, pero NO cubría todos los rangos de texto. La ampliación `--text-bounds` mantiene46/210 RED: Calendario21, Plantel22, Perfil3; los tres restantes de Gimnasio se corrigieron con un afiche que admite el texto completo. Perfil390×667 todavía tiene selector de rama tapado: `shrink-0` no basta. No relajar el detector ni esconder acciones. Continúan composición completa, catálogo, plantillas/contabilidad, combate y notificaciones/calendario/estados extremos.

Inspección de captura estabilizada: en Gimnasio horizontal aún hay competencia/oclusión gráfica entre afiche, marquesina, nombres y figuras. Los rangos de texto no verifican oclusiones gráficas no interactivas. Resolver y añadir evidencia;46 casos RED automatizados no representan todos los defectos pendientes. No declarar visualmente aprobado ese estado.

## Pruebas y cuidados

`npm run verify` antes de evidencia final. Navegadores sobre build estable (`npm run build` solo cuando no lo usa otro proceso); fingerprints antes/después. `tests/browser/r4_canvas.py --build-ready --all-states --text-bounds --zoom --pseudo --port 5236` y `tests/browser/r4_dialogs.py --build-ready --matrix --career --zoom --pseudo --text-bounds`. El segundo incluye siete familias tras añadir Estado del club; no llamar70 casos PASS sin leer su resultado. Foco/teclado no certifican lector de pantalla. Zoom es viewport CSS/1,25 con DPR1, no deviceScaleFactor. GPU RX7600XT/D3D11, sin atribuir speedup no medido.

Preservar todas las assertions y evidencia RED, separar fallos del harness (por ejemplo locator de título mutado por pseudo) de defectos de producción. Registrar casos/capturas realmente inspeccionados, tiempos, build/hash exacto y límites en informe55 y PR #6. El resultado requerido sigue siendo toda la evidencia final sin fallos obligatorios: **NO APTO aún**.
