# Auditoría final de canvas, economía y plan de cierre

Fecha: 23/09/2026  
Alcance: pantalla de inicio, shell principal, seis pestañas, teléfono, modales, mercado y balance semanal.

## Diagnóstico ejecutivo

La base del juego funciona, pero todavía no está lista para una etapa de arte final. El problema principal no es agregar más contenido: es separar información esencial de información ampliada y darle a cada pantalla un espacio visual estable.

La captura revisada muestra que el canvas de Ciudad queda cortado por abajo porque compite con navegación, siguiente paso, primeros pasos, previsión financiera y teléfono. El ranking mundial termina convertido en una franja sin filas legibles. La solución correcta es convertir Ranking Mundial en una ventana propia, como la ficha técnica, y reservar el canvas para mapa, inspector y acciones inmediatas.

## Hallazgos visuales

### Prioridad P0 — bloquea la lectura

| Área | Problema | Causa | Solución prevista |
|---|---|---|---|
| Shell principal | En la semana 1 hay cuatro bloques antes del canvas y la Ciudad se corta abajo. | El contenido auxiliar ocupa altura fija y el canvas no tiene un presupuesto visual explícito. | Crear un `WorkspaceFrame` con zonas: navegación, guía compacta, canvas. La guía debe poder plegarse; nunca debe competir con el canvas. |
| Ciudad | Ranking Mundial solo muestra encabezado y no permite consultar competidores. | Se intentó encajar una lista completa en la misma grilla del mapa. | Botón `Ver ranking mundial` que abre un modal amplio con filtros: todos, propios, rivales, amateur y profesional. |
| Mercado | Las tarjetas tienen alturas distintas; recomendación, descripción y botón quedan en posiciones diferentes o fuera de vista. | Texto libre + badges en el mismo encabezado y botón al final de un flujo variable. | Tarjeta de producto con slots fijos: nombre corto, precio, efecto, estado y acción. Descripción larga va a tooltip/modal de detalle. |
| Perfil | Cursos del Coach se cortan en la parte inferior. | Tres ramas con demasiadas filas dentro de un canvas fijo. | Mostrar ramas como tres botones/resúmenes; abrir cada rama en modal o panel de detalle. Mantener solo progreso y próxima compra en el canvas. |

### Prioridad P1 — deteriora la comprensión

| Área | Problema | Solución prevista |
|---|---|---|
| Mercado | “Bucal Moldeado”, “Cabezal Olímpico” y “Botas Antideslizantes” ocupan más de lo necesario. | Renombrar visualmente a `Bucal`, `Cabezal`, `Botas`, sin cambiar IDs ni reglas. |
| Mercado | “Recomendado ahora” puede saltar de posición. | Badge en una fila de estado fija, con altura reservada para todos los productos. |
| Mercado | Categorías de Equipamiento, Indumentaria e Instalaciones no tienen una densidad común. | Usar la misma tarjeta y la misma altura mínima; texto extendido en detalle secundario. |
| Ciudad | Mapa, inspector, ranking y scouting compiten por jerarquía. | Canvas primario: mapa + inspector. Acciones secundarias: botones que abren paneles de detalle. |
| Inicio | La pantalla requiere más altura de la disponible en navegadores con barras visibles. | Mantener un layout de inicio en dos zonas compactas y comprobarlo en 1024×768, 1280×720 y 1366×768. |
| Teléfono | En tamaños intermedios puede ocupar demasiado espacio vertical. | Dock móvil colapsado por defecto; apertura como panel temporal con cierre evidente. |

### Prioridad P2 — pulido

- Unificar padding, radios, tamaño de títulos y altura de botones en todas las tarjetas.
- Evitar textos en mayúsculas largas cuando no agregan información.
- Reservar siempre el mismo lugar para estado, precio y acción.
- Incorporar estados de “instalado”, “bloqueado”, “recomendado” y “sin fondos” con la misma estructura.
- Verificar contraste, foco de teclado, truncamiento y tooltips en cada acción.

## Auditoría económica

### Diferencia encontrada

La previsión del encabezado calcula:

```text
cuotas estimadas + aportes de boxeadores + patrocinio
− alquiler + sueldos
```

El cierre dominical calcula además:

