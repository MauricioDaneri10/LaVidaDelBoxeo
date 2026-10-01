# Plan de implementación para llegar al playtest candidato

**Proyecto:** La Vida del Boxeo\
**Versión:** 1.0\
**Fecha:** 2026-09-23\
**Estado:** plan rector propuesto, anterior al playtest final del propietario\
**Propósito:** corregir los defectos conocidos, cerrar UI/UX y demostrar el loop completo para que el siguiente playtest del propietario se centre en balance, claridad y nuevas ideas.

## 1. Decisión sobre auditorías previas

No hace falta iniciar otra ronda general de auditorías antes de este plan. Las auditorías existentes cubren diseño/progresión, economía/calendario, UI/canvas/lenguaje, código/persistencia/regresión, UX, auditoría integrada, geometría, footer, densidad de grillas y la última devolución del propietario.

Sí hace falta una **Fase 0 de reconciliación y baseline** antes de cambiar código, porque las auditorías documentan estados de fechas distintas y algunas observaciones podrían estar resueltas o haber regresado. Esa fase verifica cada hallazgo contra `HEAD`, el árbol de trabajo y la aplicación actual; no vuelve a ejecutar auditorías completas sin motivo.

Durante la implementación se harán auditorías focalizadas solo cuando una prueba revele un riesgo no cubierto o una contradicción de reglas. No se agregan auditorías repetitivas como gate ceremonial.

## 2. Resultado buscado

Una build candidata al playtest del propietario donde:

- el jugador entiende qué hacer ahora, qué efecto tendrá y dónde consultar el detalle;
- todas las pestañas presentan composición intencional, controles normalizados, texto íntegro y densidad adecuada al espacio real;
- el loop de entrenamiento, licencia, pelea, recuperación y economía funciona de principio a fin;
- fechas, mensajes, guardado, balance y pantalla representan el mismo estado;
- las partidas sobreviven a muchos avances de tiempo y límites de roster/eventos;
- no hay errores conocidos de UI, navegación, duplicación o acciones inaccesibles;
- el propietario puede usar su playtest para ajustar balance, tono y decidir ideas nuevas.

No se promete ausencia absoluta de defectos. La autorización de playtest se basa en una matriz de cobertura y evidencia; los defectos nuevos se registran sin invalidar ese control.

## 3. Autoridad y reglas

Este plan se ejecuta junto con:

1. Los cinco documentos en `docs/canonical/`.
2. `docs/plans/Contrato_Pulido_Pre_Playtest_y_Matriz_de_Canvas.md`.
3. Auditorías 13–22; las auditorías anteriores se consultan cuando el módulo lo requiera.
4. El handoff de raíz `E:\AI Factory\projects\la-vida-del-boxeo\ANTIGRAVITY_HANDOFF_CANONICO.md`.

Reglas:

- Una fase no pasa si su criterio de aceptación falla.
- No llenar espacios con métricas repetidas ni contenido inventado.
- No comenzar generación de assets, publicación, autenticación ni monetización en este plan.
- No introducir roles económicos nuevos sin ficha de diseño y aprobación dentro del proyecto.
- Cada requisito previo del propietario se conserva como criterio verificable; no se reabre para preguntarlo de nuevo.
- El propietario participa en el playtest candidato al final, no en la caza de regresiones obvias que QA puede comprobar.

## 4. Fases y gates de implementación

### Fase 0 — Reconciliar auditorías y fijar baseline

**Objetivo:** decidir qué hallazgos siguen abiertos y establecer pruebas repetibles.

**Trabajo**

- Revisar `git status`, branch, cambios no confirmados, scripts disponibles y entorno local.
- Relacionar cada requisito de auditorías 20/22 y el contrato de canvas con estado actual: `abierto`, `resuelto con evidencia`, `regresión` o `requiere decisión de diseño`.
- Abrir la aplicación en viewport de referencia y guardar capturas de todas las pestañas, Panel del Club, ficha y combate.
- Ejecutar baseline técnica real y registrar salida, consola y recursos 404.
- Detectar afirmaciones obsoletas/contradictorias en documentos y actualizar solo su estado y enlaces, sin cambiar alcance aprobado.

