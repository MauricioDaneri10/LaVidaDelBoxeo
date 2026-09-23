# Auditoría de alumnos, partidas y calendario competitivo

Fecha: 23/09/2026  
Propósito: revisar los nuevos criterios de producto antes de implementar cambios de código.

## Decisiones de producto confirmadas

- No habrá exportar/importar JSON en la interfaz de juego.
- El jugador verá `Nueva partida`, `Continuar partida`, `Guardar partida` y `Reiniciar partida`.
- `Continuar partida` mostrará nombre del coach, nombre del gimnasio, semana, dinero y fecha del último guardado.
- El inicio debe comenzar con un plantel pequeño y entendible: tres alumnos iniciales.
- El recorrido inicial debe enseñar en orden: preparación física → licencia del entrenador → licencia individual del boxeador → guanteos → competencia.
- Un guanteo es un entrenamiento especial: consume energía y tiempo, pero aporta más técnica, defensa y experiencia que un entrenamiento normal.
- Los alumnos, amateurs y profesionales pueden hacer guanteos.
- Las peleas oficiales no deben ocurrir automáticamente todos los sábados. La frecuencia base será quincenal o mensual según circuito, energía y disponibilidad.
- La frecuencia exacta debe quedar visible en el calendario y no depender de un texto escondido.
- Los assets visuales quedan fuera de alcance hasta la validación jugable del usuario.

## Estado encontrado en el código actual

### Partidas y persistencia

- `guardarPartida` guarda una única carrera bajo una clave local.
- La pantalla de configuración expone exportar/importar JSON.
- `CONTINUAR` continúa la carrera que ya está cargada, pero no existe selector de ranuras o listado de partidas.
- Existe un respaldo técnico local, pero no una experiencia de usuario de “partidas guardadas”.

### Alumnos y guanteos

- `crearEstadoBase` genera varios alumnos de inicio, por lo que debe revisarse contra el objetivo de tres.
- `diaSabado` aplica guanteos únicamente a elementos con `rol === "alumno"`.
- El avance actual mezcla “fogueo” y guanteo en una misma representación, sin explicar con suficiente claridad que el guanteo es entrenamiento especial.
- El aviso usa “prácticas de combate” y “guanteos de fogueo” para referirse a conceptos muy parecidos; hace falta una nomenclatura única.
- La licencia individual se habilita después de completar fogueo y tener licencia de entrenador, pero el flujo visual debe guiar el paso exacto.

### Peleas y calendario

- Las peleas pendientes se muestran como cartelera del sábado.
- El representante automático puede agendar una pelea cada sábado para un boxeador disponible.
- La regla actual no tiene una fecha próxima de competencia por atleta ni un período de recuperación configurable.
- El sistema ya distingue circuito amateur/profesional, pero la frecuencia de competencia no está conectada de forma explícita a ese circuito.

## Diseño funcional recomendado

### Plantel inicial

Comenzar con tres alumnos, cada uno con un perfil distinto:

1. Un alumno equilibrado, fácil de entender.
2. Un alumno con buena velocidad/técnica pero menor resistencia.
3. Un alumno con potencia/resistencia pero más lento para progresar.

No se deben generar alumnos adicionales automáticamente si el plantel está lleno. El boca a boca puede crear una lista de espera, pero no saturar el gimnasio ni agregar competidores sin decisión del jugador.

### Ruta de preparación

| Paso | Qué hace el jugador | Resultado visible |
|---|---|---|
| 1. Preparación física | Elige enfoque y entrena durante la semana | Suben atributos y baja energía |
| 2. Licencia del entrenador | Compra/obtiene la licencia desde Mi Perfil | Se habilita la federación de atletas |
| 3. Licencia del boxeador | Abre la ficha y emite licencia individual | El alumno pasa a boxeador amateur |
| 4. Guanteo | Participa en una práctica programada | Gana más técnica, defensa y experiencia |
| 5. Pelea oficial | Acepta una propuesta cuando está disponible | Cambia récord, bolsa, fama y ranking |

La interfaz debe mostrar solo el próximo paso principal, no cuatro instrucciones compitiendo con el canvas.

### Guanteo

Se recomienda separar los datos:

- `entrenamientosSemanales`: progreso de preparación física.
- `guanteosRealizados`: cantidad histórica de guanteos.
- `progresoLicencia`: progreso necesario para emitir la licencia.
- `proximaActividad`: fecha o semana del próximo guanteo.

Regla sugerida:

- Preparación física: ocurre una vez por semana y mejora atributos de forma gradual.
- Guanteo amateur: cada 1 o 2 semanas; mejora técnica, defensa, eficacia y experiencia con un costo de energía mayor.
- Guanteo profesional: cada 2 semanas como mínimo; puede aportar experiencia táctica y recuperación más exigente.
- El guanteo no debe aumentar el récord oficial.
- Una pelea oficial sí aumenta el récord, la bolsa, la fama y el ranking.

### Calendario de competencia

Cada boxeador debe tener:

- circuito: amateur o profesional;
- estado: disponible, recuperándose, con pelea pactada o lesionado si se incorpora esa regla;
- próxima fecha elegible;
- semanas de recuperación;
- fecha de última pelea;
- frecuencia base.

Frecuencia inicial sugerida:

- Amateur: posibilidad de competir cada 2 semanas.
- Profesional: posibilidad de competir cada 3 o 4 semanas.
- Título: bloqueo adicional de recuperación y requisitos.

El sábado puede seguir siendo el día de actividad competitiva, pero no todos los sábados deben generar una pelea para todos. El jugador debe ver `Próxima pelea disponible: semana X`.

## Auditorías necesarias para cerrar el juego

No hace falta repetir auditorías indefinidamente. Para llegar a una versión validable hacen falta cuatro auditorías técnicas coordinadas y una validación final del usuario:

### Auditoría 1 — reglas y progresión

Alumnos, preparación, licencias, guanteos, amateurs, profesionales, recuperación, títulos y ranking.

### Auditoría 2 — economía y calendario

Cuotas, bolsas, sponsors, eventos, costos, frecuencia de peleas, ingresos por circuito y consistencia entre previsión y balance.

### Auditoría 3 — interfaz y canvas

Todas las páginas, modales, textos, tarjetas, botones, tamaños y estados sin scroll ni recortes.

### Auditoría 4 — código, persistencia y regresión

Archivo por archivo, acciones del reducer, contratos de tipos, guardado, selector de partidas, reinicio, tests, build y consola.

### Validación 5 — partida jugada por el usuario

El usuario juega una partida nueva y una partida avanzada. Esta etapa no se puede reemplazar con tests automáticos. Los errores encontrados se corrigen y se repite solo la auditoría afectada.

## Criterio de finalización

El juego se considera listo para validación cuando:

- la interfaz no muestra JSON;
- se pueden crear, nombrar, guardar, continuar y reiniciar partidas;
- la partida nueva comienza con tres alumnos claros;
- preparación, licencia, guanteos y pelea tienen pasos distinguibles;
- alumnos, amateurs y profesionales tienen guanteos coherentes;
- las peleas respetan recuperación y frecuencia de circuito;
- el récord solo cambia por peleas oficiales;
- toda bolsa y todo gasto aparecen en el libro correcto;
- la previsión coincide con el cierre o explica la diferencia;
- no hay texto, acción o panel cortado;
- el usuario puede jugar el ciclo completo y confirmar que no encontró errores.

## Alcance excluido

Assets 2D, modelos 3D, personajes finales, texturas y animaciones no forman parte de estas cuatro auditorías. Se abordarán únicamente después de la validación jugable del usuario.
