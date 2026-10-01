# Informe de implementación — Canvas, grillas y alta automatizada

**Fecha:** 2026-09-23\
**Branch:** `feature/audit-hardening`\
**Estado:** Fase 1 validada en el viewport observado; Fase 2 parcial. No habilita el playtest del propietario.\
**Partida inspeccionada:** `Aminc`, semana 5, miércoles 4; no se avanzó el tiempo ni se alteró el estado de juego.

**Seguimiento:** se alineó la grilla del Plantel con su capacidad de paginación: las vistas compactas usan cuatro columnas y las amplias cinco, evitando reservar una columna vacía cuando solo se muestran cuatro tarjetas. También se habilitó scroll interno en el contenido del Panel del Club, cuyo contenedor podía ocultar tarjetas bajo la altura fija del dock móvil. Verificación de regresión: `npm run verify` PASS (36/36 tests, compilación, presupuesto y auditoría estructural). La interfaz visual abierta en el navegador no corresponde de forma verificable al mismo worktree compilado, por lo que no se atribuye validación visual a estos ajustes.

**QA visual complementaria del seguimiento:** se probó un juego temporal nuevo en origen aislado con el build de producción (`vite preview`), sin tocar la partida guardada del usuario ni avanzar días.

| Viewport | Evidencia medida | Resultado |
|---|---|---|
| 1280×720 | Panel: y=184.9–689.5; footer inicia en 697.5. Plantel de 3 alumnos: grilla usa tres columnas de ~299 px y tarjetas de 112 px. El canvas tiene scroll interno (351/256 px); al desplazar 94 px las tres tarjetas quedan completas hasta y=690.3, antes del footer. | PASS |
| 1280×720 | Don Anselmo: panel dentro del footer; contenido interno 397 px, scrollHeight 615 px; 4 consejos por página y página 2 alcanzable. | PASS |
| 1440×900 | Plantel de 3 alumnos: columnas sobrantes colapsan (3 de ~355 px + 1 de 0 px), sin dejar el ancho de una columna vacía; panel termina antes del footer. | PASS |
| 1920×1080 | Personal muestra cuatro tarjetas en cuatro columnas (~382 px); panel termina antes del footer. Mercado muestra 8 tarjetas/página y pasa a 2/2; cambio de categoría muestra la lista propia (4 elementos en Instalaciones y Salud). | PASS |

Producción: consola sin errores ni advertencias. La sesión de desarrollo sí registró cierres de WebSocket de Vite, descartados como ruido de HMR; no aparecieron en producción. No se afirmó una auditoría de red exhaustiva para todos los recursos ni validación móvil táctil.

## QA de reglas límite del Plantel — 2026-09-24

Los estados del motor revelaron que `diaSabado` iniciaba el guanteo cuando había al menos un participante con energía y dos registros en el plantel; el segundo podía ser un alumno en espera, que no participa. Eso permitía reportar sparring para una única persona. Se cambió el gate a **dos pugilistas disponibles con energía** y se agregó un aviso explicativo cuando queda solo uno.

Nuevas regresiones incluidas:

- partida sin pugilistas: completa semana y balance, inicia semana siguiente sin excepción;
- un pugilista disponible + un alumno en espera: no progresa guanteos ni gasta energía, informa el requisito de pareja;
- roster máximo 10 amateur + 10 profesional + 10 alumnos: licencia nueva bloqueada al llenar amateurs, sin cobrar; al transferir un amateur se habilita la licencia y los cupos quedan 10/10, costo de $200 aplicado una sola vez;
- transferir/liberar plaza conserva el alta automática de la primera persona en espera (test preexistente).

`npm run verify`: **PASS**, typecheck, **39/39 tests**, build, presupuesto y auditor estructural 0 errores/0 advertencias. Este gate cubre lógica del motor, no sustituye los límites visuales aún pendientes (0/1/10/20 boxeadores) ni la prueba larga integrada de combate/economía.

## 1. Cambios implementados