**Salida / gate**

- Matriz de hallazgos priorizada con archivo/fuente, severidad, prueba y evidencia inicial.
- No se declara resuelto algo solo porque aparezca como “completado” en un informe antiguo.
- Si aparece P0 de datos o build, se corrige antes de la fase visual.

### Fase 1 — Cerrar geometría del shell y componentes comunes

**Objetivo:** arreglar la causa compartida para que el mismo defecto no reaparezca en cada pestaña.

**Trabajo**

- Medir presupuesto vertical real: cabecera, mejoras, agenda, navegación, guías, canvas, Panel del Club y footer.
- Compactar Siguiente Paso, Primeros Pasos y Previsión manteniendo su información útil.
- Definir tokens/patrones compartidos para botón, botón con icono, tarjeta, etiqueta, CTA, grilla, paginación y modal.
- Asegurar `min-height: 0`/distribución flexible y breakpoints donde sean necesarios; no esconder overflow para aprobar.
- Mantener footer MadArt Studios dentro del presupuesto del viewport y estilizar el panel como una unidad cerrada.

**Pruebas de salida**

- medidas de límites del canvas y footer en todas las resoluciones del contrato;
- altura/alineación de controles equivalentes;
- ningún control o copy primario bajo el footer;
- cero desbordamiento global donde el viewport requiere canvas sin scroll;
- comparar capturas antes/después sin haber agregado información duplicada.

### Fase 2 — Cerrar pestañas de gestión y densidad

Completar una pestaña a la vez. No pasar a la siguiente hasta que se cumplan visuales, estados límite y acciones de su checklist.

#### 2A. Mi Perfil

- [x] Centrar iconos y texto de ramas; unificar Cursos/Bienes Raíces y sus controles.
- [x] Quitar CTA/modal redundante de ver cursos; mostrar los tres niveles en tarjetas dentro del canvas.
- [x] Mantener una ubicación única para Actividades del club y no duplicar datos globales.
- [x] Probar ramas, niveles bloqueados, compra, propiedades y cinco resoluciones; no scroll, clipping ni pérdida del footer.
- Evidencia y límites: `docs/audits/31_BOX-03_Mi_Perfil_2026-09-24.md`. Verificación automatizada aprobada; queda pendiente validación humana del candidato completo.

#### 2B. Plantel

- [x] Validar con el layout determinístico 0/1/4/10, límites 11/20, una o dos filas y paginación por dimensiones disponibles; no muta el estado del juego. Tests cubren además la lista llena y sus aspirantes en espera.
- [x] Mantener 10 cupos amateurs y 10 profesionales independientes; mostrar ambos contadores explícitamente, no como un total que oculte la distribución.
- [x] Destacar temporalmente incorporaciones de esta semana y ordenarlas primero sin modificar el orden persistido; añadir orden opcional por mayor/menor valoración.
- [x] Aclarar la acción habilitada como “Tramitar licencia” e indicar en filtros qué grupo está seleccionado.
- [ ] Verificar visualmente en navegador 4 y 10 alumnos, caja de licencia lista, marca “Nuevo” con/sin Entrenador Automático, lista de espera y tamaños estrechos. La inspección actual con tres alumnos no prueba esos estados límite.
- Evidencia parcial: `docs/audits/38_BOX-09_Plantel_2026-09-26.md`. Falta el gate visual dinámico; no se da BOX-02 por cerrado todavía.

#### 2C. Mercado (BOX-04)

- [x] Hasta dos filas de cuatro tarjetas en escritorio cuando el alto y el catálogo lo permitan; reducir o paginar cuando no.
- [x] Normalizar nombre, precio, efecto, recomendación/estado y CTA en el catálogo existente.
- [x] Verificar equipamiento, indumentaria, instalaciones/salud y marca con navegación entre categorías, compra y fondos insuficientes.
- [x] Revisar capacidad 4/6/8, paginación y que las tarjetas no invadan el footer en cinco viewports.
- [x] Corregir el denominador obsoleto `/21` (el catálogo real tiene 23) y priorizar una recomendación inicial pagable y útil para el primer paso.
- Evidencia: `docs/audits/32_BOX-04_Mercado_y_Combate_2026-09-26.md` y revisión adicional `docs/audits/39_BOX-10_Mercado_Revision_2026-09-26.md`. Gate automatizado de Mercado PASS; inspección del propietario y balance futuro siguen abiertos. No se añadieron productos ni se rebalancearon efectos/precios.

