# Fase 0 — Baseline y reconciliación de auditorías

**Fecha:** 2026-09-23\
**Branch:** `feature/audit-hardening`\
**HEAD al inicio:** `0811524 feat: improve layout density and financial recovery`\
**Entorno visual:** `http://localhost:3000/`, navegador integrado, viewport medido 970×910 CSS px.\
**Partida observada:** guardado existente `Aminc`, semana 5, día 3; se inspeccionó sin avanzar el tiempo ni modificar datos de partida.

## 1. Estado técnico inicial

`npm run verify` ejecutado desde `workspaces/phase-audit-hardening` el 2026-09-23: **PASS**.

- TypeScript: PASS.
- Vitest: 1 archivo, 34/34 tests PASS.
- Build Vite: PASS.
- Bundle reportado por `check:budget`: JS 479.2 KiB / 560 KiB; CSS 69.6 KiB / 90 KiB.
- Auditoría estructural: 0 errores, 0 advertencias.
- `git diff --check`: PASS en la revisión documental previa; avisos de conversión CRLF de Git no son fallos de contenido.

Los cambios previos de layout/documentación estaban sin commit al comenzar esta fase. Se preservan; no se limpió ni reinició el árbol.

## 2. Estado global del canvas

En el viewport disponible:

- viewport y documento: 970×910; `scrollHeight` del documento = `clientHeight` = 910.
- header: 206 px de alto.
- navegación: 47 px.
- canvas central: y=417 a y=840, alto 422 px.
- footer: y≈888 a 910, visible.
- existe una separación de aproximadamente 48 px entre el final de `main` y el footer; es espacio estructural no asignado al canvas en este viewport.
- shell sin scroll global: PASS para este viewport únicamente. No extrapolar a otros tamaños.

La cabecera más las franjas contextuales consumen cerca de 46% del viewport antes de contar la navegación; el canvas queda en 422 px. Esto confirma que el presupuesto vertical compartido merece prioridad de Fase 1.

## 3. Hallazgos reconciliados por vista

| Área | Observación directa | Estado al inicio | Severidad |
|---|---|---|---|
| Gimnasio | Canvas, estaciones, alumnos y footer visibles en el estado actual. Sin fallo de acceso observado. | Sin hallazgo reproducido en esta captura; validar estados/resoluciones en Fase 8. | Pendiente de cobertura |
| Ciudad | Controles de ranking, salón y talentos accesibles. El inspector de propiedad contiene un bloque con `scrollHeight 73` frente a `clientHeight 61`, recortando 12 px en el viewport observado. Presupuesto y precio son legibles en árbol accesible. | Defecto reproducido: contenido del inspector se comprime/corta. | P2 |
| Plantel | 4 alumnos visibles en 2×2, cards de 126 px y sin overflow de la grilla; llegan al borde inferior del canvas. El número por página sigue fijo en 5. | Mejora parcial: bien en 970 px; el layout de escritorio ancho (5 columnas) no está verificado y puede dejar fila única y gran espacio inferior. No cubre densidad completa ni roster federado + alumnos. | P2 |
| Mercado | 4 elementos por página; grilla responde a 2 columnas en este ancho y usa paginación 1/3. Hay área inferior libre en la página actual. | Pendiente: mayor densidad cuando viewport/catálogo lo permita. | P2 |
| Mi Perfil | Rama y `Ver cursos` presentes a 970×910. El CSS bajo `max-height:800px` oculta `.profile-branch-panel`, que contiene el único CTA que abre el detalle/catálogo de cursos. | Defecto reproducible por inspección de código: cursos inaccesibles en ventanas de hasta 800 px de alto. | P1 |
| Personal | Solo 2 tarjetas en página 1/5. | Defecto confirmado: cantidad fija por página infrautiliza viewports capaces de mostrar más. | P2 |
| Calendario | Semana de 2026 muestra `Miércoles 31`, y la fórmula deriva del 1 de enero de 2026, que es jueves; la etiqueta de día simulado y fecha civil divergen. | Defecto lógico reproducible en las fórmulas: reloj visible no es un calendario real coherente. | P1 |
| Panel del Club | El código limita Don Anselmo a 2 consejos por página. | Defecto confirmado por inspección: densidad menor que el objetivo de hasta 4 cuando hay espacio. | P2 |
| Internacionalización | Textos visibles inspeccionados están mayormente escritos directamente en componentes. | Deuda conocida; requiere inventario y scope. | P2 |

## 4. Matriz vieja vs estado observado

- El shell y footer ya existen, pero el `main` no consume todo el espacio restante del viewport observado. No alterar altura de tarjetas para cubrir este hueco sin comprobar densidad real.
- Las tarjetas no usan información clonada para llenar la pantalla en el estado actual; se conserva la regla contra resúmenes repetidos.
- La grilla de Plantel se adapta por breakpoint, pero el tamaño de página fijo y las múltiples secciones pueden superar el canvas en estados poblados. Sigue abierto.
- Personal, Mercado y Don Anselmo tienen paginación fija de 2/4/2. Se adaptarán a capacidad disponible, con un máximo legible y paginación de respaldo.
- La ocultación de la rama de cursos y el desfase de calendario son defectos que las auditorías anteriores no habían cerrado; se añaden al plan como P1.

## 5. Decisiones de la Fase 0

1. No se requiere una nueva auditoría general. La matriz existente cubre el alcance; se abrirán auditorías focalizadas si al corregir calendario, roster o economía aparecen contradicciones de dominio.
2. Priorizar como bloqueantes de su fase: acceso a cursos en ventana baja y coherencia fecha/día.
3. No se alteró la partida guardada durante la inspección.
4. La evidencia visual real de esta fase es solo 970×910. Las resoluciones del contrato siguen pendientes hasta que se ejecute una matriz automatizable o se inspeccionen en navegador.
5. No se reporta estado de consola/404 como PASS: esta captura no habilitó inspección fiable de errores de red retroactivos.

## 6. Gate de salida

- [x] Branch, HEAD y cambios existentes registrados.
- [x] `npm run verify` ejecutado y PASS.
- [x] Pestañas principales inspeccionadas por accesibilidad en la partida activa.
- [x] Medidas del shell, Plantel, Perfil y Ciudad registradas.
- [x] P0 de integridad/build: ninguno observado.
- [x] P1 reproducibles identificados antes de implementar.
- [ ] Otras resoluciones objetivo validadas (se completan en gates visuales posteriores).
- [ ] Consola y 404 de red registrados (se completan en QA integrada).

**Dictamen:** baseline suficiente para avanzar con correcciones. No habilita el playtest final. La Fase 1 debe cerrar el presupuesto de shell; en paralelo, las regresiones P1 de perfil/calendario se corrigen en sus fases correspondientes.
