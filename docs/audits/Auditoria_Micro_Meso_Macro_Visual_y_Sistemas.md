# Auditoría micro, meso y macro — La Vida del Boxeo

Fecha: 23/09/2026  ·  Alcance: interfaz, flujo de alumnos, economía operativa y herramientas de configuración.

## Resultado ejecutivo

La auditoría encontró problemas de tres escalas: detalles que impedían leer o cerrar una pantalla, flujos intermedios que no explicaban qué hacer con un alumno y reglas globales que permitían repetir búsquedas sin límite. Se corrigieron en código y se verificaron con pruebas, compilación y una pasada visual en el navegador.

## Microauditoría — componentes y estados puntuales

| Área | Hallazgo | Corrección |
|---|---|---|
| Ficha técnica | El contenido inferior podía quedar fuera del viewport, especialmente historial y acciones. | El modal pasó a tener encabezado fijo y un cuerpo interno con scroll, altura máxima adaptable y padding responsive. |
| Notificaciones | Los avisos se acumulaban y no tenían un ciclo de salida confiable. | Cada aviso se retira automáticamente después de 4,2 segundos, con entrada y salida animadas y cierre manual. |
| Atletas | Había botones de acción dentro de una tarjeta que también era un botón, una estructura conflictiva para teclado y accesibilidad. | Las tarjetas ahora son contenedores con rol interactivo y los botones internos funcionan por separado. |
| Gimnasio | La barra de estado y las estaciones competían por el mismo espacio vertical. | Se amplió la escena, se reservaron márgenes verticales y se mantuvo la barra inferior fuera del área de entrenamiento. |
| Atajos | La pantalla solo informaba combinaciones fijas; no permitía cambiarlas. | Se agregaron campos editables, guardado local, restauración de valores predeterminados y lectura inmediata por el manejador de teclado. |

## Mesoauditoría — pantallas y flujos

| Flujo | Problema de experiencia | Nuevo comportamiento |
|---|---|---|
| Ciudad → talento | “Buscar talentos” podía pulsarse indefinidamente y el texto decía que era gratis sin límite. | Un uso por semana; el botón se desactiva hasta el lunes siguiente y lo explica en lenguaje directo. |
| Plantel → espera | La espera no explicaba orden ni progreso. | Se muestra que es una cola por llegada y que allí no se entrenan ni avanzan las prácticas. |
| Plantel → liberar plaza | No había una acción clara para sacar a un atleta. | Alumnos: “Retirar de la lista”. Boxeadores: “Transferir”. La acción pide confirmación y deja un aviso claro. |
| Liberación de cupo | No quedaba claro qué pasaba después de retirar un alumno. | La cola se normaliza automáticamente y el primer alumno pasa a activo si existe una plaza libre. |
| Configuración | Los atajos estaban escondidos dentro de una lista estática. | Sección visible de edición con nombres amigables: Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil, Personal, Cerrar el día, Semana rápida y Cerrar ventanas. |

## Macroauditoría — reglas globales y sostenibilidad

### Capacidad y saturación de alumnos

- El buscador semanal ahora genera como máximo un candidato por semana.
- La lista de espera mantiene un límite de cuatro personas adicionales.
- Los alumnos en espera no entrenan, no consumen prácticas y no pueden tramitar licencia.
- La promoción desde la cola ocurre al liberar un cupo, respetando el orden de llegada.
- Retirar o transferir es una decisión explícita y reversible solo mediante una nueva incorporación; se evita borrar accidentalmente con confirmación.

### Licencias y competencia

- La Licencia de Entrenador pertenece al responsable del club.
- La licencia individual pertenece a cada atleta.
- Cada boxeador conserva su récord propio y solo puede competir al pasar por el flujo de habilitación.
- La ficha y los mensajes distinguen ambas licencias para evitar un callejón sin salida.

### Economía y legibilidad

- La vista principal mantiene la previsión de ingresos, gastos y resultado a favor/en pérdida.
- El uso semanal del buscador elimina una fuente de inflación de alumnos y cuotas.
- La cola y la capacidad son visibles en Gimnasio y Plantel, evitando que el crecimiento parezca infinito.
- Las reglas costosas o irreversibles se expresan con verbos concretos y confirmación.

## Validación realizada

- `npm run typecheck` — correcto.
- `npm test -- --run` — 14 pruebas correctas.
- `npm run build` — producción compilada correctamente.
- `node audit_engine.js` — 0 errores, 0 advertencias.
- Revisión visual en navegador: Gimnasio, Plantel, ficha técnica, Ciudad y Configuración.

## Próxima capa recomendada

La consolidación puede continuar con una prueba de recorrido completa (partida nueva → primer alumno → licencia de entrenador → prácticas → licencia individual → pelea), una matriz de tamaños de pantalla y un balance de economía por 10, 25 y 50 semanas. La auditoría actual deja preparados los controles necesarios para que esa fase no vuelva a saturar el plantel ni oculte acciones importantes.