#### 2D. Personal

- [x] Mostrar una grilla de hasta cuatro tarjetas por fila cuando el presupuesto y legibilidad lo permitan; conservar paginación.
- [x] Normalizar altura y CTA en tarjetas actuales y ajustar capacidad entre 2 y 4 según el viewport.
- [x] Documentar propuestas de automatización futura sin implementarlas ni alterar economía/licencias.
- [x] Definir requisitos de desbloqueo junto a los datos del puesto y usarlos tanto en UI como en reducer: no mostrar contratación activa si semana/curso/fama todavía bloquean el rol.
- [x] Aclarar qué incluye el flujo recurrente y ocultar el CTA redundante mientras se confirma una contratación con déficit.
- [x] Comprobar encabezado, tarjetas, paginador y footer MadArt Studios sin recorte ni scroll global en viewports compactos y amplios.
- Evidencia y límites: `docs/audits/33_BOX-05_Personal_2026-09-26.md` y `docs/audits/40_BOX-11_Personal_Revision_2026-09-26.md`. Gate automatizado/visual PASS; quedan pendientes el feedback subjetivo del propietario y los gates globales de economía/carrera.

#### 2E. Panel del Club

- [x] Separar en la UI asuntos accionables de consejos ya cobrados: badges significan pendientes/activos, no “no leído”; los consejos cobrados salen de la lista abierta y el panel deja de pulsar permanentemente.
- [x] No expulsar eventos activos al llegar eventos nuevos: máximo cuatro eventos activos; nuevas propuestas solo ocupan plazas disponibles. Los eventos resueltos se retiran con feedback de toast y los vencidos se eliminan al caducar.
- [x] Mostrar el texto específico de cada opción en el botón, conservar propuestas pagables ante fondos insuficientes y hacer resolución idempotente.
- [x] Completar y cobrar consejos de forma idempotente; objetivos repetibles siguen evaluándose más allá de c10 y la rotación continúa de manera estable.
- [x] Añadir semántica explícita a las opciones de contratación del Personal: “Contratar igualmente” y estado “Contratado”.
- [x] Verificar la contratación única del Representante por reducer y persistencia saneada; inspección visual de la pestaña Personal y `npm run verify`.
- [x] Unificar el indicador de pendientes cuando hay un pugilista listo para licencia; permitir abrir/cerrar el canal móvil al repetir el botón y exponer su estado accesible.
- [x] Hacer coincidir narrativa y mecánica en entrevistas (respuestas favorables/negativas/rechazo) y avería preventiva; hacer accesible el plazo de vencimiento.
- [x] Probar Panel de escritorio/móvil, cuatro avisos activos, badges, pendiente de licencia, vencimiento y footer en cinco resoluciones.
- [ ] Gate manual del jugador: probar el ciclo del representante y del Panel del Club en su partida, además de validar cómo se siente el volumen y vencimiento de avisos.
- [ ] Decidir en el gate de economía/eventos si las propuestas generadas cuando el buzón está lleno se descartan o esperan en una cola persistente; hoy no se desplaza ningún evento vigente, pero las nuevas adicionales no se encolan.

**Auditoría y resultado técnico:** `docs/audits/34_Auditoria_Previa_BOX-06_Panel_del_Club_2026-09-26.md`, `docs/audits/35_BOX-06_Panel_del_Club_2026-09-26.md` y revisión de raíz `docs/audits/41_BOX-12_Panel_del_Club_Revision_2026-09-26.md`. Gate automatizado actualizado PASS; queda pendiente la validación subjetiva del jugador y resolver explícitamente la política de cola de eventos.

#### 2F. Ciudad y Gimnasio

