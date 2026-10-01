# Auditoría 4 — Economía, progresión y simulación

Fecha: 2026-09-23\
Estado: diagnóstico completado; balance pendiente de implementación y playtest prolongado

## 1. Objetivo

Verificar que la economía sea entendible, que cada fuente y gasto esté conectada al balance real, que el progreso sea gradual y que una partida pueda recuperarse sin crear dinero infinito.

## 2. Flujo económico actual

### Ingresos

El motor contempla:

- cuotas de alumnos activos;
- cuotas de alumnos recreativos;
- aporte semanal del plantel federado;
- ayuda de apertura durante la primera semana;
- ingresos de sucursales con gerente y entrenador local;
- ventas de marca propia;
- patrocinio;
- actividades comunitarias;
- recaudación de veladas;
- bolsas y exhibiciones.

La proyección semanal y el balance dominical comparten la mayoría de las fuentes, lo cual es correcto, pero debe permanecer como una única función de reglas para evitar diferencias futuras.

### Gastos

El motor contempla:

- alquiler;
- sueldos;
- costo financiero por caja negativa;
- cuota de préstamo;
- inversiones de actividades;
- equipamiento, cursos, propiedades y licencias al momento de compra.

El balance dominical guarda `libroIngresos`, `libroGastos` y `resumen`, lo que permite explicar el resultado. El riesgo es que algunas acciones inmediatas escriben el libro y luego el cierre semanal lo reemplaza con el último balance, por lo que debe validarse qué historial ve el jugador después de varias operaciones.

## 3. Hallazgos económicos

### ECO-01 — La salida de caja negativa existe, pero no es suficientemente visible

El préstamo se ofrece desde el canal Don Anselmo cuando el dinero cae por debajo de $300. Esto puede pasar desapercibido porque:

- no aparece directamente en Mi Perfil;
- no aparece como acción principal en Calendario;
- depende de abrir el canal correcto del Panel del Club;
- la oferta de emergencia no tiene una pantalla de condiciones, riesgo y calendario de pago.

**Corrección requerida:** una alerta financiera contextual debe enlazar a una vista/modal de préstamo con monto recibido, total devuelto, cuota semanal, semanas restantes y penalización por caja negativa.

### ECO-02 — El préstamo puede crear una salida demasiado genérica

La regla actual entrega $500 y exige devolver $600 en diez cuotas, pero no considera reputación, historial, nivel del club o capacidad de pago. Como primera versión puede funcionar, pero debe tener un contrato claro y pruebas para impedir múltiples préstamos, cobros duplicados o cuotas negativas.

### ECO-03 — Seguidores se recalculan como objetivo absoluto

Cada domingo se asigna:

`200 + fama × 60 + victorias × 40 − derrotas × 20`

Esto no modela crecimiento gradual: reemplaza el valor anterior por un objetivo. Además, una entrevista puede sumar seguidores durante la semana y ese resultado puede ser reemplazado por el objetivo del domingo.

**Corrección requerida:** separar seguidores actuales, seguidores ganados, seguidores perdidos y objetivo de tendencia. Aplicar convergencia limitada por semana, con topes por evento y trazabilidad en el balance.

### ECO-04 — Fama y seguidores no tienen todavía una relación completamente explicable

La fama participa en seguidores y en ingresos de marca/sucursales, mientras que las recompensas de Don Anselmo y eventos también la modifican. Debe existir una tabla de fuentes de fama, límites por periodo y una explicación visible de cada variación.

### ECO-05 — Actividades sociales y propuestas del barrio deben permanecer separadas

El modelo ya diferencia `COMUNITARIOS` de `EVENTOS_CLUB_INFO`, pero existen referencias visuales antiguas en Ciudad y nombres heredados de “Finanzas Sociales”. Debe quedar definido:

- Actividades del Club: decisiones planificadas por el jugador, con inversión y liquidación dominical.
- Propuestas del Barrio: eventos externos con duración, vencimiento y opciones narrativas.
- Patrocinios: contratos con duración y pago semanal.
- Prensa: consecuencias de reputación y seguidores.

No deben compartir el mismo texto, el mismo botón ni el mismo ciclo de vida.

### ECO-06 — El crecimiento de alumnos debe respetar la intención de partida lenta

El motor limita el buscador de talentos a una vez por semana y separa recreativos, alumnos activos y lista de espera. Sin embargo, eventos, boca a boca y entrenadores locales también pueden sumar personas. Debe probarse una partida desde cero durante varias semanas para garantizar que el plantel no se sature demasiado rápido.

### ECO-07 — Los recreativos son un sistema útil, pero deben ser transparentes

Los recreativos no tienen ficha individual y suman cuotas, lo cual cumple el objetivo. Su variación depende de fama, asistente y derrotas. Debe aparecer como tendencia explicable en el balance, sin convertirlo en una segunda lista de boxeadores.

## 4. Casos de prueba obligatorios

### Caso A — Club solvente

1. Comenzar con caja positiva.
2. Comprar equipamiento.
3. Contratar un único empleado.
4. Avanzar una semana.
5. Verificar que proyección y balance coincidan en fuentes y gastos.

### Caso B — Caja negativa

1. Llegar a caja menor que cero.
2. Ver el aviso financiero.
3. Pedir un único préstamo.
4. Avanzar diez balances.
5. Verificar cuota, saldo, vencimiento y resultado final.
6. Confirmar que no se pueda pedir otro préstamo antes de cancelar el actual.

### Caso C — Crecimiento de seguidores

1. Registrar seguidores iniciales.
2. Ganar una pelea, perder una pelea y realizar una entrevista.
3. Avanzar varios balances.
4. Verificar variaciones graduales y explicadas.
5. Confirmar que un evento no sea borrado por el recalculo dominical.

### Caso D — Actividades y eventos

1. Agendar una actividad del club.
2. Intentar agendar una segunda en el mismo periodo.
3. Resolver una propuesta del barrio distinta.
4. Dejar vencer otra propuesta.
5. Verificar que cada efecto económico y de fama tenga una línea propia.

### Caso E — Plantel sostenible

1. Avanzar 12, 52 y 120 semanas con semilla fija.
2. Registrar activos, recreativos, espera, amateurs y profesionales.
3. Verificar límites 10/10 y capacidad total.
4. Retirar un alumno y comprobar promoción de la lista de espera.
5. Confirmar que las listas no creen boxeadores indefinidamente.

## 5. Criterios de aprobación

- [ ] Proyección y balance usan el mismo cálculo.
- [ ] Cada ingreso y gasto tiene concepto visible.
- [ ] Caja negativa muestra causa, consecuencia y salida.
- [ ] El préstamo tiene condiciones, una sola instancia y amortización verificable.
- [ ] Seguidores crecen o disminuyen gradualmente y conservan eventos aplicados.
- [ ] Fama, seguidores y dinero no se duplican por una misma recompensa.
- [ ] Actividades del Club y Propuestas del Barrio son sistemas diferentes.
- [ ] Recreativos suman ingresos sin generar fichas individuales.
- [ ] El plantel no se satura en 12, 52 ni 120 semanas.
- [ ] La economía no genera dinero infinito por repetir clics o cerrar semanas.

## 6. Dictamen

La economía tiene una base amplia y varios controles ya implementados, pero todavía requiere una revisión de trazabilidad y progresión. El principal riesgo no es la falta de fuentes: es que algunas fuentes se recalculen, se oculten o se sobrescriban de forma que el jugador no entienda el resultado.

La Auditoría 4 queda aprobada como diagnóstico y bloquea cualquier ajuste de balance hasta ejecutar los casos A–E.