1. **Presupuesto del shell:** se activa el modo compacto hasta 950 px de alto. Elimina la franja de mejoras cuando no hay mejoras; compacta navegación, banners y previsión sin eliminar acciones. Se conserva el dock móvil y el footer dentro del alto disponible.
2. **Plantel:** capacidad adaptada a cuatro tarjetas en ventanas compactas y diez solo en canvas amplio; las secciones federados/alumnos mantienen paginación independiente. El área de contenido permite scroll interno si el plantel supera el espacio real, sin cortar información ni producir scroll global.
3. **Mercado:** cuatro tarjetas en ventana compacta, seis en la capacidad intermedia observada y ocho en canvas ancho; el selector de categoría reinicia la página y la paginación queda visible.
4. **Personal:** cuatro tarjetas por página cuando la ventana puede sostener una grilla de dos por dos; dos en ventanas bajas/estrechas. Se evita estirar dos tarjetas a casi todo el alto disponible.
5. **Panel del Club:** Don Anselmo muestra hasta cuatro consejos cuando el panel de escritorio tiene suficiente ancho/alto; mantiene dos en vistas compactas.
6. **Mi Perfil:** se conserva visible el panel que contiene `Ver cursos` también en ventanas bajas; icono, rótulo, panel de rama y CTA se centran. Se quitaron bloques inferiores redundantes de seguidores, caja/deuda e histórico.
7. **Mercado y Calendario:** se retiraron resúmenes inferiores que repetían caja, seguidores, mejoras o recordatorios ya disponibles en otras zonas.
8. **Ciudad:** el texto de propiedades ya no se comprime por flex y queda completo en la medición observada.
9. **Calendario:** `fechaDelJuego` es una única fuente para cabecera y calendario; la semana 1 empieza lunes 5 de enero de 2026, y los nombres de día coinciden con las fechas civiles.
10. **Alta y entrenador:** una función común integra nuevos alumnos de búsqueda, eventos, boca a boca, sucursales y bingo. Conserva el número de semana de ingreso y, si existe entrenador automático, asigna de inmediato el enfoque recomendado/descanso. La tarjeta muestra `Recién incorporado` únicamente durante esa semana.

## 2. Validación visual observada

**Único viewport efectivamente validado:** 970×910 CSS px en el navegador integrado.

| Vista | Medición/resultado | Estado |
|---|---|---|
| Shell/footer | Documento 910/910 px; footer y dock visibles; sin scroll global. Canvas `main`: y=315.7–843.5, alto 527.8 px. | PASS en este viewport |
| Plantel, estado de 4 alumnos | 4 tarjetas completas; el grid ocupa y=554.9–843.5. El recorte previo de ~18 px deja de reproducirse. | PASS en este estado |
| Mercado, equipamiento | 6 tarjetas en 2 columnas × 3 filas; paginación visible y completa al fondo del canvas. | PASS en esta categoría/viewport |
| Personal | 4 tarjetas en 2 × 2; cards de 170 px, sin estiramiento vertical; controles completos. | PASS en esta vista |
| Mi Perfil / Cursos | Panel y `Ver cursos` presentes; CTA centrado (x=421.6–548.4); el botón abre el diálogo de cursos y se cierra sin mutar partida. | PASS en este flujo |
| Ciudad | Inspector: `scrollHeight = clientHeight = 77`; no se observó texto interno cortado. | PASS en propiedad actual |
| Calendario | 7 celdas de 291 px, fechas coherentes con lunes–domingo. | PASS en semana observada |

No se midieron aquí 1280×720, 1440×900, 1920×1080, móvil/tablet ni escenarios de máxima población. No inferir PASS para esos tamaños/estados. La inspección de recursos 404 tampoco se pudo concluir mediante el navegador; permanece pendiente la revisión de consola/red en Fase 8.

## 3. Pruebas automatizadas

`npm run verify` — **PASS**, después de los cambios:

- `tsc --noEmit` PASS.
- Vitest: **36/36** PASS, incluyendo fecha civil alineada y nuevo alumno con entrenador automático.
- Vite build PASS.
- Presupuesto: JS 480.9 KiB / 560 KiB; CSS 70.4 KiB / 90 KiB.
- `audit_engine.js`: 0 errores, 0 advertencias.
- `git diff --check`: sin errores de whitespace; Git informa conversiones LF/CRLF esperables del entorno Windows.
- Pruebas existentes incluyen simulación determinista de 52 semanas y 120 semanas; ambas siguen verdes. Esto prueba invariantes del motor, no equivalencia a una prueba E2E humana de todas las funciones.

## 4. Puntos aún abiertos