- Preservar lo que ya está aprobado como visualmente bueno.
- [x] Gimnasio: comprobar canvas y footer en navegador; hacer que el panel de plantel se adapte a pantallas angostas, permita recorrer listas largas dentro del panel y exponga cada boxeador como control accesible por teclado. Evidencia: `docs/audits/36_BOX-07_Gimnasio_2026-09-26.md`.
- [x] Ciudad: ajustar el mapa/inspector al encuadre observado, evitar repetir el saldo global, exponer los pines de inmuebles al teclado y mostrar requisitos reales antes de compra. Evidencia: `docs/audits/37_BOX-08_Ciudad_2026-09-26.md`.
- [ ] Ciudad: validar ranking, Salón de la Fama y búsqueda de talentos en la interfaz con estados poblados; inspección de código y presencia visual comprobadas, interacción completa pendiente.
- [ ] Confirmar que mapa y panel inspector mantienen legibilidad en anchos móviles estrechos, además del tamaño de navegador inspeccionado.

### Fase 3 — Calendario, eventos y modales

**Objetivo:** que el jugador pueda prever y gestionar acontecimientos dentro del calendario real.

**Trabajo**

- [x] Revisar que cabecera, calendario, agenda de siete días, peleas y eventos usen la misma fecha; grid lunes-domingo ahora representa sparring aun cuando haya otra actividad en la semana.
- Diferenciar actividad/recaudación del club de propuestas externas del barrio, prensa, daños/reparaciones y patrocinios.
- [x] Permitir resolver opciones de avisos desde Calendario con el mismo reducer que Panel del Club; reflejar de inmediato su resolución compartida.
- [x] Mostrar en agenda eventos activos y plazo accesible; próximo paso contextual a día, cartelera, aviso y evento social.
- [x] Permitir cancelar una pelea agendada desde Calendario mediante confirmación en dos pasos, manteniendo la opción de conservarla.
- [x] Respetar canvas/footer en cinco resoluciones y compactar la agenda para que una decisión visible no quede cortada a 720p.
- Asegurar fecha, duración, elección, vencimiento, consecuencia y feedback de cada evento.
- Corregir modales de ranking, ficha y finanzas: tamaño, cierre, foco, teclado y paginación.
- Confirmar nombres aprobados: `Estadísticas`, etiquetas únicas de licencia y consejos de enfoque exactos.

**Gate**

- [x] E2E en cinco viewports: calendario civil, sparring sábado, actividad social, vencimiento, footer, decisión del aviso, retención/cancelación confirmada de pelea.
- [ ] Tests temporales de cierre de modal sin mutación accidental y recorrido completo de ranking/ficha/finanzas.
- [ ] Definir con criterio de juego si avisos excedentes al tope actual se descartan o forman cola persistente; BOX-13 conserva el límite vigente sin borrar eventos activos.

**Evidencia BOX-13:** `docs/audits/42_BOX-13_Calendario_Eventos_Revision_2026-09-26.md`. `npm run verify`: 70/70 unitarios, build/presupuesto/auditoría estructural PASS. `python scratch/test_box13_calendar.py`: cinco viewports + decidir evento + cancelación reversible/confirmada PASS.

### Fase 4 — Recorrido de carrera de boxeadores

**Objetivo:** verificar la progresión completa con reglas y feedback consistentes.

Recorrido requerido:

1. Crear partida y elegir enfoques iniciales.
2. Equipar estaciones y entender el coste/beneficio.
3. [x] Entrenar y acumular diez guanteos sin bloquear guanteos posteriores.
4. [x] Emitir licencia solo si se cumplen requisitos, cupos y caja.
5. [x] Encontrar rival de experiencia compatible (debutante dentro de ±3 peleas), programarlo y conservar bolsa/condiciones.
6. [x] Resolver combate una sola vez y actualizar récord, circuito, dinero/libro, fama, historial reciente y cooldown.
7. [x] Restringir nuevas peleas por cooldown, energía menor a 70%, lesión o combate pendiente.
8. [x] Ofrecer profesionalización al alcanzar 50 peleas amateur sin transición automática; el jugador acepta, conserva récord y entra solo si hay cupo profesional.
9. [x] Rechazar transición duplicada y no aceptar un pase mientras tiene cartelera pendiente.
10. Retiro/transferencia de campeón, entrada histórica al Salón de la Fama y liberación/normalización de cupos; ampliar test de carrera extensa con combate real.

