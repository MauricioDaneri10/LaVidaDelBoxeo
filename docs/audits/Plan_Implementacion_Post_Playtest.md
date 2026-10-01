# Plan de implementación posterior al playtest

Fecha: 23/09/2026  
Estado: plan previo a implementación.  
Regla: los assets 2D, 3D y animaciones siguen fuera del alcance.

## Orden de trabajo

### Fase 1 — tutorial y vocabulario

- Corregir los cuatro hitos iniciales.
- Usar `Guanteos 0/10` como condición real.
- Renombrar `Cerrar el día` a `Avanzar día`.
- Renombrar el cierre dominical a `Continuar`.
- Acortar acciones de eventos a `Aceptar`, `Rechazar`, `Organizar`.
- Unificar `Guanteo (sparring)`, `Preparación física`, `Pelea pactada` y `Descanso`.

### Fase 2 — calendario real

- Crear fecha absoluta con día, mes y año.
- Mostrar una semana completa con números de día.
- Registrar en el calendario entrenamiento, guanteo, pelea, recuperación, evento y balance.
- Permitir pactar una pelea en una fecha disponible.
- Mostrar próxima actividad en ficha y plantel.

### Fase 3 — layout responsive sin pantalla completa

- Crear un presupuesto de altura para ventana normal.
- Ciudad: mapa + inspector como vista principal.
- Ranking Mundial como modal.
- Scouting como modal o acción compacta.
- Mover actividades sociales a Mi Perfil/Agenda.
- Verificar ventana normal, pantalla completa y cinco resoluciones.

### Fase 4 — componentes visuales normalizados

- Botones de ancho natural cuando el texto es corto.
- Tarjetas de Personal con grid fijo y acciones alineadas abajo.
- Mercado con acciones alineadas.
- Teléfono con botones uniformes.
- Cursos con tabs compactos y detalle ampliado.
- Ficha técnica más grande, con columnas y barras idénticas.

### Fase 5 — ficha técnica y entrenador automático

- Rehacer bloque de enfoque semanal.
- Centrar asignación y descripciones.
- Mostrar Talento con barra normalizada.
- Corregir rasgos a nombres comprensibles y descripciones funcionales.
- Etiquetas de carrera por etapa.
- Director Técnico: descanso automático por energía/lesión y regreso al enfoque recomendado.

### Fase 6 — progresión lenta de alumnos

- Separar recreativos, talentos, amateur y profesionales.
- Frenar generación automática de competidores.
- Mantener tres alumnos iniciales.
- El scouting debe ser limitado y producir alumnos, no boxeadores instantáneos.
- El jugador decide cada licencia.
- Alumno no licenciado puede seguir entrenando y guanteando indefinidamente.

### Fase 7 — lesiones y recuperación

- Riesgo bajo en guanteo.
- Riesgo mayor en pelea.
- Lesión visible con gravedad, semanas, tratamiento y costo.
- Médico/kinesiología/descanso como acciones claras.
- Bloqueo de pelea por debajo del 70% o con lesión.
- Resultado de pelea conserva bolsa y récord aunque haya lesión.

### Fase 8 — economía gradual

- Contratación por niveles y requisitos.
- Advertencia de caja antes de contratar.
- Deuda con penalización gradual, nunca invisible.
- Préstamo limitado o sponsor de emergencia, solo si la economía base lo necesita.
- Previsión, libro y balance con la misma fuente.

### Fase 9 — Don Anselmo procedural

- Reemplazar misiones cobradas.
- Objetivos por etapa y dificultad.
- Fama inicial de 1–3 puntos.
- Recompensas mixtas: dinero, fama moderada, descuentos, oportunidades o desbloqueos.
- Evitar duplicados y saltos bruscos de fama.

### Fase 10 — agenda social y Salón de la Fama

- Mover bingo, torneo de mesa y festival a Mi Perfil/Agenda Social.
- Elegir actividad y agendar fecha.
- Uso semanal o quincenal según actividad.
- Integrar inversión, retorno y calendario.
- Crear Salón de la Fama separado del ranking activo.
- Retirar boxeadores por edad, trayectoria o estado de carrera sin borrar su historia.

### Fase 11 — compatibilidad y regresión

- Migrar partidas existentes sin perder progreso.
- Agregar campos nuevos con defaults seguros.
- No aplicar la regla de tres alumnos a partidas viejas.
- Probar doble clic, reload, guardado y carga.
- Probar años de juego, retiro, recreativos y campeones.

## Pruebas de aceptación

### Loop inicial

1. Nueva partida con tres alumnos.
2. Elegir enfoque.
3. Comprar equipamiento.
4. Avanzar días y ver guanteos.
5. Completar exactamente 10/10.
6. Emitir licencia individual.
7. Pactar fecha de pelea.
8. Ver calendario actualizado.

### Loop económico

1. Contratar un miembro.
2. Ver costo semanal.
3. Recibir cuota.
4. Organizar actividad social.
5. Ver inversión y retorno.
6. Cerrar semana.
7. Comparar previsión, libro y balance.

### Loop de carrera

1. Mantener un alumno sin licenciar.
2. Confirmar que sigue entrenando y guanteando.
3. Licenciar otro alumno.
4. Tener una pelea.
5. Ganar con lesión.
6. Recuperar al boxeador.
7. Ver récord y ranking.
8. Retirarlo y verlo en Salón de la Fama si corresponde.

### Loop visual

- 1024×768.
- 1280×720.
- 1366×768.
- 1440×900.
- 1920×1080.
- Ventana normal y pantalla completa.

No debe haber botones cortados, texto oculto, acciones inaccesibles ni necesidad de maximizar el navegador.

## Puerta antes de assets

Los assets no se consideran hasta que:

- las Fases 1–11 estén implementadas;
- typecheck, tests, build y auditoría estructural pasen;
- el usuario juegue una partida completa;
- el usuario confirme que no encontró errores funcionales ni de layout.

## Estado

Este documento es un plan de implementación. No autoriza por sí solo la generación de assets ni reemplaza el OK del usuario para comenzar cada bloque de código.
