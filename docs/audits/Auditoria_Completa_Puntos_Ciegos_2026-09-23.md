# Auditoría completa de La Vida del Boxeo — puntos ciegos y pendientes reales

Fecha: 23 de septiembre de 2026  
Alcance: código, motor de reglas, economía, persistencia, UX, UI, textos, viewport, accesibilidad, progresión, combate y continuidad histórica.  
Criterio: distinguir lo que está funcionando, lo que es un riesgo y lo que falta implementar.

## Resumen ejecutivo

El prototipo es estable para una prueba manual y no presenta errores de compilación. Sin embargo, todavía no está listo para declararse cerrado end-to-end. Encontré cuatro riesgos de lógica que conviene resolver antes de una ronda final de contenido:

| Prioridad | Hallazgo | Estado | Consecuencia |
|---|---|---|---|
| P0 | `proximaPeleaSemana` se guarda, pero la búsqueda manual de rival no la respeta | Confirmado en código | Se puede pactar una pelea antes del descanso mínimo |
| P0 | Transferir un boxeador con pelea pendiente no cancela la pelea | Confirmado en código | Queda una cartelera con un `miId` que ya no está en el plantel |
| P1 | El paso a profesional ocurre automáticamente al llegar a 50 peleas amateurs | Confirmado en código | El jugador no decide ni ve una confirmación de carrera |
| P1 | El primer título se habilita desde 4 peleas profesionales | Confirmado en código | No coincide con la regla acordada de 10/15 peleas para títulos nacionales |

El resto de los problemas son principalmente de cobertura, claridad, escalabilidad o contenido todavía incompleto: lesiones sin tratamiento jugable, retiros no implementados, alumnos recreativos ausentes, calendario sin agenda libre y tests de navegador insuficientes.

## Evidencia técnica de la auditoría

- `npm run typecheck`: OK.
- `npm test -- --run`: 16/16 pruebas OK.
- `npm run build`: OK.
- `node audit_engine.js`: 0 errores, 0 advertencias.
- Simulación de 120 semanas: sin excepciones y sin crecimiento infinito del plantel.
- Playtest visual reciente: ficha técnica, Panel del Club, Don Anselmo, Finanzas Sociales y transición diaria revisados en navegador a 1280×720.

La batería automática no cubre todavía todos los problemas señalados: que compile y que el motor tenga tests no demuestra que todos los flujos del navegador sean imposibles de romper.

## Leyenda de severidad

- **P0 — Bloqueante:** puede romper una partida o permitir una regla inválida.
- **P1 — Alto:** contradice una regla acordada o deja una función incompleta.
- **P2 — Medio:** confunde, dificulta el uso o puede generar deuda técnica.
- **P3 — Bajo:** pulido, consistencia o mantenimiento.

# 1. Auditoría por pestaña

## 1.1 Inicio / nueva partida / continuar

### Está bien

- Permite crear una partida con nombre de coach, gimnasio y emblema.
- Muestra partidas guardadas con nombre, coach, gimnasio, semana y fecha.
- El juego guarda automáticamente después de las acciones.
- El usuario no ve “Exportar JSON” ni “Importar JSON”.

### Puntos ciegos

1. **P1 — Lista de partidas sin paginación.** Se conservan hasta cinco ranuras, pero la pantalla de inicio no tiene una navegación explícita si en el futuro se aumenta ese límite.
2. **P1 — Confirmación del navegador.** `window.confirm` funciona, pero rompe la estética del juego y se comporta distinto según navegador.
3. **P2 — Migración parcial.** `sanitizarEstado` agrega valores faltantes, pero muchas colecciones se convierten mediante casts de TypeScript sin validar cada elemento (`historial`, `eventos`, `comunitarios`, `cursos` y `personal`). Una partida antigua o manipulada puede cargar datos imposibles.
4. **P2 — Sin indicador de versión para el jugador.** No se informa si una partida fue migrada ni si alguna función nueva se adaptó automáticamente.
5. **P2 — Reiniciar carrera y borrar ranura no tienen una confirmación visual propia.** Usan diálogos nativos.