```text
subsidio de apertura de la semana 1
+ eventos y comunitarios
+ sucursales
+ marca y patrocinio
− alquiler y sueldos
```

Por eso una partida nueva puede mostrar `Entradas seguras $54`, `Gastos previstos $150`, `En pérdida −$96`, y después cerrar con resultado positivo al incluir el subsidio de apertura. Las dos cifras no representan el mismo escenario.

### Corrección económica prevista

1. Crear una función única `proyectarBalanceSemanal` compartida por la previsión y el cierre.
2. Separar visualmente:
   - ingresos recurrentes confirmados;
   - ingresos extraordinarios probables;
   - gastos fijos;
   - compras opcionales no incluidas;
   - subsidios o ayudas de inicio.
3. En la semana 1 mostrar: `Ayuda de apertura +$240` y `Resultado estimado +$144` en vez de declarar pérdida.
4. En semanas normales mostrar el motivo exacto de cada gasto, no solo `Gastos previstos`.
5. El balance dominical debe reutilizar las mismas líneas de libro que la previsión para que el jugador pueda comparar estimado vs. real.
6. Agregar tests para partida nueva, partida con personal, partida con sucursal, compra de equipamiento y semana con velada.

## Plan de implementación por fases

### Fase 1 — sistema de layout y canvas

- Crear un marco de pantalla único con altura disponible, encabezado, navegación y canvas.
- Definir breakpoints de verificación: 1024×768, 1280×720, 1366×768 y 1440×900.
- El canvas nunca recibe contenido secundario que lo expanda o lo tape.
- Criterio de aceptación: ninguna pestaña tiene scroll de página, solapamiento o contenido funcional inaccesible.

### Fase 2 — modales y vistas ampliadas

- Crear modal de Ranking Mundial con tabla legible, filtros y ficha rápida del pugilista.
- Crear detalle de producto para mercado; la tarjeta principal queda corta y estable.
- Crear detalle de rama para cursos y bienes raíces.
- Criterio de aceptación: toda la información sigue disponible, pero la vista base no se corta.

### Fase 3 — mercado y vocabulario

- Aplicar nombres cortos: Bucal, Cabezal, Botas, Botiquín, Vestuarios, Proteínas y Sauna.
- Mantener nombres técnicos completos solo en descripción o detalle.
- Normalizar tarjetas con grid interno fijo y acciones alineadas.
- Criterio de aceptación: todos los botones Comprar/Instalado/Recomendado quedan alineados en cada categoría.

### Fase 4 — economía transparente

- Unificar proyección y cierre con un mismo libro de cálculo.
- Mostrar entrada, salida y motivo en lenguaje simple.
- Añadir advertencia antes de una compra si deja la caja por debajo del mínimo operativo.
- Criterio de aceptación: una partida nueva no puede presentar dos resultados aparentemente contradictorios sin explicar la diferencia.

### Fase 5 — auditoría funcional completa

- Recorrer inicio, gimnasio, ciudad, plantel, mercado, perfil, personal, teléfono, ficha, ranking, matchmaking, combate, balance y configuración.
- Probar navegación por mouse, teclado, botones de cerrar y estados sin datos.
- Comprobar guardado, carga, reinicio, importación y exportación.
- Criterio de aceptación: cada acción tiene una respuesta visible, una ruta de salida y un estado de error entendible.

### Fase 6 — validación visual para contenido final

- Solo después de cerrar las fases anteriores, preparar assets 2D/3D y animaciones.
- Validar que ningún asset fuerce alturas o cambie la alineación de las tarjetas.
- Criterio de aceptación: la estética puede cambiar sin romper el sistema de composición.

## Orden recomendado de trabajo

1. Fase 1 y Fase 2: resolver el espacio y sacar la información extensa del canvas.
2. Fase 3: estabilizar tarjetas, nombres y botones.
3. Fase 4: corregir proyección y balance.
4. Fase 5: recorrer todo el juego y añadir pruebas de regresión.
5. Fase 6: recién entonces producir assets finales.

## Estado de esta auditoría

- Auditoría realizada sin modificar reglas ni código de juego.
- La implementación queda deliberadamente pendiente de esta planificación.
- El siguiente bloque de trabajo debe ser Fase 1 + Fase 2, no una corrección aislada de una sola pestaña.
