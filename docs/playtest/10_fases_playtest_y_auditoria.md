# La Vida del Boxeo — Playtest, auditoría e implementación en 10 fases

Fecha de cierre: 23 de septiembre de 2026  
Alcance: juego completo actual, sin generación de assets 2D/3D ni animaciones nuevas.

## Resultado ejecutivo

Se ejecutó un ciclo autónomo de diez fases con este orden: jugar, observar, auditar, planificar, implementar y volver a validar. La compilación, el tipado, las pruebas del motor y una simulación prolongada quedaron en verde.

La corrección de mayor impacto fue limitar el crecimiento del plantel: la capacidad ahora cuenta alumnos, lista de espera y boxeadores federados. Se conserva un margen de cuatro plazas para oportunidades, pero el scouting, el boca a boca, las sucursales y los eventos no pueden generar un plantel infinito.

## Fase 1 — Línea base y mapa de riesgos

**Playtest.** Se recorrieron las pestañas Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil y Personal, además de avanzar semanas con Semana rápida y abrir el ranking.

**Auditoría.** Se detectaron tres familias de riesgo: contenido que excedía el viewport, listados largos que se cortaban y reglas de crecimiento que podían saturar la partida. También se verificó que las acciones de licencia del entrenador y del pugilista fueran independientes.

**Plan y solución.** Se priorizó conservar toda la información importante dentro de la pantalla, paginar lo que excede el espacio y cubrir reglas de economía/progresión con pruebas de motor.

**Validación.** El problema quedó convertido en una lista verificable por pestaña, modal, regla y flujo.

## Fase 2 — Primeros pasos y vocabulario

**Playtest.** El onboarding marcaba “completar prácticas” antes de que todos los alumnos tuvieran enfoque y el texto mezclaba prácticas, guanteos y licencia.

**Auditoría.** La condición usaba `some`, por lo que un solo alumno configurado podía completar visualmente el paso.

**Implementación.** El paso ahora exige que cada alumno activo tenga un enfoque. Se normalizó la secuencia visible: elegir enfoque para cada boxeador, equipar el gimnasio, completar 10 guanteos/sparring y habilitar al primer boxeador. Se actualizó el texto del Plantel a “10 guanteos (sparring)” y el atajo a “Avanzar día”.

**Validación.** La condición fue revisada en código y queda cubierta por la navegación visual del onboarding.

## Fase 3 — Mercado sin cortes

**Playtest.** Mercado mostraba más tarjetas que las que cabían en resoluciones bajas; el contenido inferior quedaba fuera de vista.

**Auditoría.** El problema no era únicamente de fuente: era exceso de elementos simultáneos.

**Implementación.** Se muestran cuatro artículos por página, con botones `Anterior`, indicador de página y `Más`. Al cambiar de categoría la página vuelve a la primera. Las tarjetas mantienen altura compacta y usan el título flotante para ampliar información.

**Validación.** En navegador a 1280×720 se observó la primera página completa, con controles de paginación visibles y sin depender de scroll.

## Fase 4 — Mi Perfil y Personal

**Playtest.** Cursos, ramas y la grilla de empleados quedaban cortados o dejaban grandes zonas vacías.

**Auditoría.** Había demasiadas tarjetas en una sola vista para el alto disponible.

**Implementación.** Mi Perfil presenta las ramas de forma compacta y abre el detalle mediante `Ver cursos`. Personal muestra cuatro puestos por página, con navegación consistente. Se normalizaron alturas y espaciados de tarjetas en modo compacto.

**Validación.** Ambas pestañas se vieron completas en el navegador, con botones alineados, sin segunda fila recortada y con acceso a la información restante.

## Fase 5 — Ciudad y ranking mundial

**Playtest.** La Ciudad tenía paneles inferiores cortados y el ranking de 20 competidores excedía la ventana.

**Auditoría.** El ranking no debía obligar a scroll dentro del juego.

**Implementación.** El ranking se convirtió en modal paginado: diez competidores por vista, dos columnas, rango global conservado y controles `Anterior`/`Más ranking`. La Ciudad conserva accesos compactos a ranking, salón de la fama, scouting y finanzas sociales.