**Gate**

- [x] Flujos válidos y bloqueados probados: licencia, rival de debut, combate simulado, registro de resultado, ingreso en libro, cooldown, idempotencia y pase profesional bajo cupo lleno/disponible.
- [ ] Playtest manual del jugador; todavía no se pasa a candidato final.
- [ ] Retiro, elegibilidad/criterio de Salón de la Fama y campaña de múltiples victorias/títulos conectada a UI.

**Evidencia BOX-14:** `docs/audits/43_BOX-14_Progresion_Carrera_2026-09-26.md`; `scratch/test_box14_career.py`; campaña sintética de 50 combates/100 semanas; `npm run verify`.

### Fase 5 — Economía, crecimiento y elección estratégica

**Objetivo:** economía trazable y paulatina que permite decisiones, sin crecimiento/recompensas descontroladas.

**Trabajo**

- Conciliar proyección, movimientos inmediatos, balance semanal, sueldo, cuotas, recreativos, sponsors, actividades, bolsas y deuda contra libro único.
- Separar ingresos planificados de eventos externos y prevenir sobrescritura o cobro repetido.
- Explicar cada cambio de seguidores/fama y aplicar cambio gradual que no borre eventos ocurridos en la semana.
- Probar saldo negativo, préstamo único, pagos, insolvencia y recuperación.
- Probar que perder/rebajar rendimiento puede afectar recreativos con una regla visible y acotada.
- Mantener recompensas pequeñas y progresivas; ninguna fuente debe ser explotable por repetir clic/avance.

**Gate**

- Casos de economía solvente, caja negativa, préstamo, victorias/derrotas, entrevista, evento vencido y actividad social pasan con libro reconciliado.

### Fase 6 — Claridad de instrucciones, traducción y accesibilidad

**Objetivo:** que las acciones se entiendan sin conocer código o recordar instrucciones de chat.

**Trabajo**

- Inventariar texto visible y sacar textos hardcodeados a catálogo estable; identificar origen de notificaciones y tooltips.
- Mantener etiquetas breves y explicación ampliada accesible; traducir errores, ayudas, nombres de estado, fechas, plurales y modales.
- Probar pseudo-localización +40%, nombres largos, zoom, teclado, foco, contraste y lector accesible cuando aplique.
- Eliminar vocabulario confuso o inconsistente y actualizar la guía/tutorial con el loop que realmente existe.

**Gate**

- Sin claves faltantes ni texto desbordado en idiomas/estados habilitados; la traducción no cambia reglas ni cantidades.

### Fase 7 — Guardado, módulos y crecimiento a futuro

**Objetivo:** proteger partidas y facilitar expansión posterior sin implementar integraciones prematuras.

**Trabajo**

- Auditar serialización/migraciones con partidas antiguas, campos ausentes, eventos activos, roster grande y números límite.
- Asegurar que módulos de contenido usen IDs, configuración declarativa y no cadenas visibles como lógica.
- Verificar que una actualización preserva progreso o informa con claridad si un save no se puede recuperar.
- Revisar rendimiento del roster, ranking, calendario, panel y catálogo en datos crecientes.

**Gate**

- Fixtures de save pasan; migraciones idempotentes; operaciones repetidas no duplican efectos; errores son recuperables y diagnosticables.

### Fase 8 — Playtest de QA y endurecimiento

**Objetivo:** jugar la build como usuario antes de pedir al propietario el playtest de producto.

**Trabajo**

- Ejecutar recorridos E2E de partida nueva, partida guardada, caja negativa y roster lleno.
- Simular al menos 12, 52 y 120 semanas con semillas reproducibles y escenarios conservador/agresivo, derrota/lesión, plantel lleno y staff contratado.
- Revisar todas las pestañas en viewports del contrato, consola, 404 de recursos, accesibilidad básica, bundle y estabilidad.
- Comparar cada hallazgo contra criterios anteriores; arreglar y volver a ejecutar el recorrido que detectó la falla y su regresión cruzada.
- Actualizar auditoría integrada, checklist y handoff con evidencia real.

**Gate**

