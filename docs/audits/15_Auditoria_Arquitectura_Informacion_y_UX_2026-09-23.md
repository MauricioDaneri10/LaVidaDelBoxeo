# Auditoría 3 — Arquitectura de información y UX

Fecha: 2026-09-23\
Estado: completada como auditoría de diagnóstico; implementación pendiente

## 1. Objetivo

Definir qué información debe aparecer en cada capa de la interfaz y qué acción espera el jugador en cada pantalla. El foco es eliminar redundancias, evitar que una pantalla se convierta en un resumen general y mantener una experiencia clara para una partida larga.

## 2. Jerarquía canónica de información

| Capa | Responsabilidad | Ejemplos válidos | Ejemplos que no deben repetirse |
|---|---|---|---|
| Encabezado global | Estado inmediato del club | Día, semana, caja, fama, seguidores | No repetir caja o seguidores como relleno |
| Agenda semanal | Qué ocurre hoy y qué viene | Preparación, guanteo, pelea, balance | No convertirla en un segundo panel financiero |
| Pestaña activa | Decisiones propias de esa sección | Pugilistas, equipamiento, cursos, personal | No mostrar un resumen general del club |
| Tarjeta | Una entidad y su acción | Comprar equipo, abrir ficha, contratar | No mezclar cinco decisiones en una tarjeta |
| Panel del Club | Novedades y decisiones contextuales | Mensajes, patrocinios, prensa, consejos | No copiar la caja, fama o seguidores |
| Modal | Detalle largo o gestión avanzada | Ficha técnica, ranking, préstamos, finanzas | No ser necesario para leer el estado básico |

## 3. Hallazgos por pantalla

### Gimnasio

**Rol correcto:** visión espacial del club y acceso rápido a las fichas.

**Hallazgos:** la pantalla cumple su rol y no contiene los bloques redundantes introducidos en otras pestañas. El estado vacío del Panel del Club es correcto, aunque puede aprovechar mejor el área con una recomendación contextual única.

**Criterio:** el gimnasio no debe convertirse en un tablero de finanzas. Sus indicadores inferiores deben limitarse a alumnos, federados y cinturones porque describen lo que se ve en la sala.

### Ciudad

**Rol correcto:** mapa de clubes, propiedades, ranking, salón de la fama y búsqueda de talentos.

**Hallazgos:** el ranking y la búsqueda están correctamente tratados como acciones de detalle. Finanzas sociales ya fue retirada de la ciudad en favor de Mi Perfil, pero debe conservarse una única entrada visible en el juego.

**Criterio:** el mapa muestra contexto territorial; los datos largos viven en modales paginados. No agregar caja, seguidores o nómina al pie del mapa.

### Plantel

**Rol correcto:** gestionar pugilistas, alumnos, recreativos, cupos, licencias y cartelera.

**Hallazgos:** el encabezado de la sección ya tiene los contadores útiles. La grilla es la que debe crecer visualmente. La guía para habilitar al primer boxeador es contextual y válida, pero no debe competir con la grilla ni repetir el encabezado global.

**Criterio:** ampliar tarjetas o cantidad de columnas según la altura real; mantener paginación para superar el espacio; abrir la ficha completa bajo demanda; reservar la sección de espera para cuando exista.

### Mercado

**Rol correcto:** comprar y gestionar equipamiento, indumentaria, instalaciones, salud y marca.

**Hallazgos:** la caja y el número de instalaciones ya están en la cabecera de Mercado y la caja también en el encabezado global. Los tres bloques finales agregados no aportan una decisión nueva.

**Criterio:** las tarjetas deben usar una plantilla fija: nombre corto, precio, descripción breve, beneficio y CTA. La recomendación puede quedar en la tarjeta marcada y no necesita otro resumen inferior.

### Mi Perfil

**Rol correcto:** progresión del coach, cursos, bienes raíces, legado y actividades sociales.

**Hallazgos:** cursos, ramas y bienes raíces pertenecen aquí. Las actividades sociales también tienen sentido aquí, pero deben usar un nombre canónico y diferenciarse de los eventos/propuestas del barrio. El bloque de seguidores y resultado histórico agregado al final es redundante o está fuera de contexto.

**Criterio:** mantener una estructura única de pestañas internas; una sola acción para abrir cursos de la rama; actividades sociales como modal de decisión; economía histórica en un módulo financiero propio, no como relleno.

