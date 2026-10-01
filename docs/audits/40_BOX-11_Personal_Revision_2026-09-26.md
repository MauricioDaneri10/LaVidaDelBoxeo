# BOX-11 — Revisión de Personal y contratación

Fecha: 2026-09-26\
Estado: **Correcciones aplicadas; gate automatizado y visual PASS; feedback del propietario pendiente**\
Alcance: pestaña Personal, requisitos de cada puesto, confirmación financiera, tarjetas, paginación y footer. No se alteran sueldos, efectos de juego ni el contenido de una partida real.

## Hallazgos de raíz

1. **La UI ofrecía contratar puestos bloqueados.** Las reglas vivían solamente en el reductor; por ejemplo, el Representante requiere semana 2 y el curso de Organización de Veladas. En semana 1 se veía “Contratar”; al pulsarlo no se sumaba nadie y solo aparecía un toast. Eso explica por qué podía parecer que contratar al representante no funcionaba.
2. **El estado financiero podía parecer contradictorio.** Al inicio, la previsión semanal mostraba un saldo positivo por incluir el subsidio inicial; la pestaña Personal mostraba el flujo recurrente sin ese ingreso puntual, pero no explicaba la diferencia.
3. **Había contenido parcialmente recortado.** En 1280×720 el encabezado de Personal podía envolver una línea y ser comprimido por el canvas. La paginación excedía el límite inferior del canvas y quedaba parcialmente debajo del footer. A 1024×600 el paginador llegaba a sobreponerse al footer por unos píxeles. Las pruebas anteriores verificaban tarjetas/footer, pero no la caja completa del encabezado ni la paginación.
4. **El flujo de confirmación duplicaba acciones.** Mientras estaba abierta la confirmación de déficit, seguía apareciendo el CTA principal “Revisando costo”, una acción redundante junto a “Contratar igualmente” y “Cancelar”.

## Correcciones

- Los requisitos de semana, fama y curso se definen ahora junto a los datos de cada puesto (`PERSONAL_INFO`) y el reductor los consulta desde esa única fuente.
- La pestaña calcula los requisitos aún pendientes. Los puestos cerrados muestran el motivo y un botón deshabilitado “No disponible”; no simulan una contratación posible. Una vez desbloqueado, aparece el CTA normal.
- La proyección queda rotulada como **“Flujo recurrente (sin temporales)”** y conserva un detalle accesible que aclara que excluye ayuda inicial, eventos y patrocinios temporales. Así se distingue del balance semanal estimado/liquidado.
- El encabezado de Personal evita encogerse; en ventanas normales/de baja altura se compacta tipografía y separación. La descripción larga del puesto se mantiene íntegra como tooltip, con dos líneas de resumen en la tarjeta.
- La grilla conserva cuatro puestos por página cuando hay espacio suficiente y dos en el canvas compacto; la paginación tiene altura reducida donde hace falta y su margen no se suma dos veces.
- Al pedir una contratación que lleva el flujo recurrente a déficit, queda visible una sola decisión: **Contratar igualmente** o **Cancelar**. Tras confirmar, la tarjeta muestra el miembro, el estado Contratado y Despedir; despedir restaura el puesto disponible.

## Pruebas y evidencia

- `npm run verify`: PASS; TypeScript, build, presupuesto y auditoría estructural PASS; **67/67 tests**. Bundle dentro del presupuesto (JS 494.3/560 KiB, CSS 79.5/90 KiB). Vite mantiene su aviso informativo de chunk JS minificado >500 kB.
- `python scratch/test_box05_personal.py`: PASS. Veinte combinaciones de cinco viewports (1280×720, 1440×900, 1024×600, 1920×1080 y 970×900) por cuatro cantidades de personal (0, 1, 4, 9), además de flujos de bloqueo/contratación/despido.
- La prueba comprueba que las nueve ocupaciones aparezcan exactamente una vez al paginar, que el encabezado no tenga overflow, que las tarjetas no recorten contenido ni invadan el canvas, que la paginación termine antes del footer, que el documento no genere scroll global y que el footer permanezca visible.
- En una partida sintética de semana 1, se recorrieron las tres páginas: el Entrenador Automático queda disponible y los otros ocho puestos indican sus requisitos sin CTA de contratación habilitado. En otra partida sintética avanzada se contrató el Representante: confirmación de déficit → Contratar igualmente → estado visible de contratado → Despedir → vacante restaurada.
- Inspección visual adicional en 1280×720: encabezado compacto en una línea, cuatro tarjetas simétricas, estados bloqueados con CTA deshabilitado y paginación claramente separada del footer MadArt Studios.
- No se compró nada ni se mutó el guardado real. El servidor de `localhost:3000` sigue ejecutándose desde este workspace.

## Dictamen y límites

**Personal pasa el gate de layout, requisitos visibles y ciclo contratación/despido definido en esta fase.** Esto no certifica el balance de los salarios a largo plazo, el uso de todas las automatizaciones durante una carrera extensa ni el QA global del juego. La pestaña queda lista para tu revisión dentro del playtest posterior; la certificación global sigue abierta.