**Validación.** El modal se observó dentro del viewport con los puestos 1 a 10 visibles, encabezado y paginación accesibles.

## Fase 6 — Economía y crecimiento prolongado

**Playtest.** La simulación anterior mostró que, con suficientes semanas, el plantel podía crecer hasta superar ampliamente una escala razonable.

**Auditoría.** El control miraba solamente alumnos; al convertirlos en boxeadores, el sistema volvía a aceptar incorporaciones indefinidamente.

**Implementación.** Se creó un límite común de plantel: capacidad del gimnasio + cuatro plazas de reserva. Se aplica a boca a boca, sucursales, bingo/eventos, recompensas de nuevos alumnos y scouting. El mensaje ahora explica que hay que liberar un cupo o mejorar el gimnasio.

**Validación.** Simulación de 120 semanas: terminó sin excepciones, sin deuda extrema ni crecimiento fuera de control; la partida base quedó en 10 integrantes, con 4 alumnos y sin saturación.

## Fase 7 — Licencias, records y progresión

**Playtest.** Se revisó el flujo de licencia del entrenador, los 10 guanteos y la licencia individual del pugilista.

**Auditoría.** Se comprobó que la licencia del coach no federara automáticamente a un atleta y que el record del pugilista naciera separado.

**Implementación/validación.** La prueba existente confirma: sin curso de entrenador no se puede licenciar; con 10 guanteos y fondos suficientes se emite la licencia individual, el rol pasa a boxeador y el record comienza en 0-0-0 con KO 0.

## Fase 8 — Guardado, partidas y atajos

**Playtest.** Se revisó la existencia de partidas con nombre, guardado en ranura, continuación y configuración de atajos.

**Auditoría.** No se incorporó una interfaz de exportación/importación JSON: la experiencia visible debe ser “guardar partida” y “continuar partida”. El reducer heredado aún conserva una acción interna de importación para compatibilidad, pero no se ofrece como botón al jugador.

**Implementación/validación.** Se mantuvieron ranuras con nombre y guardado automático, además de atajos configurables. La etiqueta del avance diario quedó alineada con la acción real: `Avanzar día`.

## Fase 9 — Regresión técnica y matriz visual

**Playtest.** Se volvió a abrir Gimnasio, Plantel, Mercado, Mi Perfil, Personal y Ciudad después de los cambios. Se comprobó también la ficha del pugilista y el ranking modal.

**Auditoría.** Se revisaron solapamientos, tarjetas fuera del viewport, navegación secundaria y textos truncados en el modo compacto.

**Validación automática.**

- `npm run typecheck`: OK.
- `npm test -- --run`: 16/16 pruebas OK.
- `npm run build`: OK.
- `node audit_engine.js`: 0 errores, 0 advertencias.
- Simulación de 120 semanas: OK.

## Fase 10 — Auditoría de cierre

**Playtest.** Se dejó el servidor local activo y el navegador abierto en el juego para la validación final manual.

**Auditoría.** No se encontraron errores de compilación, excepciones en la simulación, saturación automática del plantel ni cortes en las vistas validadas.

**Estado.** El juego está listo para una ronda de aceptación manual tuya. No se deben generar todavía assets 2D/3D: quedan deliberadamente fuera de este ciclo.

## ¿Hace falta continuar con este ciclo?

Sí, pero como control de calidad posterior a cada cambio importante, no como una fase bloqueante permanente. Antes de una publicación conviene repetir una pasada corta de: iniciar/continuar partida, avanzar cuatro semanas, emitir una licencia, abrir ficha, ranking, mercado, personal y balance, y revisar una ventana pequeña y una grande.

Los puntos que siguen requieren decisión de producto o prueba manual prolongada: equilibrio final de salarios/cuotas, frecuencia de peleas y lesiones, retiros/nuevas generaciones, negociación de bolsas, salón de la fama histórico, patrocinio/préstamos y futura cuenta online. No son fallas de layout detectadas en esta pasada.