### Personal

**Rol correcto:** contratar, despedir y entender el aporte del equipo.

**Hallazgos:** la cabecera ya muestra contratados y nómina semanal. El resumen inferior repite nómina y agrega estados genéricos (“Gestión automática”, “Próximo criterio”) que no son decisiones ni datos de una entidad.

**Criterio:** usar el espacio para una grilla de puestos con tarjetas de altura uniforme, paginación y estados bloqueados por requisitos. Si una métrica se necesita, debe estar junto al módulo de contratación y no repetida abajo.

### Calendario

**Rol correcto:** ver días, eventos, peleas, actividades y pendientes.

**Hallazgos:** el calendario semanal ya tiene cuatro indicadores contextuales: eventos activos, peleas, actividad social y próximo paso. Caja y seguidores no pertenecen al pie del calendario.

**Criterio:** utilizar el espacio adicional para ampliar las celdas, mostrar eventos agendados y estados de vencimiento. Cada evento debe abrir su detalle y acción sin abandonar la pantalla.

### Panel del Club

**Rol correcto:** bandeja de mensajes y decisiones que llegan desde afuera del club.

**Hallazgos:** los cuatro canales son adecuados. El problema aparece cuando están vacíos o cuando el contenido crece: el dock tiene altura fija y `overflow-hidden`, y puede ocultar tarjetas largas. El panel no debe ser utilizado como tablero duplicado.

**Criterio:** estado vacío breve, contador de pendientes, tarjetas paginadas y modal de detalle cuando el texto exceda el presupuesto. El contenido debe ser único: patrocinio, prensa, evento, consejo, préstamo activo o tarea pendiente.

## 4. Modelo de decisión UX

Cada elemento visible debe responder una de estas preguntas:

1. ¿Qué está pasando ahora?
2. ¿Qué puedo hacer en esta pantalla?
3. ¿Qué resultado tendrá la acción?
4. ¿Dónde veo el detalle si necesito más información?

Si un elemento no responde ninguna, debe eliminarse, moverse a otra pestaña o convertirse en tooltip/ayuda contextual.

## 5. Riesgos detectados

### UX-01 — Duplicación de estado global

La duplicación genera ruido, ocupa espacio que debería usar la grilla y puede producir inconsistencias si una vista calcula el valor de forma distinta.

### UX-02 — “Relleno” confundido con densidad

Agregar bloques inferiores no hace que una pantalla sea más completa si no agrega decisiones o entidades. La densidad correcta se logra con tarjetas más legibles, filas adicionales, paginación o contenido contextual.

### UX-03 — Altura fija del Panel del Club

Puede ocultar mensajes, recompensas o eventos largos. El sistema necesita una política explícita de truncamiento, paginación o modal.

### UX-04 — Acciones con nombre variable

Los botones que incluyen precio o frases largas generan anchos desiguales. La acción debe ser corta y el detalle económico debe mostrarse en la tarjeta.

### UX-05 — Crecimiento futuro

Más pugilistas, personal, eventos, cursos y traducciones harán crecer el contenido. Ninguna pantalla puede depender de que hoy haya pocos elementos.

## 6. Criterios de aceptación para la próxima implementación

- [ ] Ningún dato del encabezado se copia para llenar espacio.
- [ ] Cada pestaña tiene una responsabilidad única y visible.
- [ ] Plantel, Mercado y Personal usan el espacio para una grilla real de entidades.
- [ ] Mi Perfil conserva cursos, bienes, legado y actividades sin superposición.
- [ ] Calendario usa el espacio para agenda y detalle temporal.
- [ ] Panel del Club muestra contenido propio o estado vacío útil.
- [ ] Los botones tienen verbos breves y tamaño normalizado.
- [ ] El detalle largo se abre en modal o tooltip accesible.
- [ ] Una partida con más contenido no oculta información ni requiere scroll del canvas.

## 7. Dictamen

La arquitectura actual tiene buenas separaciones funcionales, pero la última solución visual violó la jerarquía de información al usar bloques redundantes como relleno. La corrección raíz debe ser de composición y propiedad de datos, no de agregar más indicadores.

La Auditoría 3 queda aprobada como diagnóstico y bloquea la implementación de nuevos resúmenes duplicados.
