# Copia histórica del handoff externo

Conservada al publicar R1, 2026-10-01. Contenido anterior sin reconciliar: sus rutas, conteos y siguiente BOX son históricos. Para el estado vigente usar `ESTADO_PUBLICADO_R1.md` y auditorías 44/45. No ejecutar instrucciones antiguas como autorización nueva.

---

# Handoff canónico para continuar La Vida del Boxeo

Fecha de referencia: 2026-09-23\
Proyecto: La Vida del Boxeo — simulador de gimnasio y promotora de boxeo\
Repositorio de trabajo actual: `E:\AI Factory\projects\la-vida-del-boxeo`\
Workspace técnico auditado: `E:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening`

## 1. Cómo debe trabajar la IA que continúe el proyecto

Este juego se desarrolla por fases de auditoría, implementación y verificación. No se deben aplicar parches visuales aislados ni agregar contenido para llenar espacios.

Regla principal:

> Cada dato debe tener una única ubicación principal. Los espacios vacíos se resuelven con grillas, tarjetas, paginación, estados contextuales o una mejor composición; nunca duplicando caja, fama, seguidores, nómina o resultados ya visibles.

La matriz obligatoria para pulir el juego antes del playtest está en `workspaces/phase-audit-hardening/docs/plans/Contrato_Pulido_Pre_Playtest_y_Matriz_de_Canvas.md`. Leerla antes de cualquier cambio visual o de flujo. Los requisitos ya registrados no se vuelven a preguntar ni se dejan solamente en el historial del chat.

El plan de ejecución vigente es `workspaces/phase-audit-hardening/docs/plans/Plan_Implementacion_Pulido_y_Playtest_Candidato.md`; consultar también las auditorías 23–28 para el estado real. Las fases visuales iniciales ya fueron trabajadas, pero el playtest final del propietario NO está habilitado: faltan gates visuales multi-viewport, funcionales integrados, idiomas y decisiones económicas. No reutilizar la secuencia histórica de fase 1 como si fuese el estado actual.

## 2. Principios no negociables

- El juego debe funcionar sin scroll del canvas principal.
- El contenido largo debe usar modal interno, tooltip accesible, paginación o detalle bajo demanda.
- Footer visible: `MadArt Studios`.
- El footer debe quedar debajo de todo el contenido sin provocar scroll.
- La simetría debe ser medible: mismos botones equivalentes, mismas alturas, padding, radios, gaps, alineaciones y líneas base.
- Los iconos deben estar centrados respecto del texto.
- Las tarjetas equivalentes deben compartir una plantilla.
- Los CTA deben estar alineados en la parte inferior de la tarjeta.
- No generar assets 2D/3D todavía; eso queda para una fase posterior decidida por el propietario.
- No rediseñar desde cero: mejorar el sistema visual existente.
- No agregar roles, eventos o fuentes de dinero sin auditar su economía.
- No tocar reglas de juego para resolver un problema puramente visual.
- No cerrar una fase sin tests y evidencia de navegador.

## 3. Estado conocido (resultados históricos; confirmar en Fase 0)

La verificación técnica más reciente (Gate 30, 2026-09-23) pasó `npm run verify`: TypeScript, 53/53 tests, build Vite, presupuesto JS 489.1/560 KiB y CSS 70.5/90 KiB, auditoría estructural 0 errores/0 advertencias. Vite aún advierte un chunk de 500.87 kB sin gzip. Esto no equivale a validación visual, consola/red en navegador ni aprobación del propietario. Antes de otra implementación, revisar `git status` y repetir `npm run verify` para confirmar el árbol vigente.

La fase visual reciente hizo lo siguiente:

- retiró resúmenes redundantes de Mercado, Mi Perfil, Personal y Calendario;
- agregó footer `MadArt Studios`;
- mejoró el marco del Panel del Club;
- normalizó el componente `Btn`;
- preparó grillas flexibles para Personal y Calendario.

Pendientes inmediatos:

- Plantel: aprovechar mejor el área para 4–10 alumnos y distinguir talentos recién incorporados.
- Mi Perfil: alinear iconos, botones y tarjeta de rama.
- Shell: compactar Siguiente Paso, Primeros Pasos y Previsión sin perder guía.
- Personal: mostrar más tarjetas por página.
- Mercado: mostrar más equipamiento en la grilla.
- Panel del Club: mostrar más consejos sin perder legibilidad.
- Validar todas las resoluciones objetivo.

## 4. Documentos que deben leerse antes de modificar código

Leer en este orden:

### Contrato permanente del juego