- **Fase 1 completa solo para 970×910.** Falta geometría en todos los viewports canónicos y states anchos/compactos, consola/red, gimnasio, modales y pantalla de combate.
- **Fase 2 parcial.** Plantel/Mercado/Personal/Perfil/Ciudad recibieron cambios focalizados. QA visual real ahora cubre 1280×720, 1440×900 y 1920×1080 en el caso de 3 alumnos, Personal con 4 tarjetas, Mercado en ambas páginas, categoría de 4 elementos y Don Anselmo con 7 hitos. Aún faltan extremos de 0/1/10/20 pugilistas, lista de espera, licencia recién emitida, caja insuficiente, textos extensos, Gimnasio completo, interacciones de combate y más estados del Panel del Club.
- Los ocho elementos del Mercado dependen del tamaño del viewport; solo se observaron seis. No se afirma que ocho tarjetas entren en una ventana concreta hasta medirla.
- Calendario ahora usa una fecha civil coherente desde enero de 2026; hay que revisar eventos/partidas guardadas y los límites de mes/año en pruebas ampliadas.
- La marca `Recién incorporado` se elimina visualmente al cambiar de semana, sin migración destructiva. Revisar altas que ocurren al cierre semanal y espera.
- Quedan gates del plan: combate/lesiones, reconciliación económica ampliada, localización completa, persistencia/migraciones extensivas, consola/404, accesibilidad y E2E larga duración.

## 5. Dictamen

El defecto medido de espacio y recorte en Plantel está corregido para la partida y viewport observados; los bloques redundantes fueron retirados, no sustituidos por métricas clonadas. La corrección del calendario y del enfoque inmediato del recién incorporado tiene regresiones automatizadas. Esto **no** demuestra todavía que todas las pestañas, tamaños y sistemas funcionen end-to-end ni autoriza el playtest final del propietario. Continuar con los gates 2B–8 y repetir pruebas cruzadas ante cada cambio.

## 6. Seguimiento posterior: límites del Plantel y matchmaking

En una ampliación de pruebas de límites se encontró que el sparring sabatino se ejecutaba con un único boxeador activo si existían otros miembros en espera. Ahora exige dos participantes elegibles; el caso de un único participante conserva energía y progreso y explica al jugador por qué no hubo sesión. Se cubrieron roster vacío, lista de espera y cupos llenos/liberación/licencia.

La auditoría del matchmaking también halló que la experiencia rival usaba el récord histórico general. Ese dato incluye los combates amateur después de la conversión a profesional, por lo que un debutante profesional podía recibir un rival con demasiadas peleas profesionales. Ahora las ofertas se generan con el conteo del circuito vigente; el margen probado es ±3. Regresiones incluyen debut amateur, debut pro después de 45 peleas amateur y pro con 8 peleas.

**Evidencia en el gate de matchmaker:** `npm run verify` PASS — TypeScript, Vitest **40/40**, build de producción, presupuesto JS/CSS y auditoría estructural (0 errores/advertencias). Ese gate pasa para las reglas probadas; aún se deben validar flujos de interacción en UI, resolución de combate y lesiones.

## 7. Gate de conciliación semanal — implementado y probado

La revisión inicial confirmó que el cierre reemplazaba las listas con cuotas/costos y no incorporaba de forma fiable las operaciones previas; además, el resumen aplicaba otra vez esos importes al saldo. Se implementó un registro semanal persistente con una frontera común de deltas del reducer. Las líneas de compra, inversión social, bolsa, velada y otros movimientos ya ocurridos se conservan; el cierre agrega ingresos/gastos recurrentes y aplica a caja solamente la liquidación nueva. El total del resumen representa toda la semana contabilizada.

Se elevó el estado persistido a schema 4. Las partidas anteriores conservan saldo y progreso; como sus líneas antiguas no permiten atribuir cada movimiento a una semana sin riesgo de duplicación, se limpian y se inicia el libro nuevo limpio con aviso. La proyección sigue siendo estimada y separada de la liquidación variable del domingo.

**Evidencia:** `npm run verify` PASS con Vitest **42/42**, typecheck, build, presupuesto y `audit_engine.js` (0 errores/advertencias). Prueba adicional recarga estado a mitad de semana, concilia compra + inversión + dividendos, valida bolsa y velada una sola vez, revisa cuota de préstamo y ejecuta 120 cierres consecutivos comprobando `resumen.total = ingresos − gastos = saldo final − saldo al inicio del período`. Gate económico del libro semanal: PASS para el prototipo. La matriz general del juego, combate/lesiones, interfaz completa, localización, accesibilidad, consola/404 y E2E de duración siguen abiertos; no declarar candidato ni autorizar el playtest final.