### Prueba pendiente

Crear dos partidas, guardar ambas, recargar el navegador, cargar cada una, avanzar días y confirmar que no se mezclen estados entre `partidaId`, nombre, dinero y plantel.

## 1.2 Barra superior, calendario y avance del día

### Está bien

- Muestra día, fecha, semana, dinero, fama, mejoras activas y agenda semanal.
- `Avanzar día` tiene una transición breve y un resumen contextual.
- `Semana rápida` existe como atajo de comodidad.

### Puntos ciegos

1. **P1 — “Semana rápida” no presenta un resumen de cada día.** Salta directamente al sábado/domingo; es válido como acelerador, pero puede ocultar eventos, mensajes o incorporaciones que ocurrieron de lunes a viernes.
2. **P2 — La fecha es calculada desde enero de 2026 y no usa el campo `mes`/`anio` como fuente única.** El estado conserva calendario propio y la barra reconstruye otra fecha; ambos deben mantenerse sincronizados en una sola función.
3. **P2 — El resumen diario es contextual, no factual.** Dice “revisá energía, enfoques y pendientes”, pero no enumera qué ocurrió realmente ese día.
4. **P2 — El calendario no muestra una pelea futura pactada fuera del sábado.** Todas las peleas creadas por el motor se programan en día 6.

## 1.3 Gimnasio

### Está bien

- El gimnasio muestra estaciones, alumnos, federados, cinturones y mejoras.
- El plantel se puede abrir desde la vista principal.
- La capacidad aparece como `4/10` y las estaciones libres se distinguen.

### Puntos ciegos

1. **P2 — Las estaciones son principalmente decorativas.** El efecto real vive en el motor, pero la estación visual no siempre explica qué mejora activa ni qué alumno la usa.
2. **P2 — La vista depende de CSS de altura fija y `overflow-hidden`.** Aunque fue compactada, cualquier aumento de textos, nombre largo o zoom del navegador puede volver a cortar el pie del gimnasio.
3. **P2 — El entrenamiento automático del Director Técnico no se comunica dentro de la estación.** El jugador debe inferirlo desde la ficha o desde un toast.
4. **P3 — Varias etiquetas antiguas pueden sobrevivir en assets/textos históricos** si se amplía el catálogo; conviene centralizar todos los nombres visibles en `data.ts`.

## 1.4 Ciudad

### Está bien

- Hay clubes rivales visibles en el mapa.
- Ranking mundial, salón de la fama y búsqueda de talentos tienen accesos separados.
- El ranking está paginado y no exige scroll.
- La propiedad seleccionada muestra precio, requisito y beneficio.

### Puntos ciegos

1. **P1 — Hay bloques de Ciudad mantenidos en código pero ocultos con `hidden`.** El scouting y las actividades sociales siguen renderizados en una sección inalcanzable, además de existir en Mi Perfil. Esto duplica lógica y aumenta el riesgo de corregir una versión y olvidar la otra.
2. **P1 — El mapa visual muestra clubes, pero la simulación rival no tiene ciclo vital.** Los rivales tienen récord y club, pero no envejecen, no se retiran ni son reemplazados de forma procedural.
3. **P2 — El ranking es de competidores, no un ranking histórico completo.** El salón de la fama propio sí existe, pero no hay una historia global de campeones rivales retirados.
4. **P2 — Comprar propiedades puede ser poco reversible.** No hay venta, mantenimiento diferenciado ni explicación del costo de oportunidad.
5. **P2 — La propiedad `arena` y otros requisitos se entienden después de hacer clic.** Deben mostrar el requisito antes de seleccionar o intentar comprar.

## 1.5 Plantel

### Está bien

- Separa alumnos, espera y boxeadores federados.
- Muestra guanteos, energía, valoración, circuito y record.
- Permite licenciar al atleta desde su ficha.
- Permite transferir o retirar alumnos y liberar cupos.