1. `docs/canonical/01_Diseno_de_Juego_Canonico.md`
2. `docs/canonical/02_Documento_Tecnico_Canonico.md`
3. `docs/canonical/03_Biblia_de_Arte_Canonica.md`
4. `docs/canonical/04_Plan_de_Proyecto_Canonico.md`
5. `docs/canonical/05_Aseguramiento_de_Calidad_Canonico.md`
6. `workspaces/phase-audit-hardening/docs/plans/Contrato_Pulido_Pre_Playtest_y_Matriz_de_Canvas.md`
7. `workspaces/phase-audit-hardening/docs/plans/Plan_Implementacion_Pulido_y_Playtest_Candidato.md`

### Planes de trabajo y verificación

8. `docs/audits/13_Plan_Auditorias_y_Correccion_Raiz_2026-09-23.md`
9. `docs/plans/Plan_Solucion_Hallazgos_e_Internacionalizacion_2026-09-23.md`
10. `docs/plans/Checklist_Verificacion_Inteligente_y_Auditorias_2026-09-23.md`
11. `docs/playtest/plan_de_cierre_y_control.md`
12. `docs/playtest/plan_de_cierre_revision_2.md`

### Auditorías más recientes y obligatorias

12. `docs/audits/14_Auditoria_Raiz_Espacio_Duplicacion_y_Canvas_2026-09-23.md`
13. `docs/audits/15_Auditoria_Arquitectura_Informacion_y_UX_2026-09-23.md`
14. `docs/audits/16_Auditoria_Economia_y_Progresion_2026-09-23.md`
15. `docs/audits/17_Auditoria_Codigo_Estado_Persistencia_y_Modularidad_2026-09-23.md`
16. `docs/audits/18_Auditoria_Texto_Localizacion_y_Accesibilidad_2026-09-23.md`
17. `docs/audits/19_Auditoria_Validacion_Integrada_y_Cierre_2026-09-23.md`
18. `docs/audits/20_Auditoria_Geometria_Simetria_Panel_y_Footer_2026-09-23.md`
19. `docs/audits/21_Informe_Fase_Implementacion_Visual_2026-09-23.md`
20. `docs/audits/22_Auditoria_Feedback_Grillas_Alineacion_y_Automatizacion_2026-09-23.md`
21. `docs/audits/23_Baseline_y_Reconciliacion_2026-09-23.md`
22. `docs/audits/24_Implementacion_Canvas_Densidad_y_Alta_Automatica_2026-09-23.md`
23. `docs/audits/25_Gate_Calendario_Eventos_2026-09-23.md`
24. `docs/audits/26_Gate_Auditoria_y_Pruebas_Economia_2026-09-23.md`
25. `docs/audits/27_Calibracion_Economica_Escenarios_2026-09-23.md`
26. `docs/audits/28_Gate_Insolvencia_Nomina_y_Recuperacion_2026-09-23.md`
27. `docs/audits/29_Decision_de_Diseno_Insolvencia_Severa_2026-09-23.md`
28. `docs/audits/30_Gate_Politica_Insolvencia_y_Cierre_2026-09-23.md`

## 5. Forma correcta de iniciar una sesión nueva

1. Leer este documento completo.
2. Leer los cinco documentos canónicos.
3. Leer las auditorías 13 a 30, priorizando las 27–30 para economía e insolvencia.
4. Revisar `git status` y no borrar cambios existentes.
5. Ejecutar `npm run verify` desde el workspace técnico.
6. Abrir el juego y capturar el estado visual real.
7. Separar hallazgos visuales, funcionales, económicos y de texto. No llenar espacios con valores ya visibles en el shell; resolver con densidad de grilla/contenido propio y las plantillas canónicas.
8. Crear o actualizar una auditoría antes de implementar si aparece un problema nuevo.
9. Implementar cambios pequeños y coherentes.
10. Ejecutar typecheck, tests, build y auditoría visual.
11. Documentar qué cambió, qué se verificó y qué queda pendiente.

## 6. Comandos de verificación

Desde:

`E:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening`

```powershell
npm run verify
npm run dev -- --host 0.0.0.0
```

La verificación completa debe pasar antes de considerar terminada una fase.

## 7. Estado actual y próximo gate

**Última fase:** Gate 30 (política de insolvencia implementada y verificada), evidencia en `workspaces/phase-audit-hardening/docs/audits/30_Gate_Politica_Insolvencia_y_Cierre_2026-09-23.md`.