- Cero P0/P1, cero P2 contra requisitos explícitos, suite y build verdes, matriz visual completa, saves y simulaciones aprobadas.

### Fase 9 — Candidato al playtest del propietario

Entregar una build jugable con:

- instrucciones cortas del loop;
- lista de sistemas incluidos y limitaciones conocidas reales;
- checklist de feedback separado en balance, claridad, ritmo, economía e ideas nuevas;
- forma de registrar un bug con pestaña, día/semana, pasos y captura;
- instrucciones de guardar/restaurar partida.

El objetivo del propietario es jugar y opinar sobre producto. Una falla de polish detectada todavía se corrige; no se atribuye al propietario la prueba de consistencia que esta matriz asigna a QA.

## 5. Cobertura de fase: requisito → gate → evidencia

| Requisito aprobado | Fase principal | Evidencia mínima |
|---|---:|---|
| No duplicar datos ni rellenar con indicadores | 0–2 | inspección de jerarquía/capturas y revisión de selectores |
| Canvas sin corte, footer visible y simetría | 1–2 y 8 | medidas DOM y capturas por viewport |
| Grillas Planta/Mercado/Personal/Panel adaptables | 2 | fixtures mínimo/normal/máximo y paginación |
| Talento nuevo y entrenador automático inmediato | 2B/4 | test al reclutar con y sin entrenador |
| Fechas/eventos/calendario coherentes | 3–4 | test de tiempo y recorrido de agenda |
| Loop guanteos/licencia/pelea/lesión/descanso | 4 | E2E completo y caminos bloqueados |
| Economía/seguidores/recompensas/deuda | 5 | libro contable y simulación temporal |
| Texto traducible y acciones claras | 6 | extracción de catálogo, pseudo-localización |
| Partidas persistentes y expansión | 7–8 | fixtures/migraciones/invariantes |
| No pedir al dueño cazar errores simples | 8–9 | matriz PASS con evidencia reproducible |

## 6. Política de defectos y avance

Severidad según QA canónico:

- **P0:** pérdida/daño de partida, bloqueo de avance, regla crítica inválida; detiene todo.
- **P1:** pestaña/sistema principal inutilizable o contradicción que afecta carrera/economía; detiene el gate actual.
- **P2:** incoherencia visible/UX, dato duplicado, texto cortado, simetría rota, retorno confuso; no se cierra el gate afectado.
- **P3:** refinamiento que no contradice un requisito ni bloquea uso; se registra y prioriza antes/después del candidato.

Un fallo obliga a arreglar y repetir la prueba fallida más las pruebas dependientes. No se sigue implementando fases posteriores mientras falle el gate de la fase actual.

## 7. Auditoría del plan

El plan ha sido contrastado contra la matriz pantalla por pantalla y las auditorías 15, 16, 19, 20 y 22.

### Cobertura

- Las pestañas y overlays tienen fase explícita.
- El loop completo está escrito como recorrido verificable.
- Economía, estado/persistencia, traducción y densidad tienen gates separados y cruce integrado.
- Cada requisito del usuario de la auditoría más reciente apunta a fase y evidencia.
- La espera de assets y playtest queda controlada por decisión del propietario.

### Dependencias

```text
Baseline
   ↓
Shell y patrones compartidos
   ↓
Pestañas/densidad ───→ Calendario y eventos
   ↓                         ↓
Loop de carrera ───────→ Economía integrada
   ↓                         ↓
Texto/i18n y accesibilidad ← Persistencia/modularidad
                ↓
       QA multi viewport + larga duración
                ↓
       Candidato al playtest del propietario
```

### Dictamen

No se identifica una auditoría adicional general necesaria antes de empezar. La primera actividad es Fase 0. Si la baseline descubre reglas contradictorias (especialmente entre entrenamiento, licencia, matchmaking, lesión, seguidores, eventos y dinero), se abre una auditoría focalizada de ese módulo antes de cambiarlo. En los demás casos se continúa con el gate existente.

## 8. Estado y siguiente acción

**Estado al 2026-09-23:** Fase 0 completa; Fase 1 implementada y validada en el viewport disponible (970×910), pero pendiente de los otros viewports canónicos; Fase 2 en curso. El informe de evidencia más reciente es `docs/audits/24_Implementacion_Canvas_Densidad_y_Alta_Automatica_2026-09-23.md`.