### Puntos ciegos

1. **P1 — Los alumnos recreativos no existen como rol.** Todo alumno sigue siendo potencial competidor; falta el camino “recreativo, paga cuota, entrena, no compite”.
2. **P1 — El total de guanteos posteriores a 10 no se muestra claramente.** `guanteosRealizados` existe, pero la interfaz prioriza `fogueo` y queda en `10/10`; el jugador no sabe cuánto sparring acumuló después.
3. **P1 — Transferir un boxeador con combate pendiente deja la pelea en `pendientes`.** El botón de transferencia está disponible en la ficha profesional y `RETIRAR_ATLETA` no cancela la cartelera asociada.
4. **P2 — “Retirar” y “transferir” usan la misma acción interna.** El jugador no puede distinguir si conserva historia, si libera cupo, si cobra una transferencia o si el atleta pasa al salón de la fama.
5. **P2 — La espera se normaliza solo para alumnos.** La regla es correcta para capacidad, pero falta una explicación visible de que un boxeador federado también ocupa lugar total de plantel.

## 1.6 Ficha técnica

### Está bien

- La ficha entra en la ventana compacta validada.
- Los pilares tienen barras comparables.
- Los seis enfoques usan `+ capacidad`.
- El consejo muestra el nombre completo del enfoque recomendado.
- La licencia individual se distingue de la licencia del entrenador.

### Puntos ciegos

1. **P1 — El consejo recomienda un enfoque según una heurística, no siempre según el enfoque asignado.** Esto es correcto si se quiere “recomendado”, pero debe quedar explícito que puede diferir del enfoque activo.
2. **P1 — Si hay un Director Técnico, el motor puede cambiar automáticamente el enfoque semanal.** La ficha permite hacer clic manualmente, pero no comunica con suficiente fuerza que el personal puede reemplazar esa elección al comenzar la semana.
3. **P2 — “Talento” mezcla atributo y techo potencial.** El atributo `talento` funciona como capacidad mental y techo de crecimiento; la UI debe separar “Talento” de “Techo de crecimiento” si se quiere explicar correctamente.
4. **P2 — La licencia no muestra número, fecha, estado ni historial de emisión.** La booleana `licenciaFederativa` resuelve la regla mínima, pero no una carrera deportiva completa.
5. **P2 — La lesión muestra gravedad y semanas, pero no ofrece acción médica.** El campo `tratamiento` existe, se calcula y no se puede usar desde la ficha.

## 1.7 Mercado

### Está bien

- Categorías y paginación evitan saturar la pantalla.
- Los artículos tienen costo, efecto y requisitos.
- Las compras son idempotentes: no se puede comprar dos veces el mismo ID.

### Puntos ciegos

1. **P1 — No existe venta, reemplazo ni mantenimiento del equipamiento.** La compra es permanente y el balance no distingue inversión de gasto recurrente.
2. **P2 — El efecto se muestra como texto, pero no siempre se refleja en la barra de “Mejoras activas”.** La barra superior resume solo algunos efectos.
3. **P2 — Indumentaria y equipamiento comparten la misma lógica de compra, pero no explican si pertenecen al club, al atleta o a todo el plantel.** Esto puede producir decisiones económicas confusas.
4. **P2 — Los nombres cortos mejoraron, pero el catálogo histórico/spec sigue usando nombres largos.** Hay riesgo de que vuelvan a aparecer “Bucal moldeado”, “Cabezal olímpico” o “Botas antideslizantes” en una futura vista.

## 1.8 Mi Perfil

### Está bien

- Cursos, bienes raíces, finanzas sociales y legado están agrupados.
- Los cursos se abren desde una rama y ya no duplican el botón superior.
- Guardado, lectura, contraste, movimiento y atajos están disponibles en ajustes.

### Puntos ciegos