- El costo financiero semanal está limitado a `clamp(ceil(3% de deuda), $10, $50)` en liquidación y proyección.
- Pasó el escenario de recuperación leve: saldo −$143, préstamo único, bingo solo con fondos disponibles, sin nueva nómina, 12 semanas; se amortiza el préstamo y acaba en saldo no negativo.
- La nómina puede causar insolvencia severa; Gate 30 implementa salida voluntaria, no recuperación de esa carrera: contratación deficitaria requiere confirmación y se puede reconstruir al llegar a −$1.500.
- En la reconstrucción sobreviven récord del coach, Salón de la Fama e identidad del guardado; todo activo/progreso operativo, dinero, deuda, fama, seguidores y bonificación de legado se reinicia. El guardado se sobrescribe tras confirmar.
- La recaudación social mantiene retornos mínimos positivos; no está calibrada como un sistema de riesgo.
- Verificación Gate 30: 53/53 tests, typecheck, build, JS 489.1/560 KiB, CSS 70.5/90 KiB, auditoría estructural 0/0. El build conserva una advertencia de Vite por chunk de 500.87 kB pre-gzip.

**Gate 29:** recomendó opción E. El propietario la aprobó y respondió que sobreviven solo récord e hitos; Gate 30 ya implementó esa decisión.

**Fase posterior:** BOX-03 Mi Perfil se implementó y pasó su gate visual/funcional el 2026-09-24. Evidencia: `workspaces/phase-audit-hardening/docs/audits/31_BOX-03_Mi_Perfil_2026-09-24.md`; checklist actualizado en el plan de implementación. La matriz aislada pasó 5/5 viewports para cursos/propiedades, footer visible y canvas sin scroll. `npm run verify` aprobó 57/57 tests, typecheck, build y auditoría estructural antes del último ajuste; build y matriz se repitieron tras esos cambios. Repetir `npm run verify` después de consolidar la documentación.

**Siguiente gate: BOX-04 Mercado**, pestaña por pestaña; preservar no-scroll/footer, ampliar densidad del catálogo útil sin clonar información global, probar las cuatro categorías y estados de compra. Siguen abiertos otros gates UI/E2E, localización integral, accesibilidad y test manual. No declarar el candidato listo para playtest final.

El juego ya incluye densidad adaptable en Plantel/Mercado/Personal/Panel del Club, alineación de Cursos, shell compacto, calendario civil y asignación automática de enfoque a nuevos alumnos con entrenador. Estos cambios requieren revalidación visual tras futuras modificaciones; las imágenes pasadas solo prueban lo que muestran, no todas las resoluciones.

## 8. Automatizaciones futuras

Las siguientes ideas están aprobadas como exploración, no como implementación automática:

- Ojeador de talentos.
- Contador o gerente financiero.
- Gestor de sucursal.
- Coordinador de operaciones.

Cada una requiere una ficha de diseño con: coste semanal, requisitos, permisos, alcance, límite de acciones, feedback, riesgos económicos y tests.

## 9. Qué no hacer

- No agregar un panel inferior de caja o seguidores a cada pestaña.
- No aumentar el tamaño de un botón sólo para ocupar espacio.
- No ocultar contenido con `overflow-hidden` sin paginación, modal o test de geometría.
- No asumir que una build compilada está visualmente aprobada.
- No crear assets 3D/2D durante esta fase.
- No introducir autenticación Google, monetización o publicación externa hasta cerrar el juego local end-to-end.
- No consumir créditos, modificar planes de cuenta ni realizar acciones externas sin autorización explícita del propietario.

## 10. Criterio de cierre

Una fase se cierra únicamente cuando:

- el código compila;
- los tests pasan;
- el canvas no hace scroll;
- el footer MadArt Studios es visible;
- los botones y tarjetas equivalentes están normalizados;
- no hay superposición ni truncamiento importante;
- la economía mantiene trazabilidad;
- las partidas existentes siguen cargando;
- la consola no muestra errores;
- la auditoría de la fase queda documentada.

## 11. Reglas de economía actuales que no deben confundirse

- Gate 27 documenta inversión y retorno de Bingo, Naipes, Festival y Clase Abierta, más curvas de caja a 12/52 semanas.
- Gate 28 aplica tope de costo financiero semanal de $50 y confirma una recuperación leve; Gate 30 agrega confirmación de nómina deficitaria y reconstrucción voluntaria a −$1.500, no rescate de una carrera severamente endeudada.
- Préstamo vigente: recibe $500, devuelve $600 en 10 cuotas de $60; solo saldo menor a $300 y sin otro préstamo activo.
- El personal crea gasto semanal. Un saldo alto al inicio no garantiza que una nómina completa sea sostenible; el test de nómina temprana sigue en fuerte negativo.
- No modificar estos parámetros de forma aislada: actualizar tests deterministas y los cinco documentos canónicos/auditoría del gate.

Este archivo es el contexto operativo para Antigravity u otra IA y debe mantenerse actualizado después de cada fase. Si hay poco tiempo/créditos, leer primero este archivo, los cinco canónicos, `docs/audits/28_Gate_Insolvencia_Nomina_y_Recuperacion_2026-09-23.md` y el siguiente gate en el plan; después comprobar el estado Git antes de tocar nada.
