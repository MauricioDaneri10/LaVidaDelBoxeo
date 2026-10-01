# Separación de revisión histórica/R1, R2 y política Pages

## Autorización y ramas

Solo organización de revisión y preparación de política. Todos los PRs en borrador. Sin aceptar baseline, merge, despliegue, configurar Pages, reescribir historia ni iniciar R3–R5/BOX-15.

| Revisión | Rama head | Base propuesta | Contenido |
| --- | --- | --- | --- |
| Histórica/R1 | `review/historical-r1` en `ec2b72dda7bac0434bd37ce8cf6d9a7c5299d38c` | `main` | 52 commits históricos, 148 archivos; snapshot completo hasta R1, no gate exclusivamente R1. |
| R2, PR #2 | `feature/audit-hardening` en `3deaa08b185df60ee521e58b1f0795b63e79d8e9` | `review/historical-r1` | Tres commits incrementales R2 y corrección de revisión; no cambios al head durante separación. |
| Política Pages | `chore/pages-manual-only`, desde `ec2b72d` | `review/historical-r1` | Workflow exclusivamente manual/confirmado/main y este documento; código de juego sin cambios. |

Main observado: `9317da96cbb2ed0bd749c49608b8b310e385b9d0`. Es ancestro del baseline; no se requiere reescribir los 52 commits. Main todavía no contiene workflow ni scripts de verify: usar base histórica permite revisar exclusivamente el cambio de política, sin copiar el baseline dentro de este PR.

## Política preparada

- Se elimina el disparador `push` a main. No se añade `pull_request`, horario ni otro disparador.
- Solo `workflow_dispatch`, con booleano `confirm_publish` obligatorio y default false.
- Tanto verify como deploy exigen evento manual, ref exacta `refs/heads/main` y confirmación true. Una ejecución desde feature/tag u omitiendo confirmación no construye ni despliega.
- Se conservan Node 22, npm ci, typecheck, tests, auditoría, build con base Pages, presupuesto, referencias de artefacto y upload; deploy sigue dependiendo de verify. No se cambia presupuesto, permisos, artefacto ni environment.
- Esto prepara la política; no prueba disponibilidad de Pages. GitHub informó `has_pages: false` en revisión 49. No se configura para comprobarla ni se ejecuta el workflow.

## Orden de integración propuesto — requiere autorizaciones futuras

1. Revisar y aprobar por separado el PR de política. Integrarlo en `review/historical-r1` **antes** de integrar baseline en main. Así el baseline contiene publicación solo manual cuando llegue a main. No fusionar primero el baseline original con `push: main`.
2. Revisar/aceptar el contenido histórico/R1 completo y sus pendientes. Integrar ese baseline ya protegido en main, conservando historia mediante merge, no squash/rebase de los commits existentes. No confundir aceptación de R1 con certificación integral.
3. Cambiar base del PR #2 de `review/historical-r1` a `main` una vez allí integrado el baseline. No asumir que GitHub retargetea automáticamente ni que su diff mantiene el alcance: comprobar de nuevo base/head/diff.
4. **Protección frente a reversión:** R2 conserva el workflow automático histórico en su árbol porque aún no incorpora el commit separado de política. Antes de aceptar/integrar R2, integrar main actualizado en su rama mediante merge normal y conservar el workflow manual al resolver cualquier diferencia. Alternativamente integrar la política ya aprobada en R2 antes; requiere autorización. No hacer force push ni rebase. Aunque un merge Git normal puede preservar el cambio de política de main, comprobar expresamente que el resultado no restaure `push: main`.
5. Revisar R2 aislado y su evidencia; solo después, decidir su aceptación. Publicar es una decisión posterior, mediante ejecución manual confirmada en main. Ninguno de estos merges se ejecuta en esta tarea.

Una vez main contenga baseline, los 52 commits históricos dejarán de formar parte del diff del PR #2. El merge de sincronización puede añadir un commit de integración; no elimina ni cambia hashes de commits anteriores. Las ramas baseline/R2 no se eliminan en esta preparación.

## Evidencia reutilizada y controles de esta organización

- R1: informe 45, 133 tests al cierre histórico y aceptación sintética; no se repite ni se certifica nuevamente toda la historia.
- R2: informe 49, 235/235, verify y E2E GPU aprobados sobre head `3deaa08`; head y código no cambian al retargetear.
- Política: comparación de YAML contra el baseline verifica pasos/needs/permisos intactos, único evento manual e inputs. Tabla de condiciones comprueba manual/main/true permitido, manual/feature, push/main, tag y confirmación false/ausente rechazados.
- Diffs esperados: baseline = historia/R1; PR #2 = tres commits R2; política = workflow + documento. No se necesitan tests de juego nuevos por cambiar únicamente disparador y documentación.

## Pendientes y bloqueos

Aceptación humana del baseline histórico, política de publicación y R2 pendientes. Auditoría 44 conserva los gates R3–R5 abiertos; no presentar informes históricos como certificado total. CI de PR sin despliegue no se incorpora aquí; el workflow sigue manual para todos sus jobs. Pages deshabilitado/no configurado; no es bloqueo para preparar/revisar estos PRs, sí para una publicación futura. No hay autorización de merge ni ejecución manual. Mantener todos los PRs en borrador.