1. **P1 — Curso de Licencia de Entrenador y empleado Director Técnico son conceptos muy cercanos.** El jugador puede confundir autorización del coach con empleado que automatiza entrenamiento.
2. **P1 — El sistema de legado reinicia la carrera con una confirmación y bonificaciones, pero no hay una pantalla comparativa de qué se conserva y qué se pierde.**
3. **P2 — Finanzas sociales está accesible aquí, pero la economía todavía no muestra un historial por actividad dentro de Mi Perfil.**
4. **P2 — El curso largo se abre en modal; el modal general usa `overflow-hidden`.** Una rama con más cursos puede volver a cortarse.
5. **P2 — Los atajos aceptan texto libre.** Dos acciones pueden terminar con la misma tecla y no hay advertencia de conflicto.

## 1.9 Personal

### Está bien

- La contratación está paginada.
- Hay requisitos de semana, fama, curso y sucursal.
- Se puede despedir personal.

### Puntos ciegos

1. **P1 — El botón despedir no pide confirmación.** Es una acción que altera el gasto semanal y puede afectar automatizaciones.
2. **P1 — No hay una vista de impacto antes de contratar.** El jugador ve el sueldo, pero no siempre el cambio proyectado en el balance.
3. **P1 — Director Técnico modifica automáticamente enfoque y descanso, pero esa automatización no tiene un interruptor global ni un registro de decisiones.**
4. **P2 — La restricción de sucursales cuenta puestos, pero no existe un flujo para asignar un gerente a una sucursal concreta.**
5. **P2 — Los empleados no tienen nivel, experiencia, contrato ni costo de despido; son botones binarios.**

## 1.10 Panel del Club

### Está bien

- Mensajes, patrocinios, prensa y Don Anselmo están separados.
- Don Anselmo tiene paginación.
- Las notificaciones se desvanecen.

### Puntos ciegos

1. **P2 — Los eventos caducan, pero no hay un registro de eventos ya vencidos o rechazados.** El jugador puede no saber qué oportunidad perdió.
2. **P2 — Los textos de acciones vienen del evento, pero el botón visual se simplifica a “Aceptar/No aceptar”; falta mostrar claramente inversión, duración y resultado esperado en todos los casos.
3. **P2 — El panel usa `overflow-hidden` deliberadamente.** La paginación evita el corte actual, pero cada nueva tarjeta debe pasar una prueba de altura.

## 1.11 Combate

### Está bien

- Hay fases de cartelera, esquina, asaltos, conteo y fallo.
- Hay CompuBox y tarjetas de jueces.
- Las lesiones, energía, bolsa, fama y record se conectan al resultado.

### Puntos ciegos

1. **P1 — No hay prueba de navegador automatizada para una pelea completa.** El motor está testeado parcialmente, pero el flujo `buscar rival → elegir oferta → cartelera → combate → resultado → balance` no está cubierto como integración.
2. **P1 — La tabla round-by-round usa `overflow-hidden` con altura máxima.** En una pelea larga, las rondas antiguas pueden desaparecer sin una indicación visible de que hay más información.
3. **P2 — La estrategia de esquina y el enfoque semanal son sistemas distintos, pero el vocabulario puede hacerlos parecer iguales.**
4. **P2 — La lesión se aplica al resultado, pero tratamiento, médico y kinesiología todavía no son sistemas jugables.**

# 2. Auditoría de lógica del motor

## 2.1 Calendario y entrenamiento

- El guanteo se ejecuta automáticamente el sábado para alumnos y boxeadores.
- La práctica suma técnica y defensa y consume energía.
- Los alumnos no aumentan `fogueo` por encima de 10, pero sí aumentan `guanteosRealizados`.
- Con Director Técnico, el enfoque puede ser reemplazado por descanso o consejo automático.

**Riesgo:** el jugador puede elegir un enfoque y luego descubrir que el empleado lo cambió sin una orden o historial visible.

## 2.2 Licencias y progresión

- Curso `dt` habilita la emisión individual.
- Diez guanteos habilitan la licencia del atleta.
- La licencia cambia el rol a boxeador y crea record 0-0-0.
- A las 50 peleas amateurs el circuito cambia automáticamente a profesional.