**Fase 0 — baseline:** `docs/audits/23_Baseline_y_Reconciliacion_2026-09-23.md`; 34/34 tests antes de los cambios.

**Fase 1 — evidencia parcial:** franjas compactadas, eliminación de la franja vacía de mejoras, capacidad de contenido sin recorte en Plantel, cursos accesibles, panel estilizado y footer/dock visibles en 970×910. No se marca la matriz completa como PASS porque aún faltan resoluciones y estados objetivo, y la verificación de consola/red.

**Fase 2 — trabajo realizado, gate abierto:** grillas adaptativas de Plantel, Mercado y Personal; centrado del CTA y acceso al catálogo en Mi Perfil; texto de propiedad sin compresión; cuatro consejos en panel escritorio con dimensiones suficientes; nuevas incorporaciones marcadas y enfoque automático inmediato. Faltan pruebas de límites y revisión completa de todas las categorías/estados de cada pestaña.

**Correcciones lógicas transversales:** fecha civil unificada (semana 1 inicia lunes 5 de enero de 2026) y alta de alumno centralizada para aplicar automáticamente el enfoque con entrenador contratado. Tests totales actuales: 36.

**Última verificación:** `npm run verify` PASS; 36/36, build PASS, presupuesto PASS, auditoría estructural 0/0. No autoriza el playtest final.

**Seguimiento de QA canvas — 2026-09-24:** al probar el build de producción se encontró (a) grilla del Plantel reducida a 17 px en ventana 1280×720, con tarjetas desbordando; (b) Panel del Club con alto basado en `100vh - 140px`, quedando bajo el footer; y (c) columnas rígidas desperdiciadas cuando había menos tarjetas que columnas. Solución aplicada: grilla con filas mínimas y flex sin contracción para que el canvas interno haga scroll; alto del panel ligado a su contenedor; columnas `auto-fit` con ancho mínimo legible y máximo 4/5. El contenido del panel tiene scroll interno. Verificado en producción en 1280×720, 1440×900 y 1920×1080; tests 36/36, build, presupuesto y auditoría sin errores; consola producción limpia. Sigue abierto el gate de extremos de datos y el de pestañas/loop integral; no es todavía candidato al playtest del propietario.

**Seguimiento de reglas límite y matchmaker — 2026-09-23:** sparring automático requiere dos pugilistas disponibles; un solo activo con otros en espera ya no obtiene progreso ni pierde energía, y recibe explicación. Cupos/límites se verifican con escenarios 0/1/10. En matchmaking se detectó y corrigió que se comparaba contra récord de carrera y no por circuito; debutantes profesionales con historial amateur ahora reciben rivales según sus peleas profesionales (±3). En su gate, `npm run verify`: 40/40 pruebas, typecheck/build/presupuesto/auditoría estructural PASS.

**Gate de libro económico semanal — PASS, 2026-09-23:** schema 4 incorpora `semanaLibro`; todas las acciones con delta material registran automáticamente el ingreso/gasto, y domingo concatena los movimientos ocurridos con la liquidación recurrente sin volver a cargar sobre caja lo que ya se gastó/ingresó. Al cerrar, limpia líneas para semana nueva. La migración preserva caja/progreso y reinicia las líneas previas ambiguas, con aviso al jugador. Regresiones: compra + inversión social + dividendo después de serializar/recargar a mitad de semana; bolsa/velada una sola vez; cuota de préstamo; libro limpio al cerrar; 120 semanas con invariante de reconciliación. Resultado: `npm run verify` PASS, **42/42** tests, build, presupuesto y auditoría estructural 0/0. El sistema de previsión sigue siendo estimado y se distingue del balance liquidado. Este gate cierra solamente conciliación semanal local; contratos de eventos especiales, finanzas multi-sede, UI completa y otros gates permanecen abiertos. Playtest final continúa bloqueado hasta pasar la matriz general.