**Faltante de diseño:** el cambio a profesional debería ser una oferta/decisión visible, con requisitos, costo, riesgo y confirmación.

## 2.3 Peleas y descanso — hallazgo bloqueante

`RESOLVER_PELEA` escribe `proximaPeleaSemana = semana + 2` para amateur y `+3` para profesional. El representante automático sí consulta ese campo, pero `BUSCAR_RIVAL` y `ELEGIR_OFERTA` no lo consultan. Por eso un jugador puede abrir ofertas y confirmar una pelea antes de la fecha permitida.

**Solución recomendada:** una única función `puedePactarPelea(p, estado)` usada por representante, búsqueda manual y confirmación final. Debe explicar “Disponible nuevamente en la semana X”.

## 2.4 Transferencia con pelea pendiente — hallazgo bloqueante

`RETIRAR_ATLETA` elimina al pugilista del plantel, pero no filtra `pendientes` por `miId`. La ficha permite transferir a un profesional aunque tenga pelea agendada.

**Solución recomendada:** bloquear la transferencia mientras haya pelea pendiente o abrir una confirmación que cancele la pelea y muestre la penalización/efecto.

## 2.5 Títulos

El motor habilita el primer título profesional desde 4 peleas y 3 victorias. La regla acordada indicaba comenzar títulos nacionales alrededor de 10/15 peleas y títulos regionales/mundiales desde 25.

**Solución recomendada:** centralizar requisitos en `TITULOS`, hacer que `tituloAspirable` lea esa fuente y mostrar el requisito exacto en la oferta.

## 2.6 Plantel y crecimiento

- El límite total de capacidad + reserva evita saturación.
- El scouting está limitado a un uso semanal.
- La lista de espera se normaliza.

**Faltantes:** retiro por edad/decisión, generaciones rivales, alumnos recreativos, transferencia con destino visible y cupos diferenciados por categoría.

## 2.7 Economía

### Conectado

Cuotas, aportes federados, alquiler, personal, patrocinio, eventos sociales, sucursales, marca, veladas, bolsas, equipo, cursos, propiedades y costo financiero de caja negativa.

### Riesgos

1. El balance semanal es correcto como resultado, pero el jugador no tiene un estado financiero acumulado por mes o año.
2. El costo de lesión se guarda en `tratamiento`, pero no se cobra ni se ofrece.
3. La previsión semanal excluye peleas y eventos variables, pero no siempre muestra si ya hay una pelea o evento agendado.
4. Las acciones de patrocinio y eventos pueden ser aceptadas desde un mensaje vencido o duplicado si el estado cambia entre su generación y su resolución.
5. No hay préstamos ni salvataje financiero; una caja negativa solo agrega costo financiero.

# 3. Auditoría de textos y vocabulario

## Consistente

- “Avanzar día”.
- “Guanteos (sparring)”.
- “Enfoque recomendado”.
- “Panel del Club”.
- “Finanzas sociales”.

## A revisar históricamente

- `fogueo`, `prácticas de combate`, `guanteos` y `sparring` todavía aparecen como identificadores internos o en documentación antigua.
- “Director Técnico”, “Licencia de Entrenador” y “Director Técnico Principal” necesitan una explicación comparativa.
- “Rival Accesible” promete “Victoria segura” en el texto de datos; ningún rival debería prometer una victoria segura.
- “Pugilista”, “atleta”, “boxeador” y “alumno” deben tener un glosario explícito según etapa.
- “KO”, “nocaut”, “fogueo” y “sparring” requieren una decisión sobre español accesible para edades amplias.

# 4. Auditoría visual, UI y UX

## Confirmado como mejorado

- No se observó corte en la ficha compactada a 1280×720.
- El ranking está paginado.
- Mercado y Personal están paginados.
- Don Anselmo está paginado.
- Finanzas sociales está en Mi Perfil.
- La transición de día es visible y no bloqueante.

## Riesgos visuales que siguen abiertos

1. El componente `Modal` usa `overflow-hidden` tanto en contenedor como en contenido. Un modal nuevo puede cortar contenido silenciosamente.
2. Hay múltiples `overflow-hidden` en pantallas principales. Esto cumple la regla de no usar scroll, pero obliga a que todo contenido nuevo tenga paginación o resumen.
3. La pantalla de combate tiene un cuadro round-by-round con altura máxima y sin indicador “hay más rondas”.
4. El inicio usa `overflow-hidden`; con cinco partidas, texto grande y una ventana baja, puede volver a cortar el formulario.
5. Las opciones de texto grande y alto contraste no tienen una prueba visual en todas las pestañas.
6. Los atajos pueden colisionar y no hay aviso.

# 5. Código histórico y deuda técnica

1. Hay secciones completas ocultas con `hidden` en Ciudad y Cursos. Deben eliminarse o convertirse en componentes reutilizables.
2. Queda una acción interna `IMPORTAR` en el reducer, aunque la UI ya no ofrece importar JSON. Debe mantenerse solo si se documenta como compatibilidad o eliminarse en una migración.
3. El documento funcional y algunas auditorías antiguas describen nombres y reglas previas. La fuente de verdad debe ser código + glosario vigente, no una carpeta de documentos contradictorios.
4. Faltan pruebas de componentes y de navegación; la suite actual es principalmente de motor.
5. El error boundary solo muestra “Recargar juego”; no conserva un diagnóstico visible ni ofrece recuperación de partida.

# 6. Matriz de pruebas faltantes

| Flujo | Hoy | Falta |
|---|---|---|
| Crear partida | Parcialmente manual | Prueba de navegador completa |
| Guardar/cargar dos ranuras | No automatizado | Integración con localStorage |
| Avanzar 120 semanas | Motor OK | Verificar también eventos y UI |
| Licenciar alumno | Unit test OK | Flujo visual completo |
| Buscar rival y pelear | Motor parcial | Integración end-to-end |
| Transferir con pelea pendiente | No cubierto | Test de bloqueo/cancelación |
| Cooldown entre peleas | No cubierto | Test manual y unitario |
| Ficha a 1280×720 | Validado manualmente | Matriz 1024×768, 1366×768 y zoom |
| Contraste/texto grande | No cubierto visualmente | Capturas comparativas |
| Atajos duplicados | No validado | Regla de colisiones |
| Actualización de schema | Parcial | Fixtures de partidas antiguas |

# 7. Orden recomendado de solución

## Bloque A — Integridad competitiva

1. Aplicar cooldown de pelea en búsqueda y confirmación.
2. Bloquear o resolver transferencia con pelea pendiente.
3. Ajustar títulos a la progresión acordada y centralizar requisitos.
4. Hacer visible el paso amateur → profesional.

## Bloque B — Carrera del atleta

5. Agregar alumno recreativo.
6. Agregar total de guanteos visible después de 10.
7. Crear lesiones tratables con médico/kinesiología y costos claros.
8. Implementar retiro, transferencia y salón de la fama histórico.

## Bloque C — Economía y persistencia

9. Crear resumen mensual/anual.
10. Validar todos los eventos al resolverlos contra el estado actual.
11. Agregar fixtures de migración y limpiar campos incompatibles.
12. Decidir préstamos o patrocinio de emergencia.

## Bloque D — Limpieza visual y técnica

13. Eliminar bloques ocultos duplicados.
14. Crear un componente único de paginación/modal seguro para altura.
15. Validar texto grande, contraste, zoom y ventanas bajas.
16. Detectar y bloquear conflictos de atajos.

# Veredicto

La base es jugable y estable, pero la auditoría no recomienda declarar el juego terminado todavía. Los dos bloqueantes reales son el cooldown de peleas y la transferencia de atletas con cartelera pendiente. Luego deben resolverse títulos, transición al profesionalismo, lesiones jugables y pruebas de integración. Los assets 2D/3D siguen correctamente fuera de alcance hasta cerrar estos puntos.