**BOX-10 — revisión de Mercado, 2026-09-26:** auditoría detectó contador fijo de 21 frente a 23 artículos y sugerencia inicial de vendas fuera del presupuesto de $400, pese a que las sogas cuestan $200 y habilitan una estación. El catálogo deriva ahora el total, recomienda por categoría solo opciones pagables y refleja el artículo exacto. Chromium aislado: cinco viewports PASS (capacidad 4/6/8, categorías/paginación, compra y fondos insuficientes, tarjetas por encima del footer); `npm run verify` PASS, 66/66 tests y presupuesto/auditoría PASS. Evidencia: `docs/audits/39_BOX-10_Mercado_Revision_2026-09-26.md`. Sigue pendiente inspección manual del propietario; BOX global y candidato final no se declaran cerrados.

**BOX-11 — revisión de Personal, 2026-09-26:** se corrigió la raíz del CTA engañoso de contratación: requisitos de semana/curso/fama estaban separados del catálogo y la UI permitía pulsar roles aún bloqueados. Ahora `PERSONAL_INFO` es la fuente compartida por la interfaz y el reducer; se ve el motivo de bloqueo y el control queda deshabilitado. También se aclaró el flujo recurrente sin ingresos temporales, se eliminó la acción duplicada en la confirmación de déficit y se ajustó encabezado/paginador para no quedar bajo el footer. Chromium aislado: 5 viewports × 4 recuentos de personal (20 combinaciones), navegación por los nueve puestos, bloquear/desbloquear, contratar con confirmación/despedir y geometría encabezado/tarjetas/paginación/footer; `npm run verify` PASS, 67/67 tests, typecheck/build/presupuesto/auditoría estructural PASS. Evidencia: `docs/audits/40_BOX-11_Personal_Revision_2026-09-26.md`. No se tocó la partida real ni se certifica el balance de largo plazo; el playtest y el QA global permanecen abiertos.

**BOX-12 — revisión del Panel del Club, 2026-09-26:** se alineó el punto global de pendientes con el badge de licencia de Don Anselmo; el dock móvil ya permite cerrar el canal activo y declara `aria-expanded`. Se repararon dos discrepancias narrativas: entrevista con opciones favorables/negativas/declinar y mantenimiento preventivo sin afirmar que el entrenamiento se bloquea. El reductor mantiene la contabilidad del costo y el plazo abreviado ahora se explica accesiblemente. Pruebas Chromium en cinco viewports (1280×720, 1440×900, 1024×600, 970×900, 390×844), cuatro avisos simultáneos, badge de pugilista listo, cierre móvil, contador de vencimiento, footer y sin scroll global. `npm run verify` PASS, 70/70 tests, build/presupuesto/auditoría estructural PASS. Evidencia: `docs/audits/41_BOX-12_Panel_del_Club_Revision_2026-09-26.md`. Pendientes manuales: frecuencia/volumen subjetivo y decisión sobre eventos que superen el límite cuando el inbox está lleno.

Al terminar cada fase, actualizar esta sección con fecha, commit, criterios PASS/FAIL, pruebas exactas, capturas/logs y hallazgos reabiertos. No convertir este plan en una promesa de “cero errores”; usarlo como criterio auditable de preparación. No declarar cerrada una fase a partir de un único viewport o de una prueba del motor cuando el criterio requiere inspección de interfaz.

### Reapertura integral previa a BOX-15 — 2026-10-01

La auditoría vigente es `docs/audits/44_Auditoria_Integral_Pre_BOX-15_2026-10-01.md`. `npm run verify` sigue en PASS con 73/73 tests, pero las nuevas sondas reproducen fallos de persistencia, avance temporal, salud, efectos de catálogo, personal y recompensas; la matriz de siete pestañas también detecta colapso del canvas central en móvil 390×844 pese a footer visible. Se reabren los gates correspondientes; los PASS anteriores conservan solamente su alcance documentado. No declarar candidato final ni cerrar BOX-15 sin resolver o delimitar expresamente los hallazgos A01–A28. Orden propuesto: R1 guardado/carrera → R2 tiempo/salud/combate → R3 contenido/economía → R4 canvas/texto/accesibilidad → R5 integración. Esta actualización registra auditoría y propuesta; no significa que las reparaciones ya se hayan implementado.
